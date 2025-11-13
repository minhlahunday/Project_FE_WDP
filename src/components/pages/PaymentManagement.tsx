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
  Tag
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
import Swal from 'sweetalert2';

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

  // Inject CSS for native select dropdown menu styling
  useEffect(() => {
    if (visible && isFirstPayment) {
      const styleId = 'deposit-percent-select-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Style cho native select dropdown menu */
          select[name="depositPercent"] {
            border-radius: 1rem !important;
            border: 2px solid #d1d5db !important;
          }
          
          /* Style cho dropdown menu khi mở - tạo cảm giác gắn kết */
          select[name="depositPercent"]:focus {
            border-radius: 1rem 1rem 0.5rem 0.5rem !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
          }
          
          /* Style cho option items - cải thiện padding và spacing */
          select[name="depositPercent"] option {
            padding: 14px 20px !important;
            background: white !important;
            color: #1f2937 !important;
            font-weight: 500 !important;
            font-size: 15px !important;
            line-height: 1.5 !important;
            border: none !important;
          }
          
          /* Hover và selected state cho options */
          select[name="depositPercent"] option:checked {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            font-weight: 600 !important;
          }
          
          /* Hover effect (chỉ hoạt động trên một số browser) */
          select[name="depositPercent"] option:hover {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
            color: #1e40af !important;
            font-weight: 600 !important;
          }
          
          /* Disabled option styling */
          select[name="depositPercent"] option:disabled {
            background: #f9fafb !important;
            color: #9ca3af !important;
            font-style: italic !important;
            font-weight: 400 !important;
          }
          
          /* Thử style cho dropdown menu container với webkit */
          select[name="depositPercent"]::-webkit-list-box {
            border-radius: 0.5rem !important;
            padding: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            border: 2px solid #e5e7eb !important;
          }
        `;
        document.head.appendChild(style);
      }
      
      return () => {
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [visible, isFirstPayment]);

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
      // Xử lý cả trường hợp dealership_id là object hoặc string
      const orderDealershipId = typeof order.dealership_id === 'object' && order.dealership_id !== null
        ? (order.dealership_id as any)?._id || (order.dealership_id as any)?.id
        : order.dealership_id;
      
      if (orderDealershipId !== userDealershipId) {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Bạn không có quyền thanh toán cho đơn hàng này. Đơn hàng thuộc về dealership khác.',
          confirmButtonText: 'Đóng',
          // Đảm bảo SweetAlert hiển thị trên modal
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '99999';
              if (swalContainer.parentElement !== document.body) {
                document.body.appendChild(swalContainer);
              }
            }
          }
        });
        console.error('Dealership mismatch:', {
          order_dealership_id: orderDealershipId,
          order_dealership_id_raw: order.dealership_id,
          user_dealership_id: userDealershipId
        });
        return;
      }
    }
    
    // Guard: đặt cọc chỉ khi order.pending
    if (isFirstPayment && order.status !== 'pending') {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: `Không thể đặt cọc khi đơn hàng ở trạng thái "${order.status}". Yêu cầu trạng thái pending.`,
        confirmButtonText: 'Đóng',
        // Đảm bảo SweetAlert hiển thị trên modal
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '99999';
            if (swalContainer.parentElement !== document.body) {
              document.body.appendChild(swalContainer);
            }
          }
        }
      });
      return;
    }

    // Guard: Thanh toán đủ chỉ khi order.vehicle_ready
    // Nếu xe có sẵn trong kho (deposit_paid) nhưng chưa mark vehicle ready, không được thanh toán đủ
    if (!isFirstPayment && order.status !== 'vehicle_ready') {
      if (order.status === 'deposit_paid') {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể thanh toán đủ. Xe có sẵn trong kho nhưng chưa được đánh dấu sẵn sàng. Vui lòng đánh dấu xe sẵn sàng trước khi thanh toán đủ.',
          confirmButtonText: 'Đóng',
          // Đảm bảo SweetAlert hiển thị trên modal
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '99999';
              if (swalContainer.parentElement !== document.body) {
                document.body.appendChild(swalContainer);
              }
            }
          }
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: `Không thể thanh toán đủ khi đơn hàng ở trạng thái "${order.status}". Yêu cầu trạng thái vehicle_ready.`,
          confirmButtonText: 'Đóng',
          // Đảm bảo SweetAlert hiển thị trên modal
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '99999';
              if (swalContainer.parentElement !== document.body) {
                document.body.appendChild(swalContainer);
              }
            }
          }
        });
      }
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
        // Yêu cầu: Order phải ở trạng thái vehicle_ready (phải mark vehicle ready thủ công trước)
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

  // Get status text in Vietnamese
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      halfPayment: 'Đã đặt cọc',
      deposit_paid: 'Đã đặt cọc',
      fullyPayment: 'Đã thanh toán',
      fully_paid: 'Đã thanh toán đủ',
      waiting_vehicle_request: 'Chờ yêu cầu xe',
      vehicle_ready: 'Xe sẵn sàng',
      delivered: 'Đã giao',
      completed: 'Hoàn thành',
      closed: 'Đã đóng',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  // Get status tag style with gradient background
  const getStatusTagStyle = (status: string) => {
    const styleMap: { [key: string]: React.CSSProperties } = {
      pending: {
        background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)'
      },
      confirmed: {
        background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
      },
      halfPayment: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
      },
      deposit_paid: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
      },
      fullyPayment: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      fully_paid: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      waiting_vehicle_request: {
        background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)'
      },
      vehicle_ready: {
        background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)'
      },
      delivered: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      completed: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      closed: {
        background: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(140, 140, 140, 0.3)'
      },
      cancelled: {
        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
      },
    };
    return styleMap[status] || {
      background: '#f0f0f0',
      color: '#666',
      border: '1px solid #d9d9d9',
      fontWeight: 500,
      padding: '4px 12px',
      borderRadius: '6px'
    };
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
        <Card 
          title={<span className="text-lg font-bold text-gray-800">Thông tin đơn hàng</span>} 
          size="small"
          className="shadow-lg border-2 border-gray-200 rounded-2xl mb-4"
          style={{
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
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
              <Text strong>Trạng thái:</Text>{' '}
              <Tag 
                style={getStatusTagStyle(order.status)}
              >
                {getStatusText(order.status)}
              </Tag>
            </Col>
          </Row>
        </Card>

        {/* Payment Progress */}
        <Card 
          // title={<span className="text-lg font-bold text-gray-800">Tiến độ thanh toán</span>} 
          // size="small"
          // className="shadow-lg border-2 border-gray-200 rounded-2xl mb-4"
          // style={{
          //   borderRadius: '1rem',
          //   boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          // }}
        >
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
          <Card 
            title={<span className="text-lg font-bold text-gray-800">Thêm thanh toán</span>} 
            size="small"
            className="shadow-lg border-2 border-gray-200 rounded-2xl"
            style={{
              borderRadius: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
          >
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
                    { required: true, message: 'Vui lòng chọn hoặc nhập phần trăm cọc' },
                    { 
                      type: 'number', 
                      min: 10, 
                      message: 'Phần trăm cọc tối thiểu là 10%' 
                    },
                    {
                      validator: (_: any, value: number) => {
                        if (value && value > 30) {
                          return Promise.reject(new Error('Phần trăm cọc không được vượt quá 30%'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ] : [])
                ]}
              >
                {/* Lần 1: Chọn % cọc (10, 15, 20, 25, 30%) hoặc nhập tùy chỉnh, Lần 2: Bắt buộc trả hết */}
                {isFirstPayment ? (
                  <div className="space-y-3">
                    {/* Select với các giá trị cố định */}
                    <div className="relative">
                      <select
                        name="depositPercentSelect"
                        className="w-full px-5 py-4 pr-14 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 bg-gradient-to-br from-white via-gray-50 to-white text-gray-900 font-semibold transition-all duration-300 hover:border-blue-500 hover:shadow-xl hover:scale-[1.01] appearance-none cursor-pointer text-base"
                        style={{
                          backgroundImage: 'none',
                          paddingRight: '3.5rem',
                          borderRadius: '1rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 1
                        }}
                        onChange={(e) => {
                          const percent = Number(e.target.value);
                          if (percent) {
                            const calculatedAmount = Math.round(totalAmount * (percent / 100));
                            form.setFieldsValue({
                              depositPercent: percent,
                              amount: calculatedAmount
                            });
                            // Clear custom input
                            form.setFieldValue('customPercent', undefined);
                          }
                        }}
                      >
                        <option value="" className="text-gray-400 font-normal py-2">
                          -- Chọn phần trăm cọc --
                        </option>
                        {[10, 15, 20, 25, 30].map((percent) => {
                          const calculatedAmount = Math.round(totalAmount * (percent / 100));
                          return (
                            <option key={percent} value={percent} className="py-3 font-medium text-gray-800">
                              {percent}% - {formatCurrency(calculatedAmount)}
                            </option>
                          );
                        })}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none z-10">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
                          <svg 
                            className="w-5 h-5 text-blue-600 transition-all duration-200" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Input để nhập % tùy chỉnh */}
                    <Form.Item name="customPercent" noStyle>
                      <InputNumber
                        placeholder="Hoặc nhập phần trăm cọc (10-30%)"
                        min={10}
                        max={30}
                        className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 bg-gradient-to-br from-white via-gray-50 to-white text-gray-900 font-semibold transition-all duration-300 hover:border-blue-500 hover:shadow-xl"
                        style={{
                          borderRadius: '1rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          width: '100%'
                        }}
                        onChange={(value) => {
                          if (value !== null && value !== undefined) {
                            const percent = Number(value);
                            
                            // Chỉ tự động điều chỉnh nếu < 10, nếu > 30 thì để nguyên để validation báo lỗi
                            if (percent < 10) {
                              form.setFieldValue('customPercent', 10);
                              const calculatedAmount = Math.round(totalAmount * (10 / 100));
                              form.setFieldsValue({
                                depositPercent: 10,
                                amount: calculatedAmount
                              });
                            } else if (percent > 30) {
                              // Không tự động set về 30, để validation báo lỗi
                              form.setFieldValue('customPercent', percent);
                              // Vẫn set depositPercent để validation có thể check
                              form.setFieldsValue({
                                depositPercent: percent,
                                amount: undefined // Không tính amount nếu vượt quá 30
                              });
                              // Clear select
                              const selectElement = document.querySelector('select[name="depositPercentSelect"]') as HTMLSelectElement;
                              if (selectElement) {
                                selectElement.value = '';
                              }
                            } else {
                              // Giá trị hợp lệ (10-30), giữ nguyên
                              const calculatedAmount = Math.round(totalAmount * (percent / 100));
                              form.setFieldsValue({
                                depositPercent: percent,
                                amount: calculatedAmount
                              });
                              // Clear select
                              const selectElement = document.querySelector('select[name="depositPercentSelect"]') as HTMLSelectElement;
                              if (selectElement) {
                                selectElement.value = '';
                              }
                            }
                          } else {
                            // Clear depositPercent if input is cleared
                            form.setFieldsValue({
                              depositPercent: undefined,
                              amount: undefined
                            });
                          }
                        }}
                        formatter={(value) => value !== null && value !== undefined ? `${value}%` : ''}
                        parser={(value) => {
                          if (!value) return 0;
                          const parsed = value.replace('%', '').trim();
                          const num = Number(parsed);
                          // Trả về giá trị đã parse, không return 0 nếu parse thành công
                          return isNaN(num) ? 0 : num;
                        }}
                        onBlur={(e) => {
                          // Khi blur, validate và tính toán lại nếu hợp lệ
                          const currentValue = form.getFieldValue('customPercent');
                          if (currentValue !== null && currentValue !== undefined) {
                            const percent = Number(currentValue);
                            if (percent >= 10 && percent <= 30) {
                              // Giữ nguyên giá trị và tính toán lại amount
                              const calculatedAmount = Math.round(totalAmount * (percent / 100));
                              form.setFieldsValue({
                                depositPercent: percent,
                                amount: calculatedAmount
                              });
                            } else if (percent > 30) {
                              // Nếu > 30, trigger validation để báo lỗi
                              form.validateFields(['depositPercent']);
                            }
                          }
                        }}
                      />
                    </Form.Item>
                  </div>
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
                label={<span className="text-base font-semibold text-gray-700">Phương thức thanh toán</span>}
                name="method"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
              >
                <div className="relative">
                  <select 
                    className="w-full px-5 py-4 pr-14 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 bg-gradient-to-br from-white via-gray-50 to-white text-gray-900 font-semibold transition-all duration-300 hover:border-blue-500 hover:shadow-xl hover:scale-[1.01] appearance-none cursor-pointer text-base"
                    style={{
                      backgroundImage: 'none',
                      paddingRight: '3.5rem',
                      borderRadius: '1rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                  <option value="">Chọn phương thức</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Chuyển khoản</option>
                  <option value="qr">QR Code</option>
                  <option value="card">Thẻ</option>
                </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                      <svg 
                        className="w-5 h-5 text-blue-600 transition-all duration-200" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Form.Item>

              <Form.Item
                label={<span className="text-base font-semibold text-gray-700">Ghi chú</span>}
                name="notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Nhập ghi chú (tùy chọn)"
                  className="rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                  style={{
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem'
                  }}
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

       

        {/* Payment History */}
        <Card 
          title={<span className="text-lg font-bold text-gray-800">Lịch sử thanh toán</span>}
          className="shadow-lg border-2 border-gray-200 rounded-2xl"
          style={{
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
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