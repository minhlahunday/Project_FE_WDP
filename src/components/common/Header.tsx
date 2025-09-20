import React, { useState, useRef } from 'react';
import { Bell, Search, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Fix import

interface HeaderProps {
  onMenuClick: () => void;
  isTransparent?: boolean;
  isSidebarOpen?: boolean; // Thêm prop mới
}

export const Header: React.FC<HeaderProps> = ({  isTransparent = false, isSidebarOpen = false }) => {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout>();
  const navigate = useNavigate(); // Fix: Use useNavigate hook directly

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
  };

  const handleMouseLeave = () => {
    tooltipTimeout.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200); // Giảm thời gian delay xuống 200ms
  };

  return (
    <header className={`
      fixed top-0 z-40
      transition-all duration-300 ease-in-out
      ${isTransparent 
        ? 'bg-transparent backdrop-blur-sm border-b border-white/10' 
        : 'bg-white border-b border-gray-200'
      }
      right-0 
      ${isSidebarOpen ? 'lg:left-64' : 'lg:left-16'}
    `}>
      <div className="h-[73px] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Nút menu đã được xóa */}
          
          {/* Chỉnh sửa phần Dashboard title và tooltip */}
          <div className="hidden md:block relative group">
            <h1 
              className={`text-xl font-semibold cursor-pointer ${
                isTransparent ? 'text-white' : 'text-gray-900'
              }`}
              onClick={() => navigate('/portal/dashboard')}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              VinFast Dashboard
            </h1>
            
            {/* Tooltip được cải thiện */}
            <div 
              className={`
                absolute left-1/2 -translate-x-1/2 transform
                px-3 py-1.5 rounded bg-gray-900 text-white text-sm
                transition-all duration-200 pointer-events-none
                ${showTooltip 
                  ? 'opacity-100 -bottom-10 translate-y-0' 
                  : 'opacity-0 -bottom-8 translate-y-1'
                }
                whitespace-nowrap z-50
              `}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 transform w-2 h-2 bg-gray-900 rotate-45" />
              Click để về trang chủ
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className={`p-2 rounded-lg transition-colors ${
            isTransparent 
              ? 'text-white hover:bg-white/10' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <Search className="h-5 w-5" />
          </button>
          
          <button className={`p-2 rounded-lg transition-colors ${
            isTransparent 
              ? 'text-white hover:bg-white/10' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <Bell className="h-5 w-5" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                isTransparent 
                  ? 'text-white hover:bg-white/10' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isTransparent 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-300 text-gray-700'
              }`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block font-medium">{user?.name || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};