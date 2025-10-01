import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminLayout } from '../admin/AdminLayout';
import { get, post, put, del, patch } from '../../../services/httpClient';
import ReactModal from 'react-modal';
import { ShareAltOutlined } from '@ant-design/icons';

interface Dealer {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  legalInfo: string;
  isActive: boolean;
  operationalInfo: string;
  createdAt: string;
  updatedAt: string;
}

interface DealerForm {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  legalInfo: string;
  operationalInfo: string;
}

export const AdminDealerManagement: React.FC = () => {
  const { user } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<DealerForm>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    legalInfo: '',
    operationalInfo: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingDealer, setViewingDealer] = useState<Dealer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDealerId, setDeleteDealerId] = useState<string | null>(null);

  // Fetch dealers from API
  const fetchDealers = async () => {
    try {
      const res = await get<{ success: boolean; data: { data: Dealer[] } }>('/api/dealerships');
      if (res.success && Array.isArray(res.data.data)) {
        setDealers(res.data.data);
        setError(null);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err) {
      setError('Không thể tải danh sách đại lý. Vui lòng thử lại sau.');
    }
  };

  // Handle form submission for creating or updating a dealer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedDealer) {
        const res = await put<{ success: boolean; message: string }>(
          `/api/dealerships/${selectedDealer._id}`,
          formData
        );
        if (res.success) {
          setSuccess('Thông tin đại lý đã được cập nhật thành công!');
          setError(null);
          setShowForm(false);
          setIsEditing(false);
          setSelectedDealer(null);
          fetchDealers();
        } else {
          throw new Error(res.message);
        }
      } else {
        const res = await post<{ success: boolean; message: string }>('/api/dealerships', formData);
        if (res.success) {
          setSuccess('Đại lý đã được đăng ký thành công!');
          setError(null);
          setShowForm(false);
          fetchDealers();
        } else {
          throw new Error(res.message);
        }
      }
    } catch (err) {
      setError('Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
      setSuccess(null);
    }
  };

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle edit action
  const handleEdit = (dealer: Dealer) => {
    setFormData({
      name: dealer.name,
      code: dealer.code,
      address: dealer.address,
      phone: dealer.phone,
      email: dealer.email,
      legalInfo: dealer.legalInfo,
      operationalInfo: dealer.operationalInfo,
    });
    setSelectedDealer(dealer);
    setIsEditing(true);
    setShowForm(true);
  };

  // Handle view details action
  const handleViewDetails = (dealer: Dealer) => {
    setViewingDealer(dealer);
  };

  // Close view details
  const closeViewDetails = () => {
    setViewingDealer(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setSelectedDealer(null);
    setShowForm(false);
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      legalInfo: '',
      operationalInfo: '',
    });
  };

  // Handle delete action
  const handleDelete = async (dealerId: string) => {
    try {
      // Sử dụng endpoint PATCH thay vì DELETE
      const res = await patch<{ success: boolean; message: string }>(`/api/dealerships/${dealerId}/deactivate`, {});
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

  // Confirm delete action
  const confirmDelete = (dealerId: string) => {
    setDeleteDealerId(dealerId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteDealerId) {
      await handleDelete(deleteDealerId);
      setShowDeleteModal(false);
      setDeleteDealerId(null);
    }
  };

  // Fetch dealers on component mount
  useEffect(() => {
    fetchDealers();
  }, []);

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
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setIsEditing(false);
              setFormData({
                name: '',
                code: '',
                address: '',
                phone: '',
                email: '',
                legalInfo: '',
                operationalInfo: '',
              });
            }}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
          >
            {showForm ? 'Đóng form' : 'Thêm đại lý mới'}
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
                  <p className="text-gray-900">{viewingDealer.name}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Mã đại lý:</span>
                  <p className="text-gray-900">{viewingDealer.code}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Địa chỉ:</span>
                  <p className="text-gray-900">{viewingDealer.address}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Số điện thoại:</span>
                  <p className="text-gray-900">{viewingDealer.phone}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <p className="text-gray-900">{viewingDealer.email}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Thông tin pháp lý:</span>
                  <p className="text-gray-900">{viewingDealer.legalInfo}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Thông tin vận hành:</span>
                  <p className="text-gray-900">{viewingDealer.operationalInfo}</p>
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
        {/* Modal for editing dealer */}
        <ReactModal
          isOpen={showForm}
          onRequestClose={cancelEditing}
          style={customStyles}
          contentLabel="Edit Dealer"
        >
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
              {isEditing ? 'Cập nhật thông tin đại lý' : 'Thêm đại lý mới'}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tên đại lý"
                className="border p-2 rounded-lg w-full"
                required
              />
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Mã đại lý"
                className="border p-2 rounded-lg w-full"
                required
              />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Địa chỉ"
                className="border p-2 rounded-lg w-full"
                required
              />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
                className="border p-2 rounded-lg w-full"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="border p-2 rounded-lg w-full"
                required
              />
              <textarea
                name="legalInfo"
                value={formData.legalInfo}
                onChange={handleChange}
                placeholder="Thông tin pháp lý"
                className="border p-2 rounded-lg w-full"
                required
              />
              <textarea
                name="operationalInfo"
                value={formData.operationalInfo}
                onChange={handleChange}
                placeholder="Thông tin vận hành"
                className="border p-2 rounded-lg w-full"
                required
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 mr-2"
              >
                {isEditing ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
              >
                Hủy
              </button>
            </div>
          </form>
        </ReactModal>
        {/* Modal for delete confirmation */}
        <ReactModal
          isOpen={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
          style={customStyles}
          contentLabel="Delete Dealer Confirmation"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Xác nhận xóa đại lý</h2>
            <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa đại lý này không? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
              >
                Xóa
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
                          <div className="font-medium text-gray-900">{dealer.name}</div>
                          <div className="text-sm text-gray-500">{dealer.code}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{dealer.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{dealer.phone}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{dealer.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <ShareAltOutlined className="h-3 w-3" />
                          <span>{dealer.isActive ? 'Hợp tác' : ' Ngừng hợp tác'}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-sm text-gray-500">{new Date(dealer.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-6">
                        <button
                          onClick={() => handleViewDetails(dealer)}
                          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 mr-2"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => handleEdit(dealer)}
                          className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 mr-2"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => confirmDelete(dealer._id)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                        >
                          Xóa
                        </button>
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