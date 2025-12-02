const LEAFLET_CSS_ID = 'leaflet-css'
const LEAFLET_JS_ID = 'leaflet-js'

export const DEFAULT_CENTER = { lat: 45.4642, lon: 9.19 } as const

export async function loadLeaflet(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).L) {
    return (window as any).L
  }

  await ensureLeafletAssets()

  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 100
    const wait = setInterval(() => {
      attempts += 1
      if (typeof window !== 'undefined' && (window as any).L) {
        clearInterval(wait)
        resolve((window as any).L)
      }
      if (attempts >= maxAttempts) {
        clearInterval(wait)
        reject(new Error('Leaflet load timeout'))
      }
    }, 50)
  })
}

async function ensureLeafletAssets(): Promise<void> {
  if (typeof document === 'undefined') return

  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement('link')
    link.id = LEAFLET_CSS_ID
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }

  if (!document.getElementById(LEAFLET_JS_ID)) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.id = LEAFLET_JS_ID
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Leaflet'))
      document.body.appendChild(script)
    })
  }
}

export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`
}

export async function resolvePlaceName(lat: number, lon: number): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) })
    const response = await fetch('/api/geo/reverse?' + params.toString())
    if (!response.ok) return undefined
    const body = await response.json().catch(() => undefined)
    if (!body || typeof body !== 'object' || body.success === false) return undefined
    const data = (body as any).data
    if (data && typeof data === 'object') {
      if (typeof data.city === 'string' && data.city.trim()) return data.city
      if (typeof data.display_name === 'string' && data.display_name.trim()) return data.display_name
    }
    return undefined
  } catch {
    return undefined
  }
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
