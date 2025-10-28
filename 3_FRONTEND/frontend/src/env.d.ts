// Tipi minimi per import.meta.env (Vite)
interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly [key: string]: string | boolean | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
