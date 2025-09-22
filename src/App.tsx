import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { Layout } from './components/common/Layout';
import { CarDetail } from './components/pages/car/CarDetail';
import { CarProduct } from './components/pages/car/CarProduct';
import { CompareModels } from './components/pages/car/CompareModels';
import { ModelSelector } from './components/pages/car/ModelSelector';
import { TestDrive } from './components/pages/car/TestDrive';
import { Motorbike } from './components/pages/motorbike/Motorbike';
import { MotorbikeDetail } from './components/pages/motorbike/MotorbikeDetail';
import { CompareMotorbikes } from './components/pages/motorbike/CompareMotorbikes';
import { MotorbikeModelSelector } from './components/pages/motorbike/MotorbikeModelSelector';
import { MotorbikeDeposit } from './components/pages/motorbike/MotorbikeDeposit';
import { MotorbikeSchedule } from './components/pages/motorbike/MotorbikeSchedule';
import { AdminProductManagement } from './components/admin/AdminProductManagement';
import { AdminDealerManagement } from './components/admin/AdminDealerManagement';
import Inventory from './components/admin/Inventory';
import { ProductManagement } from './components/admin/ProductManagement';
import { Reports } from './components/admin/Reports';
import { Forecasting } from './components/admin/Forecasting';
import { CarDeposit } from './components/pages/car/CarDeposit';

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
      <Route path="/portal/motorbike-detail/:id" element={<MotorbikeDetail />} />
      <Route path="/portal/compare-motorbikes" element={<CompareMotorbikes />} />
      <Route path="/portal/motorbike-model-selector" element={<MotorbikeModelSelector />} />
      <Route path="/portal/motorbike-deposit" element={<MotorbikeDeposit />} />
      <Route path="/portal/motorbike-schedule" element={<MotorbikeSchedule />} />
      <Route path="/portal/deposit" element={<CarDeposit />} />
      
      {/* Admin routes */}
      <Route path="/admin/product-management" element={<AdminProductManagement />} />
      <Route path="/admin/dealer-management" element={<AdminDealerManagement />} />
      
      {/* Section routes */}
      <Route path="/sections/inventory" element={<Inventory />} />
      <Route path="/sections/product-management" element={<ProductManagement />} />
      <Route path="/sections/reports" element={<Reports />} />
      <Route path="/sections/forecasting" element={<Forecasting />} />
      <Route path="/sections/sales" element={<Dashboard />} />
      <Route path="/sections/customers" element={<Dashboard />} />
      <Route path="/sections/orders" element={<Dashboard />} />
      <Route path="/sections/payments" element={<Dashboard />} />
      <Route path="/sections/feedback" element={<Dashboard />} />
      <Route path="/sections/pricing" element={<Dashboard />} />
      <Route path="/car-deposit" element={<CarDeposit />} />
      
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