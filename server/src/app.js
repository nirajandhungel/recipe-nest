'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { config } = require('./config/config');
const { securityMiddleware } = require('./middlewares/security.middleware');
const { generalLimiter } = require('./middlewares/ratelimit.middleware');
const { errorHandler } = require('./middlewares/error.middleware');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');

// Routes
const authRoutes = require('./routes/auth.routes');
const recipeRoutes = require('./routes/recipe.routes');
const profileRoutes = require('./routes/profile.routes');
const socialRoutes = require('./routes/social.routes');
const adminRoutes = require('./routes/admin.routes');
const searchRoutes = require('./routes/search.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const chatRoutes = require('./routes/chat.routes');

const createApp = () => {
  const app = express();

  // ─── Security & Headers ──────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false,  // Disabled to allow Swagger UI inline assets
  }));
  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Request Parsing ─────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Security Middleware ─────────────────────────────────────────────────
  app.use(securityMiddleware);

  // ─── Rate Limiting ───────────────────────────────────────────────────────
  if (config.ENABLE_RATE_LIMITING) {
    app.use(generalLimiter);
  }

  // ─── Request Logging (Development Only) ──────────────────────────────────
  if (config.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        );
      });
      next();
    });
  }

  // ─── Health Check ────────────────────────────────────────────────────────
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'RecipeNest Backend API',
      version: '2.0.0',
      status: 'running',
      environment: config.NODE_ENV,
    });
  });

  // ─── API Documentation (Swagger UI) ────────────────────────────────────
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'RecipeNest API Documentation',
    customfavIcon: '',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
  }));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ─── API Routes ──────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/recipes', recipeRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/social', socialRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/chat', chatRoutes);

  // ─── 404 Handler ─────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.originalUrl}`,
      code: 'NOT_FOUND',
    });
  });

  // ─── Global Error Handler ────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
