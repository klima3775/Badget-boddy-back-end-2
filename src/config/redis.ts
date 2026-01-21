import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

if (!REDIS_HOST || !REDIS_PORT) {
  throw new Error('❌ REDIS_HOST or REDIS_PORT is missing in .env');
}

console.log(`⏳ Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

const redis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,

  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log(`✅ Redis Connected successfully`);
});

redis.on('error', (err: Error) => {
  console.error('❌ Redis Connection Error:', err);
});

export default redis;
