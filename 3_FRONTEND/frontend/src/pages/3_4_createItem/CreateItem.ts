import React from 'react'
import { createItem } from '../../services/items'
import { getUser } from '../../services/auth'
import { useNavigate } from 'react-router-dom'
import '../../styles/pages/create.css'

const categories = ['Abbigliamento', 'Elettronica', 'Casa', 'Sport', 'Bambini', 'Libri', 'Collezionismo', 'Motori', 'Altro']
const conditions = ['Nuovo', 'Come nuovo', 'Ottimo', 'Buono', 'Usato']

export default function CreateItem(): React.ReactElement {
  const navigate = useNavigate()
  const [title, setTitle] = React.useState('')
  const [desc, setDesc] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [condition, setCondition] = React.useState('Nuovo')
  const [location, setLocation] = React.useState('')
  const [imageData, setImageData] = React.useState<string | null>(null)
  const [loadingImage, setLoadingImage] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const currentUser = React.useMemo(() => getUser(), [])
  const ownerUsername = React.useMemo(() => {
    if (!currentUser) return ''
    return currentUser.username || currentUser.email || currentUser.user || ''
  }, [currentUser])

  const ownerDisplayName = React.useMemo(() => {
    if (!currentUser) return ''
    const fullName = [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ').trim()
    if (fullName) return fullName
    return currentUser.username || currentUser.email || ''
  }, [currentUser])

  function clearError() {
    if (error) setError(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) {
      setImageData(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Carica un\'immagine inferiore a 5MB')
      return
    }
    const reader = new FileReader()
    setLoadingImage(true)
    reader.onload = ev => {
      setImageData(ev.target?.result as string)
      setLoadingImage(false)
    }
    reader.onerror = () => {
      setError('Errore nel caricamento dell\'immagine')
      setLoadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDesc = desc.trim()
    const trimmedLocation = location.trim()
    const newErrors: string[] = []

    if (!trimmedTitle) newErrors.push('Inserisci un titolo')
    if (!trimmedDesc) newErrors.push('Aggiungi una descrizione')
    if (!category) newErrors.push('Seleziona una categoria')
    if (!condition) newErrors.push('Indica la condizione')

  const normalizedPrice = price.trim() ? Number.parseFloat(price.replace(',', '.')) : undefined
  const finalPrice = normalizedPrice !== undefined && Number.isFinite(normalizedPrice) ? Number(normalizedPrice.toFixed(2)) : undefined

    if (normalizedPrice !== undefined && !Number.isFinite(normalizedPrice)) newErrors.push('Inserisci un prezzo valido')

    if (newErrors.length > 0) {
      setError(newErrors.join(' • '))
      return
    }

    const created = createItem({
      title: trimmedTitle,
      description: trimmedDesc,
      price: finalPrice,
      category,
      condition,
      location: trimmedLocation || undefined,
      image: imageData || undefined,
      owner: ownerUsername || undefined,
      ownerName: ownerDisplayName || ownerUsername || 'Tu'
    })

    navigate(`/items/${created.id}`)
  }

  return React.createElement(
    'div',
    { className: 'fs-container create-page' },
    React.createElement('div', { className: 'create-layout' },
      React.createElement('section', { className: 'pa-card create-form-card' },
        React.createElement('h2', { className: 'pa-heading' }, 'Inserisci un nuovo oggetto'),
        React.createElement('p', { className: 'create-sub' }, 'Completa i campi per pubblicare il tuo annuncio e mostrare l\'oggetto agli altri utenti.'),
        error ? React.createElement('div', { className: 'create-error' }, error) : null,
        React.createElement('form', { className: 'create-form-grid', onSubmit },
          React.createElement('label', { className: 'create-field' },
            React.createElement('span', { className: 'create-label' }, 'Titolo'),
            React.createElement('input', {
              type: 'text',
              className: 'create-input',
              placeholder: 'Es. Giacca invernale taglia M',
              value: title,
              onInput: (ev: any) => { setTitle(ev.target.value); clearError() }
            })
          ),
          React.createElement('label', { className: 'create-field full' },
            React.createElement('span', { className: 'create-label' }, 'Descrizione'),
            React.createElement('textarea', {
              className: 'create-textarea',
              placeholder: 'Descrivi lo stato dell\'oggetto, dettagli utili e punti di forza',
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
              placeholder: 'Es. Milano, Lombardia',
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
                placeholder: '0.00',
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
            React.createElement('button', { type: 'submit', className: 'pa-btn create-submit' }, 'Pubblica annuncio')
          )
        )
      ),
      React.createElement('aside', { className: 'pa-card create-preview' },
        React.createElement('h3', { className: 'pa-heading' }, 'Anteprima annuncio'),
        React.createElement('div', { className: 'preview-card' },
          React.createElement('div', { className: 'preview-media' },
            React.createElement('img', {
              src: imageData || 'https://picsum.photos/seed/create-preview/600/480',
              alt: title || 'Anteprima oggetto',
              className: 'preview-img'
            }),
            React.createElement('span', { className: 'preview-price' }, price ? `€ ${price}` : '€ 0,00')
          ),
          React.createElement('div', { className: 'preview-body' },
            React.createElement('div', { className: 'preview-title' }, title || 'Titolo del tuo oggetto'),
            React.createElement('div', { className: 'preview-desc' }, desc || 'Qui comparirà la descrizione che inserisci per aiutare gli acquirenti a capire le condizioni e i dettagli.'),
            React.createElement('div', { className: 'preview-tags' },
              category ? React.createElement('span', { className: 'preview-tag primary' }, category) : null,
              condition ? React.createElement('span', { className: 'preview-tag' }, condition) : null,
              location ? React.createElement('span', { className: 'preview-tag' }, location) : null
            ),
            React.createElement('div', { className: 'preview-owner' }, `Venduto da ${ownerDisplayName || ownerUsername || 'Tu'}`)
          )
        )
      )
    )
  )
}
