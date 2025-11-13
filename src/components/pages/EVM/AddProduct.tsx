import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { post, get } from "../../../services/httpClient";

const defaultForm = {
  name: '',
  model: '',
  category: '',
  sku: '',
  version: '',
  release_status: 'available',
  release_date: '',
  status: 'active',
  price: 0,
  on_road_price: 0,
  battery_type: '',
  battery_capacity: 0,
  range_km: 0,
  wltp_range_km: 0,
  charging_fast: 0,
  charging_slow: 0,
  charging_port_type: '',
  motor_power: 0,
  top_speed: 0,
  acceleration: 0,
  drivetrain: '',
  dimensions: { length: 0, width: 0, height: 0, wheelbase: 0, ground_clearance: 0 },
  weight: 0,
  payload: 0,
  seating_capacity: 0,
  tire_size: '',
  trunk_type: '',
  safety_features: [],
  interior_features: [], // Will be array of {name, description} objects
  driving_modes: [],
  software_version: '',
  ota_update: true,
  stock: 0, // FE nhập số lượng, khi gửi sẽ build thành stocks mảng object
  stocks_by_color: '', // JSON string: '[{"color":"Yellow","quantity":10},{"color":"Red","quantity":5}]'
  warranty_years: 0,
  battery_warranty_years: 0,
  color_options: [],
  images: [],
  description: '',
  promotions: [],
};

const batteryTypes = ["LFP", "NMC", "Li-ion", "other"];
const chargingPortTypes = ["CCS2", "Type2", "CHAdeMO", "Tesla", "Other"];
const drivetrains = ["FWD", "RWD", "AWD"];
const trunkTypes = ["manual", "electric", "auto"]; // khớp enum backend

// Validation rules for different categories
const getValidationRules = (category: string) => {
  if (category === 'motorbike') {
    return {
      battery_capacity: { min: 0.1, max: 10, step: 0.1 },
      range_km: { min: 10, max: 200 },
      wltp_range_km: { min: 10, max: 200 },
      charging_fast: { min: 0, max: 10 },
      charging_slow: { min: 0, max: 10 },
      motor_power: { min: 0.1, max: 10, step: 0.1 },
      top_speed: { min: 20, max: 120 },
      acceleration: { min: 1, max: 10 },
      weight: { min: 50, max: 300 },
      payload: { min: 50, max: 300 },
      seating_capacity: { min: 1, max: 3 },
      dimensions: {
        length: { min: 1500, max: 2500 },
        width: { min: 600, max: 1000 },
        height: { min: 800, max: 1500 },
        wheelbase: { min: 1000, max: 2000 },
        ground_clearance: { min: 100, max: 300 }
      }
    };
  } else {
    return {
      battery_capacity: { min: 10, max: 200, step: 1 },
      range_km: { min: 100, max: 1000 },
      wltp_range_km: { min: 100, max: 1000 },
      charging_fast: { min: 0, max: 100 },
      charging_slow: { min: 0, max: 20 },
      motor_power: { min: 50, max: 1000, step: 1 },
      top_speed: { min: 100, max: 300 },
      acceleration: { min: 1, max: 20 },
      weight: { min: 1000, max: 5000 },
      payload: { min: 200, max: 1000 },
      seating_capacity: { min: 2, max: 9 },
      dimensions: {
        length: { min: 3000, max: 6000 },
        width: { min: 1500, max: 2500 },
        height: { min: 1200, max: 2500 },
        wheelbase: { min: 2000, max: 4000 },
        ground_clearance: { min: 100, max: 300 }
      }
    };
  }
};

interface AddProductProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: () => void;
  editProduct?: any;
}

