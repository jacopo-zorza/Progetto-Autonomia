import React from 'react'
import { generateAssistantReply, ChatMessage } from '../../services/supportAssistant'
import '../../styles/pages/support-ai.css'

function createInitialMessages(): ChatMessage[] {
  return [{ role: 'assistant', content: generateAssistantReply([]) }]
}

export default function VirtualAssistant(): React.ReactElement {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => createInitialMessages())
  const [input, setInput] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    try {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch {
      endRef.current?.scrollIntoView()
    }
  }, [messages, isTyping])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const pending = [...messages, userMsg]
    setMessages(pending)
    setInput('')
    setIsTyping(true)

    window.setTimeout(() => {
      const reply = generateAssistantReply([...pending, { role: 'assistant', content: '' }])
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setIsTyping(false)
    }, 550)
  }

  function handleReset() {
    setIsResetting(true)
    setMessages(createInitialMessages())
    setInput('')
    window.setTimeout(() => setIsResetting(false), 200)
  }

  return React.createElement(
    'div',
    { className: 'va-container' },
    React.createElement('div', { className: 'va-card' },
      React.createElement('header', { className: 'va-header' },
        React.createElement('div', { className: 'va-avatar' }, 'AI'),
        React.createElement('div', null,
          React.createElement('h1', { className: 'va-title' }, 'Assistente virtuale FastSeller'),
          React.createElement('p', { className: 'va-subtitle' }, 'Fai una domanda e ricevi subito una risposta guidata.')
        ),
        React.createElement('div', { className: 'va-actions' },
          React.createElement('button', {
            type: 'button',
            className: 'va-reset',
            onClick: handleReset,
            disabled: isTyping || isResetting
          }, isResetting ? '…' : 'Nuova conversazione')
        )
      ),

      React.createElement('div', { className: 'va-messages' },
        messages.map((msg, index) => React.createElement('div', {
          key: `${msg.role}-${index}-${msg.content.slice(0, 10)}`,
          className: msg.role === 'user' ? 'va-bubble user' : 'va-bubble assistant'
        }, msg.content)),
        isTyping
          ? React.createElement('div', { className: 'va-bubble assistant typing' },
              React.createElement('span', { className: 'va-dot' }),
              React.createElement('span', { className: 'va-dot' }),
              React.createElement('span', { className: 'va-dot' })
            )
          : null,
        React.createElement('div', { ref: endRef })
      ),

      React.createElement('form', { className: 'va-form', onSubmit: handleSubmit },
        React.createElement('input', {
          className: 'va-input',
          placeholder: 'Scrivi qui la tua richiesta...',
          value: input,
          onInput: (event: any) => setInput(event.target.value),
          disabled: isTyping
        }),
        React.createElement('button', { type: 'submit', className: 'va-send', disabled: isTyping || !input.trim() }, 'Invia')
      ),

      React.createElement('p', { className: 'va-disclaimer' }, 'Le risposte sono generate automaticamente per fornire un aiuto rapido. Per assistenza ufficiale utilizza i recapiti email indicati nella pagina supporto.')
    )
  )
}
