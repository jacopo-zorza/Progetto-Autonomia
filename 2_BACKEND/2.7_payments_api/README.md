# 2.7 - Payments API

API REST per gestione pagamenti e transazioni nella piattaforma di scambio oggetti.

## 📋 Panoramica

Sistema completo di gestione pagamenti con:
- Creazione transazioni
- Processamento pagamenti (mock provider)
- Conferma pagamenti in contanti
- Gestione stati transazioni
- Storico acquisti/vendite
- Calcolo bilancio utente

## 🎯 Funzionalità Implementate

### Service Layer (payments_service.py)
- ✅ Creazione transazioni con validazione
- ✅ Mock payment provider (Stripe/PayPal)
- ✅ Conferma pagamenti contanti da seller
- ✅ Cancellazione transazioni
- ✅ Query acquisti/vendite utente
- ✅ Calcolo bilancio finanziario

### REST API (payments_routes.py)
- ✅ 8 endpoint protetti con JWT
- ✅ Gestione completa ciclo vita transazione
- ✅ Validazione autorizzazioni (buyer/seller)
- ✅ Response standardizzate

### Testing (test_payments_api.py)
- ✅ 13 test completi
- ✅ 100% test passing
- ✅ Copertura flussi principali
- ✅ Test autorizzazioni

## 🔌 API Endpoints

### POST /api/payments/transaction
Crea una nuova transazione

**Response (201):** Transazione creata con success=true

### POST /api/payments/process/<transaction_id>
Processa pagamento con provider esterno (mock - 90% success rate)

### POST /api/payments/confirm-cash/<transaction_id>
Conferma ricezione pagamento in contanti (solo seller)

### POST /api/payments/cancel/<transaction_id>
Cancella transazione

### GET /api/payments/transaction/<transaction_id>
Ottiene dettagli transazione (solo buyer/seller)

### GET /api/payments/my-purchases
Lista acquisti dell'utente

### GET /api/payments/my-sales
Lista vendite dell'utente

### GET /api/payments/balance
Calcola bilancio finanziario utente

## 💳 Metodi di Pagamento

- **cash**: Contanti (richiede conferma manuale da seller)
- **stripe**: Carta di credito via Stripe (mock)
- **paypal**: PayPal (mock)
- **bank_transfer**: Bonifico bancario (mock)

## 🧪 Testing

```bash
cd 2_BACKEND/2.7_payments_api
python test_payments_api.py -v
```

**Risultato:** 13/13 test passing ✅

**Status**: ✅ Completato