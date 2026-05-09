const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Starting migration...');
  const result = await prisma.$executeRaw`UPDATE tasks SET status = 'SEDANG_DIKERJAKAN' WHERE status = 'BELUM_MULAI'`;
  console.log(`Updated tasks: ${result}`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
