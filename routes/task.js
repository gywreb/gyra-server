const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const taskController = require("../controllers/taskController");

const router = Router();

router.post("/create-task", jwtAuth, taskController.createTask);
router.get("/:projectId", jwtAuth, taskController.getTaskListByProject);
router.put("/move-task/:taskId", jwtAuth, taskController.moveTaskInBoard);
router.put("/edit-task/:taskId", jwtAuth, taskController.editTask);

module.exports = router;
