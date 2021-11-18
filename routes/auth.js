const { Router } = require("express");
const authController = require("../controllers/authController");
const { basicAuth } = require("../middlewares/basicAuth");
const { jwtAuth } = require("../middlewares/jwtAuth");

const router = Router();

router.post("/register", basicAuth, authController.register);
router.post("/login", basicAuth, authController.login);
router.get("/getCurrent", jwtAuth, authController.getCurrent);

module.exports = router;
