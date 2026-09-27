import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { notify } from '../utils/notify.js';

const data = body => ({
  name: body.name,
  description: body.description,
  status: body.status,
  priority: body.priority,
  startDate: body.startDate,
  dueDate: body.dueDate
});

export async function listProjects(req, res) {
  const filter = req.user.role === 'ADMIN'
    ? {}
    : {
        $or: [
          { owner: req.user._id },
          { members: req.user._id }
        ]
      };

  const projects = await Project.find(filter)
    .populate('owner members', 'name email role')
    .sort({ createdAt: -1 });

  res.json({ projects });
}

export async function createProject(req, res) {
  const project = await Project.create({
    ...data(req.body),
    owner: req.user._id,
    members: []
  });

  await project.populate(
    'owner members',
    'name email role'
  );

  res.status(201).json({
    project
  });
}

export async function getProjectDetails(req, res) {
  /*
   * Fetch the project directly using the ID from the URL.
   * This prevents req.project._id from crashing when
   * req.project is null.
   */

  const project = await Project.findById(
    req.params.id
  ).populate(
    'owner members',
    'name email role'
  );

  if (!project) {
    return res.status(404).json({
      message: 'Project not found.'
    });
  }

  /*
   * Check whether the current user can access
   * this project.
   */

  const isAdmin =
    req.user.role === 'ADMIN';

  const isOwner =
    project.owner &&
    project.owner._id.equals(req.user._id);

  const isMember =
    project.members?.some(
      member => member._id.equals(req.user._id)
    );

  if (!isAdmin && !isOwner && !isMember) {
    return res.status(403).json({
      message: 'You are not a member of this project.'
    });
  }

  /*
   * Get all tasks belonging to this project.
   */

  const tasks = await Task.find({
    project: project._id
  })
    .populate(
      'assignedUser',
      'name email'
    )
    .sort({
      createdAt: -1
    });

  res.json({
    project,
    tasks
  });
}

export async function updateProject(req, res) {
  if (!req.project) {
    return res.status(404).json({
      message: 'Project not found.'
    });
  }

  Object.assign(
    req.project,
    data(req.body)
  );

  await req.project.save();

  await req.project.populate(
    'owner members',
    'name email role'
  );

  res.json({
    project: req.project
  });
}

export async function deleteProject(req, res) {
  if (!req.project) {
    return res.status(404).json({
      message: 'Project not found.'
    });
  }

  await Task.deleteMany({
    project: req.project._id
  });

  await req.project.deleteOne();

  res.json({
    message: 'Project deleted.'
  });
}

export async function archiveProject(req, res) {
  if (!req.project) {
    return res.status(404).json({
      message: 'Project not found.'
    });
  }

  req.project.status = 'ARCHIVED';

  await req.project.save();

  await req.project.populate(
    'owner members',
    'name email role'
  );

  res.json({
    project: req.project
  });
}

export async function addMember(req, res) {
  if (!req.project) {
    return res.status(404).json({
      message: 'Project not found.'
    });
  }

  const email = String(
    req.body.email || ''
  )
    .trim()
    .toLowerCase();

  const user = req.body.userId
    ? await User.findById(req.body.userId)
    : await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      message: 'User not found.'
    });
  }

  /*
   * Make sure the project owner exists.
   */

  if (!req.project.owner) {
    return res.status(400).json({
      message: 'Project owner is missing.'
    });
  }

  if (
    req.project.owner.equals(user._id)
  ) {
    return res.status(400).json({
      message:
        'The project owner is already a project member.'
    });
  }

  /*
   * Make sure members exists before using .some()
   */

  if (!req.project.members) {
    req.project.members = [];
  }

  const alreadyMember =
    req.project.members.some(
      member => member.equals(user._id)
    );

  if (!alreadyMember) {
    req.project.members.push(user._id);

    await req.project.save();

    await notify(
      user._id,
      `You were added to project "${req.project.name}".`,
      'PROJECT_MEMBER',
      req.project._id
    );
  }

  await req.project.populate(
    'owner members',
    'name email role'
  );

  res.json({
    project: req.project
  });
}

export async function removeMember(req, res) {
  if (!req.project) {
    return res.status(404).json({
      message: 'Project not found.'
    });
  }

  if (!req.body.userId) {
    return res.status(400).json({
      message: 'userId is required.'
    });
  }

  if (!req.project.members) {
    req.project.members = [];
  }

  req.project.members =
    req.project.members.filter(
      member => !member._id.equals(
        req.body.userId
      )
    );

  await req.project.save();

  await req.project.populate(
    'owner members',
    'name email role'
  );

  res.json({
    project: req.project
  });
}