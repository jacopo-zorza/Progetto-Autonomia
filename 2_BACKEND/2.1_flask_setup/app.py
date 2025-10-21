# 2.1 - Setup Flask Base + 2.2 Models Integration + 2.3 Auth API
# Configurazione iniziale dell'applicazione Flask con SQLAlchemy e JWT

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
import sys

# Aggiungi i path necessari al sistema
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.3_auth_api'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.4_items_api'))

from database_manager import DatabaseManager
from models import db, User, Item, Message, Transaction, Review
from auth_routes import auth_bp
from items_routes import items_bp

class FlaskApp:
    def __init__(self, db_type="sqlite", db_connection_string=None, db_path=None):
        """
        Inizializza l'applicazione Flask con SQLAlchemy
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
        
        # Configurazione JWT
        self.app.config['JWT_SECRET_KEY'] = 'jwt-secret-key-change-in-production'
        self.app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
        self.app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
        
        # Inizializza JWT Manager
        self.jwt = JWTManager(self.app)
        
        # Configurazione database
        self.db_type = db_type
        self.db_connection_string = db_connection_string
        self.db_path = db_path
        self.db = None
        
        # Configurazione SQLAlchemy
        self._configure_sqlalchemy()
        
        # Inizializza database legacy (manteniamo per compatibilità)
        self._init_database()
        
        # Registra le routes
        self._register_routes()
    
    def _configure_sqlalchemy(self):
        """Configura SQLAlchemy per l'applicazione"""
        if self.db_type == "sqlite":
            # Usa path specifico se fornito, altrimenti default
            if self.db_path:
                db_file = os.path.abspath(self.db_path)
            else:
                db_file = os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE', 'app.db')
            
            self.app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_file}'
            
        elif self.db_type == "postgresql":
            self.app.config['SQLALCHEMY_DATABASE_URI'] = self.db_connection_string
        
        # Disabilita tracking delle modifiche (risparmia memoria)
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        # Inizializza SQLAlchemy con l'app Flask
        db.init_app(self.app)
        
        # Crea le tabelle se non esistono
        with self.app.app_context():
            db.create_all()
            print(f"✅ SQLAlchemy configurato con {self.db_type}")
    
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
        
        # Registra blueprint autenticazione
        self.app.register_blueprint(auth_bp)
        
        # Registra blueprint items
        self.app.register_blueprint(items_bp)
        
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
                    "api_status": "/api/status",
                    "auth": {
                        "register": "/api/auth/register",
                        "login": "/api/auth/login",
                        "me": "/api/auth/me",
                        "refresh": "/api/auth/refresh"
                    },
                    "items": {
                        "list": "/api/items (GET)",
                        "create": "/api/items (POST)",
                        "detail": "/api/items/<id> (GET)",
                        "update": "/api/items/<id> (PUT)",
                        "delete": "/api/items/<id> (DELETE)",
                        "my_items": "/api/items/my-items (GET)"
                    }
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
                "sqlalchemy": "active",
                "jwt_auth": "active",
                "features": {
                    "authentication": "active",
                    "user_management": "active",
                    "item_management": "active", 
                    "item_search_filters": "active",
                    "geolocation": "active",
                    "messaging": "models ready",
                    "payments": "models ready"
                },
                "current_phase": "2.4 - Items API Integrated"
            })
        
        @self.app.route('/api/models/test')
        def test_models():
            """Test endpoint per verificare i modelli SQLAlchemy"""
            try:
                # Conta i record in ogni tabella
                users_count = User.query.count()
                items_count = Item.query.count()
                messages_count = Message.query.count()
                transactions_count = Transaction.query.count()
                reviews_count = Review.query.count()
                
                return jsonify({
                    "status": "success",
                    "message": "Modelli SQLAlchemy funzionanti",
                    "models": {
                        "users": users_count,
                        "items": items_count,
                        "messages": messages_count,
                        "transactions": transactions_count,
                        "reviews": reviews_count
                    }
                }), 200
                
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": str(e)
                }), 500
    
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