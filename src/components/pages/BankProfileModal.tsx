import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Upload,
  message,
  Space,
  Alert,
  Divider
} from 'antd';
import {
  UploadOutlined,
  BankOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

import { paymentService, BankProfile, CreateBankProfileRequest } from '../../services/paymentService';
import { Order } from '../../services/orderService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BankProfileModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BankProfileModal: React.FC<BankProfileModalProps> = ({
  visible,
  order,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [existingProfile, setExistingProfile] = useState<BankProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load existing bank profile
  const loadBankProfile = async () => {
    if (!order) return;
    
    setLoadingProfile(true);
    try {
      const response = await paymentService.getBankProfileByOrder(order._id);
      if (response.success) {
        setExistingProfile(response.data);
        // Pre-fill form with existing data
        form.setFieldsValue({
          bank_name: response.data.bank_name,
          account_number: response.data.account_number,
          account_holder: response.data.account_holder,
          branch: response.data.branch,
          notes: response.data.notes
        });
      }
    } catch (error) {
      console.error('Error loading bank profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (visible && order) {
      loadBankProfile();
    } else {
      form.resetFields();
      setFileList([]);
      setExistingProfile(null);
    }
  }, [visible, order, form]);

  // Handle file upload
  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (!order) return;
    
    setLoading(true);
    try {
      // Prepare documents from uploaded files
      const documents = fileList
        .filter(file => file.status === 'done' && file.response?.url)
        .map(file => ({
          name: file.name,
          type: file.type || 'application/pdf',
          file_url: file.response.url
        }));

      const bankData: CreateBankProfileRequest = {
        customer_id: order.customer_id,
        order_id: order._id,
        bank_name: values.bank_name,
        account_number: values.account_number,
        account_holder: values.account_holder,
        branch: values.branch,
        documents,
        notes: values.notes
      };

      const response = await paymentService.createBankProfile(bankData);
      
      if (response.success) {
        message.success('Hồ sơ ngân hàng đã được gửi thành công!');
        onSuccess();
        handleClose();
      } else {
        message.error(response.message || 'Lỗi khi gửi hồ sơ ngân hàng');
      }
      
    } catch (error: any) {
      console.error('Error submitting bank profile:', error);
      const errorMessage = error?.response?.data?.message || 'Lỗi khi gửi hồ sơ ngân hàng';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setExistingProfile(null);
    onClose();
  };

  // Custom upload request
  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    
    try {
      // In a real implementation, you would upload to your server
      // For now, we'll simulate a successful upload
      setTimeout(() => {
        onSuccess({
          url: `https://example.com/uploads/${file.name}`,
          name: file.name
        });
      }, 1000);
    } catch (error) {
      onError(error);
    }
  };

  if (!order) return null;

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <BankOutlined className="text-blue-600" />
          <span>Hồ sơ ngân hàng - Trả góp</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <div className="space-y-6">
        {/* Order Information */}
        <Card size="small">
          <Title level={5}>Thông tin đơn hàng</Title>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text>Mã đơn hàng:</Text>
              <Text strong className="text-blue-600">{order.code}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Khách hàng:</Text>
              <Text strong>{order.customer?.full_name}</Text>
            </div>
            <div className="flex justify-between">
              <Text>Tổng tiền:</Text>
              <Text strong className="text-green-600">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(order.final_amount)}
              </Text>
            </div>
          </div>
        </Card>

        {/* Existing Profile Status */}
        {existingProfile && (
          <Alert
            message="Hồ sơ ngân hàng đã tồn tại"
            description={
              <div>
                <p>Trạng thái: <strong>{existingProfile.status === 'pending' ? 'Chờ duyệt' : 
                  existingProfile.status === 'approved' ? 'Đã duyệt' : 'Bị từ chối'}</strong></p>
                {existingProfile.notes && <p>Ghi chú: {existingProfile.notes}</p>}
              </div>
            }
            type={existingProfile.status === 'approved' ? 'success' : 
                  existingProfile.status === 'rejected' ? 'error' : 'warning'}
            showIcon
          />
        )}

        {/* Bank Profile Form */}
        <Card title="Thông tin tài khoản ngân hàng">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            loading={loadingProfile}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="bank_name"
                label="Tên ngân hàng"
                rules={[{ required: true, message: 'Vui lòng nhập tên ngân hàng' }]}
              >
                <Input placeholder="VD: Vietcombank, Techcombank..." />
              </Form.Item>

              <Form.Item
                name="account_number"
                label="Số tài khoản"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tài khoản' },
                  { pattern: /^\d+$/, message: 'Số tài khoản chỉ được chứa số' }
                ]}
              >
                <Input placeholder="Nhập số tài khoản" />
              </Form.Item>

              <Form.Item
                name="account_holder"
                label="Tên chủ tài khoản"
                rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
              >
                <Input placeholder="Tên chủ tài khoản" />
              </Form.Item>

              <Form.Item
                name="branch"
                label="Chi nhánh"
                rules={[{ required: true, message: 'Vui lòng nhập chi nhánh' }]}
              >
                <Input placeholder="VD: Chi nhánh Hà Nội" />
              </Form.Item>
            </div>

            <Form.Item
              name="notes"
              label="Ghi chú thêm"
            >
              <TextArea 
                rows={3} 
                placeholder="Ghi chú thêm về hồ sơ ngân hàng..."
              />
            </Form.Item>

            <Divider />

            {/* Document Upload */}
            <div>
              <Title level={5}>Tài liệu đính kèm</Title>
              <Text type="secondary" className="block mb-4">
                Vui lòng upload các tài liệu cần thiết (CMND/CCCD, sao kê ngân hàng, hợp đồng...)
              </Text>
              
              <Upload
                customRequest={customRequest}
                onChange={handleUploadChange}
                fileList={fileList}
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                listType="text"
              >
                <Button icon={<UploadOutlined />}>
                  Chọn tài liệu
                </Button>
              </Upload>
              
              <Text type="secondary" className="block mt-2">
                Hỗ trợ định dạng: PDF, JPG, PNG (tối đa 10MB mỗi file)
              </Text>
            </div>

            <div className="text-right mt-6">
              <Space>
                <Button onClick={handleClose}>
                  Hủy
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                  disabled={existingProfile?.status === 'approved'}
                >
                  {existingProfile ? 'Cập nhật hồ sơ' : 'Gửi hồ sơ'}
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </Modal>
  );
};

export default BankProfileModal;
