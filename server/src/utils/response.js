'use strict';

const { HTTP_STATUS, MESSAGES } = require('../constants');

/**
 * Send a successful API response
 */
const sendSuccess = (res, statusCode, data, message = MESSAGES.INTERNAL_ERROR, meta) => {
  const response = {
    success: true,
    message,
    ...(data !== undefined && data !== null && { data }),
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error API response
 */
const sendError = (res, statusCode, message = MESSAGES.INTERNAL_ERROR, errors) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 */
const sendPaginated = (res, statusCode, data, meta, message = MESSAGES.INTERNAL_ERROR) => {
  const response = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
};

/**
 * Predefined response helpers
 */
const successResponses = {
  ok: (res, data, message) =>
    sendSuccess(res, HTTP_STATUS.OK, data, message || MESSAGES.INTERNAL_ERROR),

  created: (res, data, message) =>
    sendSuccess(res, HTTP_STATUS.CREATED, data, message || MESSAGES.RECIPE_CREATED),

  noContent: (res) => sendSuccess(res, HTTP_STATUS.NO_CONTENT),
};

const errorResponses = {
  badRequest: (res, message = MESSAGES.VALIDATION_ERROR, errors) =>
    sendError(res, HTTP_STATUS.BAD_REQUEST, message, errors),

  unauthorized: (res, message = MESSAGES.UNAUTHORIZED) =>
    sendError(res, HTTP_STATUS.UNAUTHORIZED, message),

  forbidden: (res, message = MESSAGES.RECIPE_FORBIDDEN) =>
    sendError(res, HTTP_STATUS.FORBIDDEN, message),

  notFound: (res, message = MESSAGES.NOT_FOUND) =>
    sendError(res, HTTP_STATUS.NOT_FOUND, message),

  conflict: (res, message) =>
    sendError(res, HTTP_STATUS.CONFLICT, message),

  unprocessable: (res, message = MESSAGES.VALIDATION_ERROR, errors) =>
    sendError(res, HTTP_STATUS.UNPROCESSABLE, message, errors),

  internalError: (res, message = MESSAGES.INTERNAL_ERROR) =>
    sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message),
};

/**
 * Format validation errors from Zod or other validators
 */
const formatValidationErrors = (errors) => {
  const formatted = {};
  for (const [key, value] of Object.entries(errors)) {
    formatted[key] = Array.isArray(value) ? value[0] : value;
  }
  return formatted;
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
  successResponses,
  errorResponses,
  formatValidationErrors,
};
