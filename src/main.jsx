import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(() => {
      // ping SW every 15min to fire any due notifications
      setInterval(() => {
        navigator.serviceWorker.controller?.postMessage('CHECK_NOTIFICATIONS')
      }, 15 * 60 * 1000)
      // also ping once on load so just-passed slots fire immediately
      setTimeout(() => {
        navigator.serviceWorker.controller?.postMessage('CHECK_NOTIFICATIONS')
      }, 1000)
    })
  })
}

// request notification permission on first open
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}
