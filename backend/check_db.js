const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function check() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully!');
    const users = await prisma.user.findMany();
    console.log('User count:', users.length);
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

check();
