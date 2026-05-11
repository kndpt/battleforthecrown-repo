import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)

if (window.location.pathname === '/design-system') {
  const { DesignSystemPreview } = await import('./features/design-system/DesignSystemPreview')
  root.render(
    <StrictMode>
      <DesignSystemPreview />
    </StrictMode>,
  )
} else {
  const { default: App } = await import('./App.tsx')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
