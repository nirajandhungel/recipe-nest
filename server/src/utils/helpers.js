'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { config } = require('../config/config');

// ─── JWT Token Generation ──────────────────────────────────────────────────

const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: '1d',        // FIX: was 15m → now 1 day
    algorithm: 'HS256',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: '60d',       // FIX: was 7d → now 2 months
    algorithm: 'HS256',
  });
};

const generateTokenPair = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    console.error('[JWT ERROR] verifyAccessToken:', error.message);
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

// ─── Token Hashing ────────────────────────────────────────────────────────

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const verifyTokenHash = (plainToken, hashedToken) => {
  return hashToken(plainToken) === hashedToken;
};

// ─── Random Token Generation ──────────────────────────────────────────────

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ─── Slug Generation ─────────────────────────────────────────────────────

const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ─── Pagination Helper ────────────────────────────────────────────────────

const getPaginationParams = (query, defaultLimit = 10, maxLimit = 50) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || defaultLimit;

  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit };
};

const getPaginationData = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  return {
    skip,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// ─── String Utilities ────────────────────────────────────────────────────

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const truncate = (str, length, suffix = '...') => {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
};

// ─── Validation ───────────────────────────────────────────────────────────

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

// ─── URL Generation ─────────────────────────────────────────────────────

const generateResetPasswordUrl = (token) => {
  return `${config.CLIENT_URL}/reset-password?token=${token}`;
};

const generateVerificationUrl = (token) => {
  return `${config.CLIENT_URL}/verify-email?token=${token}`;
};

// ─── IP Address Extraction ──────────────────────────────────────────────

const getClientIp = (request) => {
  return (
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers['x-real-ip'] ||
    request.socket?.remoteAddress
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  hashToken,
  verifyTokenHash,
  generateResetToken,
  generateVerificationToken,
  slugify,
  getPaginationParams,
  getPaginationData,
  capitalizeFirstLetter,
  truncate,
  isValidEmail,
  isValidPhone,
  generateResetPasswordUrl,
  generateVerificationUrl,
  getClientIp,
};