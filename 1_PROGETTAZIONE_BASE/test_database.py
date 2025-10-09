# Test completo del database
# Verifica tutte le funzionalità prima del rilascio

import os
import sys
from database_manager import DatabaseManager, insert_user

def test_database_complete():
    """Test completo di tutte le funzionalità del database"""
    
    print("🧪 INIZIO TEST COMPLETO DATABASE")
    print("=" * 50)
    
    # Rimuovi database esistente per test pulito
    if os.path.exists('app.db'):
        os.remove('app.db')
        print("✅ Database precedente rimosso")
    
    # Test 1: Creazione database e connessione
    print("\n📋 TEST 1: Connessione e creazione tabelle")
    db = DatabaseManager("sqlite")
    
    if not db.connect():
        print("❌ ERRORE: Impossibile connettersi al database")
        return False
    
    if not db.create_tables():
        print("❌ ERRORE: Impossibile creare tabelle")
        return False
    
    print("✅ Database e tabelle creati correttamente")
    
    # Test 2: Inserimento utenti
    print("\n📋 TEST 2: Inserimento utenti")
    test_users = [
        ("mario_rossi", "mario@email.com", "hash123", "Mario", "Rossi", "1234567890"),
        ("giulia_verdi", "giulia@email.com", "hash456", "Giulia", "Verdi", "0987654321"),
        ("luca_bianchi", "luca@email.com", "hash789", "Luca", "Bianchi", None)
    ]
    
    user_ids = []
    for user_data in test_users:
        result = insert_user(db, *user_data)
        if result:
            user_ids.append(result)
            print(f"✅ Utente {user_data[0]} inserito")
        else:
            print(f"❌ Errore inserimento utente {user_data[0]}")
            return False
    
    # Test 3: Inserimento oggetti
    print("\n📋 TEST 3: Inserimento oggetti in vendita")
    test_items = [
        (1, "Bicicletta da città", "Bici usata in buone condizioni", 80.00, "trasporti", "buone_condizioni", 45.4642, 9.1900, "Milano Centro"),
        (2, "Tavola da surf", "Usata solo una settimana al mare", 150.00, "sport", "come_nuovo", 44.4056, 8.9463, "Genova"),
        (1, "Zaino da trekking", "Zaino 40L perfetto per escursioni", 45.00, "sport", "buone_condizioni", 45.0703, 7.6869, "Torino"),
        (3, "Macchina fotografica", "Reflex digitale con obiettivo", 200.00, "elettronica", "buone_condizioni", 41.9028, 12.4964, "Roma")
    ]
    
    item_ids = []
    for item_data in test_items:
        result = db.insert_item_realtime(*item_data)
        if result:
            item_ids.append(result)
            print(f"✅ Oggetto '{item_data[1]}' inserito")
        else:
            print(f"❌ Errore inserimento oggetto '{item_data[1]}'")
            return False
    
    # Test 4: Ricerca oggetti per posizione
    print("\n📋 TEST 4: Ricerca per geolocalizzazione")
    milano_items = db.get_items_near_location(45.4642, 9.1900, 50)  # 50km da Milano
    if milano_items:
        print(f"✅ Trovati {len(milano_items)} oggetti vicino a Milano")
        for item in milano_items:
            print(f"   - {item['title']} a {item['distance_km']:.1f}km")
    else:
        print("❌ Nessun oggetto trovato vicino a Milano")
        return False
    
    # Test 5: Recupero ultimi oggetti
    print("\n📋 TEST 5: Recupero ultimi oggetti inseriti")
    latest = db.get_latest_items(3)
    if latest and len(latest) > 0:
        print(f"✅ Recuperati {len(latest)} oggetti più recenti")
        for item in latest:
            print(f"   - {item['title']} - €{item['price']}")
    else:
        print("❌ Errore nel recupero oggetti recenti")
        return False
    
    # Test 6: Aggiornamento stato oggetto
    print("\n📋 TEST 6: Aggiornamento stato oggetto")
    result = db.update_item_status(1, is_sold=True)
    if result:
        print("✅ Stato oggetto aggiornato (venduto)")
    else:
        print("❌ Errore aggiornamento stato oggetto")
        return False
    
    # Test 7: Recupero oggetti utente
    print("\n📋 TEST 7: Recupero oggetti per utente")
    user_items = db.get_user_items(1)
    if user_items:
        print(f"✅ Trovati {len(user_items)} oggetti per utente 1")
        for item in user_items:
            status = "VENDUTO" if item['is_sold'] else "DISPONIBILE"
            print(f"   - {item['title']} - {status}")
    else:
        print("❌ Errore nel recupero oggetti utente")
        return False
    
    # Chiudi connessione
    db.close()
    
    print("\n" + "=" * 50)
    print("🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!")
    print("✅ Il database è pronto per l'applicazione")
    
    return True

def clean_database():
    """Svuota il database per iniziare con dati puliti"""
    print("\n🧹 PULIZIA DATABASE PER PRODUZIONE")
    print("=" * 40)
    
    if os.path.exists('app.db'):
        os.remove('app.db')
        print("✅ Database precedente rimosso")
    
    # Crea database pulito
    db = DatabaseManager("sqlite")
    if db.connect():
        if db.create_tables():
            print("✅ Database pulito creato con successo")
            print("🚀 Pronto per inserimenti dall'applicazione!")
        else:
            print("❌ Errore nella creazione del database pulito")
        db.close()
    else:
        print("❌ Errore nella connessione per pulizia database")

if __name__ == "__main__":
    # Esegui test completo
    success = test_database_complete()
    
    if success:
        # Se tutti i test passano, pulisci il database
        clean_database()
    else:
        print("\n❌ ERRORI NEI TEST - Database non pronto")
        sys.exit(1)