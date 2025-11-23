import React, {useState, useEffect} from "react";
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
  Modal,
} from "antd";
import { Box } from '@mui/material';
import Swal from "sweetalert2";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  TruckOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  requestVehicleService,
  VehicleRequest,
} from "../../../services/requestVehicleService";
import {get} from "../../../services/httpClient";

const {Title} = Typography;
const {TextArea} = Input;

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [selectedRequest, setSelectedRequest] = useState<VehicleRequest | null>(
    null
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [deliveredNotes, setDeliveredNotes] = useState("");
  const [dealershipInfo, setDealershipInfo] = useState<any>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [deliveredLoading, setDeliveredLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [inProgressLoading, setInProgressLoading] = useState(false);

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
        populate: true, // Lấy đầy đủ thông tin vehicle
      });

      if (response.success) {
        setRequests(response.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination?.total || 0,
        }));
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          "Lỗi khi tải danh sách yêu cầu: " +
          (error?.message || "Unknown error"),
        confirmButtonText: "Đóng",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed request information
  const fetchRequestDetails = async (requestId: string) => {
    try {
      const response = await requestVehicleService.getVehicleRequestById(requestId);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching request details:', error);
      return null;
    }
  };

  const handleApprove = async (request: VehicleRequest) => {
    let errorMessage = "";
    let isSuccess = false;

    try {
      const result = await Swal.fire({
        title: "Xác nhận duyệt yêu cầu",
        text: `Bạn có chắc chắn muốn duyệt yêu cầu ${request._id}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Duyệt",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#1890ff",
        cancelButtonColor: "#d33",
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          setApproveLoading(true);
          try {
            const response = await requestVehicleService.approveRequest(
              request._id
            );
            if (!response.success) {
              errorMessage = response.message || "Không thể duyệt yêu cầu";
              Swal.showValidationMessage(errorMessage);
              setTimeout(() => Swal.close(), 2000);
              return false;
            }
            return response;
          } catch (error: any) {
            errorMessage = error?.message || "Đã xảy ra lỗi khi duyệt yêu cầu";
            Swal.showValidationMessage(errorMessage);
            setTimeout(() => Swal.close(), 2000);
            return false;
          } finally {
            setApproveLoading(false);
          }
        },
        allowOutsideClick: () => !approveLoading,
      });

      // Xử lý kết quả
      if (result.isConfirmed) {
        if (result.value) {
          // Thành công
          isSuccess = true;
          await Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: "Yêu cầu đã được duyệt!",
            confirmButtonText: "Đóng",
            timer: 2000,
            timerProgressBar: true,
          });
        } else if (errorMessage) {
          // Có lỗi từ preConfirm
          await Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: errorMessage,
            confirmButtonText: "Đóng",
          });
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Đã xảy ra lỗi: " + (error?.message || "Unknown error"),
        confirmButtonText: "Đóng",
      });
    } finally {
      // Luôn đóng modal và refresh data
      setShowDetailModal(false);
      setSelectedRequest(null);
      setDealershipInfo(null);
      await fetchRequests();
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    // Validate input
    if (!rejectNotes.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập lý do từ chối yêu cầu",
        confirmButtonText: "Đóng",
      });
      return;
    }

    setRejectLoading(true);
    try {
      const response = await requestVehicleService.rejectRequest(
        selectedRequest._id,
        rejectNotes.trim()
      );
      
      if (response && response.success) {
        // Đóng tất cả modal trước khi hiển thị SweetAlert
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectNotes("");
        setSelectedRequest(null);
        setDealershipInfo(null);

        // Refresh data
        await fetchRequests();

        // Hiển thị SweetAlert sau khi đóng modal
        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Yêu cầu đã bị từ chối!",
          confirmButtonText: "Đóng",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        // Handle API response error
        const errorMessage = response?.message || "Không thể từ chối yêu cầu. Vui lòng thử lại.";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Reject request error:", error);
      
      let errorMessage = "Đã xảy ra lỗi khi từ chối yêu cầu.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
        confirmButtonText: "Đóng",
      });
    } finally {
      setRejectLoading(false);
    }
  };

  const handleInProgress = async (request: VehicleRequest) => {
    // Đóng modal detail trước khi hiển thị SweetAlert
    setShowDetailModal(false);
    setSelectedRequest(null);
    setDealershipInfo(null);

    // Delay nhỏ để modal đóng hoàn toàn
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const result = await Swal.fire({
        title: "Xác nhận chuyển trạng thái",
        text: `Chuyển yêu cầu ${request._id} sang "đang xử lý"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#1890ff",
        cancelButtonColor: "#d33",
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          setInProgressLoading(true);
          try {
            const response = await requestVehicleService.inProgressRequest(
              request._id
            );
            if (!response.success) {
              throw new Error(
                response.message || "Không thể chuyển trạng thái"
              );
            }
            return response;
          } catch (error: any) {
            Swal.showValidationMessage(
              error?.message || "Lỗi khi cập nhật trạng thái"
            );
            throw error;
          } finally {
            setInProgressLoading(false);
          }
        },
        allowOutsideClick: () => !inProgressLoading,
      });

      if (result.isConfirmed) {
        // Refresh data
        await fetchRequests();

        // Hiển thị SweetAlert thành công
        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Yêu cầu đã chuyển sang đang xử lý!",
          confirmButtonText: "Đóng",
          timer: 2000,
          timerProgressBar: true,
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          "Lỗi khi cập nhật trạng thái: " + (error?.message || "Unknown error"),
        confirmButtonText: "Đóng",
      });
    } finally {
      setInProgressLoading(false);
    }
  };

  const handleDelivered = async () => {
    if (!selectedRequest) return;

    setDeliveredLoading(true);
    try {
      const response = await requestVehicleService.deliveredRequest(
        selectedRequest._id,
        deliveredNotes
      );
      if (response.success) {
        // Đóng tất cả modal trước khi hiển thị SweetAlert
        setShowDeliveredModal(false);
        setShowDetailModal(false);
        setDeliveredNotes("");
        const tempRequest = selectedRequest;
        setSelectedRequest(null);
        setDealershipInfo(null);

        // Refresh data
        await fetchRequests();

        // Hiển thị SweetAlert sau khi đóng modal
        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: `Yêu cầu ${tempRequest._id} đã được đánh dấu là đã giao hàng!`,
          confirmButtonText: "Đóng",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        throw new Error(response.message || "Không thể cập nhật trạng thái");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          "Lỗi khi cập nhật trạng thái: " + (error?.message || "Unknown error"),
        confirmButtonText: "Đóng",
      });
    } finally {
      setDeliveredLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: {[key: string]: {color: string; text: string; icon: any}} =
      {
        pending: {color: "orange", text: "Đang chờ", icon: ClockCircleOutlined},
        approved: {color: "blue", text: "Đã duyệt", icon: CheckCircleOutlined},
        in_progress: {color: "cyan", text: "Đang xử lý", icon: TruckOutlined},
        delivered: {color: "green", text: "Đã giao", icon: CheckCircleOutlined},
        rejected: {color: "red", text: "Đã từ chối", icon: CloseCircleOutlined},
      };

    const statusInfo = statusMap[status] || {
      color: "default",
      text: status,
      icon: InfoCircleOutlined,
    };
    const Icon = statusInfo.icon;

    return (
      <Tag color={statusInfo.color} icon={<Icon />}>
        {statusInfo.text}
      </Tag>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatAddress = (address: any) => {
    if (!address) return "N/A";

    if (typeof address === "string") return address;

    if (typeof address === "object") {
      // Nếu có full_address thì dùng
      if (address.full_address) return address.full_address;

      // Nếu không có thì ghép từ các thành phần
      const parts = [
        address.street,
        address.district,
        address.city,
        address.province,
      ].filter((part) => part && part.trim() !== "");

      return parts.length > 0 ? parts.join(", ") : "N/A";
    }

    return "N/A";
  };

  const showRequestDetail = async (request: VehicleRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);

    // Fetch dealership info if dealership_id is a string
    if (request.dealership_id && typeof request.dealership_id === "string") {
      try {
        const response: any = await get(
          `/api/dealerships/${request.dealership_id}`
        );
        // Handle both response structures: { success, data } or direct data
        const dealershipData = response?.success ? response.data : response;
        if (dealershipData) {
          setDealershipInfo(dealershipData);
        }
      } catch (error) {
        console.error("Error fetching dealership info:", error);
        setDealershipInfo(null);
      }
    } else {
      // If dealership_id is already an object, reset dealershipInfo
      setDealershipInfo(null);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      title: "Đại lý",
      key: "dealership",
      render: (_: any, record: VehicleRequest) => {
        const dealer =
          typeof record.dealership_id === "object" ? record.dealership_id : {};
        return (
          <div>
            <div className="font-medium">
              {dealer.company_name || dealer.name || "N/A"}
            </div>
            {dealer.phone && (
              <div className="text-xs text-gray-500">{dealer.phone}</div>
            )}
            {dealer.address && (
              <div
                className="text-xs text-gray-400 truncate"
                style={{maxWidth: "200px"}}
              >
                {formatAddress(dealer.address)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Thông tin xe",
      key: "vehicle",
      render: (_: any, record: VehicleRequest) => {
        const vehicle =
          typeof record.vehicle_id === "object" ? record.vehicle_id : {};
        return (
          <div>
            <div className="font-medium">
              {vehicle.name || vehicle.model || "N/A"}
            </div>
            <div className="text-xs text-gray-500">
              SKU: {vehicle.sku || "N/A"} | Màu: {record.color}
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
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "center" as const,
      render: (quantity: number) => <Tag color="blue">{quantity}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Thời gian",
      key: "dates",
      width: 130,
      render: (_: any, record: VehicleRequest) => (
        <div className="text-xs">
          <div>
            Tạo: {new Date(record.createdAt).toLocaleDateString("vi-VN")}
          </div>
          {record.delivered_at && (
            <div className="text-green-600">
              Giao: {new Date(record.delivered_at).toLocaleDateString("vi-VN")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 100,
      align: "center" as const,
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
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    delivered: requests.filter((r) => r.status === "delivered").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const filteredRequests = requests.filter((request) => {
    const dealer =
      typeof request.dealership_id === "object" ? request.dealership_id : {};
    const vehicle =
      typeof request.vehicle_id === "object" ? request.vehicle_id : {};
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
    <Box sx={{ pl: 5, pr: 3, py: 3, pt: 5, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <div>
        <Title level={2}>Quản lý yêu cầu đặt xe</Title>

        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={4}>
            <Card>
              <Statistic
                title="Tổng số"
                value={stats.total}
                valueStyle={{color: "#666"}}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đang chờ"
                value={stats.pending}
                valueStyle={{color: "#faad14"}}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đã duyệt"
                value={stats.approved}
                valueStyle={{color: "#1890ff"}}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đang xử lý"
                value={stats.in_progress}
                valueStyle={{color: "#13c2c2"}}
                prefix={<TruckOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đã giao"
                value={stats.delivered}
                valueStyle={{color: "#52c41a"}}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đã từ chối"
                value={stats.rejected}
                valueStyle={{color: "#ff4d4f"}}
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
                onChange={(e) => setSearchText(e.target.value)}
                style={{width: 300}}
                allowClear
              />
            </Col>
            <Col>
              <Select
                placeholder="Chọn trạng thái"
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                style={{width: 200}}
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
            <Col flex="auto" style={{textAlign: "right"}}>
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
            scroll={{x: 1200}}
            size="small"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} yêu cầu`,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || 10,
                }));
              },
            }}
          />
        </Card>

        {/* Reject Modal */}
        <Modal
          title="Từ chối yêu cầu"
          open={showRejectModal}
          onOk={() => {
            console.log("Reject button clicked, notes:", rejectNotes);
            handleReject();
          }}
          onCancel={() => {
            if (!rejectLoading) {
              setShowRejectModal(false);
              setRejectNotes("");
              setSelectedRequest(null);
            }
          }}
          okText="Xác nhận từ chối"
          cancelText="Hủy"
          okButtonProps={{
            danger: true, 
            loading: rejectLoading,
            disabled: !rejectNotes.trim()
          }}
          cancelButtonProps={{disabled: rejectLoading}}
          confirmLoading={rejectLoading}
          width={600}
        >
          {selectedRequest && (
            <div className="mb-4">
              <Descriptions title="Thông tin yêu cầu" size="small" column={2}>
                <Descriptions.Item label="ID">
                  {selectedRequest._id}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedRequest.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng">
                  {selectedRequest.quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Màu xe">
                  {selectedRequest.color}
                </Descriptions.Item>
              </Descriptions>
              <Divider />
            </div>
          )}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <TextArea
              rows={5}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Vui lòng nhập lý do cụ thể cho việc từ chối yêu cầu này..."
              showCount
              maxLength={500}
              status={!rejectNotes.trim() ? "error" : ""}
            />
            {!rejectNotes.trim() && (
              <div className="text-red-500 text-xs mt-1">
                Vui lòng nhập lý do từ chối
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-start">
              <CloseCircleOutlined className="text-red-600 mr-2 mt-0.5" />
              <div className="text-red-800">
                <div className="font-medium">Lưu ý quan trọng:</div>
                <div className="text-sm mt-1">
                  • Yêu cầu sẽ không thể phục hồi sau khi từ chối<br/>
                  • Đại lý sẽ nhận được thông báo về lý do từ chối<br/>
                  • Hành động này sẽ được ghi lại trong hệ thống
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Delivered Modal */}
        <Modal
          title="Đánh dấu đã giao hàng"
          open={showDeliveredModal}
          onOk={handleDelivered}
          onCancel={() => {
            if (!deliveredLoading) {
              setShowDeliveredModal(false);
              setDeliveredNotes("");
              setSelectedRequest(null);
            }
          }}
          okText="Xác nhận giao hàng"
          cancelText="Hủy"
          width={900}
          okButtonProps={{loading: deliveredLoading}}
          cancelButtonProps={{disabled: deliveredLoading}}
          confirmLoading={deliveredLoading}
        >
          {selectedRequest && (
            <div className="mb-4">
              <Descriptions title="Thông tin yêu cầu chi tiết" bordered size="small" column={2}>
                <Descriptions.Item label="ID yêu cầu" span={2}>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                    {selectedRequest._id}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng yêu cầu">
                  <strong style={{ color: '#1890ff' }}>{selectedRequest.quantity}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái hiện tại">
                  {getStatusTag(selectedRequest.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Màu sắc xe">
                  <span><strong>{selectedRequest.color || 'Không xác định'}</strong></span>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo yêu cầu">
                  {new Date(selectedRequest.createdAt).toLocaleString("vi-VN", {
                    year: 'numeric',
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cập nhật cuối">
                  {new Date(selectedRequest.updatedAt).toLocaleString("vi-VN", {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit', 
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </Descriptions.Item>
                
                {selectedRequest.requested_at && (
                  <Descriptions.Item label="Thời gian yêu cầu">
                    {new Date(selectedRequest.requested_at).toLocaleString("vi-VN")}
                  </Descriptions.Item>
                )}
                
                {selectedRequest.approved_at && (
                  <Descriptions.Item label="Thời gian duyệt">
                    {new Date(selectedRequest.approved_at).toLocaleString("vi-VN")}
                  </Descriptions.Item>
                )}
                
                {selectedRequest.delivered_at && (
                  <Descriptions.Item label="Thời gian giao hàng">
                    {new Date(selectedRequest.delivered_at).toLocaleString("vi-VN")}
                  </Descriptions.Item>
                )}
                
                {selectedRequest.rejected_at && (
                  <Descriptions.Item label="Thời gian từ chối">
                    {new Date(selectedRequest.rejected_at).toLocaleString("vi-VN")}
                  </Descriptions.Item>
                )}
                
                
                <Descriptions.Item label="Tên xe">
                  <strong style={{ color: '#1890ff' }}>
                    {typeof selectedRequest.vehicle_id === 'object' && selectedRequest.vehicle_id.name ? 
                      selectedRequest.vehicle_id.name : 
                      (selectedRequest.vehicle?.name || 'Đang tải...')
                    }
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Tên đại lý">
                  <strong style={{ color: '#52c41a' }}>
                    {typeof selectedRequest.dealership_id === 'object' && selectedRequest.dealership_id ? 
                      (selectedRequest.dealership_id.company_name || selectedRequest.dealership_id.name || 'Đang tải...') :
                      (dealershipInfo?.company_name || dealershipInfo?.name || 'Đang tải...')
                    }
                  </strong>
                </Descriptions.Item>
                
                {selectedRequest.manufacturer_id && (
                  <Descriptions.Item label="Manufacturer ID">
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {selectedRequest.manufacturer_id}
                    </span>
                  </Descriptions.Item>
                )}
                
                {selectedRequest.approved_by && (
                  <Descriptions.Item label="Người duyệt">
                    {typeof selectedRequest.approved_by === 'object' ? 
                      selectedRequest.approved_by.full_name || selectedRequest.approved_by.email : 
                      selectedRequest.approved_by
                    }
                  </Descriptions.Item>
                )}
                
                {selectedRequest.rejected_by && (
                  <Descriptions.Item label="Người từ chối">
                    {typeof selectedRequest.rejected_by === 'object' ? 
                      selectedRequest.rejected_by.full_name || selectedRequest.rejected_by.email : 
                      selectedRequest.rejected_by
                    }
                  </Descriptions.Item>
                )}

                {selectedRequest.notes && (
                  <Descriptions.Item label="Ghi chú yêu cầu" span={2}>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '4px', fontStyle: 'italic' }}>
                      {selectedRequest.notes}
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
              
              <Divider />
            </div>
          )}
          <p><strong>Ghi chú giao hàng:</strong></p>
          <TextArea
            rows={4}
            value={deliveredNotes}
            onChange={(e) => setDeliveredNotes(e.target.value)}
            placeholder="Nhập thông tin giao hàng (tùy chọn)..."
          />
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center">
              <DollarOutlined className="text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                <strong>Lưu ý:</strong> Việc xác nhận giao hàng sẽ tự động cập nhật kho hàng và
                tạo công nợ cho đại lý
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
              <div style={{textAlign: "right"}}>
                <Space>
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedRequest(null);
                    }}
                  >
                    Đóng
                  </Button>

                  {selectedRequest.status === "pending" && (
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

                  {selectedRequest.status === "approved" && (
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
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        icon={<TruckOutlined />}
                        onClick={() => handleInProgress(selectedRequest)}
                      >
                        Chuyển đang xử lý
                      </Button>
                    </>
                  )}

                  {selectedRequest.status === "in_progress" && (
                    <>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                          setShowDetailModal(false);
                          setTimeout(() => {
                            setShowRejectModal(true);
                          }, 150);
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={async () => {
                          setShowDetailModal(false); // Đóng modal chi tiết trước
                          
                          // Lấy thông tin chi tiết của request
                          const detailedRequest = await fetchRequestDetails(selectedRequest._id);
                          if (detailedRequest) {
                            setSelectedRequest(detailedRequest);
                          }
                          
                          // Delay nhỏ để tạo hiệu ứng mượt mà
                          setTimeout(() => {
                            setShowDeliveredModal(true); // Sau đó mở modal đánh dấu đã giao
                          }, 150);
                        }}
                      >
                        Đánh dấu đã giao
                      </Button>
                    </>
                  )}

                  {/* Nút hủy cho tất cả status khác, trừ delivered và rejected */}
                  {!["pending", "approved", "in_progress", "delivered", "rejected"].includes(selectedRequest.status) && (
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => {
                        setShowDetailModal(false);
                        setTimeout(() => {
                          setShowRejectModal(true);
                        }, 150);
                      }}
                    >
                      Hủy
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
              <Descriptions
                title="Thông tin cơ bản"
                bordered
                size="small"
                column={2}
              >
                <Descriptions.Item label="ID yêu cầu">
                  {selectedRequest._id}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedRequest.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng">
                  {selectedRequest.quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Màu xe">
                  {selectedRequest.color}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {new Date(selectedRequest.createdAt).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật cuối">
                  {new Date(selectedRequest.updatedAt).toLocaleString("vi-VN")}
                </Descriptions.Item>
                {selectedRequest.delivered_at && (
                  <Descriptions.Item label="Ngày giao hàng" span={2}>
                    {new Date(selectedRequest.delivered_at).toLocaleString(
                      "vi-VN"
                    )}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider />

              <Descriptions
                title="Thông tin đại lý"
                bordered
                size="small"
                column={2}
              >
                {(() => {
                  // Get dealership info - check if it's an object or use fetched info
                  const dealership =
                    typeof selectedRequest.dealership_id === "object" &&
                    selectedRequest.dealership_id
                      ? selectedRequest.dealership_id
                      : dealershipInfo;

                  if (!dealership) return null;

                  // Get contact info - check contact object first (from backend structure)
                  const phone =
                    dealership.contact?.phone ||
                    dealership.phone ||
                    dealership.contact_phone ||
                    (dealership.user && dealership.user.phone) ||
                    "N/A";

                  const email =
                    dealership.contact?.email ||
                    dealership.email ||
                    dealership.contact_email ||
                    (dealership.user && dealership.user.email) ||
                    "N/A";

                  return (
                    <>
                      <Descriptions.Item label="Tên công ty" span={2}>
                        {dealership.company_name || dealership.name || "N/A"}
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

              <Descriptions
                title="Thông tin xe"
                bordered
                size="small"
                column={2}
              >
                {typeof selectedRequest.vehicle_id === "object" &&
                  selectedRequest.vehicle_id && (
                    <>
                      <Descriptions.Item label="Tên xe" span={2}>
                        {selectedRequest.vehicle_id.name ||
                          selectedRequest.vehicle_id.model ||
                          "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="SKU">
                        {selectedRequest.vehicle_id.sku || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Giá">
                        {selectedRequest.vehicle_id.price
                          ? formatCurrency(selectedRequest.vehicle_id.price)
                          : "N/A"}
                      </Descriptions.Item>
                      {/* <Descriptions.Item label="Thương hiệu">
                      {typeof selectedRequest.vehicle_id.manufacturer_id === 'object' && selectedRequest.vehicle_id.manufacturer_id
                        ? selectedRequest.vehicle_id.manufacturer_id.name || 'N/A'
                        : 'N/A'}
                    </Descriptions.Item> */}
                      <Descriptions.Item label="Mô tả" span={2}>
                        {selectedRequest.vehicle_id.description || "N/A"}
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
    </Box>
  );
};

export default RequestManagement;
