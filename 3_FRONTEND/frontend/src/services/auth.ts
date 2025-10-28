const AUTH_KEY = 'pa_auth'

export function login(username: string, password: string): Promise<boolean> {
  // Mock semplice: qualsiasi credenziale non vuota passa
  return new Promise((res) => {
    const ok = username.trim() !== '' && password.trim() !== ''
    if (ok) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: username }))
    }
    setTimeout(() => res(ok), 300)
  })
}

export function logout(){
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(){
  return localStorage.getItem(AUTH_KEY) !== null
}

export function getUser(){
  const v = localStorage.getItem(AUTH_KEY)
  return v ? JSON.parse(v) : null
}
