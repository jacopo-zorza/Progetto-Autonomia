import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { isAuthenticated, getUser, logout } from '../../services/auth'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function Header(): React.ReactElement {
  const navigate = useNavigate()

  function goBack() { navigate(-1) }
  const location = useLocation()

  const [authState, setAuthState] = useState(isAuthenticated())
  const [user, setUser] = useState(getUser())
  const [showConfirm, setShowConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [avatarBroken, setAvatarBroken] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  function requestLogout() { setShowConfirm(true) }
  function cancelLogout() { setShowConfirm(false) }
  function confirmLogout() {
    setShowConfirm(false)
    logout()
    navigate('/')
  }

  function toggleMenu() { setShowMenu(prev => !prev) }
  function closeMenu() { setShowMenu(false) }

  function goToAccount() {
    closeMenu()
    navigate('/dashboard')
  }

  function logoutFromMenu() {
    closeMenu()
    requestLogout()
  }

  useEffect(() => {
    function onAuth(){
      const nextAuth = isAuthenticated()
      setAuthState(nextAuth)
      const nextUser = getUser()
      setUser(nextUser)
      if (!nextAuth) {
        setShowMenu(false)
        setAvatarBroken(false)
      }
    }
    window.addEventListener('auth-changed', onAuth)
    return () => window.removeEventListener('auth-changed', onAuth)
  }, [])

  useEffect(() => { setShowMenu(false) }, [location.pathname])

  useEffect(() => { setAvatarBroken(false) }, [user?.id, user?.profile_image])

  useEffect(() => {
    if (!showMenu) return
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return
      if (menuRef.current.contains(event.target as Node)) return
      setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const displayName = user ? ( [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '').trim() : ''
  const displayInitial = user ? (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase() : ''
  const haveAvatar = Boolean(user && user.profile_image && !avatarBroken)

  function handleAvatarError(event: React.SyntheticEvent<HTMLImageElement>) {
    event.currentTarget.style.display = 'none'
    setAvatarBroken(true)
  }

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
            React.createElement(Link, { to: '/map', className: 'fs-nav-link' }, 'Mappa'),
            React.createElement(
              'div',
              { className: 'fs-profile-area', ref: menuRef },
              React.createElement(
                'button',
                { type: 'button', className: `fs-profile-trigger${showMenu ? ' open' : ''}`, onClick: toggleMenu },
                haveAvatar
                  ? React.createElement('img', { src: user?.profile_image, alt: displayName || 'Profilo', className: 'fs-profile-avatar', onError: handleAvatarError })
                  : React.createElement('span', { className: 'fs-profile-avatar fs-profile-initial' }, displayInitial),
                React.createElement('span', { className: 'fs-profile-name' }, displayName),
                React.createElement('span', { className: 'fs-profile-caret' }, showMenu ? '▲' : '▼')
              ),
                showMenu ? React.createElement(
                'div',
                { className: 'fs-profile-dropdown' },
                React.createElement('button', { type: 'button', className: 'fs-profile-option', onClick: goToAccount }, 'Account'),
                React.createElement('button', { type: 'button', className: 'fs-profile-option logout', onClick: logoutFromMenu }, 'Esci')
              ) : null
            )
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
