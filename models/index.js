'use strict';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';   // ← استيراد jsonwebtoken

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

// ===== CRUD المدرّسين =====
app.post('/teachers', async (req, res) => {
  const { error, value } = teacherSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const teacher = await prisma.teacher.create({ data: value });
    return res.status(201).json(teacher);
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'هذا البريد مستخدم بالفعل.' });
    }
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'schoolId غير موجود.' });
    }
    return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم.' });
  }
});

app.get('/teachers', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({ include: { school: true } });
    return res.json(teachers);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ===== CRUD الطلاب =====
app.post('/students', async (req, res) => {
  const { error, value } = studentSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, grade, teacherId } = value;

  try {
    const student = await prisma.student.create({ data: { name, grade, teacherId } });
    return res.status(201).json(student);
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'اسم الطالب مسجل مسبقًا.' });
    }
    if (e.code === 'P2003') {
      return res.status(400).json({ error: 'teacherId غير موجود.' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({ include: { teacher: true } });
    return res.json(students);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ** تحديث طالب حسب المعرف **
app.put('/students/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, grade, teacherId } = req.body;

  try {
    const student = await prisma.student.update({
      where: { id },
      data: { name, grade, teacherId },
    });
    return res.json(student);
  } catch (e) {
    console.error(e);
    return res.status(404).json({ error: `Student with id ${id} not found.` });
  }
});

// ** حذف طالب حسب المعرف **
app.delete('/students/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.student.delete({ where: { id } });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(404).json({ error: `Student with id ${id} not found.` });
  }
});

// ===== CRUD الأسئلة =====
app.post('/questions', async (req, res) => {
  const { error, value } = questionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const question = await prisma.question.create({ data: value });
    return res.status(201).json(question);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({ include: { askedBy: true } });
    return res.json(questions);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ** تحديث سؤال حسب المعرف **
app.put('/questions/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { content } = req.body;

  try {
    const question = await prisma.question.update({
      where: { id },
      data: { content },
    });
    return res.json(question);
  } catch (e) {
    console.error(e);
    return res.status(404).json({ error: `Question with id ${id} not found.` });
  }
});

// ** حذف سؤال حسب المعرف **
app.delete('/questions/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.question.delete({ where: { id } });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(404).json({ error: `Question with id ${id} not found.` });
  }
});

// ===== معالج التسجيل (Signup) مع تجزئة كلمة المرور =====
app.post('/signup', async (req, res) => {
  console.log('BODY:', req.body);
  const { name, email, schoolId, password } = req.body;

  const schema = Joi.object({
    name:     Joi.string().required(),
    email:    Joi.string().email().required(),
    schoolId: Joi.number().integer().positive().required(),
    password: Joi.string().min(6).required(),
  });
  const { error: vErr } = schema.validate({ name, email, schoolId, password });
  if (vErr) {
    return res.status(400).json({ error: vErr.details[0].message });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, schoolId, password: hashedPassword }
    });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (e) {
    console.error(e);
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

// ===== مسار تسجيل الدخول (Login) =====
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ===== نقاط البداية والاختبار =====
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.get('/signup', (req, res) => {
  res.send('Welcome to the signup page');
});

app.get('/ping-db', async (req, res) => {
  try {
    const [{ now }] = await prisma.$queryRaw`SELECT NOW()`;
    return res.json({ now });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ===== CRUD المدارس =====
app.post('/schools', async (req, res) => {
  const { name, address } = req.body;
  try {
    const school = await prisma.school.create({ data: { name, address } });
    return res.status(201).json(school);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/schools', async (req, res) => {
  try {
    const schools = await prisma.school.findMany({ include: { teachers: true } });
    return res.json(schools);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/schools/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, address } = req.body;
  try {
    const school = await prisma.school.update({ where: { id }, data: { name, address } });
    return res.json(school);
  } catch {
    return res.status(404).json({ error: `School with id ${id} not found.` });
  }
});

app.delete('/schools/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.school.delete({ where: { id } });
    return res.status(204).send();
  } catch {
    return res.status(404).json({ error: `School with id ${id} not found.` });
  }
});

// ===== تشغيل السيرفر =====
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
