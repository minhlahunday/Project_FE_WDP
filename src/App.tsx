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
import { CompareMotorbikes } from './components/pages/car/CompareMotorbikes';
import { MotorbikeDeposit } from './components/pages/motorbike/MotorbikeDeposit';
import { MotorbikeSchedule } from './components/pages/motorbike/MotorbikeSchedule';

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
      <Route path="/portal/car-detail/:id" element={<CarDetail />} />
      <Route path="/portal/car-product" element={<CarProduct />} />
      <Route path="/portal/compare-models" element={<CompareModels />} />
      <Route path="/portal/model-selector" element={<ModelSelector />} />
      <Route path="/portal/test-drive" element={<TestDrive />} />
      <Route path="/portal/motorbike-product" element={<Motorbike />} />
      <Route path="/portal/motorbike-detail/:id" element={<MotorbikeDetail />} />
      <Route path="/portal/compare-motorbikes" element={<CompareMotorbikes />} />
      <Route path="/portal/motorbike-deposit" element={<MotorbikeDeposit />} />
      <Route path="/portal/motorbike-schedule" element={<MotorbikeSchedule />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <AppContent />
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;