// =============================================================================
// VRINDAVAN BHANDARA — Rate Limiting
// Source: 09-security-standards.md — "Rate Limiting mandatory"
// Uses in-memory store for development, Upstash Redis for production
// =============================================================================

type RateLimitConfig = {
  windowMs: number; // milliseconds
  max: number;      // max requests per window
};

// In-memory store for development
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt < now) memoryStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();

  // Use Upstash Redis in production if configured
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    process.env.NODE_ENV === "production"
  ) {
    return checkUpstashRateLimit(key, config);
  }

  // In-memory fallback
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      success: true,
      remaining: config.max - 1,
      resetAt: new Date(now + config.windowMs),
    };
  }

  if (entry.count >= config.max) {
    return { success: false, remaining: 0, resetAt: new Date(entry.resetAt) };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: config.max - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

async function checkUpstashRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetAt: Date }> {
  try {
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`;
    const windowSeconds = Math.ceil(config.windowMs / 1000);
    const now = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds],
      ]),
    });

    const data = (await response.json()) as Array<{ result: number }>;
    const count = data[0]?.result ?? 1;

    return {
      success: count <= config.max,
      remaining: Math.max(0, config.max - count),
      resetAt: new Date(now + config.windowMs),
    };
  } catch {
    // If Redis fails, allow the request (fail open for UX)
    return {
      success: true,
      remaining: 1,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

// =============================================================================
// Pre-configured rate limiters
// =============================================================================

export async function authRateLimit(ip: string) {
  return checkRateLimit(`auth:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 });
}

export async function apiRateLimit(ip: string) {
  return checkRateLimit(`api:${ip}`, { windowMs: 60 * 1000, max: 60 });
}

export async function paymentRateLimit(ip: string) {
  return checkRateLimit(`payment:${ip}`, { windowMs: 60 * 1000, max: 5 });
}

export async function uploadRateLimit(ip: string) {
  return checkRateLimit(`upload:${ip}`, { windowMs: 60 * 60 * 1000, max: 20 });
}

export async function contactRateLimit(ip: string) {
  return checkRateLimit(`contact:${ip}`, { windowMs: 60 * 60 * 1000, max: 3 });
}
