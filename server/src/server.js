import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { generateDueSoonNotifications } from './utils/notify.js';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ message: 'API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
  }
  if (err.code === 11000) return res.status(409).json({ message: 'A record with this value already exists.' });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await generateDueSoonNotifications();
    setInterval(() => generateDueSoonNotifications().catch(console.error), 15 * 60 * 1000);
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  })
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });