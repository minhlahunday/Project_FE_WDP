export interface User {
  id: string;
  email: string;
  name: string;
  role: "dealer_staff" | "dealer_manager" | "evm_staff" | "admin";
  dealerId?: string;
  dealerName?: string;
  dealership_id?: string;
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
  testDrives: string[];
  orders: string[];
  debt: number;
  lastPurchaseDate: string;
  totalSpent: number;
}

export interface TestDrive {
  id: string;
  customerId: string;
  vehicleId: string;
  scheduledDate: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

// Updated Order interface to match backend
export interface OrderItem {
  vehicle_id: string;
  vehicle_name?: string;
  vehicle_price?: number;
  color?: string;
  quantity: number;
  discount?: number;
  promotion_id?: string;
  options?: Array<{
    option_id: string;
    name: string;
    price: number;
  }>;
  accessories?: Array<{
    accessory_id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  final_amount: number;
  category?: string;
}

export interface Order {
  _id: string;
  code: string;
  customer_id:
    | string
    | {
        _id: string;
        full_name: string;
        email: string;
        phone: string;
        address: string;
      };
  dealership_id: string;
  salesperson_id?:
    | string
    | {
        _id: string;
        full_name: string;
        email: string;
      };
  items: OrderItem[];
  final_amount: number;
  paid_amount: number;
  payment_method: "cash" | "installment";
  status:
    | "pending"
    | "confirmed"
    | "halfPayment"
    | "fullyPayment"
    | "closed"
    | "cancelled";
  notes?: string;
  contract_signed?: boolean;
  contract_image_url?: string;
  createdAt: string;
  updatedAt: string;

  // Delivery information
  delivery?: {
    status: "pending" | "scheduled" | "in_transit" | "delivered" | "failed";
    scheduled_date?: string;
    actual_date?: string;
    delivery_person?: {
      name: string;
      phone: string;
      id_card: string;
    };
    delivery_address?: {
      street: string;
      ward: string;
      district: string;
      city: string;
      full_address: string;
    };
    recipient_info?: {
      name: string;
      phone: string;
      relationship: string;
    };
    delivery_notes?: string;
    signed_at?: string;
    signed_by?: string;
  };

  // Contract information
  contract?: {
    signed_contract_url?: string;
    signed_at?: string;
    signed_by?: string;
    uploaded_by?: string;
    template_used?: string;
  };

  // Populated fields from backend
  customer?: {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
  };
  salesperson?: {
    _id: string;
    full_name: string;
    email: string;
  };
  dealership?: {
    _id: string;
    name: string;
    address: string;
  };
}

// Quote interface
export interface Quote {
  _id: string;
  code: string;
  customer_id: string;
  items: OrderItem[];
  final_amount: number;
  notes?: string;
  valid_from: string;
  valid_to: string;
  status: "active" | "expired" | "converted";
  createdAt: string;
  updatedAt: string;

  // Populated fields
  customer?: {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

// Contract interface
export interface Contract {
  _id: string;
  order_id: string;
  contract_code: string;
  contract_pdf_url?: string;
  contract_image_url?: string;
  signed: boolean;
  signed_at?: string;
  created_at: string;
  updated_at: string;
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

// Order Request Types
export interface OrderRequestItem {
  vehicle_id: string;
  color?: string;
  quantity: number;
}

export interface OrderRequest {
  _id: string;
  code: string;
  dealer_staff_id: string;
  items: OrderRequestItem[];
  notes?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  // Populated fields
  dealer_staff?: {
    _id: string;
    full_name: string;
    email: string;
  };
}

export interface CreateOrderRequestData {
  items: OrderRequestItem[];
  notes?: string;
}

export interface OrderRequestSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: "pending" | "approved" | "rejected";
  startDate?: string;
  endDate?: string;
}
