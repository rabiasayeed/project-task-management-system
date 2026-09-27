import Notification from '../models/Notification.js';
import { generateDueSoonNotifications } from '../utils/notify.js';

export async function list(req, res) {
  await generateDueSoonNotifications();
  res.json({ notifications: await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }) });
}

export async function read(req, res) {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!n) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ notification: n });
}

export async function readAll(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read.' });
}
