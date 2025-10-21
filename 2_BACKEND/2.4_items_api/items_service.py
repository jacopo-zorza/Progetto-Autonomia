"""
Servizio per la gestione degli Items (oggetti in vendita)
Business logic per CRUD, validazione, ricerca e filtri
"""
import sys
import os
from datetime import datetime
from typing import List, Optional, Tuple
from math import radians, sin, cos, sqrt, atan2

# Aggiungi path per import modelli
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))
from models import db, Item, User


class ItemsService:
    """Servizio per gestione items"""
    
    @staticmethod
    def validate_item_data(name: str, price: float, description: str = None) -> Tuple[bool, str]:
        """
        Valida i dati di un item
        
        Args:
            name: Nome dell'oggetto
            price: Prezzo
            description: Descrizione opzionale
            
        Returns:
            (is_valid, error_message)
        """
        if not name or not name.strip():
            return False, "Nome oggetto è obbligatorio"
        
        if len(name) > 100:
            return False, "Nome troppo lungo (max 100 caratteri)"
        
        if price is None:
            return False, "Prezzo è obbligatorio"
        
        try:
            price = float(price)
            if price < 0:
                return False, "Prezzo non può essere negativo"
            if price > 999999:
                return False, "Prezzo troppo alto (max 999999)"
        except (ValueError, TypeError):
            return False, "Prezzo non valido"
        
        if description and len(description) > 5000:
            return False, "Descrizione troppo lunga (max 5000 caratteri)"
        
        return True, ""
    
    @staticmethod
    def validate_coordinates(latitude: float, longitude: float) -> Tuple[bool, str]:
        """
        Valida coordinate geografiche
        
        Args:
            latitude: Latitudine (-90 a 90)
            longitude: Longitudine (-180 a 180)
            
        Returns:
            (is_valid, error_message)
        """
        if latitude is None or longitude is None:
            return True, ""  # Coordinate opzionali
        
        try:
            lat = float(latitude)
            lng = float(longitude)
            
            if lat < -90 or lat > 90:
                return False, "Latitudine non valida (range: -90 a 90)"
            
            if lng < -180 or lng > 180:
                return False, "Longitudine non valida (range: -180 a 180)"
            
            return True, ""
            
        except (ValueError, TypeError):
            return False, "Coordinate non valide"
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calcola distanza tra due punti geografici usando formula Haversine
        
        Args:
            lat1, lon1: Coordinate primo punto
            lat2, lon2: Coordinate secondo punto
            
        Returns:
            Distanza in km
        """
        # Raggio della Terra in km
        R = 6371.0
        
        # Converti in radianti
        lat1_rad = radians(lat1)
        lon1_rad = radians(lon1)
        lat2_rad = radians(lat2)
        lon2_rad = radians(lon2)
        
        # Differenze
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Formula Haversine
        a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distance = R * c
        return round(distance, 2)
    
    @staticmethod
    def create_item(seller_id: int, name: str, price: float, description: str = None,
                   latitude: float = None, longitude: float = None) -> Tuple[bool, str, Optional[Item]]:
        """
        Crea un nuovo item
        
        Args:
            seller_id: ID del venditore
            name: Nome oggetto
            price: Prezzo
            description: Descrizione opzionale
            latitude: Latitudine opzionale
            longitude: Longitudine opzionale
            
        Returns:
            (success, message, item_object or None)
        """
        # Validazione dati
        valid, msg = ItemsService.validate_item_data(name, price, description)
        if not valid:
            return False, msg, None
        
        valid, msg = ItemsService.validate_coordinates(latitude, longitude)
        if not valid:
            return False, msg, None
        
        # Verifica che il seller esista
        seller = User.query.get(seller_id)
        if not seller:
            return False, "Venditore non trovato", None
        
        try:
            # Crea nuovo item
            new_item = Item(
                name=name.strip(),
                description=description.strip() if description else None,
                price=float(price),
                latitude=float(latitude) if latitude is not None else None,
                longitude=float(longitude) if longitude is not None else None,
                seller_id=seller_id
            )
            
            db.session.add(new_item)
            db.session.commit()
            
            return True, "Oggetto creato con successo", new_item
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante la creazione: {str(e)}", None
    
    @staticmethod
    def get_item_by_id(item_id: int) -> Optional[Item]:
        """
        Ottieni item per ID
        
        Args:
            item_id: ID dell'item
            
        Returns:
            Item object o None
        """
        return Item.query.get(item_id)
    
    @staticmethod
    def update_item(item_id: int, seller_id: int, **kwargs) -> Tuple[bool, str, Optional[Item]]:
        """
        Aggiorna un item esistente
        
        Args:
            item_id: ID dell'item da aggiornare
            seller_id: ID del venditore (per verificare proprietà)
            **kwargs: Campi da aggiornare (name, price, description, latitude, longitude)
            
        Returns:
            (success, message, item_object or None)
        """
        item = Item.query.get(item_id)
        
        if not item:
            return False, "Oggetto non trovato", None
        
        # Verifica che l'utente sia il proprietario
        if item.seller_id != seller_id:
            return False, "Non sei autorizzato a modificare questo oggetto", None
        
        try:
            # Aggiorna campi se forniti
            if 'name' in kwargs:
                valid, msg = ItemsService.validate_item_data(
                    kwargs['name'], 
                    kwargs.get('price', item.price),
                    kwargs.get('description', item.description)
                )
                if not valid:
                    return False, msg, None
                item.name = kwargs['name'].strip()
            
            if 'description' in kwargs:
                desc = kwargs['description']
                item.description = desc.strip() if desc else None
            
            if 'price' in kwargs:
                price = float(kwargs['price'])
                if price < 0:
                    return False, "Prezzo non può essere negativo", None
                item.price = price
            
            if 'latitude' in kwargs and 'longitude' in kwargs:
                valid, msg = ItemsService.validate_coordinates(
                    kwargs['latitude'], 
                    kwargs['longitude']
                )
                if not valid:
                    return False, msg, None
                    
                item.latitude = float(kwargs['latitude']) if kwargs['latitude'] is not None else None
                item.longitude = float(kwargs['longitude']) if kwargs['longitude'] is not None else None
            
            db.session.commit()
            return True, "Oggetto aggiornato con successo", item
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante l'aggiornamento: {str(e)}", None
    
    @staticmethod
    def delete_item(item_id: int, seller_id: int) -> Tuple[bool, str]:
        """
        Elimina un item
        
        Args:
            item_id: ID dell'item da eliminare
            seller_id: ID del venditore (per verificare proprietà)
            
        Returns:
            (success, message)
        """
        item = Item.query.get(item_id)
        
        if not item:
            return False, "Oggetto non trovato"
        
        # Verifica che l'utente sia il proprietario
        if item.seller_id != seller_id:
            return False, "Non sei autorizzato a eliminare questo oggetto"
        
        try:
            db.session.delete(item)
            db.session.commit()
            return True, "Oggetto eliminato con successo"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante l'eliminazione: {str(e)}"
    
    @staticmethod
    def get_items(page: int = 1, per_page: int = 20, 
                 min_price: float = None, max_price: float = None,
                 search: str = None, seller_id: int = None,
                 latitude: float = None, longitude: float = None, radius_km: float = None,
                 order_by: str = 'created_at', order_dir: str = 'desc') -> dict:
        """
        Ottieni lista items con filtri e paginazione
        
        Args:
            page: Numero pagina (default 1)
            per_page: Items per pagina (default 20, max 100)
            min_price: Prezzo minimo
            max_price: Prezzo massimo
            search: Ricerca testuale in nome e descrizione
            seller_id: Filtra per venditore specifico
            latitude: Latitudine per ricerca per distanza
            longitude: Longitudine per ricerca per distanza
            radius_km: Raggio in km per ricerca geografica
            order_by: Campo per ordinamento (created_at, price, name)
            order_dir: Direzione ordinamento (asc, desc)
            
        Returns:
            Dict con items, paginazione e metadati
        """
        # Limita per_page
        per_page = min(per_page, 100)
        
        # Query base
        query = Item.query
        
        # Filtro per venditore
        if seller_id:
            query = query.filter(Item.seller_id == seller_id)
        
        # Filtro prezzo
        if min_price is not None:
            query = query.filter(Item.price >= min_price)
        if max_price is not None:
            query = query.filter(Item.price <= max_price)
        
        # Ricerca testuale
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Item.name.ilike(search_pattern)) | 
                (Item.description.ilike(search_pattern))
            )
        
        # Ordinamento
        if order_by == 'price':
            query = query.order_by(Item.price.desc() if order_dir == 'desc' else Item.price.asc())
        elif order_by == 'name':
            query = query.order_by(Item.name.desc() if order_dir == 'desc' else Item.name.asc())
        else:  # default: created_at
            query = query.order_by(Item.created_at.desc() if order_dir == 'desc' else Item.created_at.asc())
        
        # Paginazione
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        items = pagination.items
        
        # Se richiesta ricerca geografica, calcola distanze
        items_with_distance = []
        if latitude is not None and longitude is not None:
            for item in items:
                item_dict = {
                    'id': item.id,
                    'name': item.name,
                    'description': item.description,
                    'price': item.price,
                    'seller_id': item.seller_id,
                    'seller_username': item.seller.username,
                    'created_at': item.created_at.isoformat(),
                    'latitude': item.latitude,
                    'longitude': item.longitude,
                    'distance_km': None
                }
                
                # Calcola distanza se item ha coordinate
                if item.latitude and item.longitude:
                    distance = ItemsService.calculate_distance(
                        latitude, longitude,
                        item.latitude, item.longitude
                    )
                    item_dict['distance_km'] = distance
                    
                    # Filtra per raggio se specificato
                    if radius_km and distance > radius_km:
                        continue
                
                items_with_distance.append(item_dict)
            
            # Ordina per distanza se specificato
            if radius_km:
                items_with_distance.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else float('inf'))
        else:
            # Senza ricerca geografica, formato standard
            items_with_distance = [{
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'price': item.price,
                'seller_id': item.seller_id,
                'seller_username': item.seller.username,
                'created_at': item.created_at.isoformat(),
                'latitude': item.latitude,
                'longitude': item.longitude
            } for item in items]
        
        return {
            'items': items_with_distance,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_items': pagination.total,
                'total_pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            },
            'filters_applied': {
                'min_price': min_price,
                'max_price': max_price,
                'search': search,
                'seller_id': seller_id,
                'geographic_search': latitude is not None and longitude is not None,
                'radius_km': radius_km
            }
        }
