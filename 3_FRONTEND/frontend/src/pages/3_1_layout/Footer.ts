import React from 'react'

export default function Footer(): React.ReactElement {
  return React.createElement(
    'footer',
    { className: 'bg-gray-50 border-t' },
    React.createElement(
      'div',
      { className: 'container mx-auto p-4 text-sm text-gray-600' },
      `© ${new Date().getFullYear()} Progetto Autonomia — Prototipo`
    )
  )
}
