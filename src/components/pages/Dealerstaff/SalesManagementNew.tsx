import React, { useState } from 'react';
import { Tabs, Button, Card } from 'antd';
import { 
  FileTextOutlined, 
  ShoppingOutlined, 
  ContainerOutlined, 
  TruckOutlined,
  PlusOutlined 
} from '@ant-design/icons';

// Import components from the pages folder
import { OrderManagement } from '../OrderManagement';
import { PaymentManagementPage } from '../PaymentManagementPage';
import QuoteToOrderPageMUI from '../QuoteToOrderPageMUI';

const { TabPane } = Tabs;

export const SalesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');

  // Quote management component - using QuoteToOrderPage
  const QuotesTab = () => <QuoteToOrderPageMUI />;

  // Contract management component - using PaymentManagementPage for now
  const ContractsTab = () => <PaymentManagementPage />;

  // Delivery tracking component - placeholder for now
  const DeliveryTab = () => (
    <Card>
      <div className="text-center py-8">
        <TruckOutlined className="text-4xl text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Theo dõi giao xe</h3>
        <p className="text-gray-500 mb-4">Tính năng theo dõi giao xe đang được phát triển</p>
        <Button type="primary" icon={<PlusOutlined />}>
          Theo dõi giao hàng
        </Button>
      </div>
    </Card>
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bán hàng</h1>
          <p className="text-gray-600 mt-1">
            Quản lý đơn hàng, chuyển báo giá, thanh toán và giao hàng
          </p>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        size="large"
        className="sales-management-tabs"
      >
        <TabPane 
          tab={
            <span>
              <ShoppingOutlined />
              Đơn hàng
            </span>
          } 
          key="orders"
        >
          <OrderManagement />
        </TabPane>

        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              Chuyển báo giá
            </span>
          } 
          key="quotes"
        >
          <QuotesTab />
        </TabPane>

        <TabPane 
          tab={
            <span>
              <ContainerOutlined />
              Thanh toán
            </span>
          } 
          key="payments"
        >
          <ContractsTab />
        </TabPane>

        <TabPane 
          tab={
            <span>
              <TruckOutlined />
              Giao hàng
            </span>
          } 
          key="delivery"
        >
          <DeliveryTab />
        </TabPane>
      </Tabs>

      <style>{`
        .sales-management-tabs .ant-tabs-tab {
          font-weight: 500;
        }
        
        .sales-management-tabs .ant-tabs-tab-active {
          font-weight: 600;
        }
        
        .sales-management-tabs .ant-tabs-content-holder {
          padding-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default SalesManagement;