import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
  }
  if (!emailPattern.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email is already registered.' });

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12)
  });

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token: signToken(user)
  });
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token: signToken(user)
  });
}

export async function me(req, res) {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
}
