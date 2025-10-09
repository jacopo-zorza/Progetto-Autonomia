# 2.1 - Configurazione Flask
# Gestione configurazioni per sviluppo e produzione

import os
from dataclasses import dataclass

@dataclass
class Config:
    """Configurazione base"""
    SECRET_KEY: str = "your-secret-key-change-in-production"
    DEBUG: bool = True
    
    # Database
    DB_TYPE: str = "sqlite"
    DB_CONNECTION_STRING: str = None
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    
    # CORS
    CORS_ORIGINS: list = None

@dataclass 
class DevelopmentConfig(Config):
    """Configurazione per sviluppo"""
    DEBUG: bool = True
    DB_TYPE: str = "sqlite"
    DB_PATH: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../1_PROGETTAZIONE_BASE/app.db"))

@dataclass
class ProductionConfig(Config):
    """Configurazione per produzione"""
    DEBUG: bool = False
    DB_TYPE: str = "postgresql"
    # Sostituisci con la tua connection string PostgreSQL
    DB_CONNECTION_STRING: str = os.getenv('DATABASE_URL', 'postgresql://user:pass@host:port/db')
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'change-this-secret-key')

@dataclass
class TestingConfig(Config):
    """Configurazione per testing"""
    DEBUG: bool = True
    DB_TYPE: str = "sqlite"
    DB_PATH: str = "test.db"

def get_config(environment='development'):
    """
    Ottieni la configurazione per l'ambiente specificato
    
    Args:
        environment: 'development', 'production', 'testing'
    
    Returns:
        Istanza della configurazione appropriata
    """
    configs = {
        'development': DevelopmentConfig(),
        'production': ProductionConfig(),
        'testing': TestingConfig()
    }
    
    return configs.get(environment, DevelopmentConfig())

# Configurazione attuale (cambia qui per switch environment)
CURRENT_ENV = os.getenv('FLASK_ENV', 'development')
current_config = get_config(CURRENT_ENV)

print(f"🔧 Ambiente configurato: {CURRENT_ENV}")
print(f"📊 Database: {current_config.DB_TYPE}")
print(f"🐛 Debug: {current_config.DEBUG}")