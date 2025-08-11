// types/hono.ts
import { User } from "../middleware/auth.js"

declare module 'hono' {
  interface ContextVariableMap {
    user: User;
  }
}