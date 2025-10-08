import React, { useEffect, useState } from "react";
import { AdminLayout } from "../admin/AdminLayout";
import { get, put, post } from "../../../services/httpClient";
import { authService } from "../../../services/authService";
import "../../../styles/antd-custom.css";
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Tag, 
  Space, 
  Typography, 
  Table,
  Modal,
  Form,
  InputNumber,
  message,
  Statistic,
  Select,
  Tooltip,
  Tabs,
  Radio,
  Transfer
} from 'antd';
import { 
  CarOutlined, 
  AppstoreOutlined,
  EditOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ShareAltOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Product {
  _id: string;
  name: string;
  model: string;
  category: string;
  manufacturer_id: string | { _id: string; name: string };
  sku: string;
  price: number;
  status: string;
  stocks: Array<{
    owner_type: string;
    owner_id: string;
    quantity: number;
    _id: string;
  }>;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface Dealer {
  _id: string;
  company_name: string;
  name?: string; // Fallback compatibility
  email?: string;
  phone?: string;
  address?: string;
  code?: string;
  isActive?: boolean;
}


const InventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [dealerLoading, setDealerLoading] = useState(false);
  const [updateForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [distributeForm] = Form.useForm();

  // Helper function để lấy manufacturer stock
  const getManufacturerStock = (product: Product) => {
    const manufacturerStock = product.stocks?.find(stock => stock.owner_type === 'manufacturer');
    return manufacturerStock?.quantity || 0;
  };

  // Helper function để lấy dealer stock total
  const getDealerStock = (product: Product) => {
    return product.stocks?.filter(stock => stock.owner_type === 'dealer')
      .reduce((sum, stock) => sum + stock.quantity, 0) || 0;
  };

  const getStockStatus = (product: Product) => {
    const manufacturerQuantity = getManufacturerStock(product);
    if (manufacturerQuantity === 0) {
      return { status: 'error', text: 'Hết hàng', color: 'red' };
    } else if (manufacturerQuantity < 10) {
      return { status: 'warning', text: 'Sắp hết', color: 'orange' };
    } else {
      return { status: 'success', text: 'Còn hàng', color: 'green' };
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🚀 InventoryManagement: Fetching vehicles using authService...');
      
      // Sử dụng cùng API như ProductManagement để đảm bảo consistency
      // Fetch tất cả xe bằng cách tăng limit lên cao
      const response = await authService.getVehicles({ 
        page: 1, 
        limit: 100  // Tăng limit để lấy tất cả xe
      });
      console.log('📡 InventoryManagement: authService response:', response);
      
      // Xử lý response data
      let productsData = [];
      if (response.success && response.data) {
        const responseData = response.data as Record<string, unknown>;
        console.log('📊 InventoryManagement: responseData:', responseData);
        
        if (responseData.data && Array.isArray(responseData.data)) {
          productsData = responseData.data;
          console.log('✅ InventoryManagement: Using responseData.data, count:', responseData.data.length);
        } else if (Array.isArray(responseData)) {
          productsData = responseData;
          console.log('✅ InventoryManagement: Using responseData directly, count:', responseData.length);
        } else {
          console.warn('❌ InventoryManagement: Unexpected API response format:', responseData);
          productsData = [];
        }
      } else {
        console.error('❌ InventoryManagement: API call failed:', response.message);
        productsData = [];
      }
      
      console.log('Products loaded:', productsData.length);
      setProducts(productsData);
      
      // Log statistics với chi tiết từng sản phẩm
      const totalStock = productsData.reduce((sum: number, product: any) => {
        const manufacturerStock = product.stocks?.find((s: any) => s.owner_type === 'manufacturer')?.quantity || 0;
        const dealerStock = product.stocks?.filter((s: any) => s.owner_type === 'dealer')
          .reduce((dSum: number, s: any) => dSum + s.quantity, 0) || 0;
        const totalProductStock = manufacturerStock + dealerStock;
        
        console.log(`Product: ${product.name} (${product.sku})`);
        console.log(`  - Manufacturer: ${manufacturerStock}, Dealer: ${dealerStock}, Total: ${totalProductStock}`);
        return sum + manufacturerStock; // Chỉ tính manufacturer stock cho tổng
      }, 0);
      console.log('Total products:', productsData.length);
      console.log('Total manufacturer stock:', totalStock);
      
      // Tìm và log sản phẩm vf9 cụ thể
      const vf9Product = productsData.find((p: any) => p.sku === 'VF9-0626-1925' || p.name.toLowerCase().includes('vf9'));
      if (vf9Product) {
        console.log('=== VF9 PRODUCT DETAILS ===');
        console.log('Product:', vf9Product);
        console.log('Stocks array:', vf9Product.stocks);
        
        const manufacturerStock = vf9Product.stocks?.find((s: any) => s.owner_type === 'manufacturer')?.quantity || 0;
        const dealerStock = vf9Product.stocks?.filter((s: any) => s.owner_type === 'dealer')
          .reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
          
        console.log('VF9 Manufacturer Stock:', manufacturerStock);
        console.log('VF9 Dealer Stock:', dealerStock);
        console.log('VF9 Total Stock:', manufacturerStock + dealerStock);
      }
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setDealerLoading(true);
      console.log('Fetching dealers from API...');
      
      const res = await get<{ success: boolean; data: { data: Dealer[] } }>('/api/dealerships');
      console.log('Dealers API Response:', res);
      
      if (res.success && Array.isArray(res.data.data)) {
        const dealerData = res.data.data;
        console.log(`Fetched ${dealerData.length} dealers from API`);
        
        const mappedDealers = dealerData.map((dealer: any) => ({
          _id: dealer._id,
          company_name: dealer.company_name || dealer.name, // Use company_name with fallback
          name: dealer.name, // Keep for compatibility
          code: dealer.code,
          email: dealer.contact?.email || dealer.email,
          phone: dealer.contact?.phone || dealer.phone,
          address: typeof dealer.address === 'string' ? dealer.address : dealer.address?.full_address,
          isActive: dealer.isActive
        }));
        
        setDealers(mappedDealers);
      } else {
        console.log('API returned no dealers');
        setDealers([]);
      }
    } catch (error: any) {
      console.error('Error fetching dealers:', error);
      setDealers([]);
    } finally {
      setDealerLoading(false);
    }
  };



  // Filter products by category - with safety checks
  const carProducts = products?.filter(product => product?.category === 'car') || [];
  const motorbikeProducts = products?.filter(product => product?.category === 'motorbike') || [];

  // Filter products - with safety checks
  const filteredProducts = (products || []).filter((product) => {
    if (!product) return false;
    
    const matchesSearch = 
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.model?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter cars - with safety checks
  const filteredCars = (carProducts || []).filter((product) => {
    if (!product) return false;
    
    const matchesSearch = 
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.model?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter motorbikes - with safety checks
  const filteredMotorbikes = (motorbikeProducts || []).filter((product) => {
    if (!product) return false;
    
    const matchesSearch = 
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.model?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics for all products - with safety checks
  const totalProducts = (products || []).length; // Tổng sản phẩm (không filter)
  const filteredProductsCount = (filteredProducts || []).length; // Sản phẩm sau filter
  
  // Tổng stock manufacturer của tất cả sản phẩm (không filter)
  const totalStock = (products || []).reduce((sum, product) => {
    if (!product) return sum;
    return sum + getManufacturerStock(product);
  }, 0);
  
  // Tổng stock manufacturer của sản phẩm sau filter
  const filteredTotalStock = (filteredProducts || []).reduce((sum, product) => {
    if (!product) return sum;
    return sum + getManufacturerStock(product);
  }, 0);
  
  // Sản phẩm sắp hết hàng (manufacturer stock < 10)
  const lowStockProducts = (products || []).filter(product => {
    if (!product) return false;
    const manufacturerQuantity = getManufacturerStock(product);
    return manufacturerQuantity < 10;
  }).length;

  // Calculate statistics for cars - with safety checks
  const carStats = {
    total: (carProducts || []).length,
    filtered: (filteredCars || []).length,
    totalStock: (carProducts || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getManufacturerStock(product);
    }, 0),
    filteredStock: (filteredCars || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getManufacturerStock(product);
    }, 0),
    lowStock: (carProducts || []).filter(product => {
      if (!product) return false;
      const manufacturerQuantity = getManufacturerStock(product);
      return manufacturerQuantity < 10;
    }).length
  };

  // Calculate statistics for motorbikes - with safety checks
  const motorbikeStats = {
    total: (motorbikeProducts || []).length,
    filtered: (filteredMotorbikes || []).length,
    totalStock: (motorbikeProducts || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getManufacturerStock(product);
    }, 0),
    filteredStock: (filteredMotorbikes || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getManufacturerStock(product);
    }, 0),
    lowStock: (motorbikeProducts || []).filter(product => {
      if (!product) return false;
      const manufacturerQuantity = getManufacturerStock(product);
      return manufacturerQuantity < 10;
    }).length
  };

  const handleUpdateInventory = (product: Product) => {
    setSelectedProduct(product);
    const currentStock = getManufacturerStock(product);
    updateForm.setFieldsValue({
      quantity: currentStock
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      if (!selectedProduct) return;

      const stockData = {
        stocks: [{
          owner_type: "manufacturer",
          owner_id: typeof selectedProduct.manufacturer_id === 'string' 
            ? selectedProduct.manufacturer_id 
            : selectedProduct.manufacturer_id?._id || '',
          quantity: values.quantity
        }]
      };

      await put(`/api/vehicles/${selectedProduct._id}`, stockData);
      message.success('Cập nhật tồn kho thành công');
      setShowUpdateModal(false);
      fetchProducts();
    } catch (err) {
      message.error('Không thể cập nhật tồn kho');
    }
  };

  const handleUpdateStatus = (product: Product) => {
    console.log('Opening status update modal for product:', product);
    setSelectedProduct(product);
    
    // Reset form trước khi set giá trị mới
    statusForm.resetFields();
    
    // Set giá trị với delay nhỏ để đảm bảo form đã được reset
    setTimeout(() => {
      statusForm.setFieldsValue({
        status: product.status
      });
      console.log('Form values set to:', product.status);
    }, 100);
    
    setShowStatusModal(true);
  };

  const handleSubmitStatusUpdate = async () => {
    try {
      console.log('Starting status update...');
      const values = await statusForm.validateFields();
      console.log('Form values:', values);
      
      if (!selectedProduct) {
        console.error('No selected product');
        return;
      }

      console.log('Selected product:', selectedProduct._id);
      console.log('New status:', values.status);

      // Tạo FormData đơn giản chỉ với status
      const formData = new FormData();
      formData.append('status', values.status);
      
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      console.log('Making API call to:', `/api/vehicles/${selectedProduct._id}`);
      const response = await put(`/api/vehicles/${selectedProduct._id}`, formData);
      console.log('API response:', response);
      
      message.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      setSelectedProduct(null);
      statusForm.resetFields();
      fetchProducts();
    } catch (err: any) {
      console.error('Error updating status:', err);
      console.error('Error details:', err.response?.data);
      message.error(`Không thể cập nhật trạng thái: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDistributeVehicle = (product: Product) => {
    console.log('Opening distribute modal for product:', product);
    setSelectedProduct(product);
    setTargetKeys([]);
    setSelectedKeys([]);
    distributeForm.resetFields();
    setShowDistributeModal(true);
    
    // Refresh dealers nếu chưa có
    if (dealers.length === 0) {
      fetchDealers();
    }
  };

  const handleSubmitDistribute = async () => {
    try {
      if (!selectedProduct || targetKeys.length === 0) {
        message.warning('Vui lòng chọn ít nhất một đại lý');
        return;
      }

      const values = await distributeForm.validateFields();
      console.log('Distribute form values:', values);

      const currentStock = getManufacturerStock(selectedProduct);
      const distributeQuantity = values.quantity || 1;

      // Kiểm tra tồn kho manufacturer
      if (distributeQuantity > currentStock) {
        message.error(`Số lượng phân phối (${distributeQuantity}) không được vượt quá tồn kho của nhà sản xuất (${currentStock})`);
        return;
      }

      // Extract dealerId from targetKey (format: "dealer-{dealerId}-{index}")
      const selectedKey = targetKeys[0];
      const dealerId = selectedKey ? selectedKey.split('-')[1] : null;
      
      if (!dealerId) {
        message.error('Không thể xác định đại lý được chọn');
        return;
      }

      const distributionData = {
        vehicle_id: selectedProduct._id,
        dealership_id: dealerId, // Sử dụng dealerId đã extract
        quantity: distributeQuantity,
        notes: values.notes || "Initial stock allocation for new dealership"
      };

      console.log('Distributing vehicle:', distributionData);
      
      // Gọi API phân phối
      const response = await post('/api/vehicles/distribute', distributionData);
      console.log('Distribution response:', response);
      
      if (response.success) {
        // Cập nhật tồn kho sau khi phân phối thành công
        const newStockQuantity = currentStock - distributeQuantity;
        
        const stockUpdateData = {
          stocks: [{
            owner_type: "manufacturer",
            owner_id: typeof selectedProduct.manufacturer_id === 'string' 
              ? selectedProduct.manufacturer_id 
              : selectedProduct.manufacturer_id?._id || '',
            quantity: newStockQuantity
          }]
        };

        console.log('Updating stock after distribution:', stockUpdateData);
        
        try {
          const stockResponse = await put(`/api/vehicles/${selectedProduct._id}`, stockUpdateData);
          console.log('Stock update response:', stockResponse);
          console.log('Stock updated successfully - New quantity:', newStockQuantity);
          message.success(`Đã phân phối ${distributeQuantity} xe "${selectedProduct.name}" cho đại lý! Tồn kho còn lại: ${newStockQuantity}`);
        } catch (stockError: any) {
          console.error('Error updating stock:', stockError);
          console.error('Stock error details:', stockError.response?.data);
          message.warning('Phân phối thành công nhưng có lỗi khi cập nhật tồn kho. Vui lòng kiểm tra lại.');
          
          // Log chi tiết lỗi để debug
          message.error(`Chi tiết lỗi: ${stockError.response?.data?.message || stockError.message}`);
        }

        setShowDistributeModal(false);
        setSelectedProduct(null);
        setTargetKeys([]);
        setSelectedKeys([]);
        distributeForm.resetFields();
        
        // Đợi một chút trước khi refresh để đảm bảo backend đã cập nhật
        setTimeout(() => {
          console.log('Refreshing products after distribution...');
          fetchProducts(); // Refresh danh sách xe
        }, 500);
      } else {
        message.error(response.message || 'Có lỗi xảy ra khi phân phối xe');
      }
    } catch (error: any) {
      console.error('Error distributing vehicle:', error);
      
      if (error.response?.status === 400) {
        message.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (error.response?.status === 403) {
        message.error('Bạn không có quyền phân phối xe.');
      } else if (error.response?.status === 404) {
        message.error('Không tìm thấy xe hoặc đại lý.');
      } else {
        message.error(error.response?.data?.message || 'Có lỗi xảy ra khi phân phối xe');
      }
    }
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: string[]) => (
        <div style={{ width: 60, height: 40 }}>
          {images && images.length > 0 ? (
            <img
              src={images[0]}
              alt="Product"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#f8f9fa',
                borderRadius: 4
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4
            }}>
              <CarOutlined style={{ color: '#d9d9d9' }} />
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Thông tin sản phẩm',
      key: 'productInfo',
      render: (record: Product) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {record.name}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.model} | SKU: {record.sku}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {typeof record.manufacturer_id === 'string' 
              ? record.manufacturer_id 
              : record.manufacturer_id?.name}
          </div>
        </div>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={category === 'car' ? 'blue' : 'green'}>
          {category === 'car' ? 'Ô tô' : 'Xe máy'}
        </Tag>
      )
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => (
        <Text strong style={{ color: '#f5222d' }}>
          {price?.toLocaleString()}₫
        </Text>
      )
    },
    {
      title: 'Tồn kho',
      key: 'stock',
      width: 120,
      render: (record: Product) => {
        const manufacturerQuantity = getManufacturerStock(record);
        const dealerQuantity = getDealerStock(record);
        const stockStatus = getStockStatus(record);
        return (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>
              {manufacturerQuantity}
            </div>
            <Tag color={stockStatus.color}>
              {stockStatus.text}
            </Tag>
            {dealerQuantity > 0 && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Đã phân phối: {dealerQuantity}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 220,
      render: (record: Product) => (
        <Space>
          <Tooltip title="Cập nhật tồn kho">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleUpdateInventory(record)}
            />
          </Tooltip>
          <Tooltip title="Phân phối cho đại lý">
            <Button
              type="default"
              size="small"
              icon={<ShareAltOutlined />}
              onClick={() => handleDistributeVehicle(record)}
              disabled={record.status !== 'active'}
              style={{
                color: '#1890ff',
                borderColor: '#1890ff'
              }}
            />
          </Tooltip>
          <Tooltip title="Cập nhật trạng thái">
            <Button
              type={record.status === 'active' ? 'default' : 'primary'}
              size="small"
              icon={record.status === 'active' ? <WarningOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleUpdateStatus(record)}
              style={{
                color: record.status === 'active' ? '#ff4d4f' : '#52c41a',
                borderColor: record.status === 'active' ? '#ff4d4f' : '#52c41a'
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // Component để render statistics
  const renderStatistics = (stats: any, title: string, icon: React.ReactNode, color: string) => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title={`${title} - Tổng sản phẩm`}
            value={stats.total}
            prefix={icon}
            valueStyle={{ color }}
            suffix={stats.filtered !== stats.total ? `(${stats.filtered} hiển thị)` : ''}
          />
        </Card>
      </Col>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title={`${title} - Tổng tồn kho`}
            value={stats.totalStock}
            prefix={<InboxOutlined />}
            valueStyle={{ color: '#52c41a' }}
            suffix={stats.filteredStock !== stats.totalStock ? `(${stats.filteredStock} hiển thị)` : ''}
          />
        </Card>
      </Col>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title={`${title} - Sắp hết hàng`}
            value={stats.lowStock}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#faad14' }}
            suffix="< 10 sản phẩm"
          />
        </Card>
      </Col>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title={`${title} - Trung bình tồn kho`}
            value={stats.total > 0 ? Math.round(stats.totalStock / stats.total) : 0}
            prefix={<AppstoreOutlined />}
            valueStyle={{ color: '#722ed1' }}
            suffix="sản phẩm/loại"
          />
        </Card>
      </Col>
    </Row>
  );

  // Component để render filters
  const renderFilters = () => (
    <Card style={{ marginBottom: 16 }}>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="w-full sm:w-1/2 md:w-1/3">
          <Search
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
        <div className="w-full sm:w-1/2 md:w-1/3">
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>
    </Card>
  );

  // Component để render table
  const renderTable = (data: Product[], loading: boolean) => (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
      }}
      scroll={{ x: 1200 }}
    />
  );

  // Debug render
  console.log('InventoryManagement render - products:', products?.length || 0);
  console.log('InventoryManagement render - error:', error);
  console.log('InventoryManagement render - loading:', loading);

  // Early return if critical error
  if (error && !products.length) {
    return (
      <AdminLayout activeSection="inventory-management">
        <div className="p-6">
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 16,
            color: '#ff4d4f',
            textAlign: 'center'
          }}>
            <h3>Có lỗi xảy ra</h3>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeSection="inventory-management">
      <div>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            <InboxOutlined style={{ marginRight: 8 }} />
            Quản lý tồn kho
          </Title>
          <Text type="secondary">
            Quản lý số lượng tồn kho của các sản phẩm
          </Text>
        </div>

        {/* Tabs cho từng loại xe */}
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: (
                <span>
                  <AppstoreOutlined />
                  Tất cả sản phẩm ({totalProducts})
                </span>
              ),
              children: (
                <div>
                  {/* Statistics cho tất cả */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                      <Card>
                        <Statistic
                          title="Tổng sản phẩm"
                          value={totalProducts}
                          prefix={<AppstoreOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                          suffix={filteredProductsCount !== totalProducts ? `(${filteredProductsCount} hiển thị)` : ''}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Card>
                        <Statistic
                          title="Tổng tồn kho"
                          value={totalStock}
                          prefix={<InboxOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                          suffix={filteredTotalStock !== totalStock ? `(${filteredTotalStock} hiển thị)` : ''}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Card>
                        <Statistic
                          title="Sắp hết hàng"
                          value={lowStockProducts}
                          prefix={<WarningOutlined />}
                          valueStyle={{ color: '#faad14' }}
                          suffix="< 10 sản phẩm"
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Card>
                        <Statistic
                          title="Trung bình tồn kho"
                          value={totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0}
                          prefix={<CarOutlined />}
                          valueStyle={{ color: '#722ed1' }}
                          suffix="sản phẩm/loại"
                        />
                      </Card>
                    </Col>
                  </Row>
                  {renderFilters()}
                  {renderTable(filteredProducts, loading)}
                </div>
              )
            },
            {
              key: 'cars',
              label: (
                <span>
                  <CarOutlined />
                  Ô tô ({carStats.total})
                </span>
              ),
              children: (
                <div>
                  {renderStatistics(carStats, "Ô tô", <CarOutlined />, '#1890ff')}
                  {renderFilters()}
                  {renderTable(filteredCars, loading)}
                </div>
              )
            },
            {
              key: 'motorbikes',
              label: (
                <span>
                  <ThunderboltOutlined />
                  Xe máy điện ({motorbikeStats.total})
                </span>
              ),
              children: (
                <div>
                  {renderStatistics(motorbikeStats, "Xe máy điện", <ThunderboltOutlined />, '#52c41a')}
                  {renderFilters()}
                  {renderTable(filteredMotorbikes, loading)}
                </div>
              )
            }
          ]}
        />

        {/* Error */}
        {error && (
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 16,
            color: '#ff4d4f'
          }}>
            {error}
          </div>
        )}

        {/* Update Inventory Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EditOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Cập nhật tồn kho
            </div>
          }
          open={showUpdateModal}
          onCancel={() => setShowUpdateModal(false)}
          onOk={handleSubmitUpdate}
          okText="Cập nhật"
          cancelText="Hủy"
        >
          {selectedProduct && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Sản phẩm: </Text>
                <Text>{selectedProduct.name} - {selectedProduct.model}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>SKU: </Text>
                <Text>{selectedProduct.sku}</Text>
              </div>
              <Form form={updateForm} layout="vertical">
                <Form.Item
                  label="Số lượng tồn kho"
                  name="quantity"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng' },
                    { type: 'number', min: 0, message: 'Số lượng phải >= 0' }
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={10000}
                    style={{ width: '100%' }}
                    placeholder="Nhập số lượng tồn kho"
                  />
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>

        {/* Update Status Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              Cập nhật trạng thái sản phẩm
            </div>
          }
          open={showStatusModal}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedProduct(null);
            statusForm.resetFields();
          }}
          onOk={handleSubmitStatusUpdate}
          okText="Cập nhật"
          cancelText="Hủy"
          okButtonProps={{ 
            style: { 
              background: '#52c41a', 
              borderColor: '#52c41a' 
            } 
          }}
        >
          {selectedProduct && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Sản phẩm: {selectedProduct.name}</Text>
                <br />
                <Text type="secondary">SKU: {selectedProduct.sku}</Text>
                <br />
                <Text type="secondary">Trạng thái hiện tại: {selectedProduct.status}</Text>
              </div>
              <Form form={statusForm} layout="vertical">
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Radio.Group 
                    style={{ width: '100%' }}
                    onChange={(e) => {
                      console.log('Radio onChange:', e.target.value);
                      console.log('Form values after radio change:', statusForm.getFieldsValue());
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Radio value="active" style={{ fontSize: '16px', padding: '8px' }}>
                        <Tag color="green" style={{ marginLeft: '8px' }}>Hoạt động</Tag>
                      </Radio>
                      <Radio value="inactive" style={{ fontSize: '16px', padding: '8px' }}>
                        <Tag color="red" style={{ marginLeft: '8px' }}>Không hoạt động</Tag>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Form>
              <div style={{ 
                padding: 12, 
                backgroundColor: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                marginTop: 16
              }}>
                <Text type="success">
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  Lưu ý: Thay đổi trạng thái sẽ ảnh hưởng đến việc hiển thị sản phẩm trong hệ thống.
                </Text>
              </div>
            </div>
          )}
        </Modal>

        {/* Distribute Vehicle Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ShareAltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Phân phối xe cho đại lý
            </div>
          }
          open={showDistributeModal}
          onCancel={() => {
            setShowDistributeModal(false);
            setSelectedProduct(null);
            setTargetKeys([]);
            setSelectedKeys([]);
            distributeForm.resetFields();
          }}
          onOk={handleSubmitDistribute}
          width={800}
          okText="Phân phối xe"
          cancelText="Hủy"
          confirmLoading={loading}
          okButtonProps={{
            disabled: targetKeys.length === 0
          }}
        >
          {selectedProduct && (
            <div>
              {/* Product Info */}
              <div style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div>
                      <Text strong style={{ color: '#495057' }}>Xe:</Text>
                      <br />
                      <Text style={{ fontSize: '16px', fontWeight: 500, color: '#1890ff' }}>
                        {selectedProduct.name}
                      </Text>
                      <br />
                      <Text type="secondary">{selectedProduct.model} - {selectedProduct.sku}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <Text strong style={{ color: '#495057' }}>Tồn kho nhà sản xuất:</Text>
                      <br />
                      <Text style={{ fontSize: '16px', fontWeight: 500, color: '#52c41a' }}>
                        {getManufacturerStock(selectedProduct)} xe
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Đã phân phối: {getDealerStock(selectedProduct)} xe
                      </Text>
                      <br />
                      <Text type="secondary">
                        Giá: {selectedProduct.price?.toLocaleString()}₫
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Form */}
              <Form form={distributeForm} layout="vertical">
                <Form.Item
                  name="quantity"
                  label={`Số lượng xe phân phối (Tồn kho NSX: ${getManufacturerStock(selectedProduct)} xe)`}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng xe' },
                    { type: 'number', min: 1, message: 'Số lượng phải >= 1' },
                    { 
                      type: 'number', 
                      max: getManufacturerStock(selectedProduct), 
                      message: `Số lượng không được vượt quá tồn kho nhà sản xuất (${getManufacturerStock(selectedProduct)} xe)` 
                    }
                  ]}
                  initialValue={1}
                >
                  <InputNumber
                    min={1}
                    max={getManufacturerStock(selectedProduct)}
                    style={{ width: '100%' }}
                    placeholder="Nhập số lượng xe muốn phân phối"
                    addonAfter="xe"
                  />
                </Form.Item>

                <Form.Item
                  name="notes"
                  label="Ghi chú (tùy chọn)"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập ghi chú về việc phân phối xe này..."
                  />
                </Form.Item>
              </Form>
              
              {/* Transfer Component */}
              {dealerLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <ReloadOutlined spin style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div style={{ marginTop: '12px' }}>
                    <Text>Đang tải danh sách đại lý...</Text>
                  </div>
                </div>
              ) : dealers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ 
                    fontSize: '48px', 
                    color: '#d9d9d9', 
                    marginBottom: '16px'
                  }}>
                    🏢
                  </div>
                  <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                    Chưa có đại lý nào trong hệ thống
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '24px' }}>
                    Vui lòng thêm đại lý mới để có thể phân phối xe
                  </Text>
                  <Button 
                    type="primary" 
                    onClick={fetchDealers}
                    icon={<ReloadOutlined />}
                    loading={dealerLoading}
                  >
                    Tải lại danh sách
                  </Button>
                </div>
              ) : (
                <div>
                  <Text strong style={{ fontSize: '16px', marginBottom: '16px', display: 'block' }}>
                    Chọn đại lý nhận xe:
                  </Text>
                  <Transfer
                    dataSource={dealers.map((dealer, index) => ({
                      key: `dealer-${dealer._id}-${index}`,
                      title: dealer.company_name || dealer.name || 'Tên không xác định',
                      description: `${dealer.code || 'N/A'} - ${dealer.email || 'N/A'} - ${dealer.phone || 'N/A'}`,
                      disabled: !dealer.isActive,
                      dealerId: dealer._id // Thêm dealerId để tracking
                    }))}
                    titles={[
                      `Danh sách đại lý (${dealers.length})`, 
                      `Đại lý được chọn (${targetKeys.length})`
                    ]}
                    targetKeys={targetKeys}
                    selectedKeys={selectedKeys}
                    onChange={(keys) => setTargetKeys(keys.slice(0, 1) as string[])} // Chỉ cho phép chọn 1 đại lý
                    onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
                      setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys] as string[]);
                    }}
                    render={item => (
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ fontWeight: 500, color: item.disabled ? '#bfbfbf' : '#262626' }}>
                          {item.title}
                          {item.disabled && <Text type="secondary"> (Không hoạt động)</Text>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {item.description}
                        </div>
                      </div>
                    )}
                    listStyle={{
                      width: 300,
                      height: 300,
                    }}
                    showSearch
                    filterOption={(inputValue, option) =>
                      (option.title || '').toLowerCase().includes(inputValue.toLowerCase()) ||
                      (option.description || '').toLowerCase().includes(inputValue.toLowerCase())
                    }
                    locale={{
                      itemUnit: 'đại lý',
                      itemsUnit: 'đại lý'
                    }}
                    oneWay={false}
                    showSelectAll={false}
                  />
                </div>
              )}
              
              {targetKeys.length > 0 && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: '#e6f4ff', 
                  borderRadius: '6px',
                  border: '1px solid #91caff'
                }}>
                  <Text style={{ color: '#0958d9' }}>
                    ✓ Đã chọn đại lý để phân phối xe
                  </Text>
                </div>
              )}

              {/* Warning about stock reduction */}
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#fff7e6', 
                borderRadius: '6px',
                border: '1px solid #ffd591'
              }}>
                <Text style={{ color: '#d46b08' }}>
                  ⚠️ <strong>Lưu ý:</strong> Sau khi phân phối, tồn kho của nhà sản xuất sẽ giảm tương ứng với số lượng xe đã phân phối.
                </Text>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default InventoryManagement;
