const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const commentController = require("../controllers/commentController");

const router = Router();

router.get("/:taskId", jwtAuth, commentController.getCommentsByTask);
router.post(
  "/create-comment/:taskId",
  jwtAuth,
  commentController.createComment
);

module.exports = router;
