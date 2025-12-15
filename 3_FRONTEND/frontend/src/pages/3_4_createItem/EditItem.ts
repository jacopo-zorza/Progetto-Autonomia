import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import '../../styles/pages/create.css'
import { getItem, updateItem, deleteItem, isItemOwnedByUser, Item } from '../../services/items'
import { getUser } from '../../services/auth'

// Modulo di modifica che riutilizza la preview live e controlla la proprietà dell'annuncio.

const categories = ['Abbigliamento', 'Elettronica', 'Casa', 'Sport', 'Bambini', 'Libri', 'Collezionismo', 'Motori', 'Altro']
const conditions = ['Nuovo', 'Come nuovo', 'Ottimo', 'Buono', 'Usato']

export default function EditItem(): React.ReactElement {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = React.useState<Item | undefined>(undefined)
  const [loadingItem, setLoadingItem] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const currentUser = React.useMemo(() => getUser(), [])
  const isOwner = React.useMemo(() => isItemOwnedByUser(item, currentUser), [item, currentUser])

  const [title, setTitle] = React.useState('')
  const [desc, setDesc] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [condition, setCondition] = React.useState('Nuovo')
  const [location, setLocation] = React.useState('')
  const [imageData, setImageData] = React.useState<string | null>(null)
  const [loadingImage, setLoadingImage] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    // Carica i dati dell'annuncio e popola il form all'apertura della pagina.
    if (!id) {
      setLoadError('Annuncio non trovato')
      setLoadingItem(false)
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
          setLoadError('Annuncio non trovato')
          return
        }

        setItem(data)
        setTitle(data.title ?? '')
        setDesc(data.description ?? '')
        setPrice(data.price !== undefined && data.price !== null ? data.price.toString() : '')
        setCategory(data.category ?? '')
        setCondition(data.condition ?? 'Nuovo')
        setLocation(data.location ?? '')
        setImageData(data.image ?? null)
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Impossibile caricare l\'annuncio'
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

  function clearError() {
    if (formError) setFormError(null)
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Riutilizza la stessa logica di upload del create con validazione dimensione.
    const file = event.target.files && event.target.files[0]
    if (!file) {
      setImageData(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Carica un\'immagine inferiore a 5MB')
      return
    }
    const reader = new FileReader()
    setLoadingImage(true)
    reader.onload = ev => {
      setImageData(ev.target?.result as string)
      setLoadingImage(false)
    }
    reader.onerror = () => {
      setFormError('Errore nel caricamento dell\'immagine')
      setLoadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  function validate(): string[] {
    // Verifica i principali campi obbligatori prima di inviare l'update.
    const issues: string[] = []
    if (!title.trim()) issues.push('Inserisci un titolo')
    if (!desc.trim()) issues.push('Aggiungi una descrizione')
    if (!category) issues.push('Seleziona una categoria')
    if (!condition) issues.push('Indica la condizione')
    if (price.trim()) {
      const normalized = Number.parseFloat(price.replace(',', '.'))
      if (!Number.isFinite(normalized)) issues.push('Inserisci un prezzo valido')
    }
    return issues
  }

  async function onSubmit(event: React.FormEvent) {
    // Salva le modifiche sul backend e torna alla pagina di dettaglio.
    event.preventDefault()
    if (!item || !id) return
    const issues = validate()
    if (issues.length) {
      setFormError(issues.join(' • '))
      return
    }

    const normalizedPrice = price.trim() ? Number.parseFloat(price.replace(',', '.')) : undefined
    const finalPrice = normalizedPrice !== undefined && Number.isFinite(normalizedPrice) ? Number(normalizedPrice.toFixed(2)) : undefined

    setSaving(true)
    try {
      const updated = await updateItem(id, {
        title: title.trim(),
        description: desc.trim(),
        price: finalPrice,
        category,
        condition,
        location: location.trim() || undefined,
        image: imageData || undefined
      })
      if (!updated) {
        setFormError('Impossibile aggiornare l\'annuncio. Riprova più tardi.')
        return
      }
      navigate(`/items/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossibile aggiornare l\'annuncio. Riprova più tardi.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    // Consente al proprietario di eliminare definitivamente l'annuncio.
    if (!item || !id) return
    const confirmDelete = window.confirm('Vuoi davvero eliminare questo annuncio? L\'operazione non può essere annullata.')
    if (!confirmDelete) return
    try {
      await deleteItem(id)
      navigate('/items')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Non è stato possibile eliminare l\'annuncio.'
      setFormError(message)
    }
  }

  if (loadingItem) {
    return React.createElement('div', { className: 'fs-container create-page' },
      React.createElement('div', { className: 'pa-card create-form-card' },
        React.createElement('h2', { className: 'pa-heading' }, 'Caricamento annuncio...')
      )
    )
  }

  if (!id || loadError || !item) {
    return React.createElement('div', { className: 'fs-container create-page' },
      React.createElement('div', { className: 'pa-card create-form-card' },
        React.createElement('h2', { className: 'pa-heading' }, loadError || 'Annuncio non trovato'),
        React.createElement('p', null, 'L\'oggetto che vuoi modificare non esiste più o è stato rimosso.'),
        React.createElement(Link, { to: '/items', className: 'pa-link' }, 'Torna agli oggetti')
      )
    )
  }

  if (!isOwner) {
    return React.createElement('div', { className: 'fs-container create-page' },
      React.createElement('div', { className: 'pa-card create-form-card' },
        React.createElement('h2', { className: 'pa-heading' }, 'Accesso non consentito'),
        React.createElement('p', null, 'Puoi modificare solo gli annunci creati dal tuo account.'),
        React.createElement(Link, { to: `/items/${id}`, className: 'pa-link' }, 'Vedi il dettaglio dell\'oggetto')
      )
    )
  }

  return React.createElement(
    'div',
    { className: 'fs-container create-page' },
    React.createElement('div', { className: 'create-layout' },
      React.createElement('section', { className: 'pa-card create-form-card' },
        React.createElement('h2', { className: 'pa-heading' }, 'Modifica annuncio'),
        React.createElement('p', { className: 'create-sub' }, 'Aggiorna le informazioni del tuo annuncio per mantenerlo sempre accurato.'),
        formError ? React.createElement('div', { className: 'create-error' }, formError) : null,
        React.createElement('form', { className: 'create-form-grid', onSubmit },
          React.createElement('label', { className: 'create-field' },
            React.createElement('span', { className: 'create-label' }, 'Titolo'),
            React.createElement('input', {
              type: 'text',
              className: 'create-input',
              value: title,
              onInput: (ev: any) => { setTitle(ev.target.value); clearError() }
            })
          ),
          React.createElement('label', { className: 'create-field full' },
            React.createElement('span', { className: 'create-label' }, 'Descrizione'),
            React.createElement('textarea', {
              className: 'create-textarea',
              rows: 4,
              value: desc,
              onInput: (ev: any) => { setDesc(ev.target.value); clearError() }
            })
          ),
          React.createElement('label', { className: 'create-field' },
            React.createElement('span', { className: 'create-label' }, 'Categoria'),
            React.createElement('select', {
              className: 'create-select',
              value: category,
              onChange: (ev: any) => { setCategory(ev.target.value); clearError() }
            },
              React.createElement('option', { value: '' }, 'Scegli una categoria'),
              categories.map(cat => React.createElement('option', { key: cat, value: cat }, cat))
            )
          ),
          React.createElement('label', { className: 'create-field' },
            React.createElement('span', { className: 'create-label' }, 'Condizione'),
            React.createElement('select', {
              className: 'create-select',
              value: condition,
              onChange: (ev: any) => { setCondition(ev.target.value); clearError() }
            },
              conditions.map(cond => React.createElement('option', { key: cond, value: cond }, cond))
            )
          ),
          React.createElement('label', { className: 'create-field' },
            React.createElement('span', { className: 'create-label' }, 'Località'),
            React.createElement('input', {
              type: 'text',
              className: 'create-input',
              value: location,
              onInput: (ev: any) => { setLocation(ev.target.value); clearError() }
            })
          ),
          React.createElement('label', { className: 'create-field' },
            React.createElement('span', { className: 'create-label' }, 'Prezzo'),
            React.createElement('div', { className: 'price-input-wrap' },
              React.createElement('span', { className: 'price-symbol' }, '€'),
              React.createElement('input', {
                type: 'text',
                inputMode: 'decimal',
                className: 'create-input',
                value: price,
                onInput: (ev: any) => { setPrice(ev.target.value); clearError() }
              })
            )
          ),
          React.createElement('div', { className: 'create-field full' },
            React.createElement('span', { className: 'create-label' }, 'Foto principale'),
            React.createElement('div', { className: `upload-drop ${loadingImage ? 'loading' : ''} ${imageData ? 'has-image' : ''}` },
              React.createElement('input', {
                ref: fileInputRef,
                type: 'file',
                accept: 'image/*',
                className: 'upload-input',
                onChange: handleFileChange
              }),
              imageData ? React.createElement('img', { src: imageData, alt: 'Anteprima immagine', className: 'upload-preview' }) : null,
              !imageData ? React.createElement('div', { className: 'upload-cta', role: 'button', tabIndex: 0, onClick: () => fileInputRef.current?.click(), onKeyDown: (ev: React.KeyboardEvent<HTMLDivElement>) => { if (ev.key === 'Enter' || ev.key === ' ') fileInputRef.current?.click() } },
                loadingImage ? 'Caricamento in corso...' : 'Carica o trascina una foto'
              ) : null,
              imageData ? React.createElement('button', {
                type: 'button',
                className: 'upload-reset',
                onClick: () => { setImageData(null); if (fileInputRef.current) fileInputRef.current.value = '' }
              }, 'Rimuovi foto') : null
            )
          ),
          React.createElement('div', { className: 'create-actions full' },
            React.createElement('button', { type: 'submit', className: 'pa-btn create-submit', disabled: saving }, saving ? 'Salvataggio...' : 'Salva modifiche'),
            React.createElement('button', { type: 'button', className: 'create-delete', onClick: handleDelete }, 'Elimina annuncio')
          )
        )
      ),
      React.createElement('aside', { className: 'pa-card create-preview' },
        React.createElement('h3', { className: 'pa-heading' }, 'Anteprima annuncio'),
        React.createElement('div', { className: 'preview-card' },
          React.createElement('div', { className: 'preview-media' },
            React.createElement('img', {
              src: imageData || 'https://picsum.photos/seed/edit-preview/600/480',
              alt: title || 'Anteprima oggetto',
              className: 'preview-img'
            }),
            React.createElement('span', { className: 'preview-price' }, price ? `€ ${price}` : '€ 0,00')
          ),
          React.createElement('div', { className: 'preview-body' },
            React.createElement('div', { className: 'preview-title' }, title || 'Titolo del tuo oggetto'),
            React.createElement('div', { className: 'preview-desc' }, desc || 'Le informazioni aggiornate appariranno qui per aiutare gli acquirenti.'),
            React.createElement('div', { className: 'preview-tags' },
              category ? React.createElement('span', { className: 'preview-tag primary' }, category) : null,
              condition ? React.createElement('span', { className: 'preview-tag' }, condition) : null,
              location ? React.createElement('span', { className: 'preview-tag' }, location) : null
            ),
            React.createElement('div', { className: 'preview-owner' }, `Venduto da ${item.ownerName}`)
          )
        )
      )
    )
  )
}
