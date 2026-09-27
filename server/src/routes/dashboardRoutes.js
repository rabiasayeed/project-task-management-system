import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { dashboard } from '../controllers/dashboardController.js';
const r=Router(); r.get('/',protect,dashboard); export default r;