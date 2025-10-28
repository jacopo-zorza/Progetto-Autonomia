"""
2.7 - Payments Routes
API endpoints per gestione pagamenti e transazioni
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))

from models import db, Transaction, Item, User
from payments_service import PaymentsService

# Crea blueprint
payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@payments_bp.route('/transaction', methods=['POST'])
@jwt_required()
def create_transaction():
    """
    Crea una nuova transazione
    
    POST /api/payments/transaction
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    Body: {
        "item_id": int,
        "payment_method": "cash" | "stripe" | "paypal" | "bank_transfer",
        "notes": "optional"
    }
    
    Returns:
        201: Transazione creata
        400: Dati non validi
        401: Non autenticato
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Dati mancanti"
            }), 400
        
        item_id = data.get('item_id')
        payment_method = data.get('payment_method', 'cash')
        notes = data.get('notes')
        
        if not item_id:
            return jsonify({
                "success": False,
                "message": "item_id obbligatorio"
            }), 400
        
        success, message, transaction = PaymentsService.create_transaction(
            item_id=item_id,
            buyer_id=current_user_id,
            payment_method=payment_method,
            notes=notes
        )
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 400
        
        return jsonify({
            "success": True,
            "message": message,
            "transaction": {
                "id": transaction.id,
                "item_id": transaction.item_id,
                "buyer_id": transaction.buyer_id,
                "seller_id": transaction.seller_id,
                "amount": transaction.amount,
                "status": transaction.status,
                "payment_method": transaction.payment_method,
                "timestamp": transaction.timestamp.isoformat()
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@payments_bp.route('/process/<int:transaction_id>', methods=['POST'])
@jwt_required()
def process_payment(transaction_id):
    """
    Processa un pagamento (mock provider)
    
    POST /api/payments/process/<transaction_id>
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    Body: {
        "payment_method": "stripe" | "paypal"
    }
    
    Returns:
        200: Pagamento completato
        400: Errore pagamento
        401: Non autenticato
        403: Non autorizzato
    """
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        
        # Verifica transazione esista e appartenga all'utente
        transaction = PaymentsService.get_transaction(transaction_id)
        if not transaction:
            return jsonify({
                "success": False,
                "message": "Transazione non trovata"
            }), 404
        
        if transaction.buyer_id != current_user_id:
            return jsonify({
                "success": False,
                "message": "Non autorizzato"
            }), 403
        
        payment_method = data.get('payment_method', transaction.payment_method)
        
        success, message, payment_data = PaymentsService.process_payment(
            transaction_id=transaction_id,
            payment_method=payment_method
        )
        
        status_code = 200 if success else 400
        
        return jsonify({
            "success": success,
            "message": message,
            "data": payment_data
        }), status_code
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@payments_bp.route('/confirm-cash/<int:transaction_id>', methods=['POST'])
@jwt_required()
def confirm_cash_payment(transaction_id):
    """
    Conferma pagamento in contanti (solo seller)
    
    POST /api/payments/confirm-cash/<transaction_id>
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Pagamento confermato
        400: Errore
        401: Non autenticato
        403: Non autorizzato
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        success, message = PaymentsService.confirm_cash_payment(
            transaction_id=transaction_id,
            confirmer_id=current_user_id
        )
        
        status_code = 200 if success else 400
        
        return jsonify({
            "success": success,
            "message": message
        }), status_code
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@payments_bp.route('/cancel/<int:transaction_id>', methods=['POST'])
@jwt_required()
def cancel_transaction(transaction_id):
    """
    Cancella transazione
    
    POST /api/payments/cancel/<transaction_id>
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Transazione cancellata
        400: Errore
        401: Non autenticato
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        success, message = PaymentsService.cancel_transaction(
            transaction_id=transaction_id,
            user_id=current_user_id
        )
        
        status_code = 200 if success else 400
        
        return jsonify({
            "success": success,
            "message": message
        }), status_code
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@payments_bp.route('/transaction/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """
    Ottiene dettagli transazione
    
    GET /api/payments/transaction/<transaction_id>
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Dettagli transazione
        403: Non autorizzato
        404: Non trovata
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        transaction = PaymentsService.get_transaction(transaction_id)
        if not transaction:
            return jsonify({
                "success": False,
                "message": "Transazione non trovata"
            }), 404
        
        # Verifica autorizzazione
        if transaction.buyer_id != current_user_id and transaction.seller_id != current_user_id:
            return jsonify({
                "success": False,
                "message": "Non autorizzato"
            }), 403
        
        return jsonify({
            "success": True,
            "transaction": {
                "id": transaction.id,
                "item_id": transaction.item_id,
                "buyer_id": transaction.buyer_id,
                "seller_id": transaction.seller_id,
                "amount": transaction.amount,
                "status": transaction.status,
                "payment_method": transaction.payment_method,
                "payment_id": transaction.payment_id,
                "notes": transaction.notes,
                "timestamp": transaction.timestamp.isoformat(),
                "completed_at": transaction.completed_at.isoformat() if transaction.completed_at else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@payments_bp.route('/my-purchases', methods=['GET'])
@jwt_required()
def get_my_purchases():
    """
    Ottiene acquisti utente
    
    GET /api/payments/my-purchases
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Lista acquisti
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        transactions = PaymentsService.get_user_purchases(current_user_id)
        
        return jsonify({
            "success": True,
            "count": len(transactions),
            "purchases": [{
                "id": t.id,
                "item_id": t.item_id,
                "amount": t.amount,
                "status": t.status,
                "payment_method": t.payment_method,
                "timestamp": t.timestamp.isoformat(),
                "completed_at": t.completed_at.isoformat() if t.completed_at else None
            } for t in transactions]
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@payments_bp.route('/my-sales', methods=['GET'])
@jwt_required()
def get_my_sales():
    """
    Ottiene vendite utente
    
    GET /api/payments/my-sales
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Lista vendite
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        transactions = PaymentsService.get_user_sales(current_user_id)
        
        return jsonify({
            "success": True,
            "count": len(transactions),
            "sales": [{
                "id": t.id,
                "item_id": t.item_id,
                "buyer_id": t.buyer_id,
                "amount": t.amount,
                "status": t.status,
                "payment_method": t.payment_method,
                "timestamp": t.timestamp.isoformat(),
                "completed_at": t.completed_at.isoformat() if t.completed_at else None
            } for t in transactions]
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@payments_bp.route('/balance', methods=['GET'])
@jwt_required()
def get_balance():
    """
    Ottiene bilancio utente
    
    GET /api/payments/balance
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Statistiche finanziarie
    """
    try:
        current_user_id = int(get_jwt_identity())
        
        balance = PaymentsService.calculate_user_balance(current_user_id)
        
        return jsonify({
            "success": True,
            **balance
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500
