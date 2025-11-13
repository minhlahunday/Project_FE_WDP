import React, {useState, useEffect} from "react";
import {
  Card,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Input,
  DatePicker,
  message,
  Progress,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";

import {paymentService, Debt} from "../../services/paymentService";
import {orderService, Order} from "../../services/orderService";

const {Title} = Typography;
const {RangePicker} = DatePicker;

interface DebtTrackingProps {
  customerId?: string;
  showCustomerFilter?: boolean;
}

export const DebtTracking: React.FC<DebtTrackingProps> = ({
  customerId,
  showCustomerFilter = true,
}) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  // Statistics
  const [stats, setStats] = useState({
    totalDebt: 0,
    totalPaid: 0,
    totalRemaining: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    loadDebts();
  }, [customerId]);

  const loadDebts = async () => {
    setLoading(true);
    try {
      if (customerId) {
        // Load debts for specific customer
        const response = await paymentService.getCustomerDebts(customerId);
        if (response.success) {
          setDebts(response.data.data);
        }
      } else {
        // Load all debts (for admin/manager view)
        // This would need a new API endpoint
        setDebts([]);
      }
    } catch (error) {
      console.error("Error loading debts:", error);
      message.error("Lỗi khi tải danh sách công nợ");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  useEffect(() => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.total_amount, 0);
    const totalPaid = debts.reduce((sum, debt) => sum + debt.paid_amount, 0);
    const totalRemaining = debts.reduce(
      (sum, debt) => sum + debt.remaining_amount,
      0
    );
    const overdueCount = debts.filter(
      (debt) =>
        debt.due_date &&
        dayjs(debt.due_date).isBefore(dayjs()) &&
        debt.status !== "settled"
    ).length;

    setStats({
      totalDebt,
      totalPaid,
      totalRemaining,
      overdueCount,
    });
  }, [debts]);

  // Filter debts
  const filteredDebts = debts.filter((debt) => {
    const matchesSearch =
      !searchText ||
      debt.order_id.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || debt.status === statusFilter;

    const matchesDate =
      !dateRange ||
      (dayjs(debt.created_at).isAfter(dateRange[0]) &&
        dayjs(debt.created_at).isBefore(dateRange[1]));

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Get debt status tag
  const getDebtStatusTag = (debt: Debt) => {
    const isOverdue =
      debt.due_date &&
      dayjs(debt.due_date).isBefore(dayjs()) &&
      debt.status !== "settled";

    if (debt.status === "settled") {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Đã thanh toán
        </Tag>
      );
    } else if (isOverdue) {
      return (
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          Quá hạn
        </Tag>
      );
    } else if (debt.status === "partial") {
      return (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          Thanh toán một phần
        </Tag>
      );
    } else {
      return (
        <Tag color="blue" icon={<ClockCircleOutlined />}>
          Chưa thanh toán
        </Tag>
      );
    }
  };

  // Get payment progress
  const getPaymentProgress = (debt: Debt) => {
    const percentage = (debt.paid_amount / debt.total_amount) * 100;
    return Math.round(percentage);
  };

  // Table columns
  const columns: ColumnsType<Debt> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "order_id",
      key: "order_id",
      render: (orderId: string) => (
        <span className="font-mono text-blue-600">{orderId}</span>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount: number) => (
        <span className="font-medium">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(amount)}
        </span>
      ),
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (amount: number) => (
        <span className="text-green-600 font-medium">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(amount)}
        </span>
      ),
    },
    {
      title: "Còn lại",
      dataIndex: "remaining_amount",
      key: "remaining_amount",
      render: (amount: number) => (
        <span className="text-red-600 font-medium">
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(amount)}
        </span>
      ),
    },
    {
      title: "Tiến độ",
      key: "progress",
      render: (_: any, debt: Debt) => {
        const progress = getPaymentProgress(debt);
        return (
          <Progress
            percent={progress}
            size="small"
            strokeColor={progress === 100 ? "#52c41a" : "#1890ff"}
          />
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, debt: Debt) => getDebtStatusTag(debt),
    },
    // {
    //   title: 'Hạn thanh toán',
    //   dataIndex: 'due_date',
    //   key: 'due_date',
    //   render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : 'Không có'
    // },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng công nợ"
              value={stats.totalDebt}
              formatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(value))
              }
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã thanh toán"
              value={stats.totalPaid}
              formatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(value))
              }
              valueStyle={{color: "#3f8600"}}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Còn lại"
              value={stats.totalRemaining}
              formatter={(value) =>
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(value))
              }
              valueStyle={{color: "#cf1322"}}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Quá hạn"
              value={stats.overdueCount}
              valueStyle={{color: "#cf1322"}}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Input
            placeholder="Tìm kiếm theo mã đơn hàng..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{width: 300}}
          />

          <div className="relative">
            <select
              className="w-48 px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300 appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Lọc theo trạng thái</option>
              <option value="open">Chưa thanh toán</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="settled">Đã thanh toán</option>
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={["Từ ngày", "Đến ngày"]}
          />

          <Button onClick={loadDebts} loading={loading}>
            Làm mới
          </Button>
        </div>

        {/* Debts Table */}
        <Table
          columns={columns}
          dataSource={filteredDebts}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} công nợ`,
          }}
          scroll={{x: 800}}
        />
      </Card>
    </div>
  );
};

export default DebtTracking;
