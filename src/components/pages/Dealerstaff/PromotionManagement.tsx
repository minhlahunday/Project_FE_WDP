import React, { useState, useEffect } from "react";
import {
  Tag,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Search,
  Filter,
  Gift,
} from "lucide-react";
import {
  promotionService,
  Promotion,
} from "../../../services/promotionService";

export const PromotionManagementDealer: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, [activeFilter]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      let promotionData: Promotion[];
      if (activeFilter === "all") {
        promotionData = await promotionService.getPromotions();
      } else {
        promotionData = await promotionService.getPromotions(
          activeFilter === "active"
        );
      }

      setPromotions(promotionData || []);
    } catch (err) {
      setError("Không thể tải danh sách khuyến mãi");
      console.error("Error loading promotions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions = promotions.filter(
    (promotion) =>
      promotion.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetail = async (promotion: Promotion) => {
    try {
      const detailData = await promotionService.getPromotionById(promotion._id);
      setSelectedPromotion(detailData);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error loading promotion detail:", err);
      setSelectedPromotion(promotion);
      setShowDetailModal(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active)
      return {
        status: "inactive",
        label: "Không hoạt động",
        color: "bg-gray-100 text-gray-800",
      };
    if (now < startDate)
      return {
        status: "upcoming",
        label: "Sắp diễn ra",
        color: "bg-blue-100 text-blue-800",
      };
    if (now > endDate)
      return {
        status: "expired",
        label: "Đã hết hạn",
        color: "bg-red-100 text-red-800",
      };
    return {
      status: "active",
      label: "Đang diễn ra",
      color: "bg-green-100 text-green-800",
    };
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 min-h-full lg:mr-[200px]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Quản lý khuyến mãi
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Xem và quản lý các chương trình khuyến mãi áp dụng cho đại
                    lý
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">
                    {filteredPromotions.filter((p) => p.is_active).length}{" "}
                    khuyến mãi đang hoạt động
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                  <Gift className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-700 font-medium">
                    {filteredPromotions.length} tổng số khuyến mãi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mô tả khuyến mãi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-gray-700"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-200 ${
                  activeFilter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Tất cả</span>
              </button>
              <button
                onClick={() => setActiveFilter("active")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeFilter === "active"
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                }`}
              >
                Đang hoạt động
              </button>
              <button
                onClick={() => setActiveFilter("inactive")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeFilter === "inactive"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                }`}
              >
                Không hoạt động
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Đang tải danh sách khuyến mãi...
              </p>
            </div>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không có khuyến mãi nào
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm
                  ? `Không tìm thấy khuyến mãi nào phù hợp với từ khóa "${searchTerm}"`
                  : "Hiện tại chưa có khuyến mãi nào được áp dụng cho đại lý này"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredPromotions.map((promotion) => {
              const status = getPromotionStatus(promotion);

              return (
                <div
                  key={promotion._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
                >
                  {/* Header with gradient background */}
                  <div
                    className={`p-4 ${
                      promotion.type === "gift"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : promotion.type === "service"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : "bg-gradient-to-r from-green-500 to-teal-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        {promotion.type === "gift" ? (
                          <Gift className="h-5 w-5 text-white" />
                        ) : promotion.type === "service" ? (
                          <DollarSign className="h-5 w-5 text-white" />
                        ) : (
                          <Tag className="h-5 w-5 text-white" />
                        )}
                        <span className="text-white text-sm font-medium">
                          {promotion.type === "gift"
                            ? "Quà tặng"
                            : promotion.type === "service"
                            ? "Dịch vụ"
                            : "Khuyến mãi"}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full bg-white/20 text-white border border-white/30`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                      {promotion.name || "N/A"}
                    </h3>

                    <div className="text-white/90 text-xl font-bold">
                      {promotion.type === "gift" && promotion.value
                        ? `${promotion.value}%`
                        : promotion.type === "service" && promotion.value
                        ? `${promotion.value}%`
                        : promotion.type === "discount" && promotion.value
                        ? formatCurrency(promotion.value)
                        : "Đặc biệt"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                      {promotion.description || "Không có mô tả"}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(promotion.start_date)} -{" "}
                          {formatDate(promotion.end_date)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              promotion.is_active
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-gray-600">
                            {promotion.is_active ? "Hoạt động" : "Tạm dừng"}
                          </span>
                        </div>

                        <span className="text-gray-400 text-xs font-mono">
                          #{promotion._id.slice(-6)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetail(promotion)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Xem chi tiết</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {!loading && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                Hiển thị{" "}
                <span className="font-semibold text-blue-600">
                  {filteredPromotions.length}
                </span>{" "}
                khuyến mãi
                {searchTerm && (
                  <>
                    {" "}
                    từ <span className="font-semibold">"{searchTerm}"</span>
                  </>
                )}
                {activeFilter !== "all" && (
                  <>
                    {" "}
                    (
                    {activeFilter === "active"
                      ? "đang hoạt động"
                      : "không hoạt động"}
                    )
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Promotion Detail Modal */}
        {showDetailModal && selectedPromotion && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <Gift className="h-6 w-6 text-blue-600" />
                    <span>Chi tiết khuyến mãi</span>
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedPromotion(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedPromotion.name}
                    </h3>
                    <p className="text-gray-600">
                      {selectedPromotion.description || "Chưa có mô tả"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Gift className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">
                          {selectedPromotion.type === "gift"
                            ? "Quà tặng"
                            : selectedPromotion.type === "service"
                            ? "Dịch vụ"
                            : selectedPromotion.type === "discount"
                            ? "Giảm giá"
                            : "Khuyến mãi"}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedPromotion.type === "gift" &&
                          selectedPromotion.value
                            ? `Giá trị ${selectedPromotion.value}%`
                            : selectedPromotion.type === "service" &&
                              selectedPromotion.value
                            ? `Ưu đãi ${selectedPromotion.value}%`
                            : selectedPromotion.type === "discount" &&
                              selectedPromotion.value
                            ? `Giảm ${formatCurrency(selectedPromotion.value)}`
                            : "Khuyến mãi đặc biệt"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                          selectedPromotion.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            selectedPromotion.is_active
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        {selectedPromotion.is_active
                          ? "Đang hoạt động"
                          : "Không hoạt động"}
                      </span>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">ID Khuyến mãi</p>
                        <p className="text-sm font-mono text-gray-700">
                          {selectedPromotion._id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">
                            Thời gian áp dụng
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Bắt đầu:</span>{" "}
                            {formatDate(selectedPromotion.start_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Kết thúc:</span>{" "}
                            {formatDate(selectedPromotion.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex space-x-2 mb-2">
                          <Tag className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">
                            Thông tin khuyến mãi
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Loại:</span>
                            <span className="text-sm font-medium">
                              {selectedPromotion.type === "gift"
                                ? "Quà tặng"
                                : selectedPromotion.type === "service"
                                ? "Dịch vụ"
                                : "Giảm giá"}
                            </span>
                          </div>
                          {selectedPromotion.value && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Giá trị:
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {selectedPromotion.type === "discount"
                                  ? formatCurrency(selectedPromotion.value)
                                  : `${selectedPromotion.value}%`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex space-x-2 mb-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">
                            Thông tin hệ thống
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Ngày tạo:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedPromotion.createdAt
                                ? formatDate(selectedPromotion.createdAt)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Cập nhật:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedPromotion.updatedAt
                                ? formatDate(selectedPromotion.updatedAt)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Trạng thái xóa:
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                selectedPromotion.is_deleted
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {selectedPromotion.is_deleted
                                ? "Đã xóa"
                                : "Hoạt động"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex space-x-2 mb-2">
                          <DollarSign className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-800">
                            Áp dụng đại lý
                          </p>
                        </div>
                        <p className="text-sm text-amber-700">
                          {selectedPromotion.dealerships?.length > 0
                            ? `Áp dụng cho ${selectedPromotion.dealerships.length} đại lý`
                            : "Áp dụng cho tất cả đại lý"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
