# 2.2 Models - ✅ Completato

Implementazione modelli SQLAlchemy integrati con Flask:

## Modelli Implementati

### User (Utenti)
- Gestione utenti con autenticazione
- Relazioni: items (venduti), messages (inviati), reviews (scritte)

### Item (Oggetti)
- Oggetti in vendita con geolocalizzazione (lat/lng)
- Relazioni: seller, transactions, reviews

### Message (Messaggi)
- Sistema di chat tra utenti
- Campi: sender_id, receiver_id, content, timestamp

### Transaction (Transazioni)
- Gestione pagamenti e vendite
- Campi: item_id, buyer_id, amount, status

### Review (Recensioni)
- Sistema valutazioni su oggetti
- Campi: user_id, item_id, rating, comment

## Integrazione
I modelli sono integrati nell'app Flask tramite Flask-SQLAlchemy:
- Database URI configurabile (SQLite/PostgreSQL)
- Creazione automatica tabelle con `db.create_all()`
- Endpoint test disponibile: `/api/models/test`

## File
- `models.py`: Definizione modelli SQLAlchemy
- `__init__.py`: Package export per import semplificati

**Status**: ✅ Modelli creati e integrati in Flask