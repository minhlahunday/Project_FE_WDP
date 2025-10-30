import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Car,
  ShoppingCart,
  Users,
  BarChart3,
  Package,
  Building2,
  Calendar,
  CreditCard,
  MessageSquare,
  UserCog,
  Info,
  Gift,
  ClipboardList,
  FileSignature,
  FileText,
  Receipt,
  FileCheck,
} from "lucide-react";
import { Layout, Menu, Input, Avatar, Button, Typography, Space } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  onOpen,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const dealerMenuItems = [
    {
      key: "vehicles",
      label: "Danh mục xe",
      icon: <Car className="h-4 w-4" />,
      route: "/portal/car",
    },
    {
      key: "sales",
      label: "Quản lý bán hàng",
      icon: <ShoppingCart className="h-4 w-4" />,
      route: "/portal/sales",
    },
    {
      key: "orders",
      label: "Quản lý đơn hàng",
      icon: <ClipboardList className="h-4 w-4" />,
      route: "/portal/orders",
    },
    {
      key: "order-requests",
      label: "Yêu cầu đặt xe",
      icon: <FileSignature className="h-4 w-4" />,
      route: "/portal/order-requests",
    },
    {
      key: "quotations",
      label: "Quản lý báo giá",
      icon: <FileText className="h-4 w-4" />,
      route: "/portal/quotations",
    },
    {
      key: "quote-to-order",
      label: "Chuyển báo giá",
      icon: <FileSignature className="h-4 w-4" />,
      route: "/portal/quote-to-order",
    },
    {
      key: "payments",
      label: "Thanh toán",
      icon: <CreditCard className="h-4 w-4" />,
      route: "/portal/payments",
    },
    // {
    //   key: "payment-demo",
    //   label: "Demo Thanh toán",
    //   icon: <CreditCard className="h-4 w-4" />,
    //   route: "/portal/payment-demo",
    // },
    {
      key: "customers",
      label: "Quản lý khách hàng",
      icon: <Users className="h-4 w-4" />,
      route: "/portal/customers",
    },
    {
      key: "test-drives",
      label: "Lịch lái thử",
      icon: <Calendar className="h-4 w-4" />,
      route: "/portal/test-drives",
    },
    {
      key: "promotions",
      label: "Quản lý khuyến mãi",
      icon: <Gift className="h-4 w-4" />,
      route: "/portal/promotions",
    },
    ...(user?.role === "dealer_manager"
      ? [
          {
            key: "staff-management",
            label: "Quản lý nhân viên",
            icon: <UserCog className="h-4 w-4" />,
            route: "/portal/staff-management",
          },
        ]
      : []),
    {
      key: "feedback",
      label: "Phản hồi",
      icon: <MessageSquare className="h-4 w-4" />,
      route: "/portal/feedback",
    },
    {
      key: "reports",
      label: "Báo cáo",
      icon: <BarChart3 className="h-4 w-4" />,
      route: "/portal/reports",
    },
    {
      key: "dealer-info",
      label: "Thông tin đại lý",
      icon: <Info className="h-4 w-4" />,
      route: "/portal/dealer-info",
    },
  ];

  // Menu Admin
  const adminMenuItems = [
    {
      key: "dealer-management",
      label: "Quản lý đại lý",
      icon: <Building2 className="h-4 w-4" />,
      route: "/admin/dealer-management",
    },
    {
      key: "admin-staff-management",
      label: "Quản lý nhân viên",
      icon: <UserCog className="h-4 w-4" />,
      route: "/admin/admin-staff-management",
    },
  ];

  // Menu EVM Staff
  const evmMenuItems = [
    {
      key: "product-management",
      label: "Quản lý sản phẩm",
      icon: <Package className="h-4 w-4" />,
      route: "/evm/product-management",
    },
    {
      key: "inventory-management",
      label: "Quản lý tồn kho",
      icon: <Package className="h-4 w-4" />,
      route: "/evm/inventory-management",
    },
    {
      key: "dealer-management",
      label: "Quản lý đại lý",
      icon: <Building2 className="h-4 w-4" />,
      route: "/evm/dealer-management",
    },
    {
      key: "pricing",
      label: "Khuyến mãi",
      icon: <CreditCard className="h-4 w-4" />,
      route: "/evm/promotion-management",
    },
    {
      key: "customer-management",
      label: "Quản lý Đặt Xe",
      icon: <FileCheck className="h-4 w-4" />,
      route: "/evm/request-management",
    },
    {
      key: "manufacturer-debt-management",
      label: "Quản lý công nợ",
      icon: <Receipt className="h-4 w-4" />,
      route: "/evm/manufacturer-debt-management",
    },
    {
      key: "forecasting",
      label: "Dự báo nhu cầu",
      icon: <BarChart3 className="h-4 w-4" />,
      route: "/sections/forecasting",
    },
  ];

  const getMenuItems = () => {
    if (user?.role === "admin") {
      return adminMenuItems;
    } else if (user?.role === "evm_staff") {
      return evmMenuItems;
    } else {
      return dealerMenuItems;
    }
  };

  const menuItems = getMenuItems();

  // Tự động đồng bộ activeSection với route hiện tại
  useEffect(() => {
    const currentMenu = menuItems.find(
      (item) => item.route === location.pathname
    );
    if (currentMenu && currentMenu.key !== activeSection) {
      onSectionChange(currentMenu.key);
    }
  }, [location.pathname, menuItems, activeSection, onSectionChange]);

  const handleMenuItemClick = ({ key }: { key: string }) => {
    const menuItem = menuItems.find((item) => item.key === key);
    if (menuItem?.route && menuItem.route !== location.pathname) {
      navigate(menuItem.route);
    }
    onSectionChange(key);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-150"
          onClick={onClose}
        />
      )}

      {/* Ant Design Sider */}
      <Sider
        collapsed={!isOpen}
        collapsible
        trigger={null}
        width={280}
        collapsedWidth={64}
        theme="dark"
        className={`fixed top-0 left-0 h-screen transition-all duration-150 ease-out shadow-2xl z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
          height: "100vh",
          transition: "all 150ms ease-out",
        }}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
          <Space align="center">
            <Car className="h-8 w-8 text-green-500 flex-shrink-0" />
            {isOpen && (
              <div>
                <Text
                  strong
                  className="text-white text-base block leading-tight"
                >
                  VinFast EVM
                </Text>
                <Text className="text-gray-400 text-xs block">
                  {user?.role === "admin"
                    ? "Admin Panel"
                    : user?.role === "evm_staff"
                    ? "EVM Management"
                    : "Dealer Management"}
                </Text>
              </div>
            )}
          </Space>

          {/* Toggle Button */}
          <Button
            type="text"
            icon={isOpen ? <CloseOutlined /> : <MenuOutlined />}
            onClick={isOpen ? onClose : onOpen}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            size="small"
          />
        </div>

        {/* Search Bar */}
        {isOpen && (
          <div className="p-4">
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="bg-gray-800 border-gray-600 text-white"
              style={{
                backgroundColor: "#374151",
                borderColor: "#4B5563",
                color: "white",
              }}
            />
          </div>
        )}

        {/* Menu Title */}
        {isOpen && (
          <div className="px-4 mb-4">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {user?.role === "admin"
                ? "Admin Menu"
                : user?.role === "evm_staff"
                ? "EVM Menu"
                : "Portal Menu"}
            </Text>
          </div>
        )}

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeSection]}
          items={menuItems}
          onClick={handleMenuItemClick}
          className="border-r-0 bg-transparent"
          style={{
            background: "transparent",
            border: "none",
          }}
        />

        {/* User Profile (when expanded) */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800/30">
            <Space align="center" className="w-full">
              <Avatar
                size="small"
                icon={<UserOutlined />}
                className="bg-green-500"
              />
              <div className="flex-1 min-w-0">
                <Text className="text-white text-sm block truncate">
                  {user?.email || "Admin User"}
                </Text>
                <Text className="text-gray-400 text-xs block truncate">
                  {user?.role || "Administrator"}
                </Text>
              </div>
            </Space>
          </div>
        )}
      </Sider>
    </>
  );
};
