import React from 'react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';

export const CustomerManagement: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeSection="customers"
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
            <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Thêm khách hàng
            </button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customer Card 1 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Nguyễn Văn An</h3>
                <div className="flex space-x-2">
                  <button className="text-green-600 hover:text-green-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </button>
                  <button className="text-blue-600 hover:text-blue-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">📧 an.nguyen@email.com</p>
                <p className="text-sm text-gray-600">📞 0901234567</p>
                <p className="text-sm text-gray-600">📍 Hà Nội</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Đơn hàng</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Lái thử</p>
                </div>
                <div className="text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    VIP
                  </span>
                  <p className="text-xs text-gray-500">Hạng</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-black text-white py-2 px-3 rounded text-sm hover:bg-gray-800">
                  📋 Đặt lịch
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200">
                  💬 Nhắn tin
                </button>
              </div>
            </div>

            {/* Customer Card 2 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Trần Thị Bình</h3>
                <div className="flex space-x-2">
                  <button className="text-green-600 hover:text-green-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </button>
                  <button className="text-blue-600 hover:text-blue-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">📧 binh.tran@email.com</p>
                <p className="text-sm text-gray-600">📞 0902345678</p>
                <p className="text-sm text-gray-600">📍 TP.HCM</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Đơn hàng</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Lái thử</p>
                </div>
                <div className="text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    VIP
                  </span>
                  <p className="text-xs text-gray-500">Hạng</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-black text-white py-2 px-3 rounded text-sm hover:bg-gray-800">
                  📋 Đặt lịch
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200">
                  💬 Nhắn tin
                </button>
              </div>
            </div>

            {/* Customer Card 3 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lê Hoàng Dũng</h3>
                <div className="flex space-x-2">
                  <button className="text-green-600 hover:text-green-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </button>
                  <button className="text-blue-600 hover:text-blue-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">📧 dung.le@email.com</p>
                <p className="text-sm text-gray-600">📞 0912345679</p>
                <p className="text-sm text-gray-600">📍 Đà Nẵng</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Đơn hàng</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Lái thử</p>
                </div>
                <div className="text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    VIP
                  </span>
                  <p className="text-xs text-gray-500">Hạng</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-black text-white py-2 px-3 rounded text-sm hover:bg-gray-800">
                  📋 Đặt lịch
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200">
                  💬 Nhắn tin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
