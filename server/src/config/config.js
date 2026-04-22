'use strict';

require('dotenv').config();

const config = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/recipenest',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Email
  RESEND_API_KEY: process.env.RESEND_API_KEY,

  // CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Server
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',

  // Features
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
};

/**
 * Validate critical environment variables
 */
const validateConfig = () => {
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0 && config.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

module.exports = { config, validateConfig };
