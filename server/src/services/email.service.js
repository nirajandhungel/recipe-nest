'use strict';

const { Resend } = require('resend');
const { config } = require('../config/config');
const { generateResetPasswordUrl, generateVerificationUrl } = require('../utils/helpers');

const resend = new Resend(config.RESEND_API_KEY);
const FROM_EMAIL = 'RecipeNest <no-reply@mail.nirajandhungel.com.np>';

class EmailService {
  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(user) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to RecipeNest! 👨‍🍳</h1>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>Welcome to RecipeNest, the social media platform for chefs and food enthusiasts!</p>
              <p>We're excited to have you on board. Start exploring recipes, share your culinary creations, and connect with other food lovers.</p>
              <a href="${config.CLIENT_URL}/dashboard" class="button">Get Started</a>
              <p>Happy cooking!</p>
              <p>The RecipeNest Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: 'Welcome to RecipeNest',
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send welcome email', error);
    }
  }

  /**
   * Send email verification
   */
  static async sendVerificationEmail(user, token) {
    const verificationUrl = generateVerificationUrl(token);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>Please verify your email address to complete your registration.</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>This link expires in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: 'Verify Your Email - RecipeNest',
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send verification email', error);
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(user, token) {
    const resetUrl = generateResetPasswordUrl(token);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>We received a request to reset your password. Click the button below to proceed.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
              </div>
              <p>For your security, never share this link with anyone.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: 'Reset Your Password - RecipeNest',
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send password reset email', error);
    }
  }

  /**
   * Send generic notification email
   */
  static async sendNotificationEmail(to, subject, htmlContent) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send notification email', error);
    }
  }
}

module.exports = { EmailService };
