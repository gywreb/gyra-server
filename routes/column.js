const { Router } = require("express");
const { jwtAuth } = require("../middlewares/jwtAuth");
const columnController = require("../controllers/columnController");

const router = Router();

router.post("/create-column", jwtAuth, columnController.createColumn);
router.get("/:projectId", jwtAuth, columnController.getColumnListByProject);
router.put("/edit-column/:columnId", jwtAuth, columnController.editColumn);

module.exports = router;
