'use strict';

const mongoose = require('mongoose');
const { config } = require('./config');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    await mongoose.connect(config.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    if (config.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  if (!isConnected) return;

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };
