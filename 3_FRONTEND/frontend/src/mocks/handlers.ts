import { rest } from 'msw'

export const handlers = [
  rest.get('/api/hello', (req: any, res: any, ctx: any) => {
    return res(ctx.status(200), ctx.json({ message: 'Ciao dal mock API' }))
  }),

  // Mock per la registrazione - intercetta POST /api/auth/register
  rest.post('/api/auth/register', async (req: any, res: any, ctx: any) => {
    try {
      const body = await req.json()
      // semplice validazione minima
      if (!body || !body.email) {
        return res(ctx.status(400), ctx.json({ error: 'Manca email' }))
      }

      // Risposta finta di successo
      return res(
        ctx.status(201),
        ctx.json({ id: `user_${Date.now()}`, email: body.email, message: 'registered (mock)' })
      )
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Invalid request' }))
    }
  })
]
