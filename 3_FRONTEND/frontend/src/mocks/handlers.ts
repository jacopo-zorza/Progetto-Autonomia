import { rest } from 'msw'

export const handlers = [
  rest.get('/api/hello', (req: any, res: any, ctx: any) => {
    return res(ctx.status(200), ctx.json({ message: 'Ciao dal mock API' }))
  })
]
