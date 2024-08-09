import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

let prisma: PrismaClient

declare global {
  var __db__: PrismaClient
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient()
  }
  prisma = global.__db__
  prisma.$connect()
}

const redisPort = process.env.REDIS_PORT
const redis = new Redis(redisPort || process.env.REDIS_URL || '')
const redisCacheAdapter = {
  name: redis.options.name || 'Redis',
  set(key: string, value: any) {
    const devMode = process.env.NODE_ENV !== 'production'
    if (devMode) return 'OK'
    const ttl = (value?.metadata?.ttl || 0) + (value?.metadata?.swv || 0)
    if (ttl) {
      return redis.set(key, JSON.stringify(value), 'PX', ttl)
    }
    return redis.set(key, JSON.stringify(value))
  },
  async get(key: string) {
    const devMode = process.env.NODE_ENV !== 'production'
    if (devMode) return null
    const value = await redis.get(key)
    if (!value) {
      return null
    }
    return JSON.parse(value)
  },
  delete(key: string) {
    return redis.del(key)
  },
}

export { prisma, redis, redisCacheAdapter }

