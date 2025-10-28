import React from 'react'
import { listItems } from '../../services/items'
import { Link } from 'react-router-dom'

export default function ItemsList(): React.ReactElement {
  const items = listItems()

  return React.createElement(
    'div',
    null,
    React.createElement('h2', { className: 'text-xl pa-heading mb-4' }, 'Elenco oggetti'),
    React.createElement('div', { className: 'grid gap-4' }, items.map((i: any) => React.createElement('div', { key: i.id, className: 'pa-card' },
      React.createElement(Link, { to: `/items/${i.id}`, className: 'text-xl pa-heading' }, i.title),
      React.createElement('p', { className: 'text-muted mt-2' }, i.description),
      React.createElement('div', { className: 'mt-3 text-sm text-gray-600' }, i.price ? `${i.price} €` : 'Prezzo non specificato')
    )))
  )
}
