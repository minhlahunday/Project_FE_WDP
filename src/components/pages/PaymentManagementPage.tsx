import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Button, message, Space, Input, Tag } from 'antd';
import { SearchOutlined, CreditCardOutlined, FilePdfOutlined, HistoryOutlined } from '@ant-design/icons';
import { Order, orderService } from '../../services/orderService';
import { PaymentManagement } from './PaymentManagement';
import { BankProfileModal } from './BankProfileModal';
import DebtManagement from './DebtManagement';
import { mapOrderToContractPDF, generateContractPDF } from '../../utils/pdfUtils';

import { useAuth } from '../../contexts/AuthContext';
import PaymentHistoryModal from './PaymentHistoryModal';

const { Title } = Typography;

interface PaymentManagementPageProps {}

export const PaymentManagementPage: React.FC<PaymentManagementPageProps> = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankProfileModal, setShowBankProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [generatingContract, setGeneratingContract] = useState<string | null>(null);

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
        console.log('Full API response:', response);
        
        // Handle different response structures
        let ordersData: Order[] = [];
        if (response.data?.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data;
        } else if (Array.isArray(response.data)) {
          ordersData = response.data;
        }
        
        console.log('Orders fetched successfully:', ordersData.length, 'orders');
        console.log('Orders data:', ordersData);
        setOrders(ordersData);
      } else {
        console.error('Failed to fetch orders:', response.message);
        message.error('Lỗi khi tải danh sách đơn hàng: ' + response.message);
        setOrders([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      const errorMessage = (error as Error)?.message || 'Lỗi khi tải danh sách đơn hàng';
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

  const handleViewHistory = (order: Order) => {
    setSelectedOrder(order);
    setShowHistoryModal(true);
  };

  const handleGenerateContract = async (order: Order) => {
    setGeneratingContract(order._id);
    try {
      message.info('Đang tạo hợp đồng PDF...');
      
      // Map Order data từ backend → PDF format và generate trên FE
      const contractData = await mapOrderToContractPDF(order);
      await generateContractPDF(contractData);
      
      message.success('Hợp đồng đã được tạo và tải xuống thành công!');
    } catch (error: unknown) {
      console.error('Error generating contract:', error);
      const errorMessage = (error as Error)?.message || 'Lỗi khi tạo hợp đồng';
      message.error(errorMessage);
    } finally {
      setGeneratingContract(null);
    }
  };


  const handlePaymentSuccess = async (updatedOrder?: Order) => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    
    // Nếu có updatedOrder từ response, cập nhật ngay trong state
    if (updatedOrder) {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    }
    
    // Refresh orders list to get updated data (để đảm bảo sync với backend)
    // Đợi một chút để đảm bảo backend đã commit transaction
    setTimeout(() => {
      fetchOrders();
    }, 500);
    
    if (!updatedOrder) {
      message.success('Thanh toán được xử lý thành công!');
    }
  };

  const filteredOrders = orders.filter(order => {
    // Filter out deleted orders (is_deleted: true) - hiển thị với status cancelled
    const isDeleted = (order as unknown as Record<string, unknown>).is_deleted;
    if (isDeleted) {
      // Map is_deleted thành status cancelled để hiển thị
      (order as unknown as Record<string, unknown>).status = 'cancelled';
    }
    
    // For staff: API /yourself already filters by staff, so don't need dealership check
    // For manager: need to filter by dealership
    let belongsToUserDealership = true;
    if (user?.role === 'dealer_manager') {
      const userDealershipId = user?.dealership_id || user?.dealerId;
      belongsToUserDealership = order.dealership_id === userDealershipId;
    }
    // For staff: skip dealership check since /yourself API already filters
    
    // Then apply other filters
    const matchesSearch = !searchText || 
      order.code.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer?.full_name?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return belongsToUserDealership && matchesSearch && matchesStatus;
  });

  const getPaymentStatusTag = (order: Order) => {
    if (order.paid_amount === 0) {
      return (
        <Tag 
          style={{
            background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
          }}
        >
          Chưa thanh toán
        </Tag>
      );
    } else if (order.paid_amount < order.final_amount) {
      return (
        <Tag 
          style={{
            background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
          }}
        >
          Thanh toán một phần
        </Tag>
      );
    } else {
      return (
        <Tag 
          style={{
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
          }}
        >
          Đã thanh toán
        </Tag>
      );
    }
  };

  const getOrderStatusTag = (status: string) => {
    const statusMap = {
      pending: { 
        text: 'Chờ xác nhận', 
        color: 'warning',
        style: { 
          background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)'
        }
      },
      confirmed: { 
        text: 'Đã xác nhận', 
        color: 'blue',
        style: { 
          background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
        }
      },
      halfPayment: { 
        text: 'Đã đặt cọc', 
        color: 'orange',
        style: { 
          background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
        }
      },
      deposit_paid: { 
        text: 'Đã đặt cọc', 
        color: 'warning',
        style: { 
          background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
        }
      },
      fullyPayment: { 
        text: 'Đã thanh toán', 
        color: 'green',
        style: { 
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
        }
      },
      fully_paid: { 
        text: 'Đã thanh toán đủ', 
        color: 'success',
        style: { 
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
        }
      },
      waiting_vehicle_request: { 
        text: 'Chờ yêu cầu xe', 
        color: 'warning',
        style: { 
          background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)'
        }
      },
      vehicle_ready: { 
        text: 'Xe sẵn sàng', 
        color: 'cyan',
        style: { 
          background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)'
        }
      },
      delivered: { 
        text: 'Đã giao', 
        color: 'success',
        style: { 
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
        }
      },
      completed: { 
        text: 'Hoàn thành', 
        color: 'success',
        style: { 
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
        }
      },
      closed: { 
        text: 'Đã đóng', 
        color: 'default',
        style: { 
          background: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(140, 140, 140, 0.3)'
        }
      },
      cancelled: { 
        text: 'Đã hủy', 
        color: 'error',
        style: { 
          background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
        }
      },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap];
    if (statusInfo) {
      return (
        <Tag 
          style={statusInfo.style}
          className="status-tag"
        >
          {statusInfo.text}
        </Tag>
      );
    }
    return <Tag>{status}</Tag>;
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
      render: (_: unknown, record: Order) => {
        const orderRecord = record as unknown as Record<string, unknown>;
        const customerId = orderRecord.customer_id as Record<string, unknown> | undefined;
        const customer = orderRecord.customer as Record<string, unknown> | undefined;
        return customerId?.full_name || customer?.full_name || 'N/A';
      },
    },
    {
      title: 'Số điện thoại',
      key: 'customerPhone',
      render: (_: unknown, record: Order) => {
        const orderRecord = record as unknown as Record<string, unknown>;
        const customerId = orderRecord.customer_id as Record<string, unknown> | undefined;
        const customer = orderRecord.customer as Record<string, unknown> | undefined;
        return customerId?.phone || customer?.phone || 'N/A';
      },
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
      render: (_: unknown, record: Order) => {
        const remaining = record.final_amount - record.paid_amount;
        return `${remaining.toLocaleString('vi-VN')} VNĐ`;
      },
    },
    {
      title: 'Trạng thái thanh toán',
      key: 'paymentStatus',
      render: (_: unknown, record: Order) => getPaymentStatusTag(record),
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
      render: (_: unknown, record: Order) => (
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
          <Button
            type="default"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            Lịch sử
          </Button>
          <Button
            type="default"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => handleGenerateContract(record)}
            loading={generatingContract === record._id}
            disabled={record.status === 'cancelled'}
          >
            Xuất hợp đồng
          </Button>
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
                <option value="">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="halfPayment">Đã đặt cọc</option>
                <option value="deposit_paid">Đã đặt cọc</option>
                <option value="fullyPayment">Đã thanh toán</option>
                <option value="fully_paid">Đã thanh toán đủ</option>
                <option value="waiting_vehicle_request">Chờ yêu cầu xe</option>
                <option value="vehicle_ready">Xe sẵn sàng</option>
                <option value="delivered">Đã giao</option>
                <option value="completed">Hoàn thành</option>
                <option value="closed">Đã đóng</option>
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
                locale: {
                  items_per_page: ' / trang',
                },
              }}
            />
          </>
        ) : (
          <DebtManagement />
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

      {/* Payment History Modal */}
      {selectedOrder && (
        <PaymentHistoryModal
          visible={showHistoryModal}
          order={selectedOrder}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};