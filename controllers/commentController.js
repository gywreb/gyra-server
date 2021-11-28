const Activity = require("../database/models/Activity");
const Comment = require("../database/models/Comment");
const Project = require("../database/models/Project");
const Task = require("../database/models/Task");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");

exports.createComment = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { taskId } = req.params;
  const { content, projectId } = req.body;

  const project = await Project.findById(projectId);
  if (!project)
    return next(new ErrorResponse(404, "this project is not exist"));

  const task = await Task.findById(taskId);
  if (!task) return next(new ErrorResponse(404, "this task is not exist"));

  const comment = new Comment({
    sender: authUser._id,
    task: taskId,
    content,
  });

  const newComment = await comment.save();

  const activity = new Activity({
    content: `commented on '${task.task_key} - ${task.name}'.`,
    subContent: content,
    creator: authUser._id,
    target_user: task.assignee._id,
    project: project._id,
  });

  await activity.save();

  res.json(new SuccessResponse(200, { newComment }));
});

exports.getCommentsByTask = asyncMiddleware(async (req, res, next) => {
  const { taskId } = req.params;
  const { perPage, page } = req.query;
  const task = await Task.findById(taskId);
  if (!task) return next(new ErrorResponse(404, " this task is not exist"));

  const commentList = await Comment.paginate(
    {
      task: taskId,
    },
    {
      page,
      limit: perPage,
      sort: { createdAt: -1 },
    }
  );

  res.json(new SuccessResponse(200, { commentList }));
});
