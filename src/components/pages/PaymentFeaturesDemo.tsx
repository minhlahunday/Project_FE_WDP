import React, { useState } from 'react';
import { Card, Typography, Button, Space, Row, Col, Alert, Divider } from 'antd';
import { 
  CreditCardOutlined, 
  BankOutlined, 
  FilePdfOutlined, 
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

import { PaymentManagement } from './PaymentManagement';
import { BankProfileModal } from './BankProfileModal';
import { DebtTracking } from './DebtTracking';

const { Title, Text, Paragraph } = Typography;

interface PaymentFeaturesDemoProps {}

export const PaymentFeaturesDemo: React.FC<PaymentFeaturesDemoProps> = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankProfileModal, setShowBankProfileModal] = useState(false);
  const [showDebtTracking, setShowDebtTracking] = useState(false);

  // Mock order data
  const mockOrder = {
    _id: 'demo-order-001',
    code: 'ORD-DEMO-001',
    customer_id: 'CUST-001',
    customer: { full_name: 'Nguyễn Văn A' },
    dealership_id: 'DEALER-001',
    salesperson_id: 'STAFF-001',
    items: [
      {
        vehicle_id: 'VH-001',
        vehicle: { name: 'VinFast VF8', model: 'VF8 Plus' },
        quantity: 1,
        final_amount: 139806000
      }
    ],
    final_amount: 139806000,
    paid_amount: 0,
    payment_method: 'installment',
    status: 'confirmed',
    delivery: {
      address: '123 Đường ABC, Quận 1, TP.HCM',
      phone: '0901234567'
    },
    contract: {
      signed: false,
      signed_at: null
    },
    notes: 'Đơn hàng demo để test tính năng thanh toán',
    is_deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const features = [
    {
      id: 1,
      title: 'Ghi nhận thanh toán',
      description: 'Hỗ trợ cọc, trả thẳng, trả góp qua ngân hàng',
      icon: <CreditCardOutlined className="text-2xl text-blue-500" />,
      status: '✅ Hoàn thành',
      details: [
        '• Tiền mặt',
        '• Chuyển khoản ngân hàng', 
        '• QR Code',
        '• Thẻ tín dụng',
        '• Trả góp qua ngân hàng'
      ],
      action: () => setShowPaymentModal(true),
      actionText: 'Demo Thanh toán'
    },
    {
      id: 2,
      title: 'Gửi hồ sơ ngân hàng',
      description: 'Upload tài liệu cho trả góp qua ngân hàng',
      icon: <BankOutlined className="text-2xl text-green-500" />,
      status: '✅ Hoàn thành',
      details: [
        '• Thông tin tài khoản ngân hàng',
        '• Upload CMND/CCCD',
        '• Sao kê ngân hàng',
        '• Hợp đồng trả góp',
        '• Trạng thái duyệt hồ sơ'
      ],
      action: () => setShowBankProfileModal(true),
      actionText: 'Demo Hồ sơ ngân hàng'
    },
    {
      id: 3,
      title: 'Theo dõi trạng thái thanh toán',
      description: 'Real-time tracking trạng thái đơn hàng',
      icon: <ClockCircleOutlined className="text-2xl text-orange-500" />,
      status: '✅ Hoàn thành',
      details: [
        '• Progress bar thanh toán',
        '• Lịch sử thanh toán chi tiết',
        '• Cập nhật trạng thái real-time',
        '• Thông báo trạng thái',
        '• Audit trail'
      ],
      action: () => setShowPaymentModal(true),
      actionText: 'Demo Tracking'
    },
    {
      id: 4,
      title: 'Xuất hóa đơn PDF',
      description: 'Tự động tạo hóa đơn khi thanh toán đủ',
      icon: <FilePdfOutlined className="text-2xl text-red-500" />,
      status: '✅ Hoàn thành',
      details: [
        '• Tự động tạo khi thanh toán đủ',
        '• Download PDF về máy',
        '• Tên file theo mã đơn hàng',
        '• Thông tin đầy đủ khách hàng',
        '• Chữ ký số'
      ],
      action: () => setShowPaymentModal(true),
      actionText: 'Demo Hóa đơn'
    },
    {
      id: 5,
      title: 'Theo dõi công nợ',
      description: 'Dashboard quản lý công nợ toàn diện',
      icon: <DollarOutlined className="text-2xl text-purple-500" />,
      status: '✅ Hoàn thành',
      details: [
        '• Thống kê tổng công nợ',
        '• Đã thanh toán vs còn lại',
        '• Công nợ quá hạn',
        '• Progress tracking',
        '• Filter & search'
      ],
      action: () => setShowDebtTracking(true),
      actionText: 'Demo Công nợ'
    },
    {
      id: 6,
      title: 'Cập nhật trạng thái đơn hàng',
      description: 'Auto update status dựa trên thanh toán',
      icon: <CheckCircleOutlined className="text-2xl text-green-600" />,
      status: '✅ Hoàn thành',
      details: [
        '• confirmed → halfPayment',
        '• halfPayment → fullyPayment',
        '• Auto status transitions',
        '• Status logging',
        '• Notification system'
      ],
      action: () => setShowPaymentModal(true),
      actionText: 'Demo Status Update'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Title level={1} className="text-4xl font-bold text-gray-800 mb-4">
            🎯 Hệ Thống Thanh Toán VinFast EVM
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tất cả 6 tính năng thanh toán đã được implement đầy đủ và sẵn sàng sử dụng.
            Click vào các nút "Demo" để xem chi tiết từng tính năng.
          </Paragraph>
        </div>

        {/* Status Alert */}
        <Alert
          message="✅ Tất Cả Tính Năng Đã Hoàn Thành"
          description="Hệ thống thanh toán đã được tích hợp đầy đủ với backend API và có UI/UX chuyên nghiệp."
          type="success"
          showIcon
          className="mb-8"
        />

        {/* Features Grid */}
        <Row gutter={[24, 24]}>
          {features.map((feature) => (
            <Col xs={24} md={12} lg={8} key={feature.id}>
              <Card
                hoverable
                className="h-full border-2 border-gray-200 hover:border-blue-300 transition-all duration-300"
                bodyStyle={{ padding: '24px' }}
              >
                <div className="text-center mb-4">
                  {feature.icon}
                  <Title level={4} className="mt-3 mb-2">
                    {feature.title}
                  </Title>
                  <Text type="secondary" className="block mb-3">
                    {feature.description}
                  </Text>
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                    {feature.status}
                  </div>
                </div>

                <Divider />

                <div className="mb-4">
                  <Text strong className="block mb-2">Tính năng:</Text>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {feature.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>

                <Button
                  type="primary"
                  block
                  onClick={feature.action}
                  className="mt-4"
                >
                  {feature.actionText}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Technical Details */}
        <Card className="mt-8" title="🔧 Chi Tiết Kỹ Thuật">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Title level={5}>Frontend Components:</Title>
              <ul className="text-sm space-y-1">
                <li>• PaymentManagement.tsx - Xử lý thanh toán</li>
                <li>• BankProfileModal.tsx - Hồ sơ ngân hàng</li>
                <li>• DebtTracking.tsx - Theo dõi công nợ</li>
                <li>• PaymentManagementPage.tsx - Trang chính</li>
                <li>• paymentService.ts - API service</li>
              </ul>
            </Col>
            <Col xs={24} md={12}>
              <Title level={5}>Backend APIs:</Title>
              <ul className="text-sm space-y-1">
                <li>• POST /api/payments - Tạo thanh toán</li>
                <li>• GET /api/payments/order/:id - Lịch sử</li>
                <li>• POST /api/bank-profiles - Hồ sơ ngân hàng</li>
                <li>• GET /api/debts/customer/:id - Công nợ</li>
                <li>• POST /api/orders/:id/generate-invoice - Hóa đơn</li>
              </ul>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Modals */}
      <PaymentManagement
        visible={showPaymentModal}
        order={mockOrder}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          // Show success message
        }}
      />

      <BankProfileModal
        visible={showBankProfileModal}
        order={mockOrder}
        onClose={() => setShowBankProfileModal(false)}
        onSuccess={() => {
          setShowBankProfileModal(false);
          // Show success message
        }}
      />

      {showDebtTracking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <Title level={4} className="!mb-0">Theo Dõi Công Nợ</Title>
              <Button onClick={() => setShowDebtTracking(false)}>Đóng</Button>
            </div>
            <div className="p-4">
              <DebtTracking />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFeaturesDemo;
