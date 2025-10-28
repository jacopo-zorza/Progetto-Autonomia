"""
2.8 - Images Service
Servizio per la gestione delle immagini degli oggetti
"""

import os
import uuid
import imghdr
from datetime import datetime
from pathlib import Path
from PIL import Image
from werkzeug.utils import secure_filename

class ImagesService:
    """Servizio per gestione upload e manipolazione immagini"""
    
    # Configurazione
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', '2.1_flask_setup', 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_IMAGES_PER_ITEM = 5
    
    # Dimensioni per resize
    THUMBNAIL_SIZE = (200, 200)
    MEDIUM_SIZE = (800, 800)
    
    @staticmethod
    def validate_file_extension(filename):
        """
        Verifica che l'estensione del file sia permessa
        
        Args:
            filename: nome del file
            
        Returns:
            bool: True se valida, False altrimenti
        """
        if not filename:
            return False
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ImagesService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_image_content(file_stream):
        """
        Verifica che il contenuto del file sia realmente un'immagine
        
        Args:
            file_stream: stream del file
            
        Returns:
            tuple: (bool, str) - (valido, tipo_immagine)
        """
        try:
            # Salva posizione corrente
            position = file_stream.tell()
            
            # Verifica header immagine
            image_type = imghdr.what(file_stream)
            
            # Ripristina posizione
            file_stream.seek(position)
            
            if image_type in ['png', 'jpeg', 'gif', 'webp']:
                return True, image_type
            return False, None
            
        except Exception as e:
            print(f"Errore validazione immagine: {str(e)}")
            return False, None
    
    @staticmethod
    def generate_unique_filename(original_filename):
        """
        Genera un nome file unico e sicuro
        
        Args:
            original_filename: nome file originale
            
        Returns:
            str: nome file unico
        """
        # Estrai estensione
        ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'jpg'
        
        # Genera UUID
        unique_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        return f"{timestamp}_{unique_id}.{ext}"
    
    @staticmethod
    def save_image(file, item_id):
        """
        Salva un'immagine e crea thumbnail e versione media
        
        Args:
            file: file upload da request.files
            item_id: ID dell'item a cui appartiene l'immagine
            
        Returns:
            tuple: (success, message, data)
                   data = {
                       'filename': nome file originale,
                       'path': percorso file,
                       'thumbnail': percorso thumbnail,
                       'medium': percorso versione media
                   }
        """
        try:
            # Validazione estensione
            if not ImagesService.validate_file_extension(file.filename):
                return False, "Formato file non supportato. Usa: PNG, JPG, JPEG, GIF, WEBP", None
            
            # Validazione contenuto
            is_valid, image_type = ImagesService.validate_image_content(file.stream)
            if not is_valid:
                return False, "Il file non è un'immagine valida", None
            
            # Validazione dimensione (se disponibile)
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > ImagesService.MAX_FILE_SIZE:
                return False, f"File troppo grande. Massimo {ImagesService.MAX_FILE_SIZE / (1024*1024):.1f}MB", None
            
            # Crea cartella per l'item se non esiste
            item_folder = os.path.join(ImagesService.UPLOAD_FOLDER, f"item_{item_id}")
            os.makedirs(item_folder, exist_ok=True)
            
            # Genera nome file unico
            filename = ImagesService.generate_unique_filename(file.filename)
            
            # Percorsi
            original_path = os.path.join(item_folder, filename)
            thumbnail_filename = f"thumb_{filename}"
            thumbnail_path = os.path.join(item_folder, thumbnail_filename)
            medium_filename = f"medium_{filename}"
            medium_path = os.path.join(item_folder, medium_filename)
            
            # Salva originale
            file.save(original_path)
            
            # Crea versioni ridimensionate
            try:
                with Image.open(original_path) as img:
                    # Converti RGBA in RGB se necessario
                    if img.mode == 'RGBA':
                        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                        rgb_img.paste(img, mask=img.split()[3])
                        img = rgb_img
                    
                    # Thumbnail
                    img_thumb = img.copy()
                    img_thumb.thumbnail(ImagesService.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                    img_thumb.save(thumbnail_path, quality=85, optimize=True)
                    
                    # Medium
                    img_medium = img.copy()
                    img_medium.thumbnail(ImagesService.MEDIUM_SIZE, Image.Resampling.LANCZOS)
                    img_medium.save(medium_path, quality=90, optimize=True)
                    
            except Exception as e:
                # Se fallisce il resize, rimuovi file originale
                if os.path.exists(original_path):
                    os.remove(original_path)
                return False, f"Errore elaborazione immagine: {str(e)}", None
            
            # Percorsi relativi per il database
            relative_path = f"item_{item_id}/{filename}"
            relative_thumb = f"item_{item_id}/{thumbnail_filename}"
            relative_medium = f"item_{item_id}/{medium_filename}"
            
            return True, "Immagine caricata con successo", {
                'filename': filename,
                'path': relative_path,
                'thumbnail': relative_thumb,
                'medium': relative_medium,
                'size': file_size
            }
            
        except Exception as e:
            return False, f"Errore durante il salvataggio: {str(e)}", None
    
    @staticmethod
    def delete_image(filepath):
        """
        Elimina un'immagine e le sue versioni ridimensionate
        
        Args:
            filepath: percorso relativo del file
            
        Returns:
            tuple: (success, message)
        """
        try:
            # Percorso completo
            full_path = os.path.join(ImagesService.UPLOAD_FOLDER, filepath)
            
            # Estrai directory e nome file
            directory = os.path.dirname(full_path)
            filename = os.path.basename(full_path)
            
            # Percorsi thumbnail e medium
            thumbnail_path = os.path.join(directory, f"thumb_{filename}")
            medium_path = os.path.join(directory, f"medium_{filename}")
            
            # Elimina file
            files_deleted = 0
            for path in [full_path, thumbnail_path, medium_path]:
                if os.path.exists(path):
                    os.remove(path)
                    files_deleted += 1
            
            # Se la cartella è vuota, rimuovila
            if os.path.exists(directory) and not os.listdir(directory):
                os.rmdir(directory)
            
            if files_deleted > 0:
                return True, f"{files_deleted} file eliminati"
            else:
                return False, "File non trovato"
                
        except Exception as e:
            return False, f"Errore durante l'eliminazione: {str(e)}"
    
    @staticmethod
    def get_image_path(filepath, size='original'):
        """
        Ottiene il percorso completo di un'immagine
        
        Args:
            filepath: percorso relativo
            size: 'original', 'medium', 'thumbnail'
            
        Returns:
            str: percorso completo o None se non esiste
        """
        try:
            if size == 'thumbnail':
                directory = os.path.dirname(filepath)
                filename = os.path.basename(filepath)
                filepath = os.path.join(directory, f"thumb_{filename}")
            elif size == 'medium':
                directory = os.path.dirname(filepath)
                filename = os.path.basename(filepath)
                filepath = os.path.join(directory, f"medium_{filename}")
            
            full_path = os.path.join(ImagesService.UPLOAD_FOLDER, filepath)
            
            if os.path.exists(full_path):
                return full_path
            return None
            
        except Exception as e:
            print(f"Errore get_image_path: {str(e)}")
            return None
    
    @staticmethod
    def get_item_images_count(item_id):
        """
        Conta quante immagini ha un item
        
        Args:
            item_id: ID dell'item
            
        Returns:
            int: numero di immagini
        """
        try:
            item_folder = os.path.join(ImagesService.UPLOAD_FOLDER, f"item_{item_id}")
            
            if not os.path.exists(item_folder):
                return 0
            
            # Conta solo file originali (non thumb_ o medium_)
            files = [f for f in os.listdir(item_folder) 
                    if os.path.isfile(os.path.join(item_folder, f)) 
                    and not f.startswith('thumb_') 
                    and not f.startswith('medium_')]
            
            return len(files)
            
        except Exception as e:
            print(f"Errore conteggio immagini: {str(e)}")
            return 0
    
    @staticmethod
    def validate_upload_limit(item_id):
        """
        Verifica se l'item ha raggiunto il limite di immagini
        
        Args:
            item_id: ID dell'item
            
        Returns:
            tuple: (can_upload, message)
        """
        current_count = ImagesService.get_item_images_count(item_id)
        
        if current_count >= ImagesService.MAX_IMAGES_PER_ITEM:
            return False, f"Limite massimo raggiunto ({ImagesService.MAX_IMAGES_PER_ITEM} immagini per oggetto)"
        
        return True, f"Puoi caricare ancora {ImagesService.MAX_IMAGES_PER_ITEM - current_count} immagini"
