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
    color?: string;
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
  const [showDistributionHistoryModal, setShowDistributionHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [dealerLoading, setDealerLoading] = useState(false);
  const [updateForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [distributeForm] = Form.useForm();

  // Helper function để tạo color dot
  const getColorDot = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'đỏ': '#ff4d4f',
      'xanh': '#1890ff',
      'vàng': '#faad14',
      'trắng': '#ffffff',
      'đen': '#000000',
      'xanh lá': '#52c41a',
      'tím': '#722ed1',
      'cam': '#fa8c16',
      'hồng': '#eb2f96',
      'xám': '#8c8c8c'
    };
    
    const normalizedColor = color?.toLowerCase()?.trim();
    return colorMap[normalizedColor] || '#d9d9d9';
  };

  // Helper function để lấy manufacturer stock
  const getManufacturerStock = (product: Product) => {
    if (!product.stocks || !Array.isArray(product.stocks)) {
      console.log('🔍 Product has no stocks array:', product.name, product.stocks);
      return 0;
    }
    
    const manufacturerStocks = product.stocks.filter(stock => stock.owner_type === 'manufacturer');
    const totalManufacturerStock = manufacturerStocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    
    console.log('🔍 Manufacturer stocks for', product.name, ':', manufacturerStocks, 'Total:', totalManufacturerStock);
    return totalManufacturerStock;
  };

  // Helper function để lấy dealer stock total
  const getDealerStock = (product: Product) => {
    if (!product.stocks || !Array.isArray(product.stocks)) {
      return 0;
    }
    
    const dealerStocks = product.stocks.filter(stock => stock.owner_type === 'dealer');
    const totalDealerStock = dealerStocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    
    console.log('🔍 Dealer stocks for', product.name, ':', dealerStocks, 'Total:', totalDealerStock);
    return totalDealerStock;
  };

  // Helper function để lấy stock của dealership cụ thể
  const getStockByDealershipId = (product: Product, dealershipId: string) => {
    if (!product.stocks || !Array.isArray(product.stocks)) {
      return 0;
    }
    
    const dealershipStocks = product.stocks.filter(
      stock => stock.owner_type === 'dealer' && stock.owner_id === dealershipId
    );
    
    const totalStock = dealershipStocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    
    console.log(`🔍 Stock for dealership ${dealershipId} in ${product.name}:`, dealershipStocks, 'Total:', totalStock);
    return totalStock;
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

      // Tìm stock của dealership ID cụ thể
      const targetDealershipId = '68e0f49d303c18f5d438aee9';
      console.log('=== SEARCHING FOR DEALERSHIP STOCK ===');
      console.log('Target Dealership ID:', targetDealershipId);
      
      let totalStockForDealership = 0;
      productsData.forEach((product: any) => {
        if (product.stocks && Array.isArray(product.stocks)) {
          const dealershipStocks = product.stocks.filter(
            (stock: any) => stock.owner_type === 'dealer' && stock.owner_id === targetDealershipId
          );
          
          if (dealershipStocks.length > 0) {
            const productStock = dealershipStocks.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0);
            totalStockForDealership += productStock;
            
            console.log(`✅ Found stock in ${product.name} (${product.sku}):`, dealershipStocks);
            console.log(`   Total for this product: ${productStock} xe`);
          }
        }
      });
      
      console.log(`🎯 TOTAL STOCK FOR DEALERSHIP ${targetDealershipId}: ${totalStockForDealership} xe`);
      
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
  
  // Tổng stock dealer của tất cả sản phẩm (không filter)
  const totalDealerStock = (products || []).reduce((sum, product) => {
    if (!product) return sum;
    return sum + getDealerStock(product);
  }, 0);
  
  // Tổng stock manufacturer của sản phẩm sau filter
  const filteredTotalStock = (filteredProducts || []).reduce((sum, product) => {
    if (!product) return sum;
    return sum + getManufacturerStock(product);
  }, 0);
  
  // Tổng stock dealer của sản phẩm sau filter
  const filteredTotalDealerStock = (filteredProducts || []).reduce((sum, product) => {
    if (!product) return sum;
    return sum + getDealerStock(product);
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
    totalDealerStock: (carProducts || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getDealerStock(product);
    }, 0),
    filteredStock: (filteredCars || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getManufacturerStock(product);
    }, 0),
    filteredDealerStock: (filteredCars || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getDealerStock(product);
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
    totalDealerStock: (motorbikeProducts || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getDealerStock(product);
    }, 0),
    filteredStock: (filteredMotorbikes || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getManufacturerStock(product);
    }, 0),
    filteredDealerStock: (filteredMotorbikes || []).reduce((sum, product) => {
      if (!product) return sum;
      return sum + getDealerStock(product);
    }, 0),
    lowStock: (motorbikeProducts || []).filter(product => {
      if (!product) return false;
      const manufacturerQuantity = getManufacturerStock(product);
      return manufacturerQuantity < 10;
    }).length
  };

  const handleUpdateInventory = (product: Product) => {
    setSelectedProduct(product);
    
    // Tạo form values từ stocks hiện tại
    const manufacturerStocks = product.stocks?.filter(stock => 
      stock.owner_type === 'manufacturer' && stock.color && stock.color.trim() !== ''
    ) || [];
    const formValues: { [key: string]: number } = {};
    
    manufacturerStocks.forEach(stock => {
      if (stock.color && stock.color.trim() !== '') {
        formValues[`quantity_${stock.color}`] = stock.quantity || 0;
      }
    });
    
    updateForm.setFieldsValue(formValues);
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      if (!selectedProduct) return;

      // Tạo stocks_by_color từ form values
      const stocksByColor: Array<{color: string, quantity: number}> = [];
      
      Object.keys(values).forEach(key => {
        if (key.startsWith('quantity_')) {
          const color = key.replace('quantity_', '');
          const quantity = values[key];
          if (quantity !== undefined && quantity !== null) {
            stocksByColor.push({
              color: color,
              quantity: Number(quantity)
            });
          }
        }
      });

      if (stocksByColor.length === 0) {
        message.error('Vui lòng nhập ít nhất một màu sắc.');
        return;
      }

      // Tạo FormData để gửi stocks_by_color
      const formData = new FormData();
      formData.append('stocks_by_color', JSON.stringify(stocksByColor));

      console.log('🔍 Updating stocks_by_color:', stocksByColor);

      await put(`/api/vehicles/${selectedProduct._id}`, formData);
      message.success('Cập nhật tồn kho theo màu sắc thành công');
      setShowUpdateModal(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Error updating inventory:', err);
      message.error(`Không thể cập nhật tồn kho: ${err.response?.data?.message || err.message}`);
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

  const handleViewDistributionHistory = (product: Product) => {
    console.log('Opening distribution history modal for product:', product);
    setSelectedProduct(product);
    setShowDistributionHistoryModal(true);
  };

  const handleSubmitDistribute = async () => {
    try {
      if (!selectedProduct || targetKeys.length === 0) {
        message.warning('Vui lòng chọn ít nhất một đại lý');
        return;
      }

      let values;
      try {
        values = await distributeForm.validateFields();
      console.log('Distribute form values:', values);
      } catch (errorInfo) {
        console.error('Form validation failed:', errorInfo);
        message.error('Vui lòng kiểm tra lại thông tin đã nhập');
        return;
      }

      // Extract dealerIds from targetKeys (format: "dealer-{dealerId}-{index}")
      const dealerIds = targetKeys.map(key => {
        const match = key.match(/^dealer-(.+)-(\d+)$/);
        return match ? match[1] : null;
      }).filter(id => id !== null);
      
      if (dealerIds.length === 0) {
        message.error('Không thể xác định đại lý được chọn');
        return;
      }

      const distributeQuantity = parseInt(values.quantity) || 1;
      const selectedColor = values.color;

      // Kiểm tra tồn kho manufacturer theo màu cụ thể
      const manufacturerStocks = selectedProduct.stocks?.filter(stock => 
        stock.owner_type === 'manufacturer' && 
        stock.color && 
        stock.color.trim() !== ''
      ) || [];

      if (manufacturerStocks.length === 0) {
        message.error('Không có tồn kho theo màu sắc cho xe này');
        return;
      }

      // Tính tổng số lượng cần phân phối cho tất cả đại lý
      const totalQuantityNeeded = distributeQuantity * dealerIds.length;
      
      // Nếu có chọn màu cụ thể, kiểm tra tồn kho màu đó
      if (selectedColor) {
        const colorStock = manufacturerStocks.find(stock => stock.color === selectedColor);
        if (!colorStock) {
          message.error(`Không có tồn kho cho màu "${selectedColor}"`);
          return;
        }
        if (colorStock.quantity < totalQuantityNeeded) {
          message.error(`Không đủ tồn kho cho màu "${selectedColor}". Có sẵn: ${colorStock.quantity}, Yêu cầu: ${totalQuantityNeeded} (${dealerIds.length} đại lý × ${distributeQuantity} xe)`);
          return;
        }
      } else {
        // Nếu không chọn màu, kiểm tra tổng tồn kho
        const totalStock = manufacturerStocks.reduce((sum, stock) => sum + stock.quantity, 0);
        if (totalStock < totalQuantityNeeded) {
          message.error(`Không đủ tổng tồn kho. Có sẵn: ${totalStock}, Yêu cầu: ${totalQuantityNeeded} (${dealerIds.length} đại lý × ${distributeQuantity} xe)`);
          return;
        }
      }

      // Phân phối cho từng đại lý
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const dealerId of dealerIds) {
        try {
          const distributionData = {
            vehicle_id: selectedProduct._id,
            dealership_id: dealerId,
            quantity: distributeQuantity,
            color: selectedColor || null,
            notes: values.notes || `Phân phối cho ${dealerIds.length} đại lý`
          };

          console.log('Distributing vehicle to dealer:', dealerId, distributionData);
          
          const response = await post('/api/vehicles/distribute', distributionData);
          console.log('Distribution response for dealer', dealerId, ':', response);
          
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Đại lý ${dealerId}: ${response.message || 'Lỗi không xác định'}`);
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Đại lý ${dealerId}: ${error?.response?.data?.message || error?.message || 'Lỗi không xác định'}`);
        }
      }

      // Hiển thị kết quả
      if (successCount > 0) {
        const colorText = selectedColor ? ` màu "${selectedColor}"` : '';
        message.success(`Đã phân phối ${distributeQuantity} xe "${selectedProduct.name}"${colorText} cho ${successCount}/${dealerIds.length} đại lý thành công!`);
      }
      
      if (errorCount > 0) {
        message.error(`Có ${errorCount} đại lý gặp lỗi: ${errors.join(', ')}`);
      }

      if (successCount > 0) {
        setShowDistributeModal(false);
        setSelectedProduct(null);
        setTargetKeys([]);
        setSelectedKeys([]);
        distributeForm.resetFields();
        
        // Refresh products để lấy data mới từ backend
        console.log('🔄 Refreshing products after distribution...');
        await fetchProducts();
      }
    } catch (error: any) {
      console.error('Error distributing vehicle:', error);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        message.error(errorMessage);
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
      width: 200,
      render: (record: Product) => {
        const manufacturerQuantity = getManufacturerStock(record);
        const dealerQuantity = getDealerStock(record);
        const stockStatus = getStockStatus(record);
        
        // Get manufacturer stocks by color
        const manufacturerStocks = record.stocks?.filter(stock => stock.owner_type === 'manufacturer') || [];
        
        return (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 14, color: '#1890ff', marginBottom: 4 }}>
              {manufacturerQuantity} xe
            </div>
            <Tag color={stockStatus.color} style={{ marginBottom: 4 }}>
              {stockStatus.text}
            </Tag>
            
            {/* Hiển thị tồn kho theo màu sắc */}
            {manufacturerStocks.filter(stock => stock.color && stock.color.trim() !== '').length > 0 && (
              <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>
                {manufacturerStocks
                  .filter(stock => stock.color && stock.color.trim() !== '')
                  .map((stock, index) => (
                    <span key={index} style={{ marginRight: 8, display: 'inline-block' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: 6, 
                        height: 6, 
                        backgroundColor: getColorDot(stock.color || ''),
                        borderRadius: '50%',
                        marginRight: 2,
                        border: '1px solid #d9d9d9'
                      }}></span>
                      {stock.color}: {stock.quantity}
                    </span>
                  ))}
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
          <div className="relative group">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleUpdateInventory(record)}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Cập nhật tồn kho
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
          {/* <div className="relative group">
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
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Phân phối cho đại lý
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div> */}
          {/* <div className="relative group">
            <Button
              type="default"
              size="small"
              icon={<InboxOutlined />}
              onClick={() => handleViewDistributionHistory(record)}
              style={{
                color: '#722ed1',
                borderColor: '#722ed1'
              }}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Xem lịch sử phân phối
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div> */}
          <div className="relative group">
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
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {record.status === 'active' ? 'Ngừng kinh doanh' : 'Kích hoạt lại'}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </Space>
      )
    }
  ];

  // Component để render statistics
  const renderStatistics = (stats: any, title: string, icon: React.ReactNode, color: string) => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={4}>
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
      <Col xs={24} sm={4}>
        <Card>
          <Statistic
            title={`${title} - Tồn kho NSX`}
            value={stats.totalStock}
            prefix={<InboxOutlined />}
            valueStyle={{ color: '#52c41a' }}
            suffix={stats.filteredStock !== stats.totalStock ? `(${stats.filteredStock} hiển thị)` : ''}
          />
        </Card>
      </Col>
      <Col xs={24} sm={4}>
        <Card>
          <Statistic
            title={`${title} - Tồn kho Đại lý`}
            value={stats.totalDealerStock}
            prefix={<ShareAltOutlined />}
            valueStyle={{ color: '#1890ff' }}
            suffix={stats.filteredDealerStock !== stats.totalDealerStock ? `(${stats.filteredDealerStock} hiển thị)` : ''}
          />
        </Card>
      </Col>
      <Col xs={24} sm={4}>
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
      <Col xs={24} sm={4}>
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
      <Col xs={24} sm={4}>
        <Card>
          <Statistic
            title={`${title} - Tổng tồn kho`}
            value={stats.totalStock + stats.totalDealerStock}
            prefix={<CarOutlined />}
            valueStyle={{ color: '#f5222d' }}
            suffix="xe"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 transition-colors duration-200"
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
                    <Col xs={24} sm={4}>
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
                    <Col xs={24} sm={4}>
                      <Card>
                        <Statistic
                          title="Tồn kho NSX"
                          value={totalStock}
                          prefix={<InboxOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                          suffix={filteredTotalStock !== totalStock ? `(${filteredTotalStock} hiển thị)` : ''}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Card>
                        <Statistic
                          title="Tồn kho Đại lý"
                          value={totalDealerStock}
                          prefix={<ShareAltOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                          suffix={filteredTotalDealerStock !== totalDealerStock ? `(${filteredTotalDealerStock} hiển thị)` : ''}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={4}>
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
                    <Col xs={24} sm={4}>
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
                    <Col xs={24} sm={4}>
                      <Card>
                        <Statistic
                          title="Tổng tồn kho"
                          value={totalStock + totalDealerStock}
                          prefix={<CarOutlined />}
                          valueStyle={{ color: '#f5222d' }}
                          suffix="xe"
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
              Cập nhật tồn kho theo màu sắc
            </div>
          }
          open={showUpdateModal}
          onCancel={() => setShowUpdateModal(false)}
          onOk={handleSubmitUpdate}
          okText="Cập nhật"
          cancelText="Hủy"
          width={600}
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
              
              {/* Hiển thị tồn kho hiện tại theo màu sắc */}
              <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                <Text strong style={{ marginBottom: 6, display: 'block', fontSize: 13 }}>Tồn kho hiện tại:</Text>
                {(() => {
                  const manufacturerStocks = selectedProduct.stocks?.filter(stock => 
                    stock.owner_type === 'manufacturer' && stock.color && stock.color.trim() !== ''
                  ) || [];
                  if (manufacturerStocks.length === 0) {
                    return <Text type="secondary" style={{ fontSize: 12 }}>Chưa có tồn kho theo màu sắc</Text>;
                  }
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {manufacturerStocks.map((stock, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: 8, 
                            height: 8, 
                            backgroundColor: getColorDot(stock.color || ''),
                            borderRadius: '50%',
                            marginRight: 4,
                            border: '1px solid #d9d9d9'
                          }}></span>
                          <Text style={{ fontSize: 12 }}>{stock.color}: {stock.quantity}</Text>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              
              <Form form={updateForm} layout="vertical">
                <div style={{ marginBottom: 16 }}>
                  {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 14 }}>Cập nhật số lượng:</Text>
                    <Button 
                      type="dashed" 
                      size="small"
                      onClick={() => {
                        // Thêm màu sắc mới
                        const newColor = prompt('Nhập tên màu sắc mới:');
                        if (newColor && newColor.trim()) {
                          const currentValues = updateForm.getFieldsValue();
                          updateForm.setFieldsValue({
                            ...currentValues,
                            [`quantity_${newColor.trim()}`]: 0
                          });
                        }
                      }}
                    >
                      + Thêm màu
                    </Button>
                  </div> */}
                  
                  {(() => {
                    const manufacturerStocks = selectedProduct.stocks?.filter(stock => stock.owner_type === 'manufacturer') || [];
                    const existingColors = manufacturerStocks
                      .map(stock => stock.color)
                      .filter(color => color && color.trim() !== '');
                    
                    // Lấy màu sắc từ form values (bao gồm cả màu mới thêm)
                    const formValues = updateForm.getFieldsValue();
                    const formColors = Object.keys(formValues)
                      .filter(key => key.startsWith('quantity_'))
                      .map(key => key.replace('quantity_', ''));
                    
                    const uniqueColors = [...new Set([...existingColors, ...formColors])];
                    
                    // if (uniqueColors.length === 0) {
                    //   return (
                    //     <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderRadius: 6, textAlign: 'center' }}>
                    //       <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    //         Chưa có màu sắc nào. Vui lòng thêm màu sắc trước.
                    //       </Text>
                    //       <Button 
                    //         type="primary" 
                    //         size="small"
                    //         onClick={() => {
                    //           // Thêm màu sắc mặc định
                    //           const defaultColors = ['Đỏ', 'Xanh', 'Vàng', 'Trắng', 'Đen'];
                    //           const formValues: { [key: string]: number } = {};
                    //           defaultColors.forEach(color => {
                    //             formValues[`quantity_${color}`] = 0;
                    //           });
                    //           updateForm.setFieldsValue(formValues);
                    //         }}
                    //       >
                    //         Thêm màu sắc mặc định
                    //       </Button>
                    //     </div>
                    //   );
                    // }
                    
                    return uniqueColors.map((color, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: 8,
                        padding: 6,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 4
                      }}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: 12, 
                          height: 12, 
                          backgroundColor: getColorDot(color || ''),
                          borderRadius: '50%',
                          marginRight: 8,
                          border: '1px solid #d9d9d9'
                        }}></span>
                        <Text style={{ minWidth: 60, marginRight: 8, fontSize: 13 }}>{color}:</Text>
                <Form.Item
                          name={`quantity_${color}`}
                          style={{ margin: 0, flex: 1 }}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng' },
                    { type: 'number', min: 0, message: 'Số lượng phải >= 0' }
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={10000}
                    style={{ width: '100%' }}
                            placeholder="Số lượng"
                            addonAfter="xe"
                            size="small"
                  />
                </Form.Item>
                      </div>
                    ));
                  })()}
                </div>
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
          // title={
          //   <div style={{ display: 'flex', alignItems: 'center' }}>
          //     <ShareAltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          //     Phân phối xe cho đại lý
          //   </div>
          // }
          // open={showDistributeModal}
          // onCancel={() => {
          //   setShowDistributeModal(false);
          //   setSelectedProduct(null);
          //   setTargetKeys([]);
          //   setSelectedKeys([]);
          //   distributeForm.resetFields();
          // }}
          // onOk={handleSubmitDistribute}
          // width={800}
          // okText="Phân phối xe"
          // cancelText="Hủy"
          // confirmLoading={loading}
          // okButtonProps={{
          //   disabled: targetKeys.length === 0
          // }}
        >
          {selectedProduct && (
            <div>
              {/* Product Info Header */}
              <div className="mb-6 p-6 rounded-xl border border-blue-100" 
                   style={{ 
                     background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)',
                     boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)'
                   }}>
                <Row gutter={[24, 16]} align="middle">
                  {/* Thông tin xe chính */}
                  <Col xs={24} sm={12} lg={8}>
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start mb-2">
                        <CarOutlined className="text-blue-500 text-xl mr-2" />
                        <Text className="text-gray-600 text-sm font-medium">THÔNG TIN XE</Text>
                      </div>
                      <Text className="text-blue-600 text-lg font-semibold block mb-1">
                        {selectedProduct.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {selectedProduct.model} • {selectedProduct.sku}
                      </Text>
                    </div>
                  </Col>

                  {/* Tồn kho */}
                  <Col xs={24} sm={12} lg={8}>
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start mb-2">
                        <InboxOutlined className="text-green-500 text-xl mr-2" />
                        <Text className="text-gray-600 text-sm font-medium">TỒN KHO</Text>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center sm:justify-start">
                          <Text className="text-green-600 text-lg font-semibold mr-2">
                            {getManufacturerStock(selectedProduct)}
                          </Text>
                          <Text className="text-gray-500 text-sm">xe có sẵn</Text>
                        </div>
                        <Text className="text-gray-500 text-xs">
                          Đã phân phối: {getDealerStock(selectedProduct)} xe
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Giá và trạng thái */}
                  <Col xs={24} sm={12} lg={8}>
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start mb-2">
                        <ThunderboltOutlined className="text-orange-500 text-xl mr-2" />
                        <Text className="text-gray-600 text-sm font-medium">GIÁ & TRẠNG THÁI</Text>
                      </div>
                      <div className="space-y-1">
                        <Text className="text-orange-600 text-lg font-semibold">
                          {selectedProduct.price?.toLocaleString()}₫
                        </Text>
                        <div className="flex items-center justify-center sm:justify-start">
                          <Tag 
                            color={selectedProduct.status === 'active' ? 'green' : 'red'}
                            className="text-xs"
                          >
                            {selectedProduct.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
                      
                
                {/* Chi tiết tồn kho theo màu */}
                {(() => {
                  const manufacturerStocks = selectedProduct?.stocks?.filter(stock => 
                    stock.owner_type === 'manufacturer' && 
                    stock.color && 
                    stock.color.trim() !== ''
                  ) || [];

                  if (manufacturerStocks.length > 0) {
                    return (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-center sm:justify-start mb-3">
                          <AppstoreOutlined className="text-purple-500 text-sm mr-2" />
                          <Text className="text-gray-600 text-xs font-medium">CHI TIẾT THEO MÀU SẮC</Text>
                        </div>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                          {manufacturerStocks.map((stock, index) => (
                            <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-blue-200 shadow-sm">
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: getColorDot(stock.color || '') }}
                              />
                              <Text className="text-gray-700 text-xs font-medium">
                                {stock.color}: <span className="text-blue-600 font-semibold">{stock.quantity}</span>
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Form */}
              <Form form={distributeForm} layout="vertical">
                {/* Color Selection */}
                <Form.Item
                  name="color"
                  label="Màu sắc (tùy chọn - để trống sẽ phân phối từ tổng tồn kho)"
                >
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 transition-colors duration-200"
                  >
                    <option value="">Chọn màu sắc cụ thể (tùy chọn)</option>
                    {(() => {
                      const manufacturerStocks = selectedProduct.stocks?.filter(stock => 
                        stock.owner_type === 'manufacturer' && 
                        stock.color && 
                        stock.color.trim() !== ''
                      ) || [];

                      if (manufacturerStocks.length > 0) {
                        return manufacturerStocks.map((stock, index) => (
                          <option key={index} value={stock.color}>
                            {stock.color} ({stock.quantity} xe)
                          </option>
                        ));
                      } else {
                        return (
                          <option value="" disabled>
                            Không có tồn kho theo màu sắc
                          </option>
                        );
                      }
                    })()}
                  </select>
                </Form.Item>

                <Form.Item
                  name="quantity"
                  label={`Số lượng xe phân phối`}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng xe' },
                    { 
                      validator: (_, value) => {
                        const num = parseInt(value);
                        if (!value || isNaN(num)) {
                          return Promise.reject('Vui lòng nhập số hợp lệ');
                        }
                        if (num < 1) {
                          return Promise.reject('Số lượng phải >= 1');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                  initialValue="1"
                >
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="Nhập số lượng xe muốn phân phối"
                      className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 transition-colors duration-200"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                      xe
                    </span>
                  </div>
                </Form.Item>

                <Form.Item
                  name="notes"
                  label="Ghi chú (tùy chọn)"
                >
                  <textarea
                    rows={3}
                    placeholder="Nhập ghi chú về việc phân phối xe này..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 transition-colors duration-200 resize-none"
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
                  
                  {/* Quick selection buttons */}
                  <div className="mb-4 flex gap-2 justify-center">
                    <Button 
                      size="small" 
                      type="dashed"
                      onClick={() => {
                        const allActiveDealerKeys = dealers
                          .filter(dealer => dealer.isActive)
                          .map((dealer, index) => `dealer-${dealer._id}-${index}`);
                        setTargetKeys(allActiveDealerKeys);
                      }}
                      disabled={dealers.filter(d => d.isActive).length === 0}
                      className="text-blue-600 border-blue-300 hover:border-blue-500"
                    >
                      Chọn tất cả đại lý hoạt động
                    </Button>
                    <Button 
                      size="small" 
                      type="dashed"
                      onClick={() => setTargetKeys([])}
                      disabled={targetKeys.length === 0}
                      className="text-gray-600 border-gray-300 hover:border-gray-500"
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                  
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
                    onChange={(keys) => setTargetKeys(keys as string[])} // Cho phép chọn nhiều đại lý
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
                    showSelectAll={true}
                  />
                </div>
              )}
              
              {targetKeys.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text className="text-blue-700 font-medium">
                        ✓ Đã chọn {targetKeys.length} đại lý để phân phối xe
                      </Text>
                      <div className="mt-2 text-sm text-blue-600">
                        {targetKeys.length === dealers.filter(d => d.isActive).length 
                          ? 'Đã chọn tất cả đại lý hoạt động' 
                          : `${targetKeys.length}/${dealers.filter(d => d.isActive).length} đại lý hoạt động`
                        }
                      </div>
                    </div>
                    <Button 
                      size="small" 
                      type="text"
                      onClick={() => setTargetKeys([])}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                </div>
              )}

              {/* Warning about stock reduction */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Text className="text-yellow-700">
                  ⚠️ <strong>Lưu ý:</strong> Sau khi phân phối, tồn kho của nhà sản xuất sẽ giảm tương ứng với số lượng xe đã phân phối.
                </Text>
              </div>
            </div>
          )}
        </Modal>

        {/* Distribution History Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <InboxOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              Lịch sử phân phối xe
            </div>
          }
          open={showDistributionHistoryModal}
          onCancel={() => {
            setShowDistributionHistoryModal(false);
            setSelectedProduct(null);
          }}
          footer={[
            <Button key="close" onClick={() => setShowDistributionHistoryModal(false)}>
              Đóng
            </Button>
          ]}
          width={800}
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
                      <Text strong style={{ color: '#495057' }}>Tổng đã phân phối:</Text>
                      <br />
                      <Text style={{ fontSize: '16px', fontWeight: 500, color: '#52c41a' }}>
                        {getDealerStock(selectedProduct)} xe
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Còn lại tại NSX: {getManufacturerStock(selectedProduct)} xe
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Distribution History */}
              <div>
                <Text strong style={{ fontSize: '16px', marginBottom: '16px', display: 'block' }}>
                  Chi tiết phân phối cho đại lý:
                </Text>
                
                {(() => {
                  const dealerStocks = selectedProduct.stocks?.filter(stock => stock.owner_type === 'dealer') || [];
                  
                  if (dealerStocks.length === 0) {
                    return (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px',
                        color: '#999'
                      }}>
                        <InboxOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                        <div>Chưa có lịch sử phân phối nào</div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {dealerStocks.map((stock, index) => (
                        <div 
                          key={index}
                          style={{
                            padding: '12px',
                            marginBottom: '8px',
                            border: '1px solid #e8e8e8',
                            borderRadius: '6px',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <Row gutter={16} align="middle">
                            <Col span={8}>
                              <div>
                                <Text strong style={{ color: '#1890ff' }}>
                                  {(typeof stock.owner_id === 'object' && stock.owner_id && 'name' in stock.owner_id ? (stock.owner_id as any).name : `Đại lý ID: ${stock.owner_id}`)}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  ID: {stock.owner_id}
                                </Text>
                              </div>
                            </Col>
                            <Col span={4}>
                              <div style={{ textAlign: 'center' }}>
                                <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                                  {stock.quantity}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  xe
                                </Text>
                              </div>
                            </Col>
                            <Col span={6}>
                              {stock.color && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    width: 12,
                                    height: 12,
                                    backgroundColor: getColorDot(stock.color),
                                    borderRadius: '50%',
                                    marginRight: 8,
                                    border: '1px solid #d9d9d9'
                                  }}></span>
                                  <Text style={{ fontSize: '14px' }}>{stock.color}</Text>
                                </div>
                              )}
                            </Col>
                            <Col span={6}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Phân phối: {new Date(selectedProduct.updatedAt).toLocaleDateString('vi-VN')}
                              </Text>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default InventoryManagement;
