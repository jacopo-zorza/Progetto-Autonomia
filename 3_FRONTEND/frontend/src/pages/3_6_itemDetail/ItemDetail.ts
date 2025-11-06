import React from 'react'
import '../../styles/pages/item.css'
import { getItem, listItems, Item } from '../../services/items'
import { useParams, Link } from 'react-router-dom'

export default function ItemDetail(): React.ReactElement {
  const { id } = useParams()
  const item = id ? getItem(id) : undefined

  if (!item) {
    return React.createElement('div', { className: 'fs-container' }, React.createElement('h2', null, 'Oggetto non trovato'))
  }

  // Carica items simili (stessa categoria) oppure gli ultimi 4
  const all = listItems()
  const similar: Item[] = all.filter(i => i.id !== item.id && i.category && item.category && i.category.toLowerCase() === item.category.toLowerCase()).slice(0,4)
  if (similar.length === 0) {
    // fallback: ultimi 4 diversi
    const fallback = all.filter(i => i.id !== item.id).slice(0,4)
    similar.push(...fallback)
  }

  return React.createElement(
    'div',
    { className: 'fs-container' },

    React.createElement('div', { className: 'item-detail-grid' },

      // Main: image and title (left)
      React.createElement('div', { className: 'item-main' },
        React.createElement('div', { className: 'item-media' },
          React.createElement('img', { src: item.image ? item.image : `https://picsum.photos/seed/${item.id}/900/700`, alt: item.title, className: 'item-main-img' })
        ),
        React.createElement('h1', { className: 'item-title' }, item.title)
      ),

      // Right: details (right column) - include price and seller inside this card
      React.createElement('div', { className: 'item-details' },
        React.createElement('div', { className: 'item-price-seller' },
          React.createElement('div', { className: 'item-price-inline' }, item.price ? `€ ${item.price}` : '-'),
          React.createElement('div', { className: 'seller-meta' }, `Venduto da: ${item.owner || 'utente'}`)
        ),

        React.createElement('h3', { className: 'item-section-title' }, 'Descrizione'),
        React.createElement('p', { className: 'item-desc' }, item.description),

        React.createElement('div', { className: 'item-attrs' },
          React.createElement('div', null, React.createElement('strong', null, 'Categoria: '), React.createElement('span', null, item.category || '-')),
          React.createElement('div', null, React.createElement('strong', null, 'Condizione: '), React.createElement('span', null, 'Usato')),
          React.createElement('div', null, React.createElement('strong', null, 'Località: '), React.createElement('span', null, 'Non specificata'))
        ),

        // Pulsante Acquista più piccolo, all'interno del riquadro dei dettagli, sotto descrizione/attributi
        React.createElement('div', { style: { marginTop: '0.75rem' } },
          React.createElement('button', { className: 'buy-btn small' }, 'Acquista ora')
        ),

        React.createElement('div', { className: 'item-actions' },
          React.createElement(Link, { to: '/items', className: 'pa-link' }, 'Torna agli oggetti')
        )
      )
    ),

    // Similar items below
    React.createElement('section', { className: 'similar-section' },
      React.createElement('h3', { className: 'item-section-title' }, 'Potrebbe interessarti'),
      React.createElement('div', { className: 'similar-grid' },
        similar.map(s => React.createElement(Link, { to: `/items/${s.id}`, key: s.id, className: 'fs-card similar-card' },
            React.createElement('div', { className: 'fs-card-media' },
            React.createElement('img', { src: s.image ? s.image : `https://picsum.photos/seed/${s.id}/400/300`, alt: s.title, className: 'fs-card-img' }),
            React.createElement('div', { className: 'fs-price' }, s.price ? `€ ${s.price}` : '-')
          ),
          React.createElement('div', { className: 'fs-card-body' },
            React.createElement('div', { className: 'fs-card-title' }, s.title),
            React.createElement('div', { className: 'fs-card-sub' }, s.description)
          )
        ))
      )
    )
  )
}
