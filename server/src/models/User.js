import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.']
  },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
