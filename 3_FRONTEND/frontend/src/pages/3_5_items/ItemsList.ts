import React from 'react'
import '../../styles/pages/items.css'
import { listItems, Item, deleteItem, isItemOwnedByUser } from '../../services/items'
import { Link } from 'react-router-dom'
import { getUser } from '../../services/auth'

export default function ItemsList(): React.ReactElement {
  const [items, setItems] = React.useState<Item[]>(() => listItems())
  const currentUser = React.useMemo(() => getUser(), [])

  function refresh() {
    setItems(listItems())
  }

  function handleDelete(id: string) {
    const confirmDelete = window.confirm('Vuoi rimuovere questo annuncio dalla lista?')
    if (!confirmDelete) return
    const removed = deleteItem(id)
    if (!removed) {
      window.alert('Non è stato possibile eliminare l\'annuncio. Riprova più tardi.')
      return
    }
    refresh()
  }

  return React.createElement(
    'div',
    null,
    React.createElement('h2', { className: 'text-xl pa-heading mb-4' }, 'Elenco oggetti'),
    React.createElement(
      'div',
      { className: 'grid gap-4' },
      items.map((i: Item) => {
        const isOwner = isItemOwnedByUser(i, currentUser)
        return React.createElement(
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
          ),
          isOwner
            ? React.createElement('div', { className: 'items-owner-actions' },
                React.createElement(Link, { to: `/items/${i.id}/edit`, className: 'items-owner-link' }, 'Modifica'),
                React.createElement('button', { type: 'button', className: 'items-owner-delete', onClick: () => handleDelete(i.id) }, 'Elimina')
              )
            : null
        )
      })
    )
  )
}
