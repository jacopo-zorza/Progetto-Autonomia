import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getAccessToken } from '../../services/auth'
import '../../styles/pages/map.css'

const DEFAULT_RADIUS_KM = 20
const HISTORY_KEY = 'pa_map_history'
const HISTORY_LIMIT = 5
type SellerInfo = {
  seller_id?: number
  latitude?: number
  longitude?: number
  name?: string
  distance_km?: number
  minPrice?: number
  featuredItem?: string
  updatedAt?: string
}

type HistoryEntry = {
  lat: number
  lon: number
  radius: number
  timestamp: string
  label?: string
}

type AddressSuggestion = {
  display_name: string
  latitude: number
  longitude: number
  importance?: number
  address?: Record<string, unknown>
}

// Simple Leaflet loader using CDN to avoid changing package.json
function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).L) return resolve((window as any).L)
    const cssId = 'leaflet-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const scriptId = 'leaflet-js'
    if (document.getElementById(scriptId)) {
      // wait until L is available
      const wait = setInterval(() => {
        if ((window as any).L) {
          clearInterval(wait)
          resolve((window as any).L)
        }
      }, 50)
      setTimeout(() => reject(new Error('Leaflet load timeout')), 5000)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => {
      if ((window as any).L) resolve((window as any).L)
      else reject(new Error('Leaflet not available after load'))
    }
    script.onerror = () => reject(new Error('Failed to load Leaflet'))
    document.body.appendChild(script)
  })
}

