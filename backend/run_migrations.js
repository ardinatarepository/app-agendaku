const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Running custom migrations...');
    
    // Add reminderHours if missing
    try {
      await prisma.$executeRaw`ALTER TABLE tasks ADD COLUMN reminderHours INT DEFAULT 0;`;
      console.log('Added reminderHours');
    } catch(e) {}

    // Update status enum
    try {
      await prisma.$executeRaw`ALTER TABLE tasks MODIFY COLUMN status ENUM('BELUM_MULAI', 'SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT') DEFAULT 'BELUM_MULAI';`;
      console.log('Updated status enum');
    } catch(e) {
      console.error('Error updating status enum:', e.message);
    }

    // Add is_recurring if missing
    try {
      await prisma.$executeRaw`ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;`;
      console.log('Added is_recurring');
    } catch(e) {}

    // Add recurrence if missing
    try {
      await prisma.$executeRaw`ALTER TABLE tasks ADD COLUMN recurrence VARCHAR(20) NULL;`;
      console.log('Added recurrence');
    } catch(e) {}

    // Create sub_tasks table if missing
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS sub_tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          is_done BOOLEAN DEFAULT FALSE,
          task_id INT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `;
      console.log('Created sub_tasks table');
    } catch(e) {
      console.error('Error creating sub_tasks:', e.message);
    }

    console.log('Migrations finished!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
