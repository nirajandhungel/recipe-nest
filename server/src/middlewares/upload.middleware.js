'use strict';

const multer = require('multer');
const { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } = require('../constants');
const { AppError } = require('./error.middleware');

// Store files in memory for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new AppError('Only image files are allowed', 400));
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    cb(new AppError('File size exceeds 5MB limit', 400));
    return;
  }

  cb(null, true);
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Single file upload middleware
 */
const uploadSingleFile = uploadMiddleware.single('file');

/**
 * Multiple files upload middleware
 */
const uploadMultipleFiles = uploadMiddleware.array('files', 5);

/**
 * Fields upload middleware for mixed content
 */
const uploadMixedFields = uploadMiddleware.fields([
  { name: 'image', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
]);

const uploadImageFile = uploadMiddleware.single('image');
const uploadBannerFile = uploadMiddleware.single('banner');

module.exports = { 
  uploadMiddleware, 
  uploadSingleFile, 
  uploadMultipleFiles, 
  uploadMixedFields,
  uploadImageFile,
  uploadBannerFile
};
