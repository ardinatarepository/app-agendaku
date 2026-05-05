// prisma/seed.js — Data awal untuk development & testing

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database AgendaKu...\n');

  // Buat user demo
  const hashed = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@agendaku.com' },
    update: {},
    create: {
      name:     'Wiwid Ardinata',
      email:    'demo@agendaku.com',
      password: hashed,
    },
  });
  console.log(`✅ User: ${user.email} (password: password123)`);

  // Buat kategori
  const cats = await Promise.all([
    prisma.category.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Kuliah',     color: '#6366f1', userId: user.id } }),
    prisma.category.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Pribadi',    color: '#10b981', userId: user.id } }),
    prisma.category.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Organisasi', color: '#f59e0b', userId: user.id } }),
  ]);
  console.log(`✅ Kategori: ${cats.map(c => c.name).join(', ')}`);

  // Helper tanggal relatif
  const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(23, 59, 0, 0);
    return d;
  };

  // Buat tugas sample
  const tasksData = [
    { title: 'UAS Rekayasa Web',         status: 'SEDANG_DIKERJAKAN', priority: 'TINGGI',  deadline: daysFromNow(-1), categoryId: cats[0].id, description: 'Kerjakan proyek akhir UAS berbasis web' },
    { title: 'Laporan Proyek RPL',        status: 'BELUM_MULAI',      priority: 'TINGGI',  deadline: daysFromNow(2),  categoryId: cats[0].id, description: 'Buat laporan akhir proyek rekayasa perangkat lunak' },
    { title: 'Wireframe Mobile AgendaKu', status: 'SELESAI',          priority: 'NORMAL',  deadline: daysFromNow(-5), categoryId: cats[0].id, description: 'Desain wireframe di Figma' },
    { title: 'Setup Backend API',         status: 'SELESAI',          priority: 'TINGGI',  deadline: daysFromNow(-3), categoryId: cats[0].id, description: 'Konfigurasi Express + Prisma + MySQL' },
    { title: 'Rapat BEM Bulanan',         status: 'BELUM_MULAI',      priority: 'NORMAL',  deadline: daysFromNow(3),  categoryId: cats[2].id, description: 'Agenda: evaluasi program kerja bulan ini' },
    { title: 'Baca Buku Clean Code',      status: 'SEDANG_DIKERJAKAN', priority: 'RENDAH', deadline: null,            categoryId: cats[1].id, description: 'Bab 1 sampai 5 dulu' },
    { title: 'Olahraga pagi',             status: 'BELUM_MULAI',      priority: 'RENDAH',  deadline: daysFromNow(1),  categoryId: cats[1].id, description: null },
    { title: 'Presentasi UTS',            status: 'SELESAI',          priority: 'TINGGI',  deadline: daysFromNow(-7), categoryId: cats[0].id, description: 'Presentasi hasil riset kelompok' },
    { title: 'Proposal Kegiatan HMIF',    status: 'SEDANG_DIKERJAKAN', priority: 'NORMAL', deadline: daysFromNow(5),  categoryId: cats[2].id, description: 'Proposal untuk seminar teknologi' },
  ];

  await prisma.task.deleteMany({ where: { userId: user.id } });
  const tasks = await prisma.task.createMany({ data: tasksData.map(t => ({ ...t, userId: user.id })) });
  console.log(`✅ Tugas: ${tasks.count} tugas berhasil dibuat`);

  console.log('\n🎉 Seeding selesai!');
  console.log('📧 Login dengan: demo@agendaku.com / password123\n');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
