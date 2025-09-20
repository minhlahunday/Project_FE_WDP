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
    images: ['https://vinFastotominhdao.vn/wp-content/uploads/VinFast-VF8-1.jpg'],
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
    images: ['https://vinFastotominhdao.vn/wp-content/uploads/VinFast-VF9-9.jpg'],
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
    images: ['https://vinFastyenbai.com.vn/wp-content/uploads/2024/07/vinfastyenbai-com-vn-KNZod2y9Bz.jpg'],
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
    orders: [],
    debt: 15000000,
    lastPurchaseDate: '2024-06-15',
    totalSpent: 1200000000,
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    email: 'binh.tran@email.com',
    phone: '0902345678',
    address: 'TP.HCM',
    testDrives: [],
    orders: [],
    debt: 0,
    lastPurchaseDate: '2024-05-20',
    totalSpent: 2000000000,
  },
  {
    id: '3',
    name: 'Lê Hoàng Dũng',
    email: 'dung.le@email.com',
    phone: '0912345679',
    address: 'Đà Nẵng',
    testDrives: [],
    orders: [],
    debt: 5000000,
    lastPurchaseDate: '2024-07-01',
    totalSpent: 850000000,
  },
  {
    id: '4',
    name: 'Phạm Mỹ Linh',
    email: 'linh.pham@email.com',
    phone: '0987654321',
    address: 'Hải Phòng',
    testDrives: [],
    orders: [],
    debt: 0,
    lastPurchaseDate: '2024-07-10',
    totalSpent: 610000000,
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

export const mockMotorbikes: Vehicle[] = [
  {
    id: 'mb1',
    model: 'Vinfast Theon',
    version: 'Cao cấp',
    color: 'Đỏ',
    price: 69900000,
    wholesalePrice: 50000000,
    range: 101,
    maxSpeed: 99,
    chargingTime: '6 giờ',
    features: ['Động cơ 4200W', 'Pin LFP 3.5 kWh', 'Phanh ABS', 'Khóa thông minh'],
    images: ['https://product.hstatic.net/200000960063/product/theon_transparent_back__2__c41cadb55bd74375a9941617e409ff7f_master.png'],
    stock: 50,
    description: 'Xe máy điện cao cấp dành cho đô thị'
  },
  {
    id: 'mb2',
    model: 'Vinfast Klara S',
    version: 'Tiêu chuẩn',
    color: 'Xanh',
    price: 39900000,
    wholesalePrice: 30000000,
    range: 120,
    maxSpeed: 78,
    chargingTime: '5 giờ',
    features: ['Động cơ 1500W', 'Pin Lithium 2.9 kWh', 'Đèn LED', 'Cốp rộng'],
    images: ['https://vinFastquangninh.com.vn/wp-content/uploads/2022/09/BUW.png'],
    stock: 75,
    description: 'Xe máy điện thông minh cho mọi người'
  },
  {
    id: 'mb3',
    model: 'Vinfast Feliz',
    version: 'Tiêu chuẩn',
    color: 'Trắng',
    price: 29900000,
    wholesalePrice: 22000000,
    range: 90,
    maxSpeed: 60,
    chargingTime: '4 giờ',
    features: ['Động cơ 1200W', 'Pin Lithium 2.4 kWh', 'Phanh đĩa', 'Khóa từ'],
    images: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfoJs4ft2hXjGGZy-XpjmX2KWQ3jSWq3QNcg&s'],
    stock: 100,
    description: 'Xe máy điện phân khúc phổ thông'
  },
  {
    id: 'mb4',
    model: 'Vinfast Evo200',
    version: 'Lite',
    color: 'Đen',
    price: 22000000,
    wholesalePrice: 16000000,
    range: 80,
    maxSpeed: 50,
    chargingTime: '4 giờ',
    features: ['Động cơ 1000W', 'Pin Lithium 1.8 kWh', 'Phanh cơ', 'Khóa điện'],
    images: ['https://shop.vinFastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw91eed064/images/PDP-XMD/evo200/img-pin.png'],
    stock: 120,
    description: 'Xe máy điện giá rẻ cho sinh viên'
  }
];