export default function MapPage(): React.ReactElement {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const lfMapRef = useRef<any | null>(null)
  const userMarkerRef = useRef<any | null>(null)
  const radiusCircleRef = useRef<any | null>(null)
  const lastCoordsRef = useRef<{ lat: number, lon: number } | null>(null)
  const radiusRef = useRef(DEFAULT_RADIUS_KM)
  const userCoordsRef = useRef<{ lat: number, lon: number } | null>(null)
  const manualSearchRef = useRef(false)
  const skipRadiusFetchRef = useRef(false)
  const [status, setStatus] = useState<string>('Caricamento mappa...')
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM)
  const [pendingRadius, setPendingRadius] = useState<string>(String(DEFAULT_RADIUS_KM))
  const [summary, setSummary] = useState<{ sellers: number; items: number; source: 'api' | 'local' | 'none'; lastUpdate?: string }>({ sellers: 0, items: 0, source: 'none' })
  const [sellerList, setSellerList] = useState<SellerInfo[]>([])
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [recentOnly, setRecentOnly] = useState<boolean>(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [advancedQuery, setAdvancedQuery] = useState('')
  const [advancedRadius, setAdvancedRadius] = useState<number>(DEFAULT_RADIUS_KM)
  const [advancedResults, setAdvancedResults] = useState<AddressSuggestion[]>([])
  const [advancedLoading, setAdvancedLoading] = useState(false)
  const [advancedError, setAdvancedError] = useState<string | null>(null)
  const [manualSearchLabel, setManualSearchLabel] = useState<string | null>(null)
  const nearbyMarkersRef = useRef<Record<string, any>>({})

  useEffect(() => {
    let watchId: number | null = null
    let refreshInterval: any = null

    async function start() {
      try {
        const L = await loadLeaflet()
        setStatus('Inizializzo mappa...')

        lfMapRef.current = L.map(mapRef.current as HTMLElement, {
          center: [45.4642, 9.19],
          zoom: 13
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(lfMapRef.current)

        setStatus('Richiedo posizione utente...')

        if (!navigator.geolocation) {
          setStatus('Geolocalizzazione non supportata dal browser')
          return
        }

        function onPosition(pos: GeolocationPosition) {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          const accuracy = pos.coords.accuracy
          userCoordsRef.current = { lat, lon }

          if (manualSearchRef.current) {
            // Conserva la posizione reale per l'utente ma non sovrascrivere la ricerca manuale
            return
          }

          lastCoordsRef.current = { lat, lon }
          setManualSearchLabel(null)
          setStatus(`Posizione aggiornata (±${Math.round(accuracy)} m) · raggio ${radiusRef.current} km`)

          if (!lfMapRef.current) return

          if (!userMarkerRef.current) {
            const userIcon = L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })
            userMarkerRef.current = L.marker([lat, lon], { icon: userIcon }).addTo(lfMapRef.current)
            radiusCircleRef.current = L.circle([lat, lon], {
              radius: radiusRef.current * 1000,
              color: '#2563eb',
              fillColor: '#60a5fa',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6 8'
            }).addTo(lfMapRef.current)
            lfMapRef.current.setView([lat, lon], 13)
          } else {
            userMarkerRef.current.setLatLng([lat, lon])
            if (radiusCircleRef.current) radiusCircleRef.current.setLatLng([lat, lon]).setRadius(radiusRef.current * 1000)
          }

          // Aggiorna markers vicini
          fetchNearbyAndRender(lat, lon, radiusRef.current)
        }

        function onError(err: GeolocationPositionError) {
          setStatus(`Errore geolocalizzazione: ${err.message}`)
        }

        watchId = navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 })

        // refresh nearby every 10s in case other users move
        refreshInterval = setInterval(() => {
          if (!lastCoordsRef.current) return
          fetchNearbyAndRender(lastCoordsRef.current.lat, lastCoordsRef.current.lon, radiusRef.current)
        }, 10000)
      } catch (e: any) {
        setStatus('Impossibile caricare la mappa: ' + (e?.message || e))
      }
    }

    start()

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      if (refreshInterval) clearInterval(refreshInterval)
      if (lfMapRef.current) {
        try { lfMapRef.current.remove() } catch {}
        lfMapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, HISTORY_LIMIT))
      }
    } catch {}
  }, [])

  async function fetchNearbyAndRender(lat: number, lon: number, radius: number) {
    // Chiama /api/geo/nearby per ottenere items nei dintorni
    try {
      const token = getAccessToken()
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon), radius: String(radius) })
      const res = await fetch('/api/geo/nearby?' + params.toString(), token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      if (!res.ok) {
        // fallback: usa utenti locali salvati nello storage
        setStatus('Impossibile ottenere dati dal server, uso dati locali')
        await renderLocalUsers(lat, lon, radius)
        return
      }
      const body = await res.json()
      if (!body.success || !Array.isArray(body.items)) {
        await renderLocalUsers(lat, lon, radius)
        return
      }

      const items = body.items as any[]
      const L = (window as any).L

      // raggruppa per seller_id e prendi la prima posizione trovata
      const sellers: Record<string, SellerInfo> = {}
      items.forEach(it => {
        const key = String(it.seller_id)
        if (!sellers[key]) {
          sellers[key] = {
            latitude: it.latitude,
            longitude: it.longitude,
            seller_id: it.seller_id,
            name: it.name || it.title,
            distance_km: it.distance_km,
            minPrice: it.price,
            featuredItem: it.title,
            updatedAt: it.created_at
          }
        } else {
          const record = sellers[key]
          if (typeof it.distance_km === 'number' && (record.distance_km == null || it.distance_km < record.distance_km)) record.distance_km = it.distance_km
          if (typeof it.price === 'number' && (record.minPrice == null || it.price < record.minPrice)) record.minPrice = it.price
          if (!record.featuredItem) record.featuredItem = it.title
          if (it.created_at && (!record.updatedAt || new Date(it.created_at) > new Date(record.updatedAt))) record.updatedAt = it.created_at
        }
      })

      // rimuovi markers non più presenti
      const existing = nearbyMarkersRef.current
      Object.keys(existing).forEach(k => {
        if (!sellers[k]) {
          try { lfMapRef.current.removeLayer(existing[k]) } catch {}
          delete existing[k]
        }
      })

      // aggiungi/aggiorna marker per ogni seller
      Object.entries(sellers).forEach(([k, s]) => {
        if (existing[k]) {
          existing[k].setLatLng([s.latitude, s.longitude])
        } else {
          const marker = L.marker([s.latitude, s.longitude], { title: String(s.seller_id) }).addTo(lfMapRef.current)
          marker.bindPopup(`<strong>${escapeHtml(String(s.name || 'Venditore'))}</strong><br/>ID: ${s.seller_id}`)
          existing[k] = marker
        }
      })

      const sellerArray = Object.values(sellers)
      setStatus(`Raggio ${radius} km · Venditori trovati: ${sellerArray.length}`)
      setSummary({ sellers: sellerArray.length, items: items.length, source: 'api', lastUpdate: new Date().toISOString() })
      setSellerList(sellerArray)
      await recordHistory(lat, lon, radius)
    } catch (e: any) {
      setStatus('Errore fetching nearby: ' + (e?.message || e))
      await renderLocalUsers(lat, lon, radius)
    }
  }

  async function renderLocalUsers(lat?: number, lon?: number, radius?: number) {
    try {
      const raw = localStorage.getItem('pa_users')
      if (!raw) return
      const users = JSON.parse(raw)
      const L = (window as any).L
      const sellersData: SellerInfo[] = []
      users.forEach((u: any) => {
        if (!u.latitude || !u.longitude) return
        const key = String(u.id)
        if (nearbyMarkersRef.current[key]) return
        const marker = L.marker([u.latitude, u.longitude]).addTo(lfMapRef.current)
        marker.bindPopup(`<strong>${escapeHtml(u.first_name || u.username || 'Utente')}</strong>`) 
        nearbyMarkersRef.current[key] = marker
        sellersData.push({ seller_id: u.id, latitude: u.latitude, longitude: u.longitude, name: u.first_name || u.username })
      })
      setSummary({ sellers: sellersData.length, items: 0, source: 'local', lastUpdate: new Date().toISOString() })
      setSellerList(sellersData)
      if (typeof lat === 'number' && typeof lon === 'number' && typeof radius === 'number') await recordHistory(lat, lon, radius)
    } catch {}
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c] as string))
  }

  useEffect(() => {
    radiusRef.current = radiusKm
    if (!radiusCircleRef.current || !lastCoordsRef.current) return
    radiusCircleRef.current.setLatLng([lastCoordsRef.current.lat, lastCoordsRef.current.lon]).setRadius(radiusKm * 1000)
    if (skipRadiusFetchRef.current) {
      skipRadiusFetchRef.current = false
      return
    }
    fetchNearbyAndRender(lastCoordsRef.current.lat, lastCoordsRef.current.lon, radiusKm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm])

  function applyRadiusChange(event?: React.FormEvent) {
    if (event) event.preventDefault()
    const parsed = Number(pendingRadius)
    if (!Number.isFinite(parsed)) return
    const clamped = clampRadiusValue(parsed)
    setPendingRadius(String(clamped))
    if (clamped !== radiusKm) setRadiusKm(clamped)
  }

  function centerOnUser() {
    if (!lfMapRef.current) return
    const coords = userCoordsRef.current
    if (!coords) {
      setStatus('Posizione utente non disponibile, attiva il GPS per centrare la mappa')
      return
    }
    manualSearchRef.current = false
    setManualSearchLabel(null)
    lastCoordsRef.current = { lat: coords.lat, lon: coords.lon }
    if (userMarkerRef.current) userMarkerRef.current.setLatLng([coords.lat, coords.lon])
    if (radiusCircleRef.current) radiusCircleRef.current.setLatLng([coords.lat, coords.lon]).setRadius(radiusRef.current * 1000)
    lfMapRef.current.setView([coords.lat, coords.lon], Math.max(lfMapRef.current.getZoom(), 13), { animate: true })
    setStatus(`Tornato alla tua posizione · raggio ${radiusRef.current} km`)
    fetchNearbyAndRender(coords.lat, coords.lon, radiusRef.current)
  }

  function focusOnSeller(lat?: number, lon?: number) {
    if (!lfMapRef.current || typeof lat !== 'number' || typeof lon !== 'number') return
    lfMapRef.current.setView([lat, lon], Math.max(lfMapRef.current.getZoom(), 13), { animate: true })
  }

  function openSellerProfile(id?: number) {
    if (!id) return
    window.open(`/profile?seller=${id}`, '_blank', 'noopener')
  }

  function clearHistoryState() {
    setHistory([])
    try { localStorage.removeItem(HISTORY_KEY) } catch {}
  }

  async function recordHistory(lat: number, lon: number, radius: number) {
    const roundedLat = Number(lat.toFixed(5))
    const roundedLon = Number(lon.toFixed(5))
    if (history.some(h => Math.abs(h.lat - roundedLat) < 0.0001 && Math.abs(h.lon - roundedLon) < 0.0001 && h.radius === Math.round(radius))) {
      return
    }
    const label = await resolvePlaceName(roundedLat, roundedLon)
    const entry: HistoryEntry = {
      lat: roundedLat,
      lon: roundedLon,
      radius: Math.round(radius),
      timestamp: new Date().toISOString(),
      label: label || formatCoords(roundedLat, roundedLon)
    }
    setHistory(prev => {
      const deduped = prev.filter(h => !(Math.abs(h.lat - entry.lat) < 0.0001 && Math.abs(h.lon - entry.lon) < 0.0001 && h.radius === entry.radius))
      const next = [entry, ...deduped].slice(0, HISTORY_LIMIT)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function restoreHistory(entry: HistoryEntry) {
    setRadiusKm(entry.radius)
    setPendingRadius(String(entry.radius))
    if (lfMapRef.current) lfMapRef.current.setView([entry.lat, entry.lon], Math.max(lfMapRef.current.getZoom(), 13), { animate: true })
    fetchNearbyAndRender(entry.lat, entry.lon, entry.radius)
  }

  function openAdvancedSearchDialog() {
    setAdvancedSearchOpen(true)
    setAdvancedQuery('')
    setAdvancedResults([])
    setAdvancedError(null)
    setAdvancedRadius(radiusRef.current)
  }

  function closeAdvancedSearchDialog() {
    if (advancedLoading) return
    setAdvancedSearchOpen(false)
    setAdvancedError(null)
  }

  async function submitAdvancedSearch(event?: React.FormEvent) {
    if (event) event.preventDefault()
    const query = advancedQuery.trim()
    if (query.length < 3) {
      setAdvancedError('Inserisci almeno 3 caratteri per la località desiderata')
      setAdvancedResults([])
      return
    }
    setAdvancedLoading(true)
    setAdvancedError(null)
    try {
      const params = new URLSearchParams({ q: query, limit: '5' })
      const res = await fetch('/api/geo/search?' + params.toString())
      const body = await res.json()
      if (!res.ok || !body?.success) {
        setAdvancedResults([])
        setAdvancedError(body?.message || 'Impossibile completare la ricerca')
        return
      }
      const results = Array.isArray(body.results) ? body.results : []
      const normalized: AddressSuggestion[] = results.map((item: any) => ({
        display_name: String(item.display_name || item.label || 'Posizione trovata'),
        latitude: typeof item.latitude === 'number' ? item.latitude : Number(item.lat ?? item.latitude),
        longitude: typeof item.longitude === 'number' ? item.longitude : Number(item.lon ?? item.longitude),
        importance: typeof item.importance === 'number' ? item.importance : undefined,
        address: item.address || undefined
      })).filter(s => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
      setAdvancedResults(normalized)
      if (!normalized.length) setAdvancedError('Nessun risultato trovato, prova a specificare meglio la località')
    } catch (error) {
      setAdvancedResults([])
      setAdvancedError(error instanceof Error ? error.message : 'Errore imprevisto durante la ricerca')
    } finally {
      setAdvancedLoading(false)
    }
  }

  async function applyAdvancedResult(option: AddressSuggestion) {
    if (!lfMapRef.current) {
      setStatus('La mappa non è pronta, attendi qualche secondo e riprova')
      return
    }
    const lat = Number(option.latitude)
    const lon = Number(option.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setAdvancedError('Coordinate non valide per il risultato selezionato')
      return
    }
    const clampedRadius = clampRadiusValue(advancedRadius)
    setAdvancedRadius(clampedRadius)
    setPendingRadius(String(clampedRadius))
    skipRadiusFetchRef.current = true
    manualSearchRef.current = true
    setManualSearchLabel(truncateLabel(option.display_name))
    lastCoordsRef.current = { lat, lon }
    setAdvancedSearchOpen(false)

    const L = (window as any).L
    if (!userMarkerRef.current) {
      const userIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
      userMarkerRef.current = L.marker([lat, lon], { icon: userIcon }).addTo(lfMapRef.current)
    } else {
      userMarkerRef.current.setLatLng([lat, lon])
    }

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle([lat, lon], {
        radius: clampedRadius * 1000,
        color: '#2563eb',
        fillColor: '#60a5fa',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6 8'
      }).addTo(lfMapRef.current)
    } else {
      radiusCircleRef.current.setLatLng([lat, lon]).setRadius(clampedRadius * 1000)
    }

    lfMapRef.current.setView([lat, lon], Math.max(lfMapRef.current.getZoom(), 12), { animate: true })
    setStatus(`Ricerca avanzata su ${truncateLabel(option.display_name)} · raggio ${clampedRadius} km`)
    await fetchNearbyAndRender(lat, lon, clampedRadius)
    setRadiusKm(clampedRadius)
  }

  const visibleSellers = useMemo(() => {
    return sellerList.filter(seller => {
      if (!matchesPriceFilter(seller.minPrice, priceFilter)) return false
      if (recentOnly && !isRecent(seller.updatedAt)) return false
      return true
    })
  }, [sellerList, priceFilter, recentOnly])

  const hasActiveFilters = priceFilter !== 'all' || recentOnly

  return (
    React.createElement('div', { className: 'fs-map-shell' },
      React.createElement('div', { className: 'fs-map-card' },
        React.createElement('div', { className: 'fs-map-toolbar' },
          React.createElement('div', { className: 'fs-map-status' }, status),
          React.createElement('div', { className: 'fs-map-controls' },
            React.createElement('form', { className: 'fs-map-radius-form', onSubmit: applyRadiusChange },
              React.createElement('label', { className: 'fs-map-radius-label' }, 'Raggio (km)'),
              React.createElement('input', {
                type: 'number',
                min: 1,
                max: 500,
                step: 1,
                value: pendingRadius,
                onChange: e => setPendingRadius(e.target.value),
                className: 'fs-map-radius-input'
              }),
              React.createElement('button', { type: 'submit', className: 'fs-map-radius-apply' }, 'Aggiorna')
            ),
            React.createElement('button', { type: 'button', className: 'fs-map-center-btn', onClick: centerOnUser }, 'Centra posizione')
          )
        ),
        React.createElement('div', { className: 'fs-map-canvas-wrap' },
          React.createElement('div', { id: 'map', ref: mapRef, className: 'fs-map-canvas' })
        ),
        React.createElement('section', { className: 'fs-map-section' },
          React.createElement('div', { className: 'fs-map-section-head' },
            React.createElement('span', { className: 'fs-map-chip' }, 'Panoramica'),
            React.createElement('h2', null, 'Attività nelle vicinanze'),
            React.createElement('p', { className: 'fs-map-section-hint' }, 'Uno sguardo rapido a venditori e annunci entro il raggio selezionato.')
          ),
          React.createElement('div', { className: 'fs-map-summary' },
            React.createElement('div', { className: 'fs-map-summary-item' },
              React.createElement('span', null, 'Venditori vicini'),
              React.createElement('strong', null, summary.sellers)
            ),
            React.createElement('div', { className: 'fs-map-summary-item' },
              React.createElement('span', null, 'Annunci rilevati'),
              React.createElement('strong', null, summary.items)
            ),
            React.createElement('div', { className: 'fs-map-summary-item' },
              React.createElement('span', null, 'Ultimo aggiornamento'),
              React.createElement('strong', null, summary.lastUpdate ? formatSummaryTimestamp(summary.lastUpdate) : '—')
            )
          ),
          React.createElement('div', { className: 'fs-map-summary-badge', 'data-source': summary.source },
            summary.source === 'api' ? 'Dati live API' : summary.source === 'local' ? 'Cache locale' : 'In attesa di dati'
          )
        ),
        React.createElement('section', { className: 'fs-map-section' },
          React.createElement('div', { className: 'fs-map-section-head' },
            React.createElement('span', { className: 'fs-map-chip' }, 'Ricerca'),
            React.createElement('h2', null, 'Affina risultati'),
            React.createElement('p', { className: 'fs-map-section-hint' }, 'Filtra per budget o freschezza degli annunci e agisci rapidamente.')
          ),
          React.createElement('div', { className: 'fs-map-filters' },
            React.createElement('div', { className: 'fs-map-filter-group' },
              ['all', 'low', 'medium', 'high'].map(option => (
                React.createElement('button', {
                  key: option,
                  type: 'button',
                  className: 'fs-map-filter-chip' + (priceFilter === option ? ' active' : ''),
                  onClick: () => setPriceFilter(option as 'all' | 'low' | 'medium' | 'high')
                }, labelForPrice(option as 'all' | 'low' | 'medium' | 'high'))
              ))
            ),
            React.createElement('div', { className: 'fs-map-filter-actions' },
              React.createElement('label', { className: 'fs-map-toggle' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: recentOnly,
                  onChange: e => setRecentOnly(e.target.checked)
                }),
                React.createElement('span', null, 'Solo annunci recenti')
              ),
              hasActiveFilters ? React.createElement('button', { type: 'button', className: 'fs-map-reset', onClick: () => { setPriceFilter('all'); setRecentOnly(false) } }, 'Reset filtri') : null
            )
          ),
          React.createElement('div', { className: 'fs-map-sellers-list' },
            visibleSellers.length > 0
              ? visibleSellers.map((seller, index) => (
                React.createElement('div', { key: seller.seller_id || index, className: 'fs-map-seller-card' },
                  React.createElement('div', { className: 'fs-map-seller-meta' },
                    React.createElement('strong', null, seller.name || `Venditore #${seller.seller_id}`),
                    typeof seller.distance_km === 'number' ? React.createElement('span', null, `${seller.distance_km.toFixed(1)} km`) : null
                  ),
                  React.createElement('div', { className: 'fs-map-seller-info' },
                    seller.featuredItem ? React.createElement('p', null, seller.featuredItem) : null,
                    typeof seller.minPrice === 'number' ? React.createElement('p', { className: 'fs-map-price' }, formatPrice(seller.minPrice)) : null,
                    seller.updatedAt ? React.createElement('p', { className: 'fs-map-updated' }, relativeTimeLabel(seller.updatedAt)) : null
                  ),
                  React.createElement('div', { className: 'fs-map-seller-actions' },
                    React.createElement('button', { type: 'button', onClick: () => focusOnSeller(seller.latitude, seller.longitude) }, 'Centra mappa'),
                    React.createElement('button', { type: 'button', onClick: () => openSellerProfile(seller.seller_id) }, 'Apri profilo')
                  )
                ))
              )
              : React.createElement('p', { className: 'fs-map-seller-empty' }, hasActiveFilters ? 'Nessun venditore corrisponde ai filtri' : 'Nessun venditore trovato nel raggio attuale')
          ),
          React.createElement('div', { className: 'fs-map-cta' },
            React.createElement('button', { type: 'button', className: 'fs-map-cta-primary', onClick: () => window.location.assign('/create') }, 'Pubblica un nuovo oggetto'),
            React.createElement('button', { type: 'button', className: 'fs-map-cta-secondary', onClick: openAdvancedSearchDialog }, 'Apri ricerca avanzata')
          ),
          manualSearchLabel ? React.createElement('p', { className: 'fs-map-manual-hint' }, `Ricerca manuale attiva su ${manualSearchLabel}`) : null
        ),
        React.createElement('section', { className: 'fs-map-section fs-map-section-muted' },
          React.createElement('div', { className: 'fs-map-section-head' },
            React.createElement('span', { className: 'fs-map-chip' }, 'Strumenti'),
            React.createElement('h2', null, 'Cronologia e consigli'),
            React.createElement('p', { className: 'fs-map-section-hint' }, 'Riprendi una ricerca salvata oppure ottimizza il raggio con i suggerimenti rapidi.')
          ),
          React.createElement('div', { className: 'fs-map-bottom' },
            React.createElement('div', { className: 'fs-map-history' },
              React.createElement('div', { className: 'fs-map-history-header' },
                React.createElement('strong', null, 'Ricerche recenti'),
                history.length ? React.createElement('button', { type: 'button', onClick: clearHistoryState, className: 'fs-map-history-clear' }, 'Pulisci') : null
              ),
              history.length
                ? history.map((entry, idx) => (
                  React.createElement('button', { key: idx, type: 'button', className: 'fs-map-history-row', onClick: () => restoreHistory(entry) },
                    React.createElement('span', null, entry.label || formatCoords(entry.lat, entry.lon)),
                    React.createElement('span', null, `${entry.radius} km · ${relativeTimeLabel(entry.timestamp)}`)
                  )
                ))
                : React.createElement('p', { className: 'fs-map-history-empty' }, 'Effettua una ricerca per salvare la posizione')
            ),
            React.createElement('div', { className: 'fs-map-tips' },
              React.createElement('strong', null, 'Suggerimenti rapidi'),
              React.createElement('ul', null,
                React.createElement('li', null, 'Estendi il raggio quando viaggi tra città diverse'),
                React.createElement('li', null, 'Attiva i filtri per trovare solo articoli del budget desiderato'),
                React.createElement('li', null, 'Centra sulla tua posizione per aggiornare la bolla di ricerca')
              )
            )
          )
        )
      ),
      advancedSearchOpen
        ? React.createElement('div', { className: 'fs-map-advanced-overlay', role: 'dialog', 'aria-modal': 'true' },
            React.createElement('div', { className: 'fs-map-advanced-card' },
              React.createElement('button', { type: 'button', className: 'fs-map-advanced-close', onClick: closeAdvancedSearchDialog, 'aria-label': 'Chiudi ricerca avanzata' }, 'x'),
              React.createElement('h3', null, 'Ricerca avanzata personalizzata'),
              React.createElement('p', { className: 'fs-map-advanced-subtitle' }, 'Scegli qualsiasi località e un raggio dedicato per esplorare venditori e annunci.'),
              React.createElement('form', { className: 'fs-map-advanced-form', onSubmit: submitAdvancedSearch },
                React.createElement('label', { className: 'fs-map-advanced-label', htmlFor: 'fs-adv-location' }, 'Località'),
                React.createElement('input', {
                  id: 'fs-adv-location',
                  type: 'text',
                  value: advancedQuery,
                  onChange: e => setAdvancedQuery(e.target.value),
                  placeholder: 'Es. Rovereto, Piazza Duomo',
                  className: 'fs-map-advanced-input',
                  autoComplete: 'off',
                  autoFocus: true
                }),
                React.createElement('label', { className: 'fs-map-advanced-label', htmlFor: 'fs-adv-radius' }, 'Raggio (km)'),
                React.createElement('input', {
                  id: 'fs-adv-radius',
                  type: 'number',
                  min: 1,
                  max: 500,
                  value: advancedRadius,
                  onChange: e => setAdvancedRadius(clampRadiusValue(Number(e.target.value))),
                  className: 'fs-map-advanced-input'
                }),
                React.createElement('button', { type: 'submit', className: 'fs-map-advanced-searchbtn', disabled: advancedLoading }, advancedLoading ? 'Ricerca in corso...' : 'Cerca località')
              ),
              advancedError ? React.createElement('p', { className: 'fs-map-advanced-error' }, advancedError) : null,
              !advancedResults.length && !advancedLoading ? React.createElement('p', { className: 'fs-map-advanced-placeholder' }, 'Inserisci una città o un indirizzo completo, poi premi su "Cerca località".') : null,
              advancedLoading ? React.createElement('p', { className: 'fs-map-advanced-placeholder' }, 'Sto cercando i risultati migliori...') : null,
              advancedResults.length ? React.createElement('ul', { className: 'fs-map-advanced-results' },
                advancedResults.map((result, idx) => (
                  React.createElement('li', { key: `${result.latitude}-${result.longitude}-${idx}`, className: 'fs-map-advanced-result' },
                    React.createElement('div', { className: 'fs-map-advanced-result-body' },
                      React.createElement('strong', null, truncateLabel(result.display_name, 80)),
                      formatSuggestionAddress(result.address) ? React.createElement('span', null, formatSuggestionAddress(result.address)) : null
                    ),
                    React.createElement('button', { type: 'button', onClick: () => applyAdvancedResult(result) }, 'Usa questa località')
                  )
                ))
              ) : null
            )
          )
        : null
    )
  )
}

function formatSummaryTimestamp(iso?: string) {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

async function resolvePlaceName(lat: number, lon: number): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
    const res = await fetch('/api/geo/reverse?' + params.toString())
    if (!res.ok) return undefined
    const body = await res.json()
    if (!body?.success || !body?.data) return undefined
    return body.data.city || body.data.display_name || undefined
  } catch {
    return undefined
  }
}

function formatCoords(lat: number, lon: number) {
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`
}

function matchesPriceFilter(value: number | undefined, filter: 'all' | 'low' | 'medium' | 'high') {
  if (filter === 'all' || typeof value !== 'number') return true
  if (filter === 'low') return value < 50
  if (filter === 'medium') return value >= 50 && value <= 150
  return value > 150
}

function isRecent(iso?: string) {
  if (!iso) return false
  const now = Date.now()
  const time = new Date(iso).getTime()
  return !Number.isNaN(time) && now - time <= 1000 * 60 * 60 * 24 * 7
}

function labelForPrice(filter: 'all' | 'low' | 'medium' | 'high') {
  if (filter === 'low') return '< 50€'
  if (filter === 'medium') return '50-150€'
  if (filter === 'high') return '> 150€'
  return 'Tutti'
}

function relativeTimeLabel(iso: string) {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return ''
  const diff = Date.now() - time
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `Aggiornato ${minutes} min fa`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Aggiornato ${hours} h fa`
  const days = Math.floor(hours / 24)
  return `Aggiornato ${days} g fa`
}

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${value}€`
  }
}

function clampRadiusValue(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_RADIUS_KM
  return Math.min(500, Math.max(1, Math.round(value)))
}

function truncateLabel(value: string, max = 60) {
  if (!value) return ''
  return value.length > max ? value.slice(0, max - 1) + '...' : value
}

function formatSuggestionAddress(address?: Record<string, unknown>) {
  if (!address) return ''
  const data = address as Record<string, any>
  return data.city || data.town || data.village || data.country || ''
}
