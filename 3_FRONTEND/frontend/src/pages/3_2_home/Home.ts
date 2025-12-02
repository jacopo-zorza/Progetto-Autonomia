import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../../styles/pages/home.css'
import { Link } from 'react-router-dom'
import { listItems, Item } from '../../services/items'
import { getUser } from '../../services/auth'
import { listFavorites, toggleFavorite } from '../../services/favorites'
import { DEFAULT_CENTER, formatCoords, haversineDistanceKm, loadLeaflet, resolvePlaceName } from '../../utils/geolocation'

const GEO_RADIUS_KM = 50

const FALLBACK_ITEMS: Item[] = [
  { id: 'demo-1', title: 'Giacca invernale', description: 'Calda, usata una stagione', price: 45, owner: 'luca', ownerName: 'Luca', category: 'Abbigliamento', condition: 'Usato', location: 'Milano' },
  { id: 'demo-2', title: 'Borsa in pelle', description: 'Vintage, ottime condizioni', price: 60, owner: 'martina', ownerName: 'Martina', category: 'Abbigliamento', condition: 'Come nuova', location: 'Torino' },
  { id: 'demo-3', title: 'Smartphone usato', description: 'Perfetto stato, 64GB', price: 120, owner: 'andrea', ownerName: 'Andrea', category: 'Elettronica', condition: 'Ottimo', location: 'Bologna' },
  { id: 'demo-4', title: 'Lampada design', description: 'Ideale per soggiorno', price: 25, owner: 'sara', ownerName: 'Sara', category: 'Casa', condition: 'Usato', location: 'Verona' },
  { id: 'demo-5', title: 'Bicicletta city', description: 'Serviziata, freni nuovi', price: 150, owner: 'marco', ownerName: 'Marco', category: 'Sport', condition: 'Buono', location: 'Padova' },
  { id: 'demo-6', title: 'Scarpe da corsa', description: 'Taglia 42, quasi nuove', price: 30, owner: 'elena', ownerName: 'Elena', category: 'Sport', condition: 'Come nuove', location: 'Trieste' }
]


