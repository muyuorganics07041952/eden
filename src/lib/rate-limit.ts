import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiter is only active when Upstash env vars are configured.
// If not configured, requests pass through (graceful degradation).
function createRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '10 s'), // 30 requests per 10 seconds per IP
    analytics: false,
  })
}

export const ratelimit = createRatelimit()
