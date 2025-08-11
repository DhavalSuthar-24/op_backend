// middleware/auth.ts
import { Context } from "hono";
import { sign, verify } from "hono/jwt";
import bcrypt from "bcryptjs";

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Types
// types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
}

export interface CustomJWTPayload {
  id: string;
  email: string;
  name: string;
  exp?: number;
  [key: string]: any; // Index signature for Hono JWT compatibility
}
// Generate JWT token
export const generateToken = async (user: User): Promise<string> => {
  const payload: CustomJWTPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  return await sign(payload, JWT_SECRET);
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Auth middleware
export const authMiddleware = async (c: Context, next: Function) => {
  try {
    const authHeader = c.req.header("authorization");
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return c.json({ error: "Access token is required" }, 401);
    }

    try {
      const payload = await verify(token, JWT_SECRET) as any;
      
      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return c.json({ error: "Token has expired" }, 401);
      }

      // Validate required fields
      if (!payload.id || !payload.email || !payload.name) {
        return c.json({ error: "Invalid token payload" }, 401);
      }

      // Set user in context
      c.set("user", {
        id: payload.id,
        email: payload.email,
        name: payload.name,
      });

      await next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
};

// Optional: Middleware for admin-only routes
export const adminMiddleware = async (c: Context, next: Function) => {
  // First run auth middleware
  await authMiddleware(c, async () => {
    const user = c.get("user");
    
    // Check if user is admin (you might want to add an isAdmin field to your User model)
    // For now, we'll check if the user's email is in admin list
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    
    if (!adminEmails.includes(user.email)) {
      return c.json({ error: "Admin access required" }, 403);
    }

    await next();
  });
};

// Helper function to get current user from context
export const getCurrentUser = (c: Context): User | null => {
  return c.get("user") || null;
};

// Validate token without middleware (useful for optional auth)
export const validateToken = async (token: string): Promise<User | null> => {
  try {
    const payload = await verify(token, JWT_SECRET) as any;
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Validate required fields
    if (!payload.id || !payload.email || !payload.name) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
};