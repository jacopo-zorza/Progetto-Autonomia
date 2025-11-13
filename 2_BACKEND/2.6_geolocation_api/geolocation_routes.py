"""
2.6 - Geolocation Routes
API endpoints per servizi di geolocalizzazione avanzati
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os

# Aggiungi path per imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))

from models import db, Item, User
from geolocation_service import GeolocationService

# Crea blueprint
geolocation_bp = Blueprint('geolocation', __name__, url_prefix='/api/geo')


@geolocation_bp.route('/geocode', methods=['GET'])
def geocode():
    """
    Converte indirizzo in coordinate (Geocoding)
    
    GET /api/geo/geocode?address=<indirizzo>
    
    Query Parameters:
        address: indirizzo da convertire
    
    Returns:
        200: Coordinate trovate
        400: Parametri mancanti
        404: Indirizzo non trovato
    """
    try:
        address = request.args.get('address', '').strip()
        
        if not address:
            return jsonify({
                "success": False,
                "message": "Parametro 'address' obbligatorio"
            }), 400
        
        success, message, data = GeolocationService.geocode(address)
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 404 if "non trovato" in message else 400
        
        return jsonify({
            "success": True,
            "message": message,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@geolocation_bp.route('/reverse', methods=['GET'])
def reverse_geocode():
    """
    Converte coordinate in indirizzo (Reverse Geocoding)
    
    GET /api/geo/reverse?lat=<latitude>&lon=<longitude>
    
    Query Parameters:
        lat: latitudine
        lon: longitudine
    
    Returns:
        200: Indirizzo trovato
        400: Parametri non validi
        404: Coordinate non trovate
    """
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        
        if not lat or not lon:
            return jsonify({
                "success": False,
                "message": "Parametri 'lat' e 'lon' obbligatori"
            }), 400
        
        try:
            latitude = float(lat)
            longitude = float(lon)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Coordinate non valide"
            }), 400
        
        success, message, data = GeolocationService.reverse_geocode(latitude, longitude)
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 404 if "non trovate" in message else 400
        
        return jsonify({
            "success": True,
            "message": message,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@geolocation_bp.route('/search', methods=['GET'])
def search_address():
    """
    Cerca indirizzi (Autocomplete)
    
    GET /api/geo/search?q=<query>&limit=<numero>
    
    Query Parameters:
        q: testo da cercare
        limit: numero massimo risultati (default: 5, max: 10)
    
    Returns:
        200: Risultati trovati
        400: Parametri non validi
    """
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', '5')
        
        if not query:
            return jsonify({
                "success": False,
                "message": "Parametro 'q' obbligatorio"
            }), 400
        
        try:
            limit = int(limit)
            limit = min(max(1, limit), 10)  # Tra 1 e 10
        except ValueError:
            limit = 5
        
        success, message, results = GeolocationService.search_address(query, limit)
        
        if not success and results is None:
            return jsonify({
                "success": False,
                "message": message
            }), 400
        
        return jsonify({
            "success": True,
            "message": message,
            "count": len(results) if results else 0,
            "results": results or []
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@geolocation_bp.route('/distance', methods=['GET'])
def calculate_distance():
    """
    Calcola distanza tra due punti
    
    GET /api/geo/distance?lat1=<lat1>&lon1=<lon1>&lat2=<lat2>&lon2=<lon2>
    
    Query Parameters:
        lat1, lon1: coordinate primo punto
        lat2, lon2: coordinate secondo punto
    
    Returns:
        200: Distanza calcolata
        400: Parametri non validi
    """
    try:
        lat1 = request.args.get('lat1')
        lon1 = request.args.get('lon1')
        lat2 = request.args.get('lat2')
        lon2 = request.args.get('lon2')
        
        if not all([lat1, lon1, lat2, lon2]):
            return jsonify({
                "success": False,
                "message": "Parametri 'lat1', 'lon1', 'lat2', 'lon2' obbligatori"
            }), 400
        
        try:
            lat1 = float(lat1)
            lon1 = float(lon1)
            lat2 = float(lat2)
            lon2 = float(lon2)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Coordinate non valide"
            }), 400
        
        distance = GeolocationService.calculate_distance(lat1, lon1, lat2, lon2)
        
        return jsonify({
            "success": True,
            "distance_km": round(distance, 2),
            "distance_m": round(distance * 1000, 0)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@geolocation_bp.route('/nearby', methods=['GET'])
@jwt_required()
def find_nearby_items():
    """
    Trova items nelle vicinanze di coordinate specifiche
    
    GET /api/geo/nearby?lat=<lat>&lon=<lon>&radius=<km>
    
    Query Parameters:
        lat: latitudine centro
        lon: longitudine centro
        radius: raggio in km (default: 10, max: 100)
    
    Returns:
        200: Items trovati
        400: Parametri non validi
    """
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        radius = request.args.get('radius', '10')
        
        if not lat or not lon:
            return jsonify({
                "success": False,
                "message": "Parametri 'lat' e 'lon' obbligatori"
            }), 400
        
        try:
            latitude = float(lat)
            longitude = float(lon)
            radius_km = float(radius)
            radius_km = min(max(1, radius_km), 100)  # Tra 1 e 100 km
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Parametri non validi"
            }), 400
        
        # Calcola bounding box
        bbox = GeolocationService.find_nearby_coordinates(latitude, longitude, radius_km)
        
        # Query items con coordinate nel bounding box
        items = Item.query.filter(
            Item.latitude.isnot(None),
            Item.longitude.isnot(None),
            Item.latitude >= bbox['min_lat'],
            Item.latitude <= bbox['max_lat'],
            Item.longitude >= bbox['min_lon'],
            Item.longitude <= bbox['max_lon']
        ).all()
        
        # Filtra per distanza esatta e calcola distanza
        nearby_items = []
        for item in items:
            distance = GeolocationService.calculate_distance(
                latitude, longitude,
                item.latitude, item.longitude
            )
            
            if distance <= radius_km:
                nearby_items.append({
                    'id': item.id,
                    'title': item.title,
                    'name': item.title,
                    'price': item.price,
                    'latitude': item.latitude,
                    'longitude': item.longitude,
                    'distance_km': round(distance, 2),
                    'seller_id': item.seller_id,
                    'created_at': item.created_at.isoformat()
                })
        
        # Ordina per distanza
        nearby_items.sort(key=lambda x: x['distance_km'])
        
        return jsonify({
            "success": True,
            "center": {
                "latitude": latitude,
                "longitude": longitude
            },
            "radius_km": radius_km,
            "count": len(nearby_items),
            "items": nearby_items
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500


@geolocation_bp.route('/city/<city_name>', methods=['GET'])
def get_city_info(city_name):
    """
    Ottiene informazioni e coordinate di una città
    
    GET /api/geo/city/<city_name>?country=<paese>
    
    Query Parameters:
        country: paese (default: Italy)
    
    Returns:
        200: Informazioni città
        404: Città non trovata
    """
    try:
        country = request.args.get('country', 'Italy')
        
        success, message, data = GeolocationService.get_city_coordinates(city_name, country)
        
        if not success:
            return jsonify({
                "success": False,
                "message": message
            }), 404
        
        return jsonify({
            "success": True,
            "city": city_name,
            "country": country,
            "data": data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Errore: {str(e)}"
        }), 500
