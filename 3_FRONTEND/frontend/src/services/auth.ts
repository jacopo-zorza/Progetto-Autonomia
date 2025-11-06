const AUTH_KEY = 'pa_auth'

const USERS_KEY = 'pa_users'

function readUsers(): any[] {
  const raw = localStorage.getItem(USERS_KEY)
  return raw ? JSON.parse(raw) : []
}

function writeUsers(users: any[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

async function createLocalUser(payload: any){
  const users = readUsers()
  const newUser = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    username: payload.username,
    email: payload.email,
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone: payload.phone
  }
  users.unshift(newUser)
  writeUsers(users)
  // salva auth con token mock
  await saveAuth({ user: newUser, access_token: 'local-mock-token', refresh_token: 'local-mock-refresh' })
  return newUser
}

async function saveAuth(data: any){
  // salva token e user in localStorage
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  // dispatch event so other components can react
  try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
}

export function updateUserProfile(updates: Record<string, any>){
  // Legge auth corrente, merge con updates e riscrive
  const raw = localStorage.getItem(AUTH_KEY)
  if(!raw) return null
  try{
    const auth = JSON.parse(raw)
    auth.user = { ...(auth.user || {}), ...updates }
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
    return auth.user
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
  return v ? JSON.parse(v).user : null
}
