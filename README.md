# 🚀 Progetto Autonomia

**Applicazione per la vendita di oggetti usati da viaggio**

Marketplace digitale per viaggiatori che vogliono vendere o acquistare oggetti usati, con focus su geolocalizzazione e praticità d'uso.

## 📊 Status Sviluppo

### ✅ **COMPLETATO**
- **1.1 Database**: Sistema completo SQLite/PostgreSQL con real-time updates
- **2.1 Flask Setup**: API base con configurazione multi-ambiente

### 🔄 **IN SVILUPPO**
- **2.2 Models**: Prossimo obiettivo - Modelli SQLAlchemy

### 📋 **PIANIFICATO**
- 2.3-2.7: API Backend (Auth, Items, Messages, Geo, Payments)
- 3.1-3.8: Frontend HTML/CSS/JavaScript
- 4.1-4.4: Integrazioni esterne
- 5.0: Testing e Deploy

## 🏗️ Architettura Tecnica

### Backend (Python Flask)
- **Framework**: Flask 3.1.2 con CORS
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: SQLAlchemy per modelli dati
- **API**: RESTful con JSON responses

### Database Schema
- **Users**: Gestione utenti con autenticazione
- **Items**: Oggetti in vendita con geolocalizzazione
- **Messages**: Sistema chat real-time
- **Transactions**: Pagamenti e transazioni
- **Reviews**: Sistema valutazioni

### Frontend (Pianificato)
- **UI**: HTML5, CSS3, JavaScript moderno
- **Responsive**: Mobile-first design
- **Maps**: Integrazione mappe per geolocalizzazione
- **PWA**: Progressive Web App capabilities

## 🚀 Quick Start

### 1. Database Setup
```bash
cd 1_PROGETTAZIONE_BASE
python database_manager.py
```

### 2. Flask Development Server
```bash
cd 2_BACKEND/2.1_flask_setup
pip install -r requirements.txt
python run.py
```

### 3. Test Endpoints
- `GET /` → API info
- `GET /health` → Health check
- `GET /api/status` → Status dettagliato

## 📁 Struttura Progetto

```
├── 1_PROGETTAZIONE_BASE/    # Database system
├── 2_BACKEND/               # Flask API
│   ├── 2.1_flask_setup/     # ✅ Base Flask app
│   ├── 2.2_models/          # 🔄 SQLAlchemy models
│   ├── 2.3_auth_api/        # 📋 Authentication
│   ├── 2.4_items_api/       # 📋 Items management
│   ├── 2.5_messages_api/    # 📋 Messaging system
│   ├── 2.6_geolocation_api/ # 📋 Geo features
│   └── 2.7_payments_api/    # 📋 Payment integration
├── 3_FRONTEND/              # 📋 Web interface
├── 4_INTEGRAZIONI/          # 📋 External services
└── PIANO_SVILUPPO.md        # Development roadmap
```

## 🎯 Funzionalità Principali

### Core Features
- 🔐 **Autenticazione**: Registrazione, login, profili utente
- 📦 **Gestione Oggetti**: Upload, ricerca, filtri avanzati
- 📍 **Geolocalizzazione**: Ricerca per prossimità geografica
- 💬 **Messaggistica**: Chat real-time tra utenti
- 💳 **Pagamenti**: Integrazione Stripe/PayPal
- ⭐ **Recensioni**: Sistema valutazioni bidirectional

### Advanced Features
- 🌍 **Multi-lingua**: Supporto internazionale
- 📱 **PWA**: Esperienza mobile nativa
- 🔔 **Notifiche**: Alert per nuovi oggetti nella zona
- 🌙 **Dark Mode**: Interfaccia personalizzabile
- 📈 **Analytics**: Dashboard per venditori

## 🛠️ Tecnologie Utilizzate

- **Python 3.12+** - Linguaggio principale
- **Flask 3.1.2** - Framework web
- **SQLite/PostgreSQL** - Database relazionale
- **SQLAlchemy** - ORM (pianificato)
- **JWT** - Autenticazione (pianificato)
- **WebSocket** - Chat real-time (pianificato)

## 📄 Licenza

Progetto di sviluppo personale per apprendimento fullstack.