import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../admin/AdminLayout';
import { get } from '../../../services/httpClient';
import { useAuth } from '../../../contexts/AuthContext';
import Swal from 'sweetalert2';

interface Customer {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  occupation?: string;
  income_level?: string;
  preferred_contact_method?: string;
  notes?: string;
  created_by: string;
  dealership_id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface CustomerResponse {
  success: boolean;
  message: string;
  data: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    data: Customer[];
  };
}

export const CustomerManagement: React.FC = () => {
	const { user } = useAuth();
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [totalCustomers, setTotalCustomers] = useState<number>(0);

	// Fetch customers from API
	const fetchCustomers = async (page: number = 1, searchQuery: string = '') => {
		try {
			setIsLoading(true);
			let queryParams = `?page=${page}&limit=10`;
			if (searchQuery.trim()) {
				queryParams += `&q=${encodeURIComponent(searchQuery.trim())}`;
			}
			
			const res = await get<CustomerResponse>(`/api/customers/yourself${queryParams}`);
			if (res.success && res.data) {
				setCustomers(res.data.data);
				setTotalPages(res.data.totalPages);
				setTotalCustomers(res.data.total);
			} else {
				throw new Error('Invalid data format from API');
			}
		} catch (err) {
			Swal.fire({
				toast: true,
				position: 'top-end',
				icon: 'error',
				title: 'Lỗi',
				text: 'Không thể tải danh sách khách hàng. Vui lòng thử lại sau.',
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: true
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Handle search
	const handleSearch = (value: string) => {
		setSearchTerm(value);
		setCurrentPage(1);
		fetchCustomers(1, value);
	};

	// Handle page change
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		fetchCustomers(page, searchTerm);
	};

	// Load customers on component mount
	useEffect(() => {
		fetchCustomers();
	}, []);

	// Filter customers locally for immediate UI response
	const filteredCustomers = customers.filter(customer =>
		customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
		customer.phone.includes(searchTerm)
	);

	return (
		<AdminLayout activeSection="customer-management">
			<div className="min-h-screen bg-gray-50">
				{/* Page Header */}
				<div className="bg-white border-b border-gray-200 px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
							<p className="text-sm text-gray-600 mt-1">
								Tổng số {totalCustomers} khách hàng
							</p>
						</div>
					</div>
				</div>

				<div className="p-6">
					{/* Search Bar */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
						<div className="flex items-center gap-3">
							<div className="relative flex-1 max-w-md">
								<svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								<input
									type="text"
									placeholder="Tìm kiếm theo tên, email, số điện thoại..."
									value={searchTerm}
									onChange={e => handleSearch(e.target.value)}
									className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>
					</div>

					{/* Loading State */}
					{isLoading && (
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
							<div className="flex items-center justify-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								<span className="ml-3 text-gray-600">Đang tải danh sách khách hàng...</span>
							</div>
						</div>
					)}

					{/* Customer Grid */}
					{!isLoading && (
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
							{filteredCustomers.length === 0 ? (
								<div className="p-12 text-center">
									<svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
									<p className="text-gray-600 mb-4">Không có khách hàng nào phù hợp với bộ lọc hiện tại.</p>
									<button
										onClick={() => handleSearch('')}
										className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium"
									>
										Xóa bộ lọc
									</button>
								</div>
							) : (
								<>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
										{filteredCustomers.map(customer => (
											<div key={customer._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
												<div className="mb-4">
													<div className="flex items-center justify-between mb-2">
														<span className="font-bold text-lg text-gray-900">{customer.full_name}</span>
														<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
															customer.isActive
																? 'bg-emerald-50 text-emerald-700 border-emerald-200'
																: 'bg-rose-50 text-rose-700 border-rose-200'
														}`}>
															<span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
																customer.isActive ? 'bg-emerald-500' : 'bg-rose-500'
															}`}></span>
															{customer.isActive ? 'Hoạt động' : 'Không hoạt động'}
														</span>
													</div>
													<div className="space-y-1 text-sm text-gray-600">
														<div className="flex items-center gap-2">
															<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
															</svg>
															<span>{customer.email}</span>
														</div>
														<div className="flex items-center gap-2">
															<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
															</svg>
															<span>{customer.phone}</span>
														</div>
														{customer.address && (
															<div className="flex items-center gap-2">
																<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
																</svg>
																<span className="truncate">{customer.address}</span>
															</div>
														)}
														{customer.occupation && (
															<div className="flex items-center gap-2">
																<svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
																</svg>
																<span>{customer.occupation}</span>
															</div>
														)}
													</div>
												</div>
												<div className="flex gap-2">
													<button
														className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-blue-200"
														onClick={() => setSelectedCustomer(customer)}
													>
														Xem chi tiết
													</button>
												</div>
											</div>
										))}
									</div>

									{/* Pagination */}
									{totalPages > 1 && (
										<div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
											<div className="text-sm text-gray-600">
												Hiển thị <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> đến{' '}
												<span className="font-medium">{Math.min(currentPage * 10, totalCustomers)}</span> trong tổng số{' '}
												<span className="font-medium">{totalCustomers}</span> khách hàng
											</div>
											<div className="flex items-center gap-2">
												<button
													disabled={currentPage === 1}
													onClick={() => handlePageChange(currentPage - 1)}
													className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
														currentPage === 1
															? 'text-gray-300 border-gray-200 cursor-not-allowed'
															: 'text-gray-700 border-gray-300 hover:bg-gray-50'
													}`}
												>
													Trước
												</button>
												<span className="text-sm text-gray-600">
													Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
												</span>
												<button
													disabled={currentPage === totalPages}
													onClick={() => handlePageChange(currentPage + 1)}
													className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
														currentPage === totalPages
															? 'text-gray-300 border-gray-200 cursor-not-allowed'
															: 'text-gray-700 border-gray-300 hover:bg-gray-50'
													}`}
												>
													Sau
												</button>
											</div>
										</div>
									)}
								</>
							)}
						</div>
					)}
				</div>

				{/* Modal: Chi tiết khách hàng */}
				{selectedCustomer && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-2xl font-bold text-gray-900">Thông tin chi tiết khách hàng</h2>
								<button
									className="text-gray-500 hover:text-gray-700 text-2xl"
									onClick={() => setSelectedCustomer(null)}
								>✕</button>
							</div>
							
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Họ và tên</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.full_name}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Email</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.email}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Số điện thoại</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.phone}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Giới tính</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.gender || 'Chưa cập nhật'}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Ngày sinh</span>
									<p className="text-sm text-gray-900 mt-1">
										{selectedCustomer.date_of_birth 
											? new Date(selectedCustomer.date_of_birth).toLocaleDateString('vi-VN')
											: 'Chưa cập nhật'
										}
									</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Nghề nghiệp</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.occupation || 'Chưa cập nhật'}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Mức thu nhập</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.income_level || 'Chưa cập nhật'}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Phương thức liên hệ ưa thích</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.preferred_contact_method || 'Chưa cập nhật'}</p>
								</div>
								<div className="col-span-2">
									<span className="text-xs font-medium text-gray-500 uppercase">Địa chỉ</span>
									<p className="text-sm text-gray-900 mt-1">{selectedCustomer.address || 'Chưa cập nhật'}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Trạng thái</span>
									<p className="text-sm text-gray-900 mt-1">
										<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
											selectedCustomer.isActive
												? 'bg-emerald-50 text-emerald-700 border-emerald-200'
												: 'bg-rose-50 text-rose-700 border-rose-200'
										}`}>
											<span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
												selectedCustomer.isActive ? 'bg-emerald-500' : 'bg-rose-500'
											}`}></span>
											{selectedCustomer.isActive ? 'Hoạt động' : 'Không hoạt động'}
										</span>
									</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Ngày tạo</span>
									<p className="text-sm text-gray-900 mt-1">{new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}</p>
								</div>
								<div>
									<span className="text-xs font-medium text-gray-500 uppercase">Ngày cập nhật</span>
									<p className="text-sm text-gray-900 mt-1">{new Date(selectedCustomer.updatedAt).toLocaleDateString('vi-VN')}</p>
								</div>
								{selectedCustomer.notes && (
									<div className="col-span-2">
										<span className="text-xs font-medium text-gray-500 uppercase">Ghi chú</span>
										<p className="text-sm text-gray-900 mt-1">{selectedCustomer.notes}</p>
									</div>
								)}
							</div>
							
							<button
								onClick={() => setSelectedCustomer(null)}
								className="bg-blue-600 text-white px-6 py-2.5 rounded-lg mt-6 hover:bg-blue-700 w-full font-medium transition-colors"
							>
								Đóng
							</button>
						</div>
					</div>
				)}
			</div>
		</AdminLayout>
	);
};
