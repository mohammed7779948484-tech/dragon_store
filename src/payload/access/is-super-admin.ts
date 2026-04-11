/**
 * Super Admin Access Control
 * 
 * Strict access control for super-admin only operations
 */

import type { Access, FieldAccess } from 'payload'

/**
 * Only super admins can access
 */
export const superAdminOnly: Access = ({ req: { user } }) => {
  return user?.role === 'super-admin'
}

/**
 * Only super admins can update specific fields
 */
export const superAdminFieldAccess: FieldAccess = ({ req: { user } }) => {
  return user?.role === 'super-admin'
}

/**
 * Check if user can manage other users
 * Only super admins can create/delete/update other admins
 */
export const canManageUsers: Access = ({ req: { user }, id }) => {
  if (!user) return false
  
  // Super admins can manage anyone
  if (user.role === 'super-admin') return true
  
  // Regular admins can only update themselves
  return user.id === id
}

/**
 * Check if user can delete users
 * Only super admins can delete, and they cannot delete themselves
 */
export const canDeleteUser: Access = async ({ req, id }) => {
  const { user } = req
  
  if (!user) return false
  if (user.role !== 'super-admin') return false
  
  // Prevent super admins from deleting themselves
  if (user.id === id) {
    return false
  }
  
  // Check if target user exists and is also a super admin
  // Optional: Prevent deleting other super admins
  try {
    const targetUser = await req.payload.findByID({
      collection: 'users',
      id: id as string,
    })
    
    if (targetUser.role === 'super-admin') {
      // Optional: Prevent deleting other super admins
      // return false
    }
  } catch {
    // User not found, allow deletion attempt (will fail anyway)
  }
  
  return true
}
