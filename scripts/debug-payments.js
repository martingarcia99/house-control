const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const householdId = 'cmnax27nv0001uq4xu0kixmbp'

  // Get household members
  const members = await prisma.householdMember.findMany({
    where: { householdId },
    include: { user: { select: { id: true, name: true } } }
  })

  console.log('Household members:')
  members.forEach(m => {
    console.log(`  ${m.user.name}: userId = ${m.user.id}`)
  })

  // Check bills - who is the current user in the app?
  const bills = await prisma.bill.findMany({
    where: { householdId },
    take: 5,
    select: { paidById: true }
  })

  console.log('\nBills paidById:')
  bills.forEach(b => console.log(`  ${b.paidById}`))
}

main()
  .finally(() => prisma.$disconnect())