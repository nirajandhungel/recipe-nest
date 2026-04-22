'use strict';

const mongoose = require('mongoose');

// ─── Like Model ──────────────────────────────────────────────────────────────

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
  },
  { timestamps: true }
);

likeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
likeSchema.index({ recipeId: 1 });
likeSchema.index({ userId: 1 });

const Like = mongoose.model('Like', likeSchema, 'likes');

// ─── Comment Model ───────────────────────────────────────────────────────────

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
  { timestamps: true }
);

commentSchema.index({ recipeId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema, 'comments');

// ─── Save Model ──────────────────────────────────────────────────────────────

const saveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
  },
  { timestamps: true }
);

saveSchema.index({ userId: 1, recipeId: 1 }, { unique: true });
saveSchema.index({ recipeId: 1 });
saveSchema.index({ userId: 1 });

const Save = mongoose.model('Save', saveSchema, 'saves');

// ─── Follow Model ────────────────────────────────────────────────────────────

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1 });
followSchema.index({ followerId: 1 });

const Follow = mongoose.model('Follow', followSchema, 'follows');

// ─── View Model ──────────────────────────────────────────────────────────────

const viewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

viewSchema.index({ recipeId: 1 });
viewSchema.index({ userId: 1 });
viewSchema.index({ createdAt: -1 });

const View = mongoose.model('View', viewSchema, 'views');

module.exports = { Like, Comment, Save, Follow, View };
