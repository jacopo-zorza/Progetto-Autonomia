type FavoritedStore = Record<string, string[]>

const KEY = 'pa_favorites'

// Gestione delle liste preferiti su localStorage per supportare l'uso offline.

function read(): FavoritedStore {
  const raw = localStorage.getItem(KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch (error) {
    return {}
  }
}

function write(store: FavoritedStore) {
  // Propaga un evento globale così le viste si aggiornano in tempo reale.
  localStorage.setItem(KEY, JSON.stringify(store))
  try {
    window.dispatchEvent(new Event('favorites-changed'))
  } catch (error) {
    // noop if event dispatch not supported
  }
}

function normalizeIds(list: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(list).filter(Boolean)))
}

function resolveOwnerKey(user: any): string {
  // Usa info dell'utente quando disponibile, altrimenti registra il visitatore come guest.
  if (user && typeof user === 'object') {
    if (user.id) return `user:${user.id}`
    if (user.email) return `email:${user.email}`
    if (user.username) return `username:${user.username}`
  }
  return 'guest'
}

export function listFavorites(user: any): string[] {
  const store = read()
  const key = resolveOwnerKey(user)
  return store[key] ? [...store[key]] : []
}

export function isFavorite(itemId: string, user: any): boolean {
  const store = read()
  const key = resolveOwnerKey(user)
  const list = store[key] || []
  return list.includes(itemId)
}

export function toggleFavorite(itemId: string, user: any): string[] {
  const key = resolveOwnerKey(user)
  const store = read()
  const list = new Set(store[key] || [])
  if (list.has(itemId)) {
    list.delete(itemId)
  } else {
    list.add(itemId)
  }
  const normalized = normalizeIds(list)
  if (normalized.length === 0) {
    delete store[key]
  } else {
    store[key] = normalized
  }
  write(store)
  return normalized
}

export function clearFavorites(user: any) {
  const store = read()
  const key = resolveOwnerKey(user)
  if (store[key]) {
    delete store[key]
    write(store)
  }
}
