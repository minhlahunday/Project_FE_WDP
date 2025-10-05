import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
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
      // Build query parameters based on status filter
      let queryParams = '';
      if (statusFilter === 'active') {
        queryParams = '?isActive=true';
      } else if (statusFilter === 'inactive') {
        queryParams = '?isActive=false';
      }
      // For 'all', don't add any filter to get all dealers
      
      const res = await get<{ success: boolean; data: { data: Dealer[] } }>(`/api/dealerships${queryParams}`);
      console.log('API Response:', res); // Debug log
      if (res.success && Array.isArray(res.data.data)) {
        console.log('First dealer:', res.data.data[0]); // Debug log
        setDealers(res.data.data);
        setError(null);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err) {
      setError('Không thể tải danh sách đại lý. Vui lòng thử lại sau.');
    }
  };


  // Handle edit action - navigate to edit page
  const handleEdit = (dealer: Dealer) => {
    navigate(`/admin/dealer-management/edit/${dealer._id}`);
  };

  // Handle view details action
  const handleViewDetails = (dealer: Dealer) => {
    console.log('Viewing dealer:', dealer); // Debug log
    setViewingDealer(dealer);
  };

  // Close view details
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

  // Confirm action (deactivate/activate)
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

  // Fetch dealers on component mount and when filter changes
  useEffect(() => {
    fetchDealers();
  }, [statusFilter]);

  // Updated modal styles for better UI/UX
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#f9f9f9',
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
      <div className="p-6">
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
            {success}
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả ({dealers.length})</option>
              <option value="active">Đang hợp tác ({dealers.filter(d => d.isActive).length})</option>
              <option value="inactive">Ngừng hợp tác ({dealers.filter(d => !d.isActive).length})</option>
            </select>
          </div>
          <button
            onClick={() => navigate('/admin/dealer-management/add')}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
          >
            Thêm đại lý mới
          </button>
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
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Thông tin chi tiết đại lý</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-700">Tên đại lý:</span>
                  <p className="text-gray-900">{viewingDealer.company_name}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Mã đại lý:</span>
                  <p className="text-gray-900">{viewingDealer.code}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Địa chỉ:</span>
                  <p className="text-gray-900">{formatAddress(viewingDealer.address)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Số điện thoại:</span>
                  <p className="text-gray-900">{viewingDealer.contact?.phone}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <p className="text-gray-900">{viewingDealer.contact?.email}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Đại diện pháp lý:</span>
                  <p className="text-gray-900">{viewingDealer.legal_representative || viewingDealer.contract?.legal_representative || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Giấy phép kinh doanh:</span>
                  <p className="text-gray-900">{viewingDealer.business_license || viewingDealer.contract?.business_license || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Cấp độ đại lý:</span>
                  <p className="text-gray-900">{viewingDealer.dealer_level || viewingDealer.capabilities?.dealer_level || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Phân phối sản phẩm:</span>
                  <p className="text-gray-900">{viewingDealer.product_distribution || viewingDealer.capabilities?.product_distribution || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Trạng Thái:</span>
                  <p className="text-gray-900">{viewingDealer.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Ngày tạo:</span>
                  <p className="text-gray-900">{new Date(viewingDealer.createdAt).toLocaleDateString()}</p>
                </div>

                <div>
                  <span className="font-semibold text-gray-700">Ngày cập nhật:</span>
                  <p className="text-gray-900">{new Date(viewingDealer.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={closeViewDetails}
                className="bg-blue-500 text-white p-3 rounded-lg mt-6 hover:bg-blue-600 w-full"
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
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
              {actionType === 'deactivate' ? 'Xác nhận ngừng hợp tác' : 'Xác nhận kích hoạt lại'}
            </h2>
            <p className="text-gray-700 mb-4">
              {actionType === 'deactivate' 
                ? 'Bạn có chắc chắn muốn ngừng hợp tác với đại lý này không?' 
                : 'Bạn có chắc chắn muốn kích hoạt lại đại lý này không?'}
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do {actionType === 'deactivate' ? 'ngừng hợp tác' : 'kích hoạt lại'}:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Nhập lý do ${actionType === 'deactivate' ? 'ngừng hợp tác' : 'kích hoạt lại'}...`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmAction}
                className={`p-3 rounded-lg text-white ${
                  actionType === 'deactivate' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {actionType === 'deactivate' ? 'Ngừng hợp tác' : 'Kích hoạt lại'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          </div>
        </ReactModal>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-6 font-semibold text-gray-900">Thông tin đại lý</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Liên hệ</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Trạng Thái</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Ngày tạo</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dealers.map((dealer) => (
                    <tr key={dealer._id} className="hover:bg-gray-50">
                      <td className="p-6">
                        <div>
                          <div className="font-medium text-gray-900">{dealer.company_name}</div>
                          <div className="text-sm text-gray-500">{dealer.code}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{formatAddress(dealer.address)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{dealer.contact?.phone}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{dealer.contact?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          dealer.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            dealer.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          {dealer.isActive ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm text-gray-500">{new Date(dealer.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewDetails(dealer)}
                            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleEdit(dealer)}
                            className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-sm"
                          >
                            Chỉnh sửa
                          </button>
                          {dealer.isActive ? (
                            <button
                              onClick={() => confirmAction(dealer._id, 'deactivate')}
                              className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm"
                            >
                              Ngừng hợp tác
                            </button>
                          ) : (
                            <button
                              onClick={() => confirmAction(dealer._id, 'activate')}
                              className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm"
                            >
                              Kích hoạt lại
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};