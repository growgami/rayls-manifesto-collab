import Redis from 'ioredis';

let redisClient: Redis | null = null;

export async function getRedisClient(): Promise<Redis> {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  // Parse the URL to extract components
  const url = new URL(redisUrl);
  const host = url.hostname || '127.0.0.1';
  const port = parseInt(url.port || '6379', 10);

  // Use password from URL or separate env variable
  const password = redisPassword || (url.password ? decodeURIComponent(url.password) : undefined);

  redisClient = new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis connection closed');
  }
}
