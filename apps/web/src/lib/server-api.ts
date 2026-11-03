/**
 * Server-side API configuration
 * Used by Next.js API routes and Server Components
 */
export const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";
