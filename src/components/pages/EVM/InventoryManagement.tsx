import React, { useEffect, useState } from "react";
import { AdminLayout } from "../admin/AdminLayout";
import { get, put } from "../../../services/httpClient";
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
  Radio
} from 'antd';
import { 
  CarOutlined, 
  AppstoreOutlined,
  EditOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined
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


const InventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [updateForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching products from /api/vehicles...');
      const res = await get<any>("/api/vehicles");
      console.log('API Response:', res);
      
      // Xử lý response data
      let productsData = [];
      if (res.data && Array.isArray(res.data.data)) {
        productsData = res.data.data;
      } else if (res.data && Array.isArray(res.data)) {
        productsData = res.data;
      } else {
        console.warn('Unexpected API response format:', res.data);
        productsData = [];
      }
      
      console.log('Products loaded:', productsData.length);
      setProducts(productsData);
      
      // Log statistics
      const totalStock = productsData.reduce((sum: number, product: any) => {
        return sum + (product.stocks?.reduce((stockSum: number, stock: any) => stockSum + stock.quantity, 0) || 0);
      }, 0);
      console.log('Total products:', productsData.length);
      console.log('Total stock:', totalStock);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Function để test API và hiển thị thông tin debug
  const testApiCall = async () => {
    try {
      console.log('=== TESTING API CALL ===');
      const res = await get<any>("/api/vehicles");
      console.log('Full API Response:', res);
      console.log('Response data:', res.data);
      console.log('Response data.data:', res.data?.data);
      console.log('Response data length:', res.data?.data?.length);
      
      if (res.data?.data && Array.isArray(res.data.data)) {
        console.log('First product:', res.data.data[0]);
        console.log('Product stocks:', res.data.data[0]?.stocks);
      }
    } catch (err) {
      console.error('API Test Error:', err);
    }
  };

  // Function để test status update API
  const testStatusUpdate = async () => {
    try {
      console.log('=== TESTING STATUS UPDATE API ===');
      if (products.length === 0) {
        console.log('No products available for testing');
        return;
      }

      const testProduct = products[0];
      console.log('Testing with product:', testProduct._id, testProduct.name);
      
      const formData = new FormData();
      formData.append('status', 'active');
      
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await put(`/api/vehicles/${testProduct._id}`, formData);
      console.log('Status update response:', response);
      message.success('Test status update thành công');
    } catch (err: any) {
      console.error('Status update test error:', err);
      console.error('Error details:', err.response?.data);
      message.error(`Test status update thất bại: ${err.response?.data?.message || err.message}`);
    }
  };

  // Filter products by category
  const carProducts = products.filter(product => product.category === 'car');
  const motorbikeProducts = products.filter(product => product.category === 'motorbike');

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.model?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter cars
  const filteredCars = carProducts.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.model?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter motorbikes
  const filteredMotorbikes = motorbikeProducts.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.model?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics for all products
  const totalProducts = products.length; // Tổng sản phẩm (không filter)
  const filteredProductsCount = filteredProducts.length; // Sản phẩm sau filter
  
  // Tổng stock của tất cả sản phẩm (không filter)
  const totalStock = products.reduce((sum, product) => {
    return sum + (product.stocks?.reduce((stockSum, stock) => stockSum + stock.quantity, 0) || 0);
  }, 0);
  
  // Tổng stock của sản phẩm sau filter
  const filteredTotalStock = filteredProducts.reduce((sum, product) => {
    return sum + (product.stocks?.reduce((stockSum, stock) => stockSum + stock.quantity, 0) || 0);
  }, 0);
  
  // Sản phẩm sắp hết hàng (tổng stock < 10)
  const lowStockProducts = products.filter(product => {
    const totalQuantity = product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    return totalQuantity < 10;
  }).length;

  // Calculate statistics for cars
  const carStats = {
    total: carProducts.length,
    filtered: filteredCars.length,
    totalStock: carProducts.reduce((sum, product) => {
      return sum + (product.stocks?.reduce((stockSum, stock) => stockSum + stock.quantity, 0) || 0);
    }, 0),
    filteredStock: filteredCars.reduce((sum, product) => {
      return sum + (product.stocks?.reduce((stockSum, stock) => stockSum + stock.quantity, 0) || 0);
    }, 0),
    lowStock: carProducts.filter(product => {
      const totalQuantity = product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
      return totalQuantity < 10;
    }).length
  };

  // Calculate statistics for motorbikes
  const motorbikeStats = {
    total: motorbikeProducts.length,
    filtered: filteredMotorbikes.length,
    totalStock: motorbikeProducts.reduce((sum, product) => {
      return sum + (product.stocks?.reduce((stockSum, stock) => stockSum + stock.quantity, 0) || 0);
    }, 0),
    filteredStock: filteredMotorbikes.reduce((sum, product) => {
      return sum + (product.stocks?.reduce((stockSum, stock) => stockSum + stock.quantity, 0) || 0);
    }, 0),
    lowStock: motorbikeProducts.filter(product => {
      const totalQuantity = product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
      return totalQuantity < 10;
    }).length
  };

  const handleUpdateInventory = (product: Product) => {
    setSelectedProduct(product);
    const currentStock = product.stocks?.[0]?.quantity || 0;
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

  const getStockStatus = (product: Product) => {
    const totalQuantity = product.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
    if (totalQuantity === 0) {
      return { status: 'error', text: 'Hết hàng', color: 'red' };
    } else if (totalQuantity < 10) {
      return { status: 'warning', text: 'Sắp hết', color: 'orange' };
    } else {
      return { status: 'success', text: 'Còn hàng', color: 'green' };
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
        const totalQuantity = record.stocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
        const stockStatus = getStockStatus(record);
        return (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>
              {totalQuantity}
            </div>
            <Tag color={stockStatus.color}>
              {stockStatus.text}
            </Tag>
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
      width: 180,
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
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={8} md={6}>
          <Search
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Select
            placeholder="Trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Không hoạt động</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={fetchProducts}
            loading={loading}
            style={{ width: '100%' }}
          >
            Làm mới
          </Button>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button
            type="default"
            icon={<AppstoreOutlined />}
            onClick={testApiCall}
            style={{ width: '100%' }}
          >
            Test API
          </Button>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button
            type="default"
            icon={<CheckCircleOutlined />}
            onClick={testStatusUpdate}
            style={{ width: '100%' }}
          >
            Test Status
          </Button>
        </Col>
      </Row>
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

  return (
    <AdminLayout activeSection="inventory-management">
      <div className="p-6">
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
      </div>
    </AdminLayout>
  );
};

export default InventoryManagement;
