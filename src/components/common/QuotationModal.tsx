import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, message, Divider, Card, Typography, Tag, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined, FileTextOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { authService } from '../../services/authService';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Map các màu sang mã hex để hiển thị
const colorHexMap: Record<string, string> = {
  // Tiếng Việt
  'đỏ': '#DC2626',
  'xanh dương': '#2563EB',
  'xanh lá': '#059669',
  'vàng': '#EAB308',
  'đen': '#1F2937',
  'trắng': '#F9FAFB',
  'xám': '#6B7280',
  'bạc': '#9CA3AF',
  'cam': '#F97316',
  'hồng': '#EC4899',
  'tím': '#9333EA',
  'nâu': '#92400E',
  'vàng kim': '#F59E0B',
  // Tiếng Anh
  'red': '#DC2626',
  'blue': '#2563EB',
  'green': '#059669',
  'yellow': '#EAB308',
  'black': '#1F2937',
  'white': '#F9FAFB',
  'gray': '#6B7280',
  'grey': '#6B7280',
  'silver': '#9CA3AF',
  'orange': '#F97316',
  'pink': '#EC4899',
  'purple': '#9333EA',
  'brown': '#92400E',
  'gold': '#F59E0B',
  'beige': '#FEF3C7',
  'navy': '#1E3A8A',
  'cyan': '#06B6D4',
  'lime': '#84CC16'
};

// Hàm lấy mã màu từ tên màu
const getColorHex = (colorName: string): string => {
  if (!colorName) return '#D1D5DB';
  const lowerColor = colorName.toLowerCase().trim();
  return colorHexMap[lowerColor] || '#D1D5DB';
};

interface QuotationModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName?: string;
  vehiclePrice?: number;
  colorOptions?: string[];
}

interface QuotationItem {
  vehicle_id: string;
  quantity: number;
  discount?: number;
  color?: string;
  promotion_id?: string;
  options?: { option_id: string }[];
  accessories?: { accessory_id: string; quantity: number }[];
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  visible,
  onClose,
  vehicleId,
  vehicleName,
  vehiclePrice,
  colorOptions = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{ option_id: string }[]>([]);
  const [accessories, setAccessories] = useState<{ accessory_id: string; quantity: number }[]>([]);
  const [quotationResult, setQuotationResult] = useState<unknown | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Memoize color options để đảm bảo stable reference
  const colorsList = React.useMemo(() => {
    console.log('🎨 Memoizing colors:', colorOptions);
    return colorOptions || [];
  }, [colorOptions]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const quotationItem: QuotationItem = {
        vehicle_id: vehicleId,
        quantity: values.quantity || 1,
        color: values.color,
        discount: values.discount,
        promotion_id: values.promotion_id,
        options: options.length > 0 ? options : undefined,
        accessories: accessories.length > 0 ? accessories : undefined
      };

      const quotationData = {
        notes: values.notes,
        customer_id: values.customer_id,
        items: [quotationItem]
      };

      console.log('📝 Submitting quotation:', quotationData);
      console.log('📝 Quotation item details:', {
        color: quotationItem.color,
        options: quotationItem.options,
        accessories: quotationItem.accessories,
        hasColor: !!quotationItem.color,
        optionsCount: options.length,
        accessoriesCount: accessories.length
      });

      const response = await authService.createQuotation(quotationData);

      console.log('📋 Create quotation response:', response);
      console.log('📋 Quotation data:', response.data);

      if (response.success) {
        message.success('Tạo báo giá thành công!');
        setQuotationResult(response.data);
        setShowResult(true);
      } else {
        message.error(response.message || 'Không thể tạo báo giá');
      }
    } catch (error) {
      console.error('❌ Error creating quotation:', error);
      message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOptions([]);
    setAccessories([]);
    setShowResult(false);
    setQuotationResult(null);
    onClose();
  };

