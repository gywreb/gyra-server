const Activity = require("../database/models/Activity");
const Column = require("../database/models/Column");
const Project = require("../database/models/Project");
const Task = require("../database/models/Task");
const User = require("../database/models/User");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");
const { EmailService } = require("../services/EmailService");

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
  await User.updateOne(
    { _id: assignee },
    {
      $push: {
        tasks: newTask._id,
        notifications: {
          content: `${authUser.username} assigned ${newTask.task_key} - ${newTask.name} to you.`,
        },
      },
    }
  );

  existedColumn.tasks.push(newTask._id);
  const newColumn = await existedColumn.save();

  // EmailService.init();
  // await EmailService.sendInvitation(
  //   authUser.username,
  //   newTask.assignee.username,
  //   newTask.assignee.email,
  //   `${authUser.username} created ${newTask.task_key} - ${newTask.name}`,
  //   `${authUser.username} assigned ${newTask.task_key} - ${newTask.name} to you. Let check it out`,
  //   `${process.env.CLIENT_URL}/board/${project}`,
  //   next
  // );

  const activity = new Activity({
    content: `created ${newTask.task_key} - ${newTask.name}. This task was assigned to ${newTask.assignee.username}`,
    creator: authUser._id,
    target_user: task.assignee._id,
    project: project,
  });

  await activity.save();

  res.status(201).json(
    new SuccessResponse(201, {
      newTask,
      lastTaskKey: existedProject.lastTaskKey + 1,
      newColumn,
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

exports.moveTaskInBoard = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { fromColumnId, toColumnId, toIndex } = req.body;
  const { taskId } = req.params;
  const task = await Task.findById(taskId);
  const fromColumn = await Column.findById(fromColumnId);
  let toColumn = await Column.findById(toColumnId);
  if (!task || !fromColumn || !toColumn) {
    return next(new ErrorResponse(404, "Task or Column not found"));
  }
  if (fromColumnId === toColumnId) {
    toColumn = fromColumn;
  }

  const fromIndex = fromColumn.tasks.indexOf(taskId);
  if (fromIndex === -1) return next(new ErrorResponse(404, "Task not found"));

  fromColumn.tasks.splice(fromIndex, 1);
  await fromColumn.save();

  if (!toColumn.tasks.includes(taskId)) {
    if (toIndex === 0 || toIndex) {
      toColumn.tasks.splice(toIndex, 0, taskId);
    } else {
      toColumn.tasks.push(taskId);
    }
    await toColumn.save();
  }
  task.status = toColumn._id;
  const updatedTask = await task.save();

  let activity = null;
  if (fromColumn._id === toColumn._id) {
    activity = new Activity({
      content: `updated status of '${updatedTask.task_key} - ${updatedTask.name}'`,
      creator: authUser._id,
      target_user: updatedTask.assignee._id,
      project: updatedTask.project,
    });
  } else {
    activity = new Activity({
      content: `transitioned '${updatedTask.task_key} - ${updatedTask.name}' from '${fromColumn.name}' to '${toColumn.name}'`,
      creator: authUser._id,
      target_user: updatedTask.assignee._id,
      project: updatedTask.project,
    });
  }

  if (activity) await activity.save();

  res
    .status(200)
    .json(new SuccessResponse(200, { fromColumn, toColumn, updatedTask }));
});

exports.editTask = asyncMiddleware(async (req, res, next) => {
  const updateParams = req.body;
  const { taskId } = req.params;
  const authUser = req.user._doc;
  const task = await Task.findById(taskId);
  if (!task) return next(new ErrorResponse(404, "no task found"));
  if (
    !(
      (updateParams.managerId && authUser._id == updateParams.managerId) ||
      authUser._id.equals(task.reporter._id) ||
      authUser._id.equals(task.assignee._id)
    )
  ) {
    return next(
      new ErrorResponse(
        403,
        "you don't have the permission to perform this action"
      )
    );
  }

  const fromColumn = await Column.findById(task.status._id);
  let toColumn = await Column.findById(updateParams.status);

  if (updateParams.status && task.status._id == updateParams.status) {
    toColumn = fromColumn;
  }

  // update logic
  if (updateParams.status && !(task.status._id == updateParams.status)) {
    const fromIndex = fromColumn.tasks.findIndex(task => task == taskId);
    if (fromIndex === -1) return next(new ErrorResponse(404, "Task not found"));

    fromColumn.tasks.splice(fromIndex, 1);
    await fromColumn.save();

    if (!toColumn.tasks.includes(taskId)) {
      toColumn.tasks.push(taskId);
    }
    await toColumn.save();
  }

  for (let property in updateParams) {
    if (property in task) task[property] = updateParams[property];
  }

  const updatedTask = await task.save();

  if (updateParams.assignee && !(task.assignee._id == updateParams.assignee)) {
    await User.updateOne(
      { _id: task.assignee._id },
      { $pull: { tasks: taskId } }
    );
    await User.updateOne(
      { _id: updateParams.assignee },
      {
        $push: {
          tasks: taskId,
          notifications: {
            content: `${authUser.username} assigned '${newTask.task_key} - ${newTask.name}' to you.`,
          },
        },
      }
    );
  }

  let activity = null;
  if (toColumn) {
    if (fromColumn._id === toColumn._id) {
      activity = new Activity({
        content: `updated '${updatedTask.task_key} - ${updatedTask.name}'`,
        creator: authUser._id,
        target_user: updatedTask.assignee._id,
        project: updatedTask.project,
      });
    } else {
      activity = new Activity({
        content: `updated '${updatedTask.task_key} - ${updatedTask.name}'. '${updatedTask.task_key} - ${updatedTask.name}' transitioned from '${fromColumn.name}' to '${toColumn.name}'`,
        creator: authUser._id,
        target_user: updatedTask.assignee._id,
        project: updatedTask.project,
      });
    }
  } else {
    activity = new Activity({
      content: `updated '${updatedTask.task_key} - ${updatedTask.name}'`,
      creator: authUser._id,
      target_user: updatedTask.assignee._id,
      project: updatedTask.project,
    });
  }

  if (activity) await activity.save();

  res
    .status(200)
    .json(new SuccessResponse(200, { fromColumn, toColumn, updatedTask }));
});
