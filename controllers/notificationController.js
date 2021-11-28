const Notification = require("../database/models/Notification");
const { asyncMiddleware } = require("../middlewares/asyncMiddleware");
const { SuccessResponse } = require("../models/SuccessResponse");

exports.getNotiListByUser = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  const { perPage, page } = req.query;

  const totalUnseen = await Notification.count({
    owner: authUser._id,
    seen: false,
  });

  const notiList = await Notification.paginate(
    {
      owner: authUser._id,
    },
    { limit: perPage, page, sort: { createdAt: -1 } }
  );

  res.json(new SuccessResponse(200, { notiList, totalUnseen }));
});

exports.seenAllNoti = asyncMiddleware(async (req, res, next) => {
  const authUser = req.user._doc;
  await Notification.updateMany(
    {
      owner: authUser._id,
    },
    { seen: true }
  );
  res.json(new SuccessResponse(200, "you have seen all the notifications"));
});
