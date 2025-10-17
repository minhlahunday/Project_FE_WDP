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
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

// PaymentRecord interface is now imported from paymentService

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

  // Calculate payment info
  const totalAmount = order?.final_amount || 0;
  const paidAmount = order?.paid_amount || 0;
  const remainingAmount = totalAmount - paidAmount;
  const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Load payment history
  const loadPaymentHistory = async () => {
    if (!order) return;
    
    setLoadingHistory(true);
    try {
      console.log('Loading payment history for order:', order._id);
      const response = await paymentService.getPaymentsByOrder(order._id);
      if (response.success) {
        console.log('Payment history loaded:', response.data.data.length, 'payments');
        setPaymentHistory(response.data.data);
      } else {
        console.error('Failed to load payment history:', response.message);
        message.error('Lỗi khi tải lịch sử thanh toán: ' + response.message);
        setPaymentHistory([]);
      }
    } catch (error: any) {
      console.error('Error loading payment history:', error);
      const errorMessage = error?.response?.data?.message || error.message || 'Lỗi khi tải lịch sử thanh toán';
      message.error(errorMessage);
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (visible && order) {
      loadPaymentHistory();
    }
  }, [visible, order]);

  // Handle payment submission
  const handlePayment = async (values: any) => {
    if (!order) return;
    
    console.log('Payment attempt:', {
      order_id: order._id,
      order_dealership_id: order.dealership_id,
      user_id: user?.id,
      user_dealership_id: user?.dealership_id || user?.dealerId,
      user_role: user?.role,
      amount: values.amount,
      method: values.method
    });

    // Check permissions based on user role
    const userDealershipId = user?.dealership_id || user?.dealerId;
    
    if (user?.role === 'dealer_staff') {
      // Staff: chỉ có thể thanh toán đơn hàng của chính mình
      if (order.salesperson_id !== user?.id) {
        message.error(`Bạn chỉ có thể thanh toán cho đơn hàng do chính mình tạo.`);
        console.error('Salesperson mismatch:', {
          order_salesperson_id: order.salesperson_id,
          user_id: user?.id
        });
        return;
      }
    } else if (user?.role === 'dealer_manager') {
      // Manager: có thể thanh toán đơn hàng của dealership mình
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
        
        // Check if fully paid to show invoice option
        if (response.data.order.status === 'fullyPayment') {
          message.info('Đơn hàng đã được thanh toán đủ! Có thể xuất hóa đơn.');
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

  // Generate and download invoice
  const handleGenerateInvoice = async () => {
    if (!order) return;
    
    setGeneratingInvoice(true);
    try {
      const response = await paymentService.generateInvoice(order._id);
      if (response.success) {
        message.success('Hóa đơn đã được tạo thành công!');
        
        // Download the invoice
        const blob = await paymentService.downloadInvoice(order._id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HoaDon_${order.code}_${response.data.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        message.error(response.message || 'Lỗi khi tạo hóa đơn');
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      const errorMessage = error?.response?.data?.message || 'Lỗi khi tạo hóa đơn';
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

  // Get payment method text
  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      'cash': 'Tiền mặt',
      'bank_transfer': 'Chuyển khoản',
      'credit_card': 'Thẻ tín dụng',
      'installment': 'Trả góp'
    };
    return methods[method] || method;
  };

  // Payment history table columns
  const historyColumns: ColumnsType<Payment> = [
    {
      title: 'Ngày',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-medium text-green-600">
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => getPaymentMethodText(method)
    },
    {
      title: 'Mã tham chiếu',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref: string) => (
        <span className="font-mono text-sm">{ref}</span>
      )
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes'
    }
  ];

  // Quick amount buttons
  const getQuickAmounts = () => {
    const amounts = [];
    
    // 50% remaining
    if (remainingAmount > 0) {
      amounts.push({
        label: '50% còn lại',
        value: Math.round(remainingAmount * 0.5)
      });
    }
    
    // Full remaining
    if (remainingAmount > 0) {
      amounts.push({
        label: 'Thanh toán đủ',
        value: remainingAmount
      });
    }
    
    // Common amounts
    amounts.push(
      { label: '10 triệu', value: 10000000 },
      { label: '50 triệu', value: 50000000 },
      { label: '100 triệu', value: 100000000 }
    );
    
    return amounts;
  };

  if (!order) return null;

  return (
    <Modal
      title="Quản lý thanh toán"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <div className="space-y-6">
        {/* Payment Summary */}
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div>
                <Title level={4}>Thông tin thanh toán</Title>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text>Tổng tiền:</Text>
                    <Text strong className="text-lg">
                      {formatCurrency(totalAmount)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Đã thanh toán:</Text>
                    <Text className="text-green-600">
                      {formatCurrency(paidAmount)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text strong>Còn lại:</Text>
                    <Text strong className="text-red-600">
                      {formatCurrency(remainingAmount)}
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
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
            </Col>
          </Row>
        </Card>

        {/* Payment Form */}
        {remainingAmount > 0 && (
          <Card title="Thêm thanh toán mới">
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePayment}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="amount"
                    label="Số tiền thanh toán"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số tiền!' },
                      { 
                        type: 'number', 
                        min: 1000, 
                        message: 'Số tiền phải lớn hơn 1,000 VND!' 
                      },
                      {
                        type: 'number',
                        max: remainingAmount,
                        message: `Số tiền không được vượt quá ${formatCurrency(remainingAmount)}!`
                      }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                      placeholder="Nhập số tiền"
                      addonAfter="VND"
                    />
                  </Form.Item>

                  {/* Quick Amount Buttons */}
                  <div className="mb-4">
                    <Text type="secondary" className="block mb-2">Chọn nhanh:</Text>
                    <Space wrap>
                      {getQuickAmounts().map((quick, index) => (
                        <Button
                          key={index}
                          size="small"
                          onClick={() => form.setFieldsValue({ amount: quick.value })}
                        >
                          {quick.label}
                        </Button>
                      ))}
                    </Space>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="method"
                    label="Phương thức thanh toán"
                    rules={[{ required: true, message: 'Vui lòng chọn phương thức!' }]}
                  >
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
                      >
                        <option value="">Chọn phương thức thanh toán</option>
                        <option value="cash">💰 Tiền mặt</option>
                        <option value="bank">🏦 Chuyển khoản</option>
                        <option value="qr">📱 QR Code</option>
                        <option value="card">💳 Thẻ tín dụng</option>
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="notes"
                    label="Ghi chú"
                  >
                    <TextArea 
                      rows={3}
                      placeholder="Nhập ghi chú về khoản thanh toán này..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="text-right">
                <Space>
                  <Button onClick={handleClose}>
                    Hủy
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                  >
                    Xác nhận thanh toán
                  </Button>
                </Space>
              </div>
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
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  loading={generatingInvoice}
                  onClick={handleGenerateInvoice}
                  className="mt-2"
                >
                  Xuất hóa đơn PDF
                </Button>
              </div>
            }
            type="success"
            showIcon
          />
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
          
          {paymentHistory.length === 0 && !loadingHistory && (
            <div className="text-center text-gray-500 py-4">
              Chưa có lịch sử thanh toán
            </div>
          )}
        </Card>
      </div>
    </Modal>
  );
};

export default PaymentManagement;