import { getAccessToken } from './auth'

export type Item = {
  id: string
  title: string
  description?: string
  price?: number
  image?: string | null
  owner?: string | null
  ownerName?: string | null
  ownerId?: string | null
  category?: string | null
  condition?: string | null
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  distanceKm?: number | null
  isSold?: boolean
  isActive?: boolean
}

type ApiItem = Record<string, any>

function normalizePrice(value: any): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return Number(value.toFixed(2))
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'))
    if (Number.isFinite(parsed)) return Number(parsed.toFixed(2))
  }
  return undefined
}

function mapApiItem(data: ApiItem): Item {
  const idValue = data?.id ?? data?.item_id
  const sellerId = data?.seller_id ?? data?.sellerId
  const username = data?.seller_username ?? data?.sellerUsername ?? null
  const fullName = data?.seller_full_name ?? data?.sellerFullName ?? null
  const ownerId = sellerId !== undefined && sellerId !== null ? String(sellerId) : null
  const ownerName = fullName && typeof fullName === 'string' && fullName.trim().length > 0
    ? fullName
    : (typeof username === 'string' ? username : null)

  return {
    id: idValue !== undefined && idValue !== null ? String(idValue) : `${Date.now()}`,
    title: typeof data?.title === 'string' && data.title.length > 0 ? data.title : (typeof data?.name === 'string' ? data.name : ''),
    description: typeof data?.description === 'string' ? data.description : '',
    price: normalizePrice(data?.price),
    category: typeof data?.category === 'string' ? data.category : null,
    condition: typeof data?.condition === 'string' ? data.condition : null,
    location: typeof data?.location === 'string' ? data.location : (typeof data?.location_name === 'string' ? data.location_name : null),
    latitude: typeof data?.latitude === 'number' ? data.latitude : null,
    longitude: typeof data?.longitude === 'number' ? data.longitude : null,
    image: typeof data?.image === 'string' ? data.image : (typeof data?.image_url === 'string' ? data.image_url : null),
    owner: typeof username === 'string' ? username : null,
    ownerName,
    ownerId,
    createdAt: typeof data?.created_at === 'string' ? data.created_at : (typeof data?.createdAt === 'string' ? data.createdAt : null),
    updatedAt: typeof data?.updated_at === 'string' ? data.updated_at : (typeof data?.updatedAt === 'string' ? data.updatedAt : null),
    distanceKm: typeof data?.distance_km === 'number' ? data.distance_km : (typeof data?.distanceKm === 'number' ? data.distanceKm : null),
    isSold: typeof data?.is_sold === 'boolean' ? data.is_sold : (typeof data?.isSold === 'boolean' ? data.isSold : undefined),
    isActive: typeof data?.is_active === 'boolean' ? data.is_active : (typeof data?.isActive === 'boolean' ? data.isActive : undefined)
  }
}

async function fetchJson(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {}

  const isErrorResponse = !response.ok || (body && typeof body === 'object' && 'success' in body && body.success === false)
  if (isErrorResponse) {
    const message = body && typeof body === 'object' && typeof body.message === 'string'
      ? body.message
      : `Richiesta fallita (HTTP ${response.status})`
    throw new Error(message)
  }

  return body
}

function withAuth(options: RequestInit = {}): RequestInit {
  const token = getAccessToken()
  if (!token) {
    throw new Error('Autenticazione richiesta')
  }

  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return { ...options, headers }
}

function toApiPayload(data: Partial<Omit<Item, 'id'>>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (data.title !== undefined) payload.title = data.title
  if (data.description !== undefined) payload.description = data.description
  if (data.price !== undefined) payload.price = normalizePrice(data.price)
  if (data.category !== undefined) payload.category = data.category
  if (data.condition !== undefined) payload.condition = data.condition
  if (data.location !== undefined) payload.location = data.location
  if (data.image !== undefined) payload.image = data.image
  if (data.latitude !== undefined) payload.latitude = data.latitude
  if (data.longitude !== undefined) payload.longitude = data.longitude

  return payload
}

