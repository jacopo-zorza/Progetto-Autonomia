import React from 'react'
import '../../styles/pages/items.css'
import { listItems } from '../../services/items'
import { Link } from 'react-router-dom'

export default function ItemsList(): React.ReactElement {
  const items = listItems()

  return React.createElement(
    'div',
    null,
    React.createElement('h2', { className: 'text-xl pa-heading mb-4' }, 'Elenco oggetti'),
    React.createElement(
      'div',
      { className: 'grid gap-4' },
      items.map((i: any) => React.createElement(
        'div',
        { key: i.id, className: 'pa-card items-card flex items-start gap-4' },
        // immagine (se presente)
        // Usa l'immagine dell'item se presente, altrimenti fallback deterministico
        React.createElement('img', {
          src: i.image ? i.image : `https://picsum.photos/seed/${i.id}/400/300`,
          alt: i.title || 'Immagine oggetto',
          className: 'pa-img'
        }),
        // contenuto testuale
        React.createElement('div', { className: 'pa-body' },
          React.createElement(Link, { to: `/items/${i.id}`, className: 'pa-title pa-link' }, i.title),
          React.createElement('p', { className: 'pa-desc' }, i.description),
          React.createElement('div', { className: 'pa-tags' },
            i.category ? React.createElement('span', { className: 'pa-tag' }, i.category) : null,
            i.condition ? React.createElement('span', { className: 'pa-chip' }, i.condition) : null,
            i.location ? React.createElement('span', { className: 'pa-chip' }, i.location) : null
          ),
          React.createElement('div', { className: 'pa-footer-row' },
            React.createElement('div', { className: 'pa-price' }, i.price ? `${i.price} €` : 'Prezzo non specificato'),
            React.createElement('div', { className: 'pa-owner' }, `Venduto da ${i.ownerName || i.owner || 'utente'}`)
          )
        )
      ))
    )
  )
}
