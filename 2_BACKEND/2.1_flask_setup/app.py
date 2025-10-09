# 2.1 - Setup Flask Base
# Configurazione iniziale dell'applicazione Flask

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import sys

# Aggiungi il path del database al sistema
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE'))

from database_manager import DatabaseManager

class FlaskApp:
    def __init__(self, db_type="sqlite", db_connection_string=None, db_path=None):
        """
        Inizializza l'applicazione Flask
        db_type: 'sqlite' per sviluppo, 'postgresql' per produzione
        db_connection_string: stringa di connessione per PostgreSQL
        db_path: path del database SQLite (se None, usa default)
        """
        self.app = Flask(__name__)
        
        # Configurazione CORS per permettere richieste da frontend
        CORS(self.app)
        
        # Configurazione Flask
        self.app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
        self.app.config['DEBUG'] = True  # Disabilita in produzione
        
        # Configurazione database
        self.db_type = db_type
        self.db_connection_string = db_connection_string
        self.db_path = db_path
        self.db = None
        
        # Inizializza database
        self._init_database()
        
        # Registra le routes
        self._register_routes()
    
    def _init_database(self):
        """Inizializza la connessione al database"""
        try:
            # Crea il DatabaseManager con il path corretto
            if self.db_type == "sqlite" and self.db_path:
                abs_path = os.path.abspath(self.db_path)
                self.db = DatabaseManager(self.db_type, self.db_connection_string, abs_path)
            else:
                self.db = DatabaseManager(self.db_type, self.db_connection_string)
                
            if self.db and self.db.connection:
                # Verifica se le tabelle esistono già
                try:
                    result = self.db.execute_query("SELECT COUNT(*) FROM users LIMIT 1")
                    print(f"✅ Database {self.db_type} connesso ({self.db_path or 'default'})")
                except:
                    self.db.create_tables()
                    print(f"✅ Database {self.db_type} connesso e tabelle create ({self.db_path or 'default'})")
                
                return True
            else:
                print(f"❌ Errore connessione database {self.db_type}")
                return False
                
        except Exception as e:
            print(f"❌ Errore inizializzazione database: {e}")
            return False
    
    def _register_routes(self):
        """Registra tutte le routes dell'applicazione"""
        
        @self.app.route('/')
        def home():
            """Homepage dell'applicazione"""
            return jsonify({
                "message": "🚀 Autonomia App - API Backend",
                "version": "1.0.0",
                "status": "active",
                "database": self.db_type,
                "endpoints": {
                    "home": "/",
                    "health": "/health",
                    "api_status": "/api/status"
                }
            })
        
        @self.app.route('/health')
        def health_check():
            """Health check per verificare che l'app funzioni"""
            try:
                # Test connessione database
                if self.db and self.db.connection:
                    db_status = "connected"
                else:
                    db_status = "disconnected"
                
                return jsonify({
                    "status": "healthy",
                    "database": db_status,
                    "timestamp": "2025-10-09"
                }), 200
                
            except Exception as e:
                return jsonify({
                    "status": "unhealthy",
                    "error": str(e)
                }), 500
        
        @self.app.route('/api/status')
        def api_status():
            """Status dettagliato dell'API"""
            return jsonify({
                "api_version": "1.0.0",
                "database_type": self.db_type,
                "features": {
                    "user_management": "planned",
                    "item_management": "planned", 
                    "messaging": "planned",
                    "geolocation": "planned",
                    "payments": "planned"
                },
                "current_phase": "2.1 - Flask Setup"
            })
    
    def run(self, host='0.0.0.0', port=5000, debug=True):
        """Avvia l'applicazione Flask"""
        print(f"🚀 Avvio Flask su http://{host}:{port}")
        print(f"📊 Database: {self.db_type}")
        print(f"🔧 Debug mode: {debug}")
        self.app.run(host=host, port=port, debug=debug)
    
    def get_app(self):
        """Ritorna l'istanza Flask per testing"""
        return self.app

# Creazione dell'istanza globale
flask_app = FlaskApp()

if __name__ == "__main__":
    # Avvio dell'applicazione
    flask_app.run()