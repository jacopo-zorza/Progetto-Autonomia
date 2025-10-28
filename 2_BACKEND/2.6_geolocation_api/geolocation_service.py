"""
2.6 - Geolocation Service
Servizio avanzato per gestione geolocalizzazione con geocoding e reverse geocoding
"""

import requests
import math
from typing import Tuple, Optional, List, Dict
import time

class GeolocationService:
    """Servizio per operazioni di geolocalizzazione avanzate"""
    
    # Nominatim OSM (Open Street Map) - Gratuito e senza API key
    NOMINATIM_URL = "https://nominatim.openstreetmap.org"
    USER_AGENT = "AutonomiaApp/1.0"
    
    # Rate limiting (1 richiesta al secondo per Nominatim)
    MIN_REQUEST_INTERVAL = 1.0
    last_request_time = 0
    
    @staticmethod
    def _wait_for_rate_limit():
        """Rispetta il rate limiting di Nominatim"""
        current_time = time.time()
        elapsed = current_time - GeolocationService.last_request_time
        
        if elapsed < GeolocationService.MIN_REQUEST_INTERVAL:
            time.sleep(GeolocationService.MIN_REQUEST_INTERVAL - elapsed)
        
        GeolocationService.last_request_time = time.time()
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calcola distanza tra due punti usando formula di Haversine
        
        Args:
            lat1, lon1: coordinate primo punto
            lat2, lon2: coordinate secondo punto
            
        Returns:
            float: distanza in km
        """
        R = 6371  # Raggio Terra in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    @staticmethod
    def geocode(address: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Converte un indirizzo in coordinate geografiche (Geocoding)
        
        Args:
            address: indirizzo da convertire
            
        Returns:
            tuple: (success, message, data)
                   data = {
                       'latitude': float,
                       'longitude': float,
                       'display_name': str,
                       'address': dict
                   }
        """
        try:
            if not address or len(address.strip()) < 3:
                return False, "Indirizzo troppo corto", None
            
            # Rate limiting
            GeolocationService._wait_for_rate_limit()
            
            # Request a Nominatim
            params = {
                'q': address,
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': GeolocationService.USER_AGENT
            }
            
            response = requests.get(
                f"{GeolocationService.NOMINATIM_URL}/search",
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                return False, f"Errore servizio: {response.status_code}", None
            
            results = response.json()
            
            if not results or len(results) == 0:
                return False, "Indirizzo non trovato", None
            
            result = results[0]
            
            data = {
                'latitude': float(result['lat']),
                'longitude': float(result['lon']),
                'display_name': result['display_name'],
                'address': result.get('address', {}),
                'importance': result.get('importance', 0)
            }
            
            return True, "Geocoding completato", data
            
        except requests.RequestException as e:
            return False, f"Errore connessione: {str(e)}", None
        except Exception as e:
            return False, f"Errore: {str(e)}", None
    
    @staticmethod
    def reverse_geocode(latitude: float, longitude: float) -> Tuple[bool, str, Optional[Dict]]:
        """
        Converte coordinate geografiche in indirizzo (Reverse Geocoding)
        
        Args:
            latitude: latitudine
            longitude: longitudine
            
        Returns:
            tuple: (success, message, data)
                   data = {
                       'display_name': str,
                       'address': dict,
                       'city': str,
                       'country': str
                   }
        """
        try:
            # Validazione coordinate
            if not (-90 <= latitude <= 90):
                return False, "Latitudine non valida", None
            if not (-180 <= longitude <= 180):
                return False, "Longitudine non valida", None
            
            # Rate limiting
            GeolocationService._wait_for_rate_limit()
            
            # Request a Nominatim
            params = {
                'lat': latitude,
                'lon': longitude,
                'format': 'json',
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': GeolocationService.USER_AGENT
            }
            
            response = requests.get(
                f"{GeolocationService.NOMINATIM_URL}/reverse",
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                return False, f"Errore servizio: {response.status_code}", None
            
            result = response.json()
            
            if 'error' in result:
                return False, "Coordinate non trovate", None
            
            address = result.get('address', {})
            
            data = {
                'display_name': result['display_name'],
                'address': address,
                'city': address.get('city') or address.get('town') or address.get('village', ''),
                'country': address.get('country', ''),
                'postcode': address.get('postcode', ''),
                'road': address.get('road', ''),
                'house_number': address.get('house_number', '')
            }
            
            return True, "Reverse geocoding completato", data
            
        except requests.RequestException as e:
            return False, f"Errore connessione: {str(e)}", None
        except Exception as e:
            return False, f"Errore: {str(e)}", None
    
    @staticmethod
    def search_address(query: str, limit: int = 5) -> Tuple[bool, str, Optional[List[Dict]]]:
        """
        Cerca indirizzi che corrispondono alla query (Autocomplete)
        
        Args:
            query: testo da cercare
            limit: numero massimo di risultati
            
        Returns:
            tuple: (success, message, results)
                   results = [{'display_name': str, 'lat': float, 'lon': float}, ...]
        """
        try:
            if not query or len(query.strip()) < 2:
                return False, "Query troppo corta", None
            
            # Rate limiting
            GeolocationService._wait_for_rate_limit()
            
            # Request a Nominatim
            params = {
                'q': query,
                'format': 'json',
                'limit': min(limit, 10),  # Max 10
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': GeolocationService.USER_AGENT
            }
            
            response = requests.get(
                f"{GeolocationService.NOMINATIM_URL}/search",
                params=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                return False, f"Errore servizio: {response.status_code}", None
            
            results = response.json()
            
            if not results:
                return False, "Nessun risultato trovato", []
            
            # Formatta risultati
            formatted_results = []
            for result in results:
                formatted_results.append({
                    'display_name': result['display_name'],
                    'latitude': float(result['lat']),
                    'longitude': float(result['lon']),
                    'address': result.get('address', {}),
                    'type': result.get('type', ''),
                    'importance': result.get('importance', 0)
                })
            
            return True, f"{len(formatted_results)} risultati trovati", formatted_results
            
        except requests.RequestException as e:
            return False, f"Errore connessione: {str(e)}", None
        except Exception as e:
            return False, f"Errore: {str(e)}", None
    
    @staticmethod
    def find_nearby_coordinates(latitude: float, longitude: float, radius_km: float) -> Dict:
        """
        Calcola il bounding box per cercare coordinate entro un raggio
        
        Args:
            latitude: latitudine centro
            longitude: longitudine centro
            radius_km: raggio in km
            
        Returns:
            dict: {
                'min_lat': float,
                'max_lat': float,
                'min_lon': float,
                'max_lon': float
            }
        """
        # Approssimazione: 1 grado lat = ~111 km
        # 1 grado lon varia con la latitudine
        
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * math.cos(math.radians(latitude)))
        
        return {
            'min_lat': latitude - lat_delta,
            'max_lat': latitude + lat_delta,
            'min_lon': longitude - lon_delta,
            'max_lon': longitude + lon_delta,
            'center_lat': latitude,
            'center_lon': longitude,
            'radius_km': radius_km
        }
    
    @staticmethod
    def is_within_radius(lat1: float, lon1: float, lat2: float, lon2: float, radius_km: float) -> bool:
        """
        Verifica se un punto è entro un certo raggio da un altro
        
        Args:
            lat1, lon1: coordinate centro
            lat2, lon2: coordinate punto da verificare
            radius_km: raggio in km
            
        Returns:
            bool: True se entro il raggio
        """
        distance = GeolocationService.calculate_distance(lat1, lon1, lat2, lon2)
        return distance <= radius_km
    
    @staticmethod
    def get_city_coordinates(city_name: str, country: str = "Italy") -> Tuple[bool, str, Optional[Dict]]:
        """
        Ottiene coordinate di una città
        
        Args:
            city_name: nome città
            country: nazione (default: Italy)
            
        Returns:
            tuple: (success, message, data)
        """
        query = f"{city_name}, {country}"
        return GeolocationService.geocode(query)
    
    @staticmethod
    def format_address(address_components: Dict) -> str:
        """
        Formatta componenti indirizzo in stringa leggibile
        
        Args:
            address_components: dizionario con componenti indirizzo
            
        Returns:
            str: indirizzo formattato
        """
        parts = []
        
        # Via e numero civico
        if 'road' in address_components:
            road = address_components['road']
            if 'house_number' in address_components:
                road = f"{road} {address_components['house_number']}"
            parts.append(road)
        
        # Città
        city = address_components.get('city') or \
               address_components.get('town') or \
               address_components.get('village')
        if city:
            parts.append(city)
        
        # CAP
        if 'postcode' in address_components:
            parts.append(address_components['postcode'])
        
        # Nazione
        if 'country' in address_components:
            parts.append(address_components['country'])
        
        return ', '.join(parts)
