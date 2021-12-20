const { omit } = require("lodash");
const Activity = require("../database/models/Activity");
const Column = require("../database/models/Column");
const Notification = require("../database/models/Notification");
const Project = require("../database/models/Project");
const Task = require("../database/models/Task");
const User = require("../database/models/User");
const UserStory = require("../database/models/UserStory");
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
    subtasks,
    userStory,
  } = req.body;
  const existedProject = await Project.findById(project);
  if (!existedProject) return next(new ErrorResponse(404, "no project found"));

  const existedColumn = await Column.findById(status);
  if (!existedColumn) return next(new ErrorResponse(404, "no column found"));

  if (subtasks.length === 0)
    return next(new ErrorResponse(400, "subtasks is required"));

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
    subtasks,
    userStory,
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

  await UserStory.updateOne(
    { _id: userStory },
    { $push: { tasks: newTask._id } }
  );

  if (!authUser._id.equals(assignee)) {
    const notification = new Notification({
      sender: authUser._id,
      content: `assigned '${newTask.task_key} - ${newTask.name}' to you.`,
      seen: false,
      owner: assignee,
    });

    await notification.save();
  }

  await User.updateOne(
    { _id: assignee },
    {
      $push: {
        tasks: newTask._id,
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
    content: `created '${newTask.task_key} - ${newTask.name}'. This task was assigned to ${newTask.assignee.username}`,
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
      subContent: `<p>+ status: <em>${fromColumn.name} =&gt; </em><strong><em>${toColumn.name}</em></strong></p>`,
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

  let oldTask = {};
  for (let property in updateParams) {
    if (property in task) {
      oldTask[property] = task[property];
      task[property] = updateParams[property];
    }
  }

  const updatedTask = await task.save();

  if (updateParams.assignee && !(task.assignee._id == updateParams.assignee)) {
    await User.updateOne(
      { _id: task.assignee._id },
      { $pull: { tasks: taskId } }
    );

    const notification = new Notification({
      sender: authUser._id,
      content: `assigned '${task.task_key} - ${task.name}' to you.`,
      seen: false,
      owner: updateParams.assignee,
    });

    await notification.save();

    await User.updateOne(
      { _id: updateParams.assignee },
      {
        $push: {
          tasks: taskId,
        },
      }
    );
  }
  let subContent = "";
  oldTask = omit(oldTask, [
    "_id",
    "reporter",
    "project",
    "task_key",
    "createdAt",
    "updatedAt",
  ]);
  for (let property in updateParams) {
    if (property in oldTask) {
      switch (property) {
        case "assignee": {
          if (!oldTask[property]._id.equals(updatedTask[property]._id))
            subContent += `<p>+ ${property}: <em>${oldTask[property].username} =&gt; </em><strong><em>${updatedTask[property].username}</em></strong></p>`;
          break;
        }
        case "status": {
          if (!oldTask[property]._id.equals(updatedTask[property]._id)) {
            if (
              updateParams.status &&
              !(oldTask[property]._id == updateParams.status)
            )
              subContent += `<p>+ ${property}: <em>${oldTask[property].name} =&gt; </em><strong><em>${updatedTask[property].name}</em></strong></p>`;
          }
          break;
        }
        case "description": {
          break;
        }
        default:
          if (!(oldTask[property] == updatedTask[property]))
            subContent += `<p>+ ${property}: <em>${oldTask[property]} =&gt; </em><strong><em>${updatedTask[property]}</em></strong></p>`;
          break;
      }
    }
  }

  const activity = new Activity({
    content: `updated '${updatedTask.task_key} - ${updatedTask.name}'.`,
    subContent: subContent.length ? subContent : null,
    creator: authUser._id,
    target_user: updatedTask.assignee._id,
    project: updatedTask.project,
  });

  await activity.save();

  if (oldTask.description && oldTask.description != updatedTask.description) {
    const descActivity = new Activity({
      content: `updated '${updatedTask.task_key} - ${updatedTask.name}' description`,
      subContent: updatedTask.description,
      creator: authUser._id,
      target_user: updatedTask.assignee._id,
      project: updatedTask.project,
    });

    await descActivity.save();
  }

  res
    .status(200)
    .json(new SuccessResponse(200, { fromColumn, toColumn, updatedTask }));
});

exports.toggleSubTaskStatus = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { subTaskId, taskId } = req.body;

  const task = await Task.findById(taskId);
  const subtask = task.subtasks.find(st => st.id === subTaskId);

  if (!authUser._id.equals(task.assignee._id))
    return next(new ErrorResponse(403, "you don't have the permission"));

  const subtaskIndex = task.subtasks.findIndex(st => st.id === subTaskId);
  if (!subtask || subtaskIndex === -1)
    return next(new ErrorResponse(404, "subtask not found"));

  task.subtasks = [
    ...task._doc.subtasks.slice(0, subtaskIndex),
    { ...subtask._doc, isDone: !subtask.isDone, isRejected: false },
    ...task._doc.subtasks.slice(subtaskIndex + 1),
  ];

  const updatedTask = await task.save();
  res.json(new SuccessResponse(200, { updatedTask }));
});

