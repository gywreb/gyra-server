const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const userStoryController = require("../controllers/userStoryController");
const router = Router();

router.get("/:projectId", jwtAuth, userStoryController.getUserStoryByProjectId);
router.post("/create-user-story", jwtAuth, userStoryController.createUserStory);

module.exports = router;
