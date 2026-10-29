import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MissingClerkKey } from './components/MissingClerkKey.tsx'
import { ThemedClerkProvider } from './components/ThemedClerkProvider.tsx'
import { watchSystemTheme } from './lib/theme.ts'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

watchSystemTheme()

createRoot(root).render(
  <StrictMode>
    {publishableKey ? <ThemedClerkProvider publishableKey={publishableKey} /> : <MissingClerkKey />}
  </StrictMode>,
)
