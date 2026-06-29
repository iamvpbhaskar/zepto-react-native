import { PrismaClient } from '@prisma/client'

async function testRegionAndPort(region: string, port: number) {
  const url = `postgresql://postgres.trdnuqcfrucjndwnfjqr:%40Zeptopapp1@aws-0-${region}.pooler.supabase.com:${port}/postgres${port === 6543 ? '?pgbouncer=true' : ''}`
  console.log(`Testing ${region} on port ${port}...`)
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  })
  try {
    const count = await prisma.product.count()
    console.log(`✅ SUCCESS! Connected to ${region} on port ${port}. Total products: ${count}`)
    await prisma.$disconnect()
    return true
  } catch (err: any) {
    const errMsg = err.message || ''
    if (errMsg.includes('tenant/user') && errMsg.includes('not found')) {
      console.log(`ℹ️ Reachable but wrong region: ${region} (returned tenant not found)`)
    } else {
      console.log(`❌ Failed for ${region}:${port} - ${errMsg.split('\n')[0]}`)
    }
    await prisma.$disconnect()
    return false
  }
}

async function run() {
  const regions = [
    'ap-south-1',      // Mumbai
    'ap-southeast-1',  // Singapore
    'ap-southeast-2',  // Sydney
    'ap-northeast-1',  // Tokyo
    'ap-northeast-2',  // Seoul
    'us-east-1',       // N. Virginia
    'us-east-2',       // Ohio
    'us-west-1',       // N. California
    'us-west-2',       // Oregon
    'eu-west-1',       // Ireland
    'eu-west-2',       // London
    'eu-west-3',       // Paris
    'eu-central-1',    // Frankfurt
    'ca-central-1',    // Canada
    'sa-east-1',       // São Paulo
  ]

  for (const region of regions) {
    // Try port 5432
    let success = await testRegionAndPort(region, 5432)
    if (success) process.exit(0)

    // Try port 6543
    success = await testRegionAndPort(region, 6543)
    if (success) process.exit(0)
  }

  console.log('❌ All regions/ports failed.')
  process.exit(1)
}

run()
