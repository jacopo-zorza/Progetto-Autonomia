import React from 'react'
import { getUser } from '../../services/auth'
import { getMessages, sendMessage } from '../../services/messages'
import { useParams } from 'react-router-dom'

export default function Chat(): React.ReactElement {
  const { conv } = useParams()
  const [messages, setMessages] = React.useState(getMessages(conv || 'global'))
  const [text, setText] = React.useState('')
  const user = getUser()

  function doSend(e?: any){
    if(e) e.preventDefault()
    if(!text) return
    sendMessage(conv || 'global', user?.user || 'anon', text)
    setMessages(getMessages(conv || 'global'))
    setText('')
  }

  return React.createElement(
    'div',
    { className: 'pa-card max-w-2xl mx-auto' },
    React.createElement('h2', { className: 'text-xl pa-heading mb-2' }, 'Chat'),
    React.createElement('div', { className: 'mb-3 max-h-64 overflow-auto border p-3 rounded' }, messages.map((m: any) => React.createElement('div', { key: m.id, className: 'mb-2' }, React.createElement('strong', null, m.from), ': ', React.createElement('span', { className: 'ml-2 text-muted' }, m.text)))),
    React.createElement('form', { onSubmit: doSend, className: 'flex items-center' },
      React.createElement('input', { className: 'border p-2 mr-2 flex-1', placeholder: 'Scrivi...', value: text, onInput: (e:any)=>setText(e.target.value) }),
      React.createElement('button', { className: 'pa-btn', type: 'submit' }, 'Invia')
    )
  )
}
