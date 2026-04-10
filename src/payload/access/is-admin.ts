/**
 * Access Control Helpers
 * 
 * Reusable access control functions for Payload collections
 */

import type { Access } from 'payload'

/**
 * Check if user is authenticated (any role)
 */
export const isAuthenticated: Access = ({ req: { user } }) => {
  return Boolean(user)
}

/**
 * Check if user is an admin (super-admin or admin role)
 */
export const isAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  return user.role === 'admin' || user.role === 'super-admin'
}

/**
 * Check if user is a super admin
 */
export const isSuperAdmin: Access = ({ req: { user } }) => {
  return user?.role === 'super-admin'
}

/**
 * Allow anyone (for public read access)
 */
export const isAnyone: Access = () => true

/**
 * Deny everyone (for restricted collections)
 */
export const isNobody: Access = () => false

/**
 * Check if user owns the document or is super admin
 */
export const isOwnerOrSuperAdmin: Access = ({ req: { user }, id }) => {
  if (!user) return false
  if (user.role === 'super-admin') return true
  return user.id === id
}
