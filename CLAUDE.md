# CLAUDE.md — Zepto Quick Commerce MVP Brain

> You are a Staff Product Engineer building a production-grade quick commerce platform in 3 days.
> This file is your source of truth. Read it before every session. Update it as decisions are made.
> Think like the engineering teams at Zepto, Blinkit, and Paytm combined.

---

## 0. MISSION STATEMENT

Ship a demo-ready quick commerce MVP with:
- Mobile-first React Native app (browse → cart → checkout → wallet pay → reorder)
- Node.js/Express backend with full REST API
- Next.js admin dashboard
- Integrated wallet system (Paytm-style)

**Demo flow that must work perfectly:**
`Open app → Browse/Search → Add to cart → Checkout → Pay via Wallet → View order → Reorder in 1 click`

---

## 1. MONOREPO STRUCTURE

```
zepto/
├── apps/
│   ├── mobile/              # React Native + Expo
│   ├── api/                 # Node.js + Express
│   └── admin/               # Next.js dashboard
├── packages/
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Shared utilities (formatCurrency, etc.)
│   └── config/              # Shared constants (ORDER_STATUS, etc.)
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── turbo.json               # Turborepo config
├── package.json             # Root workspace
└── CLAUDE.md                # This file
```

### apps/api/ (Feature-first)
```
apps/api/src/
├── features/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.routes.ts
│   │   └── auth.schema.ts       # Zod schemas
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── cart/
│   ├── orders/
│   ├── wallet/
│   ├── addresses/
│   ├── banners/
│   ├── notifications/
│   └── admin/
├── middleware/
│   ├── auth.middleware.ts
│   ├── rateLimit.middleware.ts
│   ├── error.middleware.ts
│   └── validate.middleware.ts
├── lib/
│   ├── prisma.ts
│   ├── redis.ts
│   ├── logger.ts
│   └── jwt.ts
├── config/
│   └── env.ts               # Zod-validated env vars
├── app.ts
└── server.ts
```

### apps/mobile/ (Feature-first)
```
apps/mobile/src/
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   ├── home/
│   ├── search/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── wallet/
│   ├── addresses/
│   └── profile/
├── components/              # Shared UI
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── BottomSheet.tsx
│   └── layout/
│       ├── Screen.tsx
│       └── Header.tsx
├── lib/
│   ├── api.ts               # Axios instance
│   ├── queryClient.ts       # TanStack Query client
│   └── storage.ts           # Secure token storage
├── navigation/
│   ├── RootNavigator.tsx
│   ├── TabNavigator.tsx
│   └── AuthNavigator.tsx
└── theme/
    └── index.ts             # NativeWind theme tokens
```

### apps/admin/ (Next.js App Router)
```
apps/admin/src/app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx             # Analytics overview
│   ├── products/page.tsx
│   ├── categories/page.tsx
│   ├── orders/page.tsx
│   ├── customers/page.tsx
│   ├── wallet/page.tsx
│   └── reports/page.tsx
└── api/                     # Next.js API routes (proxies only if needed)
```

---

## 2. TECH STACK DECISIONS (LOCKED)

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native + Expo SDK 51 + TypeScript | EAS build, OTA updates |
| Mobile UI | NativeWind v4 | Tailwind in RN, consistent with admin |
| Mobile State | Zustand v5 | Cart, auth, UI state |
| Mobile Data | TanStack Query v5 | Caching, pagination, optimistic updates |
| Backend | Node.js + Express + TypeScript | Fast, team-familiar |
| ORM | Prisma v5 | Type-safe DB access, migrations |
| DB | PostgreSQL 16 (Supabase) | ACID, JSON support for metadata |
| Cache | Redis (Upstash) | Sessions, product cache, rate limits |
| Auth | JWT (access 15m + refresh 7d) | Stateless, scalable |
| Admin | Next.js 14 App Router + Tailwind | SSR for analytics, fast |
| Monorepo | Turborepo | Parallel builds, shared packages |
| Deployment | Railway (API) + Vercel (Admin) + EAS (Mobile) | Zero-infra ops |
| Validation | Zod (API) + React Hook Form (forms) | End-to-end type safety |
| Logging | Pino | Structured JSON logs |
| Testing | Vitest (unit) + Supertest (integration) | Fast, ESM-native |

