export type Item = {
  id: string
  title: string
  description: string
  price?: number
  owner?: string
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
  const newItem: Item = { ...item, id: Date.now().toString() }
  items.unshift(newItem)
  write(items)
  return newItem
}

export function listItems(): Item[] {
  return read()
}

export function getItem(id: string): Item | undefined {
  return read().find(i => i.id === id)
}

export function clearItems(){ localStorage.removeItem(KEY) }
