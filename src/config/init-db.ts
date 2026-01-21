import prisma from './prisma.js';
import connectMongoDB from './mongodb.js';
import redis from './redis.js';

export const connectAllDatabases = async () => {
  console.log('🔄 Initializing database connections...');

  try {
    await connectMongoDB();

    const redisStatus = await redis.ping();
    console.log(`✅ Redis Connected (Status: ${redisStatus})`);

    await prisma.$connect();
    console.log(`✅ Postgres (Prisma) Connected`);

    console.log('🏁 All databases initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export default connectAllDatabases;
