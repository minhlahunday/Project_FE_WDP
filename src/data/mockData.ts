import { Vehicle, Customer, TestDrive, Order, Dealer, Promotion } from '../types';

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    model: 'Vinfast VF 8',
    version: 'Premium',
    color: 'Đỏ',
    price: 1200000000,
    wholesalePrice: 750000000,
    range: 450,
    maxSpeed: 200,
    chargingTime: '8 giờ',
    features: ['Autopilot', 'Màn hình cảm ứng 17"', 'Sạc nhanh', 'Camera 360'],
    images: ['https://vinfastotominhdao.vn/wp-content/uploads/VinFast-VF8-1.jpg'],
    stock: 15,
    description: 'Xe điện cao cấp với công nghệ tiên tiến'
  },
  {
    id: '2',
    model: 'Vinfast VF 9',
    version: 'Standard',
    color: 'Xanh lá đậm',
    price: 2000000000,
    wholesalePrice: 580000000,
    range: 500,
    maxSpeed: 180,
    chargingTime: '6 giờ',
    features: ['Tự động đỗ xe', 'Màn hình 12"', 'Sạc nhanh'],
    images: ['https://vinfastotominhdao.vn/wp-content/uploads/VinFast-VF9-9.jpg'],
    stock: 25,
    description: 'Xe điện phổ thông với tính năng cơ bản'
  },
  {
    id: '3',
    model: 'Vinfast VF 7',
    version: 'Premium',
    color: 'Xanh xám',
    price: 850000000,
    wholesalePrice: 750000000,
    range: 500,
    maxSpeed: 200,
    chargingTime: '8 giờ',
    features: ['Autopilot', 'Màn hình cảm ứng 17"', 'Sạc nhanh', 'Camera 360'],
    images: ['https://media.vov.vn/sites/default/files/styles/large/public/2024-06/a1_8.jpg'],
    stock: 15,
    description: 'Xe điện cao cấp với công nghệ tiên tiến'
  },
  {
    id: '4',
    model: 'Vinfast VF 6',
    version: 'Premium',
    color: 'Cam',
    price: 610000000,
    wholesalePrice: 750000000,
    range: 500,
    maxSpeed: 200,
    chargingTime: '8 giờ',
    features: ['Autopilot', 'Màn hình cảm ứng 17"', 'Sạc nhanh', 'Camera 360'],
    images: ['https://vinfastyenbai.com.vn/wp-content/uploads/2024/07/vinfastyenbai-com-vn-KNZod2y9Bz.jpg'],
    stock: 15,
    description: 'Xe điện cao cấp với công nghệ tiên tiến'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@email.com',
    phone: '0901234567',
    address: 'Hà Nội',
    testDrives: [],
    orders: []
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    email: 'binh.tran@email.com',
    phone: '0902345678',
    address: 'TP.HCM',
    testDrives: [],
    orders: []
  }
];

export const mockDealers: Dealer[] = [
  {
    id: 'dealer1',
    name: 'Đại lý Hà Nội',
    address: '123 Nguyễn Trãi, Hà Nội',
    manager: 'Trần Thị B',
    phone: '0241234567',
    email: 'hanoi@dealer.com',
    target: 1000000000,
    currentSales: 750000000,
    debt: 50000000
  },
  {
    id: 'dealer2',
    name: 'Đại lý TP.HCM',
    address: '456 Lê Lợi, TP.HCM',
    manager: 'Lê Văn C',
    phone: '0281234567',
    email: 'hcm@dealer.com',
    target: 1200000000,
    currentSales: 900000000,
    debt: 30000000
  }
];

export const mockPromotions: Promotion[] = [
  {
    id: '1',
    title: 'Khuyến mãi tháng 12',
    description: 'Giảm 50 triệu cho mọi mẫu xe',
    discount: 50000000,
    validFrom: '2024-12-01',
    validTo: '2024-12-31',
    applicableVehicles: ['1', '2']
  }
];

export const mockOrders: Order[] = [
  {
    id: '1',
    customerId: '1',
    vehicleId: '1',
    dealerId: 'dealer1',
    status: 'pending',
    totalAmount: 800000000,
    paymentMethod: 'installment',
    createdAt: '2024-12-15T10:00:00Z',
    deliveryDate: '2024-12-25'
  }
];