  const addOption = () => {
    setOptions([...options, { option_id: '' }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, optionId: string) => {
    const newOptions = [...options];
    newOptions[index] = { option_id: optionId };
    setOptions(newOptions);
  };

  const addAccessory = () => {
    setAccessories([...accessories, { accessory_id: '', quantity: 1 }]);
  };

  const removeAccessory = (index: number) => {
    setAccessories(accessories.filter((_, i) => i !== index));
  };

  const updateAccessory = (index: number, field: 'accessory_id' | 'quantity', value: string | number) => {
    const newAccessories = [...accessories];
    if (field === 'accessory_id') {
      newAccessories[index].accessory_id = value as string;
    } else {
      newAccessories[index].quantity = value as number;
    }
    setAccessories(newAccessories);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleExportPDF = async () => {
    try {
      console.log('🔍 Full quotationResult:', quotationResult);
      console.log('🔍 quotationResult type:', typeof quotationResult);
      console.log('🔍 quotationResult keys:', quotationResult ? Object.keys(quotationResult) : 'null');
      
      // Try different possible structures
      let quotationId: string | undefined;
      let quotationCode: string | undefined;
      
      const result = quotationResult as Record<string, unknown>;
      
      // Case 1: Direct _id or id
      if (result?._id) {
        quotationId = String(result._id);
      } else if (result?.id) {
        quotationId = String(result.id);
      }
      // Case 2: Nested in data
      else if (result?.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        quotationId = String(data._id || data.id || '');
      }
      
      // Get quotation code
      if (result?.code) {
        quotationCode = String(result.code);
      } else if (result?.data && typeof result.data === 'object') {
        const data = result.data as Record<string, unknown>;
        quotationCode = String(data.code || '');
      }
      
      console.log('🔍 Extracted quotationId:', quotationId);
      console.log('🔍 Extracted quotationCode:', quotationCode);
      
      if (!quotationId) {
        console.error('❌ Cannot find quotation ID in:', quotationResult);
        message.error('Không tìm thấy ID báo giá');
        return;
      }

      message.loading({ content: 'Đang tạo file PDF...', key: 'pdf' });
      
      const blob = await authService.exportQuotationPDF(quotationId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get quotation code for filename
      link.download = `Bao_gia_${quotationCode || quotationId}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success({ content: 'Xuất PDF thành công!', key: 'pdf' });
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      message.error({ content: 'Không thể xuất PDF. Vui lòng thử lại!', key: 'pdf' });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-3 pb-4 border-b">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FileTextOutlined className="text-white text-2xl" />
          </div>
          <div>
            <Title level={3} style={{ margin: 0 }}>Tạo báo giá</Title>
            <Text type="secondary">Tạo báo giá cho khách hàng</Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      centered
      styles={{ 
        body: { padding: '24px' }
      }}
      style={{ top: 20 }}
    >
      {!showResult ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ quantity: 1 }}
        >
          {/* Vehicle Info Card */}
          {vehicleName && (
          <Card 
            className="mb-6" 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 16
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Xe được chọn</Text>
                <Title level={4} style={{ color: 'white', margin: '4px 0' }}>{vehicleName}</Title>
              </div>
              {vehiclePrice && (
                <div className="text-right">
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Giá niêm yết</Text>
                  <Title level={4} style={{ color: 'white', margin: '4px 0' }}>
                    {formatPrice(vehiclePrice)}
                  </Title>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Customer ID */}
        <Form.Item
          label={<Text strong>ID Khách hàng (Tùy chọn)</Text>}
          name="customer_id"
          tooltip="Để trống nếu chưa có thông tin khách hàng"
        >
          <Input 
            placeholder="Nhập ID khách hàng (nếu có)" 
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Divider orientation="left">
          <ShoppingCartOutlined /> Chi tiết sản phẩm
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={<Text strong>Số lượng</Text>}
              name="quantity"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
            >
              <InputNumber 
                min={1} 
                style={{ width: '100%', borderRadius: 8 }} 
                size="large"
                placeholder="Nhập số lượng"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={<Text strong>Màu sắc</Text>} name="color">
              <select 
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                  padding: '0 11px',
                  fontSize: '14px'
                }}
              >
                <option value="">Chọn màu sắc</option>
                {colorsList.map((color, idx) => (
                  <option key={idx} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={<Text strong>Giảm giá (VNĐ)</Text>}
              name="discount"
            >
              <InputNumber 
                min={0} 
                style={{ width: '100%', borderRadius: 8 }} 
                size="large"
                placeholder="Nhập số tiền giảm giá"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={<Text strong>ID Khuyến mãi</Text>}
              name="promotion_id"
            >
              <Input 
                placeholder="Nhập ID khuyến mãi (nếu có)" 
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Options */}
        <Divider orientation="left">
          <Space>
            Tùy chọn bổ sung
            <Tag color="blue">{options.length}</Tag>
          </Space>
        </Divider>

        {options.map((option, index) => (
          <Space key={index} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
            <Input
              placeholder="Nhập ID tùy chọn"
              value={option.option_id}
              onChange={(e) => updateOption(index, e.target.value)}
              size="large"
              style={{ borderRadius: 8, flex: 1 }}
            />
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => removeOption(index)} 
              danger
              size="large"
            />
          </Space>
        ))}

        <Button 
          type="dashed" 
          onClick={addOption} 
          icon={<PlusOutlined />} 
          block
          size="large"
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          Thêm tùy chọn
        </Button>

        {/* Accessories */}
        <Divider orientation="left">
          <Space>
            Phụ kiện
            <Tag color="green">{accessories.length}</Tag>
          </Space>
        </Divider>

        {accessories.map((accessory, index) => (
          <Space key={index} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
            <Input
              placeholder="Nhập ID phụ kiện"
              value={accessory.accessory_id}
              onChange={(e) => updateAccessory(index, 'accessory_id', e.target.value)}
              size="large"
              style={{ borderRadius: 8, flex: 1 }}
            />
            <InputNumber
              placeholder="Số lượng"
              min={1}
              value={accessory.quantity}
              onChange={(value) => updateAccessory(index, 'quantity', value || 1)}
              size="large"
              style={{ width: 120, borderRadius: 8 }}
            />
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => removeAccessory(index)} 
              danger
              size="large"
            />
          </Space>
        ))}

        <Button 
          type="dashed" 
          onClick={addAccessory} 
          icon={<PlusOutlined />} 
          block
          size="large"
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          Thêm phụ kiện
        </Button>

        {/* Notes */}
        <Form.Item
          label={<Text strong>Ghi chú</Text>}
          name="notes"
        >
          <TextArea 
            rows={4} 
            placeholder="Nhập ghi chú cho báo giá (VD: Báo giá có hiệu lực trong 7 ngày, bao gồm 2 phụ kiện...)" 
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        {/* Total Price */}
        {vehiclePrice && (
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
            prevValues.quantity !== currentValues.quantity || prevValues.discount !== currentValues.discount
          }>
            {({ getFieldValue }) => {
              const quantity = getFieldValue('quantity') || 1;
              const discount = getFieldValue('discount') || 0;
              const total = (vehiclePrice * quantity) - discount;
              
              return (
                <Card 
                  style={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    border: 'none',
                    borderRadius: 16,
                    marginBottom: 16
                  }}
                >
                  <div className="flex justify-between items-center">
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: 600 }}>
                      Tổng giá trị báo giá
                    </Text>
                    <Title level={3} style={{ color: 'white', margin: 0 }}>
                      {formatPrice(total)}
                    </Title>
                  </div>
                </Card>
              );
            }}
          </Form.Item>
        )}

        {/* Action Buttons */}
        <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 24 }}>
          <Button 
            onClick={handleCancel} 
            size="large"
            style={{ borderRadius: 8, minWidth: 100 }}
          >
            Hủy
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit} 
            loading={loading}
            size="large"
            icon={<FileTextOutlined />}
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              minWidth: 150
            }}
          >
            Tạo báo giá
          </Button>
        </Space>
        </Form>
      ) : null}

      {/* Quotation Result Modal */}
      {showResult && quotationResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 40,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <FileTextOutlined style={{ fontSize: 40, color: 'white' }} />
              </div>
              <Title level={2} style={{ margin: 0 }}>Báo giá đã tạo thành công!</Title>
              <Text type="secondary">Thông tin báo giá của bạn</Text>
            </div>

            <Card style={{ marginBottom: 16, borderRadius: 12, background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">Mã báo giá:</Text>
                <Text code style={{ display: 'block', marginTop: 4, fontSize: 18, fontWeight: 'bold' }}>
                  {(() => {
                    const result = quotationResult as Record<string, unknown>;
                    if (result?.code) return String(result.code);
                    if (result?.data && typeof result.data === 'object') {
                      const data = result.data as Record<string, unknown>;
                      return String(data.code || data._id || data.id || 'N/A');
                    }
                    return String(result?._id || result?.id || 'N/A');
                  })()}
                </Text>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              
              {/* Vehicle Info */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>Thông tin xe</Text>
                <div style={{ marginTop: 8, padding: 12, background: 'white', borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Tên xe: </Text>
                    <Text strong>{vehicleName}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Số lượng: </Text>
                    <Text strong>{form.getFieldValue('quantity') || 1}</Text>
                  </div>
                  {form.getFieldValue('color') && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">Màu sắc: </Text>
                      <Tag color="blue">{form.getFieldValue('color')}</Tag>
                    </div>
                  )}
                  <div>
                    <Text type="secondary">Giá niêm yết: </Text>
                    <Text strong style={{ color: '#1890ff' }}>
                      {vehiclePrice ? formatPrice(vehiclePrice) : 'N/A'}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              {form.getFieldValue('customer_id') && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Thông tin khách hàng</Text>
                  <div style={{ marginTop: 8, padding: 12, background: 'white', borderRadius: 8 }}>
                    <Text type="secondary">ID: </Text>
                    <Text code>{form.getFieldValue('customer_id')}</Text>
                  </div>
                </div>
              )}

              {/* Discount & Promotion */}
              {(form.getFieldValue('discount') || form.getFieldValue('promotion_id')) && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Ưu đãi</Text>
                  <div style={{ marginTop: 8, padding: 12, background: 'white', borderRadius: 8 }}>
                    {form.getFieldValue('discount') && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">Giảm giá: </Text>
                        <Text strong style={{ color: '#52c41a' }}>
                          -{formatPrice(form.getFieldValue('discount'))}
                        </Text>
                      </div>
                    )}
                    {form.getFieldValue('promotion_id') && (
                      <div>
                        <Text type="secondary">Mã khuyến mãi: </Text>
                        <Tag color="gold">{form.getFieldValue('promotion_id')}</Tag>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Options */}
              {options.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Tùy chọn bổ sung</Text>
                  <div style={{ marginTop: 8, padding: 12, background: 'white', borderRadius: 8 }}>
                    {options.map((opt, idx) => (
                      <Tag key={idx} color="purple" style={{ marginBottom: 4 }}>
                        {opt.option_id}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessories */}
              {accessories.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Phụ kiện</Text>
                  <div style={{ marginTop: 8, padding: 12, background: 'white', borderRadius: 8 }}>
                    {accessories.map((acc, idx) => (
                      <div key={idx} style={{ marginBottom: 4 }}>
                        <Tag color="green">{acc.accessory_id}</Tag>
                        <Text type="secondary"> x {acc.quantity}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {form.getFieldValue('notes') && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Ghi chú</Text>
                  <div style={{ marginTop: 8, padding: 12, background: 'white', borderRadius: 8 }}>
                    <Text>{form.getFieldValue('notes')}</Text>
                  </div>
                </div>
              )}

              <Divider style={{ margin: '16px 0' }} />

              {/* Total */}
              <div style={{ 
                padding: 16, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Tổng giá trị báo giá</Text>
                <Title level={2} style={{ color: 'white', margin: '8px 0 0 0' }}>
                  {formatPrice(
                    (vehiclePrice || 0) * (form.getFieldValue('quantity') || 1) - (form.getFieldValue('discount') || 0)
                  )}
                </Title>
              </div>
            </Card>

            <Space style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} size="middle">
              <Button 
                size="large"
                onClick={handleCancel}
                style={{ borderRadius: 8, minWidth: 120 }}
              >
                Đóng
              </Button>
              <Button 
                type="primary"
                size="large"
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: 8,
                  minWidth: 180
                }}
              >
                <DownloadOutlined style={{ marginLeft: 4 }} />
                Xuất file PDF
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};

