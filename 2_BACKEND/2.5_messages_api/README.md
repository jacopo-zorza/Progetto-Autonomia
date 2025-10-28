# 2.5 - Messages API ✅

API completa per **messaggistica tra utenti** (chat) con thread conversazioni, notifiche e gestione messaggi non letti.

## 📋 Funzionalità

- ✅ Invio/Ricezione messaggi
- ✅ Thread conversazioni
- ✅ Lista conversazioni con metadati
- ✅ Messaggi non letti
- ✅ Mark as read
- ✅ 9 endpoint REST
- ✅ 15/15 test passati

## 📡 Endpoint Principali

```
POST   /api/messages                           - Invia messaggio
GET    /api/messages/inbox                     - Messaggi ricevuti
GET    /api/messages/sent                      - Messaggi inviati
GET    /api/messages/conversations             - Lista chat
GET    /api/messages/conversation/:user_id     - Thread
PUT    /api/messages/:id/read                  - Segna letto
PUT    /api/messages/conversation/:id/read     - Segna conversazione letta
GET    /api/messages/unread-count              - Conteggio non letti
DELETE /api/messages/:id                       - Elimina
```

## 🚀 Esempio d'Uso

```bash
# 1. Invia messaggio
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiver_id": 5, "content": "Ciao!"}'

# 2. Vedi inbox
curl http://localhost:5000/api/messages/inbox \
  -H "Authorization: Bearer TOKEN"

# 3. Apri conversazione
curl http://localhost:5000/api/messages/conversation/5 \
  -H "Authorization: Bearer TOKEN"

# 4. Segna come letto
curl -X PUT http://localhost:5000/api/messages/conversation/5/read \
  -H "Authorization: Bearer TOKEN"
```

## 🧪 Test

```bash
python3 test_messages_api.py
```

## 📊 Stato

✅ COMPLETATO - 21/10/2025
