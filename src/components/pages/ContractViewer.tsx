import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  message, 
  Card, 
  Descriptions, 
  Tag, 
  Typography,
  Alert,
  Spin,
  Image
} from 'antd';
import { 
  FileTextOutlined, 
  DownloadOutlined,
  PrinterOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { contractService, ContractInfo } from '../../services/contractService';
import { Order } from '../../types/index';

const { Title } = Typography;

interface ContractViewerProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ContractViewer: React.FC<ContractViewerProps> = ({
  visible,
  order,
  onClose,
  onRefresh
}) => {
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load contract information
  const loadContractInfo = async () => {
    if (!order?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await contractService.getContractInfo(order._id);
      console.log('Contract API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // Handle backend response structure: {status: 200, success: true, message, data}
      if (response) {
        console.log('Response success field:', response.success);
        console.log('Response data field:', response.data);
        
        // Accept both success: true and direct data response
        if (response.success === true || response.success === undefined) {
          const contractData = response.data || response || {};
          console.log('Contract data from backend:', contractData);
          
          // Transform backend contract structure to frontend format
          const transformedContract = {
            _id: contractData._id,
            contract_url: (contractData as any).signed_contract_url,
            contract_signed: !!(contractData as any).signed_contract_url, // true if has signed_contract_url
            signed_date: (contractData as any).signed_at,
            upload_date: (contractData as any).signed_at, // same as signed_at in backend
            notes: (contractData as any).template_used,
            signed_by: (contractData as any).signed_by,
            uploaded_by: (contractData as any).uploaded_by
          };
          
          setContractInfo(transformedContract);
          console.log('Contract info loaded successfully:', transformedContract);
        } else {
          console.log('Response success is false:', response.success);
          throw new Error(response?.message || 'Failed to load contract info');
        }
      } else {
        console.log('No response received');
        throw new Error('No response received');
      }
    } catch (err: any) {
      console.error('Error loading contract info:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi kết nối API';
      setError(errorMessage);
      message.error('Không thể tải thông tin hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  // Load contract info when modal opens
  useEffect(() => {
    if (visible && order) {
      console.log('Order data in ContractViewer:', order);
      console.log('Order items:', order.items);
      loadContractInfo();
    } else {
      setContractInfo(null);
      setError(null);
    }
  }, [visible, order]);

  // Download contract
  const handleDownload = async () => {
    if (!order?._id) return;
    
    try {
      const blob = await contractService.generateContract(order._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hop-dong-${order.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Đã tải xuống hợp đồng');
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      message.error('Lỗi khi tải xuống hợp đồng');
    }
  };

  // Print contract
  const handlePrint = () => {
    if (contractInfo?.contract_url) {
      window.open(contractInfo.contract_url, '_blank');
    } else {
      message.warning('Không có hợp đồng để in');
    }
  };

  // Delete contract
  const handleDelete = async () => {
    if (!order?._id) return;
    
    try {
      const response = await contractService.deleteSignedContract(order._id);
      console.log('Delete contract response:', response);
      
      // Handle backend response structure: {status: 200, success: true, message, data}
      if (response && (response.success === true || response.success === undefined)) {
        message.success('Đã xóa hợp đồng thành công');
        loadContractInfo();
        onRefresh?.();
      } else {
        console.log('Delete failed, response:', response);
        throw new Error(response?.message || 'Failed to delete contract');
      }
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      message.error('Lỗi khi xóa hợp đồng');
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
          <FileTextOutlined className="text-blue-600" />
          <span>Xem hợp đồng - {order.code}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button 
          key="refresh" 
          icon={<ReloadOutlined />}
          onClick={loadContractInfo}
          loading={loading}
        >
          Làm mới
        </Button>,
        contractInfo?.contract_url && (
          <Button 
            key="download" 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Tải xuống
          </Button>
        ),
        contractInfo?.contract_url && (
          <Button 
            key="print" 
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            In hợp đồng
          </Button>
        ),
        contractInfo?.contract_signed && (
          <Button 
            key="delete" 
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            Xóa hợp đồng
          </Button>
        )
      ]}
    >
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      )}

      {error && (
        <Alert
          message="Lỗi hệ thống"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadContractInfo}>
              Thử lại
            </Button>
          }
          className="mb-4"
        />
      )}

      {contractInfo && !loading && (
        <div className="space-y-4">
          {/* Order Information */}
          <Card size="small">
            <Title level={5}>Thông tin đơn hàng</Title>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Mã đơn hàng">
                <span className="font-mono text-blue-600 text-lg font-bold">{order.code}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                <div>
                  <div className="font-medium">{order.customer?.full_name || 'N/A'}</div>
                  <div className="text-gray-500 text-sm">{order.customer?.phone || 'N/A'}</div>
                  <div className="text-gray-500 text-sm">{order.customer?.email || 'N/A'}</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ khách hàng">
                {order.customer?.address || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên bán hàng">
                {order.salesperson?.full_name || 'Chưa phân công'}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                <span className="font-medium text-green-600 text-lg">
                  {formatCurrency(order.final_amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Đã thanh toán">
                <span className="font-medium text-blue-600">
                  {formatCurrency(order.paid_amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Còn lại">
                <span className="font-medium text-orange-600">
                  {formatCurrency(order.final_amount - order.paid_amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                <Tag color={order.payment_method === 'cash' ? 'green' : 'blue'}>
                  {order.payment_method === 'cash' ? 'Tiền mặt' : 'Trả góp'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn hàng">
                <Tag color="orange">Chờ xác nhận</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              {order.notes && (
                <Descriptions.Item label="Ghi chú đơn hàng" span={2}>
                  {order.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Contract Information */}
          <Card size="small">
            <Title level={5}>Thông tin hợp đồng</Title>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Trạng thái hợp đồng">
                <Tag color={contractInfo.contract_signed ? 'green' : 'red'} className="text-lg">
                  {contractInfo.contract_signed ? 'Đã ký' : 'Chưa ký'}
                </Tag>
              </Descriptions.Item>
              {contractInfo.signed_date && (
                <Descriptions.Item label="Ngày ký hợp đồng">
                  <div className="font-medium">
                    {dayjs(contractInfo.signed_date).format('DD/MM/YYYY HH:mm:ss')}
                  </div>
                </Descriptions.Item>
              )}
              {contractInfo.upload_date && (
                <Descriptions.Item label="Ngày upload hợp đồng">
                  <div className="font-medium">
                    {dayjs(contractInfo.upload_date).format('DD/MM/YYYY HH:mm:ss')}
                  </div>
                </Descriptions.Item>
              )}
              {(contractInfo as any).signed_by && (
                <Descriptions.Item label="Người ký">
                  {(contractInfo as any).signed_by}
                </Descriptions.Item>
              )}
              {(contractInfo as any).uploaded_by && (
                <Descriptions.Item label="Người upload">
                  {(contractInfo as any).uploaded_by}
                </Descriptions.Item>
              )}
              {contractInfo.notes && (
                <Descriptions.Item label="Template sử dụng">
                  {contractInfo.notes}
                </Descriptions.Item>
              )}
              {contractInfo.contract_url && (
                <Descriptions.Item label="Link hợp đồng" span={2}>
                  <div className="break-all text-blue-600">
                    <a href={contractInfo.contract_url} target="_blank" rel="noopener noreferrer">
                      {contractInfo.contract_url}
                    </a>
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Order Items Information */}
          {order.items && order.items.length > 0 && (
            <Card size="small">
              <Title level={5}>Chi tiết sản phẩm trong đơn hàng</Title>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Tên sản phẩm</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Màu sắc</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Số lượng</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Đơn giá</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="font-medium">{item.vehicle_name || 'N/A'}</div>
                          {item.vehicle_model && (
                            <div className="text-sm text-gray-500">{item.vehicle_model}</div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {item.color || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {item.quantity || 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {(() => {
                            const unitPrice = item.unit_price || item.price || item.vehicle_price || 0;
                            // Nếu không có giá đơn vị, tính từ tổng tiền chia cho số lượng
                            const calculatedPrice = unitPrice || (order.final_amount / (order.items?.length || 1));
                            return formatCurrency(calculatedPrice);
                          })()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                          {(() => {
                            const unitPrice = item.unit_price || item.price || item.vehicle_price || 0;
                            const quantity = item.quantity || 1;
                            // Nếu không có giá đơn vị, tính từ tổng tiền chia cho số lượng
                            const calculatedPrice = unitPrice || (order.final_amount / (order.items?.length || 1));
                            return formatCurrency(calculatedPrice * quantity);
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Contract Preview */}
          {contractInfo.contract_url && (
            <Card size="small">
              <Title level={5}>Xem trước hợp đồng</Title>
              <div className="text-center">
                {contractInfo.contract_url.toLowerCase().includes('.pdf') ? (
                  <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileTextOutlined className="text-6xl text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4 text-lg">File PDF hợp đồng</p>
                    <div className="space-x-4">
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(contractInfo.contract_url, '_blank')}
                      >
                        Mở file PDF
                      </Button>
                      <Button 
                        size="large"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                      >
                        Tải xuống
                      </Button>
                      <Button 
                        size="large"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                      >
                        In hợp đồng
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-auto border border-gray-300 rounded-lg p-4">
                    <Image
                      src={contractInfo.contract_url}
                      alt="Hợp đồng đã ký"
                      style={{ maxWidth: '100%' }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                    />
                    <div className="mt-4 space-x-4">
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                      >
                        Tải xuống
                      </Button>
                      <Button 
                        size="large"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                      >
                        In hợp đồng
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* No Contract Message */}
          {!contractInfo.contract_signed && (
            <Alert
              message="Chưa có hợp đồng"
              description="Đơn hàng này chưa có hợp đồng được ký. Vui lòng sinh hợp đồng và upload file đã ký."
              type="warning"
              showIcon
            />
          )}
        </div>
      )}

      {/* No Contract Info */}
      {!contractInfo && !loading && !error && (
        <Alert
          message="Không có thông tin hợp đồng"
          description="Không thể tải thông tin hợp đồng cho đơn hàng này."
          type="info"
          showIcon
        />
      )}
    </Modal>
  );
};

export default ContractViewer;
