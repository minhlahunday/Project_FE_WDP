import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Descriptions, 
  Table, 
  Tag, 
  Space, 
  message, 
  Spin,
  Alert,
  Row,
  Col,
  Typography,
  Button
} from 'antd';
import { 
  EditOutlined,
  FileTextOutlined,
  PrinterOutlined,
  CloseOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { orderService } from '../../services/orderService';
import { Order } from '../../types/index';
import QuoteToOrderConverter from './QuoteToOrderConverter';
import ContractGenerator from './ContractGenerator';
import ContractUpload from './ContractUpload';
import DepositPayment from './DepositPayment';
import ContractViewer from './ContractViewer';

const { Title } = Typography;

interface OrderDetailModalProps {
  visible: boolean;
  orderId: string | null;
  onClose: () => void;
  onEdit?: (order: Order) => void;
  onRefresh?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  visible,
  orderId,
  onClose,
  onEdit,
  onRefresh
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Workflow modal states
  const [contractGeneratorVisible, setContractGeneratorVisible] = useState(false);
  const [contractUploadVisible, setContractUploadVisible] = useState(false);
  const [depositPaymentVisible, setDepositPaymentVisible] = useState(false);
  const [contractViewerVisible, setContractViewerVisible] = useState(false);

  // Load order details
  const loadOrderDetail = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await orderService.getOrderById(orderId);
      
      if (response && response.success) {
        console.log('Order detail response:', response);
        
        // Backend response structure: { success: true, message: "...", data: { order: {...} } }
        // or: { success: true, message: "...", data: {...} }
        let orderData: Order | null = null;
        
        if (response.data) {
          const dataObj = response.data as any;
          if (dataObj.order) {
            orderData = dataObj.order as Order;
          } else if (dataObj._id && dataObj.code) {
            orderData = dataObj as Order;
          }
        }
        
        if (orderData) {
          // Handle populated fields from backend
          const processedOrder = {
            ...orderData,
            // Map customer_id (populated object) to customer
            customer: (orderData as any).customer_id && typeof (orderData as any).customer_id === 'object' 
              ? (orderData as any).customer_id 
              : (orderData as any).customer,
            // Map salesperson_id (populated object) to salesperson  
            salesperson: (orderData as any).salesperson_id && typeof (orderData as any).salesperson_id === 'object'
              ? (orderData as any).salesperson_id
              : (orderData as any).salesperson
          };
          
          console.log('Processed order data:', processedOrder);
          setOrder(processedOrder);
          message.success('Đã tải chi tiết đơn hàng');
        } else {
          throw new Error('No order data found in response');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error loading order detail:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      setError(errorMessage);
      message.error('Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && orderId) {
      loadOrderDetail();
    } else {
      setOrder(null);
      setError(null);
    }
  }, [visible, orderId]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusColors = {
      'pending': 'orange',
      'confirmed': 'blue',
      'halfPayment': 'cyan',
      'fullyPayment': 'green',
      'closed': 'purple',
      'cancelled': 'red'
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  // Status text mapping  
  const getStatusText = (status: string) => {
    const statusTexts = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'halfPayment': 'Đã đặt cọc',
      'fullyPayment': 'Đã thanh toán',
      'closed': 'Đã đóng',
      'cancelled': 'Đã hủy'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Table columns for order items
  const itemColumns = [
    {
      title: 'Sản phẩm',
      key: 'vehicle',
      render: (record: any) => (
        <div>
          <div className="font-medium">{record.vehicle_name}</div>
          {record.color && (
            <div className="text-gray-500 text-sm">Màu: {record.color}</div>
          )}
          {record.options && record.options.length > 0 && (
            <div className="text-blue-600 text-sm">
              Tùy chọn: {record.options.map((opt: any) => opt.name).join(', ')}
            </div>
          )}
          {record.accessories && record.accessories.length > 0 && (
            <div className="text-purple-600 text-sm">
              Phụ kiện: {record.accessories.map((acc: any) => `${acc.name} (x${acc.quantity})`).join(', ')}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
      render: (quantity: number) => (
        <span className="font-medium">{quantity}</span>
      )
    },
    {
      title: 'Giá gốc',
      dataIndex: 'vehicle_price',
      key: 'vehicle_price',
      align: 'right' as const,
      render: (price: number) => (
        <span>{formatCurrency(price)}</span>
      )
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discount',
      key: 'discount',
      align: 'right' as const,
      render: (discount: number) => (
        <span className="text-red-600">
          {discount > 0 ? `-${formatCurrency(discount)}` : '-'}
        </span>
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'final_amount',
      key: 'final_amount',
      align: 'right' as const,
      render: (amount: number) => (
        <span className="font-medium text-green-600">
          {formatCurrency(amount)}
        </span>
      )
    }
  ];

  const handleClose = () => {
    setOrder(null);
    setError(null);
    onClose();
  };

  // Workflow handlers
  const handleGenerateContract = () => {
    setContractGeneratorVisible(true);
  };

  const handleUploadContract = () => {
    console.log('🔍 Opening upload contract for order:', order?._id, order?.code);
    setContractUploadVisible(true);
  };

  const handleDepositPayment = () => {
    setDepositPaymentVisible(true);
  };

  const handleViewContract = () => {
    setContractViewerVisible(true);
  };

  const handleWorkflowSuccess = () => {
    // Refresh order data
    loadOrderDetail();
    // Refresh parent component
    onRefresh?.();
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <Title level={4} className="mb-0">
            Chi tiết đơn hàng {order?.code || orderId}
          </Title>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          />
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={1200}
      footer={[
        <Button key="close" onClick={handleClose}>
          Đóng
        </Button>,
        order && onEdit && (
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => onEdit(order)}>
            Chỉnh sửa
          </Button>
        ),
        // Workflow buttons based on order status
        order?.status === 'pending' && (
          <Button key="contract" icon={<FileTextOutlined />} onClick={handleGenerateContract}>
            Sinh hợp đồng
          </Button>
        ),
        order?.status === 'pending' && !order?.contract?.signed_contract_url && (
          <Button 
            key="upload" 
            icon={<FileTextOutlined />} 
            onClick={handleUploadContract}
            title={`Upload contract for order ${order?.code}`}
          >
            Upload hợp đồng
          </Button>
        ),
        order?.status === 'pending' && order?.contract?.signed_contract_url && (
          <Button key="deposit" icon={<DollarOutlined />} onClick={handleDepositPayment}>
            Đặt cọc
          </Button>
        ),
        <Button key="view-contract" icon={<FileTextOutlined />} onClick={handleViewContract}>
          Xem hợp đồng
        </Button>,
        <Button key="print" icon={<PrinterOutlined />}>
          In đơn hàng
        </Button>
      ]}
      className="order-detail-modal"
    >
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Alert
          message="Lỗi hệ thống"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadOrderDetail}>
              Thử lại
            </Button>
          }
          className="mb-4"
        />
      )}

      {order && !loading && (
        <div className="max-h-96 overflow-y-auto">
          <Row gutter={[24, 24]}>
            {/* Order Information */}
            <Col xs={24} lg={16}>
              <div className="mb-6">
                <Title level={5}>Thông tin đơn hàng</Title>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Mã đơn hàng">
                    <span className="font-mono text-blue-600">{order.code}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phương thức thanh toán">
                    <Tag color={order.payment_method === 'cash' ? 'gold' : 'blue'}>
                      {order.payment_method === 'cash' ? 'Tiền mặt' : 'Trả góp'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng tiền">
                    <span className="font-medium text-green-600">
                      {formatCurrency(order.final_amount)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Đã thanh toán">
                    <span className="font-medium">
                      {formatCurrency(order.paid_amount)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Còn lại">
                    <span className="font-medium text-orange-600">
                      {formatCurrency(order.final_amount - order.paid_amount)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo" span={2}>
                    {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Descriptions.Item>
                  {order.notes && (
                    <Descriptions.Item label="Ghi chú" span={2}>
                      {order.notes}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Hợp đồng đã ký">
                    <Tag color={order.contract?.signed_contract_url ? 'green' : 'red'}>
                      {order.contract?.signed_contract_url ? 'Đã ký' : 'Chưa ký'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Cập nhật lần cuối">
                    {dayjs(order.updatedAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Order Items */}
              <div>
                <Title level={5}>Sản phẩm trong đơn hàng</Title>
                <Table
                  columns={itemColumns}
                  dataSource={order.items}
                  rowKey={(record: any) => `${record?.vehicle_id || 'unknown'}-${record?.color || 'default'}-${record?.quantity || 1}`}
                  pagination={false}
                  size="small"
                  scroll={{ x: 600 }}
                  summary={(pageData) => {
                    const total = pageData.reduce((sum, item) => sum + item.final_amount, 0);
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                          <span className="font-bold">Tổng cộng:</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          <span className="font-bold text-green-600">
                            {formatCurrency(total)}
                          </span>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </div>
            </Col>

            {/* Customer Information */}
            <Col xs={24} lg={8}>
              <div className="mb-6">
                <Title level={5}>Thông tin khách hàng</Title>
                {order.customer ? (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Họ tên">
                      {order.customer.full_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {order.customer.email}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {order.customer.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">
                      {order.customer.address}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <p className="text-gray-500">Không có thông tin khách hàng</p>
                )}
              </div>

              {/* Salesperson Information */}
              <div className="mb-6">
                <Title level={5}>Nhân viên phụ trách</Title>
                {order.salesperson ? (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Họ tên">
                      {order.salesperson.full_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {order.salesperson.email}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <p className="text-gray-500">Chưa phân công nhân viên</p>
                )}
              </div>

              {/* Delivery Information */}
              {order.delivery && (
                <div>
                  <Title level={5}>Thông tin giao hàng</Title>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Trạng thái giao hàng">
                      <Tag color={
                        order.delivery.status === 'delivered' ? 'green' :
                        order.delivery.status === 'in_transit' ? 'blue' :
                        order.delivery.status === 'scheduled' ? 'orange' : 'default'
                      }>
                        {order.delivery.status === 'delivered' ? 'Đã giao' :
                         order.delivery.status === 'in_transit' ? 'Đang giao' :
                         order.delivery.status === 'scheduled' ? 'Đã lên lịch' : 
                         order.delivery.status}
                      </Tag>
                    </Descriptions.Item>
                    {order.delivery.scheduled_date && (
                      <Descriptions.Item label="Ngày dự kiến giao">
                        {dayjs(order.delivery.scheduled_date).format('DD/MM/YYYY HH:mm')}
                      </Descriptions.Item>
                    )}
                    {order.delivery.actual_date && (
                      <Descriptions.Item label="Ngày thực tế giao">
                        {dayjs(order.delivery.actual_date).format('DD/MM/YYYY HH:mm')}
                      </Descriptions.Item>
                    )}
                    {order.delivery.delivery_address && (
                      <Descriptions.Item label="Địa chỉ giao hàng">
                        {order.delivery.delivery_address.full_address || 
                         `${order.delivery.delivery_address.street}, ${order.delivery.delivery_address.ward}, ${order.delivery.delivery_address.district}, ${order.delivery.delivery_address.city}`}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              )}
            </Col>
          </Row>
        </div>
      )}

      {/* Workflow Modals */}
      <ContractGenerator
        visible={contractGeneratorVisible}
        order={order}
        onClose={() => setContractGeneratorVisible(false)}
        onSuccess={handleWorkflowSuccess}
      />

      <ContractUpload
        visible={contractUploadVisible}
        order={order}
        onClose={() => setContractUploadVisible(false)}
        onSuccess={handleWorkflowSuccess}
      />

      <DepositPayment
        visible={depositPaymentVisible}
        order={order}
        onClose={() => setDepositPaymentVisible(false)}
        onSuccess={handleWorkflowSuccess}
      />

      <ContractViewer
        visible={contractViewerVisible}
        order={order}
        onClose={() => setContractViewerVisible(false)}
        onRefresh={handleWorkflowSuccess}
      />
    </Modal>
  );
};

export default OrderDetailModal;
