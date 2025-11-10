export type Item = {
  id: string
  title: string
  description: string
  price?: number
  image?: string // URL o data-uri dell'immagine principale
  owner?: string
  ownerName?: string
  ownerId?: string
  category?: string
  condition?: string
  location?: string
  createdAt?: string
}

const KEY = 'pa_items'

function read(): Item[] {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

function write(items: Item[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

function enhance(item: Item): Item {
  return {
    ...item,
    ownerName: item.ownerName || item.owner || 'Utente'
  }
}

function stringCandidates(values: Array<string | undefined>): string[] {
  return values.filter(Boolean).map(value => value!.toString().trim().toLowerCase()).filter(Boolean)
}

export function createItem(item: Omit<Item, 'id'>): Item {
  const items = read()
  // Genera un id più unico per evitare duplicati quando si creano molti elementi rapidamente
  const timestamp = new Date().toISOString()
  const newItem: Item = {
    ...item,
    ownerName: item.ownerName || item.owner || 'Utente',
    createdAt: item.createdAt ?? timestamp,
    id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}`
  }
  items.unshift(newItem)
  write(items)
  return enhance(newItem)
}

export function listItems(): Item[] {
  // Ritorna una copia ordinata per titolo (ascendente) per avere sempre
  // un elenco prevedibile nella UI
  return read().map(enhance).slice().sort((a, b) => {
    const ta = (a.title || '').toString().toLowerCase()
    const tb = (b.title || '').toString().toLowerCase()
    return ta.localeCompare(tb)
  })
}

export function getItem(id: string): Item | undefined {
  const found = read().find(i => i.id === id)
  if(!found) return undefined
  return enhance(found)
}

export function updateItem(id: string, updates: Partial<Omit<Item, 'id'>>): Item | undefined {
  const items = read()
  const index = items.findIndex(i => i.id === id)
  if (index < 0) return undefined
  const merged: Item = enhance({ ...items[index], ...updates, id })
  items[index] = merged
  write(items)
  return merged
}

export function deleteItem(id: string): boolean {
  const items = read()
  const next = items.filter(i => i.id !== id)
  if (next.length === items.length) return false
  write(next)
  return true
}

export function isItemOwnedByUser(item: Item | undefined, user: any): boolean {
  if (!item || !user) return false
  if (item.ownerId && user.id && item.ownerId === user.id) return true
  const userCandidates = stringCandidates([user.id, user.username, user.email])
  if (userCandidates.length === 0) return false
  const itemCandidates = stringCandidates([item.ownerId, item.owner, item.ownerName])
  return userCandidates.some(candidate => itemCandidates.includes(candidate))
}

export function clearItems(){ localStorage.removeItem(KEY) }
