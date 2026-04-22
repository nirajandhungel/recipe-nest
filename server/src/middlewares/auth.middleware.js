'use strict';

const { verifyAccessToken } = require('../utils/helpers');
const { errorResponses } = require('../utils/response');
const { MESSAGES } = require('../constants');
const { config } = require('../config/config');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (config.NODE_ENV === 'development') {
      console.log(`[AUTH DEBUG] ${req.method} ${req.path} - Auth Header:`, authHeader ? 'Present' : 'MISSING');
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponses.unauthorized(res, MESSAGES.UNAUTHORIZED);
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('[AUTH ERROR] authenticate:', error.message);
    errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch {
    next();
  }
};

/**
 * Verify user is an admin
 */
const requireAdmin = (req, res, next) => {
  try {
    if (req.user) {
      if (req.user.role !== 'admin') {
        return errorResponses.forbidden(res, 'Admin access required');
      }
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH WARNING] requireAdmin: Missing or invalid Authorization header');
      errorResponses.unauthorized(res, MESSAGES.UNAUTHORIZED);
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      console.warn('[AUTH WARNING] requireAdmin: Invalid or expired token');
      errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
      return;
    }

    if (payload.role !== 'admin') {
      console.warn(`[AUTH WARNING] requireAdmin: User ${payload.userId} is not an admin (role: ${payload.role})`);
      errorResponses.forbidden(res, 'Admin access required');
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('[AUTH ERROR] requireAdmin:', error.message);
    errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
  }
};

/**
 * Verify user is a chef or admin
 */
const requireChef = (req, res, next) => {
  try {
    if (req.user) {
      if (req.user.role !== 'chef' && req.user.role !== 'admin') {
        return errorResponses.forbidden(res, 'Chef access required');
      }
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH WARNING] requireChef: Missing or invalid Authorization header');
      errorResponses.unauthorized(res, MESSAGES.UNAUTHORIZED);
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      console.warn('[AUTH WARNING] requireChef: Invalid or expired token');
      errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
      return;
    }

    if (payload.role !== 'chef' && payload.role !== 'admin') {
      console.warn(`[AUTH WARNING] requireChef: User ${payload.userId} is not a chef/admin (role: ${payload.role})`);
      errorResponses.forbidden(res, 'Chef access required');
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('[AUTH ERROR] requireChef:', error.message);
    errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
  }
};

/**
 * Verify user owns the resource
 */
const verifyResourceOwner = (ownerIdField = 'chefId') => {
  return (req, res, next) => {
    try {
      const ownerId = req.body[ownerIdField] || req.params.userId;

      if (!req.user) {
        errorResponses.unauthorized(res);
        return;
      }

      if (req.user.userId !== ownerId && req.user.role !== 'admin') {
        errorResponses.forbidden(res);
        return;
      }

      next();
    } catch {
      errorResponses.internalError(res);
    }
  };
};

module.exports = { authenticate, optionalAuth, requireAdmin, requireChef, verifyResourceOwner };
