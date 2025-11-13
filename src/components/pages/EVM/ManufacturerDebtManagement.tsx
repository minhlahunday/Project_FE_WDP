import React, {useState, useEffect} from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Modal,
  message,
  Statistic,
  Row,
  Col,
  Progress,
  Descriptions,
  Divider,
} from "antd";
import {AdminLayout} from "../admin/AdminLayout";
import {
  DollarOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import {get} from "../../../services/httpClient";

const {Title, Text} = Typography;

interface ManufacturerDebt {
  _id: string;
  dealership_id: any;
  manufacturer_id: any;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: "open" | "partial" | "settled";
  items?: Array<{
    request_id: string;
    vehicle_id: string;
    vehicle_name: string;
    color: string;
    unit_price: number;
    quantity: number;
    amount: number;
    delivered_at: string;
    notes: string;
  }>;
  payments?: Array<{
    amount: number;
    paid_at: string;
    method: string;
    order_id: string;
    note: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const ManufacturerDebtManagement: React.FC = () => {
  const [debts, setDebts] = useState<ManufacturerDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<ManufacturerDebt | null>(
    null
  );

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    totalAmount: 0,
    remainingAmount: 0,
    open: 0,
    partial: 0,
    settled: 0,
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const response = await get("/api/debts/manufacturers");

      if (response && response.success) {
        const debtList = response.data.data || [];

        // Fetch dealers to get names
        try {
          const dealerResponse = await get("/api/dealerships");
          const dealers = dealerResponse?.data?.data || [];

          // Map debt data with dealer names
          const enrichedDebts = debtList.map((debt: any) => {
            const dealerId =
              typeof debt.dealership_id === "object"
                ? debt.dealership_id._id
                : debt.dealership_id;

            const dealer = dealers.find((d: any) => d._id === dealerId);

            return {
              ...debt,
              dealership_id: dealer
                ? {
                    _id: dealer._id,
                    company_name: dealer.company_name,
                    name: dealer.name || dealer.company_name,
                  }
                : debt.dealership_id,
            };
          });

          setDebts(enrichedDebts);
          calculateStatistics(response.data);
        } catch (dealerError) {
          console.error("Error fetching dealers:", dealerError);
          setDebts(debtList);
          calculateStatistics(response.data);
        }
      } else {
        message.error("Không thể tải danh sách công nợ");
        setDebts([]);
      }
    } catch (error: any) {
      console.error("Error fetching debts:", error);
      message.error("Không thể tải danh sách công nợ");
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data: any) => {
    const stats = {
      total: data.data?.length || 0,
      totalAmount: data.totalAmount || 0,
      remainingAmount: data.remainingAmount || 0,
      open: 0,
      partial: 0,
      settled: 0,
    };

    if (data.data) {
      data.data.forEach((debt: ManufacturerDebt) => {
        switch (debt.status) {
          case "open":
            stats.open++;
            break;
          case "partial":
            stats.partial++;
            break;
          case "settled":
            stats.settled++;
            break;
        }
      });
    }

    setStatistics(stats);
  };

  const handleViewDetails = (debt: ManufacturerDebt) => {
    setSelectedDebt(debt);
    setIsPaymentModalVisible(true);
  };

  const getFilteredDebts = () => {
    let filtered = debts;

    if (searchText) {
      filtered = filtered.filter((debt) => {
        const dealerName =
          typeof debt.dealership_id === "object"
            ? debt.dealership_id?.company_name || debt.dealership_id?.name
            : "";
        const manufacturerName =
          typeof debt.manufacturer_id === "object"
            ? debt.manufacturer_id?.name
            : "";
        return (
          dealerName.toLowerCase().includes(searchText.toLowerCase()) ||
          manufacturerName.toLowerCase().includes(searchText.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((debt) => debt.status === statusFilter);
    }

    return filtered;
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "open":
        return <Tag color="red">Chưa thanh toán</Tag>;
      case "partial":
        return <Tag color="orange">Thanh toán một phần</Tag>;
      case "settled":
        return <Tag color="green">Đã thanh toán</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const columns = [
    {
      title: "Đại lý",
      key: "dealership",
      render: (record: ManufacturerDebt) => {
        const dealer =
          typeof record.dealership_id === "object"
            ? record.dealership_id
            : null;
        return dealer ? (
          <div>
            <Text strong>{dealer.company_name || dealer.name}</Text>
            <br />
            {dealer.code && (
              <Text type="secondary" className="text-xs">
                {dealer.code}
              </Text>
            )}
          </div>
        ) : (
          <Text type="secondary">N/A</Text>
        );
      },
    },
    {
      title: "Nhà sản xuất",
      key: "manufacturer",
      render: (record: ManufacturerDebt) => {
        const manufacturer =
          typeof record.manufacturer_id === "object"
            ? record.manufacturer_id
            : null;
        return manufacturer ? (
          <Text strong>{manufacturer.name}</Text>
        ) : (
          <Text type="secondary">N/A</Text>
        );
      },
    },
    {
      title: "Tổng công nợ",
      key: "total_amount",
      render: (record: ManufacturerDebt) => (
        <Text strong style={{color: "#1890ff"}}>
          {formatCurrency(record.total_amount)}
        </Text>
      ),
    },
    {
      title: "Đã thanh toán",
      key: "paid_amount",
      render: (record: ManufacturerDebt) => (
        <Text style={{color: "#52c41a"}}>
          {formatCurrency(record.paid_amount)}
        </Text>
      ),
    },
    {
      title: "Còn lại",
      key: "remaining_amount",
      render: (record: ManufacturerDebt) => (
        <Text strong style={{color: "#ff4d4f"}}>
          {formatCurrency(record.remaining_amount)}
        </Text>
      ),
    },
    {
      title: "Tiến độ",
      key: "progress",
      render: (record: ManufacturerDebt) => {
        const percent = (record.paid_amount / record.total_amount) * 100;
        const roundedPercent = Math.round(percent * 100) / 100;
        return (
          <Progress
            percent={roundedPercent}
            size="small"
            status={record.status === "settled" ? "success" : "active"}
          />
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (record: ManufacturerDebt) => getStatusTag(record.status),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (record: ManufacturerDebt) => (
        <Space>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout activeSection="manufacturer-debt-management">
      <div className="bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <Title level={2}>
            <DollarOutlined className="mr-2 text-blue-600" />
            Quản lý công nợ đại lý - nhà sản xuất
          </Title>
          <Text type="secondary">
            Ghi nhận và theo dõi công nợ giữa đại lý và nhà sản xuất
          </Text>
        </div>

        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng công nợ"
                value={statistics.total}
                prefix={<DollarOutlined />}
                valueStyle={{color: "#1890ff"}}
                suffix="đơn vị"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng tiền công nợ"
                value={statistics.totalAmount}
                valueStyle={{color: "#1890ff"}}
                suffix="₫"
                formatter={(value) => formatCurrency(value as number)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tiền chưa thanh toán"
                value={statistics.remainingAmount}
                valueStyle={{color: "#ff4d4f"}}
                suffix="₫"
                formatter={(value) => formatCurrency(value as number)}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã thanh toán đủ"
                value={statistics.settled}
                prefix={<CheckCircleOutlined />}
                valueStyle={{color: "#52c41a"}}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input
                placeholder="Tìm kiếm đại lý, nhà sản xuất..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <select
                className="w-full h-8 rounded border border-gray-300 px-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="open">Chưa thanh toán</option>
                <option value="partial">Thanh toán một phần</option>
                <option value="settled">Đã thanh toán</option>
              </select>
            </Col>
            <Col span={4}>
              <Space></Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={getFilteredDebts()}
            rowKey="_id"
            loading={loading}
            scroll={{x: "max-content"}}
            pagination={{
              total: getFilteredDebts().length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} công nợ`,
            }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <HistoryOutlined className="text-blue-600" />
              Chi tiết công nợ
            </div>
          }
          open={isPaymentModalVisible}
          onCancel={() => {
            setIsPaymentModalVisible(false);
            setSelectedDebt(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setIsPaymentModalVisible(false);
                setSelectedDebt(null);
              }}
            >
              Đóng
            </Button>,
          ]}
          width={800}
        >
          {selectedDebt && (
            <div>
              {/* Debt Info */}
              <Card size="small" className="mb-4">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Đại lý">
                    {typeof selectedDebt.dealership_id === "object"
                      ? selectedDebt.dealership_id?.company_name ||
                        selectedDebt.dealership_id?.name
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nhà sản xuất">
                    {typeof selectedDebt.manufacturer_id === "object"
                      ? selectedDebt.manufacturer_id?.name
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng công nợ">
                    <Text strong style={{color: "#1890ff"}}>
                      {formatCurrency(selectedDebt.total_amount)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Đã thanh toán">
                    <Text style={{color: "#52c41a"}}>
                      {formatCurrency(selectedDebt.paid_amount)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Còn lại">
                    <Text strong style={{color: "#ff4d4f"}}>
                      {formatCurrency(selectedDebt.remaining_amount)}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {getStatusTag(selectedDebt.status)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Payment History */}
              {selectedDebt.payments && selectedDebt.payments.length > 0 && (
                <div className="mt-4">
                  <Divider orientation="left">Lịch sử thanh toán</Divider>
                  <div className="max-h-64 overflow-y-auto">
                    {selectedDebt.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="mb-3 p-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <Text strong>{formatCurrency(payment.amount)}</Text>
                            <br />
                            <Text type="secondary" className="text-xs">
                              {new Date(payment.paid_at).toLocaleString(
                                "vi-VN"
                              )}
                            </Text>
                            <br />
                            <Text type="secondary" className="text-xs">
                              Phương thức: {payment.method || "N/A"}
                            </Text>
                            {payment.note && (
                              <>
                                <br />
                                <Text type="secondary" className="text-xs">
                                  Ghi chú: {payment.note}
                                </Text>
                              </>
                            )}
                          </div>
                          <Tag color="green">Đã thanh toán</Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!selectedDebt.payments ||
                selectedDebt.payments.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <HistoryOutlined className="text-4xl mb-2" />
                  <div>Chưa có lịch sử thanh toán</div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default ManufacturerDebtManagement;
