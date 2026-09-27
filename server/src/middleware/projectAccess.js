import Project from '../models/Project.js';

export async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    // Important: prevent null owner errors
    if (!project.owner) {
      console.error(
        `Project ${project._id} has no valid owner in the database.`
      );

      return res.status(500).json({
        message: 'This project has an invalid owner. Please recreate the project.'
      });
    }

    req.project = project;

    next();
  } catch (error) {
    console.error('getProject middleware error:', error);

    return res.status(500).json({
      message: 'Unable to load project.',
      error: error.message
    });
  }
}

export function ownerOnly(req, res, next) {
  try {
    if (!req.project) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    if (!req.project.owner) {
      return res.status(500).json({
        message: 'This project has no valid owner.'
      });
    }

    const isAdmin = req.user?.role === 'ADMIN';

    const isOwner =
      req.user?._id &&
      req.project.owner._id.equals(req.user._id);

    if (isAdmin || isOwner) {
      return next();
    }

    return res.status(403).json({
      message: 'Only the project owner can do this.'
    });
  } catch (error) {
    console.error('ownerOnly middleware error:', error);

    return res.status(500).json({
      message: 'Unable to verify project ownership.',
      error: error.message
    });
  }
}

export function projectMember(req, res, next) {
  try {
    if (!req.project) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    if (!req.project.owner) {
      return res.status(500).json({
        message: 'This project has no valid owner.'
      });
    }

    const isAdmin = req.user?.role === 'ADMIN';

    const isOwner =
      req.user?._id &&
      req.project.owner._id.equals(req.user._id);

    const isMember =
      Array.isArray(req.project.members) &&
      req.project.members.some(
        member => member?._id?.equals(req.user._id)
      );

    if (isAdmin || isOwner || isMember) {
      return next();
    }

    return res.status(403).json({
      message: 'You are not a member of this project.'
    });
  } catch (error) {
    console.error('projectMember middleware error:', error);

    return res.status(500).json({
      message: 'Unable to verify project membership.',
      error: error.message
    });
  }
}