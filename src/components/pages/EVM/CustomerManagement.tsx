import React, { useState } from 'react';
import { AdminLayout } from '../admin/AdminLayout';
import { mockCustomers, mockDealers, mockVehicles } from '../../../data/mockData';
import { Customer } from '../../../types';

export const CustomerManagement: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	// Lọc khách hàng theo tên, email, số điện thoại
	const filteredCustomers = mockCustomers.filter(customer =>
		customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
		customer.phone.includes(searchTerm)
	);

	return (
		<AdminLayout activeSection="customer-management">
			<div className="p-6">
				<h1 className="text-3xl font-bold mb-6 text-gray-900">Danh sách khách hàng toàn hệ thống</h1>
				<div className="mb-6 max-w-md">
					<input
						type="text"
						placeholder="Tìm kiếm khách hàng..."
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredCustomers.map(customer => (
						<div key={customer.id} className="bg-white rounded-lg shadow p-6">
							<div className="mb-2">
								<span className="font-bold text-lg text-gray-900">{customer.name}</span>
								<div className="text-sm text-gray-600">{customer.email}</div>
								<div className="text-sm text-gray-600">{customer.phone}</div>
								<div className="text-sm text-gray-600">{customer.address}</div>
							</div>
							<button
								className="mt-2 text-blue-600 hover:underline text-sm"
								onClick={() => setSelectedCustomer(customer)}
							>
								Xem lịch sử giao dịch
							</button>
						</div>
					))}
				</div>

				{/* Modal: Lịch sử giao dịch giữa khách hàng và đại lý */}
				{selectedCustomer && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg max-w-2xl w-full p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-bold text-gray-900">Lịch sử giao dịch của {selectedCustomer.name}</h2>
								<button
									className="text-gray-500 hover:text-gray-700"
									onClick={() => setSelectedCustomer(null)}
								>✕</button>
							</div>
							{/* Hiển thị lịch sử đơn hàng và lái thử */}
											<div className="mb-4">
												<h3 className="font-semibold mb-2">Đơn hàng</h3>
												{selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
													<ul className="list-disc pl-5">
														{selectedCustomer.orders.map((order, idx) => {
															const dealer = mockDealers.find(d => d.id === order.dealerId);
															const vehicle = mockVehicles.find(v => v.id === order.vehicleId);
															return (
																<li key={idx} className="mb-1 text-gray-700">
																	Đại lý: {dealer?.name || 'N/A'} | Xe: {vehicle?.model || 'N/A'} | Ngày: {order.createdAt || 'N/A'}
																</li>
															);
														})}
													</ul>
												) : (
													<div className="text-gray-500">Chưa có đơn hàng nào</div>
												)}
											</div>
											<div>
												<h3 className="font-semibold mb-2">Lịch sử lái thử</h3>
												{selectedCustomer.testDrives && selectedCustomer.testDrives.length > 0 ? (
													<ul className="list-disc pl-5">
														{selectedCustomer.testDrives.map((drive, idx) => {
															const vehicle = mockVehicles.find(v => v.id === drive.vehicleId);
															return (
																<li key={idx} className="mb-1 text-gray-700">
																	Xe: {vehicle?.model || 'N/A'} | Ngày: {drive.date || 'N/A'}
																</li>
															);
														})}
													</ul>
												) : (
													<div className="text-gray-500">Chưa có lịch lái thử nào</div>
												)}
											</div>
						</div>
					</div>
				)}
			</div>
		</AdminLayout>
	);
};
