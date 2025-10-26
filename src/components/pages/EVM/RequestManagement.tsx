import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../admin/AdminLayout';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Input,
  Typography,
  message,
  Statistic,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { requestVehicleService, VehicleRequest } from '../../../services/requestVehicleService';

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
  const [rejectNotes, setRejectNotes] = useState('');
  const [deliveredNotes, setDeliveredNotes] = useState('');

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
      message.error('Lỗi khi tải danh sách yêu cầu: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: VehicleRequest) => {
    try {
      Modal.confirm({
        title: 'Xác nhận duyệt yêu cầu',
        content: `Bạn có chắc chắn muốn duyệt yêu cầu ${request._id}?`,
        okText: 'Duyệt',
        cancelText: 'Hủy',
        onOk: async () => {
          const response = await requestVehicleService.approveRequest(request._id);
          if (response.success) {
            message.success('Yêu cầu đã được duyệt!');
            fetchRequests();
          }
        },
      });
    } catch (error: any) {
      message.error('Lỗi khi duyệt yêu cầu: ' + (error?.message || 'Unknown error'));
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
        message.success('Yêu cầu đã bị từ chối!');
        setShowRejectModal(false);
        setRejectNotes('');
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (error: any) {
      message.error('Lỗi khi từ chối yêu cầu: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleInProgress = async (request: VehicleRequest) => {
    try {
      Modal.confirm({
        title: 'Xác nhận chuyển trạng thái',
        content: `Chuyển yêu cầu ${request._id} sang "đang xử lý"?`,
        okText: 'Xác nhận',
        cancelText: 'Hủy',
        onOk: async () => {
          const response = await requestVehicleService.inProgressRequest(request._id);
          if (response.success) {
            message.success('Yêu cầu đã chuyển sang đang xử lý!');
            fetchRequests();
          }
        },
      });
    } catch (error: any) {
      message.error('Lỗi khi cập nhật trạng thái: ' + (error?.message || 'Unknown error'));
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
        message.success('Yêu cầu đã được đánh dấu là đã giao hàng!');
        setShowDeliveredModal(false);
        setDeliveredNotes('');
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (error: any) {
      message.error('Lỗi khi cập nhật trạng thái: ' + (error?.message || 'Unknown error'));
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: { [key: string]: { color: string; text: string; icon: any } } = {
      pending: { color: 'orange', text: 'Đang chờ', icon: ClockCircleOutlined },
      approved: { color: 'blue', text: 'Đã duyệt', icon: CheckCircleOutlined },
      in_progress: { color: 'cyan', text: 'Đang xử lý', icon: CarOutlined },
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

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => (
        <Tooltip title={id}>
          <span className="font-mono text-xs">{id.substring(0, 12)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Đại lý',
      key: 'dealership',
      render: (_: any, record: VehicleRequest) => {
        const dealer = typeof record.dealership_id === 'object' ? record.dealership_id : {};
        return dealer.company_name || dealer.name || 'N/A';
      },
    },
    {
      title: 'Xe',
      key: 'vehicle',
      render: (_: any, record: VehicleRequest) => {
        const vehicle = typeof record.vehicle_id === 'object' ? record.vehicle_id : {};
        return `${vehicle.name || vehicle.model || 'N/A'}`;
      },
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Màu',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <Tag color={color === 'đỏ' ? 'red' : color === 'xanh' ? 'blue' : 'default'}>
          {color}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'requested_at',
      key: 'requested_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: VehicleRequest) => {
        return (
          <Space>
            {record.status === 'pending' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApprove(record)}
                >
                  Duyệt
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setSelectedRequest(record);
                    setShowRejectModal(true);
                  }}
                >
                  Từ chối
                </Button>
              </>
            )}
            {record.status === 'approved' && (
              <Button
                icon={<CarOutlined />}
                onClick={() => handleInProgress(record)}
              >
                Đang xử lý
              </Button>
            )}
            {record.status === 'in_progress' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  setShowDeliveredModal(true);
                }}
              >
                Đã giao
              </Button>
            )}
            {record.status === 'delivered' && (
              <Button
                type="default"
                icon={<InfoCircleOutlined />}
                disabled
              >
                Đã hoàn thành
              </Button>
            )}
            {record.status === 'rejected' && (
              <Button
                type="default"
                icon={<CloseCircleOutlined />}
                disabled
              >
                Đã từ chối
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // Statistics
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
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
          <Col span={6}>
            <Card>
              <Statistic
                title="Đang chờ"
                value={stats.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã duyệt"
                value={stats.approved}
                valueStyle={{ color: '#1890ff' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đang xử lý"
                value={stats.in_progress}
                valueStyle={{ color: '#13c2c2' }}
                prefix={<CarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã giao"
                value={stats.delivered}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Space>
            <Input
              placeholder="Tìm kiếm theo ID, đại lý, xe..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Đang chờ</option>
              <option value="approved">Đã duyệt</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="delivered">Đã giao</option>
              <option value="rejected">Đã từ chối</option>
            </select>
            
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredRequests}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
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
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <p>Ghi chú giao hàng:</p>
          <TextArea
            rows={4}
            value={deliveredNotes}
            onChange={e => setDeliveredNotes(e.target.value)}
            placeholder="Nhập thông tin giao hàng (tùy chọn)..."
          />
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default RequestManagement;

