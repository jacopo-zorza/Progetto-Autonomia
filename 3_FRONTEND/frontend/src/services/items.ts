export type Item = {
  id: string
  title: string
  description: string
  price?: number
  image?: string // URL o data-uri dell'immagine principale
  owner?: string
  category?: string
}

const KEY = 'pa_items'

function read(): Item[] {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

function write(items: Item[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function createItem(item: Omit<Item, 'id'>): Item {
  const items = read()
  // Genera un id più unico per evitare duplicati quando si creano molti elementi rapidamente
  const newItem: Item = { ...item, id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}` }
  items.unshift(newItem)
  write(items)
  return newItem
}

export function listItems(): Item[] {
  // Ritorna una copia ordinata per titolo (ascendente) per avere sempre
  // un elenco prevedibile nella UI
  return read().slice().sort((a, b) => {
    const ta = (a.title || '').toString().toLowerCase()
    const tb = (b.title || '').toString().toLowerCase()
    return ta.localeCompare(tb)
  })
}

export function getItem(id: string): Item | undefined {
  return read().find(i => i.id === id)
}

export function clearItems(){ localStorage.removeItem(KEY) }
