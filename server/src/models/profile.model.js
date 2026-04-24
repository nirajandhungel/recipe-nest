'use strict';

const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    twitter: { type: String, trim: true },
    website: { type: String, trim: true },
    tiktok: { type: String, trim: true },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      trim: true,
    },
    specialties: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    experience: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    socialLinks: socialLinksSchema,
    totalLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSaves: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
profileSchema.index({ verified: 1 });
profileSchema.index({ rating: -1 });

const Profile = mongoose.model('Profile', profileSchema, 'profiles');

module.exports = { Profile };
