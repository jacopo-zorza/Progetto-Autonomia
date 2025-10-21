# 2.4 - Items API ✅# 2.4 Items API - In Sviluppo



API completa per la gestione degli **oggetti in vendita** (items) con CRUD, ricerca avanzata, filtri e geolocalizzazione.Implementazione API gestione oggetti:

- CRUD oggetti da vendere

## 📋 Funzionalità Implementate- Upload immagini

- Ricerca e filtri

- ✅ **CRUD completo**: Create, Read, Update, Delete items- Geolocalizzazione

- ✅ **Ricerca testuale**: Cerca in nome e descrizione- Categorie

- ✅ **Filtri avanzati**: Prezzo min/max, venditore, distanza

- ✅ **Geolocalizzazione**: Calcolo distanza e ricerca per raggio**Status**: 🔄 Futuro sviluppo
- ✅ **Ordinamento**: Per data, prezzo, nome
- ✅ **Paginazione**: Lista items con paginazione
- ✅ **Autenticazione JWT**: Protezione endpoint privati
- ✅ **Validazione dati**: Validazione completa input

---

## 🔧 File del Modulo

- **`items_service.py`**: Business logic e validazione
- **`items_routes.py`**: Endpoint API REST
- **`test_items_api.py`**: Test completi funzionalità

---

## 📡 Endpoint API

### 1. **GET /api/items** - Lista items con filtri

**Query Parameters**:
```
page, per_page, min_price, max_price, search, seller_id,
latitude, longitude, radius_km, order_by, order_dir
```

**Esempio**:
```bash
GET /api/items?search=bici&min_price=100&max_price=500
GET /api/items?latitude=45.4642&longitude=9.1900&radius_km=10
```

### 2. **GET /api/items/:id** - Dettaglio item

### 3. **POST /api/items** - Crea item (JWT)

**Body**:
```json
{
  "name": "Bicicletta",
  "description": "Usata, ottimo stato",
  "price": 250.50,
  "latitude": 45.4642,
  "longitude": 9.1900
}
```

### 4. **PUT /api/items/:id** - Aggiorna item (JWT, solo proprietario)

### 5. **DELETE /api/items/:id** - Elimina item (JWT, solo proprietario)

### 6. **GET /api/items/my-items** - Items utente (JWT)

---

## 🌍 Geolocalizzazione

Ricerca geografica con formula di **Haversine**:

```bash
# Items entro 5km da Milano
GET /api/items?latitude=45.4642&longitude=9.1900&radius_km=5
```

Response include `distance_km` per ogni item.

---

## 🧪 Test

```bash
cd /workspaces/Progetto-Autonomia/2_BACKEND/2.4_items_api
python3 test_items_api.py
```

**14 test passati**:
- ✅ CRUD completo
- ✅ Ricerca e filtri
- ✅ Geolocalizzazione
- ✅ Autenticazione
- ✅ Validazione

---

## 🚀 Come Usare

### Esempio Completo

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"pass123"}'

# 2. Crea item
curl -X POST http://localhost:5000/api/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell",
    "price": 350,
    "latitude": 45.4642,
    "longitude": 9.1900
  }'

# 3. Ricerca items vicini
curl "http://localhost:5000/api/items?latitude=45.4642&longitude=9.1900&radius_km=10"

# 4. I miei items
curl http://localhost:5000/api/items/my-items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Stato

**Status**: ✅ **COMPLETATO**  
**Data**: 21 Ottobre 2025  
**Test**: 14/14 passati

---

*Fase 2.4 completata* ✅
