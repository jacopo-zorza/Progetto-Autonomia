import React from 'react'
import '../../styles/pages/footer.css'
import { Link } from 'react-router-dom'

export default function Footer(): React.ReactElement {
  const e = React.createElement
  return e(
    'footer',
    { className: 'fs-footer' },
    e('div', { className: 'fs-footer-inner' },
      // top columns
      e('div', { className: 'fs-cols' },
        e('div', { className: 'fs-col' },
          e('h4', { className: 'fs-col-title' }, 'Scopri'),
          e('ul', null,
            e('li', null, e(Link, { to: '/items' }, 'Oggetti')),
            e('li', null, e(Link, { to: '/' }, 'Categorie')),
            e('li', null, e(Link, { to: '/about' }, 'Come funziona'))
          )
        ),
        e('div', { className: 'fs-col' },
          e('h4', { className: 'fs-col-title' }, 'Assistenza'),
          e('ul', null,
            e('li', null, e('a', { href: '#' }, 'Centro assistenza')),
            e('li', null, e('a', { href: '#' }, 'Regole della community')),
            e('li', null, e('a', { href: '#' }, 'Contatti'))
          )
        ),
        e('div', { className: 'fs-col' },
          e('h4', { className: 'fs-col-title' }, 'A proposito'),
          e('ul', null,
            e('li', null, e('a', { href: '#' }, 'Chi siamo')),
            e('li', null, e('a', { href: '#' }, 'Lavora con noi')),
            e('li', null, e('a', { href: '#' }, 'Privacy'))
          )
        ),
        e('div', { className: 'fs-col fs-download' },
          e('h4', { className: 'fs-col-title' }, 'Scarica l\'app'),
          e('div', { className: 'fs-store-links' },
            e('a', { href: '#', className: 'fs-store' }, 'App Store'),
            e('a', { href: '#', className: 'fs-store' }, 'Google Play')
          )
        )
      ),

      // bottom row
      e('div', { className: 'fs-bottom' },
        e('div', { className: 'fs-copyright' }, `© ${new Date().getFullYear()} FastSeller`),
        e('div', { className: 'fs-legal' },
          e('a', { href: '#' }, 'Termini'),
          ' · ',
          e('a', { href: '#' }, 'Privacy'),
          ' · ',
          e('a', { href: '#' }, 'Cookie')
        )
      )
    )
  )
}
