import React from 'react'
import '../../styles/pages/auth.css'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/auth'

export default function Login(): React.ReactElement {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [remember, setRemember] = React.useState(false)

  function onSubmit(e: React.FormEvent){
    e.preventDefault()
    // Se vuoi provare la parte grafica senza chiamata al backend, commenta la riga sottostante
    login(email, password).then(ok => {
      if(ok) navigate('/dashboard')
      else alert('Credenziali non valide')
    })
  }

  return React.createElement(
    'div',
    { className: 'fs-login-page' },
    React.createElement(
      'div',
      { className: 'fs-login-wrap' },

      // Hero / immagine
      React.createElement(
        'div',
        { className: 'fs-login-hero' },
        React.createElement('img', { src: '/logo.png', alt: 'FastSeller promo' }),
        React.createElement('div', { className: 'headline' }, 'Scopri migliaia di oggetti vicino a te'),
        React.createElement('div', { className: 'sub' }, 'Compra, vendi e scambia in modo semplice e sicuro. Unisciti alla nostra community.')
      ),

      // Card form
      React.createElement(
        'div',
        { className: 'fs-login-card' },
        React.createElement(
          'div',
          { className: 'fs-login-brand' },
          React.createElement('div', { className: 'fs-login-title' }, 'Accedi a FastSeller')
        ),
        React.createElement('div', { className: 'fs-login-subtitle' }, 'Inserisci le tue credenziali per continuare'),

        React.createElement(
          'form',
          { onSubmit },
          React.createElement('input', { className: 'fs-input', placeholder: 'Email', type: 'email', value: email, onInput: (e:any)=>setEmail(e.target.value) }),
          React.createElement('input', { type: 'password', className: 'fs-input', placeholder: 'Password', value: password, onInput: (e:any)=>setPassword(e.target.value) }),

          React.createElement(
            'div',
            { className: 'fs-actions' },
            React.createElement('label', { className: 'fs-remember' },
              React.createElement('input', { type: 'checkbox', checked: remember, onChange: (e:any)=>setRemember(e.target.checked) }),
              React.createElement('span', null, ' Ricordami')
            ),
            React.createElement('a', { className: 'fs-forgot', href: '/forgot' }, 'Password dimenticata?')
          ),

          React.createElement('button', { type: 'submit', className: 'fs-submit' }, 'Accedi'),

          React.createElement('div', { className: 'fs-or' }, 'oppure'),
          React.createElement(
            'div',
            { className: 'fs-socials' },
            React.createElement('button', { type: 'button', className: 'fs-social' }, 'Continua con Google'),
            React.createElement('button', { type: 'button', className: 'fs-social' }, 'Continua con Facebook')
          ),

          React.createElement('div', { style: { marginTop: '1rem', textAlign: 'center' } },
            React.createElement('span', { className: 'text-muted' }, 'Non hai un account? '),
            React.createElement('a', { href: '/register', style: { color: 'var(--fs-deep)', fontWeight:700, marginLeft:6 } }, 'Iscriviti')
          )
        )
      )
    )
  )
}
