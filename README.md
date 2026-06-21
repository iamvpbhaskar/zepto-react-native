# Zepto Quick Commerce MVP — Setup & Execution Guide

This document provides complete instructions to set up, seed, and run the full-stack Zepto quick commerce MVP monorepo.

---

## 🚀 DEMO FLOW
The entire system is optimized to support the following quick commerce flow:
1. **Launch Mobile App** → OTP login via test credentials.
2. **Browse & Search** → Interactive category browser & debounced product search.
3. **Cart & Pricing** → Add items, calculate dynamic delivery fees and apply coupon codes.
4. **Checkout & Wallet Pay** → Pay using the seeded Paytm-style wallet balance.
5. **Order Tracking** → Live status timeline (Pending → Confirmed → Packed → Out for Delivery → Delivered).
6. **Admin Dashboard** → Update order status, credit wallets, manage catalog, and monitor real-time stats.
7. **One-Click Reorder** → Fast cart pre-fill directly from the orders timeline.

---

## 🛠️ Prerequisites
Before starting, ensure you have the following installed:
*   **Node.js**: `v20.x` or higher
*   **npm**: `v10.x` or higher
*   **Docker Desktop**: To spin up local PostgreSQL and Redis databases instantly.
*   **Expo Go** App: Installed on your iOS/Android device to preview the React Native app.

---

## 📦 Local Environment Configuration

To run the apps, copy the environment files templates and replace placeholder values:

### 1. Backend API (`apps/api`)
Create `apps/api/.env` from `apps/api/.env.example`:
```bash
# Core connection strings
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeptodev"
REDIS_URL="redis://localhost:6379"

# Token secrets (Choose secure random strings in production)
JWT_SECRET="zepto_dev_secret_change_in_prod_min_32_chars"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Port & CORS
PORT=3001
NODE_ENV="development"
CORS_ORIGINS="http://localhost:3000,exp://localhost:8081"
```

### 2. Next.js Admin Dashboard (`apps/admin`)
Create `apps/admin/.env.local` from `apps/admin/.env.local.example`:
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

### 3. React Native Mobile App (`apps/mobile`)
Create `apps/mobile/.env` from `apps/mobile/.env.example`:
```bash
# Set this to your local machine IP address so the physical device running Expo Go can talk to your backend
EXPO_PUBLIC_API_URL="http://YOUR_LOCAL_IP_ADDRESS:3001/api/v1"
```
> ⚠️ **Note**: Do not use `localhost` or `127.0.0.1` inside `apps/mobile/.env` if you are testing on a physical phone. Use your local Wi-Fi IP address (e.g. `192.168.1.5`).

---

## 🗄️ Database & Redis Setup

### 1. Launch Services
Spin up local PostgreSQL and Redis containers using Docker:
```bash
# From the root directory
docker-compose up -d
```

### 2. Generate Prisma Client & Run Migrations
Run the schema migrations to build database tables and generate client types:
```bash
cd apps/api
npx prisma migrate dev --name init
```

### 3. Seed Database
Load preconfigured data (6 categories, 30+ products, banner slide show, test user accounts, wallet balances, promo code `FIRST50`):
```bash
npx prisma db seed
```

---

## 🏃 Run Applications

### 1. Install Workspace Dependencies
From the monorepo root directory:
```bash
npm install
```

### 2. Start Backend API
Run the Express backend with automatic file-watch reloading:
```bash
npm run dev --workspace=apps/api
```
The server will run on `http://localhost:3001`. You can test api health via `http://localhost:3001/api/v1/banners`.

### 3. Start Next.js Admin Dashboard
Run the admin panel:
```bash
npm run dev --workspace=apps/admin
```
Open `http://localhost:3000` to manage products, view analytics, credit/refund wallets, and advance order tracking statuses.

### 4. Start React Native App
Start the Metro bundler server:
```bash
npm run start --workspace=apps/mobile
```
*   **Android Emulator**: Press `a` in the terminal logs to run inside an open Android Emulator.
*   **iOS Simulator**: Press `i` to launch in iOS Simulator.
*   **Expo Go (Physical Device)**: Scan the QR code displayed in the terminal using your phone's camera (iOS) or Expo Go app (Android).

---

## 🔑 Test User Credentials (Pre-seeded)

Use these credentials to login and simulate wallet transactions:

*   **Test Customer Account**:
    *   **Phone Number**: `9876543210`
    *   **Dev OTP**: `123456`
    *   **Initial Wallet Balance**: **₹500.00**
*   **Admin Dashboard Account**:
    *   **Phone Number**: `9999999999`
    *   **Dev OTP**: `123456`
    *   **Role**: `ADMIN`