---

## 3. DATABASE SCHEMA (Prisma — Complete)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────────

enum Role {
  CUSTOMER
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PACKED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  WALLET
  COD
}

enum TransactionType {
  CREDIT
  DEBIT
  REFUND
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
}

enum AddressType {
  HOME
  WORK
  OTHER
}

// ─── MODELS ──────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  phone        String   @unique
  email        String?  @unique
  name         String?
  avatarUrl    String?
  role         Role     @default(CUSTOMER)
  isVerified   Boolean  @default(false)
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  addresses     Address[]
  orders        Order[]
  cart          Cart?
  wallet        Wallet?
  notifications Notification[]
  recentlyViewed RecentlyViewed[]

  @@map("users")
}

model Address {
  id         String      @id @default(uuid())
  userId     String
  label      String
  type       AddressType @default(HOME)
  line1      String
  line2      String?
  city       String
  state      String
  pincode    String
  landmark   String?
  lat        Float?
  lng        Float?
  isDefault  Boolean     @default(false)
  createdAt  DateTime    @default(now())

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders     Order[]

  @@map("addresses")
}

model Category {
  id          String     @id @default(uuid())
  name        String     @unique
  slug        String     @unique
  imageUrl    String?
  description String?
  isActive    Boolean    @default(true)
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())

  products    Product[]

  @@map("categories")
}

model Product {
  id             String   @id @default(uuid())
  categoryId     String
  name           String
  slug           String   @unique
  description    String?
  images         String[] // Array of image URLs
  mrp            Decimal  @db.Decimal(10, 2)
  price          Decimal  @db.Decimal(10, 2)
  unit           String   // "500g", "1L", "12 pcs"
  stock          Int      @default(0)
  isActive       Boolean  @default(true)
  isFeatured     Boolean  @default(false)
  tags           String[]
  metadata       Json?    // Brand, expiry, nutritional info
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  category       Category   @relation(fields: [categoryId], references: [id])
  cartItems      CartItem[]
  orderItems     OrderItem[]
  recentlyViewed RecentlyViewed[]

  @@index([categoryId])
  @@index([slug])
  @@index([isActive, isFeatured])
  @@map("products")
}

model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]

  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  productId String
  quantity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
  @@map("cart_items")
}

model Order {
  id              String        @id @default(uuid())
  orderNumber     String        @unique // ZPT-20240101-0001
  userId          String
  addressId       String
  status          OrderStatus   @default(PENDING)
  paymentMethod   PaymentMethod
  subtotal        Decimal       @db.Decimal(10, 2)
  deliveryFee     Decimal       @db.Decimal(10, 2) @default(0)
  discount        Decimal       @db.Decimal(10, 2) @default(0)
  total           Decimal       @db.Decimal(10, 2)
  couponCode      String?
  notes           String?
  estimatedAt     DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id])
  address         Address       @relation(fields: [addressId], references: [id])
  items           OrderItem[]
  timeline        OrderTimeline[]
  walletTransaction WalletTransaction?

  @@index([userId])
  @@index([status])
  @@index([orderNumber])
  @@map("orders")
}

model OrderItem {
  id          String  @id @default(uuid())
  orderId     String
  productId   String
  productName String  // Snapshot at order time
  productImage String?
  unit        String
  quantity    Int
  mrp         Decimal @db.Decimal(10, 2)
  price       Decimal @db.Decimal(10, 2)
  total       Decimal @db.Decimal(10, 2)

  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model OrderTimeline {
  id        String      @id @default(uuid())
  orderId   String
  status    OrderStatus
  message   String?
  createdAt DateTime    @default(now())

  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_timeline")
}

model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Decimal  @db.Decimal(10, 2) @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions WalletTransaction[]

  @@map("wallets")
}

model WalletTransaction {
  id          String            @id @default(uuid())
  walletId    String
  orderId     String?           @unique
  type        TransactionType
  status      TransactionStatus @default(PENDING)
  amount      Decimal           @db.Decimal(10, 2)
  balanceBefore Decimal         @db.Decimal(10, 2)
  balanceAfter  Decimal         @db.Decimal(10, 2)
  description String
  reference   String?           // External payment gateway ref
  metadata    Json?
  createdAt   DateTime          @default(now())

  wallet      Wallet            @relation(fields: [walletId], references: [id])
  order       Order?            @relation(fields: [orderId], references: [id])

  @@index([walletId])
  @@map("wallet_transactions")
}

