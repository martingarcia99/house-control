const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Check if Payment table exists and has data
    const paymentCount = await prisma.payment.count()
    console.log('Payment count:', paymentCount)

    // Check household members
    const members = await prisma.householdMember.findMany({
      take: 2,
      include: { user: { select: { id: true, name: true } } }
    })
    console.log('Members:', JSON.stringify(members, null, 2))

    // Test the query
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    if (members.length > 0) {
      const testQuery = await prisma.$queryRaw`
        SELECT COALESCE(SUM("amount"), 0) as total
        FROM "Bill"
        WHERE "householdId" = ${members[0].householdId}
          AND "paidById" = ${members[0].userId}
          AND "dueDate" >= ${startOfMonth}
          AND "dueDate" <= ${endOfMonth}
      `
      console.log('Test query result:', JSON.stringify(testQuery, null, 2))
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()