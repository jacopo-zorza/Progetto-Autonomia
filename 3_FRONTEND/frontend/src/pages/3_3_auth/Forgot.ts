import React from 'react'
import '../../styles/pages/auth.css'

export default function Forgot(): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'fs-login-page' },
    React.createElement(
      'div',
      { className: 'fs-login-wrap' },

      React.createElement(
        'div',
        { className: 'fs-login-hero' },
        React.createElement('img', { src: '/logo.png', alt: 'FastSeller' }),
        React.createElement('div', { className: 'headline' }, 'Hai bisogno di assistenza?'),
        React.createElement('div', { className: 'sub' }, 'Siamo qui per aiutarti a recuperare l\'accesso al tuo account.')
      ),

      React.createElement(
        'div',
        { className: 'fs-login-card' },
        React.createElement('div', { className: 'fs-login-brand' },
          React.createElement('div', { className: 'fs-login-title' }, 'Password dimenticata')
        ),

        React.createElement('div', { style: { padding: '0.75rem 0' } },
          React.createElement('p', { style: { color: 'rgba(4,15,15,0.8)', marginBottom: '0.75rem' } },
            'Hai cliccato su "Password dimenticata". Se non riesci ad accedere, contattaci e ti aiuteremo a risolvere il problema.'
          ),
          React.createElement('p', { style: { color: 'rgba(4,15,15,0.75)', marginBottom: '0.5rem' } },
            'Contattaci tramite mail a'
          ),
          React.createElement('p', { style: { fontWeight: 700, color: 'var(--fs-deep)' } }, 'gabriel.lutteri@marconirovereto.com'),
          React.createElement('p', { style: { fontWeight: 700, color: 'var(--fs-deep)', marginTop: '0.25rem' } }, 'jacopo.zorza@marconirovereto.com'),

          React.createElement('div', { style: { marginTop: '1rem' } },
            React.createElement('a', { href: '/login', className: 'fs-forgot' }, 'Torna al login')
          )
        )
      )
    )
  )
}
