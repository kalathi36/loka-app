export type UserRole = 'admin' | 'worker' | 'customer';
export type OrderStatus = 'pending' | 'approved' | 'out_for_delivery' | 'delivered';

export interface OrganizationSummary {
  _id: string;
  name: string;
  code: string;
}

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: UserRole;
  organization: OrganizationSummary | null;
}

export interface AttendanceRecord {
  _id: string;
  workerId: User | string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  dailyWage: number;
}

export interface WorkerEarnings {
  totalDaysWorked: number;
  totalEarnings: number;
  totalPaid: number;
  outstandingBalance: number;
  dailyEarnings: AttendanceRecord[];
}

export interface WorkerPayment {
  _id: string;
  workerId: User | string;
  date: string;
  amountPaid: number;
  notes?: string;
  createdAt: string;
}

export interface WorkerPaymentSummary {
  worker: User;
  totalDaysWorked: number;
  totalWages: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  product?: Product | string;
  name: string;
  price: number;
  quantity: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface Order {
  _id: string;
  customerId: User | string;
  items: OrderItem[];
  status: OrderStatus;
  assignedWorker?: User | string | null;
  totalAmount: number;
  deliveryProof?: string;
  notes?: string;
  deliveryAddress?: string;
  deliveryLocation?: LocationPoint;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  totalProducts: number;
  totalWorkers: number;
  totalCustomers: number;
  totalOrders: number;
  totalWorkerCost: number;
  totalPaidToWorkers: number;
  deliveredRevenue: number;
  outstandingPayments: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: Order[];
}

export interface AdminDashboard {
  totalCustomers: number;
  totalWorkers: number;
  totalOrders: number;
  totalWorkerCost: number;
  totalPaidToWorkers: number;
  recentOrders: Order[];
  ordersByStatus: Record<OrderStatus, number>;
}

export interface ProductInsightSummary {
  totalProducts: number;
  totalCategories: number;
  totalUnitsInStock: number;
  inventoryValue: number;
  averagePrice: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalUnitsSold: number;
  orderedValue: number;
}

export interface ProductCategoryInsight {
  category: string;
  productCount: number;
  stockUnits: number;
  inventoryValue: number;
  averagePrice: number;
}

export interface ProductSalesInsight {
  productId?: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  imageUrl?: string;
  unitsSold: number;
  orderCount: number;
  revenue: number;
}

export interface ProductInventoryInsight {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductInsights {
  summary: ProductInsightSummary;
  categoryBreakdown: ProductCategoryInsight[];
  topSelling: ProductSalesInsight[];
  lowStockProducts: ProductInventoryInsight[];
  newestProducts: ProductInventoryInsight[];
}

export interface PaymentDashboard {
  workerSummaries: WorkerPaymentSummary[];
  paymentHistory: WorkerPayment[];
  totals: {
    totalWages: number;
    totalPaid: number;
    outstandingBalance: number;
  };
}

export interface WorkerLocation extends LocationPoint {
  workerId: string;
  workerName: string;
  phone: string;
  timestamp: string;
}

export interface ChatMessage {
  _id: string;
  roomKey: string;
  sender: User;
  receiver: User;
  message: string;
  createdAt: string;
}

export interface ChatThread {
  roomKey: string;
  partner: User;
  lastMessage?: ChatMessage | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
