import { redis } from '~/db.server'

export async function cachedResponse<T>(key: string, promise: T, time = 3600): Promise<T> {
  const cache = await redis.get(key)
  if (cache && process.env.NODE_ENV === 'production') return JSON.parse(cache)
  const result = await promise
  if (process.env.NODE_ENV === 'production') await redis.setex(key, time, JSON.stringify(result))
  return result
}
