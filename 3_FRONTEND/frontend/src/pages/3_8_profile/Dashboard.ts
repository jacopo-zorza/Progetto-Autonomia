import React, { useEffect, useState } from 'react'
import '../../styles/pages/account.css'
import { getUser, logout, updateUserProfile } from '../../services/auth'
import { useNavigate, Link } from 'react-router-dom'
import { listItems, Item } from '../../services/items'
import ConfirmDialog from '../../components/ConfirmDialog'

type PersonalForm = {
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
}

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate()

  const [curUser, setCurUser] = useState<any>(getUser())
  const username = curUser?.username || curUser?.user || curUser?.email || null
  const [showConfirm, setShowConfirm] = useState(false)
  const [myItems, setMyItems] = useState<Item[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [showPersonalEdit, setShowPersonalEdit] = useState(false)
  const [personalForm, setPersonalForm] = useState<PersonalForm>(() => ({
    username: resolveUsernameValue(curUser),
    email: curUser?.email || '',
    first_name: curUser?.first_name || '',
    last_name: curUser?.last_name || '',
    phone: curUser?.phone || ''
  }))
  const [personalError, setPersonalError] = useState<string | null>(null)
  const [personalSaving, setPersonalSaving] = useState(false)

  function requestLogout(){ setShowConfirm(true) }
  function cancelLogout(){ setShowConfirm(false) }
  function confirmLogout(){
    setShowConfirm(false)
    logout()
    navigate('/')
  }
  // input file will be referenced by id to avoid ref warnings

  useEffect(() => {
    function onAuth(){ setCurUser(getUser()) }
    window.addEventListener('auth-changed', onAuth)
    return () => window.removeEventListener('auth-changed', onAuth)
  }, [])

  useEffect(() => {
    if (showPersonalEdit) return
    setPersonalForm({
      username: resolveUsernameValue(curUser),
      email: curUser?.email || '',
      first_name: curUser?.first_name || '',
      last_name: curUser?.last_name || '',
      phone: curUser?.phone || ''
    })
  }, [curUser, showPersonalEdit])

  useEffect(() => {
    let cancelled = false

    async function loadMyItems() {
      if (!curUser || !curUser.id) {
        setMyItems([])
        setLoadingItems(false)
        return
      }

      setLoadingItems(true)
      setItemsError(null)

      try {
        const data = await listItems({ sellerId: curUser.id })
        if (!cancelled) {
          setMyItems(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Impossibile recuperare i tuoi annunci'
          setItemsError(message)
        }
      } finally {
        if (!cancelled) setLoadingItems(false)
      }
    }

    loadMyItems()

    return () => {
      cancelled = true
    }
  }, [curUser?.id])

  function onEditAvatar(){
    const el = document.getElementById('avatar-file') as HTMLInputElement | null
    if(el) el.click()
  }

  function currentProfileImage(){
    return curUser?.profile_image || curUser?.image || null
  }

  function profileInitial(){
    if (curUser?.first_name) return curUser.first_name.charAt(0).toUpperCase()
    if (username) return username.charAt(0).toUpperCase()
    return 'U'
  }

  function resolveUsernameValue(userData: any): string {
    if (userData && typeof userData.username === 'string' && userData.username.trim().length > 0) {
      return userData.username
    }
    if (userData && typeof userData.user === 'string' && userData.user.trim().length > 0) {
      return userData.user
    }
    return ''
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = async function(ev){
      const dataUrl = ev.target?.result as string
      try {
        const updated = await updateUserProfile({ profile_image: dataUrl })
        if (updated) {
          setCurUser(updated)
        } else {
          setCurUser(getUser())
        }
      } catch (error) {
        console.error('Aggiornamento immagine profilo fallito', error)
        setCurUser(getUser())
        window.alert('Non è stato possibile aggiornare l\'immagine del profilo. Riprova più tardi.')
      }
    }
    reader.readAsDataURL(f)
  }

  function openPersonalEdit(){
    setPersonalError(null)
    setPersonalForm({
      username: resolveUsernameValue(curUser),
      email: curUser?.email || '',
      first_name: curUser?.first_name || '',
      last_name: curUser?.last_name || '',
      phone: curUser?.phone || ''
    })
    setShowPersonalEdit(true)
  }

  function closePersonalEdit(){
    if (personalSaving) return
    setShowPersonalEdit(false)
    setPersonalError(null)
  }

  function onPersonalField(field: keyof PersonalForm){
    return function handleChange(event: React.ChangeEvent<HTMLInputElement>){
      const value = event.target.value
      setPersonalForm(prev => ({ ...prev, [field]: value }))
    }
  }

  async function onPersonalSubmit(event: React.FormEvent<HTMLFormElement>){
    event.preventDefault()
    if (personalSaving) return

    const payload = {
      username: personalForm.username.trim(),
      email: personalForm.email.trim(),
      first_name: personalForm.first_name.trim(),
      last_name: personalForm.last_name.trim(),
      phone: personalForm.phone.trim()
    }

    if (!payload.username || !payload.email || !payload.first_name || !payload.last_name || !payload.phone) {
      setPersonalError('Compila tutti i campi per continuare.')
      return
    }

    if (payload.phone.length < 5) {
      setPersonalError('Inserisci un numero di telefono valido.')
      return
    }

    setPersonalSaving(true)
    setPersonalError(null)

    try {
      const updated = await updateUserProfile(payload)
      if (updated) {
        setCurUser(updated)
      } else {
        setCurUser(getUser())
      }
      setShowPersonalEdit(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Non è stato possibile aggiornare i dati personali.'
      setPersonalError(message)
    } finally {
      setPersonalSaving(false)
    }
  }

  const [activeTab, setActiveTab] = useState<'items'|'sales'>('items')

  const dashboardEl = React.createElement('div', { className: 'fs-container center-page' },
    React.createElement('div', { className: 'profile-wrap' },
      React.createElement('div', { className: 'account-hero profile-hero pa-card' },
        React.createElement('div', { className: 'profile-left' },
            React.createElement('div', { style: { position: 'relative', width: 120 } },
            React.createElement('div', { className: 'account-avatar', style: { width: 120, height: 120 } }, currentProfileImage() ? React.createElement('img', { src: currentProfileImage()!, alt: username || 'Avatar', style: { width: '100%', height: '100%', objectFit: 'cover' } }) : profileInitial()),
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
              React.createElement('button', { className: 'pa-btn ghost', onClick: requestLogout }, 'Logout')
            )
          )
        )),

      React.createElement('div', { className: 'pa-card profile-data-card' },
        React.createElement('div', { className: 'profile-data-header' },
          React.createElement('h3', { className: 'pa-heading' }, 'Dati personali'),
          React.createElement('button', {
            type: 'button',
            className: 'profile-edit-trigger',
            onClick: openPersonalEdit,
            title: 'Modifica dati personali',
            'aria-label': 'Modifica dati personali'
          }, React.createElement('span', { 'aria-hidden': 'true' }, '✎'))
        ),
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
            loadingItems ? React.createElement('div', { className: 'empty' }, 'Caricamento annunci...')
            : itemsError ? React.createElement('div', { className: 'empty error' }, itemsError)
            : myItems.length > 0 ? (
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

  const confirmEl = React.createElement(ConfirmDialog, {
    open: showConfirm,
    message: 'Sei sicuro di voler uscire?',
    onConfirm: confirmLogout,
    onCancel: cancelLogout
  })

  const personalEditModal = !showPersonalEdit ? null : React.createElement('div', {
    className: 'fs-modal-overlay profile-edit-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'profile-edit-title',
    'aria-describedby': 'profile-edit-subtitle',
    onClick: closePersonalEdit
  },
    React.createElement('div', {
      className: 'profile-edit-modal',
      onClick: function stop(event: React.MouseEvent<HTMLDivElement>){ event.stopPropagation() }
    },
      React.createElement('button', {
        type: 'button',
        className: 'profile-edit-close',
        onClick: closePersonalEdit,
        title: 'Chiudi editor profilo',
        'aria-label': 'Chiudi editor profilo',
        disabled: personalSaving
      }, 'X'),
      React.createElement('div', { className: 'profile-edit-header' },
        React.createElement('div', { className: 'profile-edit-icon' }, '✎'),
        React.createElement('div', { className: 'profile-edit-heading' },
          React.createElement('h3', { className: 'profile-edit-title', id: 'profile-edit-title' }, 'Modifica dati personali'),
          React.createElement('p', { className: 'profile-edit-subtitle', id: 'profile-edit-subtitle' }, 'Aggiorna le informazioni del tuo profilo per mantenerle sempre accurate.')
        )
      ),
      personalError ? React.createElement('div', { className: 'profile-edit-error' }, personalError) : null,
      React.createElement('form', { className: 'profile-edit-form', onSubmit: onPersonalSubmit },
        React.createElement('div', { className: 'profile-edit-grid' },
          React.createElement('label', { className: 'profile-edit-field' },
            React.createElement('span', { className: 'profile-edit-label' }, 'Username'),
            React.createElement('input', {
              type: 'text',
              className: 'profile-edit-input',
              value: personalForm.username,
              onChange: onPersonalField('username'),
              autoComplete: 'username',
              required: true,
              disabled: personalSaving
            })
          ),
          React.createElement('label', { className: 'profile-edit-field' },
            React.createElement('span', { className: 'profile-edit-label' }, 'Email'),
            React.createElement('input', {
              type: 'email',
              className: 'profile-edit-input',
              value: personalForm.email,
              onChange: onPersonalField('email'),
              autoComplete: 'email',
              required: true,
              disabled: personalSaving
            })
          ),
          React.createElement('label', { className: 'profile-edit-field' },
            React.createElement('span', { className: 'profile-edit-label' }, 'Nome'),
            React.createElement('input', {
              type: 'text',
              className: 'profile-edit-input',
              value: personalForm.first_name,
              onChange: onPersonalField('first_name'),
              autoComplete: 'given-name',
              required: true,
              disabled: personalSaving
            })
          ),
          React.createElement('label', { className: 'profile-edit-field' },
            React.createElement('span', { className: 'profile-edit-label' }, 'Cognome'),
            React.createElement('input', {
              type: 'text',
              className: 'profile-edit-input',
              value: personalForm.last_name,
              onChange: onPersonalField('last_name'),
              autoComplete: 'family-name',
              required: true,
              disabled: personalSaving
            })
          ),
          React.createElement('label', { className: 'profile-edit-field profile-edit-field--full' },
            React.createElement('span', { className: 'profile-edit-label' }, 'Telefono'),
            React.createElement('input', {
              type: 'tel',
              className: 'profile-edit-input',
              value: personalForm.phone,
              onChange: onPersonalField('phone'),
              autoComplete: 'tel',
              required: true,
              disabled: personalSaving
            })
          )
        ),
        React.createElement('div', { className: 'profile-edit-actions' },
          React.createElement('button', {
            type: 'button',
            className: 'profile-edit-btn cancel',
            onClick: closePersonalEdit,
            disabled: personalSaving
          }, 'Annulla'),
          React.createElement('button', {
            type: 'submit',
            className: 'profile-edit-btn save',
            disabled: personalSaving
          }, personalSaving ? 'Salvataggio...' : 'Salva modifiche')
        )
      )
    )
  )

  return React.createElement(React.Fragment, null, dashboardEl, confirmEl, personalEditModal)
}
