import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../admin/AdminLayout';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Typography,
  Statistic,
  Row,
  Col,
  Tooltip,
  Descriptions,
  Divider,
  Select,
  Modal
} from 'antd';
import Swal from 'sweetalert2';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  TruckOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { requestVehicleService, VehicleRequest } from '../../../services/requestVehicleService';
import { get } from '../../../services/httpClient';

const { Title } = Typography;
const { TextArea } = Input;

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [deliveredNotes, setDeliveredNotes] = useState('');
  const [dealershipInfo, setDealershipInfo] = useState<any>(null);

  useEffect(() => {
    fetchRequests();
  }, [pagination.current, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await requestVehicleService.getVehicleRequests({
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter || undefined,
      });

      if (response.success) {
        setRequests(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
        }));
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Lỗi khi tải danh sách yêu cầu: ' + (error?.message || 'Unknown error'),
        confirmButtonText: 'Đóng'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: VehicleRequest) => {
    try {
      const result = await Swal.fire({
        title: 'Xác nhận duyệt yêu cầu',
        text: `Bạn có chắc chắn muốn duyệt yêu cầu ${request._id}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Duyệt',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#1890ff',
        cancelButtonColor: '#d33'
      });

      if (result.isConfirmed) {
        const response = await requestVehicleService.approveRequest(request._id);
        if (response.success) {
          // Đóng modal trước khi hiển thị SweetAlert
          setShowDetailModal(false);
          setSelectedRequest(null);
          setDealershipInfo(null);
          
          // Refresh data
          fetchRequests();
          
          // Hiển thị SweetAlert sau khi đóng modal
          await Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Yêu cầu đã được duyệt!',
            confirmButtonText: 'Đóng',
            timer: 2000,
            timerProgressBar: true
          });
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Lỗi khi duyệt yêu cầu: ' + (error?.message || 'Unknown error'),
        confirmButtonText: 'Đóng'
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const response = await requestVehicleService.rejectRequest(
        selectedRequest._id,
        rejectNotes
      );
      if (response.success) {
        // Đóng tất cả modal trước khi hiển thị SweetAlert
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectNotes('');
        setSelectedRequest(null);
        setDealershipInfo(null);
        
        // Refresh data
        fetchRequests();
        
        // Hiển thị SweetAlert sau khi đóng modal
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Yêu cầu đã bị từ chối!',
          confirmButtonText: 'Đóng',
          timer: 2000,
          timerProgressBar: true
        });
      }
    } catch (error: any) {
      // Đóng modal ngay cả khi có lỗi
      setShowRejectModal(false);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Lỗi khi từ chối yêu cầu: ' + (error?.message || 'Unknown error'),
        confirmButtonText: 'Đóng'
      });
    }
  };

  const handleInProgress = async (request: VehicleRequest) => {
    try {
      const result = await Swal.fire({
        title: 'Xác nhận chuyển trạng thái',
        text: `Chuyển yêu cầu ${request._id} sang "đang xử lý"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#1890ff',
        cancelButtonColor: '#d33'
      });

      if (result.isConfirmed) {
        const response = await requestVehicleService.inProgressRequest(request._id);
        if (response.success) {
          // Đóng modal trước khi hiển thị SweetAlert
          setShowDetailModal(false);
          setSelectedRequest(null);
          setDealershipInfo(null);
          
          // Refresh data
          fetchRequests();
          
          // Hiển thị SweetAlert sau khi đóng modal
          await Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Yêu cầu đã chuyển sang đang xử lý!',
            confirmButtonText: 'Đóng',
            timer: 2000,
            timerProgressBar: true
          });
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Lỗi khi cập nhật trạng thái: ' + (error?.message || 'Unknown error'),
        confirmButtonText: 'Đóng'
      });
    }
  };

  const handleDelivered = async () => {
    if (!selectedRequest) return;

    try {
      const response = await requestVehicleService.deliveredRequest(
        selectedRequest._id,
        deliveredNotes
      );
      if (response.success) {
        // Đóng tất cả modal trước khi hiển thị SweetAlert
        setShowDeliveredModal(false);
        setShowDetailModal(false);
        setDeliveredNotes('');
        setSelectedRequest(null);
        setDealershipInfo(null);
        
        // Refresh data
        fetchRequests();
        
        // Hiển thị SweetAlert sau khi đóng modal
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Yêu cầu đã được đánh dấu là đã giao hàng!',
          confirmButtonText: 'Đóng',
          timer: 2000,
          timerProgressBar: true
        });
      }
    } catch (error: any) {
      // Đóng modal ngay cả khi có lỗi
      setShowDeliveredModal(false);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Lỗi khi cập nhật trạng thái: ' + (error?.message || 'Unknown error'),
        confirmButtonText: 'Đóng'
      });
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string; icon: any } } = {
      pending: { color: 'orange', text: 'Đang chờ', icon: ClockCircleOutlined },
      approved: { color: 'blue', text: 'Đã duyệt', icon: CheckCircleOutlined },
      in_progress: { color: 'cyan', text: 'Đang xử lý', icon: TruckOutlined },
      delivered: { color: 'green', text: 'Đã giao', icon: CheckCircleOutlined },
      rejected: { color: 'red', text: 'Đã từ chối', icon: CloseCircleOutlined },
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: InfoCircleOutlined };
    const Icon = statusInfo.icon;

    return (
      <Tag color={statusInfo.color} icon={<Icon />}>
        {statusInfo.text}
      </Tag>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      // Nếu có full_address thì dùng
      if (address.full_address) return address.full_address;
      
      // Nếu không có thì ghép từ các thành phần
      const parts = [
        address.street,
        address.district, 
        address.city,
        address.province
      ].filter(part => part && part.trim() !== '');
      
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    
    return 'N/A';
  };

  const showRequestDetail = async (request: VehicleRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    
    // Fetch dealership info if dealership_id is a string
    if (request.dealership_id && typeof request.dealership_id === 'string') {
      try {
        const response: any = await get(`/api/dealerships/${request.dealership_id}`);
        // Handle both response structures: { success, data } or direct data
        const dealershipData = response?.success ? response.data : response;
        if (dealershipData) {
          setDealershipInfo(dealershipData);
        }
      } catch (error) {
        console.error('Error fetching dealership info:', error);
        setDealershipInfo(null);
      }
    } else {
      // If dealership_id is already an object, reset dealershipInfo
      setDealershipInfo(null);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Đại lý',
      key: 'dealership',
      render: (_: any, record: VehicleRequest) => {
        const dealer = typeof record.dealership_id === 'object' ? record.dealership_id : {};
        return (
          <div>
            <div className="font-medium">{dealer.company_name || dealer.name || 'N/A'}</div>
            {dealer.phone && <div className="text-xs text-gray-500">{dealer.phone}</div>}
            {dealer.address && (
              <div className="text-xs text-gray-400 truncate" style={{ maxWidth: '200px' }}>
                {formatAddress(dealer.address)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Thông tin xe',
      key: 'vehicle',
      render: (_: any, record: VehicleRequest) => {
        const vehicle = typeof record.vehicle_id === 'object' ? record.vehicle_id : {};
        return (
          <div>
            <div className="font-medium">{vehicle.name || vehicle.model || 'N/A'}</div>
            <div className="text-xs text-gray-500">
              SKU: {vehicle.sku || 'N/A'} | Màu: {record.color}
            </div>
            {vehicle.price && (
              <div className="text-xs text-green-600">
                {formatCurrency(vehicle.price)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center' as const,
      render: (quantity: number) => (
        <Tag color="blue">{quantity}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Thời gian',
      key: 'dates',
      width: 130,
      render: (_: any, record: VehicleRequest) => (
        <div className="text-xs">
          <div>Tạo: {new Date(record.createdAt).toLocaleDateString('vi-VN')}</div>
          {record.delivered_at && (
            <div className="text-green-600">
              Giao: {new Date(record.delivered_at).toLocaleDateString('vi-VN')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: VehicleRequest) => {
        return (
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => showRequestDetail(record)}
          >
            Xem chi tiết
          </Button>
        );
      },
    },
  ];

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const filteredRequests = requests.filter(request => {
    const dealer = typeof request.dealership_id === 'object' ? request.dealership_id : {};
    const vehicle = typeof request.vehicle_id === 'object' ? request.vehicle_id : {};
    const searchLower = searchText.toLowerCase();
    
    return (
      request._id.toLowerCase().includes(searchLower) ||
      dealer.company_name?.toLowerCase().includes(searchLower) ||
      dealer.name?.toLowerCase().includes(searchLower) ||
      vehicle.name?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <Title level={2}>Quản lý yêu cầu đặt xe</Title>

        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={4}>
            <Card>
              <Statistic
                title="Tổng số"
                value={stats.total}
                valueStyle={{ color: '#666' }}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đang chờ"
                value={stats.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đã duyệt"
                value={stats.approved}
                valueStyle={{ color: '#1890ff' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đang xử lý"
                value={stats.in_progress}
                valueStyle={{ color: '#13c2c2' }}
                prefix={<TruckOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đã giao"
                value={stats.delivered}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đã từ chối"
                value={stats.rejected}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Row gutter={16} align="middle">
            <Col>
              <Input
                placeholder="Tìm kiếm theo ID, đại lý, xe..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </Col>
            <Col>
              <Select
                placeholder="Chọn trạng thái"
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                style={{ width: 200 }}
                allowClear
              >
                <Select.Option value="pending">Đang chờ</Select.Option>
                <Select.Option value="approved">Đã duyệt</Select.Option>
                <Select.Option value="in_progress">Đang xử lý</Select.Option>
                <Select.Option value="delivered">Đã giao</Select.Option>
                <Select.Option value="rejected">Đã từ chối</Select.Option>
              </Select>
            </Col>
            <Col>
              {/* <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchRequests}
                loading={loading}
              >
                Làm mới
              </Button> */}
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Tag color="blue">Tổng: {filteredRequests.length} yêu cầu</Tag>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredRequests}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 1200 }}
            size="small"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} yêu cầu`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 10 }));
              },  
            }}
          />
        </Card>

        {/* Reject Modal */}
        <Modal
          title="Từ chối yêu cầu"
          open={showRejectModal}
          onOk={handleReject}
          onCancel={() => {
            setShowRejectModal(false);
            setRejectNotes('');
            setSelectedRequest(null);
          }}
          okText="Từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p>Lý do từ chối:</p>
          <TextArea
            rows={4}
            value={rejectNotes}
            onChange={e => setRejectNotes(e.target.value)}
            placeholder="Nhập lý do từ chối yêu cầu..."
          />
        </Modal>

        {/* Delivered Modal */}
        <Modal
          title="Đánh dấu đã giao hàng"
          open={showDeliveredModal}
          onOk={handleDelivered}
          onCancel={() => {
            setShowDeliveredModal(false);
            setDeliveredNotes('');
            setSelectedRequest(null);
          }}
          okText="Xác nhận giao hàng"
          cancelText="Hủy"
          width={600}
        >
          {selectedRequest && (
            <div className="mb-4">
              <Descriptions title="Thông tin yêu cầu" size="small" column={2}>
                <Descriptions.Item label="ID">{selectedRequest._id}</Descriptions.Item>
                <Descriptions.Item label="Số lượng">{selectedRequest.quantity}</Descriptions.Item>
                <Descriptions.Item label="Màu xe">{selectedRequest.color}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedRequest.status)}
                </Descriptions.Item>
              </Descriptions>
              <Divider />
            </div>
          )}
          <p>Ghi chú giao hàng:</p>
          <TextArea
            rows={4}
            value={deliveredNotes}
            onChange={e => setDeliveredNotes(e.target.value)}
            placeholder="Nhập thông tin giao hàng (tùy chọn)..."
          />
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center">
              <DollarOutlined className="text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Lưu ý: Việc xác nhận giao hàng sẽ tự động cập nhật kho hàng và tạo công nợ cho đại lý
              </span>
            </div>
          </div>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title="Chi tiết yêu cầu"
          open={showDetailModal}
          onCancel={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
            setDealershipInfo(null);
          }}
          footer={
            selectedRequest && (
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedRequest(null);
                    }}
                  >
                    Đóng
                  </Button>
                  
                  {selectedRequest.status === 'pending' && (
                    <>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                          setShowDetailModal(false); // Đóng modal chi tiết trước
                          // Delay nhỏ để tạo hiệu ứng mượt mà
                          setTimeout(() => {
                            setShowRejectModal(true); // Sau đó mở modal từ chối
                          }, 150);
                        }}
                      >
                        Từ chối
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprove(selectedRequest)}
                      >
                        Duyệt yêu cầu
                      </Button>
                    </>
                  )}
                  
                  {selectedRequest.status === 'approved' && (
                    <Button
                      type="primary"
                      icon={<TruckOutlined />}
                      onClick={() => handleInProgress(selectedRequest)}
                    >
                      Chuyển đang xử lý
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'in_progress' && (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => {
                        setShowDetailModal(false); // Đóng modal chi tiết trước
                        // Delay nhỏ để tạo hiệu ứng mượt mà
                        setTimeout(() => {
                          setShowDeliveredModal(true); // Sau đó mở modal đánh dấu đã giao
                        }, 150);
                      }}
                    >
                      Đánh dấu đã giao
                    </Button>
                  )}
                </Space>
              </div>
            )
          }
          width={800}
        >
          {selectedRequest && (
            <div>
              <Descriptions title="Thông tin cơ bản" bordered size="small" column={2}>
                <Descriptions.Item label="ID yêu cầu">{selectedRequest._id}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedRequest.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng">{selectedRequest.quantity}</Descriptions.Item>
                <Descriptions.Item label="Màu xe">{selectedRequest.color}</Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật cuối">
                  {new Date(selectedRequest.updatedAt).toLocaleString('vi-VN')}
                </Descriptions.Item>
                {selectedRequest.delivered_at && (
                  <Descriptions.Item label="Ngày giao hàng" span={2}>
                    {new Date(selectedRequest.delivered_at).toLocaleString('vi-VN')}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider />

              <Descriptions title="Thông tin đại lý" bordered size="small" column={2}>
                {(() => {
                  // Get dealership info - check if it's an object or use fetched info
                  const dealership = typeof selectedRequest.dealership_id === 'object' && selectedRequest.dealership_id
                    ? selectedRequest.dealership_id
                    : dealershipInfo;
                  
                  if (!dealership) return null;
                  
                  // Get contact info - check contact object first (from backend structure)
                  const phone = dealership.contact?.phone 
                    || dealership.phone 
                    || dealership.contact_phone 
                    || (dealership.user && dealership.user.phone) 
                    || 'N/A';
                  
                  const email = dealership.contact?.email 
                    || dealership.email 
                    || dealership.contact_email 
                    || (dealership.user && dealership.user.email) 
                    || 'N/A';
                  
                  return (
                    <>
                      <Descriptions.Item label="Tên công ty" span={2}>
                        {dealership.company_name || dealership.name || 'N/A'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ" span={2}>
                        {formatAddress(dealership.address)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Điện thoại">
                        {phone}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {email}
                      </Descriptions.Item>
                    </>
                  );
                })()}
              </Descriptions>

              <Divider />

              <Descriptions title="Thông tin xe" bordered size="small" column={2}>
                {typeof selectedRequest.vehicle_id === 'object' && selectedRequest.vehicle_id && (
                  <>
                    <Descriptions.Item label="Tên xe" span={2}>
                      {selectedRequest.vehicle_id.name || selectedRequest.vehicle_id.model || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="SKU">
                      {selectedRequest.vehicle_id.sku || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giá">
                      {selectedRequest.vehicle_id.price ? formatCurrency(selectedRequest.vehicle_id.price) : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thương hiệu">
                      {typeof selectedRequest.vehicle_id.manufacturer_id === 'object' && selectedRequest.vehicle_id.manufacturer_id
                        ? selectedRequest.vehicle_id.manufacturer_id.name || 'N/A'
                        : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>
                      {selectedRequest.vehicle_id.description || 'N/A'}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>

              {selectedRequest.notes && (
                <>
                  <Divider />
                  <Descriptions title="Ghi chú" bordered size="small">
                    <Descriptions.Item span={2}>
                      {selectedRequest.notes}
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default RequestManagement;

