# 2.3 Auth API - ✅ Completato

Implementazione completa API autenticazione con JWT tokens.

## 🔐 Funzionalità Implementate

### Endpoint Disponibili

#### 1. **POST /api/auth/register** - Registrazione
Crea nuovo utente con validazione completa.

**Body**:
```json
{
  "username": "mario_rossi",
  "email": "mario@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Utente registrato con successo",
  "user": {
    "id": 1,
    "username": "mario_rossi",
    "email": "mario@example.com",
    "created_at": "2025-10-10T07:09:04"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

#### 2. **POST /api/auth/login** - Login
Effettua login con username o email.

**Body**:
```json
{
  "username": "mario_rossi",
  "password": "password123"
}
```

**Response** (200): Stesso formato di /register

#### 3. **GET /api/auth/me** - Info Utente (Protetto)
Ottiene info utente corrente. Richiede JWT token.

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "mario_rossi",
    "email": "mario@example.com",
    "created_at": "2025-10-10T07:09:04"
  }
}
```

#### 4. **POST /api/auth/refresh** - Rinnova Token
Rinnova access token usando refresh token.

**Headers**:
```
Authorization: Bearer <refresh_token>
```

**Response** (200):
```json
{
  "success": true,
  "access_token": "eyJ..."
}
```

## 🔒 Sicurezza

### Password Hashing
- **bcrypt** con salt automatico
- Password mai salvate in chiaro
- Hash di 255 caratteri

### JWT Tokens
- **Access Token**: Valido 1 ora
- **Refresh Token**: Valido 30 giorni
- Algoritmo HS256

### Validazione
- **Username**: 3-80 caratteri, solo alfanumerici e underscore
- **Email**: Formato valido + unicità
- **Password**: Minimo 6 caratteri

## � File

- `auth_service.py` - Logica business autenticazione
- `auth_routes.py` - Endpoint API
- `README.md` - Documentazione

## 🧪 Esempi Utilizzo

### Registrazione e Login
```python
import requests

# Registrazione
response = requests.post('http://localhost:5000/api/auth/register', json={
    'username': 'john',
    'email': 'john@example.com',
    'password': 'secret123'
})
data = response.json()
token = data['access_token']

# Usa token per endpoint protetti
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:5000/api/auth/me', headers=headers)
print(response.json())
```

### Con cURL
```bash
# Registrazione
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"secret123"}'

# Get user info (usa il token ricevuto)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## ✅ Status

**Completato**: 10 Ottobre 2025  
**Test**: Tutti passati  
**Pronto per**: 2.4 Items API