const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.$queryRaw`
    SELECT id, name, "householdId", "isDefault" FROM "Category" WHERE name = 'Suscripciones'
  `
  console.log('Suscripciones categories:', JSON.stringify(categories, null, 2))
  
  const bills = await prisma.$queryRaw`
    SELECT b.id, b.description, c.name as "categoryName", c."householdId" 
    FROM "Bill" b
    JOIN "Category" c ON b."categoryId" = c.id
    WHERE c.name = 'Suscripciones' AND LOWER(b.description) LIKE '%comunidad%'
  `
  console.log('Bills to migrate:', JSON.stringify(bills, null, 2))
}

main()
  .finally(() => prisma.$disconnect())