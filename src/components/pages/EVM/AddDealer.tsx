import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminLayout } from '../admin/AdminLayout';
import { post } from '../../../services/httpClient';
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


interface DealerForm {
  code: string;
  company_name: string;
  business_license: string;
  tax_code: string;
  legal_representative: string;
  dealer_level: string;
  product_distribution: string;
  contract: {
    contract_number: string;
    signed_date: string;
    expiry_date: string;
    territory: string;
    exclusive_territory: boolean;
  };
  address: AddressObject;
  contact: ContactObject;
  capabilities: {
    showroom_area: number;
    display_capacity: number;
    total_staff: number;
    sales_staff: number;
    support_staff: number;
  };
  notes: string;
}

interface Province {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
  province_code: string;
}

interface Ward {
  code: string;
  name: string;
  district_code: string;
}

export const AddDealer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Validation states for unique fields
  const [validationErrors, setValidationErrors] = useState<{
    code?: string;
    tax_code?: string;
    contract_number?: string;
  }>({});

  // Address API states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [street, setStreet] = useState<string>('');

  const [formData, setFormData] = useState<DealerForm>({
    code: '',
    company_name: '',
    business_license: '',
    tax_code: '',
    legal_representative: '',
    dealer_level: '3S',
    product_distribution: 'Ô tô và Xe máy điện',
    contract: {
      contract_number: '',
      signed_date: '',
      expiry_date: '',
      territory: '',
      exclusive_territory: false,
    },
    address: {
      street: '',
      district: '',
      city: '',
      province: '',
      full_address: '',
    },
    contact: {
      phone: '',
      email: '',
      hotline: '',
    },
    capabilities: {
      showroom_area: 0,
      display_capacity: 0,
      total_staff: 0,
      sales_staff: 0,
      support_staff: 0,
    },
    notes: '',
  });

  // Dealer level options
  const dealerLevelOptions = [
    { value: '1S', label: '1S - Bán hàng' },
    { value: '2S', label: '2S - Bán hàng + Dịch vụ' },
    { value: '3S', label: '3S - Bán hàng + Dịch vụ + Phụ tùng' },
  ];

  // Product distribution options
  const productDistributionOptions = [
    { value: 'Ô tô', label: 'Ô tô' },
    { value: 'Xe máy điện', label: 'Xe máy điện' },
    { value: 'Ô tô và Xe máy điện', label: 'Ô tô và Xe máy điện' },
  ];

  // Fetch provinces from Vietnam API
  const fetchProvinces = async () => {
    try {
      const response = await fetch('https://provinces.open-api.vn/api/');
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  // Fetch districts by province
  const fetchDistricts = async (provinceCode: string) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data = await response.json();
      setDistricts(data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Fetch wards by district
  const fetchWards = async (districtCode: string) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await response.json();
      setWards(data.wards || []);
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  // Handle province change
  const handleProvinceChange = (provinceCode: string) => {
    setSelectedProvince(provinceCode);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);
    if (provinceCode) {
      fetchDistricts(provinceCode);
    }
  };

  // Handle district change
  const handleDistrictChange = (districtCode: string) => {
    setSelectedDistrict(districtCode);
    setSelectedWard('');
    setWards([]);
    if (districtCode) {
      fetchWards(districtCode);
    }
  };

  // Update full address when location changes
  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard && street.trim()) {
      const province = provinces.find(p => p.code === selectedProvince);
      const district = districts.find(d => d.code === selectedDistrict);
      const ward = wards.find(w => w.code === selectedWard);
      
      // Use found names or fallback to codes
      const provinceName = province?.name || selectedProvince;
      const districtName = district?.name || selectedDistrict;
      const wardName = ward?.name || selectedWard;
      
      const fullAddress = `${street}, ${wardName}, ${districtName}, ${provinceName}`;
      setFormData(prev => ({
        ...prev,
        address: {
          street: street,
          district: districtName,
          city: districtName,
          province: provinceName,
          full_address: fullAddress,
        }
      }));
    } else {
      // Clear address if any component is missing
      setFormData(prev => ({
        ...prev,
        address: {
          street: '',
          district: '',
          city: '',
          province: '',
          full_address: '',
        }
      }));
    }
  }, [selectedProvince, selectedDistrict, selectedWard, street, provinces, districts, wards]);

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('contract.')) {
      const contractField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contract: {
          ...prev.contract,
          [contractField]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }
      }));
      
      // Validate contract_number if it's being changed
      if (contractField === 'contract_number') {
        debouncedValidate('contract_number', value);
      }
    } else if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [contactField]: value,
        }
      }));
    } else if (name.startsWith('capabilities.')) {
      const capabilityField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        capabilities: {
          ...prev.capabilities,
          [capabilityField]: Number(value),
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Validate unique fields
      if (name === 'code') {
        debouncedValidate('code', value);
      } else if (name === 'tax_code') {
        debouncedValidate('tax_code', value);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Check for validation errors
    const hasValidationErrors = Object.values(validationErrors).some(error => error);
    if (hasValidationErrors) {
      setError('Vui lòng sửa các lỗi validation trước khi gửi form.');
      setLoading(false);
      return;
    }

    // Additional form validation
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setError(`Vui lòng sửa các lỗi sau:\n${formErrors.join('\n')}`);
      setLoading(false);
      return;
    }

    try {
      // Ensure address is properly set before submission
      if (!selectedProvince || !selectedDistrict || !selectedWard || !street.trim()) {
        setError('Vui lòng chọn đầy đủ thông tin địa chỉ.');
        setLoading(false);
        return;
      }

      const province = provinces.find(p => p.code === selectedProvince);
      const district = districts.find(d => d.code === selectedDistrict);
      const ward = wards.find(w => w.code === selectedWard);
      
      // If we can't find the components, try to get them from the dropdown values
      const provinceName = province?.name || selectedProvince;
      const districtName = district?.name || selectedDistrict;
      const wardName = ward?.name || selectedWard;

      const fullAddress = `${street}, ${wardName}, ${districtName}, ${provinceName}`;

      // Set default services based on dealer level
      const defaultServices = {
        vehicle_sales: true,
        test_drive: formData.dealer_level !== '1S',
        spare_parts_sales: formData.dealer_level === '3S',
      };

      const payload = {
        ...formData,
        address: {
          street: street,
          district: districtName,
          city: districtName,
          province: provinceName,
          full_address: fullAddress,
        },
        capabilities: {
          ...formData.capabilities,
          services: defaultServices,
        },
      };

      console.log('Address debug info:', {
        selectedProvince,
        selectedDistrict, 
        selectedWard,
        street,
        province,
        district,
        ward,
        provinceName,
        districtName,
        wardName
      });
      console.log('Submitting payload:', payload); // Debug log
      const res = await post<{ success: boolean; message: string }>('/api/dealerships', payload);
      
      if (res.success) {
        setSuccess('Đại lý đã được đăng ký thành công!');
        setTimeout(() => {
          navigate('/admin/dealer-management');
        }, 2000);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tạo đại lý. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side validation for unique fields
  const validateUniqueField = (field: 'code' | 'tax_code' | 'contract_number', value: string) => {
    if (!value.trim()) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
      return;
    }

    // Basic format validation
    let isValid = true;
    let errorMessage = '';

    switch (field) {
      case 'code':
        // Mã đại lý format: VF_{CITY}_{LEVEL}_{NUMBER}
        const codePattern = /^VF_[A-Z]{2}_[123]S_\d{3}$/;
        if (!codePattern.test(value)) {
          isValid = false;
          errorMessage = 'Mã đại lý phải có định dạng: VF_{THÀNH_PHỐ}_{CẤP}_{SỐ} (VD: VF_HN_3S_013)';
        }
        break;
      
      case 'tax_code':
        // Mã số thuế format: 10 digits + optional suffix
        const taxPattern = /^\d{10}(-\d{3})?$/;
        if (!taxPattern.test(value)) {
          isValid = false;
          errorMessage = 'Mã số thuế phải có 10 chữ số, có thể có thêm 3 chữ số sau dấu gạch ngang (VD: 0108888999-013)';
        }
        break;
      
      case 'contract_number':
        // Số hợp đồng format: HD_VF_{NUMBER}_{YEAR}
        const contractPattern = /^HD_VF_\d{3}_\d{4}$/;
        if (!contractPattern.test(value)) {
          isValid = false;
          errorMessage = 'Số hợp đồng phải có định dạng: HD_VF_{SỐ}_{NĂM} (VD: HD_VF_013_2024)';
        }
        break;
    }

    if (!isValid) {
      setValidationErrors(prev => ({ ...prev, [field]: errorMessage }));
    } else {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Additional validation for form submission
  const validateForm = () => {
    const errors: string[] = [];

    // Check required fields
    if (!formData.code.trim()) errors.push('Mã đại lý là bắt buộc');
    if (!formData.company_name.trim()) errors.push('Tên đại lý là bắt buộc');
    if (!formData.business_license.trim()) errors.push('Giấy phép kinh doanh là bắt buộc');
    if (!formData.tax_code.trim()) errors.push('Mã số thuế là bắt buộc');
    if (!formData.legal_representative.trim()) errors.push('Đại diện pháp lý là bắt buộc');
    if (!formData.contact.phone.trim()) errors.push('Số điện thoại là bắt buộc');
    if (!formData.contact.email.trim()) errors.push('Email là bắt buộc');
    if (!formData.contract.contract_number.trim()) errors.push('Số hợp đồng là bắt buộc');
    if (!formData.contract.territory.trim()) errors.push('Khu vực kinh doanh là bắt buộc');
    if (!formData.contract.signed_date) errors.push('Ngày ký hợp đồng là bắt buộc');
    if (!formData.contract.expiry_date) errors.push('Ngày hết hạn hợp đồng là bắt buộc');
    if (!selectedProvince) errors.push('Tỉnh/Thành phố là bắt buộc');
    if (!selectedDistrict) errors.push('Quận/Huyện là bắt buộc');
    if (!selectedWard) errors.push('Phường/Xã là bắt buộc');
    if (!street.trim()) errors.push('Số nhà/Đường là bắt buộc');
    
    // Address validation is not needed here since dropdowns ensure valid selections
    if (formData.capabilities.showroom_area <= 0) errors.push('Diện tích showroom phải lớn hơn 0');
    if (formData.capabilities.display_capacity <= 0) errors.push('Sức chứa trưng bày phải lớn hơn 0');
    if (formData.capabilities.total_staff <= 0) errors.push('Tổng nhân viên phải lớn hơn 0');
    if (formData.capabilities.sales_staff <= 0) errors.push('Nhân viên bán hàng phải lớn hơn 0');

    // Check date logic
    if (formData.contract.signed_date && formData.contract.expiry_date) {
      const signedDate = new Date(formData.contract.signed_date);
      const expiryDate = new Date(formData.contract.expiry_date);
      if (expiryDate <= signedDate) {
        errors.push('Ngày hết hạn hợp đồng phải sau ngày ký hợp đồng');
      }
    }

    // Check staff logic
    if (formData.capabilities.sales_staff > formData.capabilities.total_staff) {
      errors.push('Số nhân viên bán hàng không được vượt quá tổng số nhân viên');
    }

    if (formData.capabilities.support_staff > formData.capabilities.total_staff) {
      errors.push('Số nhân viên hỗ trợ không được vượt quá tổng số nhân viên');
    }

    if (formData.capabilities.sales_staff + formData.capabilities.support_staff > formData.capabilities.total_staff) {
      errors.push('Tổng số nhân viên bán hàng và hỗ trợ không được vượt quá tổng số nhân viên');
    }

    return errors;
  };

  // Debounced validation
  const debouncedValidate = (() => {
    let timeouts: { [key: string]: NodeJS.Timeout } = {};
    
    return (field: 'code' | 'tax_code' | 'contract_number', value: string) => {
      if (timeouts[field]) {
        clearTimeout(timeouts[field]);
      }
      
      timeouts[field] = setTimeout(() => {
        validateUniqueField(field, value);
      }, 300); // 300ms delay for client-side validation
    };
  })();

  // Load provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Thêm đại lý mới</h1>
          <button
            onClick={() => navigate('/admin/dealer-management')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>

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

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đại lý *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="VD: VF_HN_3S_013"
                    className={`border p-2 rounded-lg w-full ${
                      validationErrors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Format: VF_{'{THÀNH_PHỐ}'}_{'{CẤP}'}_{'{SỐ}'} (VD: VF_HN_3S_013)</p>
                {validationErrors.code && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đại lý *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="VD: Showroom VinFast Cầu Giấy"
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giấy phép kinh doanh *</label>
                <input
                  type="text"
                  name="business_license"
                  value={formData.business_license}
                  onChange={handleChange}
                  placeholder="VD: 0108888999"
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="tax_code"
                    value={formData.tax_code}
                    onChange={handleChange}
                    placeholder="VD: 0108888999-013"
                    className={`border p-2 rounded-lg w-full ${
                      validationErrors.tax_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">10 chữ số, có thể có thêm 3 chữ số sau dấu gạch ngang (VD: 0108888999-013)</p>
                {validationErrors.tax_code && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.tax_code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đại diện pháp lý *</label>
                <input
                  type="text"
                  name="legal_representative"
                  value={formData.legal_representative}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Văn Minh"
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ đại lý *</label>
                <select
                  name="dealer_level"
                  value={formData.dealer_level}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full"
                  required
                >
                  {dealerLevelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phân phối sản phẩm *</label>
                <select
                  name="product_distribution"
                  value={formData.product_distribution}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full"
                  required
                >
                  {productDistributionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thông tin liên hệ */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Thông tin liên hệ</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  placeholder="VD: 024-3333-9999"
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  placeholder="VD: caugiay@vinfast.vn"
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
                <input
                  type="tel"
                  name="contact.hotline"
                  value={formData.contact.hotline}
                  onChange={handleChange}
                  placeholder="VD: 1900-3333"
                  className="border p-2 rounded-lg w-full"
                />
              </div>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Địa chỉ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="border p-2 rounded-lg w-full"
                  required
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map(province => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện *</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="border p-2 rounded-lg w-full"
                  required
                  disabled={!selectedProvince}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map(district => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã *</label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="border p-2 rounded-lg w-full"
                  required
                  disabled={!selectedDistrict}
                >
                  <option value="">Chọn phường/xã</option>
                  {wards.map(ward => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số nhà/Đường *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="VD: 456 Phố Xuân Thủy"
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>
            </div>
          </div>

          {/* Thông tin hợp đồng */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Thông tin hợp đồng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số hợp đồng *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="contract.contract_number"
                    value={formData.contract.contract_number}
                    onChange={handleChange}
                    placeholder="VD: HD_VF_013_2024"
                    className={`border p-2 rounded-lg w-full ${
                      validationErrors.contract_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Format: HD_VF_{'{SỐ}'}_{'{NĂM}'} (VD: HD_VF_013_2024)</p>
                {validationErrors.contract_number && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.contract_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực kinh doanh *</label>
                <input
                  type="text"
                  name="contract.territory"
                  value={formData.contract.territory}
                  onChange={handleChange}
                  placeholder="VD: Hà Nội - Quận Cầu Giấy và lân cận"
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ký hợp đồng *</label>
                <input
                  type="date"
                  name="contract.signed_date"
                  value={formData.contract.signed_date}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn *</label>
                <input
                  type="date"
                  name="contract.expiry_date"
                  value={formData.contract.expiry_date}
                  onChange={handleChange}
                  className="border p-2 rounded-lg w-full"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="contract.exclusive_territory"
                  checked={formData.contract.exclusive_territory}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Khu vực độc quyền</label>
              </div>
            </div>
          </div>

          {/* Năng lực */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Năng lực</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích showroom (m²) *</label>
                <input
                  type="number"
                  name="capabilities.showroom_area"
                  value={formData.capabilities.showroom_area}
                  onChange={handleChange}
                  placeholder="VD: 400"
                  className="border p-2 rounded-lg w-full"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa trưng bày *</label>
                <input
                  type="number"
                  name="capabilities.display_capacity"
                  value={formData.capabilities.display_capacity}
                  onChange={handleChange}
                  placeholder="VD: 12"
                  className="border p-2 rounded-lg w-full"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng nhân viên *</label>
                <input
                  type="number"
                  name="capabilities.total_staff"
                  value={formData.capabilities.total_staff}
                  onChange={handleChange}
                  placeholder="VD: 18"
                  className="border p-2 rounded-lg w-full"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên bán hàng *</label>
                <input
                  type="number"
                  name="capabilities.sales_staff"
                  value={formData.capabilities.sales_staff}
                  onChange={handleChange}
                  placeholder="VD: 12"
                  className="border p-2 rounded-lg w-full"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên hỗ trợ</label>
                <input
                  type="number"
                  name="capabilities.support_staff"
                  value={formData.capabilities.support_staff}
                  onChange={handleChange}
                  placeholder="VD: 6"
                  className="border p-2 rounded-lg w-full"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ghi chú thêm về đại lý..."
              className="border p-2 rounded-lg w-full"
              rows={3}
            />
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/dealer-management')}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo đại lý'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
