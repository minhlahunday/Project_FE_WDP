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
  X,
  AlertCircle,
  User,
  ShoppingCart,
  MessageCircle,
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
  const [selectedCustomerForPayments, setSelectedCustomerForPayments] =
    useState<Customer | null>(null);
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
      setSelectedCustomerPayments(payments?.data || []);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      {/* Header Section with Gradient */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Quản lý khách hàng</h1>
              <p className="text-blue-100 text-lg">Quản lý và theo dõi thông tin khách hàng của bạn</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-white hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Thêm khách hàng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>Tất cả khách hàng</span>
                <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-xs">
                  {activeTab === "all" ? customers.length : ""}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("yours")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === "yours"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>Khách hàng của tôi</span>
                <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-xs">
                  {activeTab === "yours" ? customers.length : ""}
                </span>
              </div>
            </button>
          </div>
          
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl shadow-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Loader2 className="h-10 w-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="mt-6 text-gray-600 font-medium text-lg">
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
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100"
              >
                {/* Gradient Header */}
                <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-3 truncate">
                        {customer?.name || "N/A"}
                      </h3>
                      <div className="space-y-2 text-sm text-white text-opacity-95">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{customer.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{customer.phone || "N/A"}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{customer.address || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-3">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-2.5 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-2.5 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomerForPayments(customer);
                          loadCustomerPayments(customer.id);
                          setShowPaymentsModal(true);
                        }}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white p-2.5 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Xem thanh toán"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="p-6">
                  {/* <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3">
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {customer.orders?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">Đơn hàng</p>
                    </div>
                    <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {customer.testDrives?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">Lái thử</p>
                    </div>
                    <div className="text-center bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3">
                      <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">VIP</p>
                      <p className="text-xs text-gray-600 font-medium">Hạng</p>
                    </div>
                  </div> */}

                  {/* Action Buttons */}
                  {/* <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleScheduleClick(customer)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Đặt lịch</span>
                    </button>
                    <button className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                      <MessageSquare className="h-4 w-4" />
                      <span>Nhắn tin</span>
                    </button>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Thêm khách hàng mới
                    </h2>
                    <p className="text-green-100 text-sm">Điền thông tin khách hàng bên dưới</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateCustomer} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      required
                      value={customerForm.name}
                      onChange={(e) =>
                        setCustomerForm({ ...customerForm, name: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      Số điện thoại
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
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Email
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300"
                    rows={3}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300"
                    rows={2}
                    placeholder="Ghi chú về khách hàng"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    disabled={creating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {creating && <Loader2 className="h-5 w-5 animate-spin" />}
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Chỉnh sửa khách hàng
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Cập nhật thông tin khách hàng
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCustomer(null);
                    resetForm();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-5 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg flex items-start shadow-sm">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700 font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCustomer} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      required
                      value={customerForm.name}
                      onChange={(e) =>
                        setCustomerForm({ ...customerForm, name: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      Số điện thoại
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
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Email
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                    rows={3}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCustomer(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    disabled={updating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {updating && <Loader2 className="h-5 w-5 animate-spin" />}
                    <span>{updating ? "Đang cập nhật..." : "Cập nhật"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && !showEditModal && !showPaymentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-6 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Thông tin chi tiết khách hàng
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                      Xem thông tin và lịch sử hoạt động
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-bold text-gray-900">
                        Thông tin cá nhân
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Họ và tên</p>
                        <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                        <p className="font-semibold text-gray-900">{selectedCustomer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Địa chỉ</p>
                        <p className="font-semibold text-gray-900">
                          {selectedCustomer.address}
                        </p>
                      </div>
                    </div>

                    {/* <button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2">
                      <Edit className="h-5 w-5" />
                      <span>Chỉnh sửa thông tin</span>
                    </button> */}
                  </div>
                </div>

                {/* Activity History */}
                <div className="lg:col-span-2">
                  <div className="space-y-5">
                    {/* Test Drives */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-100 shadow-sm">
                      <div className="flex items-center space-x-2 mb-4">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          Lịch sử lái thử
                        </h3>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-gray-600 text-center py-6">
                          Chưa có lịch lái thử nào
                        </p>
                        <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2">
                          <Plus className="h-5 w-5" />
                          <span>Đặt lịch lái thử mới</span>
                        </button>
                      </div>
                    </div>

                    {/* Orders */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-100 shadow-sm">
                      <div className="flex items-center space-x-2 mb-4">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          Lịch sử đơn hàng
                        </h3>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-gray-600 text-center py-6">
                          Chưa có đơn hàng nào
                        </p>
                        <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2">
                          <Plus className="h-5 w-5" />
                          <span>Tạo đơn hàng mới</span>
                        </button>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-100 shadow-sm">
                      <div className="flex items-center space-x-2 mb-4">
                        <MessageCircle className="h-5 w-5 text-amber-600" />
                        <h3 className="text-lg font-bold text-gray-900">
                          Phản hồi & Khiếu nại
                        </h3>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-gray-600 text-center py-6">
                          Chưa có phản hồi nào
                        </p>
                        <button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2">
                          <Plus className="h-5 w-5" />
                          <span>Ghi nhận phản hồi</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Đặt lịch cho khách hàng
                    </h2>
                    <p className="text-cyan-100 text-sm mt-1">
                      Chọn xe để đặt lịch lái thử
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleScheduleSubmit} className="space-y-5">
                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Loại xe
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex-1">
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
                        className="peer sr-only"
                      />
                      <div className="cursor-pointer border-2 border-gray-200 rounded-xl p-4 text-center peer-checked:border-cyan-500 peer-checked:bg-cyan-50 hover:border-gray-300 transition-all duration-200">
                        <span className="font-semibold text-gray-700">Ô tô điện</span>
                      </div>
                    </label>
                    <label className="flex-1">
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
                        className="peer sr-only"
                      />
                      <div className="cursor-pointer border-2 border-gray-200 rounded-xl p-4 text-center peer-checked:border-cyan-500 peer-checked:bg-cyan-50 hover:border-gray-300 transition-all duration-200">
                        <span className="font-semibold text-gray-700">Xe máy điện</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Chọn xe
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 hover:border-gray-300"
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

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
      {showPaymentsModal && selectedCustomerForPayments && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Lịch sử thanh toán
                    </h2>
                    <p className="text-amber-100 text-sm mt-1">
                      {selectedCustomerForPayments.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentsModal(false);
                    setSelectedCustomerPayments([]);
                    setSelectedCustomerForPayments(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!selectedCustomerPayments ||
              selectedCustomerPayments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="h-12 w-12 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
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
                      className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-2 rounded-lg">
                              <CreditCard className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              Thanh toán #{payment?.id || index + 1}
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-3 ml-11">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Ngày thanh toán</p>
                              <p className="text-sm font-semibold text-gray-700">
                                {payment?.date || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Phương thức</p>
                              <p className="text-sm font-semibold text-gray-700">
                                {payment?.method || "N/A"}
                              </p>
                            </div>
                          </div>
                          {payment?.description && (
                            <p className="text-sm text-gray-600 mt-3 ml-11">
                              {payment.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                            {payment?.amount
                              ? `${payment.amount.toLocaleString()} ₫`
                              : "N/A"}
                          </p>
                          <span
                            className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm ${
                              payment?.status === "completed"
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                : payment?.status === "pending"
                                ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white"
                                : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                            }`}
                          >
                            {payment?.status === "completed"
                              ? "✓ Hoàn thành"
                              : payment?.status === "pending"
                              ? "⏳ Đang xử lý"
                              : "✗ Thất bại"}
                          </span>
                        </div>
                      </div>
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
