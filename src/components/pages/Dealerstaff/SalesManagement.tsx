import React from 'react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';

export const SalesManagement: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeSection="sales"
        onSectionChange={() => {}}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
      />
      
      <Header
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <main className={`transition-all duration-300 pt-[73px] ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý bán hàng</h1>
            <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Tạo mới
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Báo giá tháng này</h3>
                <p className="text-2xl font-bold text-blue-900">24</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Đơn hàng thành công</h3>
                <p className="text-2xl font-bold text-green-900">18</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">Chờ giao xe</h3>
                <p className="text-2xl font-bold text-yellow-900">7</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Đã giao tháng này</h3>
                <p className="text-2xl font-bold text-purple-900">15</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">#1</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Nguyễn Văn An</td>
                    <td className="px-4 py-3 text-sm text-gray-900">VinFast VF 8</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">800.000.000 đ</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Chờ xác nhận
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800">
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
