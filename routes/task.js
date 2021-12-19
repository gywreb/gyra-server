const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const taskController = require("../controllers/taskController");

const router = Router();

router.post("/create-task", jwtAuth, taskController.createTask);
router.get("/:projectId", jwtAuth, taskController.getTaskListByProject);
router.put("/move-task/:taskId", jwtAuth, taskController.moveTaskInBoard);
router.put("/edit-task/:taskId", jwtAuth, taskController.editTask);
router.put("/toggle-subtask", jwtAuth, taskController.toggleSubTaskStatus);
router.put("/done-task/:taskId", jwtAuth, taskController.doneTask);
router.put("/resolve-task/:taskId", jwtAuth, taskController.resolvedTask);
router.put("/close-task/:taskId", jwtAuth, taskController.closeTask);
router.put("/reopen-task/:taskId", jwtAuth, taskController.reopenTask);

module.exports = router;
