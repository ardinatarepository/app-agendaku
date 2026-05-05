const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding reminderHours column to tasks table...');
    await prisma.$executeRaw`ALTER TABLE tasks ADD COLUMN reminderHours INT DEFAULT 0;`;
    console.log('Success!');
  } catch (error) {
    console.error('Failed or column already exists:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
