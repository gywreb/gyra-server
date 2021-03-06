const Notification = require("../database/models/Notification");
const User = require("../database/models/User");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { ErrorResponse } = require("../models/ErrorResponse");
const { SuccessResponse } = require("../models/SuccessResponse");
const { EmailService } = require("../services/EmailService");
const shuffleArray = require("../utils/shuffleArray");

exports.getAllUsers = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { perPage, page } = req.query;
  const userList = await User.paginate(
    { _id: { $ne: authUser._id, $nin: authUser.team } },
    { limit: perPage, page }
  );
  const userNotInTeam = {
    ...userList,
    docs: shuffleArray(userList.docs),
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
  const sendInviteUser = await User.findById(authUser._id);
  if (authUser.pendingUser.includes(userId))
    return next(new ErrorResponse(400, "you have already invite this user"));
  if (!invitedUser)
    return next(new ErrorResponse(404, "this user is no longer existed"));
  if (authUser.team.includes(userId)) {
    return next(new ErrorResponse(400, "this user already in your team"));
  }

  sendInviteUser.pendingUser.push(invitedUser._id);
  const userInfo = await sendInviteUser.save();

  const notification = new Notification({
    sender: sendInviteUser._id,
    content: `has invited you to join their team. Check out your mail inbox to confirm the invitation`,
    seen: false,
    owner: invitedUser._id,
  });

  await notification.save();

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

  res.status(200).json(new SuccessResponse(200, { userInfo }));
});

exports.confirmInvitation = asyncMiddleware(async (req, res, next) => {
  const { sender, receiver } = req.body;
  const senderUser = await User.findById(sender);
  const receiverUser = await User.findById(receiver);

  if (!senderUser || !receiverUser)
    return next(new ErrorResponse(404, "one or more user no longer existed"));

  if (senderUser.team.includes(receiver))
    return next(new ErrorResponse(400, "you have already joined this team"));

  const notification = new Notification({
    sender: receiverUser._id,
    content: `has joined your team`,
    seen: false,
    owner: senderUser._id,
  });

  await notification.save();

  await User.updateOne(
    { _id: senderUser._id },
    {
      $pull: { pendingUser: receiverUser._id },
      $push: {
        team: receiverUser._id,
      },
    }
  );

  res.status(200).json(new SuccessResponse(200, { receiverUser }));
});
