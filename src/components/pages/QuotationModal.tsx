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
  options: Array<{ option_id?: string }>;
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
      return sum + (optionData?.price || 0);
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

      // Handle promotions
      if (promotionResult.status === 'fulfilled') {
        const promotionsData = promotionResult.value ?? [];
        console.log('✅ Promotions loaded:', promotionsData.length, promotionsData);
        setPromotions(promotionsData);
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
      options: [{ option_id: undefined }],
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
        .map((option) => (option?.option_id ? { option_id: option.option_id } : null))
        .filter((option): option is { option_id: string } => Boolean(option?.option_id));

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
      width={1400}
      centered
      destroyOnClose={false}
      styles={{
        body: { 
          maxHeight: '85vh', 
          overflowY: 'auto',
          padding: '40px 50px'
        }
      }}
      title={
        <Space align="center" size="middle">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <FileTextOutlined style={{ color: '#fff', fontSize: 26 }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, fontSize: 22 }}>
              Tạo báo giá
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>Tạo báo giá nhanh cho khách hàng</Text>
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
            marginBottom: 32,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
            padding: '20px 28px',
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

        <Divider orientation="left" style={{ fontSize: 18, fontWeight: 600, marginTop: 24, marginBottom: 24 }}>
          Thông tin khách hàng
        </Divider>

        <Form.Item
          label={<span style={{ fontSize: 16, fontWeight: 500 }}>Khách hàng</span>}
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

        <Divider orientation="left" style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 24 }}>
          Chi tiết sản phẩm
        </Divider>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label={<span style={{ fontSize: 16, fontWeight: 500 }}>Số lượng</span>}
              name="quantity"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber min={1} style={{ width: '100%', fontSize: 16 }} size="large" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={<span style={{ fontSize: 16, fontWeight: 500 }}>Màu sắc</span>} name="color">
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
            <Form.Item label={<span style={{ fontSize: 16, fontWeight: 500 }}>Giảm giá (VNĐ)</span>} name="discountSelection">
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
            <Form.Item label={<span style={{ fontSize: 16, fontWeight: 500 }}>Khuyến mãi</span>} name="promotion_id">
              <CustomSelect
                options={promotionSelectOptions}
                placeholder="Chọn khuyến mãi"
                loading={referenceLoading}
                allowClear
                showSearch
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 24 }}>
          <Space size="middle">
            Tùy chọn bổ sung
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>{optionsValue.length}</Tag>
          </Space>
        </Divider>

        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={16} align="middle" style={{ marginBottom: 16 }}>
                  <Col flex="auto">
                    <Form.Item
                      {...restField}
                      name={[name, 'option_id']}
                      rules={[{ required: false }]}
                    >
                      <CustomSelect
                        options={vehicleOptionSelectOptions}
                        placeholder="Chọn tùy chọn bổ sung"
                        loading={referenceLoading}
                        allowClear
                        showSearch
                      />
                    </Form.Item>
                  </Col>
                  <Col>
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                      size="large"
                      style={{ height: 48 }}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ option_id: undefined })}
                block
                size="large"
                style={{ marginBottom: 24, height: 48, fontSize: 15 }}
              >
                Thêm tùy chọn
              </Button>
            </>
          )}
        </Form.List>

        <Divider orientation="left" style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 24 }}>
          <Space size="middle">
            Phụ kiện
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>{accessoriesValue.length}</Tag>
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
                      <InputNumber min={1} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                      size="large"
                      style={{ height: 48 }}
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
                style={{ marginBottom: 24, height: 48, fontSize: 15 }}
              >
                Thêm phụ kiện
              </Button>
            </>
          )}
        </Form.List>

        <Divider orientation="left" style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 24 }}>
          Ghi chú
        </Divider>

        <Form.Item name="notes">
          <TextArea 
            rows={4} 
            placeholder="Nhập ghi chú cho báo giá (ví dụ: hiệu lực 7 ngày, gồm 2 phụ kiện...)" 
            style={{ fontSize: 15 }}
            size="large"
          />
        </Form.Item>

        <Card
          style={{
            borderRadius: 24,
            marginTop: 40,
            marginBottom: 40,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#fff',
            boxShadow: '0 12px 32px rgba(240, 147, 251, 0.4)',
            padding: '24px 32px',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Xe × SL
              </Text>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px' }}>
                {formatCurrency((vehiclePrice || 0) * quantityValue)}
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Tùy chọn
              </Text>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px' }}>
                +{formatCurrency(
                  (optionsValue || []).reduce((sum, option) => {
                    if (!option?.option_id) return sum;
                    const optionData = optionCatalog.find(o => normalizeOptionId(o) === option.option_id);
                    return sum + (optionData?.price || 0);
                  }, 0)
                )}
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Phụ kiện
              </Text>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px' }}>
                +{formatCurrency(
                  (accessoriesValue || []).reduce((sum, accessory) => {
                    if (!accessory?.accessory_id) return sum;
                    const accessoryData = accessoryCatalog.find(a => normalizeAccessoryId(a) === accessory.accessory_id);
                    const quantity = accessory.quantity || 1;
                    return sum + ((accessoryData?.price || 0) * quantity);
                  }, 0)
                )}
              </div>
            </div>
          </div>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.35)', margin: '20px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '32px' }}>
            {/* <div style={{ flex: '0 0 auto' }}>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 14, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Giảm giá
              </Text>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                -{formatCurrency(discountValue)}
              </div>
            </div> */}
            <div style={{ flex: '1 1 auto', textAlign: 'right', minWidth: 0 }}>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 14, display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Tổng thanh toán
              </Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </Card>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} size="large">
            <Button onClick={handleClose} size="large" style={{ fontSize: 15, height: 48, minWidth: 120 }}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting} 
              icon={<FilePdfOutlined />}
              size="large"
              style={{ fontSize: 15, height: 48, minWidth: 180 }}
            >
              Tạo báo giá & PDF
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