export default function Home(): React.ReactElement {
  const e = React.createElement
  const [items, setItems] = useState<Item[]>([])
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentUser = useMemo(() => getUser(), [])
  const [favorites, setFavorites] = useState<string[]>(() => listFavorites(currentUser))
  const [locationFilter, setLocationFilter] = useState<{ lat: number, lon: number, label?: string } | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationPending, setLocationPending] = useState<{ lat: number, lon: number } | null>(null)
  const [locationPendingLabel, setLocationPendingLabel] = useState('')
  const [locationStatus, setLocationStatus] = useState('Seleziona una posizione sulla mappa')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isApplyingLocation, setIsApplyingLocation] = useState(false)
  const [isLocatingUser, setIsLocatingUser] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const circleRef = useRef<any | null>(null)
  const lastReverseGeocodeRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false

    async function loadItems() {
      setLoading(true)
      setError(null)
      try {
        const data = await listItems()
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) setItems(data)
          else setItems(FALLBACK_ITEMS)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Impossibile recuperare gli annunci'
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadItems()

    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const base = new Set<string>()
    base.add('Abbigliamento')
    base.add('Elettronica')
    base.add('Casa')
    base.add('Sport')
    base.add('Bambini')
    base.add('Libri')
    base.add('Collezionismo')
    base.add('Motori')
    base.add('Altro')
    items.forEach(item => {
      if (item.category) base.add(item.category)
    })
    if (favorites.length > 0) base.add('Preferiti')
    return Array.from(base)
  }, [items, favorites])

  const favoriteIds = useMemo(() => new Set(favorites), [favorites])

  useEffect(() => {
    function syncFavorites() {
      setFavorites(listFavorites(currentUser))
    }
    syncFavorites()
    try {
      window.addEventListener('favorites-changed', syncFavorites)
      window.addEventListener('auth-changed', syncFavorites)
    } catch (error) {
      // ignore if events unsupported
    }
    return () => {
      try {
        window.removeEventListener('favorites-changed', syncFavorites)
        window.removeEventListener('auth-changed', syncFavorites)
      } catch (error) {
        // noop
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (favorites.length === 0 && activeCategory === 'Preferiti') {
      setActiveCategory(null)
    }
  }, [favorites, activeCategory])

  function handleToggleFavorite(event: any, itemId: string) {
    event.preventDefault()
    event.stopPropagation()
    const next = toggleFavorite(itemId, currentUser)
    setFavorites(next)
  }

  const isWithinActiveRadius = useCallback((item: Item) => {
    if (!locationFilter) return true
    if (typeof item.distanceKm === 'number' && Number.isFinite(item.distanceKm)) {
      return item.distanceKm <= GEO_RADIUS_KM + 0.001
    }
    const lat = typeof item.latitude === 'number' ? item.latitude : null
    const lon = typeof item.longitude === 'number' ? item.longitude : null
    if (lat == null || lon == null) return false
    const distance = haversineDistanceKm(locationFilter.lat, locationFilter.lon, lat, lon)
    return Number.isFinite(distance) && distance <= GEO_RADIUS_KM + 0.001
  }, [locationFilter])

  const filtered = useMemo(() => {
    const favoriteChecks = new Set(favorites)
    return items.filter(i => {
      const matchesQuery = query.trim() === '' || `${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = !activeCategory
        || (activeCategory === 'Preferiti' ? favoriteChecks.has(i.id) : (i.category && i.category.toLowerCase() === activeCategory.toLowerCase()))
      const matchesLocation = isWithinActiveRadius(i)
      return matchesQuery && matchesCategory && matchesLocation
    })
  }, [items, query, activeCategory, favorites, isWithinActiveRadius])

  const updateMarkerOnMap = useCallback((lat: number, lon: number, options?: { focus?: boolean }) => {
    const map = mapInstanceRef.current
    const L = typeof window !== 'undefined' ? (window as any).L : undefined
    if (!map || !L) return

    if (!markerRef.current) {
      const userIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
      markerRef.current = L.marker([lat, lon], { icon: userIcon }).addTo(map)
    } else {
      markerRef.current.setLatLng([lat, lon])
    }

    if (!circleRef.current) {
      circleRef.current = L.circle([lat, lon], {
        radius: GEO_RADIUS_KM * 1000,
        color: '#2563eb',
        fillColor: '#60a5fa',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 6'
      }).addTo(map)
    } else {
      circleRef.current.setLatLng([lat, lon]).setRadius(GEO_RADIUS_KM * 1000)
    }

    if (options?.focus !== false) {
      map.setView([lat, lon], Math.max(map.getZoom(), 11), { animate: true })
    }
  }, [])

  const handleSelection = useCallback((lat: number, lon: number, options?: { focus?: boolean }) => {
    updateMarkerOnMap(lat, lon, options)
    setLocationError(null)
    setLocationPending({ lat, lon })
    setLocationStatus('Calcolo indirizzo selezionato...')
    setLocationPendingLabel('')

    const requestId = Date.now()
    lastReverseGeocodeRef.current = requestId
    resolvePlaceName(lat, lon)
      .then(label => {
        if (lastReverseGeocodeRef.current !== requestId) return
        if (label) {
          setLocationPendingLabel(label)
          setLocationStatus(`Area selezionata: ${label}`)
        } else {
          setLocationPendingLabel('')
          setLocationStatus(`Coordinate selezionate: ${formatCoords(lat, lon)}`)
        }
      })
      .catch(() => {
        if (lastReverseGeocodeRef.current !== requestId) return
        setLocationPendingLabel('')
        setLocationStatus(`Coordinate selezionate: ${formatCoords(lat, lon)}`)
      })
  }, [updateMarkerOnMap])

  function openLocationModal() {
    const current = locationFilter
    if (current) {
      setLocationPending({ lat: current.lat, lon: current.lon })
      setLocationPendingLabel(current.label || '')
      setLocationStatus(current.label ? `Area selezionata: ${current.label}` : `Coordinate selezionate: ${formatCoords(current.lat, current.lon)}`)
    } else {
      setLocationPending(null)
      setLocationPendingLabel('')
      setLocationStatus('Seleziona una posizione sulla mappa')
    }
    setLocationError(null)
    setShowLocationModal(true)
  }

  function closeLocationModal() {
    setShowLocationModal(false)
    setLocationError(null)
  }

  async function locateUser() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata dal browser')
      return
    }

    setLocationError(null)
    setIsLocatingUser(true)

    if (navigator.permissions && typeof navigator.permissions.query === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const status = await navigator.permissions.query({ name: 'geolocation' } as PermissionDescriptor)
        if (status.state === 'denied') {
          setIsLocatingUser(false)
          setLocationError('Permessi geolocalizzazione negati o bloccati. Sblocca l\'accesso alla posizione dalle impostazioni del sito (icona info accanto all\'URL).')
          handleSelection(DEFAULT_CENTER.lat, DEFAULT_CENTER.lon, { focus: true })
          return
        }
      } catch {}
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setIsLocatingUser(false)
        handleSelection(position.coords.latitude, position.coords.longitude)
      },
      error => {
        setIsLocatingUser(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Permessi geolocalizzazione negati o bloccati. Sblocca l\'accesso alla posizione dalle impostazioni del sito (icona info accanto all\'URL).')
          handleSelection(DEFAULT_CENTER.lat, DEFAULT_CENTER.lon, { focus: true })
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Servizi di localizzazione non disponibili. Verifica le impostazioni del dispositivo e riprova.')
        } else if (error.code === error.TIMEOUT) {
          setLocationError('Timeout nella richiesta della posizione. Assicurati di avere segnale e riprova.')
        } else {
          setLocationError(`Impossibile ottenere la posizione: ${error.message}`)
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    )
  }

  async function applyLocationSelection() {
    if (!locationPending) {
      setLocationError('Seleziona una posizione sulla mappa prima di applicare')
      return
    }

    setIsApplyingLocation(true)
    setLocationError(null)
    setError(null)
    setLoading(true)
    const label = locationPendingLabel || formatCoords(locationPending.lat, locationPending.lon)
    try {
      const data = await listItems({ latitude: locationPending.lat, longitude: locationPending.lon, radiusKm: GEO_RADIUS_KM })
      setItems(Array.isArray(data) ? data : [])
      if (!data || data.length === 0) {
        setError('Nessun oggetto trovato entro 50 km dalla posizione selezionata')
      }
      setLocationFilter({ lat: locationPending.lat, lon: locationPending.lon, label })
      setShowLocationModal(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossibile filtrare per posizione'
      setLocationError(message)
      setLocationFilter({ lat: locationPending.lat, lon: locationPending.lon, label })
    } finally {
      setIsApplyingLocation(false)
      setLoading(false)
    }
  }

  async function clearLocationFilter() {
    setLocationFilter(null)
    setLocationPending(null)
    setLocationPendingLabel('')
    setLocationStatus('Seleziona una posizione sulla mappa')
    setLocationError(null)
    setShowLocationModal(false)
    if (markerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(markerRef.current) } catch {}
      markerRef.current = null
    }
    if (circleRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(circleRef.current) } catch {}
      circleRef.current = null
    }
    setLoading(true)
    setError(null)
    try {
      const data = await listItems()
      if (Array.isArray(data) && data.length > 0) setItems(data)
      else setItems(FALLBACK_ITEMS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossibile recuperare gli annunci'
      setError(message)
      setItems(FALLBACK_ITEMS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!showLocationModal) return

    let cancelled = false

    async function initMap() {
      try {
        const L = await loadLeaflet()
        if (cancelled) return
        if (!mapInstanceRef.current && mapContainerRef.current) {
          mapInstanceRef.current = L.map(mapContainerRef.current, {
            center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lon],
            zoom: 6
          })
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(mapInstanceRef.current)
          mapInstanceRef.current.on('click', (event: any) => {
            if (!event?.latlng) return
            handleSelection(event.latlng.lat, event.latlng.lng, { focus: false })
          })
        }

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 100)

        const seed = locationPending || locationFilter
        if (seed) {
          const marker = markerRef.current
          const currentLatLng = marker && typeof marker.getLatLng === 'function' ? marker.getLatLng() : null
          const alreadyPlaced = currentLatLng ? (Math.abs(currentLatLng.lat - seed.lat) < 0.00001 && Math.abs(currentLatLng.lng - seed.lon) < 0.00001) : false
          if (!alreadyPlaced) {
            handleSelection(seed.lat, seed.lon, { focus: true })
          }
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lon], 6)
        }
      } catch (err) {
        if (!cancelled) setLocationError('Impossibile caricare la mappa. Riprova più tardi.')
      }
    }

    initMap()

    return () => {
      cancelled = true
    }
  }, [showLocationModal, handleSelection, locationFilter, locationPending])

  useEffect(() => {
    if (!showLocationModal) return
    if (!locationPending) return
    updateMarkerOnMap(locationPending.lat, locationPending.lon, { focus: false })
  }, [showLocationModal, locationPending, updateMarkerOnMap])

  const locationLabel = locationFilter ? (locationFilter.label || formatCoords(locationFilter.lat, locationFilter.lon)) : 'Posizione'

  const locationModalEl = showLocationModal ? e('div', {
    className: 'fs-modal-overlay fs-location-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    onClick: closeLocationModal
  },
    e('div', {
      className: 'fs-modal-card fs-location-modal',
      role: 'document',
      onClick: (ev: any) => ev.stopPropagation()
    },
      e('div', { className: 'fs-location-head' },
        e('h2', { className: 'fs-location-title' }, 'Filtra per posizione'),
        e('button', { type: 'button', className: 'fs-location-close', onClick: closeLocationModal, 'aria-label': 'Chiudi pop-up posizione' }, 'x')
      ),
      e('p', { className: 'fs-location-hint' }, `Seleziona un punto sulla mappa o usa "Mia posizione". Il raggio è fisso a ${GEO_RADIUS_KM} km.`),
      e('div', { className: 'fs-location-map', ref: mapContainerRef }),
      e('div', { className: 'fs-location-status' }, locationStatus),
      locationPendingLabel ? e('div', { className: 'fs-location-label' }, locationPendingLabel) : null,
      locationError ? e('p', { className: 'fs-location-error' }, locationError) : null,
      e('div', { className: 'fs-location-actions' },
        e('button', { type: 'button', className: 'fs-location-secondary', onClick: locateUser, disabled: isLocatingUser }, isLocatingUser ? 'Localizzo...' : 'Mia posizione'),
        e('button', { type: 'button', className: 'fs-location-secondary', onClick: closeLocationModal }, 'Annulla'),
        e('button', { type: 'button', className: 'fs-location-primary', onClick: applyLocationSelection, disabled: isApplyingLocation }, isApplyingLocation ? 'Applicazione...' : 'Applica')
      )
    )
  ) : null

  return e('div', { className: 'fs-home' },
      locationModalEl,
      // Search bar area (centered like Vinted)
      e('section', { className: 'fs-hero' },
        e('div', { className: 'fs-hero-inner' },
          e('div', { className: 'fs-logo-title' },
            e('h1', { className: 'fs-title' }, 'FastSeller'),
            e('p', { className: 'fs-sub' }, 'Compra, vendi e trova occasioni vicino a te')
          ),
          e('form', { className: 'fs-search', onSubmit: (ev: any) => { ev.preventDefault(); /* search handled by query state */ } },
            e('div', { className: 'fs-search-location-wrap' },
              e('button', {
                type: 'button',
                className: `fs-search-location ${locationFilter ? 'active' : ''}`,
                onClick: openLocationModal,
                'aria-haspopup': 'dialog',
                'aria-expanded': showLocationModal
              },
                e('span', { className: 'fs-search-location-icon' }, '📍'),
                e('span', { className: 'fs-search-location-label' }, locationLabel)
              ),
              locationFilter ? e('button', { type: 'button', className: 'fs-location-reset', onClick: clearLocationFilter }, 'Rimuovi filtro') : null
            ),
            e('input', { type: 'text', className: 'fs-search-input', placeholder: 'Cerca articoli, marche, tag...', value: query, onChange: (ev: any) => setQuery(ev.target.value) }),
            e('button', { className: 'fs-search-btn', type: 'submit' }, 'Cerca')
          )
        )
      ),

      // Quick filters (categories) below search
      e('div', { className: 'fs-cats-wrap' },
        e('div', { className: 'fs-cats' },
          // 'Tutto' button to show all items
          e('button', {
            key: 'Tutto',
            className: `fs-cat ${activeCategory === null ? 'active' : ''}`,
            onClick: () => { setActiveCategory(null); setQuery('') }
          }, 'Tutto'),
          categories.map(cat => e('button', {
            key: cat,
            className: `fs-cat ${activeCategory === cat ? 'active' : ''}`,
            onClick: () => setActiveCategory(activeCategory === cat ? null : cat)
          }, cat))
        )
      ),

      // Grid of items (Vinted-like cards)
      e('main', { className: 'fs-container' },
        error ? e('p', { className: 'fs-error' }, error) : null,
        loading ? e('p', { className: 'fs-loading' }, 'Caricamento annunci...') : null,
        e('div', { className: 'fs-grid' },
          filtered.map((item, idx) =>
            e(Link, { to: `/items/${item.id}`, key: `${item.id}-${idx}`, className: 'fs-card' },
              // image with price tag and heart
              e('div', { className: 'fs-card-media' },
                e('img', { src: item.image ? item.image : `https://picsum.photos/seed/${item.id}/800/600`, alt: item.title, className: 'fs-card-img' }),
                e('div', { className: 'fs-price' }, item.price ? `€ ${item.price}` : '-'),
                e('button', {
                  className: `fs-fav ${favoriteIds.has(item.id) ? 'active' : ''}`,
                  title: favoriteIds.has(item.id) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti',
                  onClick: (ev: any) => handleToggleFavorite(ev, item.id),
                  type: 'button',
                  'aria-pressed': favoriteIds.has(item.id)
                },
                  e('svg', { width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
                    e('path', {
                      d: 'M12 21s-7.5-4.35-9.5-6.35C-0.5 11.5 3.5 6 8.5 6c2.5 0 3.5 1.5 3.5 1.5S14 6 16.5 6C21.5 6 25.5 11.5 21.5 14.65 19.5 16.65 12 21 12 21z',
                      fill: favoriteIds.has(item.id) ? '#dc2626' : '#d1d5db'
                    })
                  )
                )
              ),

              // Meta: title, location, seller
              e('div', { className: 'fs-card-body' },
                e('div', { className: 'fs-card-title' }, item.title),
                e('div', { className: 'fs-card-sub' }, item.description),
                e('div', { className: 'fs-card-meta fs-card-meta-row' },
                  item.category ? e('span', { className: 'fs-tag' }, item.category) : null,
                  item.condition ? e('span', { className: 'fs-meta-chip' }, item.condition) : null,
                  item.location ? e('span', { className: 'fs-meta-chip' }, item.location) : null
                ),
                e('div', { className: 'fs-card-meta' }, `Venduto da ${item.ownerName || item.owner || 'utente'}`)
              )
            )
          )
        )
      ),

      // CTA bar similar to Vinted
      e('section', { className: 'fs-cta' },
        e('div', { className: 'fs-container' },
          e('div', { className: 'fs-cta-inner' },
            e('div', null, e('h2', { className: 'fs-cta-title' }, 'Hai qualcosa da vendere?'), e('p', { className: 'fs-cta-sub' }, 'Metti in vendita in pochi minuti')),
            e(Link, { to: '/create', className: 'fs-cta-btn' }, 'Inserisci annuncio')
          )
        )
      )
    )
}

