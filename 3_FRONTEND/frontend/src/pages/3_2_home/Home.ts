import React, { useEffect, useMemo, useState } from 'react'
import '../../styles/pages/home.css'
import { Link } from 'react-router-dom'
import { listItems, createItem, Item } from '../../services/items'
import { getUser } from '../../services/auth'
import { listFavorites, toggleFavorite } from '../../services/favorites'

export default function Home(): React.ReactElement {
  const e = React.createElement
  const [items, setItems] = useState<Item[]>([])
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const currentUser = useMemo(() => getUser(), [])
  const [favorites, setFavorites] = useState<string[]>(() => listFavorites(currentUser))

  useEffect(() => {
    let current = listItems()
    if (!current || current.length === 0) {
      // crea alcuni demo items per la home
      const demos = [
        { title: 'Giacca invernale', description: 'Calda, usata una stagione', price: 45, owner: 'luca', ownerName: 'Luca', category: 'Abbigliamento', condition: 'Usato', location: 'Milano' },
        { title: 'Borsa in pelle', description: 'Vintage, ottime condizioni', price: 60, owner: 'martina', ownerName: 'Martina', category: 'Abbigliamento', condition: 'Come nuova', location: 'Torino' },
        { title: 'Smartphone usato', description: 'Perfetto stato, 64GB', price: 120, owner: 'andrea', ownerName: 'Andrea', category: 'Elettronica', condition: 'Ottimo', location: 'Bologna' },
        { title: 'Lampada design', description: 'Ideale per soggiorno', price: 25, owner: 'sara', ownerName: 'Sara', category: 'Casa', condition: 'Usato', location: 'Verona' },
        { title: 'Bicicletta city', description: 'Serviziata, freni nuovi', price: 150, owner: 'marco', ownerName: 'Marco', category: 'Sport', condition: 'Buono', location: 'Padova' },
        { title: 'Scarpe da corsa', description: 'Taglia 42, quasi nuove', price: 30, owner: 'elena', ownerName: 'Elena', category: 'Sport', condition: 'Come nuove', location: 'Trieste' }
      ]
      demos.forEach(d => createItem(d))
      current = listItems()
    }
    setItems(current)
  }, [])

  const categories = useMemo(() => {
    const base = new Set<string>()
    base.add('Abbigliamento')
    base.add('Elettronica')
    base.add('Casa')
    base.add('Sport')
    base.add('Bambini')
    base.add('Libri')
    base.add('Collezionismo')
    base.add('Motori')
    base.add('Altro')
    items.forEach(item => {
      if (item.category) base.add(item.category)
    })
    if (favorites.length > 0) base.add('Preferiti')
    return Array.from(base)
  }, [items, favorites])

  const favoriteIds = useMemo(() => new Set(favorites), [favorites])

  useEffect(() => {
    function syncFavorites() {
      setFavorites(listFavorites(currentUser))
    }
    syncFavorites()
    try {
      window.addEventListener('favorites-changed', syncFavorites)
      window.addEventListener('auth-changed', syncFavorites)
    } catch (error) {
      // ignore if events unsupported
    }
    return () => {
      try {
        window.removeEventListener('favorites-changed', syncFavorites)
        window.removeEventListener('auth-changed', syncFavorites)
      } catch (error) {
        // noop
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (favorites.length === 0 && activeCategory === 'Preferiti') {
      setActiveCategory(null)
    }
  }, [favorites, activeCategory])

  function handleToggleFavorite(event: any, itemId: string) {
    event.preventDefault()
    event.stopPropagation()
    const next = toggleFavorite(itemId, currentUser)
    setFavorites(next)
  }

  const filtered = useMemo(() => {
    const favoriteChecks = new Set(favorites)
    return items.filter(i => {
      const matchesQuery = query.trim() === '' || `${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = !activeCategory
        || (activeCategory === 'Preferiti' ? favoriteChecks.has(i.id) : (i.category && i.category.toLowerCase() === activeCategory.toLowerCase()))
      return matchesQuery && matchesCategory
    })
  }, [items, query, activeCategory, favorites])

  return e('div', { className: 'fs-home' },
      // Search bar area (centered like Vinted)
      e('section', { className: 'fs-hero' },
        e('div', { className: 'fs-hero-inner' },
          e('div', { className: 'fs-logo-title' },
            e('h1', { className: 'fs-title' }, 'FastSeller'),
            e('p', { className: 'fs-sub' }, 'Compra, vendi e trova occasioni vicino a te')
          ),
          e('form', { className: 'fs-search', onSubmit: (ev: any) => { ev.preventDefault(); /* search handled by query state */ } },
            e('input', { type: 'text', className: 'fs-search-input', placeholder: 'Cerca articoli, marche, tag...', value: query, onChange: (ev: any) => setQuery(ev.target.value) }),
            e('button', { className: 'fs-search-btn', type: 'submit' }, 'Cerca')
          )
        )
      ),

      // Quick filters (categories) below search
      e('div', { className: 'fs-cats-wrap' },
        e('div', { className: 'fs-cats' },
          // 'Tutto' button to show all items
          e('button', {
            key: 'Tutto',
            className: `fs-cat ${activeCategory === null ? 'active' : ''}`,
            onClick: () => { setActiveCategory(null); setQuery('') }
          }, 'Tutto'),
          categories.map(cat => e('button', {
            key: cat,
            className: `fs-cat ${activeCategory === cat ? 'active' : ''}`,
            onClick: () => setActiveCategory(activeCategory === cat ? null : cat)
          }, cat))
        )
      ),

      // Grid of items (Vinted-like cards)
      e('main', { className: 'fs-container' },
        e('div', { className: 'fs-grid' },
          filtered.map((item, idx) =>
            e(Link, { to: `/items/${item.id}`, key: `${item.id}-${idx}`, className: 'fs-card' },
              // image with price tag and heart
              e('div', { className: 'fs-card-media' },
                e('img', { src: item.image ? item.image : `https://picsum.photos/seed/${item.id}/800/600`, alt: item.title, className: 'fs-card-img' }),
                e('div', { className: 'fs-price' }, item.price ? `€ ${item.price}` : '-'),
                e('button', {
                  className: `fs-fav ${favoriteIds.has(item.id) ? 'active' : ''}`,
                  title: favoriteIds.has(item.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti',
                  onClick: (ev: any) => handleToggleFavorite(ev, item.id),
                  type: 'button',
                  'aria-pressed': favoriteIds.has(item.id)
                },
                  e('svg', { width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
                    e('path', {
                      d: 'M12 21s-7.5-4.35-9.5-6.35C-0.5 11.5 3.5 6 8.5 6c2.5 0 3.5 1.5 3.5 1.5S14 6 16.5 6C21.5 6 25.5 11.5 21.5 14.65 19.5 16.65 12 21 12 21z',
                      fill: favoriteIds.has(item.id) ? '#dc2626' : '#d1d5db'
                    })
                  )
                )
              ),

              // Meta: title, location, seller
              e('div', { className: 'fs-card-body' },
                e('div', { className: 'fs-card-title' }, item.title),
                e('div', { className: 'fs-card-sub' }, item.description),
                e('div', { className: 'fs-card-meta fs-card-meta-row' },
                  item.category ? e('span', { className: 'fs-tag' }, item.category) : null,
                  item.condition ? e('span', { className: 'fs-meta-chip' }, item.condition) : null,
                  item.location ? e('span', { className: 'fs-meta-chip' }, item.location) : null
                ),
                e('div', { className: 'fs-card-meta' }, `Venduto da ${item.ownerName || item.owner || 'utente'}`)
              )
            )
          )
        )
      ),

      // CTA bar similar to Vinted
      e('section', { className: 'fs-cta' },
        e('div', { className: 'fs-container' },
          e('div', { className: 'fs-cta-inner' },
            e('div', null, e('h2', { className: 'fs-cta-title' }, 'Hai qualcosa da vendere?'), e('p', { className: 'fs-cta-sub' }, 'Metti in vendita in pochi minuti')),
            e(Link, { to: '/create', className: 'fs-cta-btn' }, 'Inserisci annuncio')
          )
        )
      )
    )
}

