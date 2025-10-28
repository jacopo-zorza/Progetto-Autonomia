# 2.8 - Images API

API per la gestione delle immagini degli oggetti in vendita.

## 📋 Panoramica

L'**Images API** permette agli utenti di:
- ✅ Caricare immagini per i propri oggetti
- ✅ Scaricare immagini in diverse dimensioni (original, medium, thumbnail)
- ✅ Eliminare immagini
- ✅ Impostare un'immagine come principale
- ✅ Ottenere la lista di tutte le immagini di un oggetto

## 🎯 Funzionalità

### Upload Immagini
- Supporta formati: **PNG, JPG, JPEG, GIF, WEBP**
- Dimensione massima: **5MB**
- Limite per oggetto: **5 immagini**
- Resize automatico in 3 dimensioni:
  - **Original**: dimensione originale
  - **Medium**: max 800x800px
  - **Thumbnail**: max 200x200px

### Sicurezza
- ✅ Validazione estensione file
- ✅ Validazione contenuto reale (anti-spoofing)
- ✅ Nomi file unici (UUID + timestamp)
- ✅ Solo il proprietario può caricare/eliminare immagini
- ✅ Autenticazione JWT richiesta per upload/delete

## 📡 Endpoints

### 1. Upload Immagine

```http
POST /api/images/upload/<item_id>
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Form Data:
{
  "image": <file>
}
```

**Risposta Success (201):**
```json
{
  "success": true,
  "message": "Immagine caricata con successo",
  "data": {
    "item_id": 1,
    "filename": "20251028_123456_uuid.jpg",
    "path": "item_1/20251028_123456_uuid.jpg",
    "thumbnail": "item_1/thumb_20251028_123456_uuid.jpg",
    "medium": "item_1/medium_20251028_123456_uuid.jpg",
    "size": 245678,
    "is_primary": true
  }
}
```

**Errori:**
- `400` - Formato non supportato, file troppo grande, limite raggiunto
- `401` - Non autenticato
- `403` - Non autorizzato (non proprietario)
- `404` - Item non trovato

---

### 2. Scarica Immagine

```http
GET /api/images/<item_id>/<filename>?size=original|medium|thumbnail
```

**Query Parameters:**
- `size` (opzionale): `original`, `medium`, `thumbnail` (default: `original`)

**Risposta Success (200):**
- Content-Type: `image/jpeg`
- Body: file immagine

---

### 3. Elimina Immagine

```http
DELETE /api/images/<item_id>/<filename>
Authorization: Bearer <access_token>
```

**Risposta Success (200):**
```json
{
  "success": true,
  "message": "3 file eliminati"
}
```

**Errori:**
- `401` - Non autenticato
- `403` - Non autorizzato
- `404` - Item o immagine non trovati

---

### 4. Lista Immagini Item

```http
GET /api/images/item/<item_id>
```

**Risposta Success (200):**
```json
{
  "success": true,
  "item_id": 1,
  "count": 3,
  "images": [
    {
      "filename": "20251028_123456_uuid1.jpg",
      "url": "/api/images/1/20251028_123456_uuid1.jpg",
      "thumbnail": "/api/images/1/20251028_123456_uuid1.jpg?size=thumbnail",
      "medium": "/api/images/1/20251028_123456_uuid1.jpg?size=medium",
      "is_primary": true
    },
    {
      "filename": "20251028_123457_uuid2.jpg",
      "url": "/api/images/1/20251028_123457_uuid2.jpg",
      "thumbnail": "/api/images/1/20251028_123457_uuid2.jpg?size=thumbnail",
      "medium": "/api/images/1/20251028_123457_uuid2.jpg?size=medium",
      "is_primary": false
    }
  ]
}
```

---

### 5. Imposta Immagine Principale

```http
PUT /api/images/set-primary/<item_id>/<filename>
Authorization: Bearer <access_token>
```

**Risposta Success (200):**
```json
{
  "success": true,
  "message": "Immagine principale aggiornata",
  "primary_image": "item_1/20251028_123456_uuid.jpg"
}
```

## 🏗️ Architettura

### Service Layer (`images_service.py`)

Il servizio gestisce tutta la logica di business:

- **validate_file_extension()** - Valida estensione file
- **validate_image_content()** - Verifica contenuto immagine reale
- **generate_unique_filename()** - Genera nome unico sicuro
- **save_image()** - Salva e crea resize
- **delete_image()** - Elimina immagine e versioni
- **get_image_path()** - Ottiene percorso completo
- **get_item_images_count()** - Conta immagini item
- **validate_upload_limit()** - Verifica limite

### Routes Layer (`images_routes.py`)

Flask Blueprint che espone gli endpoint REST.

### Storage

Le immagini sono salvate in:
```
2_BACKEND/2.1_flask_setup/uploads/
├── item_1/
│   ├── 20251028_123456_uuid.jpg          (original)
│   ├── thumb_20251028_123456_uuid.jpg    (200x200)
│   └── medium_20251028_123456_uuid.jpg   (800x800)
├── item_2/
│   └── ...
```

## 💡 Esempio d'Uso

### JavaScript/Frontend

```javascript
// Upload immagine
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('/api/images/upload/1', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const data = await response.json();
console.log('Immagine caricata:', data);

// Mostra thumbnail
const img = document.createElement('img');
img.src = data.data.thumbnail;
document.body.appendChild(img);
```

### Python/Testing

```python
import requests

# Upload
with open('photo.jpg', 'rb') as f:
    files = {'image': f}
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post('http://localhost:5000/api/images/upload/1',
                      files=files, headers=headers)
    print(r.json())

# Download
r = requests.get('http://localhost:5000/api/images/1/filename.jpg?size=thumbnail')
with open('downloaded.jpg', 'wb') as f:
    f.write(r.content)
```

### cURL

```bash
# Upload
curl -X POST http://localhost:5000/api/images/upload/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg"

# Download
curl http://localhost:5000/api/images/1/filename.jpg?size=thumbnail \
  -o thumbnail.jpg

# Delete
curl -X DELETE http://localhost:5000/api/images/1/filename.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Configurazione

### Variabili (in `images_service.py`)

```python
UPLOAD_FOLDER = '2_BACKEND/2.1_flask_setup/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGES_PER_ITEM = 5
THUMBNAIL_SIZE = (200, 200)
MEDIUM_SIZE = (800, 800)
```

## 📊 Integrazione con Item Model

Il modello `Item` include ora il campo:

```python
image_url = db.Column(db.String(500), nullable=True)
```

Questo campo memorizza il percorso relativo dell'**immagine principale** dell'oggetto.

## ✅ Testing

```bash
# Test manuale
cd 2_BACKEND/2.1_flask_setup
python3 run.py

# Test endpoints
# 1. Registrati e ottieni token
# 2. Crea un item
# 3. Upload immagine per quell'item
# 4. Verifica che venga salvata correttamente
```

## 🚀 Prossimi Sviluppi

- [ ] Test automatizzati completi
- [ ] Storage cloud (AWS S3, Azure Blob)
- [ ] Compressione avanzata
- [ ] Supporto video
- [ ] Watermarking automatico
- [ ] Riconoscimento immagini inappropriate (AI)

## 📝 Note

- Le immagini vengono automaticamente ottimizzate (quality 85-90%)
- Le immagini RGBA vengono convertite in RGB
- Se si elimina un item, le sue immagini rimangono (TODO: cleanup automatico)
- Per produzione, considera CDN per servire le immagini

---

**Sviluppato il:** 28 Ottobre 2025  
**Versione:** 1.0.0  
**Status:** ✅ Completo e funzionante
