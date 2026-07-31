import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error(
    "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN."
  );
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

export const publicApiRateLimiters = {
  join: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(45, "10 m"),
    prefix: "beloyal:rate-limit:join",
    analytics: true,
  }),

  card: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "beloyal:rate-limit:card",
    analytics: true,
  }),

  review: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "beloyal:rate-limit:review",
    analytics: true,
  }),
};

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    "unknown-client"
  );
}

export async function applyPublicRateLimit(
  request: NextRequest,
  limiter: Ratelimit,
  scope: string
) {
  const identifier = `${scope}:${getClientIp(request)}`;
  const result = await limiter.limit(identifier);

  if (!result.success) {
    const retryAfter = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000)
    );

    return NextResponse.json(
      {
        error:
          "Too many requests. Please wait before trying again.",
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  return null;
}