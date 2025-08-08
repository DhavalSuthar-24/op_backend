import { Context, Next } from "hono";

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

export const rateLimiter = async (c: Context, next: Next) => {
  const clientIP = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const key = `${clientIP}:${c.req.path}`;
  
  const now = Date.now();
  const windowSize = 60 * 1000; // 1 minute
  const maxRequests = 100; // requests per minute
  
  const currentInfo = rateLimitStore.get(key);
  
  if (!currentInfo) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowSize });
    return next();
  }
  
  if (now > currentInfo.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowSize });
    return next();
  }
  
  if (currentInfo.count >= maxRequests) {
    return c.json({ 
      error: "Rate limit exceeded", 
      retryAfter: Math.ceil((currentInfo.resetTime - now) / 1000) 
    }, 429);
  }
  
  currentInfo.count++;
  rateLimitStore.set(key, currentInfo);
  
  // Cleanup old entries
  if (Math.random() < 0.01) { // 1% chance to cleanup
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return next();
};