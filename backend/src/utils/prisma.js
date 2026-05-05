// Prisma Client singleton
// Import dari file ini di semua controller

const { PrismaClient } = require('../generated/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

module.exports = prisma;
