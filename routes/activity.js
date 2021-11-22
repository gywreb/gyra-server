const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const activityController = require("../controllers/activityController");

const router = Router();

router.get("/:projectId", jwtAuth, activityController.getActivityByProject);

module.exports = router;
