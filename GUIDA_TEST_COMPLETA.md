# 🧪 GUIDA TEST COMPLETA - Progetto Autonomia

Questa guida contiene tutti i comandi per testare il sistema Payments API e l'intero backend.

---

## 🚀 1. Avvio Server

```bash
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.1_flask_setup
python run.py
```

**Output atteso:**
```
✅ SQLAlchemy configurato con sqlite
✅ Database sqlite connesso
🚀 Avvio Flask su http://0.0.0.0:5000
📊 Database: sqlite
🔧 Debug mode: True
```

**Server accessibile:** http://localhost:5000

---

## 🧪 2. Test Automatizzati

### Test Completo Sistema
```bash
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.1_flask_setup
python test_api.py
```

### Test Items API
```bash
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.4_items_api
python test_items_api.py -v
```

### Test Messages API
```bash
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.5_messages_api
python test_messages_api.py -v
```

### Test Payments API (NUOVO)
```bash
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.7_payments_api
python test_payments_api.py -v
```

**Output atteso:**
```
✅ test_01_create_transaction ........................ PASS
✅ test_02_create_transaction_own_item ............... PASS
✅ test_03_create_transaction_sold_item .............. PASS
✅ test_04_process_payment_stripe .................... PASS
✅ test_05_process_payment_unauthorized .............. PASS
✅ test_06_confirm_cash_payment ...................... PASS
✅ test_07_confirm_cash_unauthorized ................. PASS
✅ test_08_cancel_transaction ........................ PASS
✅ test_09_get_transaction ........................... PASS
✅ test_10_get_transaction_unauthorized .............. PASS
✅ test_11_get_my_purchases .......................... PASS
✅ test_12_get_my_sales .............................. PASS
✅ test_13_get_balance ............................... PASS

Ran 13 tests in ~11s - OK ✅
```

### Test Tutti i Moduli (One-liner)
```bash
cd /workspaces/Progetto-Autonomia && \
  for dir in 2_BACKEND/2.4_items_api 2_BACKEND/2.5_messages_api 2_BACKEND/2.7_payments_api; do \
    echo "Testing $dir..." && cd "$dir" && python test_*.py && cd -; \
  done
```

---

## 🔧 3. Test Manuali con curl

### Setup: Variabili Ambiente
```bash
export BASE_URL="http://localhost:5000"
export TOKEN=""  # Verrà popolato dopo login
```

### 3.1 Health Check
```bash
curl -X GET $BASE_URL/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

### 3.2 Status API
```bash
curl -X GET $BASE_URL/api/status
```

**Response:**
```json
{
  "api_version": "1.0.0",
  "current_phase": "2.7 - Payments API Integrated",
  "features": {
    "authentication": "active",
    "payments": "active"
  }
}
```

---

### 3.3 Registrazione Utente
```bash
# Seller
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seller_test",
    "email": "seller@test.com",
    "password": "password123"
  }'

# Buyer
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "buyer_test",
    "email": "buyer@test.com",
    "password": "password123"
  }'
```

---

### 3.4 Login
```bash
# Login Seller
SELLER_TOKEN=$(curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seller_test",
    "password": "password123"
  }' | jq -r '.access_token')

echo "Seller Token: $SELLER_TOKEN"

# Login Buyer
BUYER_TOKEN=$(curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "buyer_test",
    "password": "password123"
  }' | jq -r '.access_token')

echo "Buyer Token: $BUYER_TOKEN"
```

---

### 3.5 Creare Item
```bash
curl -X POST $BASE_URL/api/items \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bicicletta usata",
    "description": "Mountain bike in ottime condizioni",
    "price": 150.00,
    "latitude": 45.4642,
    "longitude": 9.1900
  }'
```

**Salva l'ID dell'item dalla response:**
```bash
ITEM_ID=1  # Sostituisci con ID reale
```

---

## 💳 4. Test Payments API

### 4.1 Creare Transazione (Buyer)
```bash
curl -X POST $BASE_URL/api/payments/transaction \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": '$ITEM_ID',
    "payment_method": "cash",
    "notes": "Ci vediamo alle 15 in Piazza Duomo"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Transazione creata",
  "transaction": {
    "id": 1,
    "item_id": 1,
    "buyer_id": 2,
    "seller_id": 1,
    "amount": 150.0,
    "status": "pending",
    "payment_method": "cash"
  }
}
```

**Salva Transaction ID:**
```bash
TRANSACTION_ID=1  # Sostituisci con ID reale
```

---

### 4.2 Processare Pagamento Online (Buyer)
```bash
# Solo per metodi stripe/paypal
curl -X POST $BASE_URL/api/payments/process/$TRANSACTION_ID \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "stripe"
  }'