model Banner {
  id         String   @id @default(uuid())
  title      String
  imageUrl   String
  deepLink   String?  // "category/fruits" or "product/abc"
  isActive   Boolean  @default(true)
  sortOrder  Int      @default(0)
  startsAt   DateTime?
  endsAt     DateTime?
  createdAt  DateTime @default(now())

  @@map("banners")
}

model Coupon {
  id             String   @id @default(uuid())
  code           String   @unique
  description    String
  discountType   String   // "FLAT" | "PERCENT"
  discountValue  Decimal  @db.Decimal(10, 2)
  minOrderValue  Decimal  @db.Decimal(10, 2) @default(0)
  maxDiscount    Decimal? @db.Decimal(10, 2)
  usageLimit     Int?
  usedCount      Int      @default(0)
  isActive       Boolean  @default(true)
  startsAt       DateTime?
  expiresAt      DateTime?
  createdAt      DateTime @default(now())

  @@map("coupons")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  body      String
  type      String   // "ORDER_UPDATE" | "WALLET" | "PROMO"
  data      Json?    // { orderId: "..." }
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notifications")
}

model RecentlyViewed {
  id        String   @id @default(uuid())
  userId    String
  productId String
  viewedAt  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@map("recently_viewed")
}
```

---

## 4. API CONTRACTS (Complete)

### Base URL: `/api/v1`
### Auth header: `Authorization: Bearer <access_token>`

---

### AUTH `/api/v1/auth`

```
POST /send-otp
  Body: { phone: string }
  Res:  { success: true, expiresIn: 60 }

POST /verify-otp
  Body: { phone: string, otp: string }
  Res:  { user: User, accessToken: string, refreshToken: string }

POST /refresh
  Body: { refreshToken: string }
  Res:  { accessToken: string, refreshToken: string }

POST /logout
  Auth: required
  Body: {}
  Res:  { success: true }
```

### USERS `/api/v1/users`

```
GET  /me
  Auth: required
  Res: { user: User }

PUT  /me
  Auth: required
  Body: { name?: string, email?: string, avatarUrl?: string }
  Res:  { user: User }
```

### ADDRESSES `/api/v1/addresses`

```
GET    /
  Auth: required
  Res:  { addresses: Address[] }

POST   /
  Auth: required
  Body: { label, type, line1, line2?, city, state, pincode, landmark?, lat?, lng?, isDefault? }
  Res:  { address: Address }

PUT    /:id
  Auth: required
  Body: (same as POST, all optional)
  Res:  { address: Address }

DELETE /:id
  Auth: required
  Res:  { success: true }

PUT    /:id/default
  Auth: required
  Res:  { address: Address }
```

### CATEGORIES `/api/v1/categories`

```
GET /
  Res: { categories: Category[] }

GET /:slug
  Res: { category: Category, products: PaginatedProducts }
  Query: page=1, limit=20, sort=price_asc|price_desc|popular, minPrice, maxPrice
```

### PRODUCTS `/api/v1/products`

```
GET /
  Query: page, limit, categoryId, search, sort, featured, minPrice, maxPrice
  Res:  { products: Product[], total, page, totalPages }

GET /search
  Query: q (debounced from client), limit=10
  Res:  { products: Product[], suggestions: string[] }

GET /featured
  Res: { products: Product[] }

GET /popular
  Res: { products: Product[] }

GET /recently-viewed
  Auth: required
  Res: { products: Product[] }

GET /:slug
  Res: { product: Product, relatedProducts: Product[] }

POST /:id/view
  Auth: required
  Body: {}
  Res:  { success: true }
```

### CART `/api/v1/cart`

```
GET /
  Auth: required
  Res: { cart: CartWithItems, summary: CartSummary }
  # CartSummary: { subtotal, deliveryFee, discount, total, itemCount }

POST /items
  Auth: required
  Body: { productId: string, quantity: number }
  Res:  { cart: CartWithItems, summary: CartSummary }

