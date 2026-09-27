import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  status: { type: String, enum: ['PLANNING','IN_PROGRESS','COMPLETED','ARCHIVED'], default: 'PLANNING' },
  priority: { type: String, enum: ['LOW','MEDIUM','HIGH'], default: 'MEDIUM' },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

projectSchema.pre('validate', function(next) {
  if (this.startDate && this.dueDate && this.dueDate < this.startDate) {
    this.invalidate('dueDate', 'Due date must be on or after start date.');
  }
  next();
});

export default mongoose.model('Project', projectSchema);