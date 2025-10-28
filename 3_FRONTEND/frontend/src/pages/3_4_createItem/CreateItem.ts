import React from 'react'
import { createItem } from '../../services/items'
import { getUser } from '../../services/auth'
import { useNavigate } from 'react-router-dom'

export default function CreateItem(): React.ReactElement {
  const navigate = useNavigate()
  const [title, setTitle] = React.useState('')
  const [desc, setDesc] = React.useState('')
  const [price, setPrice] = React.useState('')

  function onSubmit(e: React.FormEvent){
    e.preventDefault()
    const user = getUser()
    const item = createItem({ title, description: desc, price: Number(price) || undefined, owner: user?.user })
    navigate(`/items/${item.id}`)
  }

  return React.createElement(
    'div',
    { className: 'pa-card max-w-xl mx-auto' },
    React.createElement('h2', { className: 'text-xl pa-heading mb-2' }, 'Inserisci oggetto'),
    React.createElement(
      'form',
      { onSubmit },
      React.createElement('input', { className: 'block border p-2 mb-3 w-full', placeholder: 'Titolo', value: title, onInput: (e:any)=>setTitle(e.target.value) }),
      React.createElement('textarea', { className: 'block border p-2 mb-3 w-full', placeholder: 'Descrizione', value: desc, onInput: (e:any)=>setDesc(e.target.value) }),
      React.createElement('input', { className: 'block border p-2 mb-3 w-48', placeholder: 'Prezzo', value: price, onInput: (e:any)=>setPrice(e.target.value) }),
      React.createElement('div', { className: 'flex justify-end' }, React.createElement('button', { type: 'submit', className: 'pa-btn' }, 'Pubblica'))
    )
  )
}
