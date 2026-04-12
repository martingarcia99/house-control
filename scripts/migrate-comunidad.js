const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Step 1: Creating default Comunidad category...')
  
  await prisma.$executeRaw`
    INSERT INTO "Category" (id, name, icon, color, "isDefault", "householdId", "createdAt")
    SELECT gen_random_uuid(), 'Comunidad', 'building', '#0ea5e9', true, NULL, NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM "Category" 
      WHERE name = 'Comunidad' AND "householdId" IS NULL AND "isDefault" = true
    )
  `
  console.log('Done')

  console.log('Step 2: Creating Comunidad category for each household...')
  
  const households = await prisma.$queryRaw`
    SELECT DISTINCT h.id as "householdId"
    FROM "Household" h
    JOIN "Category" c ON c."householdId" = h.id
    WHERE c.name = 'Suscripciones'
  `
  
  for (const h of households) {
    await prisma.$executeRaw`
      INSERT INTO "Category" (id, name, icon, color, "isDefault", "householdId", "createdAt")
      SELECT gen_random_uuid(), 'Comunidad', 'building', '#0ea5e9', true, ${h.householdId}, NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "Category" c2 
        WHERE c2.name = 'Comunidad' AND c2."householdId" = ${h.householdId}
      )
    `
  }
  console.log('Done')

  console.log('Step 3: Migrating bills...')
  
  await prisma.$executeRaw`
    UPDATE "Bill"
    SET "categoryId" = (
      SELECT c2.id FROM "Category" c2 
      WHERE c2.name = 'Comunidad' 
      AND c2."householdId" = c."householdId"
      LIMIT 1
    )
    FROM "Category" c
    WHERE "Bill"."categoryId" = c.id
    AND c.name = 'Suscripciones'
    AND LOWER("Bill".description) = 'comunidad'
  `
  console.log('Done')

  const result = await prisma.$queryRaw`
    SELECT b.id, b.description, c.name as "categoryName" 
    FROM "Bill" b
    JOIN "Category" c ON b."categoryId" = c.id
    WHERE c.name = 'Comunidad'
  `
  console.log('Migrated bills:', JSON.stringify(result, null, 2))
}

main()
  .finally(() => prisma.$disconnect())