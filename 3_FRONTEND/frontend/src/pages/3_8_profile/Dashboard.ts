import React, { useEffect, useState } from 'react'
import '../../styles/pages/account.css'
import { getUser, logout, updateUserProfile } from '../../services/auth'
import { useNavigate, Link } from 'react-router-dom'
import { listItems } from '../../services/items'

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate()
  function doLogout(){ logout(); navigate('/') }

  const [curUser, setCurUser] = useState<any>(getUser())
  const username = curUser?.username || curUser?.user || curUser?.email || null
  // input file will be referenced by id to avoid ref warnings

  // lista degli item dell'utente (matching su owner)
  const myItems = username ? listItems().filter(i => (i.owner || '').toString() === username.toString()) : []

  useEffect(() => {
    function onAuth(){ setCurUser(getUser()) }
    window.addEventListener('auth-changed', onAuth)
    return () => window.removeEventListener('auth-changed', onAuth)
  }, [])

  function onEditAvatar(){
    const el = document.getElementById('avatar-file') as HTMLInputElement | null
    if(el) el.click()
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = function(ev){
      const dataUrl = ev.target?.result as string
      // salva nel profilo
      updateUserProfile({ image: dataUrl })
      setCurUser(getUser())
    }
    reader.readAsDataURL(f)
  }

  const [activeTab, setActiveTab] = useState<'items'|'sales'>('items')

  return React.createElement('div', { className: 'fs-container center-page' },
    React.createElement('div', { className: 'profile-wrap' },
      React.createElement('div', { className: 'account-hero profile-hero pa-card' },
        React.createElement('div', { className: 'profile-left' },
          React.createElement('div', { style: { position: 'relative', width: 120 } },
            React.createElement('div', { className: 'account-avatar', style: { width: 120, height: 120 } }, curUser?.image ? React.createElement('img', { src: curUser.image, alt: username || 'Avatar', style: { width: '100%', height: '100%', objectFit: 'cover' } }) : (username ? username.charAt(0).toUpperCase() : 'U')),
            React.createElement('button', { className: 'avatar-edit', onClick: onEditAvatar, title: 'Modifica immagine profilo' }, '✎'),
            React.createElement('input', { id: 'avatar-file', type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: onFile })
          )
        ),
        React.createElement('div', { className: 'profile-right' },
          React.createElement('div', { className: 'profile-header-top' },
            React.createElement('div', { className: 'profile-identity' },
              React.createElement('div', { className: 'account-name' }, username || 'Utente'),
              React.createElement('div', { className: 'account-sub' }, curUser?.email || '')
            ),
            React.createElement('div', { className: 'account-actions' },
              React.createElement(Link, { to: '/create', className: 'pa-btn' }, 'Vendi subito'),
              React.createElement('button', { className: 'pa-btn ghost', onClick: doLogout }, 'Logout')
            )
          )
        )),

      React.createElement('div', { className: 'pa-card profile-data-card' },
        React.createElement('h3', { className: 'pa-heading' }, 'Dati personali'),
        React.createElement('table', { className: 'profile-table' },
          React.createElement('tbody', null,
            React.createElement('tr', null, React.createElement('td', null, 'Username'), React.createElement('td', null, curUser?.username || curUser?.user || '-')),
            React.createElement('tr', null, React.createElement('td', null, 'Email'), React.createElement('td', null, curUser?.email || '-')),
            React.createElement('tr', null, React.createElement('td', null, 'Nome'), React.createElement('td', null, curUser?.first_name || '-')),
            React.createElement('tr', null, React.createElement('td', null, 'Cognome'), React.createElement('td', null, curUser?.last_name || '-')),
            React.createElement('tr', null, React.createElement('td', null, 'Telefono'), React.createElement('td', null, curUser?.phone || '-'))
          )
        )
      ),

      React.createElement('div', { className: 'profile-panel pa-card' },
        React.createElement('div', { className: 'panel-tabs' },
          React.createElement('button', {
            type: 'button',
            className: `panel-tab ${activeTab === 'items' ? 'active' : ''}`,
            onClick: () => setActiveTab('items'),
            'aria-pressed': activeTab === 'items'
          }, 'I tuoi oggetti'),
          React.createElement('button', {
            type: 'button',
            className: `panel-tab ${activeTab === 'sales' ? 'active' : ''}`,
            onClick: () => setActiveTab('sales'),
            'aria-pressed': activeTab === 'sales'
          }, 'Vendite')
        ),
        React.createElement('div', { className: 'panel-content' },
          activeTab === 'items' ? (
            myItems.length > 0 ? (
              React.createElement('div', { className: 'my-items-grid' },
                myItems.map(it => React.createElement(Link, { to: `/items/${it.id}`, key: it.id, className: 'my-item-card' },
                  React.createElement('div', { className: 'my-item-media' }, React.createElement('img', { src: it.image ? it.image : `https://picsum.photos/seed/${it.id}/800/600`, alt: it.title, className: 'my-item-img' })),
                  React.createElement('div', { className: 'my-item-body' }, React.createElement('div', { className: 'my-item-title' }, it.title), React.createElement('div', { className: 'my-item-price' }, it.price ? `€ ${it.price}` : '-'))
                ))
              )
            ) : (
              React.createElement('div', { className: 'empty' }, 'Non hai ancora inserito annunci. ', React.createElement(Link, { to: '/create', className: 'pa-link' }, 'Inserisci il primo'))
            )
          ) : (
            React.createElement('div', { className: 'sales-columns' },
              React.createElement('div', { className: 'sales-col' }, React.createElement('h4', null, 'Vendite recenti'), React.createElement('p', null, 'Ancora nessuna vendita')),
              React.createElement('div', { className: 'sales-col' }, React.createElement('h4', null, 'Recensioni'), React.createElement('p', null, 'Ancora nessuna recensione'))
            )
          )
        )
      ),

      React.createElement('div', { className: 'pa-card profile-stats-card' },
        React.createElement('h3', { className: 'pa-heading' }, 'Vendite e attività'),
        React.createElement('div', { className: 'account-stats' },
          React.createElement('div', { className: 'stat' }, React.createElement('span', { className: 'num' }, 0), React.createElement('span', { className: 'label' }, 'Vendite')),
          React.createElement('div', { className: 'stat' }, React.createElement('span', { className: 'num' }, 0), React.createElement('span', { className: 'label' }, 'Messaggi')),
          React.createElement('div', { className: 'stat' }, React.createElement('span', { className: 'num' }, '€ 0'), React.createElement('span', { className: 'label' }, 'Saldo'))
        )
      )
    )
  )
}
