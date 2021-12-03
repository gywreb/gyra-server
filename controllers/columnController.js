const { omit } = require("lodash");
const Activity = require("../database/models/Activity");
const Column = require("../database/models/Column");
const Project = require("../database/models/Project");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");

exports.createColumn = asyncMiddleware(async (req, res, next) => {
  const { name, project } = req.body;

  const existedProject = await Project.findById(project);
  if (!existedProject) return next(new ErrorResponse(404, "no project found"));

  const projectColumns = await Column.find({ project });
  const isNameExisted = projectColumns.find(
    column => column.name.toLowerCase() === name.toLowerCase()
  );
  if (isNameExisted)
    return next(
      new ErrorResponse(400, `column with name :${name} is already existed`)
    );

  const column = new Column({ name, project });
  const newColumn = await column.save();

  existedProject.columns.push(newColumn._id);
  const newCurrentProject = await existedProject.save();

  res
    .status(201)
    .json(new SuccessResponse(201, { newColumn, newCurrentProject }));
});

exports.editColumn = asyncMiddleware(async (req, res, next) => {
  const updateParams = req.body;
  const { columnId } = req.params;
  const { projectId } = req.query;
  const authUser = req.user._doc;

  const column = await Column.findById(columnId);
  const project = await Project.findById(projectId);

  if (!column) return next(new ErrorResponse(404, "column is not exist"));
  if (!project) return next(new ErrorResponse(404, "project is not exist"));

  if (!project.manager._id.equals(authUser._id))
    return next(
      new ErrorResponse(
        403,
        "you don't have the permission to performt this action"
      )
    );

  let subContent = "";
  let oldColumn = {};
  for (let property in updateParams) {
    if (property in column) {
      oldColumn[property] = column[property];
      column[property] = updateParams[property];
    }
  }

  const updatedColumn = await column.save();

  oldColumn = omit(oldColumn, [
    "_id",
    "tasks",
    "project",
    "createdAt",
    "updatedAt",
  ]);

  for (let property in updateParams) {
    if (property in oldColumn) {
      if (!(oldColumn[property] == updatedColumn[property]))
        subContent += `<p>+ ${property}: <em>${oldColumn[property]} =&gt; </em><strong><em>${updatedColumn[property]}</em></strong></p>`;
    }
  }

  const activity = new Activity({
    content: `updated '${project.name}' tasks's status`,
    subContent: subContent.length ? subContent : null,
    creator: authUser._id,
    target_user: null,
    project: project._id,
  });

  await activity.save();

  res.json(new SuccessResponse(200, { updatedColumn }));
});

exports.getColumnListByProject = asyncMiddleware(async (req, res, next) => {
  const { projectId } = req.params;

  const existedProject = await Project.findById(projectId);
  if (!existedProject) return next(new ErrorResponse(404, "no project found"));

  const columnList = await Column.find({ project: projectId });
  res.status(200).json(new SuccessResponse(200, { columnList }));
});
