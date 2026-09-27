import { Router } from 'express';
import { listUsers } from '../controllers/userController.js';
import { protect, requireRole } from '../middleware/auth.js';
const r=Router(); r.get('/',protect,requireRole('ADMIN'),listUsers); export default r;