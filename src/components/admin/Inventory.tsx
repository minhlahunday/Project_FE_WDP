import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle,
  Eye,
  Package2,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  X,
  Save,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './AdminLayout';

// Định nghĩa kiểu dữ liệu
export interface InventoryHistory {
  id: string;
  type: 'import' | 'export';
  quantity: number;
  date: string;
  note?: string;
  user: string;
}

export interface InventoryProduct {
  id: string;
  code: string;
  name: string;
  type: 'car' | 'motorbike';
  image: string;
  description: string;
  quantity: number;
  minQuantity: number;
  location: string;
  price: number;
  status: 'active' | 'inactive' | 'low_stock';
  createdAt: string;
  updatedAt: string;
  history: InventoryHistory[];
}

// Dữ liệu mẫu
const initialInventoryData: InventoryProduct[] = [
  {
    id: '1',
    code: 'VF6-001',
    name: 'VF 6',
    type: 'car',
    image: 'https://vinFastyenbai.com.vn/wp-content/uploads/2024/07/vinfastyenbai-com-vn-KNZod2y9Bz.jpg',
    description: 'Ô tô điện cỡ nhỏ, tiết kiệm năng lượng, phù hợp di chuyển trong thành phố.',
    quantity: 32,
    minQuantity: 10,
    location: 'Khu A - Kệ 1',
    price: 610000000,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '1', type: 'import', quantity: 40, date: '2025-08-01T10:00:00Z', note: 'Nhập kho đầu tháng', user: 'Admin' },
      { id: '2', type: 'export', quantity: 8, date: '2025-09-01T09:00:00Z', note: 'Xuất bán cho đại lý Hà Nội', user: 'Staff1' },
    ],
  },
  {
    id: '2',
    code: 'VF7-001',
    name: 'VF 7',
    type: 'car',
    image: 'https://media.vov.vn/sites/default/files/styles/large/public/2024-06/a1_8.jpg',
    description: 'Ô tô điện đa dụng, thiết kế hiện đại, phù hợp gia đình.',
    quantity: 18,
    minQuantity: 8,
    location: 'Khu A - Kệ 2',
    price: 850000000,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '3', type: 'import', quantity: 20, date: '2025-08-05T10:00:00Z', note: 'Nhập từ nhà máy', user: 'Admin' },
      { id: '4', type: 'export', quantity: 2, date: '2025-09-02T09:00:00Z', note: 'Xuất bán lẻ', user: 'Staff2' },
    ],
  },
  {
    id: '3',
    code: 'VF8-001',
    name: 'VF 8',
    type: 'car',
    image: 'https://vinFastotominhdao.vn/wp-content/uploads/VinFast-VF8-1.jpg',
    description: 'Ô tô điện SUV cao cấp, tiện nghi đầy đủ.',
    quantity: 25,
    minQuantity: 12,
    location: 'Khu A - Kệ 3',
    price: 1200000000,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '5', type: 'import', quantity: 30, date: '2025-08-10T10:00:00Z', note: 'Nhập từ nhà máy', user: 'Admin' },
      { id: '6', type: 'export', quantity: 5, date: '2025-09-03T09:00:00Z', note: 'Xuất cho đại lý HCM', user: 'Staff1' },
    ],
  },
  {
    id: '4',
    code: 'VF9-001',
    name: 'VF 9',
    type: 'car',
    image: 'https://vinFastotominhdao.vn/wp-content/uploads/VinFast-VF9-9.jpg',
    description: 'Ô tô điện SUV 7 chỗ, mạnh mẽ và sang trọng.',
    quantity: 7,
    minQuantity: 5,
    location: 'Khu A - Kệ 4',
    price: 2000000000,
    status: 'low_stock',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '7', type: 'import', quantity: 15, date: '2025-08-15T10:00:00Z', note: 'Nhập từ nhà máy', user: 'Admin' },
      { id: '8', type: 'export', quantity: 8, date: '2025-09-04T09:00:00Z', note: 'Xuất bán nhiều đơn', user: 'Staff2' },
    ],
  },
  {
    id: '5',
    code: 'KLARA-001',
    name: 'Klara S',
    type: 'motorbike',
    image: 'https://vinFastquangninh.com.vn/wp-content/uploads/2022/09/BUW.png',
    description: 'Xe máy điện thời trang, tiết kiệm, phù hợp phái nữ.',
    quantity: 40,
    minQuantity: 15,
    location: 'Khu B - Kệ 1',
    price: 39900000,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '9', type: 'import', quantity: 50, date: '2025-08-01T10:00:00Z', note: 'Nhập kho tháng 8', user: 'Admin' },
      { id: '10', type: 'export', quantity: 10, date: '2025-09-01T09:00:00Z', note: 'Xuất bán lẻ', user: 'Staff1' },
    ],
  },
  {
    id: '6',
    code: 'FELIZ-001',
    name: 'Feliz S',
    type: 'motorbike',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfoJs4ft2hXjGGZy-XpjmX2KWQ3jSWq3QNcg&s',
    description: 'Xe máy điện nhỏ gọn, linh hoạt, phù hợp đi phố.',
    quantity: 28,
    minQuantity: 10,
    location: 'Khu B - Kệ 2',
    price: 29900000,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '11', type: 'import', quantity: 30, date: '2025-08-05T10:00:00Z', note: 'Nhập từ nhà máy', user: 'Admin' },
      { id: '12', type: 'export', quantity: 2, date: '2025-09-02T09:00:00Z', note: 'Xuất thử nghiệm', user: 'Staff2' },
    ],
  },
  {
    id: '7',
    code: 'THEON-001',
    name: 'Theon',
    type: 'motorbike',
    image: 'https://product.hstatic.net/200000960063/product/theon_transparent_back__2__c41cadb55bd74375a9941617e409ff7f_master.png',
    description: 'Xe máy điện cao cấp, mạnh mẽ, phù hợp đường dài.',
    quantity: 8,
    minQuantity: 5,
    location: 'Khu B - Kệ 3',
    price: 69900000,
    status: 'low_stock',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '13', type: 'import', quantity: 20, date: '2025-08-10T10:00:00Z', note: 'Nhập từ nhà máy', user: 'Admin' },
      { id: '14', type: 'export', quantity: 12, date: '2025-09-03T09:00:00Z', note: 'Xuất bán nhiều', user: 'Staff1' },
    ],
  },
  {
    id: '8',
    code: 'EVO200-001',
    name: 'Evo200',
    type: 'motorbike',
    image: 'https://shop.vinFastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw91eed064/images/PDP-XMD/evo200/img-pin.png',
    description: 'Xe máy điện giá rẻ cho sinh viên, phù hợp di chuyển hàng ngày.',
    quantity: 22,
    minQuantity: 8,
    location: 'Khu B - Kệ 4',
    price: 22000000,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-09-20T10:00:00Z',
    history: [
      { id: '15', type: 'import', quantity: 25, date: '2025-08-15T10:00:00Z', note: 'Nhập từ nhà máy', user: 'Admin' },
      { id: '16', type: 'export', quantity: 3, date: '2025-09-04T09:00:00Z', note: 'Xuất bán lẻ', user: 'Staff2' },
    ],
  },
];


export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<InventoryProduct[]>(initialInventoryData);
  const [activeTab, setActiveTab] = useState<'car' | 'motorbike' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'low_stock'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'import' | 'export' | 'delete'>('add');
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  
  const itemsPerPage = 8;

  // Lọc và tìm kiếm sản phẩm
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || product.type === activeTab;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesTab && matchesStatus;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Thống kê
  const totalProducts = products.length;
  const carCount = products.filter(p => p.type === 'car').length;
  const motorbikeCount = products.filter(p => p.type === 'motorbike').length;
  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

  // Format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format ngày
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Hiển thị thông báo
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Xử lý thêm sản phẩm
  const handleAddProduct = (productData: Partial<InventoryProduct>) => {
    const newProduct: InventoryProduct = {
      id: Date.now().toString(),
      code: productData.code || '',
      name: productData.name || '',
      type: productData.type || 'car',
      image: productData.image || 'https://via.placeholder.com/300x200?text=No+Image',
      description: productData.description || '',
      quantity: productData.quantity || 0,
      minQuantity: productData.minQuantity || 5,
      location: productData.location || '',
      price: productData.price || 0,
      status: (productData.quantity || 0) <= (productData.minQuantity || 5) ? 'low_stock' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };
    setProducts([...products, newProduct]);
    showNotification('success', 'Thêm sản phẩm thành công!');
    setShowModal(false);
  };

  // Xử lý cập nhật sản phẩm
  const handleUpdateProduct = (productData: Partial<InventoryProduct>) => {
    setProducts(products.map(p => 
      p.id === selectedProduct?.id 
        ? { 
            ...p, 
            ...productData, 
            status: (productData.quantity || p.quantity) <= (productData.minQuantity || p.minQuantity) ? 'low_stock' : 'active',
            updatedAt: new Date().toISOString() 
          }
        : p
    ));
    showNotification('success', 'Cập nhật sản phẩm thành công!');
    setShowModal(false);
  };

  // Xử lý xóa sản phẩm
  const handleDeleteProduct = () => {
    if (selectedProduct) {
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      showNotification('success', 'Xóa sản phẩm thành công!');
      setShowModal(false);
    }
  };

  // Xử lý nhập/xuất kho
  const handleStockOperation = (type: 'import' | 'export', quantity: number, note: string) => {
    if (selectedProduct) {
      const newQuantity = type === 'import' 
        ? selectedProduct.quantity + quantity 
        : selectedProduct.quantity - quantity;
      
      if (newQuantity < 0) {
        showNotification('error', 'Số lượng xuất kho không được vượt quá tồn kho hiện tại!');
        return;
      }

      const historyEntry: InventoryHistory = {
        id: Date.now().toString(),
        type,
        quantity,
        date: new Date().toISOString(),
        note,
        user: user?.name || 'Unknown'
      };

      setProducts(products.map(p => 
        p.id === selectedProduct.id 
          ? {
              ...p,
              quantity: newQuantity,
              status: newQuantity <= p.minQuantity ? 'low_stock' : 'active',
              updatedAt: new Date().toISOString(),
              history: [historyEntry, ...p.history]
            }
          : p
      ));

      showNotification('success', `${type === 'import' ? 'Nhập' : 'Xuất'} kho thành công!`);
      setShowModal(false);
    }
  };

  return (
    <AdminLayout activeSection="inventory">
      <div className="p-6">
        {/* Thông báo */}
        {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">✓</div>}
            {notification.type === 'error' && <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">✗</div>}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý tồn kho</h1>
          <p className="text-gray-600">Quản lý sản phẩm và theo dõi tồn kho</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => { setModalType('add'); setSelectedProduct(null); setShowModal(true); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            disabled={user?.role !== 'admin' && user?.role !== 'evm_staff'}
          >
            <Plus className="w-5 h-5" />
            <span>Thêm sản phẩm</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download className="w-5 h-5" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
              <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <Package2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ô tô điện</p>
              <p className="text-3xl font-bold text-gray-900">{carCount}</p>
            </div>
            <Car className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Xe máy điện</p>
              <p className="text-3xl font-bold text-gray-900">{motorbikeCount}</p>
            </div>
            <Package className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cảnh báo tồn kho</p>
              <p className="text-3xl font-bold text-red-600">{lowStockCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Tìm kiếm */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Lọc theo loại */}
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as 'car' | 'motorbike' | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tất cả loại</option>
              <option value="car">Ô tô điện</option>
              <option value="motorbike">Xe máy điện</option>
            </select>

            {/* Lọc theo trạng thái */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'low_stock')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Bình thường</option>
              <option value="low_stock">Cảnh báo tồn kho</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Hiển thị {currentProducts.length} / {filteredProducts.length} sản phẩm
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu sản phẩm */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã SP</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.type === 'car' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {product.type === 'car' ? 'Ô tô điện' : 'Xe máy điện'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.quantity}</div>
                    <div className="text-xs text-gray-500">Tối thiểu: {product.minQuantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                          Bình thường
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Cảnh báo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => { setModalType('view'); setSelectedProduct(product); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(user?.role === 'admin' || user?.role === 'evm_staff') && (
                      <>
                        <button
                          onClick={() => { setModalType('edit'); setSelectedProduct(product); setShowModal(true); }}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setModalType('import'); setSelectedProduct(product); setShowModal(true); }}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="Nhập kho"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setModalType('export'); setSelectedProduct(product); setShowModal(true); }}
                          className="text-orange-600 hover:text-orange-900 p-1 rounded"
                          title="Xuất kho"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setModalType('delete'); setSelectedProduct(product); setShowModal(true); }}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  return page <= totalPages ? (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === page 
                          ? 'bg-green-600 text-white' 
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <InventoryModal
          type={modalType}
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onSave={modalType === 'add' ? handleAddProduct : modalType === 'edit' ? handleUpdateProduct : undefined}
          onDelete={modalType === 'delete' ? handleDeleteProduct : undefined}
          onStockOperation={modalType === 'import' || modalType === 'export' ? handleStockOperation : undefined}
        />
      )}
    </div>
    </AdminLayout>
  );
};

