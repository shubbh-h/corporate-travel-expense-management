const { env } = require('../config/env');

// 404 handler - placed after all routes
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

// Global error handler - must be registered last with 4 args for Express to recognize it
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Prefer an explicit status code thrown by the service layer (AppError),
  // falling back to whatever was set on the response, then 500.
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }

  // CORS rejection
  if (err.message && err.message.startsWith('CORS blocked')) {
    statusCode = 403;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: env === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
