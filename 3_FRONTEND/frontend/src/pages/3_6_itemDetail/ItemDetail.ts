import React from 'react'
import '../../styles/pages/item.css'
import { getItem, listItems, Item, deleteItem, isItemOwnedByUser } from '../../services/items'
import { getUser } from '../../services/auth'
import { useParams, Link, useNavigate } from 'react-router-dom'

export default function ItemDetail(): React.ReactElement {
  const { id } = useParams()
  const [item, setItem] = React.useState<Item | undefined>(undefined)
  const [similarItems, setSimilarItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const navigate = useNavigate()
  const user = React.useMemo(() => getUser(), [])

  React.useEffect(() => {
    if (!id) {
      setError('Oggetto non trovato')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [itemData, allItems] = await Promise.all([getItem(id), listItems()])
        if (cancelled) return

        if (!itemData) {
          setError('Oggetto non trovato')
          setItem(undefined)
          return
        }

        setItem(itemData)

        const similarByCategory = allItems
          .filter(i => i.id !== itemData.id && i.category && itemData.category && i.category.toLowerCase() === itemData.category.toLowerCase())
          .slice(0, 4)

        if (similarByCategory.length > 0) {
          setSimilarItems(similarByCategory)
        } else {
          const fallback = allItems.filter(i => i.id !== itemData.id).slice(0, 4)
          setSimilarItems(fallback)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Impossibile caricare l\'annuncio'
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return React.createElement('div', { className: 'fs-container' }, React.createElement('p', null, 'Caricamento annuncio...'))
  }

  if (error || !item) {
    return React.createElement('div', { className: 'fs-container' }, React.createElement('h2', null, error || 'Oggetto non trovato'))
  }

  const isOwner = isItemOwnedByUser(item, user)

  async function handleDelete() {
    if (!item) return
    if (!window.confirm('Vuoi davvero eliminare questo annuncio?')) return
    try {
      await deleteItem(item.id)
      navigate('/items')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione.'
      window.alert(message)
    }
  }

  // Carica items simili (stessa categoria) oppure gli ultimi 4
  const similar = similarItems

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
          React.createElement('div', { className: 'seller-meta' }, `Venduto da: ${item.ownerName || item.owner || 'utente'}`)
        ),

        React.createElement('div', { className: 'item-badge-row' },
          item.category ? React.createElement('span', { className: 'item-badge primary' }, item.category) : null,
          item.condition ? React.createElement('span', { className: 'item-badge' }, item.condition) : null,
          item.location ? React.createElement('span', { className: 'item-badge' }, item.location) : null
        ),

        React.createElement('h3', { className: 'item-section-title' }, 'Descrizione'),
        React.createElement('p', { className: 'item-desc' }, item.description),

        React.createElement('div', { className: 'item-attrs' },
          React.createElement('div', null, React.createElement('strong', null, 'Categoria: '), React.createElement('span', null, item.category || '-')),
          React.createElement('div', null, React.createElement('strong', null, 'Condizione: '), React.createElement('span', null, item.condition || 'Non specificata')),
          React.createElement('div', null, React.createElement('strong', null, 'Località: '), React.createElement('span', null, item.location || 'Non specificata'))
        ),

        // Pulsante Acquista più piccolo, all'interno del riquadro dei dettagli, sotto descrizione/attributi
        !isOwner
          ? React.createElement('div', { style: { marginTop: '0.75rem' } },
              React.createElement(Link, {
                to: `/items/${item.id}/checkout`,
                className: 'buy-btn small',
                style: { display: 'inline-flex', justifyContent: 'center' }
              }, 'Acquista ora')
            )
          : React.createElement('div', { className: 'owner-info-alert' }, 'Questo è uno dei tuoi annunci. Puoi modificarlo o eliminarlo dal pannello sottostante.'),

        isOwner
          ? React.createElement('div', { className: 'item-owner-actions' },
              React.createElement(Link, { to: `/items/${item.id}/edit`, className: 'owner-action edit-action' }, 'Modifica annuncio'),
              React.createElement('button', { type: 'button', className: 'owner-action delete-action', onClick: handleDelete }, 'Elimina annuncio')
            )
          : null,

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
