# 3. Frontend - In Pianificazione

Sviluppo interfaccia utente:
- HTML/CSS responsive
- TypeScript interactions
- Framework integrations
- Mobile-first design
- PWA capabilities

**Status**: 🔄 Futuro sviluppo (dopo backend)

## Obiettivo
Realizzare l'interfaccia utente dell'app conforme allo schema iniziale: UI reattiva, accessibile, offline-capable (PWA), integrata con le API backend e testabile.

## Scaffolding iniziale creato
Ho creato uno scaffold Vite + React + TypeScript + Tailwind nella cartella `3_FRONTEND/frontend` con i file minimi per partire in sviluppo:

- `package.json` (script dev/build/preview)
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`, `src/App.tsx`
- `src/components/layout/Header.tsx` e `Footer.tsx`
- `src/styles/index.css` (Tailwind entry)
- `postcss.config.cjs`, `tailwind.config.cjs`
- `manifest.webmanifest` (bozza)
- `.gitignore`
- `src/mocks/README.md` (cartella di partenza per mock API)

## Come avviare (localmente)
Apri una shell nella cartella `3_FRONTEND/frontend` e esegui:

```bash
npm install
npm run dev
```

Il dev server Vite predefinito usa la porta 5173.

## Prossimi passi (primo sprint)
1. Configurare Tailwind & PostCSS (già predisposto, finalizzare dipendenze)
2. Aggiungere routing (React Router) e pagina Home
3. Preparare mocks API (MSW) in `src/mocks`
4. Aggiungere PWA (`vite-plugin-pwa`) e manifest dettagliato
5. Aggiungere linting, formatting e test (ESLint, Prettier, Vitest)

Se vuoi, eseguo subito `npm install` e avvio il dev server nel container oppure procedo ad aggiungere React Router e MSW; dimmi quale preferisci come prossimo passo e procedo passo per passo.