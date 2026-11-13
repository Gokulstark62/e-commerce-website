const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const productController = require("./../controllers/productController");
const adminAuthMiddleware = require("./../middleware/adminAuthMiddleware");

const router = express.Router();

const imageDirectory = path.join(__dirname, "../uploads/images");
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    fs.mkdir(imageDirectory, { recursive: true }, (error) => callback(error, imageDirectory));
  },
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      const error = new Error("Upload a JPG, PNG, WebP, or GIF image.");
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

router.get("/", productController.getAllProducts);
router.post("/", adminAuthMiddleware, upload.single("product"), productController.createProduct);
router.delete("/:id", adminAuthMiddleware, productController.deleteProduct);
router.get("/newCollections", productController.getNewCollections);
router.get("/popularInWomen", productController.getPopularInWomen);

module.exports = router;
