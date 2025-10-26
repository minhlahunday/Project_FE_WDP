import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { Layout } from "./components/common/Layout";
import { CarDetail } from "./components/pages/car/CarDetail";
import { CarProduct } from "./components/pages/car/CarProduct";
import { CompareModels } from "./components/pages/car/CompareModels";
import { ModelSelector } from "./components/pages/car/ModelSelector";
import { TestDrive } from "./components/pages/car/TestDrive";
import { Motorbike } from "./components/pages/motorbike/Motorbike";
import { MotorbikeDetail } from "./components/pages/motorbike/MotorbikeDetail";
import { CompareMotorbikes } from "./components/pages/motorbike/CompareMotorbikes";
import { MotorbikeModelSelector } from "./components/pages/motorbike/MotorbikeModelSelector";
import { MotorbikeDeposit } from "./components/pages/motorbike/MotorbikeDeposit";
import { MotorbikeSchedule } from "./components/pages/motorbike/MotorbikeSchedule";

import { AdminStaffManagement } from "./components/pages/admin/AdminStaffManagement";

import { CarDeposit } from "./components/pages/car/CarDeposit";
import { StaffManagement } from "./components/pages/DealerManager/StaffManagement";
import ProductManagement from "./components/pages/EVM/ProductManagement";
import { CustomerManagement } from "./components/pages/EVM/CustomerManagement";
import { AdminDealerManagement } from "./components/pages/EVM/DealerManagement";
import { AddDealer } from "./components/pages/EVM/AddDealer";
import InventoryManagement from "./components/pages/EVM/InventoryManagement";
import PromotionManagement from "./components/pages/EVM/PromotionManagement";
import RequestManagement from "./components/pages/EVM/RequestManagement";
import ManufacturerDebtManagement from "./components/pages/EVM/ManufacturerDebtManagement";
import { DealerInfo } from "./components/pages/DealerManager/DealerInfo";
import { PromotionsDashboard } from "./components/PromotionsDashboard";
import { SalesManagement } from "./components/pages/Dealerstaff/SalesManagementNew";
import { QuotationManagement } from "./components/pages/Dealerstaff/QuotationManagement";
import TestAPI from "./components/pages/TestAPI";

// Order Management Components
import { OrderManagement } from "./components/pages/OrderManagement";
import { OrderDetailMUI } from "./components/pages/OrderDetailMUI";
import { QuoteToOrderPageMUI } from "./components/pages/QuoteToOrderPageMUI";
import { PaymentManagementPage } from "./components/pages/PaymentManagementPage";
import DebtManagement from "./components/pages/DebtManagement";
import { OrderRequestManagement } from "./components/pages/OrderRequestManagement";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }
  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      {/* Portal routes */}
      <Route path="/portal/car-detail/:id" element={<CarDetail />} />
      <Route path="/portal/car-product" element={<CarProduct />} />
      <Route path="/portal/compare-models" element={<CompareModels />} />
      <Route path="/portal/model-selector" element={<ModelSelector />} />
      <Route path="/portal/test-drive" element={<TestDrive />} />
      <Route path="/portal/motorbike-product" element={<Motorbike />} />
      <Route
        path="/portal/motorbike-detail/:id"
        element={<MotorbikeDetail />}
      />
      <Route
        path="/portal/compare-motorbikes"
        element={<CompareMotorbikes />}
      />
      <Route
        path="/portal/motorbike-model-selector"
        element={<MotorbikeModelSelector />}
      />
      <Route path="/portal/motorbike-deposit" element={<MotorbikeDeposit />} />
      <Route
        path="/portal/motorbike-schedule"
        element={<MotorbikeSchedule />}
      />
      <Route path="/portal/deposit" element={<CarDeposit />} />
      <Route path="/portal/staff-management" element={<StaffManagement />} />
      <Route path="/portal/promotions" element={<PromotionsDashboard />} />
      <Route path="/portal/dealer-info" element={<DealerInfo />} />
      <Route path="/portal/sales" element={<SalesManagement />} />
      <Route path="/portal/quotations" element={<QuotationManagement />} />

      {/* Admin routes */}

      <Route
        path="/admin/admin-staff-management"
        element={<AdminStaffManagement />}
      />

      {/* Section routes */}

      <Route path="/sections/sales" element={<Dashboard />} />
      <Route path="/sections/customers" element={<Dashboard />} />
      <Route path="/sections/orders" element={<Dashboard />} />
      <Route path="/sections/payments" element={<Dashboard />} />
      <Route path="/sections/feedback" element={<Dashboard />} />
      <Route path="/sections/pricing" element={<Dashboard />} />
      <Route path="/car-deposit" element={<CarDeposit />} />

      {/* Order Management Routes */}
      <Route path="/portal/orders" element={<OrderManagement />} />
      <Route path="/portal/orders/:orderId" element={<OrderDetailMUI />} />
      <Route
        path="/portal/order-requests"
        element={<OrderRequestManagement />}
      />
      <Route path="/portal/quote-to-order" element={<QuoteToOrderPageMUI />} />
      <Route path="/portal/payments" element={<PaymentManagementPage />} />
      <Route path="/portal/debt-management" element={<DebtManagement />} />
      <Route path="/portal/test-api" element={<TestAPI />} />

      {/* EVM routes */}
      <Route
        path="/evm/dealer-management"
        element={<AdminDealerManagement />}
      />
      <Route
        path="/admin/dealer-management"
        element={<AdminDealerManagement />}
      />
      <Route path="/admin/dealer-management/add" element={<AddDealer />} />
      <Route path="/evm/product-management" element={<ProductManagement />} />
      <Route path="/evm/customer-management" element={<CustomerManagement />} />
      <Route
        path="/evm/inventory-management"
        element={<InventoryManagement />}
      />
      <Route
        path="/evm/promotion-management"
        element={<PromotionManagement />}
      />
      <Route
        path="/evm/request-management"
        element={<RequestManagement />}
      />
      <Route
        path="/evm/manufacturer-debt-management"
        element={<ManufacturerDebtManagement />}
      />

      {/* Default route */}
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <AppContent />
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
