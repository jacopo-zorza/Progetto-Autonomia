"""
Script per inizializzare il database
Crea tutte le tabelle definite nei modelli SQLAlchemy
"""
import sys
import os

# Aggiungi path necessari
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '2.2_models'))

from app import flask_app
from models import db, User, Item, Message, Transaction, Review

def init_database():
    """Inizializza il database creando tutte le tabelle"""
    app = flask_app.get_app()
    
    with app.app_context():
        print("🔧 Creazione tabelle database...")
        
        # Elimina tutte le tabelle esistenti (usa con cautela!)
        # db.drop_all()
        # print("   Tabelle vecchie eliminate")
        
        # Crea tutte le tabelle
        db.create_all()
        print("✅ Tabelle create con successo:")
        
        # Verifica tabelle create
        tables = [User, Item, Message, Transaction, Review]
        for table in tables:
            count = table.query.count()
            print(f"   - {table.__tablename__}: {count} record")
        
        print("\n✅ Database inizializzato correttamente!")
        print(f"📁 Percorso: {app.config['SQLALCHEMY_DATABASE_URI']}")

if __name__ == "__main__":
    init_database()
