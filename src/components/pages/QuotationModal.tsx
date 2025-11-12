import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Divider,
  Typography,
  Row,
  Col,
  Card,
  message,
  Tag
} from 'antd';
import CustomSelect from '../common/CustomSelect';
import {
  FileTextOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { authService } from '../../services/authService';
import { promotionService, Promotion } from '../../services/promotionService';
import { optionService, VehicleOption } from '../../services/optionService';
import { accessoryService, Accessory } from '../../services/accessoryService';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types';
import { generateQuotePDF, QuotePDFData } from '../../utils/pdfUtils';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface QuotationModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName?: string;
  vehiclePrice?: number;
  colorOptions?: string[];
}

interface QuoteFormValues {
  customer_id?: string;
  quantity: number;
  color?: string;
  discount?: number;
  discountSelection?: string;
  promotion_id?: string;
  notes?: string;
  options: Array<{ option_id?: string; quantity?: number }>;
  accessories: Array<{ accessory_id?: string; quantity?: number }>;
}

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);

const normalizePromotionId = (
  promotion: Promotion | (Promotion & { id?: string; code?: string; promotion_id?: string }) | Record<string, unknown>
): string => {
  const promoObj = promotion as Record<string, unknown>;
  const id = promoObj._id || promoObj.id || promoObj.promotion_id || promoObj.code;
  if (id) {
    return String(id);
  }

  const name = promoObj.name ? String(promoObj.name) : 'promotion';
  const value = promoObj.value ?? promoObj.amount ?? promoObj.discount_value ?? '';
  return `${name}-${value}-${Math.random().toString(36).slice(2, 8)}`;
};

