'use strict';

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../constants');
const { config } = require('../config/config');

const dummyLimiter = (req, res, next) => next();

const generalLimiter = dummyLimiter;
const authLimiter = dummyLimiter;
const uploadLimiter = dummyLimiter;
const apiLimiter = dummyLimiter;

module.exports = { generalLimiter, authLimiter, uploadLimiter, apiLimiter };
