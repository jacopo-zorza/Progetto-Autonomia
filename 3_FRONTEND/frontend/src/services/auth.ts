const AUTH_KEY = 'pa_auth'

async function saveAuth(data: any){
  // salva token e user in localStorage
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  // dispatch event so other components can react
  try{ window.dispatchEvent(new Event('auth-changed')) }catch(e){}
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
    return { ok: false, message: err.message }
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
}

export function isAuthenticated(){
  return localStorage.getItem(AUTH_KEY) !== null
}

export function getUser(){
  const v = localStorage.getItem(AUTH_KEY)
  return v ? JSON.parse(v).user : null
}
