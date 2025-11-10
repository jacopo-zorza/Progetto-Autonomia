import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { isAuthenticated, getUser, logout } from '../../services/auth'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function Header(): React.ReactElement {
  const navigate = useNavigate()

  function goBack() { navigate(-1) }
  const location = useLocation()

  const [authState, setAuthState] = useState(isAuthenticated())
  const [, setUser] = useState(getUser())
  const [showConfirm, setShowConfirm] = useState(false)

  function requestLogout() { setShowConfirm(true) }
  function cancelLogout() { setShowConfirm(false) }
  function confirmLogout() {
    setShowConfirm(false)
    logout()
    navigate('/')
  }

  useEffect(() => {
    function onAuth(){ setAuthState(isAuthenticated()); setUser(getUser()) }
    window.addEventListener('auth-changed', onAuth)
    return () => window.removeEventListener('auth-changed', onAuth)
  }, [])

  const headerEl = React.createElement(
    'header',
    { className: 'fs-header' },
    React.createElement(
      'div',
      { className: 'fs-header-inner' },
      // left: optional back button + logo
      React.createElement(
        'div',
        { className: 'fs-left' },
  // Mostra il pulsante "indietro" solo se non siamo sulla homepage (root)
  location.pathname !== '/' ? React.createElement('button', { onClick: goBack, className: 'fs-back', title: 'Indietro' }, '‹') : null,
        React.createElement(Link, { to: '/', className: 'fs-logo-link' },
          React.createElement('img', { src: '/logo.png', alt: 'FastSeller', className: 'fs-logo-img', onError: (e:any) => { e.target.style.display='none' } }),
          React.createElement('span', { className: 'fs-logo-text' }, 'FastSeller')
        )
      ),

      // right: nav buttons (vary by auth)
      React.createElement(
        'nav',
        { className: 'fs-nav' },
        !authState ? (
          React.createElement(React.Fragment, null,
            React.createElement(Link, { to: '/register', className: 'fs-auth-btn' }, 'Registrati'),
            React.createElement(Link, { to: '/login', className: 'fs-auth-btn' }, 'Accedi'),
            React.createElement(Link, { to: '/login', className: 'fs-nav-sell' }, 'Vendi subito!')
          )
        ) : (
          React.createElement(React.Fragment, null,
            React.createElement(Link, { to: '/' , className: 'fs-nav-link' }, 'Home'),
            React.createElement(Link, { to: '/items', className: 'fs-nav-link' }, 'Oggetti'),
            React.createElement(Link, { to: '/dashboard', className: 'fs-nav-link' }, 'Account'),
            React.createElement('button', { onClick: requestLogout, className: 'fs-nav-cta' }, 'Esci')
          )
        )
      )
    )
  )

  const confirmEl = React.createElement(ConfirmDialog, {
    open: showConfirm,
    message: 'Sei sicuro di voler uscire?',
    onConfirm: confirmLogout,
    onCancel: cancelLogout
  })

  return React.createElement(React.Fragment, null, headerEl, confirmEl)
}
