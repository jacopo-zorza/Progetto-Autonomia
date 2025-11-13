import React from 'react'
import '../../styles/pages/payment.css'
import { useParams, Link } from 'react-router-dom'
import { getItem, Item } from '../../services/items'
import { createOrder, OrderRecord } from '../../services/payments'
import { getUser, getWalletBalance, adjustWalletBalance } from '../../services/auth'

type FormState = {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  zip: string
  note: string
  paymentMethod: 'card' | 'paypal' | 'bank' | 'wallet'
  cardNumber: string
  cardExpiry: string
  cardCvv: string
}

function createInitialFormState(prefill?: Partial<FormState>): FormState {
  return {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    note: '',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    ...prefill
  }
}

export default function Checkout(): React.ReactElement {
  const { id } = useParams()
  const [item, setItem] = React.useState<Item | undefined>(undefined)
  const [loadingItem, setLoadingItem] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  function buildInitialForm(): FormState {
    const user = getUser()
    const prefill: Partial<FormState> = {}
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
      prefill.fullName = fullName || user.username || ''
      prefill.email = user.email || ''
      prefill.phone = user.phone || ''
    }
    return createInitialFormState(prefill)
  }

  const [form, setForm] = React.useState<FormState>(() => buildInitialForm())
  const [errors, setErrors] = React.useState<string[]>([])
  const [order, setOrder] = React.useState<OrderRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [walletBalance, setWalletBalance] = React.useState(0)

  React.useEffect(() => {
    if (!id) {
      setLoadError('Oggetto non disponibile')
      setLoadingItem(false)
      setItem(undefined)
      return
    }

    let cancelled = false

    async function fetchItem() {
      setLoadingItem(true)
      setLoadError(null)
      try {
        const data = await getItem(id)
        if (cancelled) return
        if (!data) {
          setItem(undefined)
          setLoadError('Oggetto non disponibile')
          return
        }
        setItem(data)
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Impossibile caricare l\'oggetto selezionato'
          setLoadError(message)
        }
      } finally {
        if (!cancelled) setLoadingItem(false)
      }
    }

    fetchItem()

    return () => {
      cancelled = true
    }
  }, [id])

  React.useEffect(() => {
    setForm(buildInitialForm())
    setWalletBalance(getWalletBalance())
    setErrors([])
    setOrder(null)
    setIsSubmitting(false)
  }, [id])

  React.useEffect(() => {
    setWalletBalance(getWalletBalance())
    function handleAuthChange() {
      setWalletBalance(getWalletBalance())
    }
    try {
      window.addEventListener('auth-changed', handleAuthChange)
      return () => window.removeEventListener('auth-changed', handleAuthChange)
    } catch {
      return () => {}
    }
  }, [])

  if (loadingItem) {
    return React.createElement(
      'div',
      { className: 'checkout-container' },
      React.createElement('h2', { className: 'checkout-title' }, 'Caricamento oggetto...')
    )
  }

  if (!item || loadError) {
    return React.createElement(
      'div',
      { className: 'checkout-container' },
      React.createElement('h2', { className: 'checkout-title' }, loadError || 'Oggetto non disponibile'),
      React.createElement('p', { className: 'checkout-text' }, 'L\'oggetto selezionato non è più presente nel catalogo.'),
      React.createElement(Link, { to: '/items', className: 'pa-link' }, 'Torna agli oggetti')
    )
  }

  const hasPrice = typeof item.price === 'number' && !Number.isNaN(item.price)
  const basePrice = hasPrice ? Number(item.price) : 0
  const shippingCost = 4.9
  const serviceFee = Number((hasPrice ? Math.max(1.2, basePrice * 0.025) : 0).toFixed(2))
  const total = Number((basePrice + shippingCost + serviceFee).toFixed(2))
  const walletInsufficient = form.paymentMethod === 'wallet' && hasPrice && total > walletBalance
  const walletRemaining = hasPrice ? Number((walletBalance - total).toFixed(2)) : walletBalance
  const walletHint = walletBalance > 0
    ? walletInsufficient
      ? `Saldo insufficiente (richiesti € ${total.toFixed(2)})`
      : `Disponibile: € ${walletBalance.toFixed(2)}`
    : 'Saldo non disponibile'
  const paymentOptions: Array<{ value: FormState['paymentMethod']; label: string; hint?: string }> = [
    { value: 'card', label: 'Carta di credito' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank', label: 'Bonifico' },
    { value: 'wallet', label: 'Saldo FastSeller', hint: walletHint }
  ]

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function validate(): string[] {
    const issues: string[] = []
    if (!form.fullName.trim()) issues.push('Inserisci nome e cognome.')
    if (!form.email.trim()) issues.push('Inserisci un\'email valida.')
    if (!form.address.trim() || !form.city.trim() || !form.zip.trim()) issues.push('Completa indirizzo, città e CAP.')
    if (form.paymentMethod === 'card') {
      if (!form.cardNumber.trim()) issues.push('Numero di carta obbligatorio.')
      if (!form.cardExpiry.trim()) issues.push('Inserisci la data di scadenza della carta.')
      if (!form.cardCvv.trim()) issues.push('Inserisci il CVV della carta.')
    }
    if (walletInsufficient) {
      issues.push('Saldo insufficiente per completare il pagamento con il saldo FastSeller.')
    }
    if (!hasPrice) issues.push('Questo oggetto non ha un prezzo definito: contatta il venditore prima di completare l\'acquisto.')
    return issues
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!item) {
      setErrors(['Oggetto non disponibile.'])
      return
    }
    const issues = validate()
    if (issues.length) {
      setErrors(issues)
      return
    }

    setErrors([])
    setIsSubmitting(true)
    setOrder(null)
    const previousWallet = walletBalance
    let walletDebited = false
    let nextWalletBalance = walletBalance

    try {
      if (form.paymentMethod === 'wallet') {
        const adjusted = adjustWalletBalance(-total)
        if (adjusted === null) {
          setErrors(['Saldo insufficiente o non disponibile.'])
          return
        }
        walletDebited = true
        nextWalletBalance = adjusted
      }

      const result = createOrder({
        itemId: item.id,
        amount: basePrice,
        shipping: shippingCost,
        serviceFee,
        paymentMethod: form.paymentMethod,
        buyer: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined
        },
        address: {
          line1: form.address,
          city: form.city,
          zip: form.zip
        },
        note: form.note || undefined
      })
      setOrder(result)
      setForm(buildInitialForm())
      setWalletBalance(nextWalletBalance)
    } catch (error: any) {
      if (walletDebited) {
        adjustWalletBalance(total)
        setWalletBalance(previousWallet)
      }
      const message = error?.message || 'Errore durante la conferma del pagamento. Riprova tra qualche istante.'
      setErrors([message])
    } finally {
      setIsSubmitting(false)
    }
  }

  return React.createElement(
    'div',
    { className: 'checkout-container' },
    React.createElement(
      'div',
      { className: 'checkout-breadcrumb' },
      React.createElement(Link, { to: '/items', className: 'pa-link' }, '← Torna agli oggetti')
    ),
    React.createElement('h1', { className: 'checkout-title' }, 'Completa il pagamento'),
    React.createElement('p', { className: 'checkout-text' }, 'Inserisci i dati di consegna e scegli il metodo di pagamento per confermare l\'acquisto.'),

    order
      ? React.createElement(
          'div',
          { className: 'checkout-success' },
          React.createElement('strong', null, 'Ordine confermato! '),
          `Numero ordine ${order.id}. Ti invieremo un riepilogo all'indirizzo ${order.buyer.email}.`,
          order.paymentMethod === 'wallet'
            ? React.createElement('span', { className: 'checkout-wallet-recap' }, `Saldo residuo: € ${walletBalance.toFixed(2)}`)
            : null
        )
      : null,

    errors.length
      ? React.createElement(
          'div',
          { className: 'checkout-errors' },
          errors.map((err, idx) => React.createElement('div', { key: `${err}-${idx}` }, err))
        )
      : null,

    React.createElement(
      'div',
      { className: 'checkout-grid' },

      React.createElement(
        'form',
        { className: 'checkout-card checkout-form', onSubmit: handleSubmit },
        React.createElement('h2', { className: 'checkout-section-title' }, 'Dati di consegna'),
        React.createElement(
          'div',
          { className: 'checkout-fields' },
          React.createElement('label', { className: 'checkout-field' },
            React.createElement('span', { className: 'checkout-label' }, 'Nome e cognome'),
            React.createElement('input', {
              className: 'checkout-input',
              placeholder: 'Mario Rossi',
              value: form.fullName,
              onInput: (event: any) => update('fullName', event.target.value)
            })
          ),
          React.createElement('label', { className: 'checkout-field' },
            React.createElement('span', { className: 'checkout-label' }, 'Email'),
            React.createElement('input', {
              className: 'checkout-input',
              type: 'email',
              placeholder: 'mario.rossi@email.com',
              value: form.email,
              onInput: (event: any) => update('email', event.target.value)
            })
          ),
          React.createElement('label', { className: 'checkout-field' },
            React.createElement('span', { className: 'checkout-label' }, 'Telefono (opzionale)'),
            React.createElement('input', {
              className: 'checkout-input',
              type: 'tel',
              placeholder: '+39 333 1234567',
              value: form.phone,
              onInput: (event: any) => update('phone', event.target.value)
            })
          ),
          React.createElement('label', { className: 'checkout-field' },
            React.createElement('span', { className: 'checkout-label' }, 'Indirizzo'),
            React.createElement('input', {
              className: 'checkout-input',
              placeholder: 'Via Dante 12',
              value: form.address,
              onInput: (event: any) => update('address', event.target.value)
            })
          ),
          React.createElement('div', { className: 'checkout-field-row' },
            React.createElement('label', { className: 'checkout-field' },
              React.createElement('span', { className: 'checkout-label' }, 'Città'),
              React.createElement('input', {
                className: 'checkout-input',
                placeholder: 'Milano',
                value: form.city,
                onInput: (event: any) => update('city', event.target.value)
              })
            ),
            React.createElement('label', { className: 'checkout-field small' },
              React.createElement('span', { className: 'checkout-label' }, 'CAP'),
              React.createElement('input', {
                className: 'checkout-input',
                placeholder: '20121',
                value: form.zip,
                onInput: (event: any) => update('zip', event.target.value)
              })
            )
          ),
          React.createElement('label', { className: 'checkout-field' },
            React.createElement('span', { className: 'checkout-label' }, 'Note per il venditore (opzionale)'),
            React.createElement('textarea', {
              className: 'checkout-textarea',
              rows: 3,
              placeholder: 'Eventuali richieste particolari sulla consegna',
              value: form.note,
              onInput: (event: any) => update('note', event.target.value)
            })
          )
        ),

        React.createElement('h2', { className: 'checkout-section-title' }, 'Metodo di pagamento'),
        React.createElement(
          'div',
          { className: 'checkout-radio-group' },
          paymentOptions.map(option =>
            React.createElement(
              'label',
              {
                key: option.value,
                className: `checkout-radio ${form.paymentMethod === option.value ? 'active' : ''} ${option.value === 'wallet' && walletInsufficient ? 'warning' : ''}`
              },
              React.createElement('input', {
                type: 'radio',
                name: 'paymentMethod',
                value: option.value,
                checked: form.paymentMethod === option.value,
                onChange: (event: any) => update('paymentMethod', event.target.value as FormState['paymentMethod'])
              }),
              React.createElement(
                'div',
                { className: 'checkout-radio-text' },
                React.createElement('span', { className: 'checkout-radio-label' }, option.label),
                option.hint ? React.createElement('span', { className: 'checkout-radio-hint' }, option.hint) : null
              )
            )
          )
        ),

        form.paymentMethod === 'wallet'
          ? React.createElement(
              'div',
              { className: walletInsufficient ? 'checkout-wallet-info warning' : 'checkout-wallet-info' },
              React.createElement('div', { className: 'checkout-wallet-balance' }, `Saldo disponibile: € ${walletBalance.toFixed(2)}`),
              hasPrice
                ? React.createElement('div', { className: 'checkout-wallet-amount' }, `Importo da pagare: € ${total.toFixed(2)}`)
                : null,
              walletInsufficient
                ? React.createElement('div', { className: 'checkout-wallet-warning' }, 'Saldo insufficiente. Scegli un altro metodo o attendi nuovi accrediti.')
                : hasPrice
                  ? React.createElement('div', { className: 'checkout-wallet-ok' }, `Saldo residuo stimato: € ${Math.max(0, walletRemaining).toFixed(2)}`)
                  : null
            )
          : null,

        form.paymentMethod === 'card'
          ? React.createElement(
              'div',
              { className: 'checkout-card-fields' },
              React.createElement('label', { className: 'checkout-field' },
                React.createElement('span', { className: 'checkout-label' }, 'Numero carta'),
                React.createElement('input', {
                  className: 'checkout-input',
                  placeholder: '0000 0000 0000 0000',
                  value: form.cardNumber,
                  onInput: (event: any) => update('cardNumber', event.target.value)
                })
              ),
              React.createElement('div', { className: 'checkout-field-row' },
                React.createElement('label', { className: 'checkout-field' },
                  React.createElement('span', { className: 'checkout-label' }, 'Scadenza'),
                  React.createElement('input', {
                    className: 'checkout-input',
                    placeholder: 'MM/AA',
                    value: form.cardExpiry,
                    onInput: (event: any) => update('cardExpiry', event.target.value)
                  })
                ),
                React.createElement('label', { className: 'checkout-field small' },
                  React.createElement('span', { className: 'checkout-label' }, 'CVV'),
                  React.createElement('input', {
                    className: 'checkout-input',
                    placeholder: '123',
                    value: form.cardCvv,
                    onInput: (event: any) => update('cardCvv', event.target.value)
                  })
                )
              )
            )
          : null,

        React.createElement('button', {
          type: 'submit',
          className: 'checkout-submit',
          disabled: isSubmitting || !hasPrice || walletInsufficient
        }, isSubmitting ? 'Elaborazione…' : 'Conferma e paga')
      ),

      React.createElement(
        'aside',
        { className: 'checkout-summary' },
        React.createElement(
          'div',
          { className: 'checkout-card' },
          React.createElement('div', { className: 'summary-item' },
            React.createElement('img', {
              src: item.image ? item.image : `https://picsum.photos/seed/${item.id}/300/220`,
              alt: item.title,
              className: 'summary-img'
            }),
            React.createElement('div', { className: 'summary-item-info' },
              React.createElement('span', { className: 'summary-category' }, item.category || 'Oggetto'),
              React.createElement('h3', { className: 'summary-title' }, item.title),
              React.createElement('p', { className: 'summary-owner' }, `Venduto da ${item.ownerName || 'Utente'}`)
            )
          ),
          React.createElement('div', { className: 'summary-line' }),
          React.createElement('div', { className: 'summary-row' },
            React.createElement('span', null, 'Prezzo oggetto'),
            React.createElement('span', { className: 'summary-value' },
              hasPrice ? `€ ${basePrice.toFixed(2)}` : 'Da concordare'
            )
          ),
          React.createElement('div', { className: 'summary-row' },
            React.createElement('span', null, 'Spedizione stimata'),
            React.createElement('span', { className: 'summary-value' }, `€ ${shippingCost.toFixed(2)}`)
          ),
          React.createElement('div', { className: 'summary-row' },
            React.createElement('span', null, 'Protezione acquirente'),
            React.createElement('span', { className: 'summary-value' }, hasPrice ? `€ ${serviceFee.toFixed(2)}` : '—')
          ),
          React.createElement('div', { className: 'summary-total' },
            React.createElement('span', null, 'Totale'),
            React.createElement('span', { className: 'summary-value' }, hasPrice ? `€ ${total.toFixed(2)}` : 'In attesa prezzo')
          ),
          hasPrice && form.paymentMethod === 'wallet'
            ? React.createElement('div', { className: `summary-wallet ${walletInsufficient ? 'warning' : ''}` },
                React.createElement('span', null, 'Saldo dopo l\'acquisto'),
                React.createElement('span', { className: 'summary-value' },
                  walletInsufficient ? 'Saldo insufficiente' : `€ ${Math.max(0, walletRemaining).toFixed(2)}`
                )
              )
            : null,
          React.createElement('p', { className: 'summary-note' }, 'Il pagamento verrà trattenuto da FastSeller fino alla conferma di consegna.'),
          React.createElement(Link, { to: `/items/${item.id}`, className: 'summary-link' }, 'Vedi dettagli oggetto')
        ),

        React.createElement(
          'div',
          { className: 'checkout-help' },
          React.createElement('strong', null, 'Serve assistenza?'),
          React.createElement('p', null, 'Il nostro team è disponibile 7 giorni su 7 per aiutarti con il pagamento o la consegna.'),
          React.createElement(Link, { to: '/support', className: 'pa-link' }, 'Contatta il supporto')
        )
      )
    )
  )
}
