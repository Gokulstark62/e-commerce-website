const express = require("express");
const userController = require("./../controllers/userController");
const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/errorHandler");

const router = express.Router();

router.post("/signup", userController.signupUser);
router.post("/login", userController.loginUser);
router.post("/admin/login", (req, res, next) => {
  const { email, password } = req.body;
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return next(errorHandler(503, "Configure ADMIN_EMAIL and ADMIN_PASSWORD in the backend environment."));
  }
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return next(errorHandler(401, "Invalid admin credentials."));
  }
  if (!process.env.SECRET_KEY) {
    return next(errorHandler(503, "SECRET_KEY is not configured on the server."));
  }
  const token = jwt.sign({ role: "admin" }, process.env.SECRET_KEY, { expiresIn: "1d" });
  res.status(200).json({ token, role: "admin" });
});

module.exports = router;
