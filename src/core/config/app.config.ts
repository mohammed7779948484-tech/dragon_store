/**
 * App Configuration - Application-wide settings
 */

import { env } from './env'

export const appConfig = {
  name: 'Dragon',
  version: process.env.npm_package_version || '1.0.0',
  description: 'Private e-commerce platform for vape products',
  
  // URLs
  serverUrl: env.NEXT_PUBLIC_SERVER_URL,
  
  // Session
  session: {
    cookieName: 'session',
    defaultDuration: 24 * 60 * 60 * 1000, // 24 hours
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  
  // Cart
  cart: {
    maxQuantity: 10,
    expirationHours: 24,
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 50,
  },
  
  // Order
  order: {
    prefix: 'VX',
    numberLength: 6,
  },
  
  // Upload
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
} as const

export type AppConfig = typeof appConfig
