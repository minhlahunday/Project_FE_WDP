import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Divider,
  Typography,
  Row,
  Col,
  Card,
  message,
  Tag,
  Spin,
  ConfigProvider
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { authService } from '../../services/authService';
import { promotionService, Promotion } from '../../services/promotionService';
import { optionService, VehicleOption } from '../../services/optionService';
import { accessoryService, Accessory } from '../../services/accessoryService';

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
  const [form] = Form.useForm<QuoteFormValues>();
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [optionCatalog, setOptionCatalog] = useState<VehicleOption[]>([]);
  const [accessoryCatalog, setAccessoryCatalog] = useState<Accessory[]>([]);
  const [discountSelection, setDiscountSelection] = useState<string | undefined>();
  const modalRef = React.useRef<HTMLDivElement>(null);

  const quantityValue = Form.useWatch('quantity', form) ?? 1;
  const discountValue = Form.useWatch('discount', form) ?? 0;
  const optionsValue = Form.useWatch('options', form) ?? [];
  const accessoriesValue = Form.useWatch('accessories', form) ?? [];

  const totalAmount = useMemo(() => {
    const total = (vehiclePrice || 0) * quantityValue - discountValue;
    return total > 0 ? total : 0;
  }, [vehiclePrice, quantityValue, discountValue]);

  const colorSelectOptions = useMemo(() => {
    const mapped = (colorOptions || []).map((color) => ({ label: color, value: color }));
    console.log('🎨 Color options received:', colorOptions);
    console.log('🎨 Mapped color select options:', mapped);
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

  const loadReferenceData = useCallback(async () => {
    try {
      setReferenceLoading(true);
      console.log('🔄 Loading reference data for quotation...');
      
      const [promotionResult, optionResult, accessoryResult] = await Promise.allSettled([
        promotionService.getPromotions(),
        optionService.getOptions(),
        accessoryService.getAccessories()
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

      // Show warning if any failed
      const failedCount = [
        promotionResult.status !== 'fulfilled',
        optionResult.status !== 'fulfilled',
        accessoryResult.status !== 'fulfilled'
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
        message.success('Tạo báo giá thành công');
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

  // Render dropdowns to document.body - Ant Design will handle positioning automatically
  const getPopupContainer = useCallback(() => {
    return document.body;
  }, []);

  return (
    <ConfigProvider
      getPopupContainer={getPopupContainer}
    >
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={920}
      centered
      destroyOnClose
      getContainer={false}
      styles={{
        body: { overflow: 'visible', maxHeight: 'none' }
      }}
      title={
        <Space align="center" size="middle">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileTextOutlined style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Tạo báo giá
            </Title>
            <Text type="secondary">Tạo báo giá nhanh cho khách hàng</Text>
          </div>
        </Space>
      }
    >
      <Form<QuoteFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}
      >
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff'
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Xe được chọn</Text>
              <Title level={3} style={{ marginTop: 8, color: '#fff' }}>
                {vehicleName || 'Xe chưa xác định'}
              </Title>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Giá niêm yết</Text>
              <Title level={3} style={{ marginTop: 8, color: '#fff' }}>
                {formatCurrency(vehiclePrice || 0)}
              </Title>
            </Col>
          </Row>
        </Card>

        <Divider orientation="left">Thông tin khách hàng</Divider>

        <Form.Item
          label="ID Khách hàng (Tùy chọn)"
          name="customer_id"
          tooltip="Nhập ID khách hàng nếu đã có trong hệ thống"
        >
          <Input placeholder="Nhập ID khách hàng" allowClear />
        </Form.Item>

        <Divider orientation="left">Chi tiết sản phẩm</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Số lượng"
              name="quantity"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Màu sắc" name="color">
              <Select
                placeholder={colorSelectOptions.length > 0 ? `Chọn màu sắc (${colorSelectOptions.length} mục)` : 'Chọn màu sắc'}
                allowClear
                showSearch
                optionFilterProp="children"
                getPopupContainer={getPopupContainer}
                onOpenChange={(open) => {
                  if (open) {
                    console.log('🎨 Color dropdown opening, options:', colorSelectOptions.length);
                    console.log('🎨 Color options available:', colorSelectOptions);
                  }
                }}
                notFoundContent={colorSelectOptions.length === 0 ? 'Không có màu sắc' : 'Không tìm thấy'}
              >
                {colorSelectOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="discount" hidden>
          <InputNumber />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Giảm giá (VNĐ)" name="discountSelection">
              <Select
                allowClear
                placeholder={discountSelectOptions.length > 0 ? `Chọn giảm giá (${discountSelectOptions.length} mục)` : 'Chọn giảm giá'}
                value={discountSelection}
                onChange={handleDiscountChange}
                showSearch
                optionFilterProp="children"
                loading={referenceLoading && promotions.length === 0}
                getPopupContainer={getPopupContainer}
                notFoundContent={referenceLoading ? <Spin size="small" /> : discountSelectOptions.length === 0 ? 'Không có dữ liệu giảm giá' : 'Không tìm thấy'}
              >
                {discountSelectOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Khuyến mãi" name="promotion_id">
              <Select
                allowClear
                placeholder={promotionSelectOptions.length > 0 ? `Chọn khuyến mãi (${promotionSelectOptions.length} mục)` : 'Chọn khuyến mãi'}
                showSearch
                optionFilterProp="children"
                loading={referenceLoading}
                getPopupContainer={getPopupContainer}
                onOpenChange={(open) => {
                  if (open) {
                    console.log('🔍 Promotion dropdown opening, options:', promotionSelectOptions.length);
                  }
                }}
                notFoundContent={referenceLoading ? <Spin size="small" /> : promotionSelectOptions.length === 0 ? 'Không có dữ liệu khuyến mãi' : 'Không tìm thấy'}
              >
                {promotionSelectOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">
          <Space>
            Tùy chọn bổ sung
            <Tag color="blue">{optionsValue.length}</Tag>
          </Space>
        </Divider>

        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                  <Col flex="auto">
                    <Form.Item
                      {...restField}
                      name={[name, 'option_id']}
                      rules={[{ required: false }]}
                    >
                      <Select
                        placeholder={vehicleOptionSelectOptions.length > 0 ? `Chọn tùy chọn bổ sung (${vehicleOptionSelectOptions.length} mục)` : 'Chọn tùy chọn bổ sung'}
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        loading={referenceLoading}
                        getPopupContainer={getPopupContainer}
                        onOpenChange={(open) => {
                          if (open) {
                            console.log('🔍 Option dropdown opening, options:', vehicleOptionSelectOptions.length);
                          }
                        }}
                        notFoundContent={referenceLoading ? <Spin size="small" /> : vehicleOptionSelectOptions.length === 0 ? 'Không có dữ liệu tùy chọn' : 'Không tìm thấy'}
                      >
                        {vehicleOptionSelectOptions.map((option) => (
                          <Select.Option key={option.value} value={option.value}>
                            {option.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col>
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ option_id: undefined })}
                block
                style={{ marginBottom: 16 }}
              >
                Thêm tùy chọn
              </Button>
            </>
          )}
        </Form.List>

        <Divider orientation="left">
          <Space>
            Phụ kiện
            <Tag color="green">{accessoriesValue.length}</Tag>
          </Space>
        </Divider>

        <Form.List name="accessories">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                  <Col xs={24} sm={14}>
                    <Form.Item
                      {...restField}
                      name={[name, 'accessory_id']}
                      rules={[{ required: false }]}
                    >
                      <Select
                        placeholder={accessorySelectOptions.length > 0 ? `Chọn phụ kiện (${accessorySelectOptions.length} mục)` : 'Chọn phụ kiện'}
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        loading={referenceLoading}
                        getPopupContainer={getPopupContainer}
                        onOpenChange={(open) => {
                          if (open) {
                            console.log('🔍 Accessory dropdown opening, options:', accessorySelectOptions.length);
                          }
                        }}
                        notFoundContent={referenceLoading ? <Spin size="small" /> : accessorySelectOptions.length === 0 ? 'Không có dữ liệu phụ kiện' : 'Không tìm thấy'}
                      >
                        {accessorySelectOptions.map((option) => (
                          <Select.Option key={option.value} value={option.value}>
                            {option.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      initialValue={1}
                      rules={[{ type: 'number', min: 1, message: 'Ít nhất 1 phụ kiện' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={4}>
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ accessory_id: undefined, quantity: 1 })}
                block
                style={{ marginBottom: 16 }}
              >
                Thêm phụ kiện
              </Button>
            </>
          )}
        </Form.List>

        <Divider orientation="left">Ghi chú</Divider>

        <Form.Item name="notes">
          <TextArea rows={4} placeholder="Nhập ghi chú cho báo giá (ví dụ: hiệu lực 7 ngày, gồm 2 phụ kiện...)" />
        </Form.Item>

        <Card
          style={{
            borderRadius: 16,
            marginTop: 8,
            marginBottom: 24,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#fff'
          }}
        >
          <Row>
            <Col span={12}>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Số lượng</Text>
              <Title level={4} style={{ marginTop: 4, color: '#fff' }}>
                {quantityValue}
              </Title>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Giảm giá</Text>
              <Title level={4} style={{ marginTop: 4, color: '#fff' }}>
                {formatCurrency(discountValue)}
              </Title>
            </Col>
          </Row>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <Row>
            <Col span={24} style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>Tổng giá trị báo giá</Text>
              <Title level={2} style={{ marginTop: 8, color: '#fff' }}>
                {formatCurrency(totalAmount)}
              </Title>
            </Col>
          </Row>
        </Card>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<FileTextOutlined />}>
              Tạo báo giá
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
    </ConfigProvider>
  );
};

