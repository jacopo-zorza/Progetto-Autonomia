# 1.1 - Configurazione Database Real-Time
# Setup per database che supporta aggiornamenti automatici

import os
from database_manager import DatabaseManager

# CONFIGURAZIONE POSTGRESQL PER PRODUZIONE
# Registrati su railway.app e crea un database PostgreSQL
POSTGRESQL_CONFIG = {
    "host": "localhost",  # Sostituisci con host Railway/Render
    "port": "5432",
    "database": "autonomia_db",
    "username": "user",      # Sostituisci con username del database
    "password": "password"   # Sostituisci con password del database
}

def get_postgresql_connection_string():
    """Crea connection string per PostgreSQL"""
    # Esempio per Railway: postgresql://username:password@host:port/database
    return f"postgresql://{POSTGRESQL_CONFIG['username']}:{POSTGRESQL_CONFIG['password']}@{POSTGRESQL_CONFIG['host']}:{POSTGRESQL_CONFIG['port']}/{POSTGRESQL_CONFIG['database']}"

def create_production_database():
    """Crea database per produzione con supporto multi-utente"""
    print("🚀 SETUP DATABASE PRODUZIONE")
    
    # Usa PostgreSQL per supportare utenti multipli
    connection_string = get_postgresql_connection_string()
    db = DatabaseManager("postgresql", connection_string)
    
    if db.connect():
        print("✅ Database PostgreSQL pronto per utenti multipli")
        db.create_tables()
        return db
    else:
        print("❌ Errore: configura prima PostgreSQL su Railway/Render")
        return None

def create_development_database():
    """Crea database per sviluppo (solo test locali)"""
    print("⚠️  SETUP DATABASE SVILUPPO (solo per test)")
    print("🚨 ATTENZIONE: SQLite NON supporta utenti multipli simultanei!")
    
    db = DatabaseManager("sqlite")
    
    if db.connect():
        db.create_tables()
        return db
    return None

# ISTRUZIONI SETUP POSTGRESQL GRATUITO:
SETUP_INSTRUCTIONS = """
🔧 SETUP DATABASE PRODUZIONE (GRATUITO):

1. REGISTRATI SU RAILWAY.APP:
   - Vai su railway.app
   - Registrati con GitHub
   - Crea nuovo progetto
   - Aggiungi PostgreSQL database

2. OTTIENI CONNECTION STRING:
   - Clicca sul database PostgreSQL
   - Vai in "Connect" 
   - Copia la connection string
   - Sostituisci in POSTGRESQL_CONFIG

3. TESTA LA CONNESSIONE:
   python database_config.py

ALTERNATIVA: RENDER.COM
- Stesso processo su render.com
- Database PostgreSQL gratuito
- Fino a 1GB di storage
"""

if __name__ == "__main__":
    print(SETUP_INSTRUCTIONS)
    
    # Test connessione
    print("\n🧪 TEST CONNESSIONE DATABASE:")
    
    # Per ora testiamo con SQLite
    db = create_development_database()
    if db:
        print("✅ Database sviluppo funzionante")
        
        # Test inserimento prodotto
        result = db.insert_item_realtime(
            seller_id=1,
            title="Test Prodotto",
            description="Prodotto di test",
            price=25.50,
            category="test",
            condition="nuovo",
            lat=45.4642,
            lng=9.1900,
            location_name="Milano"
        )
        
        if result:
            print("✅ Inserimento prodotto con aggiornamento real-time OK")
        
        db.close()
    
    print("\n📋 PROSSIMO PASSO: Setup PostgreSQL per supportare utenti multipli")