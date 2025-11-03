/**
 * Environment configuration utilities
 * Handles environment-specific settings for both development and production
 */

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Get the base URL for the application
 * Returns production URL in production, localhost URL in development
 */
export function getBaseUrl(): string {
  // En el navegador (client-side)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // En el servidor (server-side)
  // En producción, usa NEXTAUTH_URL
  if (isProduction && process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, ''); // Remover trailing slash
  }

  // En desarrollo, usa URL_LOCAL o default localhost
  if (isDevelopment && process.env.URL_LOCAL) {
    return process.env.URL_LOCAL.replace(/\/$/, '');
  }

  // Fallback a localhost
  return 'http://localhost:3000';
}

/**
 * Get the API base URL
 */
export function getApiUrl(): string {
  return `${getBaseUrl()}/api`;
}

/**
 * Environment variables with type safety
 */
export const env = {
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  nextAuthUrl: process.env.NEXTAUTH_URL || '',
  urlLocal: process.env.URL_LOCAL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
