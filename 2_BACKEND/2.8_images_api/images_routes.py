"""
2.8 - Images Routes
API endpoints per gestione immagini degli oggetti
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os

# Aggiungi path per imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.4_items_api'))

from models import db, Item, User
from images_service import ImagesService

# Crea blueprint
images_bp = Blueprint('images', __name__, url_prefix='/api/images')


@images_bp.route('/upload/<int:item_id>', methods=['POST'])
@jwt_required()
def upload_image(item_id):
    """
    Upload di un'immagine per un item (richiede autenticazione)
    
    POST /api/images/upload/<item_id>
    Headers: {
        "Authorization": "Bearer <access_token>",
        "Content-Type": "multipart/form-data"
    }
    Form Data: {
        "image": <file>
    }
    
    Returns:
        201: Immagine caricata
        400: Dati non validi
        401: Non autenticato
        403: Non autorizzato (non proprietario)
        404: Item non trovato
    """
    try:
        # Verifica autenticazione
        current_user_id = int(get_jwt_identity())
        
        # Verifica che l'item esista
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                "success": False,
                "message": "Oggetto non trovato"
            }), 404
        
        # Verifica che l'utente sia il proprietario
        if item.seller_id != current_user_id:
            return jsonify({
                "success": False,
                "message": "Non sei autorizzato a caricare immagini per questo oggetto"
            }), 403
        
        # Verifica limite immagini
        can_upload, limit_message = ImagesService.validate_upload_limit(item_id)
        if not can_upload:
            return jsonify({
                "success": False,
                "message": limit_message
            }), 400
        
        # Verifica presenza file
        if 'image' not in request.files:
            return jsonify({
                "success": False,
                "message": "Nessuna immagine fornita"
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({
                "success": False,
                "message": "Nessun file selezionato"
            }), 400
        
        # Salva immagine
        success, message, data = ImagesService.save_image(file, item_id)
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 400
        
        # Aggiorna item con il path dell'immagine
        # Se è la prima immagine, imposta come immagine principale
        if not item.image_url:
            item.image_url = data['path']
            db.session.commit()
        
        return jsonify({
            "success": True,
            "message": message,
            "data": {
                "item_id": item_id,
                "filename": data['filename'],
                "path": data['path'],
                "thumbnail": data['thumbnail'],
                "medium": data['medium'],
                "size": data['size'],
                "is_primary": not item.image_url or item.image_url == data['path']
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore server: {str(e)}"
        }), 500


@images_bp.route('/<int:item_id>/<filename>', methods=['GET'])
def get_image(item_id, filename):
    """
    Recupera un'immagine
    
    GET /api/images/<item_id>/<filename>?size=original|medium|thumbnail
    
    Returns:
        200: File immagine
        404: Immagine non trovata
    """
    try:
        # Query parameter per la dimensione
        size = request.args.get('size', 'original')
        
        if size not in ['original', 'medium', 'thumbnail']:
            size = 'original'
        
        # Costruisci percorso relativo
        relative_path = f"item_{item_id}/{filename}"
        
        # Ottieni percorso completo
        full_path = ImagesService.get_image_path(relative_path, size)
        
        if not full_path:
            return jsonify({
                "success": False,
                "message": "Immagine non trovata"
            }), 404
        
        # Invia file
        return send_file(full_path, mimetype='image/jpeg')
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@images_bp.route('/<int:item_id>/<filename>', methods=['DELETE'])
@jwt_required()
def delete_image(item_id, filename):
    """
    Elimina un'immagine (solo proprietario)
    
    DELETE /api/images/<item_id>/<filename>
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Immagine eliminata
        401: Non autenticato
        403: Non autorizzato
        404: Item o immagine non trovati
    """
    try:
        # Verifica autenticazione
        current_user_id = int(get_jwt_identity())
        
        # Verifica item
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                "success": False,
                "message": "Oggetto non trovato"
            }), 404
        
        # Verifica proprietà
        if item.seller_id != current_user_id:
            return jsonify({
                "success": False,
                "message": "Non autorizzato"
            }), 403
        
        # Costruisci percorso
        relative_path = f"item_{item_id}/{filename}"
        
        # Elimina immagine
        success, message = ImagesService.delete_image(relative_path)
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 404
        
        # Se era l'immagine principale, rimuovi dal database
        if item.image_url == relative_path:
            item.image_url = None
            db.session.commit()
        
        return jsonify({
            "success": True,
            "message": message
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@images_bp.route('/item/<int:item_id>', methods=['GET'])
def get_item_images(item_id):
    """
    Ottiene lista di tutte le immagini di un item
    
    GET /api/images/item/<item_id>
    
    Returns:
        200: Lista immagini
        404: Item non trovato
    """
    try:
        # Verifica item
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                "success": False,
                "message": "Oggetto non trovato"
            }), 404
        
        # Cartella item
        item_folder = os.path.join(ImagesService.UPLOAD_FOLDER, f"item_{item_id}")
        
        images = []
        
        if os.path.exists(item_folder):
            # Lista file (esclusi thumbnail e medium)
            files = [f for f in os.listdir(item_folder) 
                    if os.path.isfile(os.path.join(item_folder, f))
                    and not f.startswith('thumb_')
                    and not f.startswith('medium_')]
            
            for filename in files:
                relative_path = f"item_{item_id}/{filename}"
                images.append({
                    "filename": filename,
                    "url": f"/api/images/{item_id}/{filename}",
                    "thumbnail": f"/api/images/{item_id}/{filename}?size=thumbnail",
                    "medium": f"/api/images/{item_id}/{filename}?size=medium",
                    "is_primary": item.image_url == relative_path
                })
        
        return jsonify({
            "success": True,
            "item_id": item_id,
            "count": len(images),
            "images": images
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@images_bp.route('/set-primary/<int:item_id>/<filename>', methods=['PUT'])
@jwt_required()
def set_primary_image(item_id, filename):
    """
    Imposta un'immagine come principale per un item
    
    PUT /api/images/set-primary/<item_id>/<filename>
    Headers: {
        "Authorization": "Bearer <access_token>"
    }
    
    Returns:
        200: Immagine principale aggiornata
        401: Non autenticato
        403: Non autorizzato
        404: Item o immagine non trovati
    """
    try:
        # Verifica autenticazione
        current_user_id = int(get_jwt_identity())
        
        # Verifica item
        item = Item.query.get(item_id)
        if not item:
            return jsonify({
                "success": False,
                "message": "Oggetto non trovato"
            }), 404
        
        # Verifica proprietà
        if item.seller_id != current_user_id:
            return jsonify({
                "success": False,
                "message": "Non autorizzato"
            }), 403
        
        # Verifica che l'immagine esista
        relative_path = f"item_{item_id}/{filename}"
        full_path = ImagesService.get_image_path(relative_path)
        
        if not full_path:
            return jsonify({
                "success": False,
                "message": "Immagine non trovata"
            }), 404
        
        # Aggiorna immagine principale
        item.image_url = relative_path
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Immagine principale aggiornata",
            "primary_image": relative_path
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500
