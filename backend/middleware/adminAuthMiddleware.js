const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/errorHandler");

const adminAuthMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token || !process.env.SECRET_KEY) {
    return next(errorHandler(401, "Admin login is required."));
  }

  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    if (payload.role !== "admin") {
      return next(errorHandler(403, "Admin access is required."));
    }
    next();
  } catch (error) {
    next(errorHandler(401, "Your admin session has expired. Please log in again."));
  }
};

module.exports = adminAuthMiddleware;