PUT  /items/:productId
  Auth: required
  Body: { quantity: number }      # quantity=0 removes item
  Res:  { cart: CartWithItems, summary: CartSummary }

DELETE /items/:productId
  Auth: required
  Res:  { cart: CartWithItems, summary: CartSummary }

DELETE /clear
  Auth: required
  Res:  { success: true }

POST /validate-coupon
  Auth: required
  Body: { code: string }
  Res:  { valid: boolean, discount: number, message?: string }
```

### ORDERS `/api/v1/orders`

```
GET /
  Auth: required
  Query: page=1, limit=10, status?
  Res:  { orders: OrderSummary[], total, page, totalPages }

GET /:id
  Auth: required
  Res:  { order: OrderWithDetails }

POST /
  Auth: required
  Body: {
    addressId: string,
    paymentMethod: "WALLET" | "COD",
    couponCode?: string,
    notes?: string
  }
  Res:  { order: Order }
  # Atomically: validate cart → check wallet balance → deduct → create order → clear cart → push notification

PUT  /:id/cancel
  Auth: required
  Body: { reason: string }
  Res:  { order: Order }

POST /:id/reorder
  Auth: required
  Body: {}
  Res:  { cart: CartWithItems }   # Adds all items to cart, returns new cart
```

### WALLET `/api/v1/wallet`

```
GET /
  Auth: required
  Res: { wallet: Wallet }

GET /transactions
  Auth: required
  Query: page=1, limit=20, type? (CREDIT|DEBIT|REFUND)
  Res:  { transactions: WalletTransaction[], total, page }

POST /add-money
  Auth: required
  Body: { amount: number }        # In paise? Or INR — decide and lock.
  Res:  { transaction: WalletTransaction, wallet: Wallet }
  # For MVP: mock payment gateway, directly credit wallet
```

### BANNERS `/api/v1/banners`

```
GET /
  Res: { banners: Banner[] }
```

### NOTIFICATIONS `/api/v1/notifications`

```
GET /
  Auth: required
  Query: page=1, limit=20
  Res:  { notifications: Notification[], unreadCount: number }

PUT /read-all
  Auth: required
  Res:  { success: true }

PUT /:id/read
  Auth: required
  Res:  { notification: Notification }
```

### ADMIN `/api/v1/admin` (all require ADMIN role)

```
# Dashboard
GET /stats
  Res: { totalOrders, totalRevenue, totalUsers, activeProducts, todayOrders, todayRevenue }

# Products
GET    /products         # paginated + filters
POST   /products         # create
PUT    /products/:id     # update
DELETE /products/:id     # soft delete (isActive=false)
PUT    /products/:id/stock  # { stock: number }

# Categories
GET    /categories
POST   /categories
PUT    /categories/:id
DELETE /categories/:id

# Orders
GET    /orders           # paginated + status filter
PUT    /orders/:id/status  # { status: OrderStatus }

# Customers
GET    /customers        # paginated
GET    /customers/:id    # user + orders + wallet

# Wallet
GET    /wallet/transactions  # all users, paginated
POST   /wallet/credit        # { userId, amount, description }
POST   /wallet/refund        # { orderId, amount, reason }

# Banners
GET    /banners
POST   /banners
PUT    /banners/:id
DELETE /banners/:id
```

---

## 5. CORE BUSINESS LOGIC (Non-negotiable rules)

### Order Placement (Atomic Transaction)
```typescript
// MUST run in Prisma.$transaction
1. Fetch cart + items (validate non-empty)
2. Re-validate product stock for each item
3. If WALLET payment:
   a. Check wallet.balance >= order.total
   b. If insufficient: throw InsufficientBalanceError
4. Create Order + OrderItems (snapshot product name/price/image)
5. Create OrderTimeline entry (PENDING)
6. If WALLET: deduct balance, create WalletTransaction (DEBIT)
7. Update product stock (decrement)
8. Clear cart
9. Create Notification (ORDER_PLACED)
10. Return order
```

### Order Cancellation + Refund
```typescript
// MUST run in Prisma.$transaction
1. Validate order.status is PENDING or CONFIRMED (not DELIVERED/CANCELLED)
2. Update order.status = CANCELLED, cancelledAt, cancelReason
3. Add OrderTimeline entry (CANCELLED)
4. Restore product stock
5. If payment was WALLET:
   a. Credit wallet.balance
   b. Create WalletTransaction (REFUND)
   c. Create Notification (REFUND_CREDITED)
