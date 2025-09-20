export interface Vehicle {
  id: string;
  model: string;
  version: string;
  color: string;
  price: number;
  wholesalePrice: number;
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
  testDrives: TestDrive[];
  orders: Order[];
  debt?: number;
  lastPurchaseDate?: string;
  totalSpent?: number;
}

export interface TestDrive {
  id: string;
  customerId: string;
  vehicleId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface Order {
  id: string;
  customerId: string;
  vehicleId: string;
  dealerId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  deliveryDate: string;
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