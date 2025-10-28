import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAuthenticated, getUser, logout } from '../../services/auth'

export default function Header(): React.ReactElement {
  const navigate = useNavigate()

  function goBack(){ navigate(-1) }
  function doLogout(){ logout(); navigate('/') }

  const auth = isAuthenticated()
  const user = getUser()

  return React.createElement(
    'header',
    { className: 'pa-header border-b' },
    React.createElement(
      'div',
      { className: 'container mx-auto p-4 flex items-center justify-between' },
      React.createElement('div', { className: 'text-lg font-bold' }, 'Progetto Autonomia'),
      React.createElement(
        'nav',
        { className: 'space-x-4 text-sm' },
        React.createElement('button', { onClick: goBack, className: 'mr-3 pa-link' }, '‹ Indietro'),
        React.createElement(Link, { to: '/' }, 'Home'),
        ' ',
        React.createElement(Link, { to: '/items' }, 'Oggetti'),
        ' ',
        React.createElement(Link, { to: '/about' }, 'Info'),
        ' ',
        auth ? React.createElement(Link, { to: '/dashboard' }, 'Dashboard') : React.createElement(Link, { to: '/login' }, 'Login'),
        ' ',
        auth ? React.createElement('span', { className: 'ml-3 text-sm' }, `(${user?.user})`) : null,
        auth ? React.createElement(Link, { to: '/create' }, React.createElement('button', { className: 'ml-3 pa-btn' }, 'Inserisci')) : null,
        auth ? React.createElement(Link, { to: '/chat' }, React.createElement('button', { className: 'ml-3 pa-btn' }, 'Chat')) : null,
        auth ? React.createElement(Link, { to: '/profile' }, React.createElement('button', { className: 'ml-3 pa-btn' }, 'Profilo')) : null,
        auth ? React.createElement('button', { onClick: doLogout, className: 'ml-3 pa-btn' }, 'Logout') : null
      )
    )
  )
}
