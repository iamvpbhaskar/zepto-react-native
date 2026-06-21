"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECENTLY_VIEWED_LIMIT = exports.SEARCH_DEBOUNCE_MS = exports.APP_TAGLINE = exports.APP_NAME = exports.ORDER_STATUS_COLORS = exports.ORDER_STATUS_LABELS = exports.CANCELLABLE_STATUSES = exports.ORDER_STATUS_FLOW = exports.CACHE_TTL_WALLET = exports.CACHE_TTL_CATEGORIES = exports.CACHE_TTL_FEATURED_PRODUCTS = exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.DEFAULT_PAGE = exports.ACCESS_TOKEN_EXPIRY_MINUTES = exports.REFRESH_TOKEN_EXPIRY_DAYS = exports.OTP_DEV = exports.OTP_EXPIRY_SECONDS = exports.WALLET_MAX_TOPUP = exports.WALLET_MIN_TOPUP = exports.DELIVERY_FEE = exports.FREE_DELIVERY_THRESHOLD = void 0;
// ─── PRICING ─────────────────────────────────────────────
exports.FREE_DELIVERY_THRESHOLD = 199; // ₹199 and above = free delivery
exports.DELIVERY_FEE = 29; // ₹29 delivery fee below threshold
exports.WALLET_MIN_TOPUP = 10; // ₹10 minimum wallet top-up
exports.WALLET_MAX_TOPUP = 10000; // ₹10,000 maximum wallet top-up
// ─── AUTH ────────────────────────────────────────────────
exports.OTP_EXPIRY_SECONDS = 60;
exports.OTP_DEV = '123456'; // Mock OTP for development
exports.REFRESH_TOKEN_EXPIRY_DAYS = 7;
exports.ACCESS_TOKEN_EXPIRY_MINUTES = 15;
// ─── PAGINATION ──────────────────────────────────────────
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_LIMIT = 20;
exports.MAX_LIMIT = 50;
// ─── CACHE TTL (seconds) ─────────────────────────────────
exports.CACHE_TTL_FEATURED_PRODUCTS = 300; // 5 min
exports.CACHE_TTL_CATEGORIES = 600; // 10 min
exports.CACHE_TTL_WALLET = 30; // 30 sec
// ─── ORDER STATUS FLOW ───────────────────────────────────
exports.ORDER_STATUS_FLOW = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PACKED', 'CANCELLED'],
    PACKED: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
};
exports.CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];
// ─── ORDER STATUS LABELS ─────────────────────────────────
exports.ORDER_STATUS_LABELS = {
    PENDING: 'Order Placed',
    CONFIRMED: 'Order Confirmed',
    PACKED: 'Packed',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
};
exports.ORDER_STATUS_COLORS = {
    PENDING: '#F59E0B',
    CONFIRMED: '#3B82F6',
    PACKED: '#8B5CF6',
    OUT_FOR_DELIVERY: '#F97316',
    DELIVERED: '#10B981',
    CANCELLED: '#EF4444',
    REFUNDED: '#6B7280',
};
// ─── APP ─────────────────────────────────────────────────
exports.APP_NAME = 'Zepto';
exports.APP_TAGLINE = '10-minute grocery delivery';
exports.SEARCH_DEBOUNCE_MS = 300;
exports.RECENTLY_VIEWED_LIMIT = 10;
//# sourceMappingURL=index.js.map