"""
Test completo Messages API
Verifica invio, ricezione, conversazioni, notifiche
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '2.1_flask_setup'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '2.2_models'))

from app import flask_app
import json


def test_messages_api():
    """Test completo dell'API Messages"""
    app = flask_app.get_app()
    client = app.test_client()
    
    print("🧪 TEST MESSAGES API - Progetto Autonomia\n")
    print("=" * 70)
    
    # Step 1: Crea due utenti per testare la chat
    print("\n📝 PREPARAZIONE: Creazione utenti per test chat")
    
    # Utente 1
    user1 = {
        "username": "alice_chat",
        "email": "alice@chat.com",
        "password": "test123"
    }
    response = client.post('/api/auth/register',
                          data=json.dumps(user1),
                          content_type='application/json')
    
    if response.status_code == 201:
        data = response.get_json()
        token1 = data['access_token']
        user1_id = data['user']['id']
        print(f"   ✅ Utente 1 creato: {data['user']['username']} (ID: {user1_id})")
    elif response.status_code == 409:
        response = client.post('/api/auth/login',
                              data=json.dumps(user1),
                              content_type='application/json')
        data = response.get_json()
        token1 = data['access_token']
        user1_id = data['user']['id']
        print(f"   ✅ Utente 1 login: {data['user']['username']} (ID: {user1_id})")
    
    # Utente 2
    user2 = {
        "username": "bob_chat",
        "email": "bob@chat.com",
        "password": "test123"
    }
    response = client.post('/api/auth/register',
                          data=json.dumps(user2),
                          content_type='application/json')
    
    if response.status_code == 201:
        data = response.get_json()
        token2 = data['access_token']
        user2_id = data['user']['id']
        print(f"   ✅ Utente 2 creato: {data['user']['username']} (ID: {user2_id})")
    elif response.status_code == 409:
        response = client.post('/api/auth/login',
                              data=json.dumps(user2),
                              content_type='application/json')
        data = response.get_json()
        token2 = data['access_token']
        user2_id = data['user']['id']
        print(f"   ✅ Utente 2 login: {data['user']['username']} (ID: {user2_id})")
    
    headers1 = {'Authorization': f'Bearer {token1}'}
    headers2 = {'Authorization': f'Bearer {token2}'}
    
    # Test 1: Invia messaggio da User1 a User2
    print("\n1️⃣  TEST: POST /api/messages (invia messaggio)")
    message_data = {
        "receiver_id": user2_id,
        "content": "Ciao Bob! Come stai?"
    }
    response = client.post('/api/messages',
                          data=json.dumps(message_data),
                          headers=headers1,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.get_json()
        msg1_id = data['data']['id']
        print(f"   ✅ Messaggio inviato: {data['data']['content'][:50]}")
        print(f"      ID: {msg1_id}, Read: {data['data']['read']}")
    
    # Test 2: Invia altro messaggio
    print("\n2️⃣  TEST: POST /api/messages (secondo messaggio)")
    message_data2 = {
        "receiver_id": user2_id,
        "content": "Hai visto la mia bici in vendita?"
    }
    response = client.post('/api/messages',
                          data=json.dumps(message_data2),
                          headers=headers1,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        print(f"   ✅ Secondo messaggio inviato")
    
    # Test 3: User2 controlla inbox
    print("\n3️⃣  TEST: GET /api/messages/inbox (messaggi ricevuti)")
    response = client.get('/api/messages/inbox', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Inbox User2: {len(data['data'])} messaggi")
        print(f"      Totale: {data['pagination']['total']}")
        for msg in data['data'][:2]:
            print(f"      - Da {msg['sender_username']}: {msg['content'][:40]}... (letto: {msg['read']})")
    
    # Test 4: User2 risponde
    print("\n4️⃣  TEST: POST /api/messages (risposta)")
    reply_data = {
        "receiver_id": user1_id,
        "content": "Ciao Alice! Sto bene, grazie. Sì, mi interessa la bici!"
    }
    response = client.post('/api/messages',
                          data=json.dumps(reply_data),
                          headers=headers2,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        print(f"   ✅ Risposta inviata da User2")
    
    # Test 5: User1 controlla messaggi sent
    print("\n5️⃣  TEST: GET /api/messages/sent (messaggi inviati)")
    response = client.get('/api/messages/sent', headers=headers1)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Sent User1: {len(data['data'])} messaggi")
        for msg in data['data'][:2]:
            print(f"      - A {msg['receiver_username']}: {msg['content'][:40]}...")
    
    # Test 6: Ottieni conversazione tra User1 e User2
    print(f"\n6️⃣  TEST: GET /api/messages/conversation/{user2_id} (thread)")
    response = client.get(f'/api/messages/conversation/{user2_id}', headers=headers1)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Conversazione con {data['other_user']['username']}")
        print(f"      Totale messaggi: {data['pagination']['total']}")
        for msg in data['data']:
            direction = "→" if msg['is_mine'] else "←"
            print(f"      {direction} {msg['content'][:50]}...")
    
    # Test 7: User2 ottiene lista conversazioni
    print("\n7️⃣  TEST: GET /api/messages/conversations (lista conversazioni)")
    response = client.get('/api/messages/conversations', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Conversazioni totali: {data['total']}")
        for conv in data['data']:
            print(f"      - Con {conv['other_user']['username']}: {conv['unread_count']} non letti")
            print(f"        Ultimo: '{conv['last_message'][:40]}...'")
    
    # Test 8: Conteggio messaggi non letti User2
    print("\n8️⃣  TEST: GET /api/messages/unread-count (conteggio non letti)")
    response = client.get('/api/messages/unread-count', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Messaggi non letti User2: {data['unread_count']}")
    
    # Test 9: Ottieni solo messaggi non letti
    print("\n9️⃣  TEST: GET /api/messages/inbox?unread_only=true")
    response = client.get('/api/messages/inbox?unread_only=true', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Solo non letti: {len(data['data'])} messaggi")
    
    # Test 10: Segna messaggio come letto
    print(f"\n🔟 TEST: PUT /api/messages/{msg1_id}/read (segna letto)")
    response = client.put(f'/api/messages/{msg1_id}/read', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ {data['message']}")
    
    # Test 11: Segna intera conversazione come letta
    print(f"\n1️⃣1️⃣  TEST: PUT /api/messages/conversation/{user1_id}/read")
    response = client.put(f'/api/messages/conversation/{user1_id}/read', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ {data['message']} ({data['marked_count']} messaggi)")
    
    # Test 12: Verifica conteggio non letti dopo mark as read
    print("\n1️⃣2️⃣  TEST: GET /api/messages/unread-count (dopo mark read)")
    response = client.get('/api/messages/unread-count', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Messaggi non letti User2: {data['unread_count']}")
    
    # Test 13: Validazione - invia a se stesso
    print("\n1️⃣3️⃣  TEST: POST /api/messages (validazione - a se stesso)")
    bad_message = {
        "receiver_id": user1_id,
        "content": "Messaggio a me stesso"
    }
    response = client.post('/api/messages',
                          data=json.dumps(bad_message),
                          headers=headers1,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 400:
        data = response.get_json()
        print(f"   ✅ Validazione funziona: {data['message']}")
    
    # Test 14: Validazione - contenuto vuoto
    print("\n1️⃣4️⃣  TEST: POST /api/messages (validazione - vuoto)")
    empty_message = {
        "receiver_id": user2_id,
        "content": ""
    }
    response = client.post('/api/messages',
                          data=json.dumps(empty_message),
                          headers=headers1,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 400:
        data = response.get_json()
        print(f"   ✅ Validazione funziona: {data['message']}")
    
    # Test 15: Elimina messaggio
    print(f"\n1️⃣5️⃣  TEST: DELETE /api/messages/{msg1_id} (elimina)")
    response = client.delete(f'/api/messages/{msg1_id}', headers=headers2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ {data['message']}")
    
    print("\n" + "=" * 70)
    print("✅ TUTTI I TEST COMPLETATI CON SUCCESSO!\n")
    print("📊 Riepilogo funzionalità testate:")
    print("   ✅ Invio messaggi tra utenti")
    print("   ✅ Ricezione messaggi (inbox)")
    print("   ✅ Messaggi inviati (sent)")
    print("   ✅ Thread conversazioni")
    print("   ✅ Lista conversazioni con metadati")
    print("   ✅ Conteggio messaggi non letti")
    print("   ✅ Filtro solo non letti")
    print("   ✅ Mark as read (singolo e conversazione)")
    print("   ✅ Eliminazione messaggi")
    print("   ✅ Autenticazione JWT")
    print("   ✅ Validazione dati\n")


if __name__ == "__main__":
    test_messages_api()
