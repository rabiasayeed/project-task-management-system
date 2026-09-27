import Notification from '../models/Notification.js';
import Task from '../models/Task.js';

export const notify = (user, message, type, entityId = null) =>
  Notification.create({ user, message, type, entityId });

export async function generateDueSoonNotifications() {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tasks = await Task.find({
    assignedUser: { $ne: null },
    status: { $ne: 'COMPLETED' },
    dueDate: { $gt: now, $lte: soon }
  }).select('_id title assignedUser');

  for (const task of tasks) {
    const exists = await Notification.exists({
      user: task.assignedUser,
      type: 'DUE_SOON',
      entityId: task._id
    });
    if (!exists) {
      await Notification.create({
        user: task.assignedUser,
        type: 'DUE_SOON',
        entityId: task._id,
        message: `Task "${task.title}" is approaching its due date.`
      });
    }
  }
}
