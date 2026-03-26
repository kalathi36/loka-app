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

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
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
  deliveredRevenue: number;
  outstandingPayments: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: Order[];
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

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
