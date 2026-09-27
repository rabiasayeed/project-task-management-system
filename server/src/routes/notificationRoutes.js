import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as c from '../controllers/notificationController.js';
const r=Router(); r.use(protect); r.get('/',c.list); r.patch('/:id/read',c.read); r.patch('/read-all',c.readAll); export default r;