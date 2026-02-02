import { useAuthStore } from '@/stores/auth/auth.store'
import { storeToRefs } from 'pinia'
import type { Comment } from '@/services/orders/types'

const intersection = <T>(arr1: T[], arr2: T[]): T[] => {
  return arr1.filter(item => arr2.includes(item))
}

export const usePermissions = () => {
  const { permissions: userPermissions, customer: currentUser } = storeToRefs(useAuthStore())

  const can = (permissionsArg: string | Array<string>, all = false): boolean => {
    const auth_permissions = userPermissions.value
    if (typeof permissionsArg === 'string' && auth_permissions) {
      return auth_permissions.permissions.includes(permissionsArg)
    } else if (auth_permissions && Array.isArray(permissionsArg)) {
      const can_do = intersection(auth_permissions.permissions, permissionsArg)
      if (can_do) {
        if (all) {
          return can_do.length === permissionsArg.length
        } else {
          return can_do.length > 0
        }
      } else {
        return false
      }
    } else {
      return false
    }
  }

  const canEditComment = (comment: Comment): boolean => {
    if (!currentUser.value) return false
    return comment.user?.id === currentUser.value.id
  }

  const canDeleteComment = (comment: Comment): boolean => {
    if (!currentUser.value) return false
    return comment.user?.id === currentUser.value.id
  }

  const canResolveComment = (comment: Comment): boolean => {
    if (!currentUser.value || !can('can-resolve-comment')) return false

    if (comment.user?.userroles?.length) {
      const commentUserRole = comment.user.userroles[0]!.name
      if (['SuperAdmin', 'OrderAdministrator'].includes(commentUserRole)) {
        return false
      }
    }
    return true
  }

  return {
    can,
    canEditComment,
    canDeleteComment,
    canResolveComment
  }
}
