"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatDateShort = formatDateShort;
exports.timeAgo = timeAgo;
exports.calcSubtotal = calcSubtotal;
exports.calcDeliveryFee = calcDeliveryFee;
exports.calcDiscount = calcDiscount;
exports.calcCartSummary = calcCartSummary;
exports.calcDiscountPercent = calcDiscountPercent;
exports.generateSlug = generateSlug;
exports.generateOrderNumber = generateOrderNumber;
exports.isValidPhone = isValidPhone;
exports.isValidPincode = isValidPincode;
exports.getPaginationMeta = getPaginationMeta;
const config_1 = require("@zepto/config");
// ─── CURRENCY ────────────────────────────────────────────
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}
// ─── DATES ───────────────────────────────────────────────
function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}
function formatDateShort(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}
function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
// ─── CART PRICING ────────────────────────────────────────
function calcSubtotal(items) {
    return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
}
function calcDeliveryFee(subtotal) {
    return subtotal >= config_1.FREE_DELIVERY_THRESHOLD ? 0 : config_1.DELIVERY_FEE;
}
function calcDiscount(couponType, couponValue, subtotal, maxDiscount) {
    let discount;
    if (couponType === 'FLAT') {
        discount = couponValue;
    }
    else {
        discount = Math.round((subtotal * couponValue) / 100);
    }
    if (maxDiscount)
        discount = Math.min(discount, maxDiscount);
    return Math.min(discount, subtotal);
}
function calcCartSummary(items, couponDiscount = 0) {
    const subtotal = calcSubtotal(items);
    const deliveryFee = calcDeliveryFee(subtotal);
    const discount = couponDiscount;
    const total = subtotal + deliveryFee - discount;
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    return {
        subtotal,
        deliveryFee,
        discount,
        total: Math.max(0, total),
        itemCount,
        isFreeDelivery: subtotal >= config_1.FREE_DELIVERY_THRESHOLD,
        freeDeliveryThreshold: config_1.FREE_DELIVERY_THRESHOLD,
    };
}
// ─── PRODUCT ─────────────────────────────────────────────
function calcDiscountPercent(mrp, price) {
    if (!mrp || mrp <= price)
        return 0;
    return Math.round(((mrp - price) / mrp) * 100);
}
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
// ─── ORDER ───────────────────────────────────────────────
function generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, '0');
    return `ZPT-${dateStr}-${random}`;
}
// ─── VALIDATION ──────────────────────────────────────────
function isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}
function isValidPincode(pincode) {
    return /^\d{6}$/.test(pincode);
}
// ─── PAGINATION ──────────────────────────────────────────
function getPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
    };
}
//# sourceMappingURL=index.js.map