exports.doneTask = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  const column = await Column.findById(task.status._id);

  if (!authUser._id.equals(task.assignee._id))
    return next(new ErrorResponse(403, "you don't have the permission"));

  if (task.subtasks.some(st => !st.isDone))
    return next(
      new ErrorResponse(404, "please complete all the subtask first")
    );

  task.isDone = true;
  task.isClose = false;
  task.isResolve = false;
  task.isWorking = false;
  const updatedTask = await task.save();

  column.tasks = column.tasks.filter(t => t != taskId);
  const updatedColumn = await column.save();

  const activity = new Activity({
    content: `transitioned '${updatedTask.task_key} - ${updatedTask.name}' to "DONE".`,
    subContent: null,
    creator: authUser._id,
    target_user: updatedTask.assignee._id,
    project: updatedTask.project,
  });

  await activity.save();

  const notification = new Notification({
    sender: authUser._id,
    content: `has done '${updatedTask.task_key} - ${updatedTask.name}'.Please review it`,
    seen: false,
    owner: updatedTask.reporter._id,
  });

  await notification.save();

  res.json(new SuccessResponse(200, { updatedTask, updatedColumn }));
});

exports.resolvedTask = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { taskId } = req.params;

  const task = await Task.findById(taskId);

  if (!authUser._id.equals(task.reporter._id))
    return next(new ErrorResponse(403, "you don't have the permission"));
  if (!task.isDone)
    return next(new ErrorResponse(400, "this task is not done yet"));
  task.isDone = false;
  task.isClose = false;
  task.isResolve = true;
  task.isWorking = false;
  const updatedTask = await task.save();

  const activity = new Activity({
    content: `transitioned '${updatedTask.task_key} - ${updatedTask.name}' to "RESOLVE".`,
    subContent: null,
    creator: authUser._id,
    target_user: updatedTask.assignee._id,
    project: updatedTask.project,
  });

  await activity.save();

  const notification = new Notification({
    sender: authUser._id,
    content: `approved '${updatedTask.task_key} - ${updatedTask.name}'. Good work and keep up`,
    seen: false,
    owner: updatedTask.assignee._id,
  });

  await notification.save();

  res.json(new SuccessResponse(200, { updatedTask }));
});

exports.closeTask = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { taskId } = req.params;

  const task = await Task.findById(taskId);

  if (!authUser._id.equals(task.reporter._id))
    return next(new ErrorResponse(403, "you don't have the permission"));
  if (!task.isDone)
    return next(new ErrorResponse(400, "this task is not done yet"));

  task.isDone = false;
  task.isClose = true;
  task.isResolve = false;
  task.isWorking = false;
  const updatedTask = await task.save();

  res.json(new SuccessResponse(200, { updatedTask }));
});

exports.toggleRejectSubTask = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { subTaskId, taskId } = req.body;

  const task = await Task.findById(taskId);

  if (!authUser._id.equals(task.reporter._id))
    return next(new ErrorResponse(403, "you don't have the permission"));
  if (!task.isDone)
    return next(new ErrorResponse(400, "this task is not done yet"));

  const subtask = task.subtasks.find(st => st.id === subTaskId);
  const subtaskIndex = task.subtasks.findIndex(st => st.id === subTaskId);
  if (!subtask || subtaskIndex === -1)
    return next(new ErrorResponse(404, "subtask not found"));

  task.subtasks = [
    ...task._doc.subtasks.slice(0, subtaskIndex),
    {
      ...subtask._doc,
      isDone: !subtask.isDone,
      isRejected: !subtask.isRejected,
    },
    ...task._doc.subtasks.slice(subtaskIndex + 1),
  ];

  const updatedTask = await task.save();
  res.json(new SuccessResponse(200, { updatedTask }));
});

exports.addSubTask = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { taskId } = req.params;
  const { content } = req.body;

  const task = await Task.findById(taskId);

  if (!authUser._id.equals(task.reporter._id))
    return next(new ErrorResponse(403, "you don't have the permission"));

  task.subtasks.push({
    id: task.subtasks.length + 1,
    content,
  });

  const updatedTask = await task.save();
  res.json(new SuccessResponse(200, { updatedTask }));
});

exports.reopenTask = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { taskId } = req.params;
  const { reopenColumn } = req.body;

  const task = await Task.findById(taskId);
  const column = await Column.findById(reopenColumn);

  if (task.isWorking)
    return next(new ErrorResponse(400, "you can't re-open ongoing task"));

  task.isDone = false;
  task.isClose = false;
  task.isResolve = false;
  task.isWorking = true;
  task.status = column._id;
  const updatedTask = await task.save();

  column.tasks.push(updatedTask._id);
  const updatedColumn = await column.save();

  const activity = new Activity({
    content: `re-opened '${updatedTask.task_key} - ${updatedTask.name}'.`,
    subContent: null,
    creator: authUser._id,
    target_user: updatedTask.assignee._id,
    project: updatedTask.project,
  });

  await activity.save();

  if (!authUser._id.equals(updatedTask.assignee._id)) {
    const notification = new Notification({
      sender: authUser._id,
      content: `re-opened '${updatedTask.task_key} - ${updatedTask.name}'. Please work on it to see the problem`,
      seen: false,
      owner: updatedTask.assignee._id,
    });

    await notification.save();
  }

  res.json(new SuccessResponse(200, { updatedTask, updatedColumn }));
});
