const { omit } = require("lodash");
const moment = require("moment");
const Activity = require("../database/models/Activity");
const Notification = require("../database/models/Notification");
const Project = require("../database/models/Project");
const User = require("../database/models/User");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");

exports.createProject = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  if (!authUser) return next(new ErrorResponse(401, "unauthorized"));
  const { name, key, description, begin_date, end_date, members } = req.body;
  if (authUser.projectKeys) {
    if (authUser.projectKeys.includes(key)) {
      return next(new ErrorResponse(400, `key "${key}" is already existed !`));
    }
  }
  if (members && members.length) {
    const isContain = members.every(user =>
      !(authUser._id == user) && authUser.team.includes(user) ? true : false
    );
    if (!isContain)
      return next(
        new ErrorResponse(404, "one or more user is not in your team")
      );
  }
  const project = new Project({
    manager: authUser._id,
    name,
    key,
    description: description || null,
    begin_date,
    end_date: end_date || null,
    members: members && members.length ? [...members] : [],
  });

  const newProject = await project.save();

  const activity = new Activity({
    content: `created this project`,
    creator: authUser._id,
    target_user: null,
    project: newProject._id,
  });

  await activity.save();

  await User.updateOne(
    { _id: authUser._id },
    { $push: { projects: newProject._id, projectKeys: key } }
  );

  if (members && members.length) {
    const multiNotiInsert = members.map(userId => ({
      sender: authUser._id,
      content: `just added you to project: '${newProject.key} - ${newProject.name}'`,
      seen: false,
      owner: userId,
    }));

    await Notification.insertMany(multiNotiInsert);

    await User.updateMany(
      { _id: members },
      {
        $push: {
          projects: newProject._id,
        },
      }
    );
  }
  res.status(201).json(new SuccessResponse(201, { newProject }));
});

exports.getProjects = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  if (!authUser) return next(new ErrorResponse(401, "unauthorized"));
  const ownProjects = await Project.find({
    manager: authUser._id,
  });
  const joinedProjects = await Project.find({
    members: authUser._id,
  });
  const projectList = [...ownProjects, ...joinedProjects].sort((a, b) =>
    a.createdAt - b.createdAt > 0 ? -1 : 1
  );
  res.status(200).json(new SuccessResponse(200, { projectList }));
});

exports.getProjectDetail = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { id } = req.params;
  const project = await Project.findOne({ _id: id });
  if (!project) return next(new ErrorResponse(404, "no project found!"));
  const isInProject =
    project.manager._id.equals(authUser._id) ||
    project.members.find(member => authUser._id.equals(member._id));
  if (!isInProject)
    return next(new ErrorResponse(401, "you can not access this project"));
  res.status(200).json(new SuccessResponse(200, { project }));
});

exports.editProject = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { id } = req.params;
  const updateParams = req.body;

  const project = await Project.findById(id);
  if (!project) return next(new ErrorResponse(404, "no project found"));

  if (!project.manager.equals(authUser._id))
    return next(
      new ErrorResponse(403, "you have no permission to perform this action")
    );

  const updateableParams = omit(updateParams, [
    "manager",
    "key",
    "lastTaskKey",
    "tasks",
    "columns",
    "activities",
  ]);

  let updateMembers = [];
  let membersActivityMess = "";

  if (updateableParams.members) {
    updateableParams.members.map(memId => {
      if (!project.members.find(mem => mem._id.equals(memId))) {
        updateMembers.push(memId);
      }
    });
    if (updateMembers.length) {
      const multiNotiInsert = updateMembers.map(userId => ({
        sender: authUser._id,
        content: `just added you to project: '${project.key} - ${project.name}'`,
        seen: false,
        owner: userId,
      }));

      await Notification.insertMany(multiNotiInsert);

      await User.updateMany(
        { _id: updateMembers },
        {
          $push: {
            projects: project._id,
          },
        }
      );
      const newMembers = await User.find({ _id: updateMembers });
      membersActivityMess += `<p><strong><u>New members:</u></strong></p>`;
      newMembers.map(user => {
        membersActivityMess += `<p><em>+ ${user.username}</em></p>`;
      });
    }
  }

  let oldProject = {};
  let subContent = "";
  for (let prop in updateableParams) {
    if (prop in project) {
      oldProject[prop] = project[prop];
      project[prop] = updateableParams[prop];
    }
  }

  const updatedProject = await project.save();

  oldProject = omit(oldProject, [
    "_id",
    "key",
    "lastTaskKey",
    "manager",
    "members",
    "columns",
    "begin_date",
    "tasks",
  ]);
  for (let property in updateParams) {
    if (property in oldProject) {
      switch (property) {
        case "end_date": {
          if (
            moment(oldProject[property]).format("DD/MM/yyyy") !=
            moment(updatedProject[property]).format("DD/MM/yyyy")
          ) {
            subContent += `<p>+ ${property}: <em>${moment(
              oldProject[property]
            ).format("DD/MM/yyyy")} =&gt; </em><strong><em>${moment(
              updatedProject[property]
            ).format("DD/MM/yyyy")}</em></strong></p>`;
          }
          break;
        }
        case "description": {
          break;
        }
        default:
          if (!(oldProject[property] == updatedProject[property]))
            subContent += `<p>+ ${property}: <em>${oldProject[property]} =&gt; </em><strong><em>${updatedProject[property]}</em></strong></p>`;
          break;
      }
    }
  }

  const activity = new Activity({
    content: `updated this project.`,
    subContent: subContent.length ? subContent : null,
    creator: authUser._id,
    target_user: null,
    project: updatedProject._id,
  });

  await activity.save();

  if (updateMembers.length) {
    const addMemActivity = new Activity({
      content: `updated this project members.`,
      subContent: membersActivityMess.length ? membersActivityMess : null,
      creator: authUser._id,
      target_user: null,
      project: updatedProject._id,
    });

    await addMemActivity.save();
  }

  if (
    oldProject.description &&
    oldProject.description != updatedProject.description
  ) {
    const addMemActivity = new Activity({
      content: `updated this project description.`,
      subContent: updatedProject.description,
      creator: authUser._id,
      target_user: null,
      project: updatedProject._id,
    });

    await addMemActivity.save();
  }

  res.status(200).json(new SuccessResponse(200, { updatedProject }));
});
