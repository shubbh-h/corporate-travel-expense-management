/**
 * AppError - a plain Error subclass carrying an explicit HTTP status code.
 *
 * Why this exists: in the Routes -> Validators -> Controllers -> Services -> Models
 * architecture, controllers stay thin and never decide HTTP status codes themselves.
 * Instead, the service layer throws an AppError with the correct statusCode, and the
 * centralized errorHandler middleware reads `err.statusCode` to build the response.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected/handled errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
