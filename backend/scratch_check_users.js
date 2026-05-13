const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, avatar: true }
  });
  console.log('Total users:', users.length);
  console.log('Users:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

check().catch(console.error);
