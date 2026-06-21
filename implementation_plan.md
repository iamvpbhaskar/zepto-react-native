# Zepto Quick Commerce MVP — Implementation Plan

> Based entirely on `d:\zepto\CLAUDE.md`. Building a production-grade quick commerce platform.

## Mission

Ship a demo-ready quick commerce MVP:
- **Mobile**: React Native + Expo (browse → cart → checkout → wallet pay → reorder)
- **API**: Node.js + Express + Prisma + PostgreSQL + Redis
- **Admin**: Next.js 14 App Router dashboard
- **Infra**: Docker Compose (local), Railway (API), Vercel (Admin), EAS (Mobile)

---

## User Review Required

> [!IMPORTANT]
> **Scope**: This is a very large full-stack monorepo. Building everything will take significant time. I recommend we proceed in the exact order from CLAUDE.md — Day 1 (API), Day 2 (Mobile), Day 3 (Admin + Polish).
>
> **Please confirm** which part to start with:
> 1. **Full scaffold first** — monorepo structure, configs, packages, then fill features
> 2. **API-first** — complete `apps/api` end-to-end before touching mobile/admin
> 3. **All three simultaneously** — scaffold all apps and packages in parallel

> [!WARNING]
> **React Native / Expo**: Requires Android Studio or Xcode. If you only want to run on device via Expo Go, that works too. Please confirm your mobile dev setup.

> [!NOTE]
> **Mock OTP**: Dev OTP is hardcoded as `"123456"` per CLAUDE.md. No Twilio needed for MVP.
> **Mock Payment**: Wallet add-money simulates a gateway with `setTimeout(500ms)`. No Razorpay for MVP.

---

## Open Questions

1. Do you have **Docker Desktop** running locally? (For PostgreSQL + Redis)
2. Do you want to use **Supabase** for PostgreSQL or a local Docker Postgres?
3. Do you want **Upstash** for Redis or local Docker Redis?
4. Should I set up **GitHub Actions** CI/CD now or defer to Day 3?
5. Do you already have an **Expo account** and EAS CLI for mobile builds?

---

## Proposed Changes

### Phase 0 — Monorepo Scaffold

#### [NEW] `package.json` (root workspace)
- npm workspaces: `apps/*`, `packages/*`
- Turborepo pipeline config

#### [NEW] `turbo.json`
- `build`, `dev`, `lint`, `type-check` pipelines

#### [NEW] `docker-compose.yml`
- PostgreSQL 16, Redis 7, API service, Admin service

#### [NEW] `.github/workflows/ci.yml`
#### [NEW] `.github/workflows/deploy.yml`

---

### Phase 1 — Shared Packages

#### [NEW] `packages/types/src/index.ts`
- `User`, `Product`, `CartItem`, `CartSummary`, `Order`, `OrderStatus`, `Wallet`, `WalletTransaction`, `ApiResponse<T>`, `PaginatedResponse<T>`

#### [NEW] `packages/utils/src/index.ts`
- `formatCurrency(amount)`, `formatDate()`, `calcCartSummary()`, `calcDiscount()`

#### [NEW] `packages/config/src/index.ts`
- `ORDER_STATUS`, `DELIVERY_FEE_THRESHOLD=199`, `DELIVERY_FEE=29`, `FREE_DELIVERY_MIN=199`

---

### Phase 2 — API (`apps/api`)

#### [NEW] `apps/api/prisma/schema.prisma`
Full schema from CLAUDE.md §3: User, Address, Category, Product, Cart, CartItem, Order, OrderItem, OrderTimeline, Wallet, WalletTransaction, Banner, Coupon, Notification, RecentlyViewed

#### [NEW] `apps/api/prisma/seed.ts`
- 6 categories, 30+ products, admin user (9999999999), test user (9876543210, wallet=₹500), 3 banners, coupon "FIRST50"

#### [NEW] `apps/api/src/config/env.ts`
Zod-validated env vars

#### [NEW] `apps/api/src/lib/` (4 files)
- `prisma.ts`, `redis.ts`, `logger.ts` (Pino), `jwt.ts`

#### [NEW] `apps/api/src/middleware/` (4 files)
- `auth.middleware.ts`, `rateLimit.middleware.ts`, `error.middleware.ts`, `validate.middleware.ts`

#### [NEW] `apps/api/src/features/auth/` (5 files)
- OTP send (mock, logs to console), OTP verify (hardcoded `"123456"`), JWT issue, refresh, logout

