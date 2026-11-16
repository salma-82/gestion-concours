import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import './theme.css'
import './demoAccess.css'
import App from './App.jsx'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (!token || typeof window === 'undefined') return config
  try {
    const requestUrl = new URL(config.url || '', config.baseURL || window.location.href)
    const isAppRequest = requestUrl.origin === window.location.origin
      || (requestUrl.hostname === window.location.hostname && requestUrl.port === '8081')
    if (isAppRequest && (requestUrl.pathname.startsWith('/api/') || requestUrl.pathname.startsWith('/uploads/'))) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

let sessionExpiryRedirectStarted = false

axios.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_EXPIRED') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')

    if (!sessionExpiryRedirectStarted && window.location.pathname !== '/login') {
      sessionExpiryRedirectStarted = true
      window.location.replace('/login')
    }
  }

  if (error.response?.status === 403 && error.response?.data?.code === 'DEMO_CONTENT_LOCKED') {
    window.dispatchEvent(new CustomEvent('econcours-demo-paywall'))
  }
  return Promise.reject(error)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
