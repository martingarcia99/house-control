import { prisma } from './prisma'

function currentPeriod(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Lazy sweep executed on read: generates this month's bills from active
 * recurring templates whose day has arrived, and marks unpaid past-due
 * bills as OVERDUE. Serverless-friendly (no cron needed); the lastRun
 * guard makes generation idempotent under concurrent requests.
 */
export async function runRecurringSweep(householdId: string): Promise<void> {
  const now = new Date()
  const period = currentPeriod(now)

  await prisma.bill.updateMany({
    where: {
      householdId,
      status: 'PENDING',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  })

  const due = await prisma.recurringBill.findMany({
    where: {
      householdId,
      active: true,
      dayOfMonth: { lte: now.getDate() },
      OR: [{ lastRun: null }, { lastRun: { not: period } }],
    },
  })

  for (const template of due) {
    const claimed = await prisma.recurringBill.updateMany({
      where: {
        id: template.id,
        OR: [{ lastRun: null }, { lastRun: { not: period } }],
      },
      data: { lastRun: period },
    })
    if (claimed.count === 0) continue

    const issueDate = new Date(now.getFullYear(), now.getMonth(), template.dayOfMonth)
    const dueDate = template.dueDay
      ? new Date(now.getFullYear(), now.getMonth(), template.dueDay, 23, 59, 59)
      : null

    await prisma.bill.create({
      data: {
        amount: template.amount,
        description: template.description,
        issueDate,
        dueDate,
        categoryId: template.categoryId,
        householdId: template.householdId,
        paidById: template.createdById,
        status: 'PENDING',
      },
    })
  }
}
