import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register(): React.ReactElement {
  const navigate = useNavigate()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')

  function onSubmit(e: React.FormEvent){
    e.preventDefault()
    alert('Registrazione completata (mock)')
    navigate('/login')
  }

  return React.createElement(
    'div',
    { className: 'pa-card max-w-md mx-auto' },
    React.createElement('h2', { className: 'text-xl pa-heading mb-4' }, 'Registrati'),
    React.createElement(
      'form',
      { onSubmit },
      React.createElement('input', { className: 'block border p-2 mb-3 w-full', placeholder: 'Username', value: username, onInput: (e:any)=>setUsername(e.target.value) }),
      React.createElement('input', { type: 'password', className: 'block border p-2 mb-3 w-full', placeholder: 'Password', value: password, onInput: (e:any)=>setPassword(e.target.value) }),
      React.createElement('div', { className: 'flex justify-end' }, React.createElement('button', { type: 'submit', className: 'pa-btn' }, 'Registrati'))
    )
  )
}
