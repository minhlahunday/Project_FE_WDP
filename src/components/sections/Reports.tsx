import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, Filter } from 'lucide-react';

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('sales');

  const formatPrice = (price: number) => {
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
    { name: 'Nguyễn Văn A', sales: 180000000, orders: 12 },
    { name: 'Trần Thị B', sales: 150000000, orders: 10 },
    { name: 'Lê Văn C', sales: 120000000, orders: 8 },
    { name: 'Phạm Thị D', sales: 95000000, orders: 6 },
  ];

  const reportTypes = [
    { id: 'sales', label: 'Doanh số bán hàng', icon: DollarSign },
    { id: 'staff', label: 'Hiệu suất nhân viên', icon: Users },
    { id: 'debt', label: 'Công nợ', icon: BarChart3 },
    { id: 'customer', label: 'Khách hàng', icon: Users },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
        <div className="flex space-x-4">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm này</option>
          </select>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                selectedReport === type.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Doanh thu tháng này</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(850000000)}</p>
              <p className="text-sm text-green-600">+12% so với tháng trước</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">36</p>
              <p className="text-sm text-blue-600">+8% so với tháng trước</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Khách hàng mới</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-sm text-purple-600">+15% so với tháng trước</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tỷ lệ chuyển đổi</p>
              <p className="text-2xl font-bold text-gray-900">68%</p>
              <p className="text-sm text-orange-600">+5% so với tháng trước</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Biểu đồ doanh số</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {salesData.map((data, index) => {
              const maxValue = Math.max(...salesData.map(d => d.value));
              const height = (data.value / maxValue) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center mb-2">
                    <div className="text-xs text-gray-600 transform -rotate-90 whitespace-nowrap">
                      {formatPrice(data.value)}
                    </div>
                  </div>
                  <div 
                    className="w-full bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-sm text-gray-700 mt-2 font-medium">
                    {data.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Staff */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Nhân viên xuất sắc</h3>
          <div className="space-y-4">
            {topStaff.map((staff, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{staff.name}</p>
                    <p className="text-sm text-gray-600">{staff.orders} đơn hàng</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatPrice(staff.sales)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Reports Table */}
      <div className="bg-white rounded-lg shadow-md mt-8">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Báo cáo chi tiết</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-gray-700">Nhân viên</th>
                <th className="text-left p-4 font-medium text-gray-700">Doanh số</th>
                <th className="text-left p-4 font-medium text-gray-700">Đơn hàng</th>
                <th className="text-left p-4 font-medium text-gray-700">Khách hàng mới</th>
                <th className="text-left p-4 font-medium text-gray-700">Tỷ lệ thành công</th>
                <th className="text-left p-4 font-medium text-gray-700">Thưởng</th>
              </tr>
            </thead>
            <tbody>
              {topStaff.map((staff, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{staff.name}</td>
                  <td className="p-4 text-green-600 font-medium">{formatPrice(staff.sales)}</td>
                  <td className="p-4">{staff.orders}</td>
                  <td className="p-4">{Math.floor(Math.random() * 10) + 5}</td>
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
    </div>
  );
};