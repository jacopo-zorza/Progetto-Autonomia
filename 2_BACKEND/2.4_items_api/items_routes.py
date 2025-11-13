"""
Routes API per gestione Items (oggetti in vendita)
Endpoint per CRUD, ricerca, filtri e geolocalizzazione
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from items_service import ItemsService

# Crea blueprint per le routes items
items_bp = Blueprint('items', __name__, url_prefix='/api/items')


@items_bp.route('', methods=['GET'])
@items_bp.route('/', methods=['GET'])
def get_items():
    """
    Ottieni lista items con filtri e paginazione
    
    GET /api/items?page=1&per_page=20&min_price=10&max_price=100&search=bici&order_by=price&order_dir=asc
    
    Query Parameters:
        - page (int): Numero pagina (default: 1)
        - per_page (int): Items per pagina (default: 20, max: 100)
        - min_price (float): Prezzo minimo
        - max_price (float): Prezzo massimo
        - search (str): Ricerca testuale in nome/descrizione
        - seller_id (int): Filtra per venditore specifico
        - latitude (float): Latitudine per ricerca geografica
        - longitude (float): Longitudine per ricerca geografica
        - radius_km (float): Raggio in km per ricerca geografica
        - order_by (str): Campo ordinamento (created_at, price, name)
        - order_dir (str): Direzione (asc, desc)
    
    Returns:
        200: Lista items con paginazione
        400: Parametri non validi
    """
    try:
        # Parametri paginazione
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Filtri prezzo
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        # Ricerca testuale
        search = request.args.get('search', type=str)
        
        # Filtro venditore
        seller_id = request.args.get('seller_id', type=int)
        
        # Ricerca geografica
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        radius_km = request.args.get('radius_km', type=float)
        
        # Ordinamento
        order_by = request.args.get('order_by', 'created_at', type=str)
        order_dir = request.args.get('order_dir', 'desc', type=str)
        
        # Validazione parametri
        if page < 1:
            return jsonify({
                "success": False,
                "message": "Numero pagina non valido"
            }), 400
        
        if order_by not in ['created_at', 'price', 'name']:
            return jsonify({
                "success": False,
                "message": "Campo ordinamento non valido (usa: created_at, price, name)"
            }), 400
        
        if order_dir not in ['asc', 'desc']:
            return jsonify({
                "success": False,
                "message": "Direzione ordinamento non valida (usa: asc, desc)"
            }), 400
        
        # Ottieni items
        result = ItemsService.get_items(
            page=page,
            per_page=per_page,
            min_price=min_price,
            max_price=max_price,
            search=search,
            seller_id=seller_id,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            order_by=order_by,
            order_dir=order_dir
        )
        
        return jsonify({
            "success": True,
            "data": result['items'],
            "pagination": result['pagination'],
            "filters": result['filters_applied']
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@items_bp.route('/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """
    Ottieni dettagli di un singolo item
    
    GET /api/items/123
    
    Returns:
        200: Dettagli item
        404: Item non trovato
    """
    try:
        item = ItemsService.get_item_by_id(item_id)
        
        if not item:
            return jsonify({
                "success": False,
                "message": "Oggetto non trovato"
            }), 404
        
        serialized = ItemsService.serialize_item(item)
        serialized["reviews_count"] = item.reviews.count()
        serialized["transactions_count"] = item.transactions.count()
        return jsonify({
            "success": True,
            "data": serialized
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@items_bp.route('', methods=['POST'])
@items_bp.route('/', methods=['POST'])
@jwt_required()
def create_item():
    """
    Crea un nuovo item (richiede autenticazione)
    
    POST /api/items
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    Body: {
        "title": "Bicicletta mountain bike",
        "description": "Bici usata in ottimo stato",
        "price": 250.00,
        "category": "Sport",
        "condition": "Buono",
        "location": "Milano",
        "image": "data:image/png;base64,...",
        "latitude": 45.4642,  // opzionale
        "longitude": 9.1900   // opzionale
    }
    
    Returns:
        201: Item creato con successo
        400: Dati non validi
        401: Non autenticato
    """
    try:
        # Ottieni ID utente dal token JWT
        current_user_id = int(get_jwt_identity())
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Dati mancanti"
            }), 400
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip() if data.get('description') else None
        price = data.get('price')
        category = data.get('category')
        condition = data.get('condition')
        location = data.get('location') or data.get('location_name')
        image = data.get('image') or data.get('image_url')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        # Crea item
        success, message, item = ItemsService.create_item(
            seller_id=current_user_id,
            title=title,
            price=price,
            description=description,
            category=category,
            condition=condition,
            location=location,
            image=image,
            latitude=latitude,
            longitude=longitude
        )
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 400
        
        return jsonify({
            "success": True,
            "message": message,
            "data": ItemsService.serialize_item(item)
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@items_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    """
    Aggiorna un item esistente (solo dal proprietario)
    
    PUT /api/items/123
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    Body: {
        "title": "Nuovo titolo",  // opzionale
        "description": "Nuova descrizione",  // opzionale
        "price": 300.00,  // opzionale
        "category": "Sport",  // opzionale
        "condition": "Ottimo",  // opzionale
        "location": "Monza",  // opzionale
        "image": "data:image/png;base64,...",  // opzionale
        "latitude": 45.4642,  // opzionale
        "longitude": 9.1900  // opzionale
    }
    
    Returns:
        200: Item aggiornato
        400: Dati non validi
        401: Non autenticato
        403: Non autorizzato (non sei il proprietario)
        404: Item non trovato
    """
    try:
        # Ottieni ID utente dal token JWT
        current_user_id = int(get_jwt_identity())
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "Dati mancanti"
            }), 400
        
        # Prepara dati per update (solo campi forniti)
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'price' in data:
            update_data['price'] = data['price']
        if 'category' in data:
            update_data['category'] = data['category']
        if 'condition' in data:
            update_data['condition'] = data['condition']
        if 'location' in data or 'location_name' in data:
            update_data['location'] = data.get('location', data.get('location_name'))
        if 'image' in data or 'image_url' in data:
            update_data['image'] = data.get('image', data.get('image_url'))
        if 'latitude' in data:
            update_data['latitude'] = data['latitude']
        if 'longitude' in data:
            update_data['longitude'] = data['longitude']
        
        # Aggiorna item
        success, message, item = ItemsService.update_item(
            item_id=item_id,
            seller_id=current_user_id,
            **update_data
        )
        
        if not success:
            status_code = 404 if "non trovato" in message else 403 if "autorizzato" in message else 400
            return jsonify({
                "success": False,
                "message": message
            }), status_code
        
        return jsonify({
            "success": True,
            "message": message,
            "data": ItemsService.serialize_item(item)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@items_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    """
    Elimina un item (solo dal proprietario)
    
    DELETE /api/items/123
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Item eliminato
        401: Non autenticato
        403: Non autorizzato (non sei il proprietario)
        404: Item non trovato
    """
    try:
        # Ottieni ID utente dal token JWT
        current_user_id = int(get_jwt_identity())
        
        # Elimina item
        success, message = ItemsService.delete_item(
            item_id=item_id,
            seller_id=current_user_id
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


@items_bp.route('/my-items', methods=['GET'])
@jwt_required()
def get_my_items():
    """
    Ottieni tutti gli items dell'utente corrente
    
    GET /api/items/my-items?page=1&per_page=20
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Lista items dell'utente
        401: Non autenticato
    """
    try:
        # Ottieni ID utente dal token JWT
        current_user_id = int(get_jwt_identity())
        
        # Parametri paginazione
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Ottieni items dell'utente
        result = ItemsService.get_items(
            page=page,
            per_page=per_page,
            seller_id=current_user_id,
            order_by='created_at',
            order_dir='desc'
        )
        
        return jsonify({
            "success": True,
            "data": result['items'],
            "pagination": result['pagination']
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500
