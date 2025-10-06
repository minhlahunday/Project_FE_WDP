import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Phone, Mail, MoreVertical, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminLayout } from '../admin/AdminLayout';
import { get, patch } from '../../../services/httpClient';
import ReactModal from 'react-modal';
import { useNavigate } from 'react-router-dom';

interface AddressObject {
  street: string;
  district: string;
  city: string;
  province: string;
  full_address: string;
}

interface ContactObject {
  phone: string;
  email: string;
  hotline: string;
}

interface ContractObject {
  contract_number: string;
  signed_date: string;
  expiry_date: string;
  territory: string;
  exclusive_territory: boolean;
  business_license: string;
  legal_representative: string;
}

interface CapabilitiesObject {
  dealer_level: string;
  product_distribution: string;
  services: {
    vehicle_sales: boolean;
    test_drive: boolean;
    spare_parts_sales: boolean;
  };
  showroom_area: number;
  display_capacity: number;
  total_staff: number;
  sales_staff: number;
  support_staff: number;
}

interface Dealer {
  _id: string;
  code: string;
  company_name: string;
  business_license: string;
  tax_code: string;
  legal_representative: string;
  manufacturer_id: string;
  dealer_level: string;
  product_distribution: string;
  status: string;
  isActive: boolean;
  created_by: string;
  notes: string;
  address: AddressObject;
  contact: ContactObject;
  contract: ContractObject;
  capabilities: CapabilitiesObject;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export const AdminDealerManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'company_name' | 'code' | 'status' | 'createdAt'>('company_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Helper function to format address
  const formatAddress = (address: string | AddressObject): string => {
    if (typeof address === 'string') return address;
    return address.full_address || `${address.street}, ${address.district}, ${address.city}, ${address.province}`;
  };

  const [viewingDealer, setViewingDealer] = useState<Dealer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDealerId, setDeleteDealerId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [reason, setReason] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch dealers from API
  const fetchDealers = async () => {
    try {
      setIsLoading(true);
      let queryParams = '';
      if (statusFilter === 'active') {
        queryParams = '?isActive=true';
      } else if (statusFilter === 'inactive') {
        queryParams = '?isActive=false';
      }
      const res = await get<{ success: boolean; data: { data: Dealer[] } }>(`/api/dealerships${queryParams}`);
      if (res.success && Array.isArray(res.data.data)) {
        setDealers(res.data.data);
        setError(null);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err) {
      setError('Không thể tải danh sách đại lý. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (dealer: Dealer) => {
    navigate(`/admin/dealer-management/edit/${dealer._id}`);
  };

  const handleViewDetails = (dealer: Dealer) => {
    setViewingDealer(dealer);
  };

  const closeViewDetails = () => {
    setViewingDealer(null);
  };

  const handleDeactivate = async (dealerId: string, reason?: string) => {
    try {
      const res = await patch<{ success: boolean; message: string }>(`/api/dealerships/${dealerId}/deactivate`, {
        reason: reason || 'Ngừng hợp tác theo yêu cầu'
      });
      if (res.success) {
        setSuccess('Đại lý đã được đánh dấu ngừng hợp tác thành công!');
        setError(null);
        fetchDealers();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setError('Không thể đánh dấu ngừng hợp tác đại lý. Vui lòng thử lại sau.');
      setSuccess(null);
    }
  };

  const handleActivate = async (dealerId: string, reason?: string) => {
    try {
      const res = await patch<{ success: boolean; message: string }>(`/api/dealerships/${dealerId}/activate`, {
        reason: reason || 'Kích hoạt lại theo yêu cầu'
      });
      if (res.success) {
        setSuccess('Đại lý đã được kích hoạt lại thành công!');
        setError(null);
        fetchDealers();
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setError('Không thể kích hoạt lại đại lý. Vui lòng thử lại sau.');
      setSuccess(null);
    }
  };

  const confirmAction = (dealerId: string, type: 'deactivate' | 'activate') => {
    setDeleteDealerId(dealerId);
    setActionType(type);
    setReason('');
    setShowDeleteModal(true);
  };

  const handleConfirmAction = async () => {
    if (deleteDealerId && actionType) {
      if (actionType === 'deactivate') {
        await handleDeactivate(deleteDealerId, reason);
      } else if (actionType === 'activate') {
        await handleActivate(deleteDealerId, reason);
      }
      setShowDeleteModal(false);
      setDeleteDealerId(null);
      setActionType(null);
      setReason('');
    }
  };

  useEffect(() => {
    fetchDealers();
    setCurrentPage(1);
  }, [statusFilter]);

  // Set app element for react-modal accessibility
  useEffect(() => {
    ReactModal.setAppElement('body');
  }, []);

  // Derived lists: filtered, sorted, paged
  const filteredDealers = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = dealers.filter((d) => {
      if (!kw) return true;
      const name = d.company_name?.toLowerCase() || '';
      const code = d.code?.toLowerCase() || '';
      const email = d.contact?.email?.toLowerCase() || '';
      const phone = d.contact?.phone?.toLowerCase() || '';
      return name.includes(kw) || code.includes(kw) || email.includes(kw) || phone.includes(kw);
    });
    return list;
  }, [dealers, keyword]);

  const sortedDealers = useMemo(() => {
    const list = [...filteredDealers];
    list.sort((a, b) => {
      let va: string | number | boolean = '';
      let vb: string | number | boolean = '';
      switch (sortBy) {
        case 'company_name':
          va = a.company_name || '';
          vb = b.company_name || '';
          break;
        case 'code':
          va = a.code || '';
          vb = b.code || '';
          break;
        case 'status':
          va = a.isActive ? 1 : 0;
          vb = b.isActive ? 1 : 0;
          break;
        case 'createdAt':
          va = new Date(a.createdAt).getTime();
          vb = new Date(b.createdAt).getTime();
          break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredDealers, sortBy, sortDir]);

  const totalItems = sortedDealers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedDealers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDealers.slice(start, start + pageSize);
  }, [sortedDealers, currentPage, pageSize]);

  const toggleSort = (key: 'company_name' | 'code' | 'status' | 'createdAt') => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const toggleRowMenu = (id: string) => setOpenMenuId(prev => prev === id ? null : id);
  const closeRowMenu = () => setOpenMenuId(null);

  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 50,
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      padding: '24px',
      borderRadius: '12px',
      border: 'none',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      backgroundColor: '#ffffff',
    },
  };

  if (!user || (user.role !== 'admin' && user.role !== 'evm_staff')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeSection="dealer-management">
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Trang chủ</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">Quản lý đại lý</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý đại lý</h1>
              <p className="text-sm text-gray-600 mt-1">
                Tổng số {dealers.length} đại lý • {dealers.filter(d => d.isActive).length} đang hoạt động
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/dealer-management/add')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              + Thêm đại lý mới
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4 flex items-start">
              <svg className="h-5 w-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-4 flex items-start">
              <svg className="h-5 w-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1 flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={keyword}
                    onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
                    placeholder="Tìm kiếm theo tên, mã, email, số điện thoại..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {(['all', 'active', 'inactive'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => { setStatusFilter(v); setCurrentPage(1); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === v
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {v === 'all' ? `Tất cả (${dealers.length})`
                        : v === 'active' ? `Đang hợp tác (${dealers.filter(d => d.isActive).length})`
                        : `Ngừng hợp tác (${dealers.filter(d => !d.isActive).length})`}
                    </button>
                  ))}
                </div>
              </div>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th
                      onClick={() => toggleSort('company_name')}
                      className="sticky left-0 z-20 bg-gray-50 text-left px-6 py-4 font-semibold text-sm text-gray-900 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                      title="Sắp xếp theo tên"
                    >
                      <div className="flex items-center gap-2">
                        Thông tin đại lý
                        {sortBy === 'company_name' && (
                          <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-sm text-gray-900">Liên hệ</th>
                    <th
                      onClick={() => toggleSort('status')}
                      className="text-left px-6 py-4 font-semibold text-sm text-gray-900 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                      title="Sắp xếp theo trạng thái"
                    >
                      <div className="flex items-center gap-2">
                        Trạng thái
                        {sortBy === 'status' && (
                          <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('createdAt')}
                      className="text-left px-6 py-4 font-semibold text-sm text-gray-900 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                      title="Sắp xếp theo ngày tạo"
                    >
                      <div className="flex items-center gap-2">
                        Ngày tạo
                        {sortBy === 'createdAt' && (
                          <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-sm text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`sk-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded-full w-24" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-3 bg-gray-200 rounded w-20" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-8 bg-gray-200 rounded w-32" />
                        </td>
                      </tr>
                    ))
                  )}

                  {!isLoading && pagedDealers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-600 mb-4">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => { setKeyword(''); setStatusFilter('all'); setCurrentPage(1); }}
                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium"
                          >
                            Xóa bộ lọc
                          </button>
                          <button
                            onClick={() => navigate('/admin/dealer-management/add')}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                          >
                            Thêm đại lý mới
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && pagedDealers.map((dealer) => (
                    <tr key={dealer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-6 py-4 group-hover:bg-gray-50">
                        <div className="max-w-sm">
                          <div className="font-medium text-gray-900 truncate mb-1" title={dealer.company_name}>
                            {dealer.company_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate mb-1">{dealer.code}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 truncate" title={formatAddress(dealer.address)}>
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatAddress(dealer.address)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{dealer.contact?.phone}</span>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate max-w-[200px]">{dealer.contact?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          dealer.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            dealer.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}></span>
                          {dealer.isActive ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{new Date(dealer.createdAt).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(dealer)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                          >
                            Xem chi tiết
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => toggleRowMenu(dealer._id)}
                              aria-label="Mở menu hành động"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </button>

                            {openMenuId === dealer._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={closeRowMenu}
                                  aria-hidden="true"
                                />
                                <div
                                  className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg py-1"
                                  role="menu"
                                  aria-label="Hành động"
                                >
                                  <button
                                    onClick={() => { closeRowMenu(); handleEdit(dealer); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    role="menuitem"
                                  >
                                    Chỉnh sửa
                                  </button>
                                  {dealer.isActive ? (
                                    <button
                                      onClick={() => { closeRowMenu(); confirmAction(dealer._id, 'deactivate'); }}
                                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                      role="menuitem"
                                    >
                                      Ngừng hợp tác
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => { closeRowMenu(); confirmAction(dealer._id, 'activate'); }}
                                      className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                                      role="menuitem"
                                    >
                                      Kích hoạt lại
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && pagedDealers.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> đến{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> trong tổng số{' '}
                  <span className="font-medium">{totalItems}</span> kết quả
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label="Trang trước"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-600">
                    Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label="Trang sau"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal for viewing dealer details */}
        <ReactModal
          isOpen={!!viewingDealer}
          onRequestClose={closeViewDetails}
          style={customStyles}
          contentLabel="Dealer Details"
        >
          {viewingDealer && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Thông tin chi tiết đại lý</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Tên đại lý</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.company_name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Mã đại lý</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.code}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">Địa chỉ</span>
                  <p className="text-sm text-gray-900 mt-1">{formatAddress(viewingDealer.address)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Số điện thoại</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.contact?.phone}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Email</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.contact?.email}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Đại diện pháp lý</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.legal_representative || viewingDealer.contract?.legal_representative || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Giấy phép kinh doanh</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.business_license || viewingDealer.contract?.business_license || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Cấp độ đại lý</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.dealer_level || viewingDealer.capabilities?.dealer_level || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Phân phối sản phẩm</span>
                  <p className="text-sm text-gray-900 mt-1">{viewingDealer.product_distribution || viewingDealer.capabilities?.product_distribution || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Trạng thái</span>
                  <p className="text-sm text-gray-900 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      viewingDealer.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {viewingDealer.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Ngày tạo</span>
                  <p className="text-sm text-gray-900 mt-1">{new Date(viewingDealer.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Ngày cập nhật</span>
                  <p className="text-sm text-gray-900 mt-1">{new Date(viewingDealer.updatedAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <button
                onClick={closeViewDetails}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg mt-6 hover:bg-blue-700 w-full font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          )}
        </ReactModal>

        {/* Modal for action confirmation */}
        <ReactModal
          isOpen={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
          style={customStyles}
          contentLabel="Action Confirmation"
        >
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {actionType === 'deactivate' ? 'Xác nhận ngừng hợp tác' : 'Xác nhận kích hoạt lại'}
            </h2>
            <p className="text-gray-600 mb-6">
              {actionType === 'deactivate'
                ? 'Bạn có chắc chắn muốn ngừng hợp tác với đại lý này không?'
                : 'Bạn có chắc chắn muốn kích hoạt lại đại lý này không?'}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do {actionType === 'deactivate' ? 'ngừng hợp tác' : 'kích hoạt lại'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Nhập lý do ${actionType === 'deactivate' ? 'ngừng hợp tác' : 'kích hoạt lại'}...`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
                  actionType === 'deactivate'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionType === 'deactivate' ? 'Ngừng hợp tác' : 'Kích hoạt lại'}
              </button>
            </div>
          </div>
        </ReactModal>
      </div>
    </AdminLayout>
  );
};
