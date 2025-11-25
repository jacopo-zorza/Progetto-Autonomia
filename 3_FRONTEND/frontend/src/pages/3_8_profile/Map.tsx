import React, { useEffect, useRef, useState } from 'react'
import { getAccessToken } from '../../services/auth'
import '../../styles/pages/map.css'

const DEFAULT_RADIUS_KM = 20

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
  const [status, setStatus] = useState<string>('Caricamento mappa...')
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM)
  const [pendingRadius, setPendingRadius] = useState<string>(String(DEFAULT_RADIUS_KM))
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
          lastCoordsRef.current = { lat, lon }

          setStatus(`Posizione aggiornata (±${Math.round(accuracy)} m) · raggio ${radiusKm} km`)

          if (!lfMapRef.current) return

          if (!userMarkerRef.current) {
            const userIcon = L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41]
            })
            userMarkerRef.current = L.marker([lat, lon], { icon: userIcon }).addTo(lfMapRef.current)
            radiusCircleRef.current = L.circle([lat, lon], {
              radius: radiusKm * 1000,
              color: '#2563eb',
              fillColor: '#60a5fa',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6 8'
            }).addTo(lfMapRef.current)
            lfMapRef.current.setView([lat, lon], 13)
          } else {
            userMarkerRef.current.setLatLng([lat, lon])
            if (radiusCircleRef.current) radiusCircleRef.current.setLatLng([lat, lon]).setRadius(radiusKm * 1000)
          }

          // Aggiorna markers vicini
          fetchNearbyAndRender(lat, lon, radiusKm)
        }

        function onError(err: GeolocationPositionError) {
          setStatus(`Errore geolocalizzazione: ${err.message}`)
        }

        watchId = navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 })

        // refresh nearby every 10s in case other users move
        refreshInterval = setInterval(() => {
          if (!userMarkerRef.current) return
          const latlng = userMarkerRef.current.getLatLng()
          fetchNearbyAndRender(latlng.lat, latlng.lng, radiusKm)
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

  async function fetchNearbyAndRender(lat: number, lon: number, radius: number) {
    // Chiama /api/geo/nearby per ottenere items nei dintorni
    try {
      const token = getAccessToken()
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon), radius: String(radius) })
      const res = await fetch('/api/geo/nearby?' + params.toString(), token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      if (!res.ok) {
        // fallback: usa utenti locali salvati nello storage
        setStatus('Impossibile ottenere dati dal server, uso dati locali')
        renderLocalUsers()
        return
      }
      const body = await res.json()
      if (!body.success || !Array.isArray(body.items)) {
        renderLocalUsers()
        return
      }

      const items = body.items as any[]
      const L = (window as any).L

      // raggruppa per seller_id e prendi la prima posizione trovata
      const sellers: Record<string, { latitude: number; longitude: number; seller_id: number; name?: string }>= {}
      items.forEach(it => {
        const key = String(it.seller_id)
        if (!sellers[key]) sellers[key] = { latitude: it.latitude, longitude: it.longitude, seller_id: it.seller_id, name: it.name || it.title }
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

      setStatus(`Raggio ${radius} km · Venditori trovati: ${Object.keys(sellers).length}`)
    } catch (e: any) {
      setStatus('Errore fetching nearby: ' + (e?.message || e))
      renderLocalUsers()
    }
  }

  function renderLocalUsers() {
    try {
      const raw = localStorage.getItem('pa_users')
      if (!raw) return
      const users = JSON.parse(raw)
      const L = (window as any).L
      users.forEach((u: any) => {
        if (!u.latitude || !u.longitude) return
        const key = String(u.id)
        if (nearbyMarkersRef.current[key]) return
        const marker = L.marker([u.latitude, u.longitude]).addTo(lfMapRef.current)
        marker.bindPopup(`<strong>${escapeHtml(u.first_name || u.username || 'Utente')}</strong>`) 
        nearbyMarkersRef.current[key] = marker
      })
    } catch {}
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c] as string))
  }

  useEffect(() => {
    if (!radiusCircleRef.current || !lastCoordsRef.current) return
    radiusCircleRef.current.setLatLng([lastCoordsRef.current.lat, lastCoordsRef.current.lon]).setRadius(radiusKm * 1000)
    fetchNearbyAndRender(lastCoordsRef.current.lat, lastCoordsRef.current.lon, radiusKm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm])

  function applyRadiusChange(event?: React.FormEvent) {
    if (event) event.preventDefault()
    const parsed = Number(pendingRadius)
    if (!Number.isFinite(parsed)) return
    const clamped = Math.min(500, Math.max(1, Math.round(parsed)))
    setPendingRadius(String(clamped))
    if (clamped !== radiusKm) setRadiusKm(clamped)
  }

  return (
    React.createElement('div', { className: 'fs-map-page' },
      React.createElement('div', { className: 'fs-map-toolbar' },
        React.createElement('div', { className: 'fs-map-status' }, status),
        React.createElement('form', { className: 'fs-map-radius-form', onSubmit: applyRadiusChange },
          React.createElement('label', { className: 'fs-map-radius-label' }, 'Raggio (1-500 km)'),
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
        )
      ),
      React.createElement('div', { id: 'map', ref: mapRef, className: 'fs-map-canvas' })
    )
  )
}
