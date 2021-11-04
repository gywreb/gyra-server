const Column = require("../database/models/Column");
const Project = require("../database/models/Project");
const Task = require("../database/models/Task");
const User = require("../database/models/User");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");

exports.createTask = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  if (!authUser) return next(new ErrorResponse(401, "unauthorized"));
  const {
    task_key,
    name,
    description,
    priority,
    assignee,
    project,
    status,
    type,
  } = req.body;
  const existedProject = await Project.findById(project);
  if (!existedProject) return next(new ErrorResponse(404, "no project found"));

  const existedColumn = await Column.findById(status);
  if (!existedColumn) return next(new ErrorResponse(404, "no column found"));

  const task = new Task({
    task_key,
    name,
    description: description || null,
    priority,
    assignee,
    project,
    status,
    type,
    reporter: authUser._id,
  });

  const newTask = await task.save();
  await Project.updateOne(
    { _id: project },
    {
      $push: { tasks: newTask._id },
      lastTaskKey: existedProject.lastTaskKey + 1,
    }
  );
  await User.updateOne(
    { _id: authUser._id },
    { $push: { tasks: newTask._id } }
  );
  await User.updateOne({ _id: assignee }, { $push: { tasks: newTask._id } });
  await Column.updateOne({ _id: status }, { $push: { tasks: newTask._id } });
  res.status(201).json(
    new SuccessResponse(201, {
      newTask,
      lastTaskKey: existedProject.lastTaskKey + 1,
    })
  );
});

exports.getTaskListByProject = asyncMiddleware(async (req, res, next) => {
  const { projectId } = req.params;

  const existedProject = await Project.findById(projectId);
  if (!existedProject) return next(new ErrorResponse(404, "no project found"));

  const taskListByProject = await Task.find({ project: projectId });
  res.status(200).json(
    new SuccessResponse(200, {
      taskListByProject,
      lastTaskKey: existedProject.lastTaskKey,
    })
  );
});
