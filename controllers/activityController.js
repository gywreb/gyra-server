const Activity = require("../database/models/Activity");
const Project = require("../database/models/Project");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");

exports.getActivityByProject = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { perPage, page } = req.query;
  const { projectId } = req.params;

  const project = await Project.findOne({ _id: projectId });
  if (!project) return next(new ErrorResponse(404, "no project found!"));
  const isInProject =
    project.manager._id.equals(authUser._id) ||
    project.members.find(member => authUser._id.equals(member._id));
  if (!isInProject)
    return next(new ErrorResponse(401, "you can not access this project"));

  const activityList = await Activity.paginate(
    { project: projectId },
    { offset: perPage * (page - 1), limit: perPage, sort: { createdAt: -1 } }
  );
  res
    .status(200)
    .json(new SuccessResponse(200, { activityList, currentProject: project }));
});