```

### Reorder Logic
```typescript
1. Fetch order + orderItems
2. For each item, check if product still exists and isActive
3. Add to cart (merge with existing: if productId exists, increment)
4. Return new cart state
// Client then navigates to Cart screen for review before checkout
```

### Wallet Add Money (MVP Mock)
```typescript
1. Validate amount (min ₹10, max ₹10,000)
2. Create WalletTransaction (status: PENDING)
3. Simulate payment gateway (setTimeout 500ms → SUCCESS)
4. Update wallet.balance
5. Update transaction.status = SUCCESS
6. Create Notification (WALLET_CREDITED)
// Real impl: Razorpay/Paytm webhook
```

### Cart Pricing
```typescript
DELIVERY_FEE = 0 if subtotal >= 199 else 29
DISCOUNT = coupon ? calculateCoupon(coupon, subtotal) : 0
TOTAL = subtotal + DELIVERY_FEE - DISCOUNT
```

---

## 6. ZUSTAND STORES (Mobile)

```typescript
// store/auth.store.ts
interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (user: User, tokens: Tokens) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

// store/cart.store.ts
interface CartStore {
  items: CartItem[]
  summary: CartSummary | null
  itemCount: number
  // Optimistic updates — update local state immediately, sync with server
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setCart: (cart: CartWithItems, summary: CartSummary) => void
}

// store/ui.store.ts
interface UIStore {
  toasts: Toast[]
  isBottomSheetOpen: boolean
  selectedAddress: Address | null
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}
```

---

## 7. TANSTACK QUERY HOOKS (Mobile)

```typescript
// Convention: useQuery for reads, useMutation for writes
// Keys: ['products'], ['product', slug], ['cart'], ['orders'], ['wallet']

// hooks/useProducts.ts
export const useProducts = (params) => useQuery({ queryKey: ['products', params], ... })
export const useProduct = (slug) => useQuery({ queryKey: ['product', slug], ... })
export const useSearchProducts = (q) => useQuery({ queryKey: ['search', q], enabled: q.length > 2 })

// hooks/useCart.ts
export const useCart = () => useQuery({ queryKey: ['cart'], ... })
export const useAddToCart = () => useMutation({ 
  mutationFn: cartApi.addItem,
  onMutate: async (vars) => { /* optimistic update cart store */ },
  onError: (err, vars, context) => { /* rollback */ },
  onSettled: () => queryClient.invalidateQueries(['cart'])
})

// hooks/useOrders.ts
export const useOrders = (params) => useQuery({ queryKey: ['orders', params], ... })
export const useOrder = (id) => useQuery({ queryKey: ['order', id], ... })
export const usePlaceOrder = () => useMutation({ ... })
export const useReorder = () => useMutation({
  mutationFn: (orderId) => orderApi.reorder(orderId),
  onSuccess: () => { queryClient.invalidateQueries(['cart']); router.push('/cart') }
})

// hooks/useWallet.ts
export const useWallet = () => useQuery({ queryKey: ['wallet'], ... })
export const useAddMoney = () => useMutation({ ... })
```

---

## 8. KEY SCREENS (Mobile — Implementation Priority)

### Priority 1 (Day 1): Core flow
1. **SplashScreen** — logo animation, redirect to auth or home
2. **LoginScreen** — phone input + OTP verify
3. **HomeScreen** — banners, categories, featured products
4. **ProductListScreen** — grid with filters
5. **ProductDetailScreen** — images, add to cart
6. **CartScreen** — items, pricing, checkout CTA

### Priority 2 (Day 2): Commerce
7. **CheckoutScreen** — address selection, payment method, order summary
8. **OrderSuccessScreen** — confirmation, order number
9. **OrdersScreen** — order list
10. **OrderDetailScreen** — status + timeline
11. **WalletScreen** — balance, add money, transaction history

### Priority 3 (Day 3): Polish + Admin
12. **SearchScreen** — instant search with debounce
13. **AddressScreen** — add/edit addresses
14. **ProfileScreen** — user info, settings
15. **Admin Dashboard** — stats, orders, products

---

## 9. SHARED TYPES PACKAGE

```typescript
// packages/types/src/index.ts

