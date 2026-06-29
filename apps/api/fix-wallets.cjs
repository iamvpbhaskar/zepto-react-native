const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixWallets() {
  // Find all wallets with balance 0
  const wallets = await prisma.wallet.findMany()
  let fixed = 0
  
  for (const w of wallets) {
    // Find all SUCCESS transaction amounts
    const txs = await prisma.walletTransaction.findMany({
      where: { walletId: w.id, status: 'SUCCESS' },
    })
    
    let calculatedBalance = 0
    for (const tx of txs) {
      const amt = Number(tx.amount)
      if (tx.type === 'CREDIT' || tx.type === 'REFUND') {
        calculatedBalance += amt
      } else if (tx.type === 'DEBIT') {
        calculatedBalance -= amt
      }
    }
    
    const currentBalance = Number(w.balance)
    if (currentBalance !== calculatedBalance) {
      await prisma.wallet.update({
        where: { id: w.id },
        data: { balance: calculatedBalance },
      })
      console.log(`Fixed wallet ${w.id} for userId=${w.userId} — balance updated from ₹${currentBalance} to ₹${calculatedBalance}`)
      fixed++
    }
  }
  
  console.log(`\nTotal fixed: ${fixed} wallets`)
  await prisma.$disconnect()
}

fixWallets().catch(e => {
  console.error(e)
  process.exit(1)
})
