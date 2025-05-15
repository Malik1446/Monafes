'use strict';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';


// ===== تهيئة البيئة وقاعدة البيانات =====
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ===== مخططات التحقق =====
const teacherSchema = Joi.object({
  name:     Joi.string().required(),
  email:    Joi.string().email().required(),
  schoolId: Joi.number().integer().positive().required(),
});

const studentSchema = Joi.object({
  name:      Joi.string().required(),
  grade:     Joi.number().integer().min(1).required(),
  teacherId: Joi.number().integer().positive().required(),
});

const questionSchema = Joi.object({
  content:   Joi.string().required(),
  studentId: Joi.number().integer().positive().required(),
});

// ===== نقطة النهاية لإنشاء المدرّس مع التحقق =====
app.post('/teachers', async (req, res) => {
  const { error, value } = teacherSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const teacher = await prisma.teacher.create({ data: value });
    return res.status(201).json(teacher);
  } catch (e) {
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'هذا البريد مستخدم بالفعل.' });
    }
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'schoolId غير موجود.' });
    }
    console.error(e);
    return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
  }
});

// —–––– نقاط النهاية الأخرى تلي هنا —––––
// مثال: app.post('/students', ... مع studentSchema)  
//         app.post('/questions', ... مع questionSchema)  
// بالإضافة إلى بقية الـ GET, PUT, DELETE

// أخيراً تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



/////////////////////////
// نقاط النهاية (Routes) //
/////////////////////////

// نقطة البداية الافتراضية
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// اختبار الاتصال بقاعدة البيانات
app.get('/ping-db', async (req, res) => {
  console.log('🔔 /ping-db requested');
  try {
    const [{ now }] = await prisma.$queryRaw`SELECT NOW()`;
    res.json({ now });
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

/////////////////////
// CRUD للنماذج الأساسية //
/////////////////////

// إنشاء مدرسة جديدة
app.post('/schools', async (req, res) => {
  const { name, address } = req.body;
  const school = await prisma.school.create({ data: { name, address } });
  res.status(201).json(school);
});

// قراءة كل المدارس مع المدرّسين
app.get('/schools', async (req, res) => {
  const schools = await prisma.school.findMany({
    include: { teachers: true }
  });
  res.json(schools);
});

// قراءة كل المدرّسين مع بيانات المدرسة المرتبطة
app.get('/teachers', async (req, res) => {
  const teachers = await prisma.teacher.findMany({
    include: { school: true }
  });
  res.json(teachers);
});

// قراءة كل المدرّسين مع بيانات المدرسة المرتبطة
app.get('/teachers', async (req, res) => {
  const teachers = await prisma.teacher.findMany({
    include: { school: true }
  });
  res.json(teachers);
});

// قراءة كل الطلاب مع بيانات المدرّس المرتبط
app.get('/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { teacher: true }
    });
    res.json(students);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
  }
});


// إنشاء معلّم جديد مع معالجة الخطأ
app.post('/teachers', async (req, res) => {
  const { name, email, schoolId } = req.body;
  try {
    const teacher = await prisma.teacher.create({
      data: { name, email, schoolId },
    });
    return res.status(201).json(teacher);
  } catch (e) {
    // خطأ انتهاك قيد unique على حقل الـ email
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'هذا البريد مستخدم بالفعل.' });
    }
    // خطأ عام
    console.error(e);
    return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
  }
});


// إنشاء طالب جديد مع التحقق
app.post('/students', async (req, res) => {
  // 1) تحقق من صحة الجسم
  const { error, value } = studentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  // 2) استخدم القيمة المفلترة
  const { name, grade, teacherId } = value;

  // 3) إنشاء الطالب مع التقاط أخطاء Prisma
  try {
    const student = await prisma.student.create({ data: { name, grade, teacherId } });
    return res.status(201).json(student);
  } catch (e) {
    // مفتاح أجنبي خاطئ
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'teacherId غير موجود.' });
    }
    console.error(e);
    return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
  }
});


// إنشاء سؤال جديد
app.post('/questions', async (req, res) => {
  const { content, studentId } = req.body;
  const question = await prisma.question.create({
    data: { content, studentId }
  });
  res.status(201).json(question);
});

// قراءة كل الأسئلة مع الطالب صاحبها
app.get('/questions', async (req, res) => {
  const questions = await prisma.question.findMany({
    include: { askedBy: true }
  });
  res.json(questions);
});

// ===== تحديث وحذف المدارس =====

// تحديث مدرسة حسب المعرف
app.put('/schools/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, address } = req.body;
  try {
    const school = await prisma.school.update({
      where: { id },
      data: { name, address },
    });
    res.json(school);
  } catch (e) {
    res.status(404).json({ error: `School with id ${id} not found.` });
  }
});

// حذف مدرسة حسب المعرف
app.delete('/schools/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.school.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: `School with id ${id} not found.` });
  }
});


// ===== تحديث وحذف المدرّسين =====

// تحديث معلّم حسب المعرف
app.put('/teachers/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, schoolId } = req.body;
  try {
    const teacher = await prisma.teacher.update({
      where: { id },
      data: { name, email, schoolId },
    });
    res.json(teacher);
  } catch (e) {
    res.status(404).json({ error: `Teacher with id ${id} not found.` });
  }
});

// حذف معلّم حسب المعرف
app.delete('/teachers/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.teacher.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: `Teacher with id ${id} not found.` });
  }
});


// ===== تحديث وحذف الطلاب =====

// تحديث طالب حسب المعرف
app.put('/students/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, grade, teacherId } = req.body;
  try {
    const student = await prisma.student.update({
      where: { id },
      data: { name, grade, teacherId },
    });
    res.json(student);
  } catch (e) {
    res.status(404).json({ error: `Student with id ${id} not found.` });
  }
});

// حذف طالب حسب المعرف
app.delete('/students/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.student.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: `Student with id ${id} not found.` });
  }
});


// ===== تحديث وحذف الأسئلة =====

// تحديث سؤال حسب المعرف
app.put('/questions/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { content, studentId } = req.body;
  try {
    const question = await prisma.question.update({
      where: { id },
      data: { content, studentId },
    });
    res.json(question);
  } catch (e) {
    res.status(404).json({ error: `Question with id ${id} not found.` });
  }
});

// حذف سؤال حسب المعرف
app.delete('/questions/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.question.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: `Question with id ${id} not found.` });
  }
});

/////////////////////
// تشغيل السيرفر //
/////////////////////

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// ... جميع مسارات POST و GET و PUT و DELETE هنا ...

// أخيراً: شغِّل الخادم واستمع على المنفذ
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
