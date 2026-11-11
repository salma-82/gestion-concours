import React from 'react'

export const isDemoMode = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return String(user.role || '').toLowerCase() === 'demo'
  } catch {
    return false
  }
}

export const isDemoFree = (item) => item?.isFree === true || item?.is_free === true

export const demoContentClass = (item) => (
  isDemoMode() && !isDemoFree(item) ? 'demo-content-locked' : ''
)

export const guardDemoContent = (item, action) => (event) => {
  if (isDemoMode() && !isDemoFree(item)) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    window.dispatchEvent(new CustomEvent('econcours-demo-paywall'))
    return
  }
  action?.(event)
}

export function DemoAccessBadge({ item }) {
  if (!isDemoMode()) return null
  return isDemoFree(item)
    ? <span className="demo-access-badge is-free">Gratuit</span>
    : <span className="demo-access-badge is-locked" aria-label="Contenu verrouillé">🔒</span>
}
