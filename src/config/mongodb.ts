import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_HOST, MONGO_PORT, MONGO_DB } = process.env;

    if (!MONGO_USER || !MONGO_PASSWORD || !MONGO_HOST || !MONGO_PORT || !MONGO_DB) {
      throw new Error(
        '❌ Missing required environment variables in .env file (MONGO_USER, MONGO_PASSWORD, etc.)',
      );
    }

    console.log(`⏳ Connecting to MongoDB at ${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}...`);
    const mongoUri = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error('❌ Unknown Error:', error);
    }

    process.exit(1);
  }
};

export default connectDB;
