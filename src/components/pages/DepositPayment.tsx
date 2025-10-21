import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Input, 
  Select, 
  message, 
  Card, 
  Descriptions, 
  Tag, 
  Space,
  Typography,
  Alert,
  DatePicker,
  Row,
  Col,
  InputNumber
} from 'antd';
import { 
  DollarOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { orderService } from '../../services/orderService';
import { Order } from '../../types/index';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DepositPaymentProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositPayment: React.FC<DepositPaymentProps> = ({
  visible,
  order,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && order) {
      const defaultValues = {
        payment_date: dayjs(),
        payment_method: 'cash',
        deposit_amount: Math.round(order.final_amount * 0.3), // 30% deposit
        notes: `Đặt cọc cho đơn hàng ${order.code}`
      };
      
      form.setFieldsValue(defaultValues);
      generatePaymentData(defaultValues);
    } else {
      form.resetFields();
      setPaymentData(null);
    }
  }, [visible, order, form]);

  // Generate payment data
  const generatePaymentData = (values: any) => {
    if (!order) return;

    const payment = {
      order_id: order._id,
      order_code: order.code,
      payment_date: values.payment_date,
      payment_method: values.payment_method,
      deposit_amount: values.deposit_amount,
      total_amount: order.final_amount,
      remaining_amount: order.final_amount - values.deposit_amount,
      notes: values.notes,
      new_status: 'halfPayment'
    };

    setPaymentData(payment);
  };

  // Handle form values change
  const handleFormChange = () => {
    const values = form.getFieldsValue();
    generatePaymentData(values);
  };

  // Process deposit payment
  const handleSubmit = async () => {
    if (!order || !paymentData) return;

    setLoading(true);
    try {
      const values = await form.validateFields();
      
      // Update order status to halfPayment
      const updateData = {
        status: 'halfPayment',
        paid_amount: order.paid_amount + values.deposit_amount,
        notes: values.notes
      };

      const response = await orderService.updateOrder(order._id, updateData);
      
      if (response && response.success) {
        message.success('Đã cập nhật đơn hàng thành công!');
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error: any) {
      console.error('Error processing deposit payment:', error);
      message.error('Lỗi khi xử lý đặt cọc');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!order) return null;

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <DollarOutlined className="text-green-600" />
          <span>Xử lý đặt cọc</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={handleSubmit}
        >
          Xác nhận đặt cọc
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
            <Descriptions.Item label="Trạng thái hiện tại">
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
            <Descriptions.Item label="Đã thanh toán">
              <span className="font-medium">
                {formatCurrency(order.paid_amount)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              <span className="font-medium text-red-600">
                {formatCurrency(order.final_amount - order.paid_amount)}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Payment Form */}
        <Card size="small">
          <Title level={5}>Thông tin đặt cọc</Title>
          <Alert
            message="Thông báo"
            description="Sau khi xác nhận đặt cọc, đơn hàng sẽ chuyển sang trạng thái 'Đã đặt cọc' và số tiền đã thanh toán sẽ được cập nhật."
            type="info"
            icon={<ExclamationCircleOutlined />}
            className="mb-4"
          />
          
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="payment_date"
                  label="Ngày đặt cọc"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày đặt cọc' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="payment_method"
                  label="Phương thức thanh toán"
                  rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
                >
                  <Select placeholder="Chọn phương thức thanh toán">
                    <Option value="cash">Tiền mặt</Option>
                    <Option value="bank_transfer">Chuyển khoản</Option>
                    <Option value="credit_card">Thẻ tín dụng</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="deposit_amount"
              label="Số tiền đặt cọc"
              rules={[
                { required: true, message: 'Vui lòng nhập số tiền đặt cọc' },
                { 
                  validator: (_, value) => {
                    if (value && value > 0 && value <= order.final_amount) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Số tiền đặt cọc phải lớn hơn 0 và không vượt quá tổng tiền đơn hàng'));
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                placeholder="Nhập số tiền đặt cọc"
                min={0}
                max={order.final_amount}
              />
            </Form.Item>
            
            <Form.Item
              name="notes"
              label="Ghi chú"
            >
              <TextArea 
                rows={3} 
                placeholder="Nhập ghi chú cho việc đặt cọc..."
              />
            </Form.Item>
          </Form>
        </Card>

        {/* Payment Summary */}
        {paymentData && (
          <Card size="small">
            <Title level={5}>Tóm tắt thanh toán</Title>
            <Alert
              message="Đơn hàng sẽ chuyển sang trạng thái 'Đã đặt cọc'"
              type="success"
              className="mb-4"
            />
            
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Số tiền đặt cọc">
                <span className="font-medium text-green-600">
                  {formatCurrency(paymentData.deposit_amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền đơn hàng">
                <span className="font-medium">
                  {formatCurrency(paymentData.total_amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Đã thanh toán (sau đặt cọc)">
                <span className="font-medium text-blue-600">
                  {formatCurrency(order.paid_amount + paymentData.deposit_amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Còn lại">
                <span className="font-medium text-orange-600">
                  {formatCurrency(paymentData.remaining_amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái mới">
                <Tag color="cyan">Đã đặt cọc</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default DepositPayment;
