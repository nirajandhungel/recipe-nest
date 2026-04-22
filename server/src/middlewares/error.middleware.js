'use strict';

const { config } = require('../config/config');
const { errorResponses } = require('../utils/response');
const { MESSAGES } = require('../constants');

class AppError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (error, req, res, next) => {
  console.error('[ERROR]', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = {};
    for (const [key, value] of Object.entries(error.errors || {})) {
      errors[key] = value.message || 'Validation failed';
    }
    errorResponses.badRequest(res, MESSAGES.VALIDATION_ERROR, errors);
    return;
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    errorResponses.conflict(res, message);
    return;
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    errorResponses.badRequest(res, 'Invalid ID format');
    return;
  }

  // Custom AppError
  if (error instanceof AppError) {
    if (error.errors) {
      errorResponses.unprocessable(res, error.message, error.errors);
    } else if (error.statusCode === 400) {
      errorResponses.badRequest(res, error.message);
    } else if (error.statusCode === 401) {
      errorResponses.unauthorized(res, error.message);
    } else if (error.statusCode === 403) {
      errorResponses.forbidden(res, error.message);
    } else if (error.statusCode === 404) {
      errorResponses.notFound(res, error.message);
    } else if (error.statusCode === 409) {
      errorResponses.conflict(res, error.message);
    } else {
      errorResponses.internalError(res, error.message);
    }
    return;
  }

  // Default internal server error
  const isDevelopment = config.NODE_ENV === 'development';
  const message = isDevelopment ? error.message : MESSAGES.INTERNAL_ERROR;
  errorResponses.internalError(res, message);
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { AppError, errorHandler, asyncHandler };
