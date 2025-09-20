import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, X } from 'lucide-react';
import { mockMotorbikes } from '../../../data/mockData';
import { Vehicle } from '../../../types';

export const CompareMotorbikes: React.FC = () => {
  const navigate = useNavigate();
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddVehicle = (vehicle: Vehicle) => {
    if (selectedVehicles.length < 3) {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  };

  const handleRemoveVehicle = (vehicleId: string) => {
    setSelectedVehicles(selectedVehicles.filter(v => v.id !== vehicleId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Trở lại
          </button>
          <h1 className="text-4xl font-light text-gray-900">So sánh xe máy điện</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Vehicle Selector */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Chọn xe để so sánh ({selectedVehicles.length}/3)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockMotorbikes.map(vehicle => (
              <button
                key={vehicle.id}
                onClick={() => handleAddVehicle(vehicle)}
                disabled={selectedVehicles.length >= 3 || selectedVehicles.some(v => v.id === vehicle.id)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  selectedVehicles.some(v => v.id === vehicle.id)
                    ? 'border-green-500 bg-green-50'
                    : selectedVehicles.length >= 3
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-blue-500'
                }`}
              >
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.model}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <h3 className="font-medium">{vehicle.model}</h3>
                <p className="text-sm text-gray-600">{vehicle.version}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        {selectedVehicles.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-4">
              {/* Headers */}
              <div className="p-6 bg-gray-100">
                <h3 className="font-bold text-gray-900">Thông số</h3>
              </div>
              {selectedVehicles.map(vehicle => (
                <div key={vehicle.id} className="p-6 bg-gray-100 relative">
                  <button
                    onClick={() => handleRemoveVehicle(vehicle.id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <img
                    src={vehicle.images[0]}
                    alt={vehicle.model}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <h3 className="font-bold">{vehicle.model}</h3>
                </div>
              ))}
              {/* Empty columns */}
              {Array.from({ length: 3 - selectedVehicles.length }).map((_, i) => (
                <div key={i} className="p-6 bg-gray-100 border-l border-gray-200">
                  <div className="flex items-center justify-center h-32 bg-gray-200 rounded-lg mb-2">
                    <Bike className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-center">Chọn xe để so sánh</p>
                </div>
              ))}

              {/* Comparison rows */}
              {[
                { label: 'Giá bán', key: 'price', format: formatPrice },
                { label: 'Phiên bản', key: 'version' },
                { label: 'Màu sắc', key: 'color' },
                { label: 'Tầm hoạt động', key: 'range', suffix: ' km' },
                { label: 'Tốc độ tối đa', key: 'maxSpeed', suffix: ' km/h' },
                { label: 'Thời gian sạc', key: 'chargingTime' },
                { label: 'Tồn kho', key: 'stock', suffix: ' xe' }
              ].map(({ label, key, format, suffix = '' }) => (
                <React.Fragment key={key}>
                  <div className="p-6 border-t border-gray-200 font-medium">
                    {label}
                  </div>
                  {selectedVehicles.map(vehicle => (
                    <div key={vehicle.id} className="p-6 border-t border-l border-gray-200">
                      {format
                        ? format(vehicle[key as keyof Vehicle] as number)
                        : vehicle[key as keyof Vehicle] + suffix}
                    </div>
                  ))}
                  {Array.from({ length: 3 - selectedVehicles.length }).map((_, i) => (
                    <div key={i} className="p-6 border-t border-l border-gray-200">
                      -
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
