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
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void; // Thêm prop onOpen
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose, onOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();  // Add this to use navigation

  const dealerMenuItems = [
    { id: 'vehicles', label: 'Danh mục xe', icon: Car },
    { id: 'sales', label: 'Quản lý bán hàng', icon: ShoppingCart },
    { id: 'customers', label: 'Quản lý khách hàng', icon: Users },
    { id: 'test-drives', label: 'Lịch lái thử', icon: Calendar },
    { id: 'orders', label: 'Đơn hàng', icon: FileText },
    { id: 'payments', label: 'Thanh toán', icon: CreditCard },
    { id: 'feedback', label: 'Phản hồi', icon: MessageSquare },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  ];

  const evmMenuItems = [
    { id: 'vehicles', label: 'Danh mục xe', icon: Car, route: '/portal/car' },
    { id: 'product-management', label: 'Quản lý sản phẩm', icon: Package, route: '/admin/product-management' },
    { id: 'inventory', label: 'Tồn kho', icon: Car, route: '/sections/inventory' },
    { id: 'dealer-management', label: 'Quản lý đại lý', icon: Building2, route: '/admin/dealer-management' },
    { id: 'pricing', label: 'Giá & Khuyến mãi', icon: CreditCard, route: '/sections/product-management' },
    { id: 'analytics', label: 'Báo cáo & Phân tích', icon: BarChart3, route: '/sections/reports' },
    { id: 'forecasting', label: 'Dự báo nhu cầu', icon: BarChart3, route: '/sections/forecasting' },
  ];

  const menuItems = user?.role === 'evm_staff' || user?.role === 'admin' ? evmMenuItems : dealerMenuItems;

  const handleMenuItemClick = (sectionId: string) => {
    onSectionChange(sectionId);
    
    // Navigate to specific routes for admin/EVM staff
    if (user?.role === 'evm_staff' || user?.role === 'admin') {
      const menuItem = evmMenuItems.find(item => item.id === sectionId);
      if (menuItem?.route) {
        navigate(menuItem.route);
        return;
      }
    }
    
    // Handle specific section changes for dashboard
    switch (sectionId) {
      case 'vehicles':
        navigate('/portal/car');
        break;
      case 'forecasting':
        navigate('/portal/forecasting');
        break;
      case 'product-management':
      case 'inventory':
      case 'dealer-management':
      case 'pricing':
      case 'analytics':
        // These will be handled by the dashboard sections
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 bg-gray-900/80 backdrop-blur-sm text-white w-64 h-screen overflow-y-auto transform transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-0 lg:w-16'
        }`}
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-white/10 h-[73px] flex items-center">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Car className="h-8 w-8 text-green-500 flex-shrink-0" />
            <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'lg:opacity-0'}`}>
              <h1 className="text-lg font-bold whitespace-nowrap">VinFast EVM</h1>
              <p className="text-sm text-white/70 whitespace-nowrap">Dealer Management</p>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="p-4">
          <div className={`mb-6 transition-all duration-300 ${isOpen ? 'w-full' : 'lg:w-8 mx-auto'}`}>
            <h2 className={`text-sm font-semibold text-white/50 uppercase tracking-wider px-2 transition-opacity ${isOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'}`}>Menu</h2>
            <div className={`w-full h-px bg-white/20 mt-2 transition-opacity ${isOpen ? 'opacity-0' : 'lg:opacity-100'}`}></div>
          </div>
          
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-green-600/90 to-green-500/90 text-white shadow-lg shadow-green-600/20'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  } ${!isOpen && 'lg:justify-center'}`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform ${
                    activeSection === item.id ? 'scale-110' : ''
                  }`} />
                  <span className={`font-semibold transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};