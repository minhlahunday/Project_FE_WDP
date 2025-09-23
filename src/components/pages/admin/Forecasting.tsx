import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, LineChart, TrendingUp, Users, DollarSign, Download, Filter, Clock, Car, CalendarClock } from 'lucide-react';
import { AdminLayout } from './AdminLayout';

// Chart component for demand trends
const DemandTrendChart = ({ formatNumber }: any) => {
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  
  // Actual data for past months
  const actualData = [120, 150, 180, 210, 230, 250, 280];
  
  // Forecasted data for future months
  const forecastData = [310, 330, 360, 390, 420];
  
  // Calculate max for Y-axis scale
  const maxValue = Math.max(...[...actualData, ...forecastData]) * 1.2;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Xu hướng nhu cầu xe điện</h3>
      <div className="h-80 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-4 w-16 flex flex-col justify-between text-xs text-gray-500 py-2">
          {[0, maxValue/4, maxValue/2, maxValue*3/4, maxValue].reverse().map((value, index) => (
            <div key={index} className="flex items-center">
              <span>{formatNumber(Math.round(value))}</span>
            </div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="ml-16 h-full flex flex-col">
          <div className="flex-1 relative border-l border-b border-gray-200">
            {/* Horizontal grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((position, index) => (
              <div 
                key={index} 
                className="absolute left-0 right-0 border-t border-gray-100"
                style={{ bottom: `${position * 100}%` }}
              />
            ))}
            
            {/* Vertical divider for actual vs forecast */}
            <div 
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-orange-400"
              style={{ left: `${(actualData.length / (actualData.length + forecastData.length)) * 100}%` }}
            >
              <div className="absolute -top-6 -translate-x-1/2 bg-orange-400 text-white px-2 py-0.5 rounded text-xs">
                Hiện tại
              </div>
            </div>
            
            {/* Data points and lines */}
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              {/* Actual data line */}
              <path
                d={actualData.map((value, index) => {
                  const x = (index / (actualData.length + forecastData.length - 1)) * 100;
                  const y = 100 - (value / maxValue) * 100;
                  return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                }).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Actual data points */}
              {actualData.map((value, index) => {
                const x = (index / (actualData.length + forecastData.length - 1)) * 100;
                const y = 100 - (value / maxValue) * 100;
                return (
                  <circle
                    key={`actual-${index}`}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#10b981"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
              
              {/* Forecast data line (dashed) */}
              <path
                d={[
                  ...actualData.slice(-1),
                  ...forecastData
                ].map((value, index) => {
                  const dataIndex = index === 0 ? actualData.length - 1 : actualData.length + index - 1;
                  const x = (dataIndex / (actualData.length + forecastData.length - 1)) * 100;
                  const y = 100 - (value / maxValue) * 100;
                  return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Forecast data points */}
              {forecastData.map((value, index) => {
                const x = ((actualData.length + index) / (actualData.length + forecastData.length - 1)) * 100;
                const y = 100 - (value / maxValue) * 100;
                return (
                  <circle
                    key={`forecast-${index}`}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="h-4 flex">
            {months.map((month, index) => (
              <div 
                key={index}
                className={`flex-1 text-center text-xs font-medium ${
                  index < actualData.length ? 'text-green-600' : 'text-blue-500'
                }`}
                style={{
                  opacity: index < actualData.length + forecastData.length ? 1 : 0.3
                }}
              >
                {month}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm text-gray-600">Dữ liệu thực tế</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm text-gray-600">Dự báo</span>
        </div>
      </div>
    </div>
  );
};

// Vehicle demand comparison
const VehicleComparisonChart = ({ formatNumber }: any) => {
  const models = [
    { id: 'vf6', name: 'VF 6', current: 120, forecast: 150, growth: 25 },
    { id: 'vf7', name: 'VF 7', current: 90, forecast: 110, growth: 22 },
    { id: 'vf8', name: 'VF 8', current: 170, forecast: 200, growth: 18 },
    { id: 'vf9', name: 'VF 9', current: 140, forecast: 180, growth: 29 },
  ];
  
  const maxValue = Math.max(...models.map(model => Math.max(model.current, model.forecast))) * 1.2;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">So sánh nhu cầu theo mẫu xe</h3>
      <div className="space-y-6">
        {models.map(model => (
          <div key={model.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="font-medium">{model.name}</div>
              <div className="text-sm font-medium text-green-600">+{model.growth}% dự kiến</div>
            </div>
            <div className="h-10 w-full flex items-center space-x-2">
              {/* Current */}
              <div className="h-full bg-green-500 rounded-l-md" style={{ width: `${(model.current / maxValue) * 100}%` }}>
                <div className="h-full flex items-center justify-end pr-2">
                  <span className="text-xs font-medium text-white">{formatNumber(model.current)}</span>
                </div>
              </div>
              
              {/* Forecast increase */}
              <div className="h-full bg-blue-500 rounded-r-md" style={{ width: `${((model.forecast - model.current) / maxValue) * 100}%` }}>
                <div className="h-full flex items-center justify-end pr-2">
                  <span className="text-xs font-medium text-white">{formatNumber(model.forecast - model.current)}</span>
                </div>
              </div>
              
              {/* Empty space */}
              <div className="flex-1"></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center mt-6 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm text-gray-600">Hiện tại</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm text-gray-600">Dự kiến tăng</span>
        </div>
      </div>
    </div>
  );
};

// Market factors influencing demand
const MarketFactorsTable = () => {
  const factors = [
    { name: 'Chính sách hỗ trợ xe điện', impact: 'Cao', trend: 'Tăng', description: 'Chính phủ đang mở rộng các ưu đãi thuế và trợ cấp cho xe điện' },
    { name: 'Giá nhiên liệu', impact: 'Cao', trend: 'Tăng', description: 'Giá xăng dầu tăng làm người dùng chuyển sang xe điện' },
    { name: 'Mạng lưới trạm sạc', impact: 'Trung bình', trend: 'Tăng', description: 'Số lượng trạm sạc đang được mở rộng trên toàn quốc' },
    { name: 'Chi phí pin xe điện', impact: 'Cao', trend: 'Giảm', description: 'Công nghệ pin đang phát triển, giúp giảm chi phí sản xuất' },
    { name: 'Nhận thức về môi trường', impact: 'Trung bình', trend: 'Tăng', description: 'Người dùng ngày càng quan tâm đến các phương tiện thân thiện với môi trường' },
  ];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Yếu tố thị trường ảnh hưởng đến nhu cầu</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4 font-medium text-gray-700">Yếu tố</th>
              <th className="text-left p-4 font-medium text-gray-700">Mức độ ảnh hưởng</th>
              <th className="text-left p-4 font-medium text-gray-700">Xu hướng</th>
              <th className="text-left p-4 font-medium text-gray-700">Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {factors.map((factor, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{factor.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    factor.impact === 'Cao' ? 'bg-red-100 text-red-800' : 
                    factor.impact === 'Trung bình' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {factor.impact}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    factor.trend === 'Tăng' ? 'bg-green-100 text-green-800' : 
                    factor.trend === 'Giảm' ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {factor.trend === 'Tăng' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {factor.trend === 'Giảm' && <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />}
                    {factor.trend}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{factor.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Regional demand forecast
const RegionalForecast = ({ formatNumber }: any) => {
  const regions = [
    { name: 'Miền Bắc', current: 450, forecast: 650, growth: 44 },
    { name: 'Miền Trung', current: 280, forecast: 380, growth: 36 },
    { name: 'Miền Nam', current: 520, forecast: 780, growth: 50 },
  ];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Dự báo nhu cầu theo khu vực</h3>
      <div className="grid grid-cols-3 gap-4">
        {regions.map((region, index) => (
          <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
            <h4 className="font-bold text-lg mb-2">{region.name}</h4>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">{formatNumber(region.forecast)}</span>
              <span className="text-sm text-green-600">+{region.growth}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Hiện tại: {formatNumber(region.current)} xe</p>
            <div className="h-2 w-full bg-gray-200 rounded-full mt-2">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(region.current / region.forecast) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Seasonal variation chart
const SeasonalVariationChart = () => {
  const seasons = ['Xuân', 'Hè', 'Thu', 'Đông'];
  const variations = [
    { name: 'Dòng xe sedan', values: [85, 95, 100, 90] },
    { name: 'Dòng xe SUV', values: [90, 80, 95, 105] },
  ];
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Biến động theo mùa</h3>
      <div className="h-60 relative">
        <div className="ml-12 h-full flex flex-col">
          <div className="flex-1 relative border-l border-b border-gray-200">
            {/* Horizontal grid lines */}
            {[80, 90, 100, 110].map((value, index) => (
              <div 
                key={index} 
                className="absolute left-0 right-0 border-t border-gray-100 flex items-center"
                style={{ bottom: `${(value - 80) * 3}%` }}
              >
                <span className="absolute -left-10 text-xs text-gray-500">{value}%</span>
              </div>
            ))}
            
            {/* Baselines at 100% */}
            <div 
              className="absolute left-0 right-0 border-t border-gray-400"
              style={{ bottom: `${(100 - 80) * 3}%` }}
            />
            
            {/* Data points and lines */}
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              {variations.map((variation, variationIndex) => (
                <React.Fragment key={variationIndex}>
                  <path
                    d={variation.values.map((value, index) => {
                      const x = ((index + 0.5) / seasons.length) * 100;
                      const y = 100 - ((value - 80) * 3);
                      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke={variationIndex === 0 ? "#10b981" : "#3b82f6"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {variation.values.map((value, index) => {
                    const x = ((index + 0.5) / seasons.length) * 100;
                    const y = 100 - ((value - 80) * 3);
                    return (
                      <circle
                        key={`point-${index}`}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="3"
                        fill={variationIndex === 0 ? "#10b981" : "#3b82f6"}
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="h-4 flex">
            {seasons.map((season, index) => (
              <div 
                key={index}
                className="flex-1 text-center text-xs font-medium text-gray-600"
              >
                {season}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center mt-4 space-x-6">
        {variations.map((variation, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              index === 0 ? "bg-green-500" : "bg-blue-500"
            }`}></div>
            <span className="text-sm text-gray-600">{variation.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Forecasting: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('year');

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('vi-VN', {
      notation: number > 999 ? 'compact' : 'standard',
      compactDisplay: 'short',
    }).format(number);
  };

  return (
    <AdminLayout activeSection="forecasting">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dự báo nhu cầu</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 text-sm font-medium"
          >
            <option value="quarter">Quý tới</option>
            <option value="year">Năm tới</option>
            <option value="2years">2 năm tới</option>
          </select>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 text-sm">
            <Download className="h-4 w-4" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Nhu cầu dự kiến</p>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">1,850</p>
          <p className="text-sm text-green-600 mt-1">+24% so với năm trước</p>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Tỷ lệ tăng trưởng</p>
            <div className="p-2 bg-blue-100 rounded-full">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">23.8%</p>
          <p className="text-sm text-blue-600 mt-1">+5.2% so với dự báo trước</p>
        </div>
        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Mẫu xe phổ biến</p>
            <div className="p-2 bg-purple-100 rounded-full">
              <Car className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">VF 8</p>
          <p className="text-sm text-purple-600 mt-1">Chiếm 31% thị phần</p>
        </div>
        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-600">Thời gian giao hàng</p>
            <div className="p-2 bg-orange-100 rounded-full">
              <CalendarClock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">45 ngày</p>
          <p className="text-sm text-orange-600 mt-1">-12% so với quý trước</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DemandTrendChart formatNumber={formatNumber} />
        <VehicleComparisonChart formatNumber={formatNumber} />
      </div>
      
      <div className="mb-6">
        <MarketFactorsTable />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegionalForecast formatNumber={formatNumber} />
        <SeasonalVariationChart />
      </div>
      </div>
    </AdminLayout>
  );
};