```

**Response (90% successo):**
```json
{
  "success": true,
  "message": "Pagamento completato",
  "data": {
    "transaction_id": 1,
    "payment_id": "mock_stripe_ch_abc123",
    "status": "completed"
  }
}
```

---

### 4.3 Confermare Pagamento Contanti (Seller)
```bash
curl -X POST $BASE_URL/api/payments/confirm-cash/$TRANSACTION_ID \
  -H "Authorization: Bearer $SELLER_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Pagamento in contanti confermato"
}
```

---

### 4.4 Ottenere Dettagli Transazione
```bash
# Come buyer
curl -X GET $BASE_URL/api/payments/transaction/$TRANSACTION_ID \
  -H "Authorization: Bearer $BUYER_TOKEN"

# Come seller
curl -X GET $BASE_URL/api/payments/transaction/$TRANSACTION_ID \
  -H "Authorization: Bearer $SELLER_TOKEN"
```

---

### 4.5 Lista Acquisti (Buyer)
```bash
curl -X GET $BASE_URL/api/payments/my-purchases \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "purchases": [
    {
      "id": 1,
      "item_id": 1,
      "amount": 150.0,
      "status": "completed",
      "payment_method": "cash"
    }
  ]
}
```

---

### 4.6 Lista Vendite (Seller)
```bash
curl -X GET $BASE_URL/api/payments/my-sales \
  -H "Authorization: Bearer $SELLER_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "sales": [
    {
      "id": 1,
      "item_id": 1,
      "buyer_id": 2,
      "amount": 150.0,
      "status": "completed"
    }
  ]
}
```

---

### 4.7 Bilancio Finanziario (Seller)
```bash
curl -X GET $BASE_URL/api/payments/balance \
  -H "Authorization: Bearer $SELLER_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "total_sales": 150.0,
  "total_purchases": 0.0,
  "balance": 150.0,
  "sales_count": 1,
  "purchases_count": 0
}
```

---

### 4.8 Cancellare Transazione
```bash
curl -X POST $BASE_URL/api/payments/cancel/$TRANSACTION_ID \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Transazione cancellata"
}
```

---

## 🔄 5. Flussi Completi End-to-End

### Flusso A: Pagamento Contanti Completo
```bash
#!/bin/bash
# Script completo pagamento contanti

BASE_URL="http://localhost:5000"

# 1. Registra utenti
echo "1. Registrazione utenti..."
curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"seller1","email":"seller1@test.com","password":"pass123"}' > /dev/null

curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"buyer1","email":"buyer1@test.com","password":"pass123"}' > /dev/null

# 2. Login
echo "2. Login..."
SELLER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seller1","password":"pass123"}' | jq -r '.access_token')

BUYER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"buyer1","password":"pass123"}' | jq -r '.access_token')

