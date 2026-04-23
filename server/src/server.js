'use strict';

const http = require('http');
const { createApp } = require('./app');
const { connectDB } = require('./config/database');
const { config, validateConfig } = require('./config/config');
const { initSocket } = require('./socket/chat.socket');

const startServer = async () => {
  try {
    // Validate environment variables
    validateConfig();

    // Connect to database
    await connectDB();

    // Create app
    const app = createApp();
    const httpServer = http.createServer(app);
    initSocket(httpServer, config.CLIENT_URL);

    // Start server
    const PORT = config.PORT;
    const server = httpServer.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    RecipeNest Backend                        ║
║                                                              ║
║  ✅ Server running on http://localhost:${PORT}              ║
║  📧 Environment: ${config.NODE_ENV.padEnd(38)}║
║  🔒 Security: Enabled                                        ║
║  🚀 Ready to serve requests!                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
