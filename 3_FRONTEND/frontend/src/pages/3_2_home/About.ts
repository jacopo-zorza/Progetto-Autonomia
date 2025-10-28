import React from 'react'

export default function About(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'bg-white shadow rounded p-6' },
    React.createElement('h2', { className: 'text-2xl font-semibold mb-2' }, 'Informazioni'),
    React.createElement('p', { className: 'text-gray-700' }, 'Progetto Autonomia — prototipo frontend minimale. Palette colori applicata.' )
  )
}
