import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
  description: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['TODO','IN_PROGRESS','REVIEW','COMPLETED'], default: 'TODO' },
  priority: { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },
  dueDate: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);