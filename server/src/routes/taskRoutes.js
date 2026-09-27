import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as c from '../controllers/taskController.js';
const r=Router(); r.use(protect);
r.get('/',c.listTasks); r.post('/',c.createTask); r.get('/:id',c.getTask); r.put('/:id',c.updateTask); r.delete('/:id',c.deleteTask);
export default r;