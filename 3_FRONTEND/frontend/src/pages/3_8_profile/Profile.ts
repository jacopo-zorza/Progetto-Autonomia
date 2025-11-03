import React from 'react'
import '../../styles/pages/account.css'
import { getUser } from '../../services/auth'

export default function Profile(): React.ReactElement {
  const user = getUser()

  return React.createElement(
    'div',
    { className: 'pa-card max-w-md mx-auto' },
    React.createElement('h2', { className: 'text-xl pa-heading mb-2' }, 'Profilo utente'),
    React.createElement('p', null, `Username: ${user?.user || '-'}`)
  )
}