# 3. Seller crea item
echo "3. Creazione item..."
ITEM_ID=$(curl -s -X POST $BASE_URL/api/items \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smartphone","description":"iPhone usato","price":300}' | jq -r '.item.id')

echo "Item ID: $ITEM_ID"

# 4. Buyer crea transazione
echo "4. Creazione transazione..."
TRANSACTION_ID=$(curl -s -X POST $BASE_URL/api/payments/transaction \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id":'$ITEM_ID',"payment_method":"cash"}' | jq -r '.transaction.id')

echo "Transaction ID: $TRANSACTION_ID"

# 5. Seller conferma pagamento
echo "5. Conferma pagamento..."
curl -s -X POST $BASE_URL/api/payments/confirm-cash/$TRANSACTION_ID \
  -H "Authorization: Bearer $SELLER_TOKEN" | jq '.'

# 6. Verifica bilancio seller
echo "6. Bilancio seller:"
curl -s -X GET $BASE_URL/api/payments/balance \
  -H "Authorization: Bearer $SELLER_TOKEN" | jq '.'

echo "✅ Flusso completato!"
```

---

### Flusso B: Pagamento Stripe Mock
```bash
#!/bin/bash
# Script pagamento online mock

BASE_URL="http://localhost:5000"

# Login (assume utenti già creati)
BUYER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"buyer1","password":"pass123"}' | jq -r '.access_token')

# Crea transazione
echo "1. Creazione transazione Stripe..."
TRANSACTION_ID=$(curl -s -X POST $BASE_URL/api/payments/transaction \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id":1,"payment_method":"stripe"}' | jq -r '.transaction.id')

# Processa pagamento
echo "2. Processamento pagamento..."
curl -s -X POST $BASE_URL/api/payments/process/$TRANSACTION_ID \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payment_method":"stripe"}' | jq '.'

echo "✅ Pagamento processato (90% successo mock)"
```

---

## 🐛 6. Test Casi Errore

### Errore: Comprare proprio item
```bash
curl -X POST $BASE_URL/api/payments/transaction \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id":'$ITEM_ID',"payment_method":"cash"}'

# Response:
# {"success": false, "message": "Non puoi acquistare il tuo stesso oggetto"}
```

---

### Errore: Item già venduto
```bash
# Prima transazione completa l'item
# Seconda transazione sullo stesso item:
curl -X POST $BASE_URL/api/payments/transaction \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id":'$ITEM_ID',"payment_method":"cash"}'

# Response:
# {"success": false, "message": "Oggetto già venduto"}
```

---

### Errore: Autorizzazione negata
```bash
# Buyer prova a confermare contanti (solo seller può)
curl -X POST $BASE_URL/api/payments/confirm-cash/$TRANSACTION_ID \
  -H "Authorization: Bearer $BUYER_TOKEN"

# Response:
# {"success": false, "message": "Solo il venditore può confermare"}
```

---

## 📊 7. Verifica Database

```bash
# Connetti al database SQLite
sqlite3 /workspaces/Progetto-Autonomia/1_PROGETTAZIONE_BASE/app.db

# Query transazioni
SELECT * FROM 'transaction';

# Query items venduti
SELECT * FROM item WHERE is_sold = 1;

# Bilancio utente
SELECT 
  seller_id,
  SUM(amount) as total_sales,
  COUNT(*) as sales_count
FROM 'transaction'
WHERE status = 'completed'
GROUP BY seller_id;

# Exit
.exit
```

---

## 🔍 8. Debug e Logging

### Verifica Logs Flask
```bash
# Avvia server con logging verbose
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.1_flask_setup
FLASK_ENV=development python run.py
```

### Test con Verbosity
```bash
python test_payments_api.py -v
```

### Check Errori Sistema
```bash
# In VS Code
# Premi Ctrl+Shift+M per vedere "Problems"
# O usa comando:
cat /workspaces/Progetto-Autonomia/2_BACKEND/2.7_payments_api/*.py | python -m py_compile
```

---

## 📝 9. Checklist Test Completo

### Pre-Deploy Checklist
- [ ] Tutti i test automatizzati passing
- [ ] Test manuali endpoint payments
- [ ] Verifica autorizzazioni (buyer/seller)
- [ ] Test casi errore (item venduto, auto-acquisto)
- [ ] Verifica database consistency
- [ ] Test flusso completo contanti
- [ ] Test flusso completo online
- [ ] Verifica bilanci corretti
- [ ] Test cancellazione transazioni
- [ ] Zero errori nel codice

### Comando Quick Check
```bash
#!/bin/bash
echo "🧪 Quick Test Suite"
echo "===================="

# 1. Server health
echo -n "1. Server Health: "
curl -s http://localhost:5000/health | jq -r '.status'

# 2. Database
echo -n "2. Database: "
curl -s http://localhost:5000/api/status | jq -r '.features.payments'

# 3. Test suite
echo "3. Running tests..."
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.7_payments_api
python test_payments_api.py 2>&1 | grep "Ran"

echo "✅ Quick check completato"
```

---

## 🎯 10. Comandi Utili

### Reset Database
```bash
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.1_flask_setup
rm -f ../../1_PROGETTAZIONE_BASE/app.db
python init_db.py
```

### Verifica Struttura
```bash
cd /workspaces/Progetto-Autonomia
tree -L 3 2_BACKEND/
```

### Count Lines of Code
```bash
find 2_BACKEND/ -name "*.py" -exec wc -l {} + | tail -1
```

### Find Errors
```bash
find 2_BACKEND/ -name "*.py" -exec python -m py_compile {} \;
```

---

## 🚀 Quick Start (All-in-One)

```bash
#!/bin/bash
# Quick start completo

cd /workspaces/Progetto-Autonomia

# 1. Setup database
cd 2_BACKEND/2.1_flask_setup
python init_db.py

# 2. Run tests
cd ../2.7_payments_api
python test_payments_api.py

# 3. Start server (background)
cd ../2.1_flask_setup
python run.py &

# 4. Wait for server
sleep 3

# 5. Test API
python test_api.py

echo "✅ Sistema pronto!"
```

---

**Guida Completa Test - Payments API & Backend**  
**Versione:** 1.0  
**Data:** 28 Gennaio 2025
