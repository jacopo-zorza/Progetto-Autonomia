# 2.1 - Avvio Applicazione Flask Ottimizzato
# Punto di ingresso principale dell'applicazione

import os
import sys
from config import get_config, CURRENT_ENV

# Aggiungi il path del database
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE'))

from app import FlaskApp

def create_app(environment=None):
    """
    Factory function per creare l'applicazione Flask
    
    Args:
        environment: 'development', 'production', 'testing'
    
    Returns:
        Istanza dell'applicazione Flask configurata
    """
    if environment is None:
        environment = CURRENT_ENV
    
    config = get_config(environment)
    
    # Crea l'app con la configurazione appropriata
    app = FlaskApp(
        db_type=config.DB_TYPE,
        db_connection_string=getattr(config, 'DB_CONNECTION_STRING', None),
        db_path=getattr(config, 'DB_PATH', None)
    )
    
    return app

def main():
    """Funzione principale per avviare l'applicazione"""
    print("🚀 AVVIO AUTONOMIA APP - BACKEND")
    print("=" * 40)
    
    # Crea l'applicazione
    app = create_app()
    
    # Ottieni configurazione
    config = get_config(CURRENT_ENV)
    
    # Avvia il server
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )

if __name__ == "__main__":
    main()