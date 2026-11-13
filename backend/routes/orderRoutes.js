const orderController = require("./../controllers/orderController");
const express = require("express");
const authMiddleware = require("./../middleware/authMiddleware");
const adminAuthMiddleware = require("./../middleware/adminAuthMiddleware");

const router = express.Router();

//endpoints
router.post("/place", authMiddleware, orderController.placeOrder);
router.post("/verify", authMiddleware, orderController.verifyOrder);
router.post("/userorders", authMiddleware, orderController.userOrders);
router.get("/", adminAuthMiddleware, orderController.getAllOrders);
router.post("/status", adminAuthMiddleware, orderController.updateStatus);

module.exports = router;
