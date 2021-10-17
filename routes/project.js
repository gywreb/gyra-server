const { Router } = require("express");
const projectController = require("../controllers/projectController");
const { jwtAuth } = require("../middlewares/jwtAuth");

const router = Router();

router.post("/create-project", jwtAuth, projectController.createProject);
router.get("/", jwtAuth, projectController.getProjects);

module.exports = router;
