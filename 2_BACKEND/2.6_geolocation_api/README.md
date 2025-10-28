# 2.6 - Geolocation API

API avanzata per servizi di geolocalizzazione con geocoding, reverse geocoding e ricerca indirizzi.

## 📋 Panoramica

La **Geolocation API** permette di:
- ✅ **Geocoding**: convertire indirizzi in coordinate GPS
- ✅ **Reverse Geocoding**: convertire coordinate in indirizzi
- ✅ **Autocomplete**: cercare e suggerire indirizzi
- ✅ **Calcolo distanze**: tra due punti geografici
- ✅ **Ricerca vicinanza**: trovare items nelle vicinanze
- ✅ **Info città**: ottenere coordinate di città

## 🌍 Provider

Utilizza **Nominatim (OpenStreetMap)** - servizio gratuito e open source.

## 📡 Endpoints

### 1. Geocoding (Indirizzo → Coordinate)

```http
GET /api/geo/geocode?address=<indirizzo>
```

**Esempio:**
```bash
GET /api/geo/geocode?address=Via Roma 10, Milano
```

**Risposta (200):**
```json
{
  "success": true,
  "message": "Geocoding completato",
  "data": {
    "latitude": 45.4642,
    "longitude": 9.1900,
    "display_name": "Via Roma, Milano, Lombardia, Italia",
    "address": {
      "road": "Via Roma",
      "city": "Milano",
      "country": "Italia"
    }
  }
}
```

---

### 2. Reverse Geocoding (Coordinate → Indirizzo)

```http
GET /api/geo/reverse?lat=<latitude>&lon=<longitude>
```

**Esempio:**
```bash
GET /api/geo/reverse?lat=45.4642&lon=9.1900
```

**Risposta (200):**
```json
{
  "success": true,
  "message": "Reverse geocoding completato",
  "data": {
    "display_name": "Piazza del Duomo, Milano, Lombardia, Italia",
    "city": "Milano",
    "country": "Italia",
    "postcode": "20121",
    "road": "Piazza del Duomo"
  }
}
```

---

### 3. Ricerca Indirizzi (Autocomplete)

```http
GET /api/geo/search?q=<query>&limit=<numero>
```

**Query Parameters:**
- `q`: testo da cercare
- `limit`: numero risultati (default: 5, max: 10)

**Esempio:**
```bash
GET /api/geo/search?q=Milano&limit=3
```

**Risposta (200):**
```json
{
  "success": true,
  "message": "3 risultati trovati",
  "count": 3,
  "results": [
    {
      "display_name": "Milano, Lombardia, Italia",
      "latitude": 45.4642,
      "longitude": 9.1900,
      "type": "city"
    }
  ]
}
```

---

### 4. Calcolo Distanza

```http
GET /api/geo/distance?lat1=<lat1>&lon1=<lon1>&lat2=<lat2>&lon2=<lon2>
```

**Esempio:**
```bash
GET /api/geo/distance?lat1=45.4642&lon1=9.1900&lat2=45.0703&lon2=7.6869
```

**Risposta (200):**
```json
{
  "success": true,
  "distance_km": 126.45,
  "distance_m": 126450
}
```

---

### 5. Items Nelle Vicinanze

```http
GET /api/geo/nearby?lat=<lat>&lon=<lon>&radius=<km>
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `lat`: latitudine centro ricerca
- `lon`: longitudine centro ricerca
- `radius`: raggio in km (default: 10, max: 100)

**Esempio:**
```bash
GET /api/geo/nearby?lat=45.4642&lon=9.1900&radius=5
```

**Risposta (200):**
```json
{
  "success": true,
  "center": {
    "latitude": 45.4642,
    "longitude": 9.1900
  },
  "radius_km": 5,
  "count": 3,
  "items": [
    {
      "id": 1,
      "name": "Bicicletta",
      "price": 150.0,
      "distance_km": 1.2,
      "latitude": 45.4700,
      "longitude": 9.1850
    }
  ]
}
```

---

### 6. Info Città

```http
GET /api/geo/city/<city_name>?country=<paese>
```

**Query Parameters:**
- `country`: paese (default: Italy)

**Esempio:**
```bash
GET /api/geo/city/Roma?country=Italy
```

**Risposta (200):**
```json
{
  "success": true,
  "city": "Roma",
  "country": "Italy",
  "data": {
    "latitude": 41.9028,
    "longitude": 12.4964,
    "display_name": "Roma, Lazio, Italia"
  }
}
```

## 🏗️ Architettura

### Service Layer (`geolocation_service.py`)

Gestisce tutta la logica:

- **geocode()** - Indirizzo → Coordinate
- **reverse_geocode()** - Coordinate → Indirizzo
- **search_address()** - Autocomplete indirizzi
- **calculate_distance()** - Formula di Haversine
- **find_nearby_coordinates()** - Bounding box
- **is_within_radius()** - Verifica vicinanza
- **get_city_coordinates()** - Info città
- **format_address()** - Formattazione indirizzi

### Routes Layer (`geolocation_routes.py`)

Blueprint Flask con 6 endpoint REST.

## 🔧 Configurazione

### Rate Limiting

Nominatim richiede **max 1 richiesta/secondo**:

```python
MIN_REQUEST_INTERVAL = 1.0  # secondi
```

Il servizio gestisce automaticamente il rate limiting.

## 💡 Esempi d'Uso

### JavaScript

```javascript
// Geocoding
const response = await fetch('/api/geo/geocode?address=Milano');
const data = await response.json();
console.log(data.data.latitude, data.data.longitude);

