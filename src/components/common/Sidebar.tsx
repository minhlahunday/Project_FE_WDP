import React, { useEffect, useState, useRef } from "react";
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
  Search,
  Menu,
  X,
  User,
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
  isOpen,
  onClose,
  onOpen,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      
      // Auto close sidebar on mobile when route changes
      if (!desktop && isOpen) {
        onClose();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen || !sidebarRef.current) return;
      
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside sidebar
      if (sidebarRef.current.contains(target)) return;
      
      // Don't close if clicking on toggle buttons
      if (target.closest('[data-testid="sidebar-toggle"]')) return;
      
      // Close sidebar
      onClose();
    };

    // Add listener when sidebar is open
    if (isOpen) {
      document.addEventListener('click', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

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
            key: "staff-management",
            label: "Quản lý nhân viên",
            icon: <UserCog className="w-4 h-4" />,
            route: "/portal/staff-management",
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
    {
      key: "forecasting",
      label: "Dự báo nhu cầu",
      icon: <BarChart3 className="w-4 h-4" />,
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

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    
    // Close sidebar on mobile after navigation
    if (!isDesktop) {
      onClose();
    }
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case "admin":
        return "Admin Panel";
      case "evm_staff":
        return "EVM Management";
      default:
        return "Dealer Management";
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && !isDesktop && (
        <div
          className="github-sidebar-overlay"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
      )}

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={`github-sidebar ${isOpen ? 'github-sidebar-open' : 'github-sidebar-closed'}`}
        style={{
          transform: (isOpen || isDesktop) ? 'translateX(0)' : 'translateX(-100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="github-sidebar-header">
          <div className="flex items-center gap-3">
            <div className="github-sidebar-logo">
              <Car className="w-6 h-6" />
            </div>
            <div className="github-sidebar-title">
              <h1 className="text-sm font-semibold text-gray-900">VinFast EVM</h1>
              <p className="text-xs text-gray-600">{getRoleDisplayName()}</p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={isOpen ? onClose : onOpen}
            data-testid="sidebar-toggle"
            className="github-sidebar-toggle"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Search Bar */}
        <div className="github-sidebar-search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="github-search-input"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="github-sidebar-nav">
          <div className="github-sidebar-section">
            <h3 className="github-sidebar-section-title">
              {user?.role === "admin"
                ? "Administration"
                : user?.role === "evm_staff"
                ? "EVM Operations"
                : "Portal Features"}
            </h3>
            
            <ul className="github-sidebar-menu">
              {filteredMenuItems.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={`github-sidebar-menu-item ${
                      activeSection === item.key ? 'github-sidebar-menu-item-active' : ''
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

        {/* User Profile */}
        <div className="github-sidebar-footer">
          <div className="flex items-center gap-3 p-3">
            <div className="github-sidebar-avatar">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || "Admin User"}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};