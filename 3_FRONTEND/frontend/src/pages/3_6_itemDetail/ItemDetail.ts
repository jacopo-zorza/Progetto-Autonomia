import React from 'react'
import { getItem } from '../../services/items'
import { useParams, Link } from 'react-router-dom'

export default function ItemDetail(): React.ReactElement {
  const { id } = useParams()
  const item = id ? getItem(id) : undefined

  if (!item) {
    return React.createElement('div', null, React.createElement('h2', null, 'Oggetto non trovato'))
  }

  return React.createElement(
    'div',
    { className: 'pa-card max-w-2xl mx-auto' },
    React.createElement('h2', { className: 'text-2xl pa-heading mb-2' }, item.title),
    React.createElement('p', { className: 'text-muted mb-2' }, item.description),
    React.createElement('p', { className: 'font-medium mb-4' }, `Prezzo: ${item.price ?? '-'}€`),
    React.createElement('div', { className: 'mt-4' }, React.createElement(Link, { to: '/items', className: 'pa-link' }, 'Torna agli oggetti'))
  )
}
