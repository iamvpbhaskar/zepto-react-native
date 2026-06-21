import './config/env' // Validate env vars first
import app from './app'
import { env } from './config/env'
import { logger } from './lib/logger'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis'

async function bootstrap() {
  // Test DB connection
  try {
    await prisma.$connect()
    logger.info('✅ Database connected')
  } catch (err) {
    logger.error({ err }, '❌ Database connection failed')
    process.exit(1)
  }

  // Test Redis connection (optional)
  if (redis) {
    try {
      await redis.ping()
      logger.info('✅ Redis connected')
    } catch (err) {
      logger.warn({ err }, '⚠️ Redis connection failed — caching disabled')
    }
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Zepto API running on http://localhost:${env.PORT}`)
    logger.info(`📍 API prefix: /api/v1`)
    logger.info(`🌍 Environment: ${env.NODE_ENV}`)
  })

  // ─── GRACEFUL SHUTDOWN ──────────────────────────────────

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(async () => {
      await prisma.$disconnect()
      if (redis) await redis.quit()
      logger.info('Server shut down cleanly')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception')
    process.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection')
    process.exit(1)
  })
}

bootstrap()
