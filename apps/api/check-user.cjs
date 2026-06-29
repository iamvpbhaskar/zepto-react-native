const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      phone: {
        contains: '9999999999'
      }
    },
    include: {
      wallet: {
        include: {
          transactions: true
        }
      }
    }
  })
  console.log(JSON.stringify(users, null, 2))
  await prisma.$disconnect()
}

main().catch(console.error)