function stringCandidates(values: Array<string | undefined | null>): string[] {
  return values
    .filter(value => typeof value === 'string')
    .map(value => value!.toString().trim().toLowerCase())
    .filter(Boolean)
}

type ListItemsOptions = {
  search?: string
  sellerId?: string | number
  page?: number
  perPage?: number
  minPrice?: number
  maxPrice?: number
  latitude?: number
  longitude?: number
  radiusKm?: number
  orderBy?: 'created_at' | 'price' | 'name'
  orderDir?: 'asc' | 'desc'
}

function buildQuery(options: ListItemsOptions = {}): string {
  const params = new URLSearchParams()

  if (options.search) params.set('search', options.search)
  if (options.sellerId !== undefined && options.sellerId !== null) params.set('seller_id', String(options.sellerId))
  if (options.page !== undefined) params.set('page', String(options.page))
  if (options.perPage !== undefined) params.set('per_page', String(options.perPage))
  if (options.minPrice !== undefined) params.set('min_price', String(options.minPrice))
  if (options.maxPrice !== undefined) params.set('max_price', String(options.maxPrice))
  if (options.latitude !== undefined) params.set('latitude', String(options.latitude))
  if (options.longitude !== undefined) params.set('longitude', String(options.longitude))
  if (options.radiusKm !== undefined) params.set('radius_km', String(options.radiusKm))
  if (options.orderBy) params.set('order_by', options.orderBy)
  if (options.orderDir) params.set('order_dir', options.orderDir)

  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function listItems(options: ListItemsOptions = {}): Promise<Item[]> {
  const body = await fetchJson(`/api/items${buildQuery(options)}`)
  const data = body && typeof body === 'object' && Array.isArray(body.data) ? body.data : []
  return (data as ApiItem[]).map(mapApiItem)
}

export async function getItem(id: string): Promise<Item | undefined> {
  if (!id) return undefined
  const body = await fetchJson(`/api/items/${id}`)
  if (body && typeof body === 'object' && body.data) {
    return mapApiItem(body.data as ApiItem)
  }
  return undefined
}

export async function createItem(item: Omit<Item, 'id'>): Promise<Item> {
  const payload = toApiPayload(item)
  if (!payload.title || payload.title.toString().trim().length === 0) {
    throw new Error('Inserisci un titolo per l\'annuncio')
  }
  if (payload.price === undefined) {
    throw new Error('Inserisci un prezzo valido')
  }

  const response = await fetchJson('/api/items', withAuth({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }))

  if (response && typeof response === 'object' && response.data) {
    return mapApiItem(response.data as ApiItem)
  }

  throw new Error('Risposta inattesa dal server')
}

export async function updateItem(id: string, updates: Partial<Omit<Item, 'id'>>): Promise<Item | undefined> {
  const payload = toApiPayload(updates)
  if (Object.keys(payload).length === 0) {
    return getItem(id)
  }

  const response = await fetchJson(`/api/items/${id}`, withAuth({
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }))

  if (response && typeof response === 'object' && response.data) {
    return mapApiItem(response.data as ApiItem)
  }

  return undefined
}

export async function deleteItem(id: string): Promise<boolean> {
  await fetchJson(`/api/items/${id}`, withAuth({ method: 'DELETE' }))
  return true
}

export function isItemOwnedByUser(item: Item | undefined, user: any): boolean {
  if (!item || !user) return false
  if (item.ownerId && user.id && String(item.ownerId) === String(user.id)) return true
  const userCandidates = stringCandidates([user.id, user.username, user.email])
  if (userCandidates.length === 0) return false
  const itemCandidates = stringCandidates([item.ownerId, item.owner, item.ownerName])
  return userCandidates.some(candidate => itemCandidates.includes(candidate))
}
