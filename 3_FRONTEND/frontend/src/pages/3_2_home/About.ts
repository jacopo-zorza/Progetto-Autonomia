import React from 'react'
import '../../styles/pages/about.css'

// Pagina istituzionale che racconta missione e funzionalità principali della demo.
import { Link } from 'react-router-dom'

export default function About(): React.ReactElement {
  const e = React.createElement

  return e('main', { className: 'about-page' },
    e('section', { className: 'about-hero' },
      e('div', { className: 'about-hero-inner' },
        e('h1', { className: 'about-title' }, 'Chi siamo'),
        e('p', { className: 'about-sub' }, 'prototipo di un marketplace locale per comprare e vendere oggetti. Questo sito è una demo frontend con storage locale per gli annunci.')
      )
    ),

    e('section', { className: 'about-content fs-container' },
      e('div', { className: 'about-grid' },
        e('div', { className: 'about-card' },
          e('h2', { className: 'about-card-title' }, 'La nostra missione'),
          e('p', null, 'Rendere semplice lo scambio di oggetti nella tua comunità: usabilità, privacy e performance sono al centro del progetto.')
        ),

        e('div', { className: 'about-card' },
          e('h2', { className: 'about-card-title' }, 'Caratteristiche'),
          e('ul', { className: 'about-list' },
            e('li', null, 'Elenco oggetti con immagini e dettagli'),
            e('li', null, 'Scheda dettaglio per ogni annuncio'),
            e('li', null, 'Autenticazione mock e localStorage per i dati')
          )
        ),

        e('div', { className: 'about-card' },
          e('h2', { className: 'about-card-title' }, 'Team & contatti'),
          e('p', null, 'Sviluppato da Gabriel Lutteri e Jacopo Zorza. Per richieste prova a contattare tramite email.')
        )
      ),

      e('div', { className: 'about-cta' },
        e(Link, { to: '/items', className: 'about-cta-btn' }, 'Scopri gli oggetti'),
        e(Link, { to: '/create', className: 'about-cta-link' }, 'Inserisci annuncio')
      )
    )
  )
}
