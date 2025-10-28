import React from 'react'

export default function Home(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'pa-card' },
    React.createElement('h1', { className: 'text-2xl pa-heading mb-2' }, 'Benvenuto — Progetto Autonomia'),
    React.createElement('p', { className: 'text-muted' }, 'Questa è la pagina Home (mock API disponibile in sviluppo).')
  )
}
