export interface User {
  id: string;
  email: string;
  name: string;
  role: 'dealer_staff' | 'dealer_manager' | 'evm_staff' | 'admin';
  dealerId?: string;
  dealerName?: string;
}

export interface Vehicle {
  id: string;
  model: string;
  version: string;
  color: string;
  price: number;
  wholesalePrice?: number;
  range: number;
  maxSpeed: number;
  chargingTime: string;
  features: string[];
  images: string[];
  stock: number;
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  testDrives: TestDrive[];
  orders: Order[];
}

export interface TestDrive {
  id: string;
  customerId: string;
  vehicleId: string;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  vehicleId: string;
  dealerId?: string;
  status: 'quote' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentMethod: 'cash' | 'installment';
  createdAt: string;
  deliveryDate?: string;
}

export interface Dealer {
  id: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  email: string;
  target: number;
  currentSales: number;
  debt: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  validFrom: string;
  validTo: string;
  applicableVehicles: string[];
}