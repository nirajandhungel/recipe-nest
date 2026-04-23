'use strict';

const { Profile } = require('../models/profile.model');

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.toString) return value.toString();
  return null;
};

const buildProfileImageMap = async (userIds = []) => {
  const uniqueIds = [...new Set(userIds.map(toIdString).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const profiles = await Profile.find({ userId: { $in: uniqueIds } })
    .select('userId profileImage')
    .lean();

  return new Map(profiles.map((profile) => [toIdString(profile.userId), profile.profileImage || null]));
};

const attachProfileImage = (user, imageMap) => {
  if (!user || !imageMap) return user;
  const userId = toIdString(user._id || user.id);
  if (!userId) return user;
  if (!user.profileImage) {
    user.profileImage = imageMap.get(userId) || null;
  }
  return user;
};

module.exports = {
  buildProfileImageMap,
  attachProfileImage,
};
