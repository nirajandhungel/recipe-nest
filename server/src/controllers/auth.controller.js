'use strict';

const { User } = require('../models/user.model');
const { Profile } = require('../models/profile.model');
const {
  validateData,
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  passwordResetSchema,
} = require('../validators');
const {
  generateTokenPair,
  generateResetToken,
  generateVerificationToken,
  hashToken,
  verifyRefreshToken,
} = require('../utils/helpers');
const { sendSuccess, errorResponses } = require('../utils/response');
const { EmailService } = require('../services/email.service');
const { buildProfileImageMap, attachProfileImage } = require('../utils/profile-image');
const { MESSAGES, HTTP_STATUS } = require('../constants');
const { asyncHandler } = require('../middlewares/error.middleware');

class AuthController {
  /**
   * Register a new user
   */
  static register = asyncHandler(async (req, res) => {
    const validation = validateData(registerSchema, req.body);
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    const { firstName, lastName, username, email, password, role } = validation.data;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return errorResponses.conflict(res, MESSAGES.EMAIL_TAKEN);
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return errorResponses.conflict(res, MESSAGES.USERNAME_TAKEN);
    }

    const verificationTokenRaw = generateVerificationToken();
    const verificationToken = hashToken(verificationTokenRaw);

    const user = await User.create({
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: password,
      role: role || 'user',
      verificationToken,
    });

    await Profile.create({ userId: user._id });

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    await EmailService.sendVerificationEmail(user, verificationTokenRaw);
    await EmailService.sendWelcomeEmail(user);

    const userDoc = user.toJSON();
    const imageMap = await buildProfileImageMap([userDoc._id]);
    attachProfileImage(userDoc, imageMap);

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      { user: userDoc, tokens: { accessToken, refreshToken } },
      MESSAGES.REGISTER_SUCCESS
    );
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req, res) => {
    const validation = validateData(loginSchema, req.body);
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return errorResponses.unauthorized(res, MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponses.unauthorized(res, MESSAGES.INVALID_CREDENTIALS);
    }

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const userDoc = user.toJSON();
    const imageMap = await buildProfileImageMap([userDoc._id]);
    attachProfileImage(userDoc, imageMap);

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      { user: userDoc, tokens: { accessToken, refreshToken } },
      MESSAGES.LOGIN_SUCCESS
    );
  });

  /**
   * Logout user
   */
  static logout = asyncHandler(async (req, res) => {
    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.LOGOUT_SUCCESS);
  });

  /**
   * Request password reset
   */
  static forgotPassword = asyncHandler(async (req, res) => {
    const validation = validateData(passwordResetSchema, req.body);
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    const { email } = validation.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security: Always return success to prevent email enumeration
      return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.PASSWORD_RESET_SENT);
    }

    const resetTokenRaw = generateResetToken();
    const resetToken = hashToken(resetTokenRaw);

    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await EmailService.sendPasswordResetEmail(user, resetTokenRaw);

    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.PASSWORD_RESET_SENT);
  });

  /**
   * Reset password with token
   */
  static resetPassword = asyncHandler(async (req, res) => {
    const validation = validateData(resetPasswordSchema, req.body);
    if (!validation.success) {
      return errorResponses.unprocessable(res, MESSAGES.VALIDATION_ERROR, validation.errors);
    }

    const { token, newPassword } = validation.data;

    const resetToken = hashToken(token);
    const user = await User.findOne({ resetToken }).select('+resetToken');

    if (!user) {
      return errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
    }

    user.passwordHash = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return sendSuccess(res, HTTP_STATUS.OK, null, MESSAGES.PASSWORD_RESET_SUCCESS);
  });

  /**
   * Verify email
   */
  static verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return errorResponses.badRequest(res, 'Verification token is required');
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({ verificationToken: hashedToken }).select('+verificationToken');

    if (!user) {
      return errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return sendSuccess(res, HTTP_STATUS.OK, null, 'Email verified successfully');
  });

  /**
   * Refresh access token using refresh token
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponses.unauthorized(res, 'Refresh token is required');
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return errorResponses.unauthorized(res, MESSAGES.TOKEN_INVALID);
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return errorResponses.unauthorized(res, 'User not found');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      { tokens: { accessToken, refreshToken: newRefreshToken } },
      'Token refreshed successfully'
    );
  });

  /**
   * Get current user
   */
  static getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return errorResponses.notFound(res, 'User not found');
    }

    const userObj = user.toObject();
    const imageMap = await buildProfileImageMap([userObj._id]);
    attachProfileImage(userObj, imageMap);
    return sendSuccess(res, HTTP_STATUS.OK, userObj, 'User retrieved successfully');
  });
}

module.exports = { AuthController };