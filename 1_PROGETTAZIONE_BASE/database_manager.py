# 1.1 - Database Manager AGGIORNATO
# Gestione connessione e operazioni database con auto-aggiornamento

import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import json
import os
import threading
import time
import warnings

# Sopprime warning di deprecazione SQLite per Python 3.12
warnings.filterwarnings("ignore", category=DeprecationWarning)

class DatabaseManager:
    def __init__(self, db_type="postgresql", connection_string=None):
        """
        Inizializza il database manager
        db_type: 'postgresql' per produzione (RACCOMANDATO), 'sqlite' solo per test
        connection_string: stringa di connessione per PostgreSQL
        """
        self.db_type = db_type
        self.connection_string = connection_string
        self.connection = None
        self._connection_pool = []
        self.auto_commit = True  # IMPORTANTE: commit automatico per aggiornamenti real-time
        
    def connect(self):
        """Crea connessione al database con autocommit per real-time"""
        try:
            if self.db_type == "sqlite":
                self.connection = sqlite3.connect('app.db', check_same_thread=False)
                self.connection.row_factory = sqlite3.Row
                # IMPORTANTE: SQLite non supporta bene utenti multipli simultanei
                print("⚠️  ATTENZIONE: SQLite NON supporta utenti multipli! Usa PostgreSQL per produzione")
                
            elif self.db_type == "postgresql":
                self.connection = psycopg2.connect(
                    self.connection_string, 
                    cursor_factory=RealDictCursor
                )
                # FONDAMENTALE: autocommit per aggiornamenti istantanei
                self.connection.autocommit = True
                print("✅ Connesso a PostgreSQL con autocommit attivo")
                
            return True
        except Exception as e:
            print(f"❌ Errore connessione database: {e}")
            return False
    
    def create_tables(self):
        """Crea tutte le tabelle dal file SQL"""
        try:
            # Percorso corretto per il file SQL
            sql_file_path = os.path.join(os.path.dirname(__file__), 'database_schema.sql')
            with open(sql_file_path, 'r') as file:
                sql_script = file.read()
            
            cursor = self.connection.cursor()
            
            if self.db_type == "postgresql":
                # Adatta lo script per PostgreSQL
                sql_script = sql_script.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
                sql_script = sql_script.replace('BOOLEAN', 'BOOLEAN')
            
            # Esegui ogni statement SQL
            statements = sql_script.split(';')
            for statement in statements:
                if statement.strip():
                    cursor.execute(statement)
            
            self.connection.commit()
            print("✅ Tabelle create con successo")
            return True
            
        except Exception as e:
            print(f"❌ Errore creazione tabelle: {e}")
            return False
    
    def execute_query(self, query, params=None):
        """Esegue una query con commit automatico per aggiornamenti real-time"""
        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if query.strip().upper().startswith('SELECT'):
                return cursor.fetchall()
            else:
                # FONDAMENTALE: Per PostgreSQL con autocommit=True, non serve commit()
                # Per SQLite, forziamo il commit per aggiornamenti immediati
                if self.db_type == "sqlite":
                    self.connection.commit()
                    
                return cursor.rowcount
                
        except Exception as e:
            print(f"❌ Errore query: {e}")
            return None
    
    def insert_item_realtime(self, seller_id, title, description, price, category, condition, lat, lng, location_name, image_urls=None):
        """Inserisce oggetto con aggiornamento IMMEDIATO visibile a tutti gli utenti"""
        query = """
        INSERT INTO items (seller_id, title, description, price, category, condition, 
                          latitude, longitude, location_name, image_urls, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        now = datetime.now()
        image_urls_json = json.dumps(image_urls) if image_urls else None
        
        # IMPORTANTE: Parametri corretti per l'inserimento
        params = (seller_id, title, description, price, category, condition, 
                 lat, lng, location_name, image_urls_json, now, now)
        
        result = self.execute_query(query, params)
        
        if result:
            print(f"✅ PRODOTTO INSERITO E VISIBILE A TUTTI GLI UTENTI: {title}")
            # Trigger per notificare altri utenti (opzionale)
            self._notify_new_item(lat, lng, title)
        
        return result
    
    def get_latest_items(self, limit=20):
        """Ottiene gli ultimi prodotti inseriti (aggiornamento real-time)"""
        query = """
        SELECT i.*, u.username, u.first_name, u.last_name 
        FROM items i 
        JOIN users u ON i.seller_id = u.id 
        WHERE i.is_active = ? AND i.is_sold = ? 
        ORDER BY i.created_at DESC 
        LIMIT ?
        """
        return self.execute_query(query, (True, False, limit))
    
    def _notify_new_item(self, lat, lng, title):
        """Notifica utenti nelle vicinanze di nuovo prodotto (funzione helper)"""
        # Questo può essere espanso per notifiche push/email
        print(f"🔔 Nuovo prodotto '{title}' disponibile in zona ({lat}, {lng})")
    
    def get_user_items(self, user_id):
        """Ottiene tutti gli oggetti di un utente"""
        query = """
        SELECT * FROM items 
        WHERE seller_id = ? AND is_active = ? 
        ORDER BY created_at DESC
        """
        return self.execute_query(query, (user_id, True))
    
    def update_item_status(self, item_id, is_sold=False, is_active=True):
        """Aggiorna stato oggetto (venduto/attivo) con visibilità immediata"""
        query = """
        UPDATE items 
        SET is_sold = ?, is_active = ?, updated_at = ? 
        WHERE id = ?
        """
        now = datetime.now()
        result = self.execute_query(query, (is_sold, is_active, now, item_id))
        
        if result:
            status = "VENDUTO" if is_sold else "ATTIVO"
            print(f"✅ Oggetto {item_id} aggiornato a: {status}")
        
        return result
    
    def get_items_near_location(self, lat, lng, radius_km=10):
        """Trova oggetti vicino a una posizione con aggiornamenti real-time"""
        if self.db_type == "postgresql":
            # Query PostgreSQL con HAVING
            query = """
            SELECT *, 
                   (6371 * acos(cos(radians(%s)) * cos(radians(latitude)) * 
                   cos(radians(longitude) - radians(%s)) + sin(radians(%s)) * 
                   sin(radians(latitude)))) AS distance_km
            FROM items 
            WHERE is_active = %s AND is_sold = %s
            HAVING distance_km <= %s
            ORDER BY distance_km
            """
            return self.execute_query(query, (lat, lng, lat, True, False, radius_km))
        else:
            # Query SQLite senza HAVING (usando subquery)
            query = """
            SELECT * FROM (
                SELECT *, 
                       (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                       cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
                       sin(radians(latitude)))) AS distance_km
                FROM items 
                WHERE is_active = ? AND is_sold = ?
            ) WHERE distance_km <= ?
            ORDER BY distance_km
            """
            return self.execute_query(query, (lat, lng, lat, True, False, radius_km))

    def close(self):
        """Chiude la connessione"""
        if self.connection:
            self.connection.close()
            print("✅ Connessione database chiusa")

# Funzioni helper per operazioni comuni (AGGIORNATE)
def insert_user(db, username, email, password_hash, first_name, last_name, phone=None):
    """Inserisce nuovo utente con validazione"""
    query = """
    INSERT INTO users (username, email, password_hash, first_name, last_name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
    """
    return db.execute_query(query, (username, email, password_hash, first_name, last_name, phone))

# NOTA: Usa db.insert_item_realtime() invece di questa funzione per aggiornamenti real-time

# Per test del database, usa il file test_database.py