import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['PROJECT_MEMBER','TASK_ASSIGNED','TASK_COMPLETED','DUE_SOON'], default: 'TASK_ASSIGNED' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  read: { type: Boolean, default: false }
}, { timestamps: true });

schema.index({ user: 1, type: 1, entityId: 1 }, { unique: false });

export default mongoose.model('Notification', schema);
