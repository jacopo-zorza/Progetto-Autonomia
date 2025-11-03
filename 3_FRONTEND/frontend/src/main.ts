import React from 'react'
import { createRoot } from 'react-dom/client'
import Router from './routes'
import './styles/index.css'

// Avvia MSW solo se esplicitamente abilitato (VITE_USE_MSW=true) in sviluppo.
// Questo permette di forzare l'uso del backend reale durante lo sviluppo.
if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW === 'true') {
  // usa top-level await per essere sicuri che il worker sia attivo
  const { worker } = await import('./mocks/browser')
  await worker.start()
}

createRoot(document.getElementById('root')!).render(
  React.createElement(React.StrictMode, null, React.createElement(Router, null))
)
