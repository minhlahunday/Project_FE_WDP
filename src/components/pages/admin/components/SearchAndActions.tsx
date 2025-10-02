import React from "react";
import { Search, Plus } from "lucide-react";

interface SearchAndActionsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddStaff: () => void;
}

export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  searchTerm,
  onSearchChange,
  onAddStaff,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Add Staff Button */}
        <button
          onClick={onAddStaff}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Thêm nhân viên</span>
        </button>
      </div>
    </div>
  );
};
