// src/routes/reports.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /reports/training-status
 * يرجع قائمتين: 
 *  - completed: الطلاب الذين أتموا التدريب
 *  - notCompleted: الطلاب الذين لم يكملوا وأسباب توقفهم
 */
router.get('/training-status', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        trainingAttempts: {
          select: { completed: true, reason: true }
        }
      }
    });

    const completed = [];
    const notCompleted = [];

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

    return res.json({ completed, notCompleted });
  } catch (e) {
    console.error('Error fetching training-status report:', e);
    return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

module.exports = router;
