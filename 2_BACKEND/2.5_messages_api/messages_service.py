"""
Servizio per la gestione dei messaggi (chat tra utenti)
Business logic per invio, ricezione, thread conversazioni
"""
import sys
import os
from datetime import datetime
from typing import List, Optional, Tuple, Dict
from sqlalchemy import or_, and_

# Aggiungi path per import modelli
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))
from models import db, Message, User


class MessagesService:
    """Servizio per gestione messaggi tra utenti"""
    
    @staticmethod
    def validate_message_content(content: str) -> Tuple[bool, str]:
        """
        Valida il contenuto di un messaggio
        
        Args:
            content: Testo del messaggio
            
        Returns:
            (is_valid, error_message)
        """
        if not content or not content.strip():
            return False, "Contenuto messaggio è obbligatorio"
        
        if len(content) > 5000:
            return False, "Messaggio troppo lungo (max 5000 caratteri)"
        
        return True, ""
    
    @staticmethod
    def send_message(sender_id: int, receiver_id: int, content: str) -> Tuple[bool, str, Optional[Message]]:
        """
        Invia un messaggio da un utente a un altro
        
        Args:
            sender_id: ID mittente
            receiver_id: ID destinatario
            content: Testo del messaggio
            
        Returns:
            (success, message, message_object or None)
        """
        # Validazione contenuto
        valid, msg = MessagesService.validate_message_content(content)
        if not valid:
            return False, msg, None
        
        # Non puoi inviare messaggi a te stesso
        if sender_id == receiver_id:
            return False, "Non puoi inviare messaggi a te stesso", None
        
        # Verifica che entrambi gli utenti esistano
        sender = User.query.get(sender_id)
        receiver = User.query.get(receiver_id)
        
        if not sender:
            return False, "Mittente non trovato", None
        if not receiver:
            return False, "Destinatario non trovato", None
        
        try:
            # Crea nuovo messaggio
            new_message = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content.strip(),
                read=False
            )
            
            db.session.add(new_message)
            db.session.commit()
            
            return True, "Messaggio inviato con successo", new_message
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante l'invio: {str(e)}", None
    
    @staticmethod
    def get_message_by_id(message_id: int) -> Optional[Message]:
        """
        Ottieni messaggio per ID
        
        Args:
            message_id: ID del messaggio
            
        Returns:
            Message object o None
        """
        return Message.query.get(message_id)
    
    @staticmethod
    def mark_as_read(message_id: int, user_id: int) -> Tuple[bool, str]:
        """
        Segna un messaggio come letto (solo dal destinatario)
        
        Args:
            message_id: ID del messaggio
            user_id: ID dell'utente che vuole segnare come letto
            
        Returns:
            (success, message)
        """
        message = Message.query.get(message_id)
        
        if not message:
            return False, "Messaggio non trovato"
        
        # Solo il destinatario può segnare come letto
        if message.receiver_id != user_id:
            return False, "Non sei autorizzato a segnare questo messaggio come letto"
        
        # Se già letto, nessuna operazione
        if message.read:
            return True, "Messaggio già letto"
        
        try:
            message.read = True
            db.session.commit()
            return True, "Messaggio segnato come letto"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante l'aggiornamento: {str(e)}"
    
    @staticmethod
    def mark_conversation_as_read(user_id: int, other_user_id: int) -> Tuple[bool, str, int]:
        """
        Segna tutti i messaggi di una conversazione come letti
        
        Args:
            user_id: ID utente corrente
            other_user_id: ID dell'altro utente nella conversazione
            
        Returns:
            (success, message, count_marked)
        """
        try:
            # Trova tutti i messaggi non letti ricevuti dall'altro utente
            unread_messages = Message.query.filter(
                and_(
                    Message.receiver_id == user_id,
                    Message.sender_id == other_user_id,
                    Message.read == False
                )
            ).all()
            
            count = len(unread_messages)
            
            if count == 0:
                return True, "Nessun messaggio da segnare come letto", 0
            
            # Segna tutti come letti
            for msg in unread_messages:
                msg.read = True
            
            db.session.commit()
            return True, f"{count} messaggi segnati come letti", count
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante l'aggiornamento: {str(e)}", 0
    
    @staticmethod
    def delete_message(message_id: int, user_id: int) -> Tuple[bool, str]:
        """
        Elimina un messaggio (solo mittente o destinatario)
        
        Args:
            message_id: ID del messaggio
            user_id: ID dell'utente che vuole eliminare
            
        Returns:
            (success, message)
        """
        message = Message.query.get(message_id)
        
        if not message:
            return False, "Messaggio non trovato"
        
        # Solo mittente o destinatario possono eliminare
        if message.sender_id != user_id and message.receiver_id != user_id:
            return False, "Non sei autorizzato a eliminare questo messaggio"
        
        try:
            db.session.delete(message)
            db.session.commit()
            return True, "Messaggio eliminato con successo"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore durante l'eliminazione: {str(e)}"
    
    @staticmethod
    def get_inbox(user_id: int, page: int = 1, per_page: int = 20, 
                 unread_only: bool = False) -> Dict:
        """
        Ottieni inbox messaggi ricevuti
        
        Args:
            user_id: ID utente
            page: Numero pagina
            per_page: Messaggi per pagina
            unread_only: Se True, mostra solo non letti
            
        Returns:
            Dict con messaggi e paginazione
        """
        query = Message.query.filter(Message.receiver_id == user_id)
        
        if unread_only:
            query = query.filter(Message.read == False)
        
        query = query.order_by(Message.timestamp.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        messages = [{
            'id': msg.id,
            'sender_id': msg.sender_id,
            'sender_username': msg.sender.username,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat(),
            'read': msg.read
        } for msg in pagination.items]
        
        return {
            'messages': messages,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }
    
    @staticmethod
    def get_sent_messages(user_id: int, page: int = 1, per_page: int = 20) -> Dict:
        """
        Ottieni messaggi inviati
        
        Args:
            user_id: ID utente
            page: Numero pagina
            per_page: Messaggi per pagina
            
        Returns:
            Dict con messaggi e paginazione
        """
        query = Message.query.filter(Message.sender_id == user_id)
        query = query.order_by(Message.timestamp.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        messages = [{
            'id': msg.id,
            'receiver_id': msg.receiver_id,
            'receiver_username': msg.receiver.username,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat(),
            'read': msg.read
        } for msg in pagination.items]
        
        return {
            'messages': messages,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }
    
    @staticmethod
    def get_conversation(user_id: int, other_user_id: int, 
                        page: int = 1, per_page: int = 50) -> Dict:
        """
        Ottieni thread conversazione tra due utenti
        
        Args:
            user_id: ID utente corrente
            other_user_id: ID altro utente
            page: Numero pagina
            per_page: Messaggi per pagina
            
        Returns:
            Dict con messaggi della conversazione
        """
        # Verifica che l'altro utente esista
        other_user = User.query.get(other_user_id)
        if not other_user:
            return {
                'messages': [],
                'pagination': {
                    'page': 1,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0,
                    'has_next': False,
                    'has_prev': False
                },
                'error': 'Utente non trovato'
            }
        
        # Ottieni tutti i messaggi tra i due utenti
        query = Message.query.filter(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == user_id)
            )
        ).order_by(Message.timestamp.asc())  # Ordine cronologico
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        messages = [{
            'id': msg.id,
            'sender_id': msg.sender_id,
            'receiver_id': msg.receiver_id,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat(),
            'read': msg.read,
            'is_mine': msg.sender_id == user_id  # Helper per frontend
        } for msg in pagination.items]
        
        return {
            'messages': messages,
            'other_user': {
                'id': other_user.id,
                'username': other_user.username,
                'email': other_user.email
            },
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }
    
    @staticmethod
    def get_conversations_list(user_id: int) -> List[Dict]:
        """
        Ottieni lista di tutte le conversazioni dell'utente
        Con ultimo messaggio e conteggio non letti
        
        Args:
            user_id: ID utente
            
        Returns:
            Lista conversazioni con metadati
        """
        # Ottieni tutti i messaggi dell'utente (inviati e ricevuti)
        messages = Message.query.filter(
            or_(
                Message.sender_id == user_id,
                Message.receiver_id == user_id
            )
        ).order_by(Message.timestamp.desc()).all()
        
        # Raggruppa per conversazione (altro utente)
        conversations = {}
        
        for msg in messages:
            # Determina l'altro utente
            other_user_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            
            if other_user_id not in conversations:
                conversations[other_user_id] = {
                    'other_user_id': other_user_id,
                    'other_user': None,  # Sarà popolato dopo
                    'last_message': None,
                    'last_message_timestamp': None,
                    'unread_count': 0,
                    'total_messages': 0
                }
            
            conv = conversations[other_user_id]
            conv['total_messages'] += 1
            
            # Ultimo messaggio (più recente)
            if conv['last_message'] is None:
                conv['last_message'] = msg.content[:100]  # Preview
                conv['last_message_timestamp'] = msg.timestamp
                conv['last_message_sender'] = 'me' if msg.sender_id == user_id else 'them'
            
            # Conta non letti (solo messaggi ricevuti)
            if msg.receiver_id == user_id and not msg.read:
                conv['unread_count'] += 1
        
        # Aggiungi info altri utenti
        result = []
        for other_user_id, conv in conversations.items():
            other_user = User.query.get(other_user_id)
            if other_user:
                conv['other_user'] = {
                    'id': other_user.id,
                    'username': other_user.username,
                    'email': other_user.email
                }
                conv['last_message_timestamp'] = conv['last_message_timestamp'].isoformat()
                result.append(conv)
        
        # Ordina per timestamp ultimo messaggio (più recenti prima)
        result.sort(key=lambda x: x['last_message_timestamp'], reverse=True)
        
        return result
    
    @staticmethod
    def get_unread_count(user_id: int) -> int:
        """
        Conta messaggi non letti totali
        
        Args:
            user_id: ID utente
            
        Returns:
            Numero messaggi non letti
        """
        return Message.query.filter(
            and_(
                Message.receiver_id == user_id,
                Message.read == False
            )
        ).count()