export interface User {
  id: string
  phone: string
  email?: string
  name?: string
  avatarUrl?: string
  role: 'CUSTOMER' | 'ADMIN'
  createdAt: string
}

export interface Product {
  id: string
  categoryId: string
  category?: Category
  name: string
  slug: string
  description?: string
  images: string[]
  mrp: number
  price: number
  unit: string
  stock: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  discountPercent?: number   // Computed: (mrp - price) / mrp * 100
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
}

export interface CartSummary {
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  itemCount: number
  isFreeDelivery: boolean
  freeDeliveryThreshold: number
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  createdAt: string
  items: OrderItem[]
  address: Address
  timeline: OrderTimeline[]
}

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PACKED'
  | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  | 'CANCELLED' | 'REFUNDED'

export interface Wallet {
  id: string
  balance: number
  transactions?: WalletTransaction[]
}

export interface WalletTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT' | 'REFUND'
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  createdAt: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}
```

---

## 10. DOCKER SETUP

```yaml
# docker-compose.yml (development)
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: zeptodev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes

  api:
    build: ./apps/api
    ports: ["3001:3001"]
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/zeptodev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_change_in_prod
      NODE_ENV: development
    depends_on: [postgres, redis]
    volumes: [./apps/api:/app, /app/node_modules]
    command: npm run dev

  admin:
    build: ./apps/admin
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001/api/v1
    depends_on: [api]

volumes:
  postgres_data:
```

---

## 11. ENVIRONMENT VARIABLES

```bash
# apps/api/.env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=change_this_in_production_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,exp://localhost:8081

# apps/admin/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_SECRET=...

# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 12. CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        options: --health-cmd pg_isready
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run type-check --workspaces
      - run: npm run lint --workspaces
      - run: cd apps/api && npx prisma generate && npm test

# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: npx @railway/cli@latest up --service api
        env: { RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }} }
  
  deploy-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 13. ERROR HANDLING PATTERNS

```typescript
// Standard API error response
interface ApiError {
  success: false
  error: {
    code: string          // "INSUFFICIENT_BALANCE" | "PRODUCT_OUT_OF_STOCK" | ...
    message: string       // Human-readable
    details?: unknown     // Validation errors
  }
}

// Error codes to implement
UNAUTHORIZED           = 401
FORBIDDEN              = 403
NOT_FOUND              = 404
VALIDATION_ERROR       = 422
INSUFFICIENT_BALANCE   = 422  // custom
PRODUCT_OUT_OF_STOCK   = 422  // custom
CART_EMPTY             = 422  // custom
ORDER_NOT_CANCELLABLE  = 422  // custom
RATE_LIMIT_EXCEEDED    = 429
INTERNAL_ERROR         = 500
```

---

## 14. 3-DAY EXECUTION PLAN

### Day 1 — Foundation + Core Backend
**Goal: API works end-to-end for the main user flow**

AM:
- [ ] Init monorepo (Turborepo + workspaces)
- [ ] Set up Prisma schema (copy from §3 above)
- [ ] Run migrations, seed data
- [ ] Auth feature: OTP send/verify (mock OTP for dev = "123456"), JWT

PM:
- [ ] Products + Categories APIs (list, detail, search)
- [ ] Cart API (get, add, update, delete)
- [ ] Orders API (place, cancel, reorder) — this is the hardest, do it now
- [ ] Wallet API (balance, add money, transactions)
- [ ] Test with Postman/Insomnia — full flow must work

### Day 2 — Mobile App
**Goal: Full user flow works on device/simulator**

AM:
- [ ] Expo setup + navigation structure
- [ ] Auth screens (Login, OTP verify)
- [ ] Home screen (Banners, Categories, Products)
- [ ] Search screen with debounce

PM:
- [ ] Product detail screen
- [ ] Cart screen with optimistic updates
- [ ] Checkout screen
- [ ] Order success + Order list + Order detail
- [ ] Wallet screen

### Day 3 — Admin + Polish
**Goal: Demo-ready product**

