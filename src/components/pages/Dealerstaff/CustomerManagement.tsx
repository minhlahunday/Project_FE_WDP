import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Edit,
  Eye,
  Loader2,
  CreditCard,
} from "lucide-react";
import { mockVehicles, mockMotorbikes } from "../../../data/mockData";
import { Customer } from "../../../types";
import { useNavigate } from "react-router-dom";
import { customerService } from "../../../services/customerService";

export const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCustomerForSchedule, setSelectedCustomerForSchedule] =
    useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "yours">("all");
  const [selectedCustomerPayments, setSelectedCustomerPayments] = useState<
    any[]
  >([]);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    vehicleId: "",
    vehicleType: "car",
    date: "",
    time: "",
    purpose: "",
    notes: "",
  });
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const allVehicles = [...mockVehicles, ...mockMotorbikes];

  useEffect(() => {
    loadCustomers();
  }, [activeTab]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      let customerData: Customer[];

      if (activeTab === "yours") {
        customerData = await customerService.getYourCustomers(
          searchTerm || undefined
        );
      } else {
        customerData = await customerService.getAllCustomers(
          searchTerm || undefined
        );
      }

      setCustomers(customerData || []);
    } catch (err) {
      setError("Không thể tải danh sách khách hàng");
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadCustomers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadCustomerPayments = async (customerId: string) => {
    try {
      const payments = await customerService.getCustomerPayments(customerId);
      setSelectedCustomerPayments(payments || []);
    } catch (err) {
      console.error("Error loading customer payments:", err);
      setSelectedCustomerPayments([]);
    }
  };

  const filteredCustomers = customers;

  const handleScheduleClick = (customer: Customer) => {
    setSelectedCustomerForSchedule(customer);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleForm.vehicleId) {
      const vehicle = allVehicles.find((v) => v.id === scheduleForm.vehicleId);
      if (vehicle) {
        navigate(
          `/portal/test-drive?vehicleId=${scheduleForm.vehicleId}&customerId=${selectedCustomerForSchedule?.id}`
        );
      }
    }
    setShowScheduleModal(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerForm.name?.trim() ||
      !customerForm.email?.trim() ||
      !customerForm.phone?.trim()
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email.trim())) {
      setError("Email không hợp lệ");
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(customerForm.phone.trim())) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      await customerService.createCustomer({
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address?.trim() || "",
        testDrives: [],
        orders: [],
      });

      // Reset form and close modal
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      setShowCreateModal(false);

      // Reload customers
      await loadCustomers();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tạo khách hàng mới";
      setError(errorMessage);
      console.error("Error creating customer:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: "",
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCustomer ||
      !customerForm.name?.trim() ||
      !customerForm.email?.trim() ||
      !customerForm.phone?.trim()
    ) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email.trim())) {
      setError("Email không hợp lệ");
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(customerForm.phone.trim())) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await customerService.updateCustomer(selectedCustomer.id, {
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        address: customerForm.address?.trim() || "",
      });

      // Reset form and close modal
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      setSelectedCustomer(null);
      setShowEditModal(false);

      // Reload customers
      await loadCustomers();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật thông tin khách hàng";
      setError(errorMessage);
      console.error("Error updating customer:", err);
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setCustomerForm({ name: "", email: "", phone: "", address: "", notes: "" });
    setError(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tất cả khách hàng
          </button>
          <button
            onClick={() => setActiveTab("yours")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "yours"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Khách hàng của tôi
          </button>
        </div>
      </div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">
            Đang tải danh sách khách hàng...
          </span>
        </div>
      ) : (
        <>
          {/* Customer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {customer?.name || "N/A"}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{customer.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{customer.address || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="text-green-600 hover:text-green-800"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        loadCustomerPayments(customer.id);
                        setShowPaymentsModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-800"
                      title="Xem thanh toán"
                    >
                      <CreditCard className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {customer.orders?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600">Đơn hàng</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {customer.testDrives?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600">Lái thử</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-600">VIP</p>
                      <p className="text-xs text-gray-600">Hạng</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleScheduleClick(customer)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Đặt lịch</span>
                  </button>
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>Nhắn tin</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Thêm khách hàng mới
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerForm.email}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    value={customerForm.address}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={customerForm.notes}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        notes: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Ghi chú về khách hàng"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={creating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{creating ? "Đang tạo..." : "Thêm khách hàng"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Chỉnh sửa khách hàng
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCustomer(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerForm.email}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <textarea
                    value={customerForm.address}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCustomer(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={updating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{updating ? "Đang cập nhật..." : "Cập nhật"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && !showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Thông tin chi tiết khách hàng
                </h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Thông tin cá nhân
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Họ và tên</p>
                        <p className="font-medium">{selectedCustomer.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Số điện thoại</p>
                        <p className="font-medium">{selectedCustomer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Địa chỉ</p>
                        <p className="font-medium">
                          {selectedCustomer.address}
                        </p>
                      </div>
                    </div>

                    <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                      Chỉnh sửa thông tin
                    </button>
                  </div>
                </div>

                {/* Activity History */}
                <div className="lg:col-span-2">
                  <div className="space-y-6">
                    {/* Test Drives */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Lịch sử lái thử
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-600 text-center py-8">
                          Chưa có lịch lái thử nào
                        </p>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                          Đặt lịch lái thử mới
                        </button>
                      </div>
                    </div>

                    {/* Orders */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Lịch sử đơn hàng
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-600 text-center py-8">
                          Chưa có đơn hàng nào
                        </p>
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                          Tạo đơn hàng mới
                        </button>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Phản hồi & Khiếu nại
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-600 text-center py-8">
                          Chưa có phản hồi nào
                        </p>
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                          Ghi nhận phản hồi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Đặt lịch cho khách hàng
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại xe *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="vehicleType"
                        value="car"
                        checked={scheduleForm.vehicleType === "car"}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            vehicleType: e.target.value,
                            vehicleId: "",
                          })
                        }
                        className="mr-2"
                      />
                      <span>Ô tô điện</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="vehicleType"
                        value="motorbike"
                        checked={scheduleForm.vehicleType === "motorbike"}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            vehicleType: e.target.value,
                            vehicleId: "",
                          })
                        }
                        className="mr-2"
                      />
                      <span>Xe máy điện</span>
                    </label>
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn xe *
                  </label>
                  <select
                    required
                    value={scheduleForm.vehicleId}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        vehicleId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Chọn xe</option>
                    {scheduleForm.vehicleType === "car"
                      ? mockVehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.model} - {vehicle.version}
                          </option>
                        ))
                      : mockMotorbikes.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.model} - {vehicle.version}
                          </option>
                        ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Tiếp tục
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Payments Modal */}
      {showPaymentsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Lịch sử thanh toán - {selectedCustomer.name}
                </h2>
                <button
                  onClick={() => {
                    setShowPaymentsModal(false);
                    setSelectedCustomerPayments([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {!selectedCustomerPayments ||
              selectedCustomerPayments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có thanh toán nào
                  </h3>
                  <p className="text-gray-500">
                    Khách hàng này chưa có giao dịch thanh toán nào trong hệ
                    thống.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(selectedCustomerPayments || []).map((payment, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Thanh toán #{payment?.id || index + 1}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Ngày: {payment?.date || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Phương thức: {payment?.method || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {payment?.amount
                              ? `${payment.amount.toLocaleString()} VND`
                              : "N/A"}
                          </p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              payment?.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : payment?.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment?.status === "completed"
                              ? "Hoàn thành"
                              : payment?.status === "pending"
                              ? "Đang xử lý"
                              : "Thất bại"}
                          </span>
                        </div>
                      </div>
                      {payment?.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          Mô tả: {payment.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
