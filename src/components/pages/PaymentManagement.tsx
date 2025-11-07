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
  Table,
  Radio
} from 'antd';
import {
  CheckCircleOutlined,
  FilePdfOutlined,
  DollarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { Order, orderService } from '../../services/orderService';
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
  onSuccess: (updatedOrder?: Order) => void;
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
  const [orderWithCustomer, setOrderWithCustomer] = useState<Order | null>(null);
  
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
  
  const isFirstPayment = paidAmount === 0;

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

  // Load order with customer info
  const loadOrderWithCustomer = async () => {
    if (!order) return;
    
    try {
      const response = await orderService.getOrderById(order._id);
      if (response.success) {
        const orderData = response.data.order || response.data;
        setOrderWithCustomer(orderData);
      }
    } catch (error) {
      console.error('Error loading order with customer:', error);
      setOrderWithCustomer(order); // Fallback to original order
    }
  };

  useEffect(() => {
    if (visible && order) {
      loadPaymentHistory();
      loadOrderHistory();
      loadOrderWithCustomer();
    } else {
      setOrderWithCustomer(null);
    }
  }, [visible, order]);

  // Auto-fill remaining amount when payment history changes or already has deposit
  useEffect(() => {
    // Nếu đã cọc rồi (không phải lần đầu) hoặc đã thanh toán nhiều lần, tự động điền số tiền còn lại
    if ((!isFirstPayment || paymentHistory.length >= 1) && remainingAmount > 0) {
      form.setFieldsValue({
        amount: remainingAmount
      });
    }
  }, [paymentHistory.length, remainingAmount, isFirstPayment]);

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
    
    // Guard: đặt cọc chỉ khi order.pending
    if (isFirstPayment && order.status !== 'pending') {
      message.error(`Không thể đặt cọc khi đơn hàng ở trạng thái "${order.status}". Yêu cầu trạng thái pending.`);
      return;
    }

    setLoading(true);
    try {
      let response;

      if (isFirstPayment) {
        // BƯỚC 1: Đặt cọc - Dùng API payDeposit (có logic check stock và auto request)
        response = await orderService.payDeposit(order._id, {
          deposit_amount: values.amount,
          payment_method: values.method,
          notes: values.notes
        });
      } else {
        // BƯỚC 2: Thanh toán cuối - Dùng API payFinal (tự động tính số tiền còn lại)
        response = await orderService.payFinal(order._id, {
          payment_method: values.method,
          notes: values.notes
        });
      }
      
      if (response.success) {
        if (isFirstPayment) {
          // Xử lý response từ payDeposit API
          const depositResponse = response as any;
          message.success('Tiền cọc đã được ghi nhận thành công!');
          
          // Hiển thị thông báo dựa vào có stock hay không
          if (depositResponse.data.has_stock) {
            message.info('Xe có sẵn trong kho. Đã giữ chỗ cho khách hàng.');
          } else {
            message.info('Xe hết hàng. Đã tạo yêu cầu nhập hàng từ hãng.');
          }
        } else {
          // Xử lý response từ payFinal API
          message.success('Thanh toán cuối đã được ghi nhận thành công!');
          
          // Check if fully paid to automatically generate contract
          if (response.data.order.status === 'fully_paid') {
            message.info('Đơn hàng đã được thanh toán đủ! Đang tạo hợp đồng...');
            
            // Automatically generate contract PDF on frontend
            try {
              const contractData = await mapOrderToContractPDF(response.data.order);
              await generateContractPDF(contractData);
              message.success('Hợp đồng đã được tạo và tải xuống thành công!');
            } catch (error) {
              console.error('Error generating contract:', error);
              message.warning('Thanh toán thành công nhưng không thể tạo hợp đồng. Vui lòng thử lại sau.');
            }
          }
        }
        
        // Reload payment history
        await loadPaymentHistory();
        
        // Pass updated order data to parent for immediate state update
        onSuccess(response.data.order);
        handleClose();
      } else {
        console.error('Payment failed:', response.message);
        message.error(response.message || 'Có lỗi xảy ra khi xử lý thanh toán');
      }
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Handle specific backend error messages
      let errorMessage = 'Có lỗi xảy ra khi xử lý thanh toán';
      let isStockError = false;
      
      if (error?.response?.data?.message) {
        const backendMessage = String(error.response.data.message || '');
        
        // Translate common backend messages to Vietnamese
        if (backendMessage.includes('Insufficient stock') || backendMessage.includes('hết hàng') || backendMessage.includes('không đủ')) {
          errorMessage = 'Xe hiện đang hết hàng trong kho. Hệ thống đang cố gắng tự động tạo yêu cầu nhập hàng từ hãng. Vui lòng kiểm tra lại đơn hàng sau vài giây.';
          isStockError = true;
        } else if (backendMessage.includes('chưa chọn màu') || backendMessage.toLowerCase().includes('color') ) {
          errorMessage = 'Đơn hàng chưa chọn màu xe cho sản phẩm. Vui lòng cập nhật màu xe trước khi đặt cọc.';
        } else if (backendMessage.includes('Đơn hàng không ở trạng thái pending')) {
          errorMessage = 'Chỉ đơn hàng ở trạng thái pending mới có thể đặt cọc.';
        } else if (backendMessage.includes('exceeds the final order total')) {
          errorMessage = 'Số tiền thanh toán vượt quá số tiền còn lại của đơn hàng';
        } else if (backendMessage.includes('already been fully paid')) {
          errorMessage = 'Đơn hàng này đã được thanh toán đủ rồi';
        } else {
          errorMessage = backendMessage;
        }
      }
      
      // Hiển thị thông báo phù hợp
      if (isStockError) {
        // Hiển thị thông báo chi tiết hơn với thông tin từ error
        const stockDetails = error?.response?.data?.message || '';
        message.warning({
          content: (
            <div>
              <div className="font-semibold mb-2">{errorMessage}</div>
              {stockDetails && (
                <div className="text-sm text-gray-600 mt-1">
                  Chi tiết: {stockDetails}
                </div>
              )}
              <div className="text-sm text-gray-500 mt-2">
                Đang kiểm tra lại trạng thái đơn hàng...
              </div>
            </div>
          ),
          duration: 6,
        });
        
        // Đợi một chút rồi reload order để kiểm tra xem backend có tạo OrderRequest không
        setTimeout(async () => {
          try {
            // Fetch lại order từ backend để xem status có thay đổi không
            const updatedOrderResponse = await orderService.getOrderById(order._id);
            if (updatedOrderResponse.success) {
              const updatedOrder = updatedOrderResponse.data.order || updatedOrderResponse.data;
              // Nếu order status đã thay đổi thành waiting_vehicle_request, có nghĩa là backend đã tạo OrderRequest
              // Sử dụng type assertion để truy cập order_request_id (có thể có trong response nhưng chưa có trong type)
              const orderRequestId = (updatedOrder as any).order_request_id;
              if (updatedOrder.status === 'waiting_vehicle_request' || orderRequestId) {
                message.success('Đã tạo yêu cầu nhập hàng thành công! Đơn hàng đang chờ hãng duyệt.');
                onSuccess(updatedOrder);
              } else {
                // Nếu vẫn pending, có thể backend chưa kịp xử lý hoặc có lỗi
                message.info('Vui lòng kiểm tra lại đơn hàng sau vài giây. Nếu vẫn lỗi, vui lòng liên hệ quản trị viên.');
                onSuccess();
              }
            } else {
              onSuccess();
            }
          } catch (reloadError) {
            console.error('Error reloading order:', reloadError);
            onSuccess();
          }
          handleClose();
        }, 3000); // Đợi 3 giây để backend có thời gian xử lý
      } else {
        message.error(errorMessage);
      }
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
      const contractData = await mapOrderToContractPDF(order);
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
              <Text strong>Khách hàng:</Text> {
                (orderWithCustomer?.customer?.full_name) ||
                (typeof order.customer_id === 'object' && order.customer_id?.full_name) ||
                order.customer?.full_name ||
                'N/A'
              }
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
            {isFirstPayment && (
              <Alert
                message="Quy định về tiền cọc"
                description={
                  <div>
                    
                    <div className="text-sm space-y-1 text-gray-700">
                      <p><strong>Đảm bảo cam kết:</strong> Khách hàng phải đặt cọc tối thiểu để thể hiện sự nghiêm túc trong giao dịch.</p>
                      <p><strong>Giữ hàng:</strong> Số tiền này đủ để giữ hàng trong kho và đảm bảo đơn hàng không bị hủy bởi khách hàng khác.</p>
                      <p><strong>Khởi động quy trình:</strong> Đủ để bắt đầu quy trình sản xuất, nhập hàng, hoặc chuẩn bị giao hàng.</p>
                    </div>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {!isFirstPayment && (
              <Alert
                message="Thanh toán tiếp theo"
                description={`Đơn hàng đã có cọc ban đầu. Bạn có thể thanh toán bất kỳ số tiền nào từ 1 VNĐ đến ${formatCurrency(remainingAmount)} (số tiền còn lại).`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
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
                label={
                  <div>
                    <span>Số tiền thanh toán</span>
                    {isFirstPayment ? (
                      <div className="text-xs text-gray-500 mt-1">
                        <strong>Bước 1 - Đặt cọc:</strong> Chọn phần trăm cọc từ tổng giá trị đơn hàng
                        <br />
                        <span className="text-blue-600">Hệ thống sẽ tự động tính số tiền tương ứng</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="text-orange-600"><strong>Bước 2 - Thanh toán cuối:</strong> Hệ thống tự động tính và thanh toán {formatCurrency(remainingAmount)} còn lại</span>
                        <br />
                      </div>
                    )}
                  </div>
                }
                name="depositPercent"
                rules={[
                  // Chỉ required cho lần cọc đầu tiên
                  ...(isFirstPayment ? [
                    { required: true, message: 'Vui lòng chọn phần trăm cọc' }
                  ] : [])
                ]}
              >
                {/* Lần 1: Chọn % cọc, Lần 2: Bắt buộc trả hết */}
                {isFirstPayment ? (
                  <Radio.Group
                    onChange={(e) => {
                      const percent = e.target.value;
                      const calculatedAmount = Math.round(totalAmount * (percent / 100));
                      form.setFieldsValue({
                        depositPercent: percent,
                        amount: calculatedAmount
                      });
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {[10, 15, 20, 25, 30].map((percent) => {
                        const calculatedAmount = Math.round(totalAmount * (percent / 100));
                        return (
                          <Radio key={percent} value={percent}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-semibold">{percent}%</span>
                              <span className="ml-4 text-green-600 font-medium">
                                {formatCurrency(calculatedAmount)}
                              </span>
                            </div>
                          </Radio>
                        );
                      })}
                    </Space>
                  </Radio.Group>
                ) : (
                  <div>
                    {/* <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: '#fff7e6',
                      border: '2px solid #faad14',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <DollarOutlined style={{ color: '#faad14', fontSize: '24px' }} />
                      <InputNumber
                        style={{ 
                          flex: 1,
                          backgroundColor: 'transparent',
                          border: 'none',
                          fontWeight: 'bold',
                          fontSize: '20px',
                          color: '#d46b08',
                          boxShadow: 'none'
                        }}
                        value={remainingAmount}
                        formatter={value => value !== undefined && value !== null ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                        parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                        readOnly
                        min={remainingAmount}
                        max={remainingAmount}
                        controls={false}
                      />
                    </div> */}
                    <div className="mt-2">
                      <Alert
                        message={
                          <span>
                            <Text strong style={{ color: '#fa8c16', fontSize: '16px' }}>
                              {formatCurrency(remainingAmount)}
                            </Text>
                            {/* <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>
                              sẽ được thanh toán tự động
                            </Text> */}
                          </span>
                        }
                        type="info"
                        showIcon
                        icon={<DollarOutlined style={{ color: '#1890ff' }} />}
                        style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}
                      />
                    </div>
                  </div>
                )}
              </Form.Item>

              {/* Hidden field để lưu số tiền đã tính từ % */}
              {isFirstPayment && (
                <Form.Item name="amount" hidden>
                  <InputNumber />
                </Form.Item>
              )}

              {/* Hiển thị số tiền đã chọn cho lần cọc đầu tiên */}
              {isFirstPayment && (
                <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.depositPercent !== currentValues.depositPercent}>
                  {({ getFieldValue }) => {
                    const selectedPercent = getFieldValue('depositPercent');
                    const calculatedAmount = getFieldValue('amount');
                    if (selectedPercent && calculatedAmount) {
                      return (
                        <Alert
                          message={`Số tiền cọc đã chọn: ${formatCurrency(calculatedAmount)} (${selectedPercent}% của ${formatCurrency(totalAmount)})`}
                          type="info"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      );
                    }
                    return null;
                  }}
                </Form.Item>
              )}

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
                            <div className="mt-2 text-xs bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                              <strong className="text-blue-800">Thông tin thanh toán:</strong>
                              <div className="mt-2 space-y-1">
                                {item.payment_info.amount && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Số tiền:</span>
                                    <span className="font-medium text-green-600">
                                      {formatCurrency(item.payment_info.amount)}
                                    </span>
                                  </div>
                                )}
                                {item.payment_info.method && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Phương thức:</span>
                                    <span className="font-medium">
                                      {item.payment_info.method === 'cash' ? 'Tiền mặt' :
                                       item.payment_info.method === 'bank' ? 'Chuyển khoản' :
                                       item.payment_info.method === 'card' ? 'Thẻ' :
                                       item.payment_info.method === 'qr' ? 'QR Code' :
                                       item.payment_info.method}
                                    </span>
                                  </div>
                                )}
                                {item.payment_info.reference && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Mã tham chiếu:</span>
                                    <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                                      {item.payment_info.reference}
                                    </span>
                                  </div>
                                )}
                              </div>
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