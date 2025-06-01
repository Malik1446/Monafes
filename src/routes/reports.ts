import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /reports/training-status
router.get('/training-status', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        trainingAttempts: { select: { completed: true, reason: true } }
      }
    });

    const completed: { id: number; name: string }[] = [];
    const notCompleted: any[] = [];

    for (const s of students) {
      const atts = s.trainingAttempts;
      const allDone = atts.length > 0 && atts.every(a => a.completed);
      if (allDone) {
        completed.push({ id: s.id, name: s.name });
      } else {
        notCompleted.push({
          id: s.id,
          name: s.name,
          stoppedAttempts: atts.filter(a => !a.completed)
        });
      }
    }

    res.json({ completed, notCompleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

export default router;
