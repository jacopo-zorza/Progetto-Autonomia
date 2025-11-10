const AUTH_KEY = 'pa_auth'

const USERS_KEY = 'pa_users'

function readUsers(): any[] {
  const raw = localStorage.getItem(USERS_KEY)
  return raw ? JSON.parse(raw) : []
}

function writeUsers(users: any[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function sanitizeWalletValue(value: any): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0
  const normalized = Math.max(0, parsed)
  return Number(normalized.toFixed(2))
}

function ensureWallet(user: any) {
  if (!user) return user
  const nextBalance = sanitizeWalletValue(user.walletBalance)
  if (user.walletBalance === nextBalance) return user
  return { ...user, walletBalance: nextBalance }
}

function syncUserRecord(user: any) {
  if (!user || !user.id) return
  const users = readUsers()
  const index = users.findIndex(u => u.id === user.id)
  const payload = { ...user }
  if (index >= 0) {
    users[index] = { ...users[index], ...payload }
  } else {
    users.unshift(payload)
  }
  writeUsers(users)
}

async function createLocalUser(payload: any){
  const users = readUsers()
  const newUser = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    username: payload.username,
    email: payload.email,
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone: payload.phone,
    walletBalance: 0
  }
  users.unshift(newUser)
  writeUsers(users)
  // salva auth con token mock
  await saveAuth({ user: newUser, access_token: 'local-mock-token', refresh_token: 'local-mock-refresh' })
  return newUser
}

async function saveAuth(data: any){
  const sanitizedUser = ensureWallet(data?.user)
  const payload = sanitizedUser ? { ...data, user: sanitizedUser } : data
  // salva token e user in localStorage
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
  if (sanitizedUser) syncUserRecord(sanitizedUser)
  // dispatch event so other components can react
  try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
}

export function updateUserProfile(updates: Record<string, any>){
  // Legge auth corrente, merge con updates e riscrive
  const raw = localStorage.getItem(AUTH_KEY)
  if(!raw) return null
  try{
    const auth = JSON.parse(raw)
    const merged = { ...(auth.user || {}), ...updates }
    const user = ensureWallet(merged)
    auth.user = user
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    syncUserRecord(user)
    try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
    return user
  }catch(e){ return null }
}

export async function register(payload: { username: string; email: string; password: string; first_name?: string; last_name?: string; phone?: string }): Promise<{ ok: boolean; message?: string }>{
  try{
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const j = await res.json()
    if(res.ok && j.success){
      // salva auth
      await saveAuth({ user: j.user, access_token: j.access_token, refresh_token: j.refresh_token })
      return { ok: true }
    }
    return { ok: false, message: j.message || 'Errore registrazione' }
  }catch(err:any){
    // Se il backend non è disponibile, facciamo un fallback locale salvando
    // l'utente in localStorage per permettere lo sviluppo senza server.
    try{
      const localUser = await createLocalUser(payload)
      return { ok: true, message: 'Registrazione locale creata' }
    }catch(e:any){
      return { ok: false, message: err.message || 'Errore registrazione locale' }
    }
  }
}

export async function login(username: string, password: string): Promise<boolean>{
  try{
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const j = await res.json()
    if(res.ok && j.success){
      await saveAuth({ user: j.user, access_token: j.access_token, refresh_token: j.refresh_token })
      return true
    }
    return false
  }catch(err){
    return false
  }
}

export function logout(){
  localStorage.removeItem(AUTH_KEY)
  try{
    window.dispatchEvent(new Event('auth-changed'))
  }catch{}
}

export function isAuthenticated(){
  return localStorage.getItem(AUTH_KEY) !== null
}

export function getUser(){
  const v = localStorage.getItem(AUTH_KEY)
  if(!v) return null
  try{
    const auth = JSON.parse(v)
    return auth.user ? ensureWallet(auth.user) : null
  }catch(e){
    return null
  }
}

export function getWalletBalance(): number {
  const user = getUser()
  return user && typeof user.walletBalance === 'number' ? user.walletBalance : 0
}

export function adjustWalletBalance(delta: number): number | null {
  const raw = localStorage.getItem(AUTH_KEY)
  if(!raw) return null
  try{
    const auth = JSON.parse(raw)
    if(!auth.user) return null
    const user = ensureWallet(auth.user)
    const next = Number((user.walletBalance + delta).toFixed(2))
    if (Number.isNaN(next) || next < 0) return null
    const updatedUser = { ...user, walletBalance: next }
    auth.user = updatedUser
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    syncUserRecord(updatedUser)
    try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
    return next
  }catch(e){
    return null
  }
}
