/**
 * Token Bucket Rate Limiter
 * 
 * Simple in-memory rate limiter for API request throttling.
 * Uses token bucket algorithm: tokens are consumed on each request
 * and refilled over time.
 */

export interface RateLimiterConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds for rate limit */
    windowMs: number;
}

interface BucketState {
    tokens: number;
    lastRefill: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs?: number;
}

/**
 * Token Bucket Rate Limiter
 * 
 * Each key (typically API token) gets its own bucket.
 * Buckets are lazily created and cleaned up when expired.
 */
export class TokenBucketRateLimiter {
    private buckets = new Map<string, BucketState>();
    private config: RateLimiterConfig;

    constructor(config: RateLimiterConfig) {
        this.config = config;
    }

    /**
     * Check if a request should be allowed for the given key.
     * Consumes a token if allowed.
     */
    check(key: string): RateLimitResult {
        const now = Date.now();
        let bucket = this.buckets.get(key);

        if (!bucket) {
            // Create new bucket with full tokens
            bucket = {
                tokens: this.config.maxRequests,
                lastRefill: now,
            };
            this.buckets.set(key, bucket);
        }

        // Refill tokens based on elapsed time
        const elapsed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(
            (elapsed / this.config.windowMs) * this.config.maxRequests
        );

        if (tokensToAdd > 0) {
            bucket.tokens = Math.min(
                this.config.maxRequests,
                bucket.tokens + tokensToAdd
            );
            bucket.lastRefill = now;
        }

        // Check if we have tokens available
        if (bucket.tokens > 0) {
            bucket.tokens--;
            return {
                allowed: true,
                remaining: bucket.tokens,
            };
        }

        // Rate limited - calculate retry time
        const tokensNeeded = 1;
        const refillRate = this.config.maxRequests / this.config.windowMs;
        const retryAfterMs = Math.ceil(tokensNeeded / refillRate);

        return {
            allowed: false,
            remaining: 0,
            retryAfterMs,
        };
    }

    /**
     * Reset rate limit for a specific key (useful for testing)
     */
    reset(key: string): void {
        this.buckets.delete(key);
    }

    /**
     * Clean up expired buckets (call periodically if needed)
     */
    cleanup(): void {
        const now = Date.now();
        const expireAfter = this.config.windowMs * 2;

        for (const [key, bucket] of this.buckets) {
            if (now - bucket.lastRefill > expireAfter) {
                this.buckets.delete(key);
            }
        }
    }
}

// Default MCP rate limiter: 100 requests per minute
export const mcpRateLimiter = new TokenBucketRateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
});
