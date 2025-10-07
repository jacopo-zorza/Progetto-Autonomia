# Progetto-Autonomia 

# Applicazione per la vendita di oggetti usati in viaggio


## Idee e funzionalità principali

- Registrazione e login utenti (acquirenti e venditori)
- Inserimento oggetti in vendita con foto, descrizione, prezzo e posizione geografica
- Ricerca e filtro degli oggetti disponibili vicino alla posizione dell’utente
- Sistema di messaggistica tra venditore e acquirente
- Pagamento integrato (PayPal, Stripe, ecc.)
- Notifiche per nuovi oggetti disponibili nella zona

## Struttura tecnica 

- Backend: Python (Flask) per gestire utenti, oggetti, transazioni e API
- Frontend: HTML, CSS, TypeScript (TS) (possibile uso di framework come React)
- Database: MySQL o FireBase per memorizzare utenti, oggetti e transazioni
- Geolocalizzazione: API Google Maps o OpenStreetMap per mostrare la posizione degli oggetti
- Hosting: Heroku, AWS o DigitalOcean

## Passaggi di sviluppo

- Progettazione delle pagine principali: home, login/registrazione, inserimento oggetto, lista oggetti, dettaglio oggetto, chat, profilo utente
- Definizione del modello dati (utenti, oggetti, messaggi, transazioni)
- Implementazione delle API REST per il backend
- Creazione del frontend responsive e intuitivo
- Integrazione della geolocalizzazione e del sistema di pagamento
- Test dell’applicazione con utenti reali

## Idee extra

- Sistema di recensioni per venditori/acquirenti
- Funzionalità di “oggetto in evidenza” per promuovere alcune inserzioni
- Supporto multilingua
- Versione mobile (web app PWA o app nativa)
- Modalità chiaro/scuro