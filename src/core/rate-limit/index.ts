/**
 * Rate Limiter - LRU cache-based rate limiting
 * 
 * Features:
 * - In-memory LRU cache for fast lookups
 * - Configurable time windows and limits
 * - Per-token rate limiting (IP, session, etc.)
 * - Automatic cleanup of expired entries
 * 
 * Rate Limits (per specification):
 * - Gate: 5 attempts per minute per IP
 * - Cart: 20 operations per minute per session
 * - Checkout: 3 attempts per minute per session
 */

import { LRUCache } from 'lru-cache'

interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number
  /** Maximum number of requests allowed in the interval */
  maxRequests: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

export class RateLimiter {
  private cache: LRUCache<string, RateLimitEntry>
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    // TTL should be slightly longer than the interval to handle edge cases
    this.cache = new LRUCache({
      ttl: config.interval + 1000,
      max: 5000, // Maximum number of tokens to track
    })
  }

  /**
   * Check if a token has exceeded its rate limit
   * @param token - Unique identifier (IP address, session ID, etc.)
   * @throws Error if rate limit is exceeded
   */
  check(token: string): void {
    const now = Date.now()
    const entry = this.cache.get(token)

    if (!entry || now > entry.resetTime) {
      // First request or window expired, create new entry
      this.cache.set(token, {
        count: 1,
        resetTime: now + this.config.interval,
      })
      return
    }

    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`)
    }

    // Increment count
    entry.count++
    this.cache.set(token, entry)
  }

  /**
   * Get current rate limit status for a token
   */
  getStatus(token: string): { remaining: number; resetTime: number } | null {
    const entry = this.cache.get(token)
    
    if (!entry) {
      return {
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.interval,
      }
    }

    return {
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    }
  }

  /**
   * Reset rate limit for a token
   */
  reset(token: string): void {
    this.cache.delete(token)
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */

/** Gate rate limiter: 5 attempts per minute per IP */
export const gateRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5,
})

/** Cart rate limiter: 20 operations per minute per session */
export const cartRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 20,
})

/** Checkout rate limiter: 3 attempts per minute per session */
export const checkoutRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 3,
})

// Export factory function for custom limiters
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}