// Autocomplete
const results = await fetch('/api/geo/search?q=Via Roma&limit=5');
const addresses = await results.json();
addresses.results.forEach(addr => {
  console.log(addr.display_name);
});

// Nearby items
const headers = { Authorization: `Bearer ${token}` };
const nearby = await fetch(
  '/api/geo/nearby?lat=45.46&lon=9.19&radius=10',
  { headers }
);
```

### Python

```python
import requests

# Geocoding
r = requests.get('http://localhost:5000/api/geo/geocode',
                 params={'address': 'Milano, Italia'})
print(r.json())

# Reverse
r = requests.get('http://localhost:5000/api/geo/reverse',
                 params={'lat': 45.4642, 'lon': 9.1900})
print(r.json())

# Distance
r = requests.get('http://localhost:5000/api/geo/distance',
                 params={
                     'lat1': 45.4642, 'lon1': 9.1900,
                     'lat2': 41.9028, 'lon2': 12.4964
                 })
print(f"Distanza: {r.json()['distance_km']} km")
```

## 🎯 Casi d'Uso

### 1. Form Pubblicazione Oggetto

```javascript
// L'utente digita l'indirizzo
const address = "Via Roma 10, Milano";

// Geocode per ottenere coordinate
const geo = await fetch(`/api/geo/geocode?address=${address}`);
const coords = await geo.json();

// Salva item con coordinate
await fetch('/api/items', {
  method: 'POST',
  body: JSON.stringify({
    name: "Bici",
    latitude: coords.data.latitude,
    longitude: coords.data.longitude
  })
});
```

### 2. Ricerca Oggetti Vicini

```javascript
// Ottieni posizione utente
navigator.geolocation.getCurrentPosition(async (pos) => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  
  // Trova items vicini
  const nearby = await fetch(
    `/api/geo/nearby?lat=${lat}&lon=${lon}&radius=10`,
    { headers: { Authorization: `Bearer ${token}` }}
  );
  
  const items = await nearby.json();
  console.log(`Trovati ${items.count} oggetti entro 10km`);
});
```

### 3. Autocomplete Indirizzo

```javascript
// Input con suggestions
const input = document.getElementById('address');
input.addEventListener('input', async (e) => {
  const query = e.target.value;
  
  if (query.length < 3) return;
  
  const results = await fetch(`/api/geo/search?q=${query}&limit=5`);
  const data = await results.json();
  
  // Mostra suggestions
  showSuggestions(data.results);
});
```

## ⚙️ Limitazioni

### Nominatim (OSM)

- **Rate limit**: 1 richiesta/secondo
- **No API key**: gratuito ma con limiti
- **Usage Policy**: solo uso ragionevole

### Alternative per Produzione

Per carichi elevati, considera:

- **Google Maps Geocoding API** (a pagamento)
- **Mapbox Geocoding API** (a pagamento)
- **Self-hosted Nominatim** (richiede setup server)

## 📊 Integrazione con Items API

L'Items API già supporta coordinate GPS:

```python
# Item model
latitude = db.Column(db.Float, nullable=True)
longitude = db.Column(db.Float, nullable=True)
```

La Geolocation API estende queste funzionalità con:
- Conversione automatica indirizzi
- Ricerca avanzata per vicinanza
- Suggerimenti indirizzi

## ✅ Test

```bash
# Geocoding
curl "http://localhost:5000/api/geo/geocode?address=Milano"

# Reverse
curl "http://localhost:5000/api/geo/reverse?lat=45.4642&lon=9.1900"

# Search
curl "http://localhost:5000/api/geo/search?q=Roma&limit=3"

# Distance
curl "http://localhost:5000/api/geo/distance?lat1=45.46&lon1=9.19&lat2=41.90&lon2=12.50"

# Nearby (con auth)
curl "http://localhost:5000/api/geo/nearby?lat=45.46&lon=9.19&radius=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Prossimi Sviluppi

- [ ] Cache risultati geocoding
- [ ] Supporto routing (percorsi stradali)
- [ ] Clustering markers su mappa
- [ ] Geofencing e notifiche
- [ ] Integrazione Google Maps (opzionale)
- [ ] Storico posizioni utente

## 📝 Note

- Il rate limiting è gestito automaticamente
- Le coordinate sono memorizzate nel database
- Per produzione, valuta servizi a pagamento per performance migliori
- OSM è ideale per sviluppo e piccoli progetti

---

**Sviluppato il:** 28 Ottobre 2025  
**Versione:** 1.0.0  
**Status:** ✅ Completo e funzionante

Implementazione API geolocalizzazione:
- Ricerca oggetti vicini
- Calcolo distanze
- Mappe integrate
- Filtri geografici
- Posizioni preferite

**Status**: 🔄 Futuro sviluppo