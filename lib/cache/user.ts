import { User } from "@/lib/models/user";
import { redis } from "@/lib/utils/redis";

const ONE_DAY = 60 * 60 * 24; // TTL 24h

export async function cacheUser(user: User) {
  // Khóa: user:<id>
  await redis.set(`user:${user.id}`, JSON.stringify(user), "EX", ONE_DAY);
}

export async function getCachedUser(id: number): Promise<User | null> {
  const raw = await redis.get(`user:${id}`);
  return raw ? new User(JSON.parse(raw)) : null;
}

export async function invalidateUser(id: number) {
  await redis.del(`user:${id}`);
}

export async function cacheUserWithCustomTTL(user: User, ttlSeconds: number) {
  await redis.set(`user:${user.id}`, JSON.stringify(user), "EX", ttlSeconds);
}

export async function getUserCacheTTL(id: number): Promise<number> {
  return await redis.ttl(`user:${id}`);
}

export async function refreshUserCache(user: User) {
  const exists = await redis.exists(`user:${user.id}`);
  if (exists) {
    await cacheUser(user);
  }
}

export async function invalidateAllUserCaches() {
  const keys = await redis.keys("user:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