AM:
- [ ] Admin Next.js setup
- [ ] Analytics dashboard (stats cards + charts)
- [ ] Orders management (list + status update)
- [ ] Products management (CRUD)

PM:
- [ ] Docker compose working locally
- [ ] Deploy API to Railway
- [ ] Deploy Admin to Vercel
- [ ] EAS build for demo
- [ ] Fix top 5 bugs from testing
- [ ] Record demo video

---

## 15. SEED DATA STRUCTURE

```typescript
// prisma/seed.ts
// Categories: Fruits & Veg, Dairy, Snacks, Beverages, Personal Care, Household
// Products: 30+ products across categories with real images (use picsum.photos)
// Admin user: phone="9999999999", role=ADMIN
// Test user: phone="9876543210", wallet balance=₹500
// Banners: 3 promotional banners
// Coupon: "FIRST50" = ₹50 off on orders above ₹199
```

---

## 16. PERFORMANCE RULES (Non-negotiable)

1. **All list APIs must be paginated** (default limit=20, max=50)
2. **Search must be debounced** (300ms on client)
3. **Product images** — always lazy load, show skeleton
4. **Cart mutations** — optimistic update first, server sync second
5. **Wallet balance** — cache for 30s, invalidate on any transaction
6. **DB indexes** — already in schema above, do not remove them
7. **N+1 queries** — always use Prisma `include` strategically, never loop-query
8. **Redis cache** — featured products (TTL 5min), categories (TTL 10min)

---

## 17. TESTING STRATEGY

```
Unit tests (Vitest):
  - Wallet service (balance calculation, insufficient funds)
  - Order service (pricing, status transitions)
  - Cart service (quantity logic, pricing)
  - Coupon calculation

Integration tests (Supertest + test DB):
  - POST /api/v1/orders — full flow
  - PUT /api/v1/orders/:id/cancel — with refund
  - POST /api/v1/cart/items — optimistic sync
  - POST /api/v1/wallet/add-money

E2E (Playwright — Admin only, Day 3 if time):
  - Login → view orders → update status
```

---

## 18. DECISIONS LOG (Update as you go)

| Decision | Choice | Reason | Date |
|---|---|---|---|
| Auth method | Phone OTP (mock for MVP) | No email friction | Day 1 |
| Currency | Store as Decimal(10,2) in INR | Avoid float errors | Day 1 |
| OTP provider | Mock (console.log) for MVP | Ship fast, swap Twilio later | Day 1 |
| Image storage | External URLs / Cloudinary free | No infra to manage | Day 1 |
| Payment gateway | Mock for MVP | Razorpay integration Day 2+ | Day 1 |

---

## 19. DEMO SCRIPT (What must work for demo)

1. Open app → splash screen → OTP login (OTP = "123456" in dev)
2. Home screen loads with banners, categories, products
3. Search "milk" → instant results
4. Tap product → detail screen → Add to cart
5. Cart shows item, pricing breakdown, delivery fee
6. Checkout → select address → Wallet payment → Place Order
7. Order success screen with order number
8. Orders tab → see order → status timeline
9. "Reorder" button → cart pre-filled → checkout again
10. Wallet tab → balance reduced → transaction history shows debit
11. Admin: login → dashboard stats → update order to DELIVERED

**If these 10 steps work, the MVP is demo-ready.**

---

## 20. QUICK REFERENCE COMMANDS

```bash
# Setup
git clone ... && cd zeptodev
npm install                          # Install all workspaces
cd apps/api && npx prisma generate   # Generate Prisma client
cd apps/api && npx prisma migrate dev --name init
cd apps/api && npx prisma db seed

# Dev
docker-compose up -d                 # Start Postgres + Redis
npm run dev --workspace=apps/api     # Start API on :3001
npm run dev --workspace=apps/admin   # Start Admin on :3000
cd apps/mobile && npx expo start    # Start Expo

# Deploy
railway up                           # Deploy API
vercel --prod                        # Deploy Admin
eas build --platform ios --profile preview  # Build mobile

# DB
npx prisma studio                    # GUI at localhost:5555
npx prisma migrate reset             # Reset dev DB
npx prisma db push                   # Push schema without migration
```

---

*Last updated: Day 0 — Pre-build*
*Next session: Start with `apps/api` — auth feature first.*
