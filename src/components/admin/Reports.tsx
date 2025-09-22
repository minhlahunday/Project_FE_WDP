import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, DollarSign, Download, FileText } from 'lucide-react';
import { mockCustomers } from '../../data/mockData';
import { AdminLayout } from './AdminLayout';

// Báo cáo Doanh số
const SalesReport = ({ formatPrice, salesData, hoveredBar, setHoveredBar }: any) => {
  const maxValue = Math.max(...salesData.map((d: any) => d.value));
  const yAxisLabels = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Biểu đồ doanh số 6 tháng gần nhất</h3>
      <div className="h-80 flex space-x-4">
        <div className="flex flex-col justify-between h-full text-xs text-gray-500 py-4">
          {yAxisLabels.slice().reverse().map((label, i) => (
            <span key={i}>{formatPrice(label, true)}</span>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-6 gap-4 border-l border-gray-200 pl-4">
          {salesData.map((data: any, index: number) => {
            const height = (data.value / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center justify-end h-full group"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div className="relative w-full h-full flex items-end">
                  <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs transition-opacity duration-200 ${hoveredBar === index ? 'opacity-100' : 'opacity-0'}`}>
                    {formatPrice(data.value)}
                  </div>
                  <div 
                    className="w-full bg-green-400 rounded-t-md transition-all duration-300 ease-out group-hover:bg-green-500"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-700 mt-2 font-medium">
                  {data.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Báo cáo Nhân viên
const StaffReport = ({ formatPrice, topStaff }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Hiệu suất nhân viên</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-4 font-medium text-gray-700">Nhân viên</th>
            <th className="text-left p-4 font-medium text-gray-700">Doanh số</th>
            <th className="text-left p-4 font-medium text-gray-700">Đơn hàng</th>
            <th className="text-left p-4 font-medium text-gray-700">Tỷ lệ thành công</th>
            <th className="text-left p-4 font-medium text-gray-700">Thưởng</th>
          </tr>
        </thead>
        <tbody>
          {topStaff.map((staff: any, index: number) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <div className="flex items-center space-x-3">
                  <img src={staff.avatar} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-medium">{staff.name}</span>
                </div>
              </td>
              <td className="p-4 text-green-600 font-medium">{formatPrice(staff.sales)}</td>
              <td className="p-4">{staff.orders}</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {Math.floor(Math.random() * 20) + 70}%
                </span>
              </td>
              <td className="p-4 text-orange-600 font-medium">
                {formatPrice(staff.sales * 0.02)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Báo cáo Công nợ
const DebtReport = ({ formatPrice }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Báo cáo công nợ khách hàng</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-4 font-medium text-gray-700">Khách hàng</th>
            <th className="text-left p-4 font-medium text-gray-700">Số điện thoại</th>
            <th className="text-left p-4 font-medium text-gray-700">Tổng mua</th>
            <th className="text-left p-4 font-medium text-gray-700">Công nợ</th>
            <th className="text-left p-4 font-medium text-gray-700">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {mockCustomers
            .filter(customer => customer.debt !== undefined)
            .map((customer, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-4 font-medium">{customer.name}</td>
              <td className="p-4">{customer.phone}</td>
              <td className="p-4">{formatPrice(customer.totalSpent || 0)}</td>
              <td className="p-4 text-red-600 font-medium">{formatPrice(customer.debt || 0)}</td>
              <td className="p-4">
                {(customer.debt || 0) > 0 ? (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Cần thu
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Hoàn thành
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Báo cáo Khách hàng
const CustomerReport = ({ formatPrice }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">Báo cáo khách hàng tiềm năng</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-4 font-medium text-gray-700">Khách hàng</th>
            <th className="text-left p-4 font-medium text-gray-700">Email</th>
            <th className="text-left p-4 font-medium text-gray-700">Lần cuối mua</th>
            <th className="text-left p-4 font-medium text-gray-700">Tổng chi tiêu</th>
            <th className="text-left p-4 font-medium text-gray-700">Phân loại</th>
          </tr>
        </thead>
        <tbody>
          {mockCustomers
            .filter(customer => customer.totalSpent !== undefined)
            .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
            .map((customer, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="p-4 font-medium">{customer.name}</td>
              <td className="p-4">{customer.email}</td>
              <td className="p-4">{customer.lastPurchaseDate}</td>
              <td className="p-4 text-green-600 font-medium">{formatPrice(customer.totalSpent || 0)}</td>
              <td className="p-4">
                {(customer.totalSpent || 0) > 1000000000 ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    VIP
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Thân thiết
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);


export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('sales');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const formatPrice = (price: number, compact = false) => {
    if (compact) {
      return new Intl.NumberFormat('vi-VN', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(price);
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const salesData = [
    { month: 'T1', value: 450000000 },
    { month: 'T2', value: 520000000 },
    { month: 'T3', value: 480000000 },
    { month: 'T4', value: 630000000 },
    { month: 'T5', value: 720000000 },
    { month: 'T6', value: 850000000 },
  ];

  const topStaff = [
    { name: 'Nguyễn Văn A', sales: 180000000, orders: 12, avatar: 'https://i.pravatar.cc/150?u=a' },
    { name: 'Trần Thị B', sales: 150000000, orders: 10, avatar: 'https://i.pravatar.cc/150?u=b' },
    { name: 'Lê Văn C', sales: 120000000, orders: 8, avatar: 'https://i.pravatar.cc/150?u=c' },
    { name: 'Phạm Thị D', sales: 95000000, orders: 6, avatar: 'https://i.pravatar.cc/150?u=d' },
  ];

  const reportTypes = [
    { id: 'sales', label: 'Doanh số', icon: DollarSign },
    { id: 'staff', label: 'Nhân viên', icon: Users },
    { id: 'debt', label: 'Công nợ', icon: FileText },
    { id: 'customer', label: 'Khách hàng', icon: Users },
  ];

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'sales':
        return <SalesReport formatPrice={formatPrice} salesData={salesData} hoveredBar={hoveredBar} setHoveredBar={setHoveredBar} />;
      case 'staff':
        return <StaffReport formatPrice={formatPrice} topStaff={topStaff} />;
      case 'debt':
        return <DebtReport formatPrice={formatPrice} />;
      case 'customer':
        return <CustomerReport formatPrice={formatPrice} />;
      default:
        return <SalesReport formatPrice={formatPrice} salesData={salesData} hoveredBar={hoveredBar} setHoveredBar={setHoveredBar} />;
    }
  };

  return (
    <AdminLayout activeSection="analytics">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 text-sm font-medium"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm này</option>
          </select>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 text-sm">
            <Download className="h-4 w-4" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200/70 p-1 rounded-lg w-fit">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedReport === type.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Doanh thu</p>
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatPrice(850000000)}</p>
          <p className="text-sm text-green-600 mt-1">+12% so với tháng trước</p>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Đơn hàng</p>
            <div className="p-2 bg-blue-100 rounded-full">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">36</p>
          <p className="text-sm text-blue-600 mt-1">+8% so với tháng trước</p>
        </div>
        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Khách hàng mới</p>
            <div className="p-2 bg-purple-100 rounded-full">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
          <p className="text-sm text-purple-600 mt-1">+15% so với tháng trước</p>
        </div>
        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Tỷ lệ chuyển đổi</p>
            <div className="p-2 bg-orange-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">68%</p>
          <p className="text-sm text-orange-600 mt-1">+5% so với tháng trước</p>
        </div>
      </div>

      {/* Dynamic Report Content */}
      <div>
        {renderReportContent()}
      </div>
    </AdminLayout>
  );
};