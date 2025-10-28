import React from 'react'
import { getUser, logout } from '../../services/auth'
import { useNavigate } from 'react-router-dom'

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate()
  function doLogout(){ logout(); navigate('/') }
  const user = getUser()

  return React.createElement(
    'div',
    { className: 'pa-card' },
    React.createElement('h2', { className: 'text-xl pa-heading mb-2' }, `Dashboard`),
    React.createElement('p', { className: 'text-muted' }, `Benvenuto ${user?.user || 'ospite'}`),
    React.createElement('div', { className: 'mt-4' }, React.createElement('button', { className: 'pa-btn', onClick: doLogout }, 'Logout'))
  )
}