#### [NEW] `apps/api/src/features/users/`
- GET /me, PUT /me

#### [NEW] `apps/api/src/features/addresses/`
- Full CRUD + set-default

#### [NEW] `apps/api/src/features/categories/`
- List + slug detail with paginated products

#### [NEW] `apps/api/src/features/products/`
- List (paginated, filtered), search (debounced-ready), featured, popular, recently-viewed, detail

#### [NEW] `apps/api/src/features/cart/`
- Get, add item, update quantity, delete item, clear, validate-coupon
- Pricing: `DELIVERY_FEE = 0 if subtotal >= 199 else 29`

#### [NEW] `apps/api/src/features/orders/`
- Place order (atomic Prisma.$transaction), cancel + refund, reorder, list, detail

#### [NEW] `apps/api/src/features/wallet/`
- Balance, transactions (paginated), add-money (mock gateway)

#### [NEW] `apps/api/src/features/banners/`
- List active banners

#### [NEW] `apps/api/src/features/notifications/`
- List, mark read, mark all read

#### [NEW] `apps/api/src/features/admin/`
- Stats, products CRUD, categories CRUD, orders list + status update, customers, wallet credit/refund, banners CRUD

#### [NEW] `apps/api/src/app.ts` + `server.ts`

---

### Phase 3 — Admin (`apps/admin`)

#### [NEW] `apps/admin/src/app/(auth)/login/page.tsx`
#### [NEW] `apps/admin/src/app/(dashboard)/layout.tsx`
#### [NEW] `apps/admin/src/app/(dashboard)/page.tsx` — Stats cards + revenue chart
#### [NEW] `apps/admin/src/app/(dashboard)/orders/page.tsx`
#### [NEW] `apps/admin/src/app/(dashboard)/products/page.tsx`
#### [NEW] `apps/admin/src/app/(dashboard)/categories/page.tsx`
#### [NEW] `apps/admin/src/app/(dashboard)/customers/page.tsx`
#### [NEW] `apps/admin/src/app/(dashboard)/wallet/page.tsx`
#### [NEW] `apps/admin/src/app/(dashboard)/reports/page.tsx`

---

### Phase 4 — Mobile (`apps/mobile`)

#### [NEW] Navigation: `RootNavigator`, `TabNavigator`, `AuthNavigator`
#### [NEW] Theme: NativeWind v4 tokens
#### [NEW] Shared UI: Button, Input, Card, Badge, Skeleton, Toast, BottomSheet
#### [NEW] Zustand stores: `auth.store.ts`, `cart.store.ts`, `ui.store.ts`
#### [NEW] TanStack Query hooks: `useProducts`, `useCart`, `useOrders`, `useWallet`

**Priority 1 Screens** (Day 2 AM):
- SplashScreen, LoginScreen, OTPScreen
- HomeScreen (banners + categories + featured)
- ProductListScreen, ProductDetailScreen
- CartScreen

**Priority 2 Screens** (Day 2 PM):
- CheckoutScreen, OrderSuccessScreen
- OrdersScreen, OrderDetailScreen
- WalletScreen

**Priority 3 Screens** (Day 3):
- SearchScreen, AddressScreen, ProfileScreen

---

## Verification Plan

### Automated Tests
```bash
cd apps/api && npm test        # Vitest unit tests
cd apps/api && npm run test:integration  # Supertest
```

### Manual Demo Script (from CLAUDE.md §19)
1. OTP login with `123456`
2. Home loads banners + categories + products
3. Search "milk" → instant results
4. Add product to cart
5. Checkout → wallet payment → order placed
6. Orders tab → timeline
7. Reorder button → cart pre-filled
8. Wallet tab → balance reduced, tx history
9. Admin → stats → update order to DELIVERED

### Build Verification
```bash
npm run type-check --workspaces
npm run lint --workspaces
docker-compose up -d
npm run dev --workspace=apps/api
npm run dev --workspace=apps/admin
```

---

## Execution Order

| Phase | Target | Days |
|---|---|---|
| 0 | Monorepo scaffold + packages | Day 1 AM |
| 1 | API: auth, products, cart, orders, wallet | Day 1 |
| 2 | Mobile: all screens | Day 2 |
| 3 | Admin dashboard | Day 3 AM |
| 4 | Docker, deploy, seed, polish | Day 3 PM |

---

*Plan created from `d:\zepto\CLAUDE.md` on Day 0.*
