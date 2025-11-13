import React, { useEffect, useRef } from "react";
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
  UserCog,
  Info,
  Gift,
  ClipboardList,
  FileSignature,
  FileText,
  Receipt,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/sidebar-github.css";

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
  isOpen: _isOpen,
  onClose: _onClose,
  onOpen: _onOpen,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Bỏ logic click outside và auto-close để sidebar luôn mở

  const dealerMenuItems = [
    {
      key: "vehicles",
      label: "Danh mục xe",
      icon: <Car className="w-4 h-4" />,
      route: "/portal/car",
    },
    {
      key: "sales",
      label: "Quản lý bán hàng",
      icon: <ShoppingCart className="w-4 h-4" />,
      route: "/portal/sales",
    },
    {
      key: "orders",
      label: "Quản lý đơn hàng",
      icon: <ClipboardList className="w-4 h-4" />,
      route: "/portal/orders",
    },
    {
      key: "order-requests",
      label: "Yêu cầu đặt xe",
      icon: <FileSignature className="w-4 h-4" />,
      route: "/portal/order-requests",
    },
    {
      key: "quotations",
      label: "Quản lý báo giá",
      icon: <FileText className="w-4 h-4" />,
      route: "/portal/quotations",
    },
    {
      key: "quote-to-order",
      label: "Chuyển báo giá",
      icon: <FileSignature className="w-4 h-4" />,
      route: "/portal/quote-to-order",
    },
    {
      key: "payments",
      label: "Thanh toán",
      icon: <CreditCard className="w-4 h-4" />,
      route: "/portal/payments",
    },
    {
      key: "customers",
      label: "Quản lý khách hàng",
      icon: <Users className="w-4 h-4" />,
      route: "/portal/customers",
    },
    {
      key: "dealer-stock",
      label: "Quản lý tồn kho",
      icon: <Package className="w-4 h-4" />,
      route: "/portal/dealer-stock",
    },
    {
      key: "test-drives",
      label: "Lịch lái thử",
      icon: <Calendar className="w-4 h-4" />,
      route: "/portal/test-drives",
    },
    {
      key: "promotions",
      label: "Quản lý khuyến mãi",
      icon: <Gift className="w-4 h-4" />,
      route: "/portal/promotions",
    },
    ...(user?.role === "dealer_manager"
      ? [
          {
            key: "dealer-requests",
            label: "Yêu cầu từ nhân viên",
            icon: <FileSignature className="w-4 h-4" />,
            route: "/portal/dealer-requests",
          },
          {
            key: "staff-management",
            label: "Quản lý nhân viên",
            icon: <UserCog className="w-4 h-4" />,
            route: "/portal/staff-management",
          },
          {
            key: "report-dashboard",
            label: "Báo cáo Dashboard",
            icon: <BarChart3 className="w-4 h-4" />,
            route: "/portal/report-dashboard",
          },
        ]
      : []),
    // {
    //   key: "feedback",
    //   label: "Phản hồi",
    //   icon: <MessageSquare className="w-4 h-4" />,
    //   route: "/portal/feedback",
    // },
    // {
    //   key: "reports",
    //   label: "Báo cáo",
    //   icon: <BarChart3 className="w-4 h-4" />,
    //   route: "/portal/reports",
    // },
    {
      key: "dealer-info",
      label: "Thông tin đại lý",
      icon: <Info className="w-4 h-4" />,
      route: "/portal/dealer-info",
    },
  ];

  const adminMenuItems = [
    {
      key: "dealer-management",
      label: "Quản lý đại lý",
      icon: <Building2 className="w-4 h-4" />,
      route: "/admin/dealer-management",
    },
    {
      key: "admin-staff-management",
      label: "Quản lý nhân viên",
      icon: <UserCog className="w-4 h-4" />,
      route: "/admin/admin-staff-management",
    },
  ];

  const evmMenuItems = [
    {
      key: "manufacturer-dashboard",
      label: "Dashboard Hãng",
      icon: <BarChart3 className="w-4 h-4" />,
      route: "/evm/manufacturer-dashboard",
    },
    {
      key: "product-management",
      label: "Quản lý sản phẩm",
      icon: <Package className="w-4 h-4" />,
      route: "/evm/product-management",
    },
    {
      key: "inventory-management",
      label: "Quản lý tồn kho",
      icon: <Package className="w-4 h-4" />,
      route: "/evm/inventory-management",
    },
    {
      key: "dealer-management",
      label: "Quản lý đại lý",
      icon: <Building2 className="w-4 h-4" />,
      route: "/evm/dealer-management",
    },
    {
      key: "pricing",
      label: "Khuyến mãi",
      icon: <CreditCard className="w-4 h-4" />,
      route: "/evm/promotion-management",
    },
    {
      key: "customer-management",
      label: "Quản lý Đặt Xe",
      icon: <FileCheck className="w-4 h-4" />,
      route: "/evm/request-management",
    },
    {
      key: "manufacturer-debt-management",
      label: "Quản lý công nợ",
      icon: <Receipt className="w-4 h-4" />,
      route: "/evm/manufacturer-debt-management",
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

  // Hiển thị tất cả menu items (không filter vì không có search)
  const filteredMenuItems = menuItems;

  // Auto sync activeSection with current route
  useEffect(() => {
    const currentMenu = menuItems.find(
      (item) => item.route === location.pathname
    );
    if (currentMenu && currentMenu.key !== activeSection) {
      onSectionChange(currentMenu.key);
    }
  }, [location.pathname, menuItems, activeSection, onSectionChange]);

  const handleMenuItemClick = (item: any) => {
    if (item.route && item.route !== location.pathname) {
      navigate(item.route);
    }
    onSectionChange(item.key);

    // Sidebar luôn mở, không đóng sau khi navigate
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case "admin":
        return "Quản trị hệ thống";
      case "evm_staff":
        return "Quản lý hãng";
      case "dealer_manager":
        return "Quản lý đại lý";
      case "dealer_staff":
        return "Nhân viên đại lý";
      default:
        return "Portal";
    }
  };

  return (
    <>
      {/* Sidebar Container - Luôn mở */}
      <div
        ref={sidebarRef}
        className="github-sidebar github-sidebar-open"
        style={{
          transform: "translateX(0)", // Luôn hiển thị
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="github-sidebar-header" style={{ justifyContent: 'flex-start' }}>
          <div className="flex items-center gap-3">
            <div className="github-sidebar-logo">
              <Car className="w-6 h-6" />
            </div>
            <div className="github-sidebar-title">
              <h1 className="text-sm font-semibold text-gray-900">
                VinFast 
              </h1>
              <p className="text-xs text-gray-600">{getRoleDisplayName()}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="github-sidebar-nav">
          <div className="github-sidebar-section">
            <h3 className="github-sidebar-section-title">
              {user?.role === "admin"
                ? "Quản trị hệ thống"
                : user?.role === "evm_staff"
                ? "Chức năng hãng"
                : "Chức năng đại lý"}
            </h3>

            <ul className="github-sidebar-menu">
              {filteredMenuItems.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={`github-sidebar-menu-item ${
                      activeSection === item.key
                        ? "github-sidebar-menu-item-active"
                        : ""
                    }`}
                  >
                    <span className="github-sidebar-menu-icon">
                      {item.icon}
                    </span>
                    <span className="github-sidebar-menu-label">
                      {item.label}
                    </span>
                    {activeSection === item.key && (
                      <ChevronRight className="w-3 h-3 text-blue-600 ml-auto" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
};
