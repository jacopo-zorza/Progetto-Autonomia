export type CheckoutPayload = {
  itemId: string
  amount: number
  shipping: number
  serviceFee: number
  paymentMethod: 'card' | 'paypal' | 'bank' | 'wallet'
  buyer: {
    fullName: string
    email: string
    phone?: string
  }
  address: {
    line1: string
    city: string
    zip: string
  }
  note?: string
}

export type OrderRecord = CheckoutPayload & {
  id: string
  createdAt: string
  total: number
}

const KEY = 'pa_orders'

function read(): OrderRecord[] {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

function write(orders: OrderRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(orders))
}

export function createOrder(payload: CheckoutPayload): OrderRecord {
  const orders = read()
  const total = Number((payload.amount + payload.shipping + payload.serviceFee).toFixed(2))
  const order: OrderRecord = {
    ...payload,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    total
  }
  orders.unshift(order)
  write(orders)
  return order
}

export function listOrders(): OrderRecord[] {
  return read()
}
