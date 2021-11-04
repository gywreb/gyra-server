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
  await existedProject.save();

  res.status(201).json(new SuccessResponse(201, { newColumn }));
});

exports.getColumnListByProject = asyncMiddleware(async (req, res, next) => {
  const { projectId } = req.params;

  const existedProject = await Project.findById(projectId);
  if (!existedProject) return next(new ErrorResponse(404, "no project found"));

  const columnList = await Column.find({ project: projectId });
  res.status(200).json(new SuccessResponse(200, { columnList }));
});
