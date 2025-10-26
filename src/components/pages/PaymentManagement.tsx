import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Typography,
  Alert,
  Row,
  Col,
  Progress,
  message,
  Space,
  Table
} from 'antd';
import {
  CheckCircleOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { Order } from '../../services/orderService';
import { paymentService, Payment } from '../../services/paymentService';
import { orderHistoryService } from '../../services/orderHistoryService';
import { useAuth } from '../../contexts/AuthContext';
import { generateContractPDF, mapOrderToContractPDF } from '../../utils/pdfUtils';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PaymentManagementProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({
  visible,
  order,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any>(null);
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(false);
  
  // Update loadingOrderHistory when orderHistory changes
  useEffect(() => {
    if (orderHistory) {
      // Order history loaded successfully
    }
  }, [orderHistory]);

  const totalAmount = order?.final_amount || 0;
  const paidAmount = order?.paid_amount || 0;
  const remainingAmount = totalAmount - paidAmount;
  const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Load payment history
  const loadPaymentHistory = async () => {
    if (!order) return;
    
    setLoadingHistory(true);
    try {
      const response = await paymentService.getPaymentsByOrder(order._id);
      if (response.success) {
        setPaymentHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load order history
  const loadOrderHistory = async () => {
    if (!order) return;
    
    setLoadingOrderHistory(true);
    try {
      const response = await orderHistoryService.getOrderHistory(order._id);
      if (response.success) {
        setOrderHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading order history:', error);
    } finally {
      setLoadingOrderHistory(false);
    }
  };

  useEffect(() => {
    if (visible && order) {
      loadPaymentHistory();
      loadOrderHistory();
    }
  }, [visible, order]);

  // Auto-fill remaining amount when payment history changes
  useEffect(() => {
    if (paymentHistory.length >= 1 && remainingAmount > 0) {
      form.setFieldsValue({
        amount: remainingAmount
      });
    }
  }, [paymentHistory.length, remainingAmount]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (!order) return;

    // Check dealership permission
    if (user?.role === 'dealer_staff' || user?.role === 'dealer_manager') {
      const userDealershipId = user.dealership_id || user.dealerId;
      if (order.dealership_id !== userDealershipId) {
        message.error(`Bạn không có quyền thanh toán cho đơn hàng này. Đơn hàng thuộc về dealership khác.`);
        console.error('Dealership mismatch:', {
          order_dealership_id: order.dealership_id,
          user_dealership_id: userDealershipId
        });
        return;
      }
    }
    
    setLoading(true);
    try {
      // API call to create payment
      const response = await paymentService.createPayment({
        order_id: order._id,
        amount: values.amount,
        method: values.method,
        notes: values.notes
      });
      
      if (response.success) {
        message.success('Thanh toán đã được ghi nhận thành công!');
        
        // Check if fully paid to automatically generate contract
        if (response.data.order.status === 'fullyPayment') {
          message.info('Đơn hàng đã được thanh toán đủ! Đang tạo hợp đồng...');
          
          // Automatically generate contract PDF on frontend
          try {
            const contractData = mapOrderToContractPDF(response.data.order);
            await generateContractPDF(contractData);
            message.success('Hợp đồng đã được tạo và tải xuống thành công!');
          } catch (error) {
            console.error('Error generating contract:', error);
            message.warning('Thanh toán thành công nhưng không thể tạo hợp đồng. Vui lòng thử lại sau.');
          }
        }
        
        // Reload payment history
        await loadPaymentHistory();
        
        onSuccess();
        handleClose();
      } else {
        console.error('Payment failed:', response.message);
        message.error(response.message || 'Có lỗi xảy ra khi xử lý thanh toán');
      }
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi xử lý thanh toán';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  // Generate and download contract PDF
  const handleGenerateInvoice = async () => {
    if (!order) return;
    
    setGeneratingInvoice(true);
    try {
      message.info('Đang tạo hợp đồng PDF...');
      
      // Generate contract PDF on frontend
      const contractData = mapOrderToContractPDF(order);
      await generateContractPDF(contractData);
      message.success('Hợp đồng đã được tạo và tải xuống thành công!');
      
    } catch (error: any) {
      console.error('Error generating contract:', error);
      const errorMessage = error?.message || 'Lỗi khi tạo hợp đồng';
      message.error(errorMessage);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Payment history columns
  const historyColumns: ColumnsType<Payment> = [
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => {
        const methodMap = {
          cash: 'Tiền mặt',
          bank: 'Chuyển khoản',
          qr: 'QR Code',
          card: 'Thẻ'
        };
        return methodMap[method as keyof typeof methodMap] || method;
      },
    },
    {
      title: 'Mã tham chiếu',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  if (!order) return null;

  return (
    <Modal
      title={`Xử lý thanh toán - ${order.code}`}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
    >
      <div className="space-y-4">
        {/* Order Info */}
        <Card title="Thông tin đơn hàng" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Mã đơn hàng:</Text> {order.code}
            </Col>
            <Col span={12}>
              <Text strong>Khách hàng:</Text> {order.customer?.full_name || 'N/A'}
            </Col>
            <Col span={12}>
              <Text strong>Tổng tiền:</Text> {formatCurrency(totalAmount)}
            </Col>
            <Col span={12}>
              <Text strong>Đã thanh toán:</Text> {formatCurrency(paidAmount)}
            </Col>
            <Col span={12}>
              <Text strong>Còn lại:</Text> {formatCurrency(remainingAmount)}
            </Col>
            <Col span={12}>
              <Text strong>Trạng thái:</Text> {order.status}
            </Col>
          </Row>
        </Card>

        {/* Payment Progress */}
        <Card title="Tiến độ thanh toán" size="small">
          <div>
            <Title level={4}>Tiến độ thanh toán</Title>
            <Progress
              percent={paymentProgress}
              strokeColor={paymentProgress === 100 ? '#52c41a' : '#1890ff'}
              status={paymentProgress === 100 ? 'success' : 'active'}
            />
            <div className="text-center mt-2">
              <Text type="secondary">
                {paymentProgress}% đã thanh toán
              </Text>
            </div>
          </div>
        </Card>

        {/* Payment Form */}
        {paymentProgress < 100 && (
          <Card title="Thêm thanh toán" size="small">
            {paymentHistory.length >= 2 && (
              <Alert
                message="Đã thanh toán nhiều lần"
                description="Đơn hàng này đã có hơn 2 lần thanh toán. Chỉ được thanh toán nốt phần còn lại."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                label="Số tiền thanh toán"
                name="amount"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiền' },
                  { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' },
                  {
                    validator: (_, value) => {
                      if (value > remainingAmount) {
                        return Promise.reject(`Số tiền không được vượt quá ${formatCurrency(remainingAmount)}`);
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                {paymentHistory.length >= 1 ? (
                  <InputNumber
                    style={{ width: '100%', backgroundColor: '#f0f0f0', fontWeight: 'bold' }}
                    value={remainingAmount}
                    formatter={value => value !== undefined && value !== null ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                    readOnly
                  />
                ) : (
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => value !== undefined && value !== null ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                    parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                    placeholder="Nhập số tiền thanh toán"
                  />
                )}
              </Form.Item>

              <Form.Item
                label="Phương thức thanh toán"
                name="method"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
              >
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Chọn phương thức</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Chuyển khoản</option>
                  <option value="qr">QR Code</option>
                  <option value="card">Thẻ</option>
                </select>
              </Form.Item>

              <Form.Item
                label="Ghi chú"
                name="notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Nhập ghi chú (tùy chọn)"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Ghi nhận thanh toán
                  </Button>
                  <Button onClick={handleClose}>
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Payment Status */}
        {paymentProgress === 100 && (
          <Alert
            message="Đơn hàng đã được thanh toán đủ"
            description={
              <div>
                <p>Khách hàng đã thanh toán đủ số tiền cho đơn hàng này.</p>
                <p className="text-sm text-gray-600 mb-2">
                  Nhấn nút bên dưới để tạo và tải xuống hợp đồng PDF
                </p>
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  loading={generatingInvoice}
                  onClick={handleGenerateInvoice}
                  className="mt-2"
                  size="large"
                >
                  {generatingInvoice ? 'Đang tạo hợp đồng...' : 'Xuất hợp đồng PDF'}
                </Button>
              </div>
            }
            type="success"
            showIcon
          />
        )}

        {/* Order Status History Timeline */}
        {orderHistory && (
          <Card title="Lịch sử trạng thái đơn hàng" loading={loadingOrderHistory}>
            <div className="space-y-4">
              {orderHistory.timeline && orderHistory.timeline.length > 0 && (
                <div className="relative">
                  {orderHistory.timeline.map((item: any, index: number) => (
                    <div key={item.id || index} className={`flex gap-4 ${!item.is_current ? 'pb-6' : ''}`}>
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          item.is_current 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'bg-white border-gray-400'
                        }`} />
                        {index < orderHistory.timeline.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                        )}
                      </div>
                      
                      {/* Timeline content */}
                      <div className="flex-1 pb-4">
                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              {item.status_change && (
                                <p className="text-sm font-semibold text-gray-800">
                                  Trạng thái: <span className="text-red-600">{item.status_change.from}</span> → <span className="text-green-600">{item.status_change.to}</span>
                                </p>
                              )}
                              {item.delivery_status_change && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Giao hàng: {item.delivery_status_change.from} → {item.delivery_status_change.to}
                                </p>
                              )}
                              {item.current_status && (
                                <p className="text-sm font-semibold text-blue-600">
                                  Trạng thái hiện tại: {item.current_status}
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleString('vi-VN')}
                            </div>
                          </div>
                          
                          {item.changed_by && (
                            <p className="text-xs text-gray-500 mt-1">
                              Thay đổi bởi: {item.changed_by.full_name || item.changed_by.email || 'N/A'}
                            </p>
                          )}
                          
                          {item.reason && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Lý do:</strong> {item.reason}
                            </p>
                          )}
                          
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Ghi chú:</strong> {item.notes}
                            </p>
                          )}
                          
                          {item.payment_info && (
                            <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                              <strong>Thông tin thanh toán:</strong>
                              <pre className="mt-1 text-xs">{JSON.stringify(item.payment_info, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Payment History */}
        <Card title="Lịch sử thanh toán">
          <Table
            columns={historyColumns}
            dataSource={paymentHistory}
            rowKey="_id"
            loading={loadingHistory}
            pagination={false}
            size="small"
          />
        </Card>
      </div>
    </Modal>
  );
};