const AddProduct: React.FC<AddProductProps> = ({ isOpen, onClose, onProductCreated, editProduct }) => {
  const [form, setForm] = useState<any>(defaultForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [promotions, setPromotions] = useState<any[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0); // Track ảnh chính

  const resetForm = () => {
    // Cleanup object URLs to prevent memory leaks
    imageFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      URL.revokeObjectURL(url);
    });
    
    setForm(defaultForm);
    setImageFiles([]);
    setError(null);
    setFieldErrors({});
    setPrimaryImageIndex(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    // Lấy danh sách manufacturer và promotions từ API
    const fetchData = async () => {
      try {
        // Check authentication first
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          console.error('❌ No access token found');
          setError('Bạn cần đăng nhập để sử dụng tính năng này. Vui lòng đăng nhập lại.');
          return;
        }
        
        console.log('🚀 Fetching manufacturers and promotions...');
        console.log('🔑 Access token exists:', !!accessToken);
        
        // Check user info
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('👤 Current user:', user);
        console.log('🏭 User manufacturer_id:', user.manufacturer_id);
        console.log('🏭 User manufacturerName:', user.manufacturerName);
        
        // Note: Backend will automatically use user.manufacturer_id, no need to fetch manufacturers list
        
        // Fetch promotions
        const promotionsResponse = await get("/api/promotions");
        if (promotionsResponse.data?.data) {
          setPromotions(promotionsResponse.data.data);
          console.log('✅ Promotions loaded:', promotionsResponse.data.data.length);
        } else {
          console.error('❌ Failed to load promotions');
        }
      } catch (error: any) {
        console.error('❌ Error fetching data:', error);
        
        // Check if it's an authentication error
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
        }
      }
    };
    
    fetchData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editProduct) {
      console.log('Populating form with editProduct:', editProduct);
      console.log('Edit product images:', editProduct.images);
      // Reset imageFiles when editing to avoid conflicts
      setImageFiles([]);
      // Reset primary image index to 0 (first image)
      setPrimaryImageIndex(editProduct.primaryImageIndex || 0);
      setForm({
        // Basic fields
        name: editProduct.name || '',
        model: editProduct.model || '',
        category: editProduct.category || '',
        sku: editProduct.sku || '',
        version: editProduct.version || '',
        release_status: editProduct.release_status || 'available',
        release_date: editProduct.release_date ? editProduct.release_date.split('T')[0] : '',
        status: editProduct.status || 'active',
        price: editProduct.price || 0,
        on_road_price: editProduct.on_road_price || 0,
        
        // Battery and performance
        battery_type: editProduct.battery_type || '',
        battery_capacity: editProduct.battery_capacity || 0,
        range_km: editProduct.range_km || 0,
        wltp_range_km: editProduct.wltp_range_km || 0,
        charging_fast: editProduct.charging_fast || 0,
        charging_slow: editProduct.charging_slow || 0,
        charging_port_type: editProduct.charging_port_type || '',
        motor_power: editProduct.motor_power || 0,
        top_speed: editProduct.top_speed || 0,
        acceleration: editProduct.acceleration || 0,
        drivetrain: editProduct.drivetrain || '',
        
        // Dimensions and weight
        dimensions: editProduct.dimensions || { length: 0, width: 0, height: 0, wheelbase: 0, ground_clearance: 0 },
        weight: editProduct.weight || 0,
        payload: editProduct.payload || 0,
        seating_capacity: editProduct.seating_capacity || 0,
        tire_size: editProduct.tire_size || '',
        trunk_type: editProduct.trunk_type || 'manual',
        
        // Features and software
        safety_features: Array.isArray(editProduct.safety_features) 
          ? editProduct.safety_features 
          : editProduct.safety_features ? editProduct.safety_features.split(',').map((s: string) => s.trim()) : [],
        interior_features: Array.isArray(editProduct.interior_features) 
          ? editProduct.interior_features 
          : [],
        driving_modes: Array.isArray(editProduct.driving_modes) 
          ? editProduct.driving_modes 
          : editProduct.driving_modes ? editProduct.driving_modes.split(',').map((d: string) => d.trim()) : [],
        software_version: editProduct.software_version || '',
        ota_update: editProduct.ota_update !== undefined ? editProduct.ota_update : true,
        
        // Inventory and warranty
        stock: editProduct.stocks && editProduct.stocks.length > 0 
          ? editProduct.stocks
              .filter((stock: any) => stock.owner_type !== 'dealer')
              .reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0)
          : editProduct.stock || 0,
        stocks_by_color: editProduct.stocks && editProduct.stocks.length > 0 
          ? JSON.stringify(editProduct.stocks
              .filter((stock: any) => stock.owner_type !== 'dealer')
              .map((stock: any) => ({
                color: stock.color || 'Unknown',
                quantity: stock.quantity || 0
              })))
          : '',
        warranty_years: editProduct.warranty_years || 0,
        battery_warranty_years: editProduct.battery_warranty_years || 0,
        
        // Appearance and content
        color_options: Array.isArray(editProduct.color_options) 
          ? editProduct.color_options 
          : editProduct.color_options ? editProduct.color_options.split(',').map((c: string) => c.trim()) : [],
        images: editProduct.images || [],
        description: editProduct.description || '',
        promotions: Array.isArray(editProduct.promotions) 
          ? editProduct.promotions.map((p: any) => typeof p === 'object' && p._id ? p._id : p)
          : []
      });
    } else {
      setForm(defaultForm);
    }
  }, [editProduct]);

  // Real-time field validation
  const validateField = (name: string, value: any) => {
    const errors: {[key: string]: string} = {};
    const category = form.category || 'car'; // Fallback to 'car' if category not set
    const rules = getValidationRules(category);

    switch (name) {
      case 'sku':
        if (value && value.length < 3) errors.sku = "SKU phải có ít nhất 3 ký tự";
        if (value && value.length > 50) errors.sku = "SKU không được quá 50 ký tự";
        if (value && !/^[A-Z0-9-_]+$/i.test(value)) errors.sku = "SKU chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới";
        break;
      case 'name':
        if (value && value.length > 100) errors.name = "Tên sản phẩm không được quá 100 ký tự";
        break;
      case 'price':
        if (value && value < 1000) errors.price = "Giá phải ít nhất 1,000 VND";
        if (value && value > 10000000000) errors.price = "Giá không được quá 10 tỷ VND";
        break;
      case 'on_road_price':
        if (value && form.price && value < form.price) errors.on_road_price = "Giá lăn bánh phải lớn hơn hoặc bằng giá cơ bản";
        break;
      case 'battery_capacity':
        if (value && (value < rules.battery_capacity.min || value > rules.battery_capacity.max)) {
          errors.battery_capacity = `Dung lượng pin phải từ ${rules.battery_capacity.min}-${rules.battery_capacity.max} ${form.category === 'motorbike' ? 'kWh' : 'kWh'}`;
        }
        break;
      case 'range_km':
        if (value && (value < rules.range_km.min || value > rules.range_km.max)) {
          errors.range_km = `Quãng đường phải từ ${rules.range_km.min}-${rules.range_km.max} km`;
        }
        break;
      case 'charging_fast':
        if (value && (value < rules.charging_fast.min || value > rules.charging_fast.max)) {
          errors.charging_fast = `Thời gian sạc nhanh phải từ ${rules.charging_fast.min}-${rules.charging_fast.max} phút`;
        }
        break;
      case 'charging_slow':
        if (value && (value < rules.charging_slow.min || value > rules.charging_slow.max)) {
          errors.charging_slow = `Thời gian sạc chậm phải từ ${rules.charging_slow.min}-${rules.charging_slow.max} giờ`;
        }
        break;
      case 'motor_power':
        if (value && (value < rules.motor_power.min || value > rules.motor_power.max)) {
          errors.motor_power = `Công suất motor phải từ ${rules.motor_power.min}-${rules.motor_power.max} kW`;
        }
        break;
      case 'top_speed':
        if (value && (value < rules.top_speed.min || value > rules.top_speed.max)) {
          errors.top_speed = `Tốc độ tối đa phải từ ${rules.top_speed.min}-${rules.top_speed.max} km/h`;
        }
        break;
      case 'acceleration':
        if (value && (value < rules.acceleration.min || value > rules.acceleration.max)) {
          errors.acceleration = `Thời gian tăng tốc 0-100km/h phải từ ${rules.acceleration.min}-${rules.acceleration.max} giây`;
        }
        break;
      case 'weight':
        if (value && (value < rules.weight.min || value > rules.weight.max)) {
          errors.weight = `Trọng lượng phải từ ${rules.weight.min}-${rules.weight.max} kg`;
        }
        break;
      case 'seating_capacity':
        if (value && (value < rules.seating_capacity.min || value > rules.seating_capacity.max)) {
          errors.seating_capacity = `Số chỗ ngồi phải từ ${rules.seating_capacity.min}-${rules.seating_capacity.max}`;
        }
        break;
      case 'warranty_years':
        if (value && (value < 1 || value > 10)) errors.warranty_years = "Bảo hành phải từ 1-10 năm";
        break;
      case 'battery_warranty_years':
        if (value && (value < 1 || value > 15)) errors.battery_warranty_years = "Bảo hành pin phải từ 1-15 năm";
        break;
      case 'stock':
        if (value && (value < 0 || value > 10000)) errors.stock = "Số lượng tồn kho phải từ 0-10,000";
        break;
    }

    return errors;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: any = value;
    
    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      // Handle number fields - convert to number or 0 if empty
      fieldValue = value === '' ? 0 : Number(value);
      // Ensure non-negative for certain fields
      if (['price', 'on_road_price', 'battery_capacity', 'range_km', 'wltp_range_km', 
          'charging_fast', 'charging_slow', 'motor_power', 'top_speed', 'acceleration',
          'weight', 'payload', 'seating_capacity', 'warranty_years', 'battery_warranty_years', 'stock'].includes(name)) {
        fieldValue = Math.max(0, fieldValue);
      }
    }
    
    setForm((prev: any) => ({
      ...prev,
      [name]: fieldValue
    }));

    // Real-time validation
    const fieldValidationErrors = validateField(name, fieldValue);
    setFieldErrors((prev) => ({
      ...prev,
      ...fieldValidationErrors
    }));
  };

  const handleArrayChange = (name: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [name]: value.split(',').map((v) => v.trim()).filter((v) => v !== '')
    }));
  };

  const handleInteriorFeaturesChange = (value: string) => {
    // Parse interior features from format: "Feature1: Description1, Feature2: Description2"
    const features = value.split(',').map((feature) => {
      const trimmedFeature = feature.trim();
      if (!trimmedFeature) return null;
      
      const colonIndex = trimmedFeature.indexOf(':');
      if (colonIndex === -1) {
        // No colon, treat as name only
        return { name: trimmedFeature, description: '' };
      }
      
      const name = trimmedFeature.substring(0, colonIndex).trim();
      const description = trimmedFeature.substring(colonIndex + 1).trim();
      
      if (!name) return null;
      
      return { name, description };
    }).filter((f) => f !== null && f.name !== '');
    
    setForm((prev: any) => ({
      ...prev,
      interior_features: features
    }));
  };

  const getColorStocksArray = (stocksByColorJson: string) => {
    try {
      return stocksByColorJson ? JSON.parse(stocksByColorJson) : [];
    } catch (error) {
      console.error('Error parsing stocks_by_color JSON:', error);
      return [];
    }
  };

  const handleAddColorStock = () => {
    setForm((prev: any) => {
      const currentStocks = getColorStocksArray(prev.stocks_by_color);
      const newStocks = [...currentStocks, { color: '', quantity: 0 }];
      const newJson = JSON.stringify(newStocks);
      
      // Auto-update color_options based on new stocks
      const colors = newStocks
        .map((stock: any) => stock.color)
        .filter((color: string) => color && color.trim() !== '');
      
      return {
        ...prev,
        stocks_by_color: newJson,
        color_options: colors
      };
    });
  };

  const handleRemoveColorStock = (index: number) => {
    setForm((prev: any) => {
      const currentStocks = getColorStocksArray(prev.stocks_by_color);
      const newStocks = currentStocks.filter((_: any, i: number) => i !== index);
      const newJson = JSON.stringify(newStocks);
      
      // Auto-update color_options based on new stocks
      const colors = newStocks
        .map((stock: any) => stock.color)
        .filter((color: string) => color && color.trim() !== '');
      
      return {
        ...prev,
        stocks_by_color: newJson,
        color_options: colors
      };
    });
  };

  const handleColorStockChange = (index: number, field: 'color' | 'quantity', value: string | number) => {
    setForm((prev: any) => {
      const currentStocks = getColorStocksArray(prev.stocks_by_color);
      const newStocks = [...currentStocks];
      newStocks[index] = {
        ...newStocks[index],
        [field]: field === 'quantity' ? Number(value) : value
      };
      const newJson = JSON.stringify(newStocks);
      
      // Auto-update color_options based on colorStocks
      const colors = newStocks
        .map((stock: any) => stock.color)
        .filter((color: string) => color && color.trim() !== '');
      
      return {
        ...prev,
        stocks_by_color: newJson,
        color_options: colors
      };
    });
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
      // Only reset primary image index if current index is out of bounds for new images
      // This preserves user's choice when adding new images
      if (primaryImageIndex >= files.length) {
        setPrimaryImageIndex(0);
        console.log('Primary image index reset to 0 due to out of bounds');
      } else {
        console.log('Primary image index preserved:', primaryImageIndex);
      }
      console.log('Selected files:', files.map(f => f.name));
    }
  };

  const handleDimensionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    
    console.log('🔍 Dimensions change:', { name, value, numValue });
    
    // Validate dimensions
    const errors: {[key: string]: string} = {};
    if (name === 'length' && numValue && (numValue < 2000 || numValue > 6000)) {
      errors.dimensions_length = "Chiều dài phải từ 2000-6000 mm";
    }
    if (name === 'width' && numValue && (numValue < 1500 || numValue > 2500)) {
      errors.dimensions_width = "Chiều rộng phải từ 1500-2500 mm";
    }
    if (name === 'height' && numValue && (numValue < 1000 || numValue > 2500)) {
      errors.dimensions_height = "Chiều cao phải từ 1000-2500 mm";
    }

    setFieldErrors((prev) => ({
      ...prev,
      ...errors
    }));

    setForm((prev: any) => {
      const newForm = {
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [name]: numValue
        }
      };
      console.log('🔍 Updated dimensions:', newForm.dimensions);
      return newForm;
    });
  };

  // Comprehensive validation function
  const validateForm = () => {
    const errors: string[] = [];

    // Required fields validation
    if (!form.sku?.trim()) errors.push("SKU là bắt buộc");
    if (!form.name?.trim()) errors.push("Tên sản phẩm là bắt buộc");
    if (!form.category) errors.push("Danh mục là bắt buộc");
    if (!form.price || form.price <= 0) errors.push("Giá sản phẩm phải lớn hơn 0");

    // SKU validation
    if (form.sku) {
      if (form.sku.length < 3) errors.push("SKU phải có ít nhất 3 ký tự");
      if (form.sku.length > 50) errors.push("SKU không được quá 50 ký tự");
      if (!/^[A-Z0-9-_]+$/i.test(form.sku)) errors.push("SKU chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới");
      if (form.sku.toLowerCase().includes('test') || form.sku.toLowerCase().includes('demo')) {
        errors.push("SKU chứa từ 'test' hoặc 'demo' có thể đã tồn tại");
      }
    }

    // Name validation
    if (form.name && form.name.length > 100) errors.push("Tên sản phẩm không được quá 100 ký tự");

    // Price validation
    if (form.price) {
      if (form.price < 1000) errors.push("Giá sản phẩm phải ít nhất 1,000 VND");
      if (form.price > 10000000000) errors.push("Giá sản phẩm không được quá 10 tỷ VND");
    }

    // On road price validation
    if (form.on_road_price && form.on_road_price < form.price) {
      errors.push("Giá lăn bánh phải lớn hơn hoặc bằng giá cơ bản");
    }

    // Battery validation
    const category = form.category || 'car';
    const rules = getValidationRules(category);
    if (form.battery_capacity && (form.battery_capacity < rules.battery_capacity.min || form.battery_capacity > rules.battery_capacity.max)) {
      errors.push(`Dung lượng pin phải từ ${rules.battery_capacity.min}-${rules.battery_capacity.max} kWh`);
    }

    // Range validation
    if (form.range_km && (form.range_km < rules.range_km.min || form.range_km > rules.range_km.max)) {
      errors.push(`Quãng đường phải từ ${rules.range_km.min}-${rules.range_km.max} km`);
    }

    // Charging validation
    if (form.charging_fast && (form.charging_fast < rules.charging_fast.min || form.charging_fast > rules.charging_fast.max)) {
      errors.push(`Thời gian sạc nhanh phải từ ${rules.charging_fast.min}-${rules.charging_fast.max} phút`);
    }
    if (form.charging_slow && (form.charging_slow < rules.charging_slow.min || form.charging_slow > rules.charging_slow.max)) {
      errors.push(`Thời gian sạc chậm phải từ ${rules.charging_slow.min}-${rules.charging_slow.max} giờ`);
    }

    // Motor power validation
    if (form.motor_power && (form.motor_power < rules.motor_power.min || form.motor_power > rules.motor_power.max)) {
      errors.push(`Công suất motor phải từ ${rules.motor_power.min}-${rules.motor_power.max} kW`);
    }

    // Speed validation
    if (form.top_speed && (form.top_speed < rules.top_speed.min || form.top_speed > rules.top_speed.max)) {
      errors.push(`Tốc độ tối đa phải từ ${rules.top_speed.min}-${rules.top_speed.max} km/h`);
    }

    // Acceleration validation
    if (form.acceleration && (form.acceleration < rules.acceleration.min || form.acceleration > rules.acceleration.max)) {
      errors.push(`Thời gian tăng tốc 0-100km/h phải từ ${rules.acceleration.min}-${rules.acceleration.max} giây`);
    }

    // Dimensions validation
    if (form.dimensions) {
      if (form.dimensions.length && (form.dimensions.length < rules.dimensions.length.min || form.dimensions.length > rules.dimensions.length.max)) {
        errors.push(`Chiều dài phải từ ${rules.dimensions.length.min}-${rules.dimensions.length.max} mm`);
      }
      if (form.dimensions.width && (form.dimensions.width < rules.dimensions.width.min || form.dimensions.width > rules.dimensions.width.max)) {
        errors.push(`Chiều rộng phải từ ${rules.dimensions.width.min}-${rules.dimensions.width.max} mm`);
      }
      if (form.dimensions.height && (form.dimensions.height < rules.dimensions.height.min || form.dimensions.height > rules.dimensions.height.max)) {
        errors.push(`Chiều cao phải từ ${rules.dimensions.height.min}-${rules.dimensions.height.max} mm`);
      }
      if (form.dimensions.wheelbase && (form.dimensions.wheelbase < rules.dimensions.wheelbase.min || form.dimensions.wheelbase > rules.dimensions.wheelbase.max)) {
        errors.push(`Chiều dài cơ sở phải từ ${rules.dimensions.wheelbase.min}-${rules.dimensions.wheelbase.max} mm`);
      }
      if (form.dimensions.ground_clearance && (form.dimensions.ground_clearance < rules.dimensions.ground_clearance.min || form.dimensions.ground_clearance > rules.dimensions.ground_clearance.max)) {
        errors.push(`Khoảng sáng gầm phải từ ${rules.dimensions.ground_clearance.min}-${rules.dimensions.ground_clearance.max} mm`);
      }
    }

    // Weight validation
    if (form.weight && (form.weight < rules.weight.min || form.weight > rules.weight.max)) {
      errors.push(`Trọng lượng phải từ ${rules.weight.min}-${rules.weight.max} kg`);
    }

    // Seating capacity validation
    if (form.seating_capacity && (form.seating_capacity < rules.seating_capacity.min || form.seating_capacity > rules.seating_capacity.max)) {
      errors.push(`Số chỗ ngồi phải từ ${rules.seating_capacity.min}-${rules.seating_capacity.max}`);
    }

    // Warranty validation
    if (form.warranty_years && (form.warranty_years < 1 || form.warranty_years > 10)) {
      errors.push("Bảo hành phải từ 1-10 năm");
    }
    if (form.battery_warranty_years && (form.battery_warranty_years < 1 || form.battery_warranty_years > 15)) {
      errors.push("Bảo hành pin phải từ 1-15 năm");
    }

    // Stock validation
    if (form.stock && (form.stock < 0 || form.stock > 10000)) {
      errors.push("Số lượng tồn kho phải từ 0-10,000");
    }

    // Interior features validation
    if (form.interior_features && form.interior_features.length > 0) {
      const invalidFeatures = form.interior_features.filter((f: any) => !f.name?.trim());
      if (invalidFeatures.length > 0) {
        errors.push("Tất cả tính năng nội thất phải có tên");
      }
    }

    // Color options validation
    if (form.color_options && form.color_options.length > 20) {
      errors.push("Không được chọn quá 20 màu sắc");
    }

    // Promotions validation
    if (form.promotions && form.promotions.length > 10) {
      errors.push("Không được chọn quá 10 khuyến mãi");
    }

    return errors;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCreating(true);
    setError(null);
    
    try {
      // Comprehensive validation
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }

      // Debug: Log form data before processing
      console.log('Form data before processing:', form);
      console.log('🔍 Debug stocks_by_color:', form.stocks_by_color);

      // Keep stocks_by_color for backend processing
      const { stock, ...restForm } = form;
      console.log('restForm after destructuring:', restForm);
      console.log('🔍 stocks_by_color to send:', form.stocks_by_color);

      // Clean form data - keep all fields for update, remove empty values for create
      const cleanForm: any = {};
      const requiredFields = ['sku', 'name', 'category', 'price'];
      
      // For edit mode, preserve all fields; for create mode, only keep non-empty values
      const isEditMode = !!editProduct;
      
      // First, ensure all required fields are present
      requiredFields.forEach(field => {
        if (restForm[field] !== undefined && restForm[field] !== null) {
          cleanForm[field] = restForm[field];
          console.log(`Added required field ${field}:`, restForm[field]);
        } else {
          console.log(`Missing required field ${field} in restForm:`, restForm[field]);
        }
      });

      // Fix date format for release_date
      if (restForm.release_date) {
        const date = new Date(restForm.release_date);
        cleanForm.release_date = date.toISOString().split('T')[0];
      }

      // Fix trunk_type to ensure it's valid
      if (restForm.trunk_type && !trunkTypes.includes(restForm.trunk_type)) {
        cleanForm.trunk_type = 'manual'; // Default to manual if invalid
      }
      
      Object.entries(restForm).forEach(([key, value]) => {
        // Skip if already handled as required field
        if (requiredFields.includes(key)) {
          return;
        }

        // For edit mode, preserve all fields; for create mode, filter empty values
        if (isEditMode) {
          // In edit mode, preserve all fields to maintain data integrity
          if (key === 'promotions' && Array.isArray(value)) {
            cleanForm[key] = value || [];
          } else if (key === 'interior_features' && Array.isArray(value)) {
            cleanForm[key] = value || [];
          } else if (Array.isArray(value)) {
            cleanForm[key] = value || [];
          } else if (typeof value === 'object' && value !== null) {
            cleanForm[key] = value;
          } else {
            cleanForm[key] = value;
          }
        } else {
          // In create mode, filter empty values
          if (key === 'promotions' && Array.isArray(value)) {
            if (value.length > 0) {
              cleanForm[key] = value.filter((v) => typeof v === 'string' && v.trim() !== '');
            }
          } else if (key === 'interior_features' && Array.isArray(value)) {
            if (value.length > 0) {
              cleanForm[key] = value.filter((f) => f && f.name && f.name.trim() !== '');
            }
          } else if (Array.isArray(value)) {
            if (value.length > 0 && value.some((v) => v !== '' && v != null)) {
              cleanForm[key] = value.filter((v) => v !== '' && v != null);
            }
          } else if (typeof value === 'object' && value !== null) {
            if (key === 'dimensions') {
              // Always include dimensions object in edit mode, or if it has valid values in create mode
              if (isEditMode || Object.values(value).some((v) => v !== 0 && v !== '' && v != null)) {
                cleanForm[key] = value;
              }
            } else if (Object.keys(value).length > 0) {
              cleanForm[key] = value;
            }
          }
        }

        // Handle strings, numbers, and booleans
        if (isEditMode) {
          // In edit mode, preserve all values
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            cleanForm[key] = value;
          }
        } else {
          // In create mode, filter empty values
          if (typeof value === 'string') {
            if (value.trim() !== '') cleanForm[key] = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            cleanForm[key] = value;
          }
        }
      });

      // Note: Backend will process stocks_by_color and create stocks array automatically

      // Final validation: ensure all required fields are present
      const missingFields = requiredFields.filter(field => 
        cleanForm[field] === undefined || 
        cleanForm[field] === null || 
        cleanForm[field] === '' ||
        (typeof cleanForm[field] === 'number' && cleanForm[field] <= 0)
      );
      
      if (missingFields.length > 0) {
        setError(`Thiếu các trường bắt buộc: ${missingFields.join(', ')}`);
        return;
      }

      // Debug: Log the data being sent
      console.log('Original form data:', restForm);
      console.log('Cleaned form data:', cleanForm);
      console.log('Required fields check:', {
        sku: cleanForm.sku,
        name: cleanForm.name,
        category: cleanForm.category,
        price: cleanForm.price,
        manufacturer_id: cleanForm.manufacturer_id
      });
      console.log('Image files:', imageFiles);

      // Send data to backend with multipart/form-data if there are images
      let response;
      const url = isEditMode ? `/api/vehicles/${editProduct._id}` : "/api/vehicles";
      
      // Use FormData only when there are image files to upload
      if (imageFiles.length > 0) {
        console.log(`Sending with images using FormData (${isEditMode ? 'edit' : 'create'})`);
        const formData = new FormData();
        
        // Append all form fields
        Object.keys(cleanForm).forEach(key => {
          const value = cleanForm[key];
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'interior_features' && Array.isArray(value)) {
              // Special handling for interior_features array of objects
              value.forEach((item, index) => {
                if (typeof item === 'object') {
                  formData.append(`${key}[${index}][name]`, item.name || '');
                  formData.append(`${key}[${index}][description]`, item.description || '');
                }
              });
            } else if (key === 'dimensions' && typeof value === 'object' && !Array.isArray(value)) {
              // Special handling for dimensions object
              Object.entries(value).forEach(([dimKey, dimValue]) => {
                formData.append(`${key}.${dimKey}`, String(dimValue));
              });
            } else if (typeof value === 'object' && !Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else if (key === 'images' && Array.isArray(value)) {
              // Skip images field when uploading new images - let new images replace completely
              console.log('Skipping existing images array - new images will replace them');
            } else if (Array.isArray(value)) {
              // For regular arrays, append each item separately
              value.forEach((item, index) => {
                formData.append(`${key}[${index}]`, String(item));
              });
            } else {
              formData.append(key, String(value));
            }
          }
        });
        
        // Append image files
        console.log('Appending image files:', imageFiles.length);
        
        // Handle image upload
        if (imageFiles.length > 0) {
          console.log('Appending new image files:', imageFiles.length);
          imageFiles.forEach((file, index) => {
            console.log(`Appending image ${index}:`, file.name, file.type, file.size);
            formData.append('images', file);
          });
          // Use the user-selected primary image index, ensure it's within bounds
          const validPrimaryIndex = Math.min(primaryImageIndex, imageFiles.length - 1);
          formData.append('primaryImageIndex', validPrimaryIndex.toString());
          console.log('Setting primary image index for new images:', validPrimaryIndex);
        } else if (isEditMode && editProduct && form.images && form.images.length > 0) {
          // If editing and no new images, send the selected primary image index
          formData.append('primaryImageIndex', primaryImageIndex.toString());
          console.log('Setting primary image index:', primaryImageIndex);
        }

        // Debug: Log all FormData entries
        console.log('🔍 FormData entries:');
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
        console.log('🔍 Original form dimensions:', form.dimensions);
        
        if (isEditMode) {
          const { put } = await import("../../../services/httpClient");
          console.log('🚀 Sending PUT request to:', url);
          response = await put(url, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          console.log('🚀 Sending POST request to:', url);
          response = await post(url, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
        
        console.log('✅ Response received:', response);
      } else {
        console.log(`Sending JSON without images (${isEditMode ? 'edit' : 'create'})`);
        
        // If editing and need to update primary image index
        if (isEditMode && editProduct && form.images && form.images.length > 0) {
          cleanForm.primaryImageIndex = primaryImageIndex;
          console.log('Including primary image index in JSON:', primaryImageIndex);
        }
        
        console.log('Clean form data for JSON request:', cleanForm);
        console.log('🔍 Dimensions object:', cleanForm.dimensions);
        console.log('🔍 Original form dimensions:', form.dimensions);
        if (isEditMode) {
          const { put } = await import("../../../services/httpClient");
          console.log('🚀 Sending PUT JSON to:', url);
          console.log('📦 JSON data:', cleanForm);
          response = await put(url, cleanForm);
        } else {
          console.log('🚀 Sending POST JSON to:', url);
          console.log('📦 JSON data:', cleanForm);
          response = await post(url, cleanForm);
        }
        
        console.log('✅ JSON Response received:', response);
      }
      
      console.log(`✅ Product ${isEditMode ? 'updated' : 'created'} successfully:`, response);
      console.log('🔍 Response data:', response.data);
      
      // Log the updated images to verify they're saved
      if (response.data?.images) {
        console.log('Updated images in response:', response.data.images);
      }
      
      // Refresh product list if callback provided
      if (onProductCreated) {
        console.log('Calling onProductCreated to refresh product list...');
        await onProductCreated();
      }
      
      // Close modal and reset form on success
      handleClose();
    } catch (err: any) {
      console.error('❌ Error creating/updating product:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      // Handle specific error cases
      if (err.response?.data?.error && Array.isArray(err.response.data.error)) {
        // Handle multiple errors (like SKU already exists)
        const errorMessages = err.response.data.error.map((error: any) => error.message).join(', ');
        setError(errorMessages);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Tạo sản phẩm thất bại. Vui lòng thử lại.");
      }
    } finally {
      setCreating(false);
    }
  };

  // Render form content
  const renderFormContent = () => (
    <>
      {!editProduct && (
        <h2 className="text-2xl font-bold mb-6">
          {editProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h2>
      )}
      {error && <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 border border-red-300">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <strong>Lỗi:</strong>
        </div>
        <div className="mt-2">{error}</div>
        {error.includes('đăng nhập') && (
          <div className="mt-3">
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Đăng nhập lại
            </button>
          </div>
        )}
        {error.includes('quyền Admin') && (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-2">
              <strong>Giải pháp:</strong>
            </div>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Liên hệ quản trị viên để được cấp quyền Admin</li>
              <li>Hoặc sử dụng tài khoản Admin để truy cập tính năng này</li>
            </ul>
          </div>
        )}
      </div>}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        <label className="font-semibold">Tên sản phẩm *</label>
        <input name="name" value={form.name} onChange={handleFormChange} placeholder="Tên sản phẩm" className={`border rounded px-3 py-2 ${fieldErrors.name ? 'border-red-500' : ''}`} required />
        {fieldErrors.name && <div className="text-red-500 text-sm mt-1">{fieldErrors.name}</div>}
        <label className="font-semibold">Model</label>
        <input name="model" value={form.model} onChange={handleFormChange} placeholder="Model" className="border rounded px-3 py-2" />
        <label className="font-semibold">Danh mục *</label>
        <select name="category" value={form.category} onChange={handleFormChange} className="border rounded px-3 py-2" required>
          <option value="">Chọn danh mục</option>
          <option value="car">Ô tô</option>
          <option value="motorbike">Xe máy</option>
        </select>
        {/* <label className="font-semibold">Nhà sản xuất</label> */}
        {/* <div className="border rounded px-3 py-2 bg-gray-50">
          {(() => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.manufacturerName) {
              return (
                <div className="flex items-center">
                  <span className="text-gray-700 font-medium">{user.manufacturerName}</span>
                  <span className="ml-2 text-xs text-gray-500">(Tự động từ tài khoản của bạn)</span>
                </div>
              );
            } else {
              return (
                <div className="text-gray-600">
                  <span>Nhà sản xuất sẽ được tự động xác định từ tài khoản của bạn</span>
                  <div className="text-xs text-gray-500 mt-1">
                    Backend sẽ tự động lấy thông tin nhà sản xuất từ profile user
                  </div>
                </div>
              );
            }
          })()}
        </div> */}
        <label className="font-semibold">SKU *</label>
        <div className="flex gap-2">
          <input name="sku" value={form.sku} onChange={handleFormChange} placeholder="VD: VF9-PREMIUM-2025" className={`border rounded px-3 py-2 flex-1 ${fieldErrors.sku ? 'border-red-500' : ''}`} required />
          <button 
            type="button" 
            onClick={() => {
              const prefix = form.category === 'car' ? 'VF9' : 'VM3';
              const random = Math.floor(Math.random() * 10000);
              const timestamp = Date.now().toString().slice(-4);
              setForm((prev: any) => ({ ...prev, sku: `${prefix}-${timestamp}-${random}` }));
            }}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Tạo SKU
          </button>
        </div>
        {fieldErrors.sku && <div className="text-red-500 text-sm mt-1">{fieldErrors.sku}</div>}
        <div className="text-xs text-gray-500 mb-2">
          <div className="flex items-center mb-1">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <strong>Lưu ý:</strong> SKU phải duy nhất và chỉ chứa chữ cái, số, dấu gạch ngang và gạch dưới
          </div>
          <div className="text-blue-600">Sử dụng nút "Tạo SKU" để tự động tạo SKU ngẫu nhiên</div>
        </div>
        <label className="font-semibold">Version</label>
        <input name="version" value={form.version} onChange={handleFormChange} placeholder="Version" className="border rounded px-3 py-2" />
        <label className="font-semibold">Trạng thái phát hành</label>
        <select name="release_status" value={form.release_status} onChange={handleFormChange} className="border rounded px-3 py-2">
          <option value="">Chọn trạng thái phát hành</option>
          <option value="coming_soon">Sắp ra mắt</option>
          <option value="available">Đang bán</option>
          <option value="discontinued">Ngừng bán</option>
        </select>
        <label className="font-semibold">Ngày phát hành</label>
        <input name="release_date" type="date" value={form.release_date} onChange={handleFormChange} className="border rounded px-3 py-2" />
        <label className="font-semibold">Trạng thái</label>
        <select name="status" value={form.status} onChange={handleFormChange} className="border rounded px-3 py-2">
          <option value="">Chọn trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
        <label className="font-semibold">Giá *</label>
        <input name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="Giá (VND)" className={`border rounded px-3 py-2 ${fieldErrors.price ? 'border-red-500' : ''}`} required />
        {fieldErrors.price && <div className="text-red-500 text-sm mt-1">{fieldErrors.price}</div>}
        <div className="text-xs text-gray-500 mb-2">Giá từ 1,000 VND đến 10 tỷ VND</div>
        <label className="font-semibold">Giá lăn bánh</label>
        <input name="on_road_price" type="number" value={form.on_road_price} onChange={handleFormChange} placeholder="Giá lăn bánh" className={`border rounded px-3 py-2 ${fieldErrors.on_road_price ? 'border-red-500' : ''}`} />
        {fieldErrors.on_road_price && <div className="text-red-500 text-sm mt-1">{fieldErrors.on_road_price}</div>}
        <label className="font-semibold">Loại pin</label>
        <select name="battery_type" value={form.battery_type} onChange={handleFormChange} className="border rounded px-3 py-2">
          <option value="">Chọn loại pin</option>
          {batteryTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <label className="font-semibold">Dung lượng pin</label>
        <input name="battery_capacity" type="number" value={form.battery_capacity} onChange={handleFormChange} placeholder="Dung lượng pin (kWh)" className={`border rounded px-3 py-2 ${fieldErrors.battery_capacity ? 'border-red-500' : ''}`} />
        {fieldErrors.battery_capacity && <div className="text-red-500 text-sm mt-1">{fieldErrors.battery_capacity}</div>}
        <div className="text-xs text-gray-500 mb-2">Dung lượng pin từ 1-200 kWh</div>
        <label className="font-semibold">Quãng đường (km)</label>
        <input name="range_km" type="number" value={form.range_km} onChange={handleFormChange} placeholder="Quãng đường (km)" className={`border rounded px-3 py-2 ${fieldErrors.range_km ? 'border-red-500' : ''}`} />
        {fieldErrors.range_km && <div className="text-red-500 text-sm mt-1">{fieldErrors.range_km}</div>}
        <div className="text-xs text-gray-500 mb-2">Quãng đường từ 50-1000 km</div>
        <label className="font-semibold">WLTP range (km)</label>
        <input name="wltp_range_km" type="number" value={form.wltp_range_km} onChange={handleFormChange} placeholder="WLTP range (km)" className="border rounded px-3 py-2" />
        <label className="font-semibold">Sạc nhanh (phút)</label>
        <input name="charging_fast" type="number" value={form.charging_fast} onChange={handleFormChange} placeholder="Sạc nhanh (phút)" className={`border rounded px-3 py-2 ${fieldErrors.charging_fast ? 'border-red-500' : ''}`} />
        {fieldErrors.charging_fast && <div className="text-red-500 text-sm mt-1">{fieldErrors.charging_fast}</div>}
        <label className="font-semibold">Sạc chậm (phút)</label>
        <input name="charging_slow" type="number" value={form.charging_slow} onChange={handleFormChange} placeholder="Sạc chậm (phút)" className={`border rounded px-3 py-2 ${fieldErrors.charging_slow ? 'border-red-500' : ''}`} />
        {fieldErrors.charging_slow && <div className="text-red-500 text-sm mt-1">{fieldErrors.charging_slow}</div>}
        <label className="font-semibold">Loại cổng sạc</label>
        <select name="charging_port_type" value={form.charging_port_type} onChange={handleFormChange} className="border rounded px-3 py-2">
          <option value="">Chọn loại cổng sạc</option>
          {chargingPortTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <label className="font-semibold">Công suất motor</label>
        <input name="motor_power" type="number" value={form.motor_power} onChange={handleFormChange} placeholder="Công suất motor" className={`border rounded px-3 py-2 ${fieldErrors.motor_power ? 'border-red-500' : ''}`} />
        {fieldErrors.motor_power && <div className="text-red-500 text-sm mt-1">{fieldErrors.motor_power}</div>}
        <label className="font-semibold">Tốc độ tối đa</label>
        <input name="top_speed" type="number" value={form.top_speed} onChange={handleFormChange} placeholder="Tốc độ tối đa" className={`border rounded px-3 py-2 ${fieldErrors.top_speed ? 'border-red-500' : ''}`} />
        {fieldErrors.top_speed && <div className="text-red-500 text-sm mt-1">{fieldErrors.top_speed}</div>}
        <label className="font-semibold">Tăng tốc</label>
        <input name="acceleration" type="number" value={form.acceleration} onChange={handleFormChange} placeholder="Tăng tốc" className={`border rounded px-3 py-2 ${fieldErrors.acceleration ? 'border-red-500' : ''}`} />
        {fieldErrors.acceleration && <div className="text-red-500 text-sm mt-1">{fieldErrors.acceleration}</div>}
        <label className="font-semibold">Dẫn động</label>
        <select name="drivetrain" value={form.drivetrain} onChange={handleFormChange} className="border rounded px-3 py-2">
          <option value="">Chọn dẫn động</option>
          {drivetrains.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-semibold">Chiều dài</label>
            <input name="length" type="number" value={form.dimensions.length} onChange={handleDimensionsChange} placeholder="Chiều dài" className={`border rounded px-3 py-2 ${fieldErrors.dimensions_length ? 'border-red-500' : ''}`} />
            {fieldErrors.dimensions_length && <div className="text-red-500 text-xs mt-1">{fieldErrors.dimensions_length}</div>}
          </div>
          <div>
            <label className="font-semibold">Chiều rộng</label>
            <input name="width" type="number" value={form.dimensions.width} onChange={handleDimensionsChange} placeholder="Chiều rộng" className={`border rounded px-3 py-2 ${fieldErrors.dimensions_width ? 'border-red-500' : ''}`} />
            {fieldErrors.dimensions_width && <div className="text-red-500 text-xs mt-1">{fieldErrors.dimensions_width}</div>}
          </div>
          <div>
            <label className="font-semibold">Chiều cao</label>
            <input name="height" type="number" value={form.dimensions.height} onChange={handleDimensionsChange} placeholder="Chiều cao" className={`border rounded px-3 py-2 ${fieldErrors.dimensions_height ? 'border-red-500' : ''}`} />
            {fieldErrors.dimensions_height && <div className="text-red-500 text-xs mt-1">{fieldErrors.dimensions_height}</div>}
          </div>
          <div>
            <label className="font-semibold">Chiều dài cơ sở</label>
            <input name="wheelbase" type="number" value={form.dimensions.wheelbase} onChange={handleDimensionsChange} placeholder="Chiều dài cơ sở" className="border rounded px-3 py-2" />
          </div>
          <div>
            <label className="font-semibold">Khoảng sáng gầm</label>
            <input name="ground_clearance" type="number" value={form.dimensions.ground_clearance} onChange={handleDimensionsChange} placeholder="Khoảng sáng gầm" className="border rounded px-3 py-2" />
          </div>
        </div>
        <label className="font-semibold">Trọng lượng</label>
        <input name="weight" type="number" value={form.weight} onChange={handleFormChange} placeholder="Trọng lượng" className={`border rounded px-3 py-2 ${fieldErrors.weight ? 'border-red-500' : ''}`} />
        {fieldErrors.weight && <div className="text-red-500 text-sm mt-1">{fieldErrors.weight}</div>}
        <label className="font-semibold">Tải trọng</label>
        <input name="payload" type="number" value={form.payload} onChange={handleFormChange} placeholder="Tải trọng" className="border rounded px-3 py-2" />
        <label className="font-semibold">Số chỗ ngồi</label>
        <input name="seating_capacity" type="number" value={form.seating_capacity} onChange={handleFormChange} placeholder="Số chỗ ngồi" className={`border rounded px-3 py-2 ${fieldErrors.seating_capacity ? 'border-red-500' : ''}`} />
        {fieldErrors.seating_capacity && <div className="text-red-500 text-sm mt-1">{fieldErrors.seating_capacity}</div>}
        <label className="font-semibold">Kích thước lốp</label>
        <input name="tire_size" value={form.tire_size} onChange={handleFormChange} placeholder="Kích thước lốp" className="border rounded px-3 py-2" />
        <label className="font-semibold">Loại cốp</label>
        <select name="trunk_type" value={form.trunk_type} onChange={handleFormChange} className="border rounded px-3 py-2">
          <option value="">Chọn loại cốp</option>
          {trunkTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <label className="font-semibold">Tính năng an toàn</label>
        <input name="safety_features" value={form.safety_features.join(', ')} onChange={e => handleArrayChange('safety_features', e.target.value)} placeholder="Tính năng an toàn (cách nhau dấu phẩy)" className="border rounded px-3 py-2" />
        <label className="font-semibold">Tính năng nội thất</label>
        <input name="interior_features" value={form.interior_features.map((f: any) => `${f.name}: ${f.description}`).join(', ')} onChange={e => handleInteriorFeaturesChange(e.target.value)} placeholder="Tính năng nội thất (Tên: Mô tả, cách nhau dấu phẩy)" className="border rounded px-3 py-2" />
        <label className="font-semibold">Chế độ lái</label>
        <input name="driving_modes" value={form.driving_modes.join(', ')} onChange={e => handleArrayChange('driving_modes', e.target.value)} placeholder="Chế độ lái (cách nhau dấu phẩy)" className="border rounded px-3 py-2" />
        <label className="font-semibold">Phiên bản phần mềm</label>
        <input name="software_version" value={form.software_version} onChange={handleFormChange} placeholder="Phiên bản phần mềm" className="border rounded px-3 py-2" />
        <label className="font-semibold">Hỗ trợ OTA update</label>
        <label className="flex items-center">
          <input name="ota_update" type="checkbox" checked={form.ota_update} onChange={handleFormChange} className="mr-2" />
          Có
        </label>
        <label className="font-semibold">Quản lý tồn kho theo màu sắc</label>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 mb-2">
            Debug - stocks_by_color: {form.stocks_by_color || 'empty'}
          </div>
        )}
        <div className="border rounded p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Thêm màu sắc và số lượng tồn kho</span>
            <button
              type="button"
              onClick={handleAddColorStock}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              + Thêm màu
            </button>
          </div>
          
          {(() => {
            const colorStocks = getColorStocksArray(form.stocks_by_color);
            return colorStocks.length > 0 ? (
              <div className="space-y-3">
                {colorStocks.map((colorStock: any, index: number) => (
                <div key={index} className="flex gap-2 items-center p-3 bg-white rounded border">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Tên màu (VD: Đỏ, Xanh, Trắng...)"
                      value={colorStock.color}
                      onChange={(e) => handleColorStockChange(index, 'color', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Số lượng"
                      value={colorStock.quantity}
                      onChange={(e) => handleColorStockChange(index, 'quantity', e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                      min="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveColorStock(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="text-xs text-blue-600 mt-2">
                💡 Màu sắc sẽ tự động cập nhật vào "Màu sắc" bên dưới
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div className="text-sm">Chưa có màu sắc nào</div>
                <div className="text-xs mt-1">Nhấn "Thêm màu" để bắt đầu</div>
              </div>
            );
          })()}
        </div>
        
        <label className="font-semibold">Số lượng tồn kho (Tổng cộng)</label>
        {(() => {
          const colorStocks = getColorStocksArray(form.stocks_by_color);
          const totalStock = colorStocks.length > 0 
            ? colorStocks.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)
            : form.stock;
          
          console.log('🔍 Debug Stock Calculation:');
          console.log('- colorStocks:', colorStocks);
          console.log('- totalStock:', totalStock);
          console.log('- form.stock:', form.stock);
          
          return (
            <input 
              name="stock" 
              type="number" 
              value={totalStock} 
              onChange={handleFormChange} 
              placeholder="Số lượng tồn kho" 
              className={`border rounded px-3 py-2 ${fieldErrors.stock ? 'border-red-500' : ''}`} 
              readOnly={colorStocks.length > 0}
            />
          );
        })()}
        {fieldErrors.stock && <div className="text-red-500 text-sm mt-1">{fieldErrors.stock}</div>}
        {getColorStocksArray(form.stocks_by_color).length > 0 && (
          <div className="text-xs text-green-600 mt-1">
            💡 Số lượng này được tính tự động từ tổng các màu sắc
          </div>
        )}
        <label className="font-semibold">Bảo hành (năm)</label>
        <input name="warranty_years" type="number" value={form.warranty_years} onChange={handleFormChange} placeholder="Bảo hành (năm)" className={`border rounded px-3 py-2 ${fieldErrors.warranty_years ? 'border-red-500' : ''}`} />
        {fieldErrors.warranty_years && <div className="text-red-500 text-sm mt-1">{fieldErrors.warranty_years}</div>}
        <label className="font-semibold">Bảo hành pin (năm)</label>
        <input name="battery_warranty_years" type="number" value={form.battery_warranty_years} onChange={handleFormChange} placeholder="Bảo hành pin (năm)" className={`border rounded px-3 py-2 ${fieldErrors.battery_warranty_years ? 'border-red-500' : ''}`} />
        {fieldErrors.battery_warranty_years && <div className="text-red-500 text-sm mt-1">{fieldErrors.battery_warranty_years}</div>}
        <label className="font-semibold">Màu sắc</label>
        <input 
          name="color_options" 
          value={form.color_options.join(', ')} 
          onChange={e => handleArrayChange('color_options', e.target.value)} 
          placeholder="Màu sắc (cách nhau dấu phẩy)" 
          className={`border rounded px-3 py-2 ${getColorStocksArray(form.stocks_by_color).length > 0 ? 'bg-gray-100' : ''}`}
          readOnly={getColorStocksArray(form.stocks_by_color).length > 0}
        />
        {getColorStocksArray(form.stocks_by_color).length > 0 && (
          <div className="text-xs text-blue-600 mt-1">
            💡 Màu sắc được tự động cập nhật từ "Quản lý tồn kho theo màu sắc" ở trên
          </div>
        )}
        <label className="font-semibold">Ảnh sản phẩm (Tùy chọn)</label>
        
        {/* Show existing images when editing - only show if no new images selected */}
        {editProduct && form.images && form.images.length > 0 && imageFiles.length === 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Ảnh hiện tại: 
              <span className="text-xs text-blue-600 ml-2">
                Click vào ảnh để đặt làm ảnh đại diện
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((imageUrl: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={imageUrl}
                    alt={`Current ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded border-2 cursor-pointer transition-all ${
                      index === primaryImageIndex 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                    onClick={() => setPrimaryImageIndex(index)}
                  />
                  {index === primaryImageIndex && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ★
                    </div>
                  )}
                  <div className="text-xs text-center mt-1 text-gray-500">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-blue-600">
              {form.images.length} ảnh hiện tại. Ảnh đại diện: #{primaryImageIndex + 1}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Chọn ảnh mới bên dưới để thay thế toàn bộ ảnh hiện tại.
            </div>
          </div>
        )}
        
        {/* Warning when new images are selected in edit mode */}
        {editProduct && imageFiles.length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-sm text-orange-800">
              <strong>⚠️ Thay thế ảnh:</strong> Bạn đã chọn {imageFiles.length} ảnh mới. 
              Các ảnh này sẽ thay thế hoàn toàn {form.images.length} ảnh hiện tại khi lưu.
            </div>
          </div>
        )}
        
        <input type="file" multiple accept="image/*" onChange={handleImageFilesChange} className="border rounded px-3 py-2" />
        <div className="text-xs text-gray-500 mb-2">
          {editProduct 
            ? "Chọn ảnh mới để thay thế ảnh hiện tại. Bỏ trống để giữ ảnh cũ." 
            : "Chọn ảnh để upload lên Cloudinary. Có thể bỏ trống."
          }
        </div>
        {imageFiles.length > 0 && (
          <>
            <div className="text-sm text-green-600 mb-2">
              Đã chọn {imageFiles.length} ảnh: {imageFiles.map(f => f.name).join(', ')}
            </div>
            <div className="text-sm text-blue-600 mb-2 bg-blue-50 p-2 rounded border">
              <strong>🌟 Ảnh chính:</strong> Ảnh số #{primaryImageIndex + 1} được chọn làm ảnh đại diện chính
            </div>
            {/* Preview ảnh mới đã chọn */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Preview ảnh mới:</div>
              <div className="flex flex-wrap gap-2">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className={`w-20 h-20 object-cover rounded border-2 cursor-pointer transition-all ${
                        primaryImageIndex === index 
                          ? 'border-blue-500 ring-2 ring-blue-300' 
                          : 'border-green-400 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setPrimaryImageIndex(index);
                        console.log('Selected primary image index:', index);
                      }}
                    />
                    <div className={`text-xs text-center mt-1 ${
                      primaryImageIndex === index ? 'text-blue-600 font-semibold' : 'text-green-600'
                    }`}>
                      {primaryImageIndex === index ? '🌟 Chính' : `Mới #${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                💡 Click vào ảnh để chọn làm ảnh chính. Ảnh hiện tại được chọn: <strong>#{primaryImageIndex + 1}</strong>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Những ảnh này sẽ thay thế toàn bộ ảnh hiện tại khi lưu.
              </div>
            </div>
          </>
        )}
        <label className="font-semibold">Mô tả sản phẩm</label>
        <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Mô tả sản phẩm" className="border rounded px-3 py-2" />
        <label className="font-semibold">Khuyến mãi</label>
        <div className="border rounded px-3 py-2 max-h-32 overflow-y-auto bg-gray-50">
          {promotions.length > 0 ? (
            <>
              <div className="text-xs text-gray-500 mb-2">Chọn các khuyến mãi áp dụng cho sản phẩm:</div>
              {promotions.map((p) => (
                <label key={p._id} className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={form.promotions.includes(p._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm((prev: any) => ({
                          ...prev,
                          promotions: [...prev.promotions, p._id]
                        }));
                      } else {
                        setForm((prev: any) => ({
                          ...prev,
                          promotions: prev.promotions.filter((id: string) => id !== p._id)
                        }));
                      }
                    }}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-sm">{p.name}</span>
                </label>
              ))}
              {form.promotions.length > 0 && (
                <div className="text-xs text-green-600 mt-2">
                  Đã chọn {form.promotions.length} khuyến mãi
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-sm">Không có khuyến mãi nào</div>
          )}
        </div>
        <div className="flex space-x-2 mt-2">
          <button type="button" onClick={handleCreateProduct} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center" disabled={creating}>
            {creating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editProduct ? 'Đang cập nhật...' : 'Đang tạo sản phẩm...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {editProduct ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
              </>
            )}
          </button>
          <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold" onClick={handleClose}>
            Đóng
          </button>
        </div>
      </div>
    </>
  );

  // If this is edit mode and being used inside Ant Design Modal, don't wrap with ReactModal
  if (editProduct && isOpen) {
    return renderFormContent();
  }

  // For create mode, use ReactModal
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '600px',
          width: '100%',
          padding: '32px',
          borderRadius: '16px',
        },
      }}
      ariaHideApp={false}
    >
      {renderFormContent()}
    </ReactModal>
  );
};

export default AddProduct;
