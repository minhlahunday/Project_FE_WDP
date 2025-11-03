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
  Spin
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
import { generateContractPDF, mapOrderToContractPDF } from '../../utils/pdfUtils';

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
    if (!order) return;
    
    try {
      message.info('Đang tạo hợp đồng PDF...');
      
      // Generate PDF on frontend
      const contractData = await mapOrderToContractPDF(order);
      await generateContractPDF(contractData);
      
      message.success('Đã tải xuống hợp đồng');
    } catch (error: any) {
      console.error('Error generating contract:', error);
      message.error('Lỗi khi tạo hợp đồng: ' + (error?.message || 'Unknown error'));
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
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
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
                      <th className="border border-gray-300 px-4 py-2 text-center" style={{ width: '5%' }}>STT</th>
                      <th className="border border-gray-300 px-4 py-2 text-left" style={{ width: '40%' }}>Tên hàng hóa, dịch vụ</th>
                      <th className="border border-gray-300 px-4 py-2 text-center" style={{ width: '10%' }}>Đơn vị tính</th>
                      <th className="border border-gray-300 px-4 py-2 text-center" style={{ width: '10%' }}>Số lượng</th>
                      <th className="border border-gray-300 px-4 py-2 text-right" style={{ width: '15%' }}>Đơn giá</th>
                      <th className="border border-gray-300 px-4 py-2 text-right" style={{ width: '20%' }}>Thành tiền</th>
                    </tr>
                    <tr className="bg-gray-50">
                      <th colSpan={6} className="border border-gray-300 px-4 py-1 text-right text-xs italic">
                        (Thành tiền = Số lượng × Đơn giá)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let rowIndex = 1;
                      const rows: JSX.Element[] = [];
                      
                      order.items.forEach((item: any) => {
                        const unitPrice = item.unit_price || item.price || item.vehicle_price || 0;
                        const quantity = item.quantity || 1;
                        const vehicleAmount = unitPrice * quantity;
                        
                        // Vehicle row
                        rows.push(
                          <tr key={`vehicle-${rowIndex}`}>
                            <td className="border border-gray-300 px-4 py-2 text-center">{rowIndex++}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              <div className="font-medium">
                                {item.vehicle_name || 'N/A'}
                                {item.color && ` (Màu ${item.color})`}
                              </div>
                              {item.vehicle_model && (
                                <div className="text-sm text-gray-500">{item.vehicle_model}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">Chiếc</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{quantity}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(unitPrice)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(vehicleAmount)}</td>
                          </tr>
                        );
                        
                        // Accessories rows
                        if (item.accessories && item.accessories.length > 0) {
                          item.accessories.forEach((acc: any, accIndex: number) => {
                            const accPrice = acc.price || 0;
                            const accQuantity = acc.quantity || 1;
                            const accAmount = accPrice * accQuantity;
                            rows.push(
                              <tr key={`accessory-${rowIndex}-${accIndex}`}>
                                <td className="border border-gray-300 px-4 py-2 text-center">{rowIndex++}</td>
                                <td className="border border-gray-300 px-4 py-2">{acc.name || 'N/A'}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">Chiếc</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{accQuantity}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accPrice)}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accAmount)}</td>
                              </tr>
                            );
                          });
                        }
                        
                        // Options rows
                        if (item.options && item.options.length > 0) {
                          item.options.forEach((opt: any, optIndex: number) => {
                            const optPrice = opt.price || 0;
                            const optQuantity = opt.quantity || 1;
                            const optAmount = optPrice * optQuantity;
                            rows.push(
                              <tr key={`option-${rowIndex}-${optIndex}`}>
                                <td className="border border-gray-300 px-4 py-2 text-center">{rowIndex++}</td>
                                <td className="border border-gray-300 px-4 py-2">{opt.name || 'N/A'}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">Bộ</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{optQuantity}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(optPrice)}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(optAmount)}</td>
                              </tr>
                            );
                          });
                        }
                      });
                      
                      return rows;
                    })()}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="border-t-2 border-gray-400 px-4 py-2 text-right font-bold">
                        Tổng cộng tiền thanh toán:
                      </td>
                      <td className="border-t-2 border-gray-400 px-4 py-2 text-right font-bold text-red-600 text-lg">
                        {formatCurrency(order.final_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* Contract Preview */}
          {contractInfo.contract_url && (
            <Card size="small">
              <Title level={5}>Xem trước hợp đồng</Title>
              <div className="text-center">
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <FileTextOutlined className="text-6xl text-blue-500 mb-4" />
                  <p className="text-gray-700 mb-2 text-lg font-semibold">File PDF hợp đồng</p>
                  <p className="text-gray-500 mb-4 text-sm">{contractInfo.contract_url.substring(0, 60)}...</p>
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
