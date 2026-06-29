const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const addresses = await prisma.address.findMany()
  console.log(JSON.stringify(addresses, null, 2))
  await prisma.$disconnect()
}

main().catch(console.error)
