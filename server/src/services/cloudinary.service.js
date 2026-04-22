'use strict';

const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const { AppError } = require('../middlewares/error.middleware');

class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   */
  static async uploadImage(buffer, folder = 'recipenest', filename) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: filename,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(new AppError(`Upload failed: ${error.message}`, 500));
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Extract public_id from a Cloudinary secure_url.
   * Input:  https://res.cloudinary.com/<cloud>/image/upload/v123/folder/filename.jpg
   * Output: folder/filename
   */
  static extractPublicId(urlOrId) {
    if (!urlOrId) return urlOrId;
    // If it looks like a URL, parse out the public_id
    if (urlOrId.startsWith('http')) {
      // strip everything up to and including /upload/ (and optional version vNNN/)
      const match = urlOrId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
      return match ? match[1] : urlOrId;
    }
    return urlOrId; // already a public_id
  }

  /**
   * Delete a file from Cloudinary.
   * Accepts either a full secure_url OR a raw public_id.
   */
  static async deleteImage(urlOrPublicId) {
    try {
      const publicId = CloudinaryService.extractPublicId(urlOrPublicId);
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new AppError('Failed to delete image', 500);
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Get secure URL for an image
   */
  static getSecureUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }

  /**
   * Bulk delete images
   */
  static async deleteMultipleImages(publicIds) {
    if (publicIds.length === 0) return;

    try {
      await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw new AppError('Failed to delete images', 500);
    }
  }

  /**
   * Upload with optimization
   */
  static async uploadOptimizedImage(buffer, folder = 'recipenest', filename) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: filename,
          overwrite: true,
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [
            {
              width: 800,
              height: 800,
              crop: 'limit',
              quality: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) {
            reject(new AppError(`Upload failed: ${error.message}`, 500));
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }
}

module.exports = { CloudinaryService };