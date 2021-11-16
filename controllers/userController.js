const User = require("../database/models/User");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");
const { EmailService } = require("../services/EmailService");

exports.getAllUsers = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { perPage, page } = req.query;
  const userList = await User.paginate(
    {},
    { offset: perPage * (page - 1), limit: perPage }
  );
  const userNotInTeam = {
    ...userList,
    docs: userList.docs.filter(
      user =>
        !user._id.equals(authUser._id) && !authUser.team.includes(user._id)
    ),
  };
  res.json(new SuccessResponse(200, { userList: userNotInTeam }));
});

exports.getTeamMembers = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const teamMembers = await User.find({ _id: authUser.team });
  res.json(new SuccessResponse(200, { teamMembers }));
});

exports.inviteUserJoinTeam = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { userId } = req.params;
  const invitedUser = await User.findById(userId);
  if (!invitedUser)
    return next(new ErrorResponse(404, "this user is no longer existed"));
  if (authUser.team.includes(userId)) {
    return next(new ErrorResponse(400, "this user already in your team"));
  }

  EmailService.init();
  await EmailService.sendInvitation(
    authUser.username,
    invitedUser.username,
    invitedUser.email,
    `${authUser.username} has invited you to his team!`,
    `${authUser.username} want to invite you to his developer team, Click the button below to confirm the invitation.\n
    Lets create greate thing for the future with ${authUser.username}`,
    `${process.env.CLIENT_URL}/invitation?sender=${authUser._id}&receiver=${invitedUser._id}`,
    next
  );

  res
    .status(200)
    .json(
      new SuccessResponse(200, `Successfully invited ${invitedUser.username}`)
    );
});
