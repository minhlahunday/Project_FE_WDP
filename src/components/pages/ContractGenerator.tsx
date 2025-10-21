import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Input, 
  Select, 
  message, 
  Card, 
  Table, 
  Descriptions, 
  Tag, 
  Typography,
  Divider,
  Alert,
  DatePicker,
  Row,
  Col
} from 'antd';
import { 
  FileTextOutlined, 
  DownloadOutlined,
  PrinterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { Order } from '../../types/index';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ContractGeneratorProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ContractGenerator: React.FC<ContractGeneratorProps> = ({
  visible,
  order,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contractData, setContractData] = useState<any>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && order) {
      const defaultValues = {
        contract_date: dayjs(),
        delivery_date: dayjs().add(7, 'days'),
        warranty_period: '24', // 24 tháng
        payment_terms: 'cash',
        notes: `Hợp đồng mua bán xe ô tô điện VinFast - Đơn hàng ${order.code}`
      };
      
      form.setFieldsValue(defaultValues);
      generateContractData(defaultValues);
    } else {
      form.resetFields();
      setContractData(null);
    }
  }, [visible, order, form]);

  // Generate contract data
  const generateContractData = (values: any) => {
    if (!order) return;

    const contract = {
      contract_number: `HD${dayjs().format('YYMMDDHHmmss')}`,
      order_code: order.code,
      contract_date: values.contract_date,
      delivery_date: values.delivery_date,
      customer: order.customer,
      salesperson: order.salesperson,
      items: order.items,
      total_amount: order.final_amount,
      payment_terms: values.payment_terms,
      warranty_period: values.warranty_period,
      notes: values.notes,
      status: 'draft'
    };

    setContractData(contract);
  };

  // Handle form values change
  const handleFormChange = () => {
    const values = form.getFieldsValue();
    generateContractData(values);
  };

  // Generate contract
  const handleGenerate = async () => {
    if (!order || !contractData) return;

    setLoading(true);
    try {
      // TODO: Call API to generate contract
      // const response = await contractService.generateContract(contractData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Đã sinh hợp đồng thành công!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error generating contract:', error);
      message.error('Lỗi khi sinh hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  // Download contract
  const handleDownload = () => {
    message.info('Tính năng tải xuống hợp đồng đang được phát triển');
  };

  // Print contract
  const handlePrint = () => {
    message.info('Tính năng in hợp đồng đang được phát triển');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Table columns for items
  const itemColumns = [
    {
      title: 'Sản phẩm',
      key: 'vehicle',
      render: (record: any) => (
        <div>
          <div className="font-medium">{record.vehicle_name}</div>
          {record.color && (
            <div className="text-gray-500 text-sm">Màu: {record.color}</div>
          )}
        </div>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const
    },
    {
      title: 'Đơn giá',
      dataIndex: 'vehicle_price',
      key: 'vehicle_price',
      align: 'right' as const,
      render: (price: number) => formatCurrency(price)
    },
    {
      title: 'Thành tiền',
      dataIndex: 'final_amount',
      key: 'final_amount',
      align: 'right' as const,
      render: (amount: number) => (
        <span className="font-medium text-green-600">
          {formatCurrency(amount)}
        </span>
      )
    }
  ];

  if (!order) return null;

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <FileTextOutlined className="text-green-600" />
          <span>Sinh hợp đồng mua bán xe ô tô</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button 
          key="download" 
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        >
          Tải xuống
        </Button>,
        <Button 
          key="print" 
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          In hợp đồng
        </Button>,
        <Button 
          key="generate" 
          type="primary" 
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={handleGenerate}
        >
          Sinh hợp đồng
        </Button>
      ]}
    >
      <div className="space-y-6">
        {/* Order Information */}
        <Card size="small">
          <Title level={5}>Thông tin đơn hàng</Title>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Mã đơn hàng">
              <span className="font-mono text-blue-600">{order.code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color="orange">Chờ xác nhận</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {order.customer?.full_name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <span className="font-medium text-green-600">
                {formatCurrency(order.final_amount)}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Contract Configuration */}
        <Card size="small">
          <Title level={5}>Thông tin hợp đồng</Title>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="contract_date"
                  label="Ngày ký hợp đồng"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày ký hợp đồng' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="delivery_date"
                  label="Ngày giao hàng dự kiến"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày giao hàng' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="payment_terms"
                  label="Điều khoản thanh toán"
                  rules={[{ required: true, message: 'Vui lòng chọn điều khoản thanh toán' }]}
                >
                  <Select placeholder="Chọn điều khoản thanh toán">
                    <Option value="cash">Thanh toán toàn bộ</Option>
                    <Option value="installment">Trả góp</Option>
                    <Option value="deposit">Đặt cọc trước</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="warranty_period"
                  label="Thời gian bảo hành (tháng)"
                  rules={[{ required: true, message: 'Vui lòng nhập thời gian bảo hành' }]}
                >
                  <Select placeholder="Chọn thời gian bảo hành">
                    <Option value="12">12 tháng</Option>
                    <Option value="24">24 tháng</Option>
                    <Option value="36">36 tháng</Option>
                    <Option value="60">60 tháng</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="notes"
              label="Ghi chú hợp đồng"
            >
              <TextArea 
                rows={3} 
                placeholder="Nhập ghi chú cho hợp đồng..."
              />
            </Form.Item>
          </Form>
        </Card>

        {/* Contract Preview */}
        {contractData && (
          <Card size="small">
            <Title level={5}>Xem trước hợp đồng</Title>
            <Alert
              message="Hợp đồng sẽ được tạo với trạng thái 'Bản nháp'"
              type="info"
              className="mb-4"
            />
            
            <Descriptions column={2} size="small" className="mb-4">
              <Descriptions.Item label="Số hợp đồng">
                <span className="font-mono text-green-600">{contractData.contract_number}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày ký">
                {dayjs(contractData.contract_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày giao hàng">
                {dayjs(contractData.delivery_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Bảo hành">
                {contractData.warranty_period} tháng
              </Descriptions.Item>
              <Descriptions.Item label="Điều khoản thanh toán">
                <Tag color="blue">
                  {contractData.payment_terms === 'cash' ? 'Thanh toán toàn bộ' :
                   contractData.payment_terms === 'installment' ? 'Trả góp' : 'Đặt cọc trước'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng giá trị">
                <span className="font-medium text-green-600">
                  {formatCurrency(contractData.total_amount)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Sản phẩm trong hợp đồng</Title>
            <Table
              columns={itemColumns}
              dataSource={contractData.items}
              rowKey={(record: any) => `${record?.vehicle_id || 'unknown'}-${record?.color || 'default'}-${record?.quantity || 1}`}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
              summary={(pageData) => {
                const total = pageData.reduce((sum, item: any) => sum + (item?.final_amount || 0), 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3 as any}>
                      <span className="font-bold">Tổng cộng:</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <span className="font-bold text-green-600">
                        {formatCurrency(total)}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default ContractGenerator;
