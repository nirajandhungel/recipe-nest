'use strict';

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

/**
 * Data sanitization against NoSQL query injection
 */
const mongoSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Security] Sanitized ${key} in ${req.method} ${req.path}`);
  },
});

/**
 * Data sanitization against XSS attacks
 */
const xssCleaner = xss();

/**
 * Content Security Policy middleware
 */
const cspMiddleware = (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  next();
};

/**
 * HSTS middleware
 */
const hstsMiddleware = (req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

/**
 * X-Content-Type-Options middleware
 */
const noSniffMiddleware = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

/**
 * X-Frame-Options middleware
 */
const clickjackingProtectionMiddleware = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

/**
 * Combine all security middleware
 */
const securityMiddleware = [
  cspMiddleware,
  hstsMiddleware,
  noSniffMiddleware,
  clickjackingProtectionMiddleware,
];

module.exports = {
  mongoSanitizer,
  xssCleaner,
  cspMiddleware,
  hstsMiddleware,
  noSniffMiddleware,
  clickjackingProtectionMiddleware,
  securityMiddleware,
};
