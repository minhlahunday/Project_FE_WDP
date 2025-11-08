import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Typography,
  Space,
  Table,
  Tag
} from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { Order } from '../../services/orderService';
import { paymentService, Payment } from '../../services/paymentService';
import { orderHistoryService } from '../../services/orderHistoryService';

const { Title, Text } = Typography;

interface PaymentHistoryModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
}

export default function PaymentHistoryModal({
  visible,
  order,
  onClose
}: PaymentHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [orderHistory, setOrderHistory] = useState<any>(null);

  // Load data
  const loadData = async () => {
    if (!order) return;

    setLoading(true);
    try {
      // Load payment history
      const paymentResponse = await paymentService.getPaymentsByOrder(order._id);
      if (paymentResponse.success) {
        setPaymentHistory(paymentResponse.data.data);
      }

      // Load order history timeline
      const historyResponse = await orderHistoryService.getOrderHistory(order._id);
      if (historyResponse.success) {
        setOrderHistory(historyResponse.data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && order) {
      loadData();
    }
  }, [visible, order]);

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
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      confirmed: {
        background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      halfPayment: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      deposit_paid: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      fullyPayment: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      fully_paid: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      waiting_vehicle_request: {
        background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      vehicle_ready: {
        background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      delivered: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      completed: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      closed: {
        background: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(140, 140, 140, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
      cancelled: {
        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)',
        fontSize: '12px',
        display: 'inline-block'
      },
    };
    return styleMap[status] || {
      background: '#f0f0f0',
      color: '#666',
      border: '1px solid #d9d9d9',
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      display: 'inline-block'
    };
  };

  // Format date safely
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleString('vi-VN');
    } catch (error) {
      return 'N/A';
    }
  };

  // Payment history columns
  const paymentColumns: ColumnsType<Payment> = [
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
        return <Tag color="blue">{methodMap[method as keyof typeof methodMap] || method}</Tag>;
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
      title={
        <Space>
          <HistoryOutlined />
          <span>Lịch sử thanh toán - {order.code}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      loading={loading}
    >
      <div className="space-y-4">
        {/* Order Summary */}
        <Card size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div className="flex justify-between">
              <Text strong>Tổng tiền:</Text>
              <Text strong className="text-blue-600">
                {formatCurrency(order.final_amount || 0)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text strong>Đã thanh toán:</Text>
              <Text strong className="text-green-600">
                {formatCurrency(order.paid_amount || 0)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text strong>Còn lại:</Text>
              <Text strong className="text-red-600">
                {formatCurrency((order.final_amount || 0) - (order.paid_amount || 0))}
              </Text>
            </div>
          </Space>
        </Card>

        {/* Order Status History Timeline */}
        {orderHistory && (
          <Card title="Lịch sử trạng thái đơn hàng" size="small">
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
                                  Trạng thái:{' '}
                                  <span style={getStatusTagStyle(item.status_change.from)}>
                                    {getStatusText(item.status_change.from)}
                                  </span>
                                  {' → '}
                                  <span style={getStatusTagStyle(item.status_change.to)}>
                                    {getStatusText(item.status_change.to)}
                                  </span>
                                </p>
                              )}
                              {item.delivery_status_change && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Giao hàng:{' '}
                                  <span style={getStatusTagStyle(item.delivery_status_change.from)}>
                                    {getStatusText(item.delivery_status_change.from)}
                                  </span>
                                  {' → '}
                                  <span style={getStatusTagStyle(item.delivery_status_change.to)}>
                                    {getStatusText(item.delivery_status_change.to)}
                                  </span>
                                </p>
                              )}
                              {item.current_status && (
                                <p className="text-sm font-semibold text-gray-800 mt-1">
                                  Trạng thái hiện tại:{' '}
                                  <span style={getStatusTagStyle(item.current_status)}>
                                    {getStatusText(item.current_status)}
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(item.timestamp)}
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Payment History Table */}
        <Card title="Lịch sử thanh toán chi tiết" size="small">
          <Table
            columns={paymentColumns}
            dataSource={paymentHistory}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        </Card>
      </div>
    </Modal>
  );
};

