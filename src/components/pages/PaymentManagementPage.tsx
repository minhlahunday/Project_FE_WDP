import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Button, message, Space, Input, Tag } from 'antd';
import { SearchOutlined, CreditCardOutlined } from '@ant-design/icons';
import { Order, orderService } from '../../services/orderService';
import { PaymentManagement } from './PaymentManagement';
import { BankProfileModal } from './BankProfileModal';
import { DebtTracking } from './DebtTracking';

import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

interface PaymentManagementPageProps {}

export const PaymentManagementPage: React.FC<PaymentManagementPageProps> = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankProfileModal, setShowBankProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user) {
      console.log('Current user info:', {
        id: user.id,
        email: user.email,
        role: user.role,
        dealership_id: user.dealership_id,
        dealerId: user.dealerId
      });
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching orders based on user role...', { role: user?.role });
      
      let response;
      if (user?.role === 'dealer_staff') {
        // Staff: chỉ lấy orders của chính mình
        console.log('Using /api/orders/yourself for staff');
        response = await orderService.getMyOrders({
          page: 1,
          limit: 100
        });
      } else if (user?.role === 'dealer_manager') {
        // Manager: lấy tất cả orders, sẽ filter theo dealership ở frontend
        console.log('Using /api/orders for manager');
        response = await orderService.getOrders({
          page: 1,
          limit: 100
        });
      } else {
        // Fallback: dùng yourself API
        console.log('Using /api/orders/yourself as fallback');
        response = await orderService.getMyOrders({
          page: 1,
          limit: 100
        });
      }
      
      if (response.success) {
        console.log('Orders fetched successfully:', response.data.data.length, 'orders');
        setOrders(response.data.data);
      } else {
        console.error('Failed to fetch orders:', response.message);
        message.error('Lỗi khi tải danh sách đơn hàng: ' + response.message);
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      const errorMessage = error?.response?.data?.message || error.message || 'Lỗi khi tải danh sách đơn hàng';
      message.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleBankProfile = (order: Order) => {
    setSelectedOrder(order);
    setShowBankProfileModal(true);
  };


  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    // Refresh orders list to get updated data
    fetchOrders();
    message.success('Thanh toán được xử lý thành công!');
  };

  const filteredOrders = orders.filter(order => {
    // First, check if order belongs to user's dealership
    const userDealershipId = user?.dealership_id || user?.dealerId;
    const belongsToUserDealership = order.dealership_id === userDealershipId;
    
    // Then apply other filters
    const matchesSearch = !searchText || 
      order.code.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer?.full_name?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return belongsToUserDealership && matchesSearch && matchesStatus;
  });

  const getPaymentStatusTag = (order: Order) => {
    if (order.paid_amount === 0) {
      return <Tag color="red">Chưa thanh toán</Tag>;
    } else if (order.paid_amount < order.final_amount) {
      return <Tag color="orange">Thanh toán một phần</Tag>;
    } else {
      return <Tag color="green">Đã thanh toán</Tag>;
    }
  };

  const getOrderStatusTag = (status: string) => {
    const statusMap = {
      pending: { text: 'Chờ xử lý', color: 'default' },
      confirmed: { text: 'Đã xác nhận', color: 'blue' },
      halfPayment: { text: 'Đã cọc', color: 'orange' },
      fullyPayment: { text: 'Đã thanh toán', color: 'green' },
      closed: { text: 'Hoàn tất', color: 'success' },
      cancelled: { text: 'Đã hủy', color: 'error' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return <Tag color={statusInfo?.color}>{statusInfo?.text || status}</Tag>;
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Khách hàng',
      key: 'customerName',
      render: (_: any, record: Order) => record.customer?.full_name || 'N/A',
    },
    {
      title: 'Số điện thoại',
      key: 'customerPhone',
      render: (_: any, record: Order) => record.customer?.phone || 'N/A',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'final_amount',
      key: 'final_amount',
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Còn lại',
      key: 'remaining',
      render: (_: any, record: Order) => {
        const remaining = record.final_amount - record.paid_amount;
        return `${remaining.toLocaleString('vi-VN')} VNĐ`;
      },
    },
    {
      title: 'Trạng thái thanh toán',
      key: 'paymentStatus',
      render: (_: any, record: Order) => getPaymentStatusTag(record),
    },
    {
      title: 'Trạng thái đơn hàng',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getOrderStatusTag(status),
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => method === 'cash' ? 'Tiền mặt' : 'Trả góp',
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CreditCardOutlined />}
            onClick={() => handleProcessPayment(record)}
            disabled={record.status === 'fullyPayment' || record.status === 'cancelled'}
          >
            Xử lý thanh toán
          </Button>
          {record.payment_method === 'installment' && (
            <Button
              type="default"
              size="small"
              onClick={() => handleBankProfile(record)}
            >
              Hồ sơ ngân hàng
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
           
      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Title level={2} className="!mb-0">Quản lý thanh toán</Title>
            <Space>
              <Button
                type={activeTab === 'payments' ? 'primary' : 'default'}
                onClick={() => setActiveTab('payments')}
              >
                Thanh toán
              </Button>
            <Button
              type={activeTab === 'debts' ? 'primary' : 'default'}
              onClick={() => setActiveTab('debts')}
            >
              Theo dõi công nợ
            </Button>
            <Button
              type="default"
              onClick={fetchOrders}
              loading={loading}
            >
              Làm mới
            </Button>
            </Space>
          </div>
          
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            
            <div className="relative">
              <select
                className="w-48 px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Lọc theo trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="halfPayment">Đã cọc</option>
                <option value="fullyPayment">Đã thanh toán</option>
                <option value="closed">Hoàn tất</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'payments' ? (
          <>
            
            
            <Table
              columns={columns}
              dataSource={filteredOrders}
              rowKey="_id"
              loading={loading}
              locale={{
                emptyText: loading ? 'Đang tải...' : 'Không có đơn hàng nào'
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} đơn hàng`,
              }}
            />
          </>
        ) : (
          <DebtTracking />
        )}
      </Card>

      {/* Payment Management Modal */}
      {selectedOrder && (
        <PaymentManagement
          order={selectedOrder}
          visible={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Bank Profile Modal */}
      {selectedOrder && (
        <BankProfileModal
          visible={showBankProfileModal}
          order={selectedOrder}
          onClose={() => {
            setShowBankProfileModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowBankProfileModal(false);
            setSelectedOrder(null);
            message.success('Hồ sơ ngân hàng đã được gửi thành công!');
          }}
        />
      )}
    </div>
  );
};