const getPromotionValue = (
  promotion: Promotion | (Promotion & { amount?: number; discount_value?: number; value?: number }) | Record<string, unknown>
): number => {
  const promoObj = promotion as Record<string, unknown>;
  const raw = promoObj.value ?? promoObj.amount ?? promoObj.discount_value;

  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const normalizeOptionId = (option: VehicleOption | (VehicleOption & { id?: string }) | Record<string, unknown>): string => {
  const optionObj = option as Record<string, unknown>;
  const id = optionObj._id || optionObj.id || optionObj.option_id;
  if (id) {
    return String(id);
  }
  return `option-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeAccessoryId = (
  accessory: Accessory | (Accessory & { id?: string }) | Record<string, unknown>
): string => {
  const accessoryObj = accessory as Record<string, unknown>;
  const id = accessoryObj._id || accessoryObj.id || accessoryObj.accessory_id;
  if (id) {
    return String(id);
  }
  return `accessory-${Math.random().toString(36).slice(2, 8)}`;
};

const buildDiscountSelectionValue = (promotion: Promotion) =>
  `${normalizePromotionId(promotion)}|${getPromotionValue(promotion)}`;

const parseDiscountSelection = (selection?: string | null) => {
  if (!selection) {
    return {
      promotionId: undefined as string | undefined,
      amount: 0
    };
  }

  const [promotionIdRaw, amountRaw] = selection.split('|');
  const amountNumber = Number(amountRaw);

  return {
    promotionId: promotionIdRaw || undefined,
    amount: Number.isFinite(amountNumber) ? amountNumber : 0
  };
};

export const QuotationModal: React.FC<QuotationModalProps> = ({
  visible,
  onClose,
  vehicleId,
  vehicleName,
  vehiclePrice,
  colorOptions = []
}) => {
  // Debug render
  console.log('🔍 QuotationModal render - visible:', visible, 'vehicleId:', vehicleId);
  if (visible) {
    console.log('🟣 QuotationModal visible = true');
  }
  const [form] = Form.useForm<QuoteFormValues>();
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [optionCatalog, setOptionCatalog] = useState<VehicleOption[]>([]);
  const [accessoryCatalog, setAccessoryCatalog] = useState<Accessory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discountSelection, setDiscountSelection] = useState<string | undefined>();

  const quantityValue = Form.useWatch('quantity', form) ?? 1;
  const discountValue = Form.useWatch('discount', form) ?? 0;
  const optionsValue = Form.useWatch('options', form) ?? [];
  const accessoriesValue = Form.useWatch('accessories', form) ?? [];

  const totalAmount = useMemo(() => {
    // Giá xe
    const vehicleTotal = (vehiclePrice || 0) * quantityValue;
    
    // Tính tổng giá tùy chọn
    const optionsTotal = (optionsValue || []).reduce((sum, option) => {
      if (!option?.option_id) return sum;
      const optionData = optionCatalog.find(o => normalizeOptionId(o) === option.option_id);
      const quantity = option.quantity || 1;
      return sum + ((optionData?.price || 0) * quantity);
    }, 0);
    
    // Tính tổng giá phụ kiện
    const accessoriesTotal = (accessoriesValue || []).reduce((sum, accessory) => {
      if (!accessory?.accessory_id) return sum;
      const accessoryData = accessoryCatalog.find(a => normalizeAccessoryId(a) === accessory.accessory_id);
      const quantity = accessory.quantity || 1;
      return sum + ((accessoryData?.price || 0) * quantity);
    }, 0);
    
    const total = vehicleTotal + optionsTotal + accessoriesTotal - discountValue;
    return total > 0 ? total : 0;
  }, [vehiclePrice, quantityValue, discountValue, optionsValue, accessoriesValue, optionCatalog, accessoryCatalog]);

  const colorSelectOptions = useMemo(() => {
    const mapped = (colorOptions || []).map((color) => ({ label: color, value: color }));
    console.log('🎨 Color options received:', colorOptions);
    console.log('🎨 Mapped color select options:', mapped);
    console.log('🎨 First color option:', mapped[0]);
    console.log('🎨 Is array?', Array.isArray(mapped));
    console.log('🎨 Length:', mapped.length);
    return mapped;
  }, [colorOptions]);

  const promotionSelectOptions = useMemo(() => {
    const mapped = promotions.map((promotion) => {
      const id = normalizePromotionId(promotion);
      const name = promotion.name || `Promotion ${id.substring(0, 8)}`;
      const value = getPromotionValue(promotion);
      return {
        value: String(id),
        label: value > 0 ? `${name} - ${formatCurrency(value)}` : name
      };
    });
    console.log('📋 Mapped promotion select options:', mapped);
    return mapped;
  }, [promotions]);

  const discountSelectOptions = useMemo(
    () =>
      promotions
        .filter((promotion) => getPromotionValue(promotion) > 0)
        .map((promotion) => ({
          value: buildDiscountSelectionValue(promotion),
          label: `${promotion.name ?? normalizePromotionId(promotion)} - ${formatCurrency(
            getPromotionValue(promotion)
          )}`
        })),
    [promotions]
  );

  const vehicleOptionSelectOptions = useMemo(() => {
    const mapped = optionCatalog.map((option) => {
      const id = normalizeOptionId(option);
      const name = option.name || `Option ${id.substring(0, 8)}`;
      const price = option.price || 0;
      return {
        value: String(id),
        label: price > 0 ? `${name} - ${formatCurrency(price)}` : name
      };
    });
    console.log('📋 Mapped option select options:', mapped);
    return mapped;
  }, [optionCatalog]);

  const accessorySelectOptions = useMemo(() => {
    const mapped = accessoryCatalog.map((accessory) => {
      const id = normalizeAccessoryId(accessory);
      const name = accessory.name || `Accessory ${id.substring(0, 8)}`;
      const price = accessory.price || 0;
      return {
        value: String(id),
        label: price > 0 ? `${name} - ${formatCurrency(price)}` : name
      };
    });
    console.log('📋 Mapped accessory select options:', mapped);
    return mapped;
  }, [accessoryCatalog]);

  const customerSelectOptions = useMemo(() => {
    const mapped = customers.map((customer) => ({
      value: customer.id || '',
      label: `${customer.name} - ${customer.phone || 'N/A'}`
    }));
    console.log('📋 Mapped customer select options:', mapped);
    return mapped;
  }, [customers]);

  

  const loadReferenceData = useCallback(async () => {
    try {
      setReferenceLoading(true);
      console.log('🔄 Loading reference data for quotation...');
      
      const [promotionResult, optionResult, accessoryResult, customerResult] = await Promise.allSettled([
        promotionService.getPromotions(),
        optionService.getOptions(),
        accessoryService.getAccessories(),
        customerService.getAllCustomers()
      ]);

      // Handle promotions - Filter only active and ongoing promotions
      if (promotionResult.status === 'fulfilled') {
        const promotionsData = promotionResult.value ?? [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Filter: is_active === true, is_deleted === false, and current date is within start_date and end_date
        const activePromotions = promotionsData.filter((promotion) => {
          const promo = promotion as Promotion;
          
          // Check is_active and is_deleted
          if (promo.is_deleted === true || promo.is_active === false) {
            return false;
          }
          
          // Check date range
          if (promo.start_date && promo.end_date) {
            try {
              const startDate = new Date(promo.start_date);
              const endDate = new Date(promo.end_date);
              
              // Set time to start of day for accurate comparison
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              
              // Promotion is active if current date is between start and end date
              return today >= startDate && today <= endDate;
            } catch (error) {
              console.error('❌ Error parsing promotion dates:', error, promo);
              // If date parsing fails, fall back to is_active flag only
              return promo.is_active === true;
            }
          }
          
          // If no date range, only check is_active flag
          return promo.is_active === true;
        });
        
        console.log('✅ Promotions loaded:', promotionsData.length, 'Total promotions');
        console.log('✅ Active promotions:', activePromotions.length, activePromotions);
        setPromotions(activePromotions);
      } else {
        console.error('❌ Promotions failed:', promotionResult.reason);
      }

      // Handle options
      if (optionResult.status === 'fulfilled') {
        const optionsData = optionResult.value ?? [];
        console.log('✅ Options loaded:', optionsData.length, optionsData);
        setOptionCatalog(optionsData);
      } else {
        console.error('❌ Options failed:', optionResult.reason);
      }

      // Handle accessories
      if (accessoryResult.status === 'fulfilled') {
        const accessoriesData = accessoryResult.value ?? [];
        console.log('✅ Accessories loaded:', accessoriesData.length, accessoriesData);
        setAccessoryCatalog(accessoriesData);
      } else {
        console.error('❌ Accessories failed:', accessoryResult.reason);
      }

      // Handle customers
      if (customerResult.status === 'fulfilled') {
        const customersData = customerResult.value ?? [];
        console.log('✅ Customers loaded:', customersData.length, customersData);
        setCustomers(customersData);
      } else {
        console.error('❌ Customers failed:', customerResult.reason);
      }

      // Show warning if any failed
      const failedCount = [
        promotionResult.status !== 'fulfilled',
        optionResult.status !== 'fulfilled',
        accessoryResult.status !== 'fulfilled',
        customerResult.status !== 'fulfilled'
      ].filter(Boolean).length;

      if (failedCount > 0) {
        console.warn(`⚠️ ${failedCount} API(s) failed to load`);
        message.warning(`Không thể tải ${failedCount} loại dữ liệu tham chiếu. Vui lòng thử lại.`);
      } else {
        console.log('✅ All reference data loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error loading reference data for quotation:', error);
      message.error('Không thể tải dữ liệu tham chiếu cho báo giá');
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    form.resetFields();
    setDiscountSelection(undefined);
    onClose();
  }, [form, onClose]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    form.resetFields();
    setDiscountSelection(undefined);
    form.setFieldsValue({
      quantity: 1,
      color: undefined,
      discount: undefined,
      discountSelection: undefined,
      promotion_id: undefined,
      notes: undefined,
      customer_id: undefined,
      options: [{ option_id: undefined, quantity: 1 }],
      accessories: [{ accessory_id: undefined, quantity: 1 }]
    });

    void loadReferenceData();
  }, [visible, form, loadReferenceData]);

  const handleDiscountChange = (value?: string) => {
    setDiscountSelection(value || undefined);
    const { amount, promotionId } = parseDiscountSelection(value);
    form.setFieldValue('discount', amount > 0 ? amount : undefined);

    if (promotionId && !form.getFieldValue('promotion_id')) {
      form.setFieldValue('promotion_id', promotionId);
    }
  };

  const handleSubmit = async (values: QuoteFormValues) => {
    try {
      setSubmitting(true);

      const sanitizedOptions = (values.options || [])
        .map((option) =>
          option?.option_id
            ? {
                option_id: option.option_id,
                quantity: option.quantity && option.quantity > 0 ? option.quantity : 1
              }
            : null
        )
        .filter(
          (option): option is { option_id: string; quantity: number } =>
            Boolean(option?.option_id)
        );

      const sanitizedAccessories = (values.accessories || [])
        .map((accessory) =>
          accessory?.accessory_id
            ? {
                accessory_id: accessory.accessory_id,
                quantity: accessory.quantity && accessory.quantity > 0 ? accessory.quantity : 1
              }
            : null
        )
        .filter(
          (accessory): accessory is { accessory_id: string; quantity: number } =>
            Boolean(accessory?.accessory_id)
        );

      const payload = {
        notes: values.notes?.trim() || undefined,
        customer_id: values.customer_id || undefined,
        items: [
          {
            vehicle_id: vehicleId,
            quantity: values.quantity || 1,
            color: values.color || undefined,
            discount: values.discount || undefined,
            promotion_id: values.promotion_id || undefined,
            options: sanitizedOptions.length > 0 ? sanitizedOptions : undefined,
            accessories: sanitizedAccessories.length > 0 ? sanitizedAccessories : undefined
          }
        ]
      };

      const response = await authService.createQuotation(payload);

      if (response.success) {
        message.success('Tạo báo giá thành công! Đang tạo file PDF...');
        
        // Generate PDF
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = response.data as any;
          
          // Lấy thông tin khách hàng đầy đủ từ danh sách customers
          const selectedCustomer = customers.find(c => c.id === values.customer_id);
          
          const pdfData: QuotePDFData = {
            quoteCode: responseData?.code || `QTE${Date.now()}`,
            customerName: selectedCustomer?.name || values.customer_id || 'Khách hàng',
            customerPhone: selectedCustomer?.phone || 'N/A',
            customerEmail: selectedCustomer?.email || 'N/A',
            customerAddress: selectedCustomer?.address || 'N/A',
            dealershipName: 'VinFast - Đại lý xe điện',
            dealershipAddress: 'Việt Nam',
            items: [{
              vehicleName: vehicleName || 'Xe điện',
              color: values.color,
              quantity: values.quantity || 1,
              unitPrice: vehiclePrice || 0,
              accessories: sanitizedAccessories.map(acc => {
                const accessory = accessoryCatalog.find(a => normalizeAccessoryId(a) === acc.accessory_id);
                return {
                  name: accessory?.name || 'Phụ kiện',
                  quantity: acc.quantity,
                  price: accessory?.price || 0
                };
              }),
              options: sanitizedOptions.map(opt => {
                const option = optionCatalog.find(o => normalizeOptionId(o) === opt.option_id);
                return {
                  name: option?.name || 'Tùy chọn',
                  quantity: opt.quantity || 1,
                  price: option?.price || 0
                };
              }),
              discount: values.discount || 0,
              finalAmount: totalAmount
            }],
            totalAmount: totalAmount,
            notes: values.notes,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          };

          await generateQuotePDF(pdfData);
          message.success('Đã tạo file PDF báo giá thành công!');
        } catch (pdfError) {
          console.error('❌ Error generating PDF:', pdfError);
          message.warning('Báo giá đã tạo nhưng không thể tạo file PDF');
        }
        
        handleClose();
      } else {
        message.error(response.message || 'Không thể tạo báo giá');
      }
    } catch (error) {
      console.error('❌ Error submitting quotation:', error);
      message.error('Không thể tạo báo giá. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={1200}
      centered
      destroyOnClose={false}
      styles={{
        body: { 
          maxHeight: '75vh', 
          overflowY: 'auto',
          padding: '32px 40px'
        }
      }}
      title={
        <Space align="center" size="middle">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <FileTextOutlined style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, fontSize: 20 }}>
              Tạo báo giá
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Tạo báo giá nhanh cho khách hàng</Text>
          </div>
        </Space>
      }
      >
      <Form<QuoteFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
      >
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
            padding: '16px 24px',
            overflow: 'hidden'
          }}
        >
          <Row gutter={20}>
            <Col span={14}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Xe được chọn</Text>
              <Title level={2} style={{ marginTop: 10, marginBottom: 0, color: '#fff', fontSize: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {vehicleName || 'Xe chưa xác định'}
              </Title>
            </Col>
            <Col span={10} style={{ textAlign: 'right' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Giá niêm yết</Text>
              <div style={{ marginTop: 10, color: '#fff', fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {formatCurrency(vehiclePrice || 0)}
              </div>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600, marginTop: 20, marginBottom: 16 }}>
          Thông tin khách hàng
        </Divider>

        <Form.Item
          label={<span style={{ fontSize: 14, fontWeight: 500 }}>Khách hàng</span>}
          name="customer_id"
          tooltip="Chọn khách hàng từ danh sách"
        >
          <CustomSelect
            options={customerSelectOptions}
            placeholder="Chọn khách hàng"
            loading={referenceLoading}
            allowClear
            showSearch
          />
        </Form.Item>

        <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 16 }}>
          Chi tiết sản phẩm
        </Divider>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label={<span style={{ fontSize: 14, fontWeight: 500 }}>Số lượng</span>}
              name="quantity"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber min={1} style={{ width: '100%', fontSize: 14 }} size="large" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={<span style={{ fontSize: 14, fontWeight: 500 }}>Màu sắc</span>} name="color">
              <CustomSelect
                options={colorSelectOptions}
                placeholder="Chọn màu sắc"
                allowClear
                showSearch
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="discount" hidden>
          <InputNumber />
        </Form.Item>

        <Row gutter={24}>
          {/* <Col span={12}>
            <Form.Item label={<span style={{ fontSize: 14, fontWeight: 500 }}>Giảm giá (VNĐ)</span>} name="discountSelection">
              <CustomSelect
                options={discountSelectOptions}
                placeholder="Chọn giảm giá"
                value={discountSelection}
                onChange={handleDiscountChange}
                loading={referenceLoading}
                allowClear
                showSearch
              />
            </Form.Item>
          </Col> */}

          <Col span={12}>
            <Form.Item label={<span style={{ fontSize: 14, fontWeight: 500 }}>Khuyến mãi</span>} name="promotion_id">
              <CustomSelect
                options={promotionSelectOptions}
                placeholder="Chọn khuyến mãi"
                loading={referenceLoading}
                allowClear
                showSearch
                listHeight={256}
                popupMatchSelectWidth={false}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 16 }}>
          <Space size="middle">
            Nội thất xe
            <Tag color="blue" style={{ fontSize: 12, padding: '2px 10px' }}>{optionsValue.length}</Tag>
          </Space>
        </Divider>

        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={16} align="middle" style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={14}>
                    <Form.Item
                      {...restField}
                      name={[name, 'option_id']}
                      rules={[{ required: false }]}
                    >
                      <CustomSelect
                        options={vehicleOptionSelectOptions}
                        placeholder="Chọn nội thất xe"
                        loading={referenceLoading}
                        allowClear
                        showSearch
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      initialValue={1}
                      rules={[{ type: 'number', min: 1, message: 'Ít nhất 1 nội thất' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} size="large" placeholder="Số lượng" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                      size="large"
                      style={{ height: 40 }}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ option_id: undefined, quantity: 1 })}
                block
                size="large"
                style={{ marginBottom: 16, height: 44, fontSize: 14 }}
              >
                Thêm nội thất
              </Button>
            </>
          )}
        </Form.List>

        <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 16 }}>
          <Space size="middle">
            Phụ kiện
            <Tag color="green" style={{ fontSize: 12, padding: '2px 10px' }}>{accessoriesValue.length}</Tag>
          </Space>
        </Divider>

        <Form.List name="accessories">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={16} align="middle" style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={14}>
                    <Form.Item
                      {...restField}
                      name={[name, 'accessory_id']}
                      rules={[{ required: false }]}
                    >
                      <CustomSelect
                        options={accessorySelectOptions}
                        placeholder="Chọn phụ kiện"
                        loading={referenceLoading}
                        allowClear
                        showSearch
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      initialValue={1}
                      rules={[{ type: 'number', min: 1, message: 'Ít nhất 1 phụ kiện' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} size="large" placeholder="Số lượng" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                      size="large"
                      style={{ height: 40 }}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ accessory_id: undefined, quantity: 1 })}
                block
                size="large"
                style={{ marginBottom: 16, height: 44, fontSize: 14 }}
              >
                Thêm phụ kiện
              </Button>
            </>
          )}
        </Form.List>

        <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600, marginTop: 24, marginBottom: 16 }}>
          Ghi chú
        </Divider>

        <Form.Item name="notes">
          <TextArea 
            rows={3} 
            placeholder="Nhập ghi chú cho báo giá (ví dụ: hiệu lực 7 ngày, gồm 2 phụ kiện...)" 
            style={{ fontSize: 14 }}
            size="large"
          />
        </Form.Item>

        {/* Bảng tổng tiền */}
        <Card
          style={{
            borderRadius: 12,
            marginTop: 24,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '2px solid #d9d9d9' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14, color: '#262626' }}>
                  STT
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14, color: '#262626' }}>
                  Tên hàng hóa, dịch vụ
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#262626' }}>
                  Đơn vị tính
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#262626' }}>
                  Số lượng
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, fontSize: 14, color: '#262626' }}>
                  Đơn giá
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, fontSize: 14, color: '#262626' }}>
                  Thành tiền
                  <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, color: '#8c8c8c' }}>
                    (Thành tiền = Số lượng × Đơn giá)
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Xe */}
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#595959' }}>1</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#262626' }}>
                  {vehicleName || 'Xe điện'}
                  {form.getFieldValue('color') && (
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                      (Màu {form.getFieldValue('color')})
                    </Text>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#595959' }}>Chiếc</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#262626', fontWeight: 500 }}>
                  {quantityValue}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#595959' }}>
                  {formatCurrency(vehiclePrice || 0)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#262626', fontWeight: 600 }}>
                  {formatCurrency((vehiclePrice || 0) * quantityValue)}
                </td>
              </tr>

              {/* Nội thất */}
              {(optionsValue || []).filter(opt => opt?.option_id).map((option, index) => {
                const optionData = optionCatalog.find(o => normalizeOptionId(o) === option.option_id);
                const quantity = option.quantity || 1;
                const price = optionData?.price || 0;
                return (
                  <tr key={`option-${index}`} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#595959' }}>{index + 2}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#262626' }}>
                      {optionData?.name || 'Nội thất'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#595959' }}>Bộ</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#262626', fontWeight: 500 }}>
                      {quantity}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#595959' }}>
                      {formatCurrency(price)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#262626', fontWeight: 600 }}>
                      {formatCurrency(price * quantity)}
                    </td>
                  </tr>
                );
              })}

              {/* Phụ kiện */}
              {(accessoriesValue || []).filter(acc => acc?.accessory_id).map((accessory, index) => {
                const accessoryData = accessoryCatalog.find(a => normalizeAccessoryId(a) === accessory.accessory_id);
                const quantity = accessory.quantity || 1;
                const price = accessoryData?.price || 0;
                const rowNum = 2 + (optionsValue || []).filter(opt => opt?.option_id).length + index;
                const isEven = (rowNum - 1) % 2 === 0;
                return (
                  <tr key={`accessory-${index}`} style={{ borderBottom: '1px solid #f0f0f0', background: isEven ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#595959' }}>{rowNum}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#262626' }}>
                      {accessoryData?.name || 'Phụ kiện'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#595959' }}>Cái</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, color: '#262626', fontWeight: 500 }}>
                      {quantity}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#595959' }}>
                      {formatCurrency(price)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#262626', fontWeight: 600 }}>
                      {formatCurrency(price * quantity)}
                    </td>
                  </tr>
                );
              })}

              {/* Dòng tổng cộng */}
              <tr style={{ borderTop: '2px solid #d9d9d9', background: '#fafafa' }}>
                <td colSpan={5} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 15, fontWeight: 700, color: '#262626' }}>
                  Tổng cộng:
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 18, fontWeight: 700, color: '#262626' }}>
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} size="large">
            <Button onClick={handleClose} size="large" style={{ fontSize: 14, height: 44, minWidth: 100 }}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting} 
              icon={<FilePdfOutlined />}
              size="large"
              style={{ fontSize: 14, height: 44, minWidth: 160 }}
            >
              Tạo báo giá & PDF
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

