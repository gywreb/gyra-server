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
    console.log(`members`, members);
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
    members: members ? [...members] : [],
  });
  const newProject = await project.save();
  await User.updateOne(
    { _id: authUser._id },
    { $push: { projects: newProject._id, projectKeys: key } }
  );
  res.status(201).json(new SuccessResponse(201, { newProject }));
});

exports.getProjects = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  if (!authUser) return next(new ErrorResponse(401, "unauthorized"));
  const ownProjects = await Project.find({
    manager: authUser._id,
  });
  const joinedProjects = await Project.find({
    "members.user": authUser._id,
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
    project.manager.equals(authUser._id) ||
    project.members.find(member => authUser._id.equals(member.user));
  if (!isInProject)
    return next(new ErrorResponse(401, "you can not access this project"));
  res.status(200).json(new SuccessResponse(200, { project }));
});
