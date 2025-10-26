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

