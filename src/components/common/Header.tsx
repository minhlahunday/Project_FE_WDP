import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Car } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 fixed top-0 right-0 left-0 z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>

          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-lg font-bold">VinFast EVM</h1>
            </div>
          </div>

          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-sm text-gray-500">{user?.role || 'Role'}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <User className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};