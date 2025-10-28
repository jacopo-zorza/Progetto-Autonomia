import React from 'react'

export default function NotFound(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'bg-white shadow rounded p-6 text-center' },
    React.createElement('h2', { className: 'text-2xl font-semibold mb-2 text-red-600' }, '404 — Pagina non trovata'),
    React.createElement('p', { className: 'text-gray-600' }, 'La pagina richiesta non esiste o è stata rimossa.')
  )
}
