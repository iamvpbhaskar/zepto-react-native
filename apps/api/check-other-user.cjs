const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: '78d5b5f1-6eb3-4c29-a5d2-90a9a8fd9edd' },
  })
  console.log(user)
  await prisma.$disconnect()
}
main().catch(console.error)
