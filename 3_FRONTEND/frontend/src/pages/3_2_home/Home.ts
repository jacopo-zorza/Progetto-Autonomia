import React, { useEffect, useMemo, useState } from 'react'
import '../../styles/pages/home.css'
import { Link } from 'react-router-dom'
import { listItems, createItem, Item } from '../../services/items'

export default function Home(): React.ReactElement {
  const e = React.createElement
  const [items, setItems] = useState<Item[]>([])
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    let current = listItems()
    if (!current || current.length === 0) {
      // crea alcuni demo items per la home
      const demos = [
        { title: 'Giacca invernale', description: 'Calda, usata una stagione', price: 45, owner: 'Luca', category: 'Abbigliamento' },
        { title: 'Borsa in pelle', description: 'Vintage, ottime condizioni', price: 60, owner: 'Martina', category: 'Abbigliamento' },
        { title: 'Smartphone usato', description: 'Perfetto stato, 64GB', price: 120, owner: 'Andrea', category: 'Elettronica' },
        { title: 'Lampada design', description: 'Ideale per soggiorno', price: 25, owner: 'Sara', category: 'Casa' },
        { title: 'Bicicletta city', description: 'Serviziata, freni nuovi', price: 150, owner: 'Marco', category: 'Sport' },
        { title: 'Scarpe da corsa', description: 'Taglia 42, quasi nuove', price: 30, owner: 'Elena', category: 'Sport' }
      ]
      demos.forEach(d => createItem(d))
      current = listItems()
    }
    setItems(current)
  }, [])

  const categories = ['Abbigliamento', 'Elettronica', 'Casa', 'Sport', 'Bambini', 'Altro']

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchesQuery = query.trim() === '' || `${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase())
  const matchesCategory = !activeCategory || (i.category && i.category.toLowerCase() === activeCategory.toLowerCase())
      return matchesQuery && matchesCategory
    })
  }, [items, query, activeCategory])

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
                e('img', { src: `https://picsum.photos/seed/${item.id}/800/600`, alt: item.title, className: 'fs-card-img' }),
                e('div', { className: 'fs-price' }, item.price ? `€ ${item.price}` : '-'),
                e('button', { className: 'fs-fav', title: 'Aggiungi ai preferiti', onClick: (ev: any) => { ev.preventDefault(); /* mock */ } },
                  e('svg', { width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
                    e('path', { d: 'M12 21s-7.5-4.35-9.5-6.35C-0.5 11.5 3.5 6 8.5 6c2.5 0 3.5 1.5 3.5 1.5S14 6 16.5 6C21.5 6 25.5 11.5 21.5 14.65 19.5 16.65 12 21 12 21z', fill: '#fff', opacity: '0.95' })
                  )
                )
              ),

              // Meta: title, location, seller
              e('div', { className: 'fs-card-body' },
                e('div', { className: 'fs-card-title' }, item.title),
                e('div', { className: 'fs-card-sub' }, item.description),
                e('div', { className: 'fs-card-meta' }, `Venduto da ${item.owner || 'utente'}`)
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

