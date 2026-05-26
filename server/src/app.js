import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import journalRoutes from './routes/journals.js';
import gradeRoutes from './routes/grades.js';
import attendanceRoutes from './routes/attendance.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import assignmentRoutes from './routes/assignments.js';
import workRoutes from './routes/works.js';
import disciplineRoutes from './routes/disciplines.js';
import lessonTypeRoutes from './routes/lessonTypes.js';
import lessonRoutes from './routes/lessons.js';
import deanRoutes from './routes/dean.js';
import settingsRoutes from './routes/settings.js';
import Setting from './models/Setting.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('pinggy') || origin.includes('trycloudflare') || origin.includes('ngrok')) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

// Debug logging for tunnel requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/works', workRoutes);
app.use('/api/disciplines', disciplineRoutes);
app.use('/api/lesson-types', lessonTypeRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dean', deanRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from client/dist for tunnel/share mode
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);

Setting.ensureTable().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize settings table:', err);
  process.exit(1);
});
