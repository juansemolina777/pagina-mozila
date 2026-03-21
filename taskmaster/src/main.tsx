import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui/Toast.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

// Only wrap with GoogleOAuthProvider when a Client ID is configured.
// Without it, useGoogleLogin() throws and crashes the auth page.
const AppWithProviders = () => (
  <ToastProvider>
    <App />
  </ToastProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppWithProviders />
      </GoogleOAuthProvider>
    ) : (
      <AppWithProviders />
    )}
  </StrictMode>,
)
