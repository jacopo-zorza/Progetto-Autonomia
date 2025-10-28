"""
2.7 - Payments Service
Servizio per gestione pagamenti e transazioni (con mock provider)
"""

import uuid
import random
from datetime import datetime
from typing import Tuple, Optional, Dict
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))

from models import db, Transaction, Item, User

class PaymentsService:
    """Servizio per gestione pagamenti"""
    
    # Stati transazione
    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_FAILED = 'failed'
    
    # Metodi pagamento
    METHOD_STRIPE = 'stripe'
    METHOD_PAYPAL = 'paypal'
    METHOD_CASH = 'cash'
    METHOD_BANK_TRANSFER = 'bank_transfer'
    
    @staticmethod
    def get_transaction(transaction_id: int) -> Optional[Transaction]:
        """
        Ottiene una transazione per ID
        
        Args:
            transaction_id: ID transazione
            
        Returns:
            Transaction o None
        """
        try:
            return Transaction.query.get(transaction_id)
        except Exception:
            return None
    
    @staticmethod
    def create_transaction(item_id: int, buyer_id: int, payment_method: str = METHOD_CASH, notes: str = None) -> Tuple[bool, str, Optional[Transaction]]:
        """
        Crea una nuova transazione
        
        Args:
            item_id: ID item da acquistare
            buyer_id: ID acquirente
            payment_method: metodo pagamento
            notes: note aggiuntive
            
        Returns:
            tuple: (success, message, transaction)
        """
        try:
            # Verifica item esista
            item = Item.query.get(item_id)
            if not item:
                return False, "Oggetto non trovato", None
            
            # Verifica item non già venduto
            if item.is_sold:
                return False, "Oggetto già venduto", None
            
            # Verifica buyer non sia il seller
            if item.seller_id == buyer_id:
                return False, "Non puoi acquistare i tuoi oggetti", None
            
            # Verifica buyer esista
            buyer = User.query.get(buyer_id)
            if not buyer:
                return False, "Acquirente non trovato", None
            
            # Crea transazione
            transaction = Transaction(
                item_id=item_id,
                buyer_id=buyer_id,
                seller_id=item.seller_id,
                amount=item.price,
                status=PaymentsService.STATUS_PENDING,
                payment_method=payment_method,
                notes=notes
            )
            
            db.session.add(transaction)
            db.session.commit()
            
            return True, "Transazione creata con successo", transaction
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore: {str(e)}", None
    
    @staticmethod
    def process_payment(transaction_id: int, payment_method: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Processa un pagamento (MOCK - simula provider esterno)
        
        Args:
            transaction_id: ID transazione
            payment_method: metodo pagamento
            
        Returns:
            tuple: (success, message, payment_data)
        """
        try:
            transaction = Transaction.query.get(transaction_id)
            if not transaction:
                return False, "Transazione non trovata", None
            
            if transaction.status != PaymentsService.STATUS_PENDING:
                return False, f"Transazione già {transaction.status}", None
            
            # MOCK PAYMENT PROVIDER
            # In produzione: integrare con Stripe, PayPal, etc.
            success = random.random() > 0.1  # 90% successo
            
            if success:
                # Genera ID pagamento mock
                payment_id = f"MOCK_{payment_method.upper()}_{uuid.uuid4().hex[:12]}"
                
                # Aggiorna transazione
                transaction.status = PaymentsService.STATUS_COMPLETED
                transaction.payment_id = payment_id
                transaction.payment_method = payment_method
                transaction.completed_at = datetime.utcnow()
                
                # Marca item come venduto
                item = Item.query.get(transaction.item_id)
                item.is_sold = True
                
                db.session.commit()
                
                return True, "Pagamento completato", {
                    'transaction_id': transaction.id,
                    'payment_id': payment_id,
                    'amount': transaction.amount,
                    'status': transaction.status,
                    'completed_at': transaction.completed_at.isoformat()
                }
            else:
                # Pagamento fallito
                transaction.status = PaymentsService.STATUS_FAILED
                db.session.commit()
                
                return False, "Pagamento fallito", {
                    'transaction_id': transaction.id,
                    'status': transaction.status,
                    'error': 'Payment declined by provider (MOCK)'
                }
                
        except Exception as e:
            db.session.rollback()
            return False, f"Errore: {str(e)}", None
    
    @staticmethod
    def cancel_transaction(transaction_id: int, user_id: int) -> Tuple[bool, str]:
        """
        Cancella una transazione (solo se pending)
        
        Args:
            transaction_id: ID transazione
            user_id: ID utente (buyer o seller)
            
        Returns:
            tuple: (success, message)
        """
        try:
            transaction = Transaction.query.get(transaction_id)
            if not transaction:
                return False, "Transazione non trovata"
            
            # Verifica permessi
            if transaction.buyer_id != user_id and transaction.seller_id != user_id:
                return False, "Non autorizzato"
            
            # Verifica stato
            if transaction.status != PaymentsService.STATUS_PENDING:
                return False, f"Impossibile cancellare transazione {transaction.status}"
            
            # Cancella
            transaction.status = PaymentsService.STATUS_CANCELLED
            db.session.commit()
            
            return True, "Transazione cancellata"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore: {str(e)}"
    
    @staticmethod
    def get_transaction(transaction_id: int) -> Optional[Transaction]:
        """Ottiene una transazione"""
        return Transaction.query.get(transaction_id)
    
    @staticmethod
    def get_user_purchases(user_id: int) -> list:
        """Ottiene acquisti utente"""
        return Transaction.query.filter_by(buyer_id=user_id).order_by(Transaction.timestamp.desc()).all()
    
    @staticmethod
    def get_user_sales(user_id: int) -> list:
        """Ottiene vendite utente"""
        return Transaction.query.filter_by(seller_id=user_id).order_by(Transaction.timestamp.desc()).all()
    
    @staticmethod
    def get_item_transactions(item_id: int) -> list:
        """Ottiene transazioni per un item"""
        return Transaction.query.filter_by(item_id=item_id).order_by(Transaction.timestamp.desc()).all()
    
    @staticmethod
    def calculate_user_balance(user_id: int) -> Dict:
        """
        Calcola bilancio utente (vendite - acquisti)
        
        Args:
            user_id: ID utente
            
        Returns:
            dict: statistiche finanziarie
        """
        # Vendite completate
        sales = Transaction.query.filter_by(
            seller_id=user_id,
            status=PaymentsService.STATUS_COMPLETED
        ).all()
        
        # Acquisti completati
        purchases = Transaction.query.filter_by(
            buyer_id=user_id,
            status=PaymentsService.STATUS_COMPLETED
        ).all()
        
        total_sales = sum(t.amount for t in sales)
        total_purchases = sum(t.amount for t in purchases)
        
        return {
            'total_sales': total_sales,
            'total_purchases': total_purchases,
            'balance': total_sales - total_purchases,
            'sales_count': len(sales),
            'purchases_count': len(purchases)
        }
    
    @staticmethod
    def confirm_cash_payment(transaction_id: int, confirmer_id: int) -> Tuple[bool, str]:
        """
        Conferma pagamento in contanti (da parte del venditore)
        
        Args:
            transaction_id: ID transazione
            confirmer_id: ID chi conferma (deve essere seller)
            
        Returns:
            tuple: (success, message)
        """
        try:
            transaction = Transaction.query.get(transaction_id)
            if not transaction:
                return False, "Transazione non trovata"
            
            # Verifica che sia il seller
            if transaction.seller_id != confirmer_id:
                return False, "Solo il venditore può confermare"
            
            # Verifica metodo cash e stato pending
            if transaction.payment_method != PaymentsService.METHOD_CASH:
                return False, "Non è un pagamento in contanti"
            
            if transaction.status != PaymentsService.STATUS_PENDING:
                return False, f"Transazione già {transaction.status}"
            
            # Conferma
            transaction.status = PaymentsService.STATUS_COMPLETED
            transaction.completed_at = datetime.utcnow()
            transaction.payment_id = f"CASH_{transaction.id}_{uuid.uuid4().hex[:8]}"
            
            # Marca item venduto
            item = Item.query.get(transaction.item_id)
            item.is_sold = True
            
            db.session.commit()
            
            return True, "Pagamento in contanti confermato"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Errore: {str(e)}"
