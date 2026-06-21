import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { env } from './config/env'
import { errorMiddleware } from './middleware/error.middleware'
import { globalRateLimit } from './middleware/rateLimit.middleware'
import { logger } from './lib/logger'

// Feature routes
import authRoutes from './features/auth/auth.routes'
import usersRoutes from './features/users/users.routes'
import addressesRoutes from './features/addresses/addresses.routes'
import categoriesRoutes from './features/categories/categories.routes'
import productsRoutes from './features/products/products.routes'
import cartRoutes from './features/cart/cart.routes'
import ordersRoutes from './features/orders/orders.routes'
import walletRoutes from './features/wallet/wallet.routes'
import bannersRoutes from './features/banners/banners.routes'
import notificationsRoutes from './features/notifications/notifications.routes'
import adminRoutes from './features/admin/admin.routes'

const app = express()

// ─── SECURITY & COMPRESSION ──────────────────────────────

app.use(helmet())
app.use(compression())
app.use(cors({
  origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
  credentials: true,
}))

// ─── BODY PARSING ─────────────────────────────────────────

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── RATE LIMITING ────────────────────────────────────────

app.use(globalRateLimit)

// ─── HEALTH CHECK ─────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV })
})

// ─── API ROUTES ───────────────────────────────────────────

const API_PREFIX = '/api/v1'

app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/users`, usersRoutes)
app.use(`${API_PREFIX}/addresses`, addressesRoutes)
app.use(`${API_PREFIX}/categories`, categoriesRoutes)
app.use(`${API_PREFIX}/products`, productsRoutes)
app.use(`${API_PREFIX}/cart`, cartRoutes)
app.use(`${API_PREFIX}/orders`, ordersRoutes)
app.use(`${API_PREFIX}/wallet`, walletRoutes)
app.use(`${API_PREFIX}/banners`, bannersRoutes)
app.use(`${API_PREFIX}/notifications`, notificationsRoutes)
app.use(`${API_PREFIX}/admin`, adminRoutes)

// ─── 404 HANDLER ─────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// ─── ERROR HANDLER ────────────────────────────────────────

app.use(errorMiddleware)

export default app
