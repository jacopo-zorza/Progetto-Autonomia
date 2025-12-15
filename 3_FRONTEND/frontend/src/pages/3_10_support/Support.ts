import React from 'react'
import { Link } from 'react-router-dom'
import '../../styles/pages/support.css'

// Pagina supporto con riferimenti rapidi a contatti email e assistente virtuale.

export default function Support(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'support-container' },
    React.createElement('div', { className: 'support-card' },
      React.createElement('h1', { className: 'support-title' }, 'Hai bisogno di aiuto?'),
      React.createElement('p', { className: 'support-text' }, 'Il team FastSeller è a tua disposizione per qualsiasi domanda su pagamenti, spedizioni o problemi con il tuo account.'),
      React.createElement('div', { className: 'support-box' },
        React.createElement('h2', { className: 'support-subtitle' }, 'Contatta il supporto tramite email'),
        React.createElement('p', { className: 'support-text' }, 'Scrivici e ti risponderemo entro 24 ore lavorative. Ricordati di inserire nell\'oggetto del messaggio il motivo della richiesta.'),
        React.createElement('ul', { className: 'support-list' },
          React.createElement('li', null,
            React.createElement('a', { href: 'mailto:gabriel.lutteri@marconirovereto.com', className: 'support-link' }, 'gabriel.lutteri@marconirovereto.com')
          ),
          React.createElement('li', null,
            React.createElement('a', { href: 'mailto:jacopo.zorza@marconirovereto.com', className: 'support-link' }, 'jacopo.zorza@marconirovereto.com')
          )
        ),
        React.createElement('p', { className: 'support-note' }, 'Indica il tuo nome e una breve descrizione del problema così potremo aiutarti più velocemente.')
      ),
      React.createElement('div', { className: 'support-extra' },
        React.createElement('h3', null, 'Preferisci chattare con noi?'),
        React.createElement('p', null,
          'Apri l\'assistente virtuale per una risposta immediata oppure visita la sezione chat per parlare con il team.',
          React.createElement('br', null),
          React.createElement(Link, { to: '/support/assistant', className: 'support-cta' }, 'Avvia assistente virtuale')
        )
      )
    )
  )
}
