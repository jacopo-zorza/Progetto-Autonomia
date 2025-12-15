import React from 'react'
import '../../styles/pages/careers.css'

// Pagina carriere puramente statica per presentare il team e raccogliere candidature.

export default function Careers(): React.ReactElement {
  return React.createElement(
    'main',
    { className: 'careers-page' },
    React.createElement('section', { className: 'careers-hero' },
      React.createElement('div', { className: 'careers-hero-inner' },
        React.createElement('h1', { className: 'careers-title' }, 'Lavora con FastSeller'),
        React.createElement('p', { className: 'careers-sub' }, 'Siamo sempre alla ricerca di persone curiose, entusiaste e pronte a costruire il marketplace locale di domani.')
      )
    ),

    React.createElement('section', { className: 'careers-content' },
      React.createElement('div', { className: 'careers-grid' },
        React.createElement('div', { className: 'careers-card' },
          React.createElement('h2', { className: 'careers-card-title' }, 'Perché unirti a noi'),
          React.createElement('ul', { className: 'careers-benefits' },
            React.createElement('li', null, 'Team dinamico e in crescita'),
            React.createElement('li', null, 'Progetti concreti con impatto reale sugli utenti'),
            React.createElement('li', null, 'Flessibilità, autonomia e cultura della sperimentazione')
          )
        ),
        React.createElement('div', { className: 'careers-card' },
          React.createElement('h2', { className: 'careers-card-title' }, 'Invia la tua candidatura'),
          React.createElement('p', null, 'Compila il modulo qui sotto e allega il tuo CV in formato PDF. Ti contatteremo quanto prima per conoscerci meglio.'),
          React.createElement('form', { className: 'careers-form' },
            React.createElement('label', { className: 'careers-field' },
              React.createElement('span', { className: 'careers-label' }, 'Nome e cognome'),
              React.createElement('input', { type: 'text', className: 'careers-input', placeholder: 'Es. Maria Rossi', required: true })
            ),
            React.createElement('label', { className: 'careers-field' },
              React.createElement('span', { className: 'careers-label' }, 'Email'),
              React.createElement('input', { type: 'email', className: 'careers-input', placeholder: 'maria.rossi@email.com', required: true })
            ),
            React.createElement('label', { className: 'careers-field' },
              React.createElement('span', { className: 'careers-label' }, 'Posizione di interesse (opzionale)'),
              React.createElement('input', { type: 'text', className: 'careers-input', placeholder: 'Es. Frontend Developer' })
            ),
            React.createElement('label', { className: 'careers-field' },
              React.createElement('span', { className: 'careers-label' }, 'Messaggio (opzionale)'),
              React.createElement('textarea', { className: 'careers-textarea', rows: 4, placeholder: 'Raccontaci cosa ti entusiasma del progetto FastSeller.' })
            ),
            React.createElement('label', { className: 'careers-field' },
              React.createElement('span', { className: 'careers-label' }, 'Curriculum (PDF)'),
              React.createElement('input', { type: 'file', className: 'careers-input', accept: 'application/pdf', required: true })
            ),
            React.createElement('button', { type: 'submit', className: 'careers-submit' }, 'Invia candidatura')
          )
        ),
        React.createElement('div', { className: 'careers-card careers-contact' },
          React.createElement('h2', { className: 'careers-card-title' }, 'Preferisci scriverci direttamente?'),
          React.createElement('p', null, 'Puoi inviare il tuo CV anche via email a:'),
          React.createElement('a', { href: 'mailto:hr@fastseller.it', className: 'careers-mail' }, 'gabriel.lutteri@marconirovereto.it a jacopo.zorza@marconirovereto.it'),
          React.createElement('p', null, 'Ricordati di indicare nell\'oggetto la posizione che ti interessa.')
        )
      )
    )
  )
}
