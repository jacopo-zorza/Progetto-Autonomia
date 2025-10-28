import React from 'react'
import { createRoot } from 'react-dom/client'
import Router from './routes'
import './styles/index.css'

// Avvia MSW solo in sviluppo
if (import.meta.env.DEV) {
  import('./mocks/browser').then(({ worker }) => worker.start())
}

createRoot(document.getElementById('root')!).render(
  React.createElement(React.StrictMode, null, React.createElement(Router, null))
)
