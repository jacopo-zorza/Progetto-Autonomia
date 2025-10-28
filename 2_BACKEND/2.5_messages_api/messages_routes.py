"""
Routes API per gestione Messaggi (chat tra utenti)
Endpoint per invio, ricezione, conversazioni, notifiche
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from messages_service import MessagesService

# Crea blueprint per le routes messaggi
messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')


@messages_bp.route('', methods=['POST'])
@messages_bp.route('/', methods=['POST'])
@jwt_required()
def send_message():
    """
    Invia un messaggio a un altro utente
    
    POST /api/messages
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    Body: {
        "receiver_id": 5,
        "content": "Ciao! È ancora disponibile la bici?"
    }
    
    Returns:
        201: Messaggio inviato
        400: Dati non validi
        401: Non autenticato
    """
    try:
        # Ottieni ID utente dal token JWT
        sender_id = int(get_jwt_identity())
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Dati mancanti"
            }), 400
        
        receiver_id = data.get('receiver_id')
        content = data.get('content', '').strip()
        
        if not receiver_id:
            return jsonify({
                "success": False,
                "message": "ID destinatario è obbligatorio"
            }), 400
        
        # Invia messaggio
        success, message, msg_obj = MessagesService.send_message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content
        )
        
        if not success:
            status_code = 404 if "non trovato" in message else 400
            return jsonify({
                "success": False,
                "message": message
            }), status_code
        
        return jsonify({
            "success": True,
            "message": message,
            "data": {
                "id": msg_obj.id,
                "sender_id": msg_obj.sender_id,
                "receiver_id": msg_obj.receiver_id,
                "content": msg_obj.content,
                "timestamp": msg_obj.timestamp.isoformat(),
                "read": msg_obj.read
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/inbox', methods=['GET'])
@jwt_required()
def get_inbox():
    """
    Ottieni inbox (messaggi ricevuti)
    
    GET /api/messages/inbox?page=1&per_page=20&unread_only=false
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Query Parameters:
        - page (int): Numero pagina (default: 1)
        - per_page (int): Messaggi per pagina (default: 20)
        - unread_only (bool): Solo messaggi non letti (default: false)
    
    Returns:
        200: Lista messaggi ricevuti
        401: Non autenticato
    """
    try:
        user_id = int(get_jwt_identity())
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        result = MessagesService.get_inbox(
            user_id=user_id,
            page=page,
            per_page=per_page,
            unread_only=unread_only
        )
        
        return jsonify({
            "success": True,
            "data": result['messages'],
            "pagination": result['pagination']
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/sent', methods=['GET'])
@jwt_required()
def get_sent():
    """
    Ottieni messaggi inviati
    
    GET /api/messages/sent?page=1&per_page=20
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Lista messaggi inviati
        401: Non autenticato
    """
    try:
        user_id = int(get_jwt_identity())
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        result = MessagesService.get_sent_messages(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        
        return jsonify({
            "success": True,
            "data": result['messages'],
            "pagination": result['pagination']
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """
    Ottieni lista conversazioni con ultimo messaggio e non letti
    
    GET /api/messages/conversations
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Lista conversazioni
        401: Non autenticato
    """
    try:
        user_id = int(get_jwt_identity())
        
        conversations = MessagesService.get_conversations_list(user_id)
        
        return jsonify({
            "success": True,
            "data": conversations,
            "total": len(conversations)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/conversation/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_conversation(other_user_id):
    """
    Ottieni thread conversazione con un utente specifico
    
    GET /api/messages/conversation/5?page=1&per_page=50
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Thread conversazione
        401: Non autenticato
        404: Utente non trovato
    """
    try:
        user_id = int(get_jwt_identity())
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        result = MessagesService.get_conversation(
            user_id=user_id,
            other_user_id=other_user_id,
            page=page,
            per_page=per_page
        )
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "message": result['error']
            }), 404
        
        return jsonify({
            "success": True,
            "data": result['messages'],
            "other_user": result['other_user'],
            "pagination": result['pagination']
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/<int:message_id>/read', methods=['PUT'])
@jwt_required()
def mark_message_read(message_id):
    """
    Segna un messaggio come letto
    
    PUT /api/messages/123/read
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Messaggio segnato come letto
        401: Non autenticato
        403: Non autorizzato
        404: Messaggio non trovato
    """
    try:
        user_id = int(get_jwt_identity())
        
        success, message = MessagesService.mark_as_read(
            message_id=message_id,
            user_id=user_id
        )
        
        if not success:
            status_code = 404 if "non trovato" in message else 403
            return jsonify({
                "success": False,
                "message": message
            }), status_code
        
        return jsonify({
            "success": True,
            "message": message
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/conversation/<int:other_user_id>/read', methods=['PUT'])
@jwt_required()
def mark_conversation_read(other_user_id):
    """
    Segna tutti i messaggi di una conversazione come letti
    
    PUT /api/messages/conversation/5/read
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Messaggi segnati come letti
        401: Non autenticato
    """
    try:
        user_id = int(get_jwt_identity())
        
        success, message, count = MessagesService.mark_conversation_as_read(
            user_id=user_id,
            other_user_id=other_user_id
        )
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 500
        
        return jsonify({
            "success": True,
            "message": message,
            "marked_count": count
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """
    Elimina un messaggio
    
    DELETE /api/messages/123
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Messaggio eliminato
        401: Non autenticato
        403: Non autorizzato
        404: Messaggio non trovato
    """
    try:
        user_id = int(get_jwt_identity())
        
        success, message = MessagesService.delete_message(
            message_id=message_id,
            user_id=user_id
        )
        
        if not success:
            status_code = 404 if "non trovato" in message else 403
            return jsonify({
                "success": False,
                "message": message
            }), status_code
        
        return jsonify({
            "success": True,
            "message": message
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@messages_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """
    Ottieni conteggio messaggi non letti totali
    
    GET /api/messages/unread-count
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Conteggio non letti
        401: Non autenticato
    """
    try:
        user_id = int(get_jwt_identity())
        
        count = MessagesService.get_unread_count(user_id)
        
        return jsonify({
            "success": True,
            "unread_count": count
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500
