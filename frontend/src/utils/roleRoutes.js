export const getRolePrefixFromRole = (role) => {
  if (role === 'ADMIN') return '/admin'
  if (role === 'PROJECT_MANAGER') return '/pm'
  return '/member'
}

export const getRolePrefixFromPath = (pathname = '') => {
  if (pathname.startsWith('/admin')) return '/admin'
  if (pathname.startsWith('/pm')) return '/pm'
  if (pathname.startsWith('/member')) return '/member'
  return '/member'
}

export const getProjectListPath = (prefix) => {
  if (prefix === '/pm') return '/pm/projects'
  if (prefix === '/admin') return '/admin/dashboard'
  return '/dashboard'
}

export const buildProfilePath = (prefix, userId = null, currentUserId = null) => {
  if (prefix === '/admin') {
    return userId ? `/admin/profile/${userId}` : '/admin/profile'
  }
  if (prefix === '/pm') {
    return userId ? `/pm/profile/${userId}` : '/pm/profile'
  }
  if (!userId || userId === currentUserId) return '/profile'
  return null
}

export const buildProjectPath = (prefix, projectId) => `${prefix}/projects/${projectId}`
export const buildProjectTasksPath = (prefix, projectId) => `${prefix}/projects/${projectId}/tasks`
export const buildProjectMilestonesPath = (prefix, projectId) => `${prefix}/projects/${projectId}/milestones`
export const buildProjectSkillsPath = (prefix, projectId) => `${prefix}/projects/${projectId}/skills`
export const buildProjectDashboardPath = (prefix, projectId) => `${prefix}/projects/${projectId}/dashboard`

export const normalizeProjectLinkForRole = (link, role) => {
  if (!link) return link

  const prefix = getRolePrefixFromRole(role)

  if (/^\/(?:pm|admin|member)\/projects(?:\/|$)/.test(link)) {
    return link.replace(/^\/(?:pm|admin|member)/, prefix)
  }

  return link
}
