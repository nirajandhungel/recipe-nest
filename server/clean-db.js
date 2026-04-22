require('dotenv').config();
const mongoose = require('mongoose');

const cleanDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      console.log(`Clearing collection: ${collection.name}`);
      await mongoose.connection.db.dropCollection(collection.name);
    }

    console.log('Database cleaned successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning database:', err);
    process.exit(1);
  }
};

cleanDB();
