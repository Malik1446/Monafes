// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // حذف أي بيانات سابقة
  await prisma.trainingAttempt.deleteMany();
  await prisma.student.deleteMany();

  // إنشاء بعض الطلاب
  const ahmed = await prisma.student.create({
    data: { name: 'أحمد' }
  });
  const fatima = await prisma.student.create({
    data: { name: 'فاطمة' }
  });

  // إدخال محاولات تدريب
  // – أحمد أتم التدريب
  await prisma.trainingAttempt.create({
    data: {
      studentId: ahmed.id,
      completed: true
    }
  });

  // – فاطمة لم تكمل التدريب لسبب انقطاع اتصال
  await prisma.trainingAttempt.create({
    data: {
      studentId: fatima.id,
      completed: false,
      reason: 'انقطاع اتصال'
    }
  });

  console.log('✅ Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
