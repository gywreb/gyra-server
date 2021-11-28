const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const notificationController = require("../controllers/notificationController");

const router = Router();

router.get("/", jwtAuth, notificationController.getNotiListByUser);
router.put("/seen-all", jwtAuth, notificationController.seenAllNoti);

module.exports = router;
