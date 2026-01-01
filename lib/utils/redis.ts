import Redis from "ioredis";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger('Redis');

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

export const redis =
  global.redis ??
  new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true, // mở kết nối khi lần đầu dùng
    maxRetriesPerRequest: null, // tránh lỗi trong môi trường serverless
    enableReadyCheck: false,
    connectTimeout: 2000,
    retryStrategy: (times) => {
      // Nếu REDIS_OPTIONAL=true, không retry để tránh spam log khi không có Redis
      if (process.env.REDIS_OPTIONAL === 'true') return null;
      return Math.min(times * 100, 2000);
    },
  });

if (process.env.NODE_ENV !== "production") global.redis = redis;

// Tránh 'Unhandled error event' khi Redis không khả dụng
redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('Redis error', (err as any)?.message || err);
  }
});
