// Chiavi di storage locale usate per simulare la persistenza lato client.
const AUTH_KEY = 'pa_auth'

const USERS_KEY = 'pa_users'

function readUsers(): any[] {
  // Recupera l'elenco utenti salvato localmente per supportare il fallback.
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
  // Normalizza il saldo portafoglio evitando valori negativi o NaN.
  if (!user) return user
  const nextBalance = sanitizeWalletValue(user.walletBalance)
  if (user.walletBalance === nextBalance) return user
  return { ...user, walletBalance: nextBalance }
}

function syncUserRecord(user: any) {
  // Aggiorna la cache locale utente in modo da rileggere dati coerenti dopo update.
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
  // Genera un account locale quando il backend non risponde.
  const users = readUsers()
  const newUser = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    username: payload.username,
    email: payload.email,
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone: payload.phone,
    profile_image: payload.profile_image || null,
    walletBalance: 0
  }
  users.unshift(newUser)
  writeUsers(users)
  // salva auth con token mock
  await saveAuth({ user: newUser, access_token: 'local-mock-token', refresh_token: 'local-mock-refresh' })
  return newUser
}

async function saveAuth(data: any){
  // Persistiamo i token simulati e notifichiamo gli altri componenti dell'app.
  const sanitizedUser = ensureWallet(data?.user)
  const payload = sanitizedUser ? { ...data, user: sanitizedUser } : data
  // salva token e user in localStorage
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
  if (sanitizedUser) syncUserRecord(sanitizedUser)
  // dispatch event so other components can react
  try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
}

export async function updateUserProfile(updates: Record<string, any>){
  const normalizedUpdates = { ...updates }
  if (normalizedUpdates.image !== undefined && normalizedUpdates.profile_image === undefined) {
    normalizedUpdates.profile_image = normalizedUpdates.image
  }
  // Legge auth corrente, merge con updates e riscrive
  const raw = localStorage.getItem(AUTH_KEY)
  if(!raw) return null

  try {
    const auth = JSON.parse(raw)
    const token: string | undefined = auth?.access_token

    if (token) {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(normalizedUpdates)
      })

      const body = await res.json().catch(() => ({}))

      if (res.ok && body.success && body.user) {
        const user = ensureWallet(body.user)
        auth.user = user
        localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
        syncUserRecord(user)
        try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
        return user
      }

      throw new Error(body.message || 'Aggiornamento profilo non riuscito')
    }
  } catch (err) {
    console.warn('Aggiornamento profilo sul server fallito, eseguo fallback locale', err)
  }

  try {
    // Fallback offline: aggiorna soltanto la copia locale.
    const auth = JSON.parse(raw)
    const merged = { ...(auth.user || {}), ...normalizedUpdates }
    const user = ensureWallet(merged)
    auth.user = user
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    syncUserRecord(user)
    try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
    return user
  } catch (e) {
    return null
  }
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
  // Aggiorna il saldo e notifica i listener solo se il risultato resta valido.
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

export function getAccessToken(): string | null {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    const auth = JSON.parse(raw)
    return typeof auth?.access_token === 'string' ? auth.access_token : null
  } catch (error) {
    return null
  }
}
