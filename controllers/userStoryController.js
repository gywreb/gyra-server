const Project = require("../database/models/Project");
const UserStory = require("../database/models/UserStory");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");

exports.createUserStory = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { content, projectId, description, key } = req.body;

  const project = await Project.findById(projectId);
  if (!project.manager._id.equals(authUser._id))
    return next(
      new ErrorResponse(
        403,
        "Only the manager have the permission to perform this action"
      )
    );

  const userStory = await UserStory({
    content,
    description,
    key,
    project: projectId,
  });

  const newUserStory = await userStory.save();

  await Project.updateOne(
    { _id: projectId },
    {
      lastUserStoryKey: project.lastUserStoryKey + 1 || 0 + 1,
    }
  );

  res.json(new SuccessResponse(200, { newUserStory }));
});

exports.getUserStoryByProjectId = asyncMiddleware(async (req, res, next) => {
  const { projectId } = req.params;

  const existedProject = await Project.findById(projectId);
  if (!existedProject) return next(new ErrorResponse(404, "no project found"));

  const userStoryList = await UserStory.find({ project: projectId });

  res.json(
    new SuccessResponse(200, {
      userStoryList,
      lastUserStoryKey: existedProject.lastUserStoryKey,
      currentProject: existedProject,
    })
  );
});
