export type Message = { id: string; from: string; text: string; ts: number }

const KEY = 'pa_messages'

// Store locale per simulare le conversazioni in assenza del backend reale.

function read(){
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : {}
}

function write(data: any){
  // Persistiamo immediatamente ogni modifica così la chat resta consistente.
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function sendMessage(conversationId: string, from: string, text: string){
  const data = read()
  const list: Message[] = data[conversationId] || []
  const msg: Message = { id: Date.now().toString(), from, text, ts: Date.now() }
  list.push(msg)
  data[conversationId] = list
  write(data)
  return msg
}

export function getMessages(conversationId: string){
  const data = read()
  return data[conversationId] || []
}
