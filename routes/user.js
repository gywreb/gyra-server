const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const userController = require("../controllers/userController");

const router = Router();

router.get("/all", jwtAuth, userController.getAllUsers);
router.get("/team", jwtAuth, userController.getTeamMembers);
router.post("/invite/:userId", jwtAuth, userController.inviteUserJoinTeam);

module.exports = router;
