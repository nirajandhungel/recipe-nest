'use strict';

const { z } = require('zod');
const { formatValidationErrors } = require('../utils/response');
const { AppError } = require('./error.middleware');

/**
 * Validate request body against a Zod schema
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationErrors(error.flatten().fieldErrors);
        throw new AppError('Validation failed', 422, formattedErrors);
      }
      next(error);
    }
  };
};

/**
 * Validate request query parameters against a Zod schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationErrors(error.flatten().fieldErrors);
        throw new AppError('Invalid query parameters', 422, formattedErrors);
      }
      next(error);
    }
  };
};

/**
 * Validate request parameters against a Zod schema
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = formatValidationErrors(error.flatten().fieldErrors);
        throw new AppError('Invalid parameters', 422, formattedErrors);
      }
      next(error);
    }
  };
};

module.exports = { validateBody, validateQuery, validateParams };
