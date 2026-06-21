export type Role = 'CUSTOMER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'WALLET' | 'COD';
export type TransactionType = 'CREDIT' | 'DEBIT' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type AddressType = 'HOME' | 'WORK' | 'OTHER';
export interface User {
    id: string;
    phone: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    role: Role;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Address {
    id: string;
    userId: string;
    label: string;
    type: AddressType;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    lat?: number;
    lng?: number;
    isDefault: boolean;
    createdAt: string;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    _count?: {
        products: number;
    };
}
export interface Product {
    id: string;
    categoryId: string;
    category?: Category;
    name: string;
    slug: string;
    description?: string;
    images: string[];
    mrp: number;
    price: number;
    unit: string;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    tags: string[];
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    discountPercent?: number;
}
export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    product: Product;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}
export interface Cart {
    id: string;
    userId: string;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}
export interface CartSummary {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    itemCount: number;
    isFreeDelivery: boolean;
    freeDeliveryThreshold: number;
}
export interface CartWithItems extends Cart {
    summary: CartSummary;
}
export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productImage?: string;
    unit: string;
    quantity: number;
    mrp: number;
    price: number;
    total: number;
}
export interface OrderTimeline {
    id: string;
    orderId: string;
    status: OrderStatus;
    message?: string;
    createdAt: string;
}
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    addressId: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    couponCode?: string;
    notes?: string;
    estimatedAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    address?: Address;
    items?: OrderItem[];
    timeline?: OrderTimeline[];
}
export interface OrderSummary {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    itemCount: number;
    createdAt: string;
}
export interface Wallet {
    id: string;
    userId: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
}
export interface WalletTransaction {
    id: string;
    walletId: string;
    orderId?: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}
export interface Banner {
    id: string;
    title: string;
    imageUrl: string;
    deepLink?: string;
    isActive: boolean;
    sortOrder: number;
    startsAt?: string;
    endsAt?: string;
    createdAt: string;
}
export interface Coupon {
    id: string;
    code: string;
    description: string;
    discountType: 'FLAT' | 'PERCENT';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
    createdAt: string;
}
export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: 'ORDER_UPDATE' | 'WALLET' | 'PROMO';
    data?: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
}
export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export interface AdminStats {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    activeProducts: number;
    todayOrders: number;
    todayRevenue: number;
}
export interface Tokens {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}
