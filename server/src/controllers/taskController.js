import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { notify } from '../utils/notify.js';

function isOverdue(t) {
  return t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date();
}

function isProjectMember(project, user) {
  return user.role === 'ADMIN' ||
    project.owner.equals(user._id) ||
    project.members.some(m => m.equals(user._id));
}

export async function listTasks(req, res) {
  const {
    search,
    status,
    priority,
    assignedUser,
    dueBefore,
    dueAfter,
    pending,
    overdue,
    sort = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
    project
  } = req.query;

  const accessibleProjects = req.user.role === 'ADMIN'
    ? null
    : await Project.find({
        $or: [
          { owner: req.user._id },
          { members: req.user._id }
        ]
      }).select('_id');

  const filter = {};

  if (accessibleProjects) {
    filter.project = {
      $in: accessibleProjects.map(p => p._id)
    };
  }

  if (project) {
    filter.project = project;
  }

  if (search) {
    filter.title = {
      $regex: search,
      $options: 'i'
    };
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (assignedUser) {
    filter.assignedUser = assignedUser;
  }

  if (pending === 'true') {
    filter.status = {
      $ne: 'COMPLETED'
    };
  }

  if (overdue === 'true') {
    filter.status = {
      $ne: 'COMPLETED'
    };

    filter.dueDate = {
      ...(filter.dueDate || {}),
      $lt: new Date()
    };
  }

  if (dueBefore || dueAfter) {
    filter.dueDate = {};

    if (dueBefore) {
      filter.dueDate.$lte = new Date(
        `${dueBefore}T23:59:59.999`
      );
    }

    if (dueAfter) {
      filter.dueDate.$gte = new Date(
        `${dueAfter}T00:00:00.000`
      );
    }
  }

  const safeSort = [
    'createdAt',
    'priority',
    'dueDate'
  ].includes(sort)
    ? sort
    : 'createdAt';

  const direction = order === 'asc' ? 1 : -1;

  const total = await Task.countDocuments(filter);

  const pageNum = Math.max(
    1,
    Number(page)
  );

  const size = Math.min(
    50,
    Math.max(1, Number(limit))
  );

  const tasks = await Task.find(filter)
    .populate('project', 'name owner')
    .populate('assignedUser', 'name email')
    .sort({
      [safeSort]: direction
    })
    .skip((pageNum - 1) * size)
    .limit(size);

  res.json({
    tasks: tasks.map(t => ({
      ...t.toObject(),
      isOverdue: isOverdue(t)
    })),

    pagination: {
      page: pageNum,
      totalPages: Math.max(
        1,
        Math.ceil(total / size)
      ),
      totalRecords: total,
      limit: size
    }
  });
}

export async function createTask(req, res) {
  const project = await Project.findById(
    req.body.project
  );

  if (!project) {
    return res.status(404).json({
      message: 'Project not found.'
    });
  }

  if (!isProjectMember(project, req.user)) {
    return res.status(403).json({
      message: 'You are not a project member.'
    });
  }

  if (
    req.body.assignedUser &&
    !project.members.some(
      m => m.equals(req.body.assignedUser)
    ) &&
    !project.owner.equals(
      req.body.assignedUser
    ) &&
    req.user.role !== 'ADMIN'
  ) {
    return res.status(400).json({
      message: 'Assigned user must belong to the project.'
    });
  }

  const task = await Task.create(req.body);

  if (task.assignedUser) {
    await notify(
      task.assignedUser,
      `You were assigned task "${task.title}".`,
      'TASK_ASSIGNED',
      task._id
    );
  }

  // Populate project and assigned user
  // separately after creating the task
  await task.populate([
    {
      path: 'project',
      select: 'name owner'
    },
    {
      path: 'assignedUser',
      select: 'name email'
    }
  ]);

  res.status(201).json({
    task
  });
}

export async function getTask(req, res) {
  const task = await Task.findById(
    req.params.id
  ).populate(
    'project assignedUser',
    'name email owner members'
  );

  if (!task) {
    return res.status(404).json({
      message: 'Task not found.'
    });
  }

  const project = await Project.findById(
    task.project._id
  );

  if (
    !project ||
    !isProjectMember(project, req.user)
  ) {
    return res.status(403).json({
      message: 'You are not a member of this project.'
    });
  }

  res.json({
    task: {
      ...task.toObject(),
      isOverdue: isOverdue(task)
    }
  });
}

export async function updateTask(req, res) {
  const task = await Task.findById(
    req.params.id
  ).populate('project');

  if (!task) {
    return res.status(404).json({
      message: 'Task not found.'
    });
  }

  const p = task.project;

  const allowed = isProjectMember(
    p,
    req.user
  );

  if (!allowed) {
    return res.status(403).json({
      message: 'You are not a project member.'
    });
  }

  if (
    req.user.role !== 'ADMIN' &&
    !p.owner.equals(req.user._id) &&
    task.assignedUser &&
    !task.assignedUser.equals(req.user._id)
  ) {
    return res.status(403).json({
      message: 'Members can update only tasks assigned to them.'
    });
  }

  if (
    req.body.assignedUser &&
    !p.members.some(
      m => m.equals(req.body.assignedUser)
    ) &&
    !p.owner.equals(
      req.body.assignedUser
    ) &&
    req.user.role !== 'ADMIN'
  ) {
    return res.status(400).json({
      message: 'Assigned user must belong to the project.'
    });
  }

  const wasCompleted =
    task.status === 'COMPLETED';

  const previousAssignedUser =
    task.assignedUser
      ? String(task.assignedUser)
      : '';

  Object.assign(
    task,
    req.body
  );

  await task.save();

  if (
    !wasCompleted &&
    task.status === 'COMPLETED'
  ) {
    await notify(
      p.owner,
      `Task "${task.title}" was completed.`,
      'TASK_COMPLETED',
      task._id
    );
  }

  if (
    req.body.assignedUser &&
    String(req.body.assignedUser) !==
      previousAssignedUser
  ) {
    await notify(
      req.body.assignedUser,
      `You were assigned task "${task.title}".`,
      'TASK_ASSIGNED',
      task._id
    );
  }

  // Populate project and assigned user
  // separately after updating the task
  await task.populate([
    {
      path: 'project',
      select: 'name owner'
    },
    {
      path: 'assignedUser',
      select: 'name email'
    }
  ]);

  res.json({
    task
  });
}

export async function deleteTask(req, res) {
  const task = await Task.findById(
    req.params.id
  ).populate('project');

  if (!task) {
    return res.status(404).json({
      message: 'Task not found.'
    });
  }

  const p = task.project;

  if (
    !(
      req.user.role === 'ADMIN' ||
      p.owner.equals(req.user._id)
    )
  ) {
    return res.status(403).json({
      message: 'Only the project owner can delete tasks.'
    });
  }

  await task.deleteOne();

  res.json({
    message: 'Task deleted.'
  });
}