// Component Modal
interface InventoryModalProps {
  type: 'add' | 'edit' | 'view' | 'import' | 'export' | 'delete';
  product: InventoryProduct | null;
  onClose: () => void;
  onSave?: (data: Partial<InventoryProduct>) => void;
  onDelete?: () => void;
  onStockOperation?: (type: 'import' | 'export', quantity: number, note: string) => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ 
  type, 
  product, 
  onClose, 
  onSave, 
  onDelete, 
  onStockOperation 
}) => {
  const [formData, setFormData] = useState<Partial<InventoryProduct>>(
    product || {
      code: '',
      name: '',
      type: 'car',
      description: '',
      quantity: 0,
      minQuantity: 5,
      location: '',
      price: 0,
    }
  );
  const [stockQuantity, setStockQuantity] = useState(0);
  const [stockNote, setStockNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'delete') {
      onDelete?.();
    } else if (type === 'import' || type === 'export') {
      onStockOperation?.(type, stockQuantity, stockNote);
    } else {
      onSave?.(formData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {type === 'add' && 'Thêm sản phẩm mới'}
              {type === 'edit' && 'Chỉnh sửa sản phẩm'}
              {type === 'view' && 'Chi tiết sản phẩm'}
              {type === 'import' && 'Nhập kho'}
              {type === 'export' && 'Xuất kho'}
              {type === 'delete' && 'Xác nhận xóa'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {type === 'view' && product && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">Mã: {product.code}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.type === 'car' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {product.type === 'car' ? 'Ô tô điện' : 'Xe máy điện'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Số lượng tồn kho</p>
                  <p className="text-2xl font-bold text-gray-900">{product.quantity}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Số lượng tối thiểu</p>
                  <p className="text-2xl font-bold text-gray-900">{product.minQuantity}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Vị trí</p>
                  <p className="text-lg font-medium text-gray-900">{product.location}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Giá</p>
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(product.price)}</p>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-3">Lịch sử nhập/xuất kho</h5>
                <div className="max-h-60 overflow-y-auto">
                  {product.history.length > 0 ? (
                    <div className="space-y-2">
                      {product.history.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded-full ${
                              entry.type === 'import' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {entry.type === 'import' ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {entry.type === 'import' ? 'Nhập' : 'Xuất'} {entry.quantity} sản phẩm
                              </p>
                              <p className="text-xs text-gray-600">{entry.note}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">{formatDate(entry.date)}</p>
                            <p className="text-xs text-gray-500">bởi {entry.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Chưa có lịch sử nhập/xuất kho</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(type === 'add' || type === 'edit') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã sản phẩm</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại sản phẩm</label>
                <select
                  value={formData.type || 'car'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'car' | 'motorbike' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="car">Ô tô điện</option>
                  <option value="motorbike">Xe máy điện</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity || 0}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng tối thiểu</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minQuantity || 5}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí trong kho</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ví dụ: Khu A - Kệ 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VND)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {(type === 'import' || type === 'export') && product && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-600">Mã: {product.code}</p>
                <p className="text-sm text-gray-600">Tồn kho hiện tại: <span className="font-medium">{product.quantity}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng {type === 'import' ? 'nhập' : 'xuất'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={type === 'export' ? product.quantity : undefined}
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                {type === 'export' && stockQuantity > product.quantity && (
                  <p className="text-red-600 text-sm mt-1">Số lượng xuất không được vượt quá tồn kho</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder={`Ghi chú cho lần ${type === 'import' ? 'nhập' : 'xuất'} kho này...`}
                />
              </div>

              {type === 'import' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    Sau khi nhập: <span className="font-medium">{product.quantity + stockQuantity}</span> sản phẩm
                  </p>
                </div>
              )}

              {type === 'export' && stockQuantity > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Sau khi xuất: <span className="font-medium">{product.quantity - stockQuantity}</span> sản phẩm
                  </p>
                </div>
              )}
            </div>
          )}

          {type === 'delete' && product && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Xác nhận xóa sản phẩm
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Bạn có chắc chắn muốn xóa sản phẩm <strong>{product.name}</strong> không? 
                Hành động này không thể hoàn tác.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            {type !== 'view' && (
              <button
                type="submit"
                disabled={
                  (type === 'import' || type === 'export') && (stockQuantity <= 0 || (type === 'export' && stockQuantity > (product?.quantity || 0)))
                }
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {type === 'add' && 'Thêm sản phẩm'}
                  {type === 'edit' && 'Cập nhật'}
                  {type === 'import' && 'Nhập kho'}
                  {type === 'export' && 'Xuất kho'}
                  {type === 'delete' && 'Xóa'}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
      </div>
  );
};

export default Inventory;
