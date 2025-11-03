"""
Servizio di Autenticazione per Progetto Autonomia
Gestisce registrazione, login, validazione e hashing password
"""
import bcrypt
import re
from datetime import datetime, timedelta
import sys
import os

# Aggiungi path per import modelli
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))
from models import db, User


class AuthService:
    """Servizio per gestione autenticazione utenti"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash della password con bcrypt
        
        Args:
            password: Password in chiaro
            
        Returns:
            Password hashata (string)
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """
        Verifica se la password corrisponde all'hash
        
        Args:
            password: Password in chiaro da verificare
            hashed_password: Password hashata dal database
            
        Returns:
            True se la password è corretta, False altrimenti
        """
        return bcrypt.checkpw(
            password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    
    @staticmethod
    def validate_email(email: str) -> tuple[bool, str]:
        """
        Valida formato email
        
        Args:
            email: Email da validare
            
        Returns:
            (is_valid, error_message)
        """
        if not email:
            return False, "Email è obbligatoria"
        
        # Regex semplice per validazione email
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Formato email non valido"
        
        return True, ""
    
    @staticmethod
    def validate_username(username: str) -> tuple[bool, str]:
        """
        Valida username
        
        Args:
            username: Username da validare
            
        Returns:
            (is_valid, error_message)
        """
        if not username:
            return False, "Username è obbligatorio"
        
        if len(username) < 3:
            return False, "Username deve essere di almeno 3 caratteri"
        
        if len(username) > 80:
            return False, "Username troppo lungo (max 80 caratteri)"
        
        # Solo caratteri alfanumerici e underscore
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return False, "Username può contenere solo lettere, numeri e underscore"
        
        return True, ""
    
    @staticmethod
    def validate_password(password: str) -> tuple[bool, str]:
        """
        Valida password
        
        Args:
            password: Password da validare
            
        Returns:
            (is_valid, error_message)
        """
        if not password:
            return False, "Password è obbligatoria"
        
        if len(password) < 6:
            return False, "Password deve essere di almeno 6 caratteri"
        
        if len(password) > 128:
            return False, "Password troppo lunga (max 128 caratteri)"
        
        return True, ""
    
    @staticmethod
    def register_user(username: str, email: str, password: str, first_name: str | None = None, last_name: str | None = None, phone: str | None = None, profile_image: str | None = None) -> tuple[bool, str, User | None]:
        """
        Registra un nuovo utente
        
        Args:
            username: Username scelto
            email: Email utente
            password: Password in chiaro
            
        Returns:
            (success, message, user_object or None)
        """
        # Validazione input
        valid, msg = AuthService.validate_username(username)
        if not valid:
            return False, msg, None
        
        valid, msg = AuthService.validate_email(email)
        if not valid:
            return False, msg, None
        
        valid, msg = AuthService.validate_password(password)
        if not valid:
            return False, msg, None
        
        # Controlla se username già esiste
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return False, "Username già in uso", None
        
        # Controlla se email già esiste
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            return False, "Email già registrata", None
        
        try:
            # Hash della password
            password_hash = AuthService.hash_password(password)
            
            # Crea nuovo utente (con campi opzionali)
            new_user = User(
                username=username,
                email=email,
                password_hash=password_hash,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                profile_image=profile_image
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            return True, "Utente registrato con successo", new_user
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante la registrazione: {str(e)}", None
    
    @staticmethod
    def login_user(username: str, password: str) -> tuple[bool, str, User | None]:
        """
        Effettua login utente
        
        Args:
            username: Username o email
            password: Password in chiaro
            
        Returns:
            (success, message, user_object or None)
        """
        if not username or not password:
            return False, "Username e password sono obbligatori", None
        
        # Cerca utente per username o email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return False, "Credenziali non valide", None
        
        # Verifica password
        if not AuthService.verify_password(password, user.password_hash):
            return False, "Credenziali non valide", None
        
        return True, "Login effettuato con successo", user
    
    @staticmethod
    def get_user_by_id(user_id: int) -> User | None:
        """
        Ottieni utente per ID
        
        Args:
            user_id: ID utente
            
        Returns:
            User object o None
        """
        return User.query.get(user_id)
