import React, { useState } from 'react';
import { Bell, Search, User, Menu, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  isTransparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isTransparent = false }) => {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header className={`
      fixed top-0 right-0 z-40 w-full
      ${isTransparent 
        ? 'bg-transparent backdrop-blur-sm border-b border-white/10' 
        : 'bg-white border-b border-gray-200'
      }
      transition-all duration-300
    `}>
      <div className="h-[73px] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-lg transition-colors ${
              isTransparent 
                ? 'text-white hover:bg-white/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden md:block">
            <h1 className={`text-xl font-semibold ${
              isTransparent ? 'text-white' : 'text-gray-900'
            }`}>
              VinFast Dashboard
            </h1>
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