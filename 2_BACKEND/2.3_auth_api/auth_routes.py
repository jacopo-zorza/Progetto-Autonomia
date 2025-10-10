"""
Routes API per Autenticazione
Endpoint per registrazione, login e gestione utente
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from auth_service import AuthService

# Crea blueprint per le routes di autenticazione
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registrazione nuovo utente
    
    POST /api/auth/register
    Body: {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "password123"
    }
    
    Returns:
        201: Utente creato con successo
        400: Dati non validi
        409: Username o email già in uso
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Dati mancanti"
            }), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Registra utente
        success, message, user = AuthService.register_user(username, email, password)
        
        if not success:
            status_code = 409 if "già" in message else 400
            return jsonify({
                "success": False,
                "message": message
            }), status_code
        
        # Genera JWT tokens (identity deve essere stringa)
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "message": message,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat()
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login utente esistente
    
    POST /api/auth/login
    Body: {
        "username": "john_doe",  (può essere anche email)
        "password": "password123"
    }
    
    Returns:
        200: Login effettuato
        401: Credenziali non valide
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Dati mancanti"
            }), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        # Effettua login
        success, message, user = AuthService.login_user(username, password)
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 401
        
        # Genera JWT tokens (identity deve essere stringa)
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "message": message,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat()
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Ottieni informazioni utente corrente (richiede autenticazione)
    
    GET /api/auth/me
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Dati utente
        401: Token non valido o mancante
    """
    try:
        # Ottieni ID utente dal token JWT (è una stringa, convertiamo in int)
        current_user_id = int(get_jwt_identity())
        
        # Recupera utente dal database
        user = AuthService.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({
                "success": False,
                "message": "Utente non trovato"
            }), 404
        
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Rinnova access token usando refresh token
    
    POST /api/auth/refresh
    Headers: {
        "Authorization": "Bearer <refresh_token>"
    }
    
    Returns:
        200: Nuovo access token
        401: Refresh token non valido
    """
    try:
        current_user_id = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            "success": True,
            "access_token": new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500
