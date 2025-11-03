import React from 'react'
import '../../styles/pages/auth.css'
import { useNavigate } from 'react-router-dom'
import { register } from '../../services/auth'

export default function Register(): React.ReactElement {
  const navigate = useNavigate()
  const [username, setUsername] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true)
    const payload = {
      username: username.trim(),
      email: email.trim(),
      password,
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      phone: phone.trim() || undefined
    }
    const res = await register(payload)
    setLoading(false)
    if(res.ok){
      navigate('/dashboard')
    }else{
      alert(res.message || 'Registrazione fallita')
    }
  }

  // Reuse the same visual layout as login: hero + card
  return React.createElement(
    'div',
    { className: 'fs-login-page' },
    React.createElement(
      'div',
      { className: 'fs-login-wrap' },
      React.createElement(
        'div',
        { className: 'fs-login-hero' },
        React.createElement('img', { src: '/logo.png', alt: 'FastSeller promo' }),
        React.createElement('div', { className: 'headline' }, 'Unisciti a FastSeller'),
        React.createElement('div', { className: 'sub' }, 'Crea il tuo account e inizia a vendere oggi stesso.')
      ),

      React.createElement(
        'div',
        { className: 'fs-login-card' },
        React.createElement(
          'div',
          { className: 'fs-login-brand' },
          React.createElement('div', { className: 'fs-login-title' }, 'Registrati')
        ),
        React.createElement('div', { className: 'fs-login-subtitle' }, 'Inserisci i tuoi dati per creare un account gratuito'),

        React.createElement(
          'form',
          { onSubmit },
          React.createElement('input', { className: 'fs-input', placeholder: 'Username', value: username, onInput: (e:any)=>setUsername(e.target.value) }),
          React.createElement('input', { className: 'fs-input', placeholder: 'Email', type: 'email', value: email, onInput: (e:any)=>setEmail(e.target.value) }),
          React.createElement('input', { type: 'password', className: 'fs-input', placeholder: 'Password', value: password, onInput: (e:any)=>setPassword(e.target.value) }),
          React.createElement('input', { className: 'fs-input', placeholder: 'Nome', value: firstName, onInput: (e:any)=>setFirstName(e.target.value) }),
          React.createElement('input', { className: 'fs-input', placeholder: 'Cognome', value: lastName, onInput: (e:any)=>setLastName(e.target.value) }),
          React.createElement('input', { className: 'fs-input', placeholder: 'Telefono', value: phone, onInput: (e:any)=>setPhone(e.target.value) }),

          React.createElement('button', { type: 'submit', className: 'fs-submit', disabled: loading }, loading ? 'Caricamento...' : 'Iscriviti')
        )
      )
    )
  )
}
