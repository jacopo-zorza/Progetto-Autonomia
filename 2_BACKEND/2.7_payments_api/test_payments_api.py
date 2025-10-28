"""
Test per Payments API
"""

import sys
import os
import unittest
import json
import bcrypt

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.1_flask_setup'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '2.2_models'))

from app import FlaskApp
from models import db, User, Item, Transaction

class TestPaymentsAPI(unittest.TestCase):
    """Test per API pagamenti"""
    
    @classmethod
    def setUpClass(cls):
        """Setup eseguito una volta prima di tutti i test"""
        # Crea app con database di test
        cls.flask_app = FlaskApp(db_type="sqlite", db_path=":memory:")
        cls.app = cls.flask_app.get_app()
        cls.client = cls.app.test_client()
        
        # Crea contesto applicazione
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        
        # Crea tabelle
        db.create_all()
        
        print("\n🧪 Setup TestPaymentsAPI completato")
    
    @classmethod
    def tearDownClass(cls):
        """Cleanup dopo tutti i test"""
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()
        print("✅ Cleanup TestPaymentsAPI completato\n")
    
    def setUp(self):
        """Setup prima di ogni test"""
        # Pulisci database
        Transaction.query.delete()
        Item.query.delete()
        User.query.delete()
        db.session.commit()
        
        # Crea utenti test
        password_hash = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        self.seller = User(username='seller', email='seller@test.com', password_hash=password_hash)
        self.buyer = User(username='buyer', email='buyer@test.com', password_hash=password_hash)
        
        db.session.add(self.seller)
        db.session.add(self.buyer)
        db.session.commit()
        
        # Login utenti per ottenere token
        seller_login = self.client.post('/api/auth/login', 
            json={'username': 'seller', 'password': 'password123'})
        self.seller_token = seller_login.get_json()['access_token']
        
        buyer_login = self.client.post('/api/auth/login',
            json={'username': 'buyer', 'password': 'password123'})
        self.buyer_token = buyer_login.get_json()['access_token']
        
        # Crea item test
        self.item = Item(
            name='Test Item',
            description='Item for payment test',
            price=10.0,
            seller_id=self.seller.id
        )
        db.session.add(self.item)
        db.session.commit()
    
    def test_01_create_transaction(self):
        """Test creazione transazione"""
        response = self.client.post('/api/payments/transaction',
            headers={'Authorization': f'Bearer {self.buyer_token}'},
            json={
                'item_id': self.item.id,
                'payment_method': 'cash',
                'notes': 'Test transaction'
            })
        
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('transaction', data)
        self.assertEqual(data['transaction']['item_id'], self.item.id)
        self.assertEqual(data['transaction']['buyer_id'], self.buyer.id)
        self.assertEqual(data['transaction']['seller_id'], self.seller.id)
        self.assertEqual(data['transaction']['status'], 'pending')
        print("✅ Test creazione transazione OK")
    
    def test_02_create_transaction_own_item(self):
        """Test errore: non puoi comprare il tuo item"""
        response = self.client.post('/api/payments/transaction',
            headers={'Authorization': f'Bearer {self.seller_token}'},
            json={
                'item_id': self.item.id,
                'payment_method': 'cash'
            })
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        print("✅ Test errore acquisto proprio item OK")
    
    def test_03_create_transaction_sold_item(self):
        """Test errore: item già venduto"""
        self.item.is_sold = True
        db.session.commit()
        
        response = self.client.post('/api/payments/transaction',
            headers={'Authorization': f'Bearer {self.buyer_token}'},
            json={
                'item_id': self.item.id,
                'payment_method': 'cash'
            })
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data['success'])
        print("✅ Test errore item venduto OK")
    
    def test_04_process_payment_stripe(self):
        """Test processo pagamento con Stripe (mock)"""
        # Crea transazione
        transaction = Transaction(
            item_id=self.item.id,
            buyer_id=self.buyer.id,
            seller_id=self.seller.id,
            amount=self.item.price,
            status='pending',
            payment_method='stripe'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Processa pagamento
        response = self.client.post(f'/api/payments/process/{transaction.id}',
            headers={'Authorization': f'Bearer {self.buyer_token}'},
            json={'payment_method': 'stripe'})
        
        # Mock provider ha 90% successo, quindi può fallire
        data = response.get_json()
        if data['success']:
            self.assertEqual(response.status_code, 200)
            self.assertIn('payment_id', data['data'])
            print(f"✅ Test pagamento Stripe OK (completato)")
        else:
            self.assertEqual(response.status_code, 400)
            print(f"✅ Test pagamento Stripe OK (fallito - comportamento mock)")
    
    def test_05_process_payment_unauthorized(self):
        """Test errore: solo buyer può processare pagamento"""
        # Crea transazione
        transaction = Transaction(
            item_id=self.item.id,
            buyer_id=self.buyer.id,
            seller_id=self.seller.id,
            amount=self.item.price,
            status='pending',
            payment_method='stripe'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Prova con token seller
        response = self.client.post(f'/api/payments/process/{transaction.id}',
            headers={'Authorization': f'Bearer {self.seller_token}'},
            json={'payment_method': 'stripe'})
        
        self.assertEqual(response.status_code, 403)
        print("✅ Test autorizzazione pagamento OK")
    
    def test_06_confirm_cash_payment(self):
        """Test conferma pagamento contanti da seller"""
        # Crea transazione
        transaction = Transaction(
            item_id=self.item.id,
            buyer_id=self.buyer.id,
            seller_id=self.seller.id,
            amount=self.item.price,
            status='pending',
            payment_method='cash'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Conferma da seller
        response = self.client.post(f'/api/payments/confirm-cash/{transaction.id}',
            headers={'Authorization': f'Bearer {self.seller_token}'})
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        
        # Verifica item marcato come venduto
        item = Item.query.get(self.item.id)
        self.assertTrue(item.is_sold)
        print("✅ Test conferma contanti OK")
    
    def test_07_confirm_cash_unauthorized(self):
        """Test errore: solo seller può confermare contanti"""
        # Crea transazione
        transaction = Transaction(
            item_id=self.item.id,
            buyer_id=self.buyer.id,
            seller_id=self.seller.id,
            amount=self.item.price,
            status='pending',
            payment_method='cash'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Prova conferma da buyer
        response = self.client.post(f'/api/payments/confirm-cash/{transaction.id}',
            headers={'Authorization': f'Bearer {self.buyer_token}'})
        
        self.assertEqual(response.status_code, 400)
        print("✅ Test autorizzazione conferma contanti OK")
    
    def test_08_cancel_transaction(self):
        """Test cancellazione transazione"""
        # Crea transazione
        transaction = Transaction(
            item_id=self.item.id,
            buyer_id=self.buyer.id,
            seller_id=self.seller.id,
            amount=self.item.price,
            status='pending',
            payment_method='cash'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Cancella da buyer
        response = self.client.post(f'/api/payments/cancel/{transaction.id}',
            headers={'Authorization': f'Bearer {self.buyer_token}'})
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        
        # Verifica stato
        t = Transaction.query.get(transaction.id)
        self.assertEqual(t.status, 'cancelled')
        print("✅ Test cancellazione transazione OK")
    
    def test_09_get_transaction(self):
        """Test ottenimento dettagli transazione"""
        # Crea transazione
        transaction = Transaction(
            item_id=self.item.id,
            buyer_id=self.buyer.id,
            seller_id=self.seller.id,
            amount=self.item.price,
            status='pending',
            payment_method='cash'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Ottieni dettagli
        response = self.client.get(f'/api/payments/transaction/{transaction.id}',
            headers={'Authorization': f'Bearer {self.buyer_token}'})
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['transaction']['id'], transaction.id)
        print("✅ Test dettagli transazione OK")
    
    def test_10_get_transaction_unauthorized(self):
        """Test errore: solo buyer/seller possono vedere transazione"""
        # Crea altro utente
        password_hash = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        other_user = User(username='other', email='other@test.com', password_hash=password_hash)
        db.session.add(other_user)
        db.session.commit()
        
        other_login = self.client.post('/api/auth/login',
            json={'username': 'other', 'password': 'password123'})
        other_token = other_login.get_json()['access_token']
        
        # Crea transazione
        transaction = Transaction(
            item_id=self.item.id,
            buyer_id=self.buyer.id,
            seller_id=self.seller.id,
            amount=self.item.price,
            status='pending',
            payment_method='cash'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Prova accesso con altro utente
        response = self.client.get(f'/api/payments/transaction/{transaction.id}',
            headers={'Authorization': f'Bearer {other_token}'})
        
        self.assertEqual(response.status_code, 403)
        print("✅ Test autorizzazione dettagli transazione OK")
    
    def test_11_get_my_purchases(self):
        """Test lista acquisti utente"""
        # Crea transazioni
        for i in range(3):
            transaction = Transaction(
                item_id=self.item.id,
                buyer_id=self.buyer.id,
                seller_id=self.seller.id,
                amount=10.0,
                status='completed' if i < 2 else 'pending',
                payment_method='cash'
            )
            db.session.add(transaction)
        db.session.commit()
        
        response = self.client.get('/api/payments/my-purchases',
            headers={'Authorization': f'Bearer {self.buyer_token}'})
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 3)
        print("✅ Test lista acquisti OK")
    
    def test_12_get_my_sales(self):
        """Test lista vendite utente"""
        # Crea transazioni
        for i in range(2):
            transaction = Transaction(
                item_id=self.item.id,
                buyer_id=self.buyer.id,
                seller_id=self.seller.id,
                amount=10.0,
                status='completed',
                payment_method='cash'
            )
            db.session.add(transaction)
        db.session.commit()
        
        response = self.client.get('/api/payments/my-sales',
            headers={'Authorization': f'Bearer {self.seller_token}'})
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 2)
        print("✅ Test lista vendite OK")
    
    def test_13_get_balance(self):
        """Test calcolo bilancio utente"""
        # Crea transazioni completate
        for i in range(2):
            transaction = Transaction(
                item_id=self.item.id,
                buyer_id=self.buyer.id,
                seller_id=self.seller.id,
                amount=15.0,
                status='completed',
                payment_method='cash'
            )
            db.session.add(transaction)
        db.session.commit()
        
        # Bilancio seller (guadagno)
        response = self.client.get('/api/payments/balance',
            headers={'Authorization': f'Bearer {self.seller_token}'})
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['total_sales'], 30.0)
        self.assertEqual(data['sales_count'], 2)
        print("✅ Test bilancio utente OK")

if __name__ == '__main__':
    # Esegui i test
    unittest.main(verbosity=2)
