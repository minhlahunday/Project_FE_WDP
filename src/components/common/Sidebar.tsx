import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Package, 
  Building2,
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose, onOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dealerMenuItems = [
    { id: 'vehicles', label: 'Danh mục xe', icon: Car, route: '/portal/car' },
    { id: 'sales', label: 'Quản lý bán hàng', icon: ShoppingCart, route: '/portal/sales' },
    { id: 'customers', label: 'Quản lý khách hàng', icon: Users, route: '/portal/customers' },
    ...(user?.role === 'dealer_manager' ? [{ id: 'staff-management', label: 'Quản lý nhân viên', icon: UserCog, route: '/portal/staff-management' }] : []),
    { id: 'test-drives', label: 'Lịch lái thử', icon: Calendar, route: '/portal/test-drives' },
    { id: 'orders', label: 'Đơn hàng', icon: FileText, route: '/portal/orders' },
    { id: 'payments', label: 'Thanh toán', icon: CreditCard, route: '/portal/payments' },
    { id: 'feedback', label: 'Phản hồi', icon: MessageSquare, route: '/portal/feedback' },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3, route: '/portal/reports' },
  ];

  // Menu Admin
  const adminMenuItems = [
    { id: 'product-management', label: 'Quản lý sản phẩm', icon: Package, route: '/admin/product-management' },
    { id: 'dealer-management', label: 'Quản lý đại lý', icon: Building2, route: '/admin/dealer-management' },
    { id: 'admin-staff-management', label: 'Quản lý nhân viên', icon: UserCog, route: '/admin/admin-staff-management' },
  ];

  // Menu EVM Staff
  const evmMenuItems = [
    { id: 'product-management', label: 'Quản lý sản phẩm', icon: Package, route: '/admin/product-management' },
    { id: 'inventory', label: 'Quản lý tồn kho', icon: Car, route: '/sections/inventory' },
    { id: 'dealer-management', label: 'Quản lý đại lý', icon: Building2, route: '/admin/dealer-management' },
    { id: 'pricing', label: 'Giá & Khuyến mãi', icon: CreditCard, route: '/sections/pricing' },
    { id: 'analytics', label: 'Báo cáo & Phân tích', icon: BarChart3, route: '/sections/reports' },
    { id: 'forecasting', label: 'Dự báo nhu cầu', icon: BarChart3, route: '/sections/forecasting' },
  ];

  const getMenuItems = () => {
    console.log('Current user role:', user?.role);
    
    if (user?.role === 'admin') {
      return adminMenuItems;
    } else if (user?.role === 'evm_staff') {
      return evmMenuItems;
    } else {
      return dealerMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const handleMenuItemClick = (sectionId: string) => {
    onSectionChange(sectionId);
    
    // Navigate to specific routes
    const currentMenuItems = getMenuItems();
    const menuItem = currentMenuItems.find(item => item.id === sectionId);
    
    if (menuItem?.route) {
      console.log('Navigating to:', menuItem.route);
      navigate(menuItem.route);
      return;
    }
    
    // Fallback navigation
    console.log('Using fallback navigation for:', sectionId);
    switch (sectionId) {
      case 'vehicles':
        navigate('/portal/car');
        break;
      case 'sales':
        navigate('/portal/sales');
        break;
      case 'customers':
        navigate('/portal/customers');
        break;
      case 'staff-management':
        navigate('/portal/staff-management');
        break;
      case 'admin-staff-management':
        navigate('/admin/admin-staff-management');
        break;
      case 'product-management':
        navigate('/admin/product-management');
        break;
      case 'dealer-management':
        navigate('/admin/dealer-management');
        break;
      case 'inventory':
        navigate('/sections/inventory');
        break;
      case 'pricing':
        navigate('/sections/pricing');
        break;
      case 'analytics':
        navigate('/sections/reports');
        break;
      case 'forecasting':
        navigate('/sections/forecasting');
        break;
      default:
        console.warn('No route defined for section:', sectionId);
        break;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white z-50 transition-all duration-300 ease-in-out shadow-2xl ${
          isOpen 
            ? 'w-64 translate-x-0' 
            : 'w-16 -translate-x-full lg:translate-x-0'
        }`}
        onMouseEnter={() => !isOpen && onOpen()}
        onMouseLeave={() => isOpen && onClose()}
      >
        {/* Header */}
        <div className="h-[73px] px-4 border-b border-gray-700 flex items-center bg-gray-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Car className="h-8 w-8 text-green-500 flex-shrink-0" />
            <div className={`transition-all duration-300 ${
              isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 lg:opacity-0'
            }`}>
              <h1 className="text-lg font-bold whitespace-nowrap">VinFast EVM</h1>
              <p className="text-xs text-gray-400 whitespace-nowrap">
                {user?.role === 'admin' 
                  ? 'Admin Panel'
                  : user?.role === 'evm_staff'
                  ? 'EVM Management'
                  : 'Dealer Management'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          {/* Menu Title */}
          <div className={`px-3 mb-4 transition-all duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'
          }`}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {user?.role === 'admin' 
                ? 'Admin Menu'
                : user?.role === 'evm_staff'
                ? 'EVM Menu'
                : 'Portal Menu'
              }
            </h2>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`w-full group relative flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {/* Icon */}
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  } ${isOpen ? 'mr-3' : 'mx-auto'}`} />
                  
                  {/* Label */}
                  <span className={`whitespace-nowrap transition-all duration-300 ${
                    isOpen 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-4'
                  }`}>
                    {item.label}
                  </span>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-green-400 rounded-l-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};