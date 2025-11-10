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
import Swal from 'sweetalert2';

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
            signed_contract_urls: (contractData as any).signed_contract_urls || [],
            contract_url: (contractData as any).signed_contract_urls?.[0]?.url || (contractData as any).signed_contract_url, // Backward compatibility
            contract_signed: !!(contractData as any).signed_contract_urls?.length || !!(contractData as any).signed_contract_url,
            signed_date: (contractData as any).signed_at,
            upload_date: (contractData as any).signed_at,
            notes: (contractData as any).template_used,
            signed_by: (contractData as any).signed_by,
            uploaded_by: (contractData as any).uploaded_by,
            template_used: (contractData as any).template_used
          } as ContractInfo;
          
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
  const handleDelete = async (contractUrl: string) => {
    if (!order?._id) return;
    
    // Debug: Log contract info trước khi xóa
    console.log('🔍 Contract info before delete:', {
      contractInfo,
      signed_contract_urls: contractInfo?.signed_contract_urls,
      contractUrl,
      allUrls: contractInfo?.signed_contract_urls?.map(c => c.url)
    });
    
    // Xác nhận trước khi xóa bằng SweetAlert2
    const result = await Swal.fire({
      title: 'Xác nhận xóa hợp đồng',
      text: 'Bạn có chắc chắn muốn xóa hợp đồng này? Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ff4d4f',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      // Đảm bảo SweetAlert hiển thị trên modal
      didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (swalContainer) {
          swalContainer.style.zIndex = '99999';
          if (swalContainer.parentElement !== document.body) {
            document.body.appendChild(swalContainer);
          }
        }
      }
    });
    
    if (!result.isConfirmed) return;
    
    try {
      console.log('🗑️ Deleting contract:', { 
        orderId: order._id, 
        contractUrl,
        contractUrlType: typeof contractUrl,
        contractUrlLength: contractUrl?.length,
        contractUrlExact: JSON.stringify(contractUrl)
      });
      const response = await contractService.deleteSignedContract(order._id, contractUrl);
      console.log('✅ Delete contract response:', response);
      
      // Handle backend response structure: {status: 200, success: true, message, data}
      if (response && (response.success === true || response.success === undefined)) {
        // Refresh data trước
        loadContractInfo();
        onRefresh?.();
        
        // Hiển thị SweetAlert (z-index cao, hiển thị trên modal)
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Đã xóa hợp đồng thành công',
          confirmButtonText: 'Đóng',
          timer: 3000,
          timerProgressBar: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          // Đảm bảo SweetAlert hiển thị trên modal
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '99999';
              // Đảm bảo SweetAlert được append vào body, không phải trong modal
              if (swalContainer.parentElement !== document.body) {
                document.body.appendChild(swalContainer);
              }
            }
          }
        });
      } else {
        console.log('❌ Delete failed, response:', response);
        const errorMessage = response?.message || 'Không thể xóa hợp đồng';
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: errorMessage,
          confirmButtonText: 'Đóng',
          // Đảm bảo SweetAlert hiển thị trên modal
          didOpen: () => {
            const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
            if (swalContainer) {
              swalContainer.style.zIndex = '99999';
              if (swalContainer.parentElement !== document.body) {
                document.body.appendChild(swalContainer);
              }
            }
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Error deleting contract:', error);
      // Hiển thị message lỗi chi tiết hơn
      const errorMessage = error?.message || error?.response?.data?.message || 'Lỗi khi xóa hợp đồng';
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: errorMessage,
        confirmButtonText: 'Đóng',
        // Đảm bảo SweetAlert hiển thị trên modal
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '99999';
            if (swalContainer.parentElement !== document.body) {
              document.body.appendChild(swalContainer);
            }
          }
        }
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Get status text in Vietnamese
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      halfPayment: 'Đã đặt cọc',
      deposit_paid: 'Đã đặt cọc',
      fullyPayment: 'Đã thanh toán',
      fully_paid: 'Đã thanh toán đủ',
      waiting_vehicle_request: 'Chờ yêu cầu xe',
      vehicle_ready: 'Xe sẵn sàng',
      delivered: 'Đã giao',
      completed: 'Hoàn thành',
      closed: 'Đã đóng',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  // Get status tag style with gradient background
  const getStatusTagStyle = (status: string) => {
    const styleMap: { [key: string]: React.CSSProperties } = {
      pending: {
        background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)'
      },
      confirmed: {
        background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
      },
      halfPayment: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
      },
      deposit_paid: {
        background: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 140, 22, 0.3)'
      },
      fullyPayment: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      fully_paid: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      waiting_vehicle_request: {
        background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)'
      },
      vehicle_ready: {
        background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(19, 194, 194, 0.3)'
      },
      delivered: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      completed: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
      },
      closed: {
        background: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(140, 140, 140, 0.3)'
      },
      cancelled: {
        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
        color: '#fff',
        border: 'none',
        fontWeight: 600,
        padding: '4px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
      },
    };
    return styleMap[status] || {
      background: '#f0f0f0',
      color: '#666',
      border: '1px solid #d9d9d9',
      fontWeight: 500,
      padding: '4px 12px',
      borderRadius: '6px'
    };
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
        contractInfo?.signed_contract_urls && contractInfo.signed_contract_urls.length > 0 && (
          <Button 
            key="download" 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Tải xuống tất cả
          </Button>
        ),
        (!contractInfo?.signed_contract_urls || contractInfo.signed_contract_urls.length === 0) && contractInfo?.contract_url && (
          <Button 
            key="download" 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Tải xuống
          </Button>
        ),
        (!contractInfo?.signed_contract_urls || contractInfo.signed_contract_urls.length === 0) && contractInfo?.contract_url && (
          <Button 
            key="print" 
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            In hợp đồng
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
                {order.customer?.full_name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {order.customer?.phone || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {order.customer?.email || 'N/A'}
              </Descriptions.Item>
              {/* <Descriptions.Item label="Địa chỉ khách hàng">
                {order.customer?.address || 'N/A'}
              </Descriptions.Item> */}
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
                <Tag 
                  style={order.payment_method === 'cash' ? {
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
                  } : {
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                  }}
                >
                  {order.payment_method === 'cash' ? 'Tiền mặt' : 'Trả góp'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn hàng">
                <Tag style={getStatusTagStyle(order.status || 'pending')}>
                  {getStatusText(order.status || 'pending')}
                </Tag>
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
                <Tag 
                  style={contractInfo.contract_signed ? {
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
                    fontSize: '14px'
                  } : {
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)',
                    fontSize: '14px'
                  }}
                >
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
              {/* {(contractInfo as any).signed_by && (
                <Descriptions.Item label="Người ký">
                  {(contractInfo as any).signed_by}
                </Descriptions.Item>
              )}
              {(contractInfo as any).uploaded_by && (
                <Descriptions.Item label="Người upload">
                  {(contractInfo as any).uploaded_by}
                </Descriptions.Item>
              )} */}
              {contractInfo.notes && (
                <Descriptions.Item label="Template sử dụng">
                  {contractInfo.notes}
                </Descriptions.Item>
              )}
              {/* {contractInfo.contract_url && (
                <Descriptions.Item label="Link hợp đồng" span={2}>
                  <div className="break-all text-blue-600">
                    <a href={contractInfo.contract_url} target="_blank" rel="noopener noreferrer">
                      {contractInfo.contract_url}
                    </a>
                  </div>
                </Descriptions.Item>
              )} */}
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

          {/* Contract Preview - List of contracts */}
          {contractInfo.signed_contract_urls && contractInfo.signed_contract_urls.length > 0 && (
            <Card size="small">
              <Title level={5}>Danh sách hợp đồng đã upload ({contractInfo.signed_contract_urls.length})</Title>
              <div className="space-y-3 mt-4">
                {contractInfo.signed_contract_urls.map((contract, index) => (
                  <Card key={index} size="small" className="border border-gray-200">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <FileTextOutlined className="text-blue-500 text-xl" />
                          <div>
                            <p className="font-medium text-gray-700">
                              Hợp đồng #{index + 1}
                            </p>
                            <p className="text-xs text-gray-500">
                              {dayjs(contract.uploaded_at).format('DD/MM/YYYY HH:mm:ss')}
                            </p>
                            <p className="text-xs text-gray-500">
                              Loại: {contract.type}
                            </p>
                          </div>
                        </div>
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(contract.url)}
                        >
                          Xóa
                        </Button>
                      </div>
                      <div className="break-all text-xs text-gray-600 mb-3">
                        {contract.url}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="primary"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => window.open(contract.url, '_blank')}
                        >
                          Xem
                        </Button>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = contract.url;
                            link.download = `hop-dong-${index + 1}.${contract.type?.includes('pdf') ? 'pdf' : 'jpg'}`;
                            link.click();
                          }}
                        >
                          Tải xuống
                        </Button>
                        <Button
                          size="small"
                          icon={<PrinterOutlined />}
                          onClick={() => window.open(contract.url, '_blank')}
                        >
                          In
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}
          
          {/* Backward compatibility - single contract */}
          {(!contractInfo.signed_contract_urls || contractInfo.signed_contract_urls.length === 0) && contractInfo.contract_url && (
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
