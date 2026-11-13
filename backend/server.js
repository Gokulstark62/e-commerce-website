const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "config.env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const subscriberRoutes = require("./routes/subscriberRoutes");
const orderController = require("./controllers/orderController");

const connectDB = require("./db");

// app config
const app = express();
const port = process.env.PORT || 4000;

//middleware
app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.post(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  orderController.handleStripeWebhook
);
app.use(express.json({ limit: "1mb" }));

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    ...(process.env.CORS_ORIGINS || "").split(","),
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]),
  ]
    .map((origin) => origin?.trim().replace(/\/$/, ""))
    .filter(Boolean)
);
app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, "");
    if (!origin || allowedOrigins.has(normalizedOrigin)) return callback(null, true);
    const error = new Error("This origin is not allowed by the API CORS policy.");
    error.statusCode = 403;
    callback(error);
  },
}));

//api endpoints
app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  const ready = process.env.NODE_ENV !== "production" || connected;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "not_ready",
    database: connected ? "connected" : "disconnected",
  });
});
app.get("/api/store/config", (req, res) => {
  res.json({ shippingFee: Number(process.env.SHIPPING_FEE_INR || 0) });
});
app.use("/images/catalog", express.static(path.join(__dirname, "catalog")));
app.use("/images", express.static(path.join(__dirname, "uploads/images")));
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/subscribers", subscriberRoutes);

//error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || (err.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  const message = statusCode >= 500 && process.env.NODE_ENV === "production"
    ? "Internal Server Error"
    : err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    error: message,
  });
});

const validateProductionConfig = () => {
  if (process.env.NODE_ENV !== "production") return;
  const requiredKeys = [
    "MONGODB_URI",
    "SECRET_KEY",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "STRIPE_SECRET_KEY",
    "FRONTEND_URL",
    "ADMIN_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missingKeys = requiredKeys.filter((key) => !process.env[key]?.trim());
  if (missingKeys.length) {
    throw new Error(`Missing required production environment variables: ${missingKeys.join(", ")}`);
  }
  if (process.env.SECRET_KEY.length < 32) {
    throw new Error("SECRET_KEY must be at least 32 characters in production.");
  }
  if (process.env.ADMIN_PASSWORD.length < 16) {
    throw new Error("ADMIN_PASSWORD must be at least 16 characters in production.");
  }
  for (const key of ["FRONTEND_URL", "ADMIN_URL"]) {
    let url;
    try {
      url = new URL(process.env[key]);
    } catch (error) {
      throw new Error(`${key} must be a valid HTTPS URL in production.`);
    }
    if (url.protocol !== "https:") {
      throw new Error(`${key} must use HTTPS in production.`);
    }
  }
};

const startServer = async () => {
  try {
    validateProductionConfig();
    await connectDB();
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.error("MongoDB connection failed; continuing with local product storage:", error.message);
  }
  app.listen(port, () => {
    console.log(`Backend API listening on port ${port}`);
    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("STRIPE_WEBHOOK_SECRET is not configured; payment confirmation will rely on checkout verification.");
    }
  });
};

startServer().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exitCode = 1;
});

module.exports = app;
