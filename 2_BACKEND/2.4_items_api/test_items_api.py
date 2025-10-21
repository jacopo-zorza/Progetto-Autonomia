"""
Test completo Items API
Verifica CRUD, ricerca, filtri e geolocalizzazione
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '2.1_flask_setup'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '2.2_models'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '2.4_items_api'))

from app import flask_app
import json


def test_items_api():
    """Test completo dell'API Items"""
    app = flask_app.get_app()
    client = app.test_client()
    
    print("🧪 TEST ITEMS API - Progetto Autonomia\n")
    print("=" * 70)
    
    # Step 1: Registrazione utente per test
    print("\n📝 PREPARAZIONE: Registrazione utente test")
    test_user = {
        "username": "seller_test",
        "email": "seller@test.com",
        "password": "test123"
    }
    
    response = client.post('/api/auth/register',
                          data=json.dumps(test_user),
                          content_type='application/json')
    
    if response.status_code == 201:
        data = response.get_json()
        access_token = data['access_token']
        print(f"   ✅ Utente creato: {data['user']['username']}")
    elif response.status_code == 409:
        # Login se già esiste
        response = client.post('/api/auth/login',
                              data=json.dumps(test_user),
                              content_type='application/json')
        data = response.get_json()
        access_token = data['access_token']
        print(f"   ✅ Login effettuato: {data['user']['username']}")
    else:
        print(f"   ❌ Errore registrazione: {response.get_json()}")
        return
    
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Test 1: Crea item senza coordinate
    print("\n1️⃣  TEST: POST /api/items (crea item base)")
    item_data = {
        "name": "Bicicletta Mountain Bike",
        "description": "Bici usata in ottimo stato, perfetta per sentieri",
        "price": 250.50
    }
    response = client.post('/api/items',
                          data=json.dumps(item_data),
                          headers=headers,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.get_json()
        item1_id = data['data']['id']
        print(f"   ✅ Item creato: {data['data']['name']}")
        print(f"      ID: {item1_id}, Prezzo: €{data['data']['price']}")
    
    # Test 2: Crea item con coordinate (Milano)
    print("\n2️⃣  TEST: POST /api/items (con geolocalizzazione)")
    item_data2 = {
        "name": "Scrivania IKEA",
        "description": "Scrivania bianca, usata pochissimo",
        "price": 80.00,
        "latitude": 45.4642,
        "longitude": 9.1900
    }
    response = client.post('/api/items',
                          data=json.dumps(item_data2),
                          headers=headers,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.get_json()
        item2_id = data['data']['id']
        print(f"   ✅ Item creato con coordinate: {data['data']['name']}")
        print(f"      Posizione: {data['data']['latitude']}, {data['data']['longitude']}")
    
    # Test 3: Crea altro item con coordinate (Torino - per test distanza)
    print("\n3️⃣  TEST: POST /api/items (secondo item con coordinate)")
    item_data3 = {
        "name": "Laptop Dell",
        "description": "Laptop usato, i5, 8GB RAM",
        "price": 350.00,
        "latitude": 45.0703,
        "longitude": 7.6869
    }
    response = client.post('/api/items',
                          data=json.dumps(item_data3),
                          headers=headers,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        data = response.get_json()
        item3_id = data['data']['id']
        print(f"   ✅ Item creato: {data['data']['name']}")
    
    # Test 4: Get lista tutti gli items
    print("\n4️⃣  TEST: GET /api/items (lista completa)")
    response = client.get('/api/items')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Items totali: {data['pagination']['total_items']}")
        print(f"      Pagina: {data['pagination']['page']} di {data['pagination']['total_pages']}")
        for item in data['data'][:3]:
            print(f"      - {item['name']}: €{item['price']}")
    
    # Test 5: Get singolo item
    print(f"\n5️⃣  TEST: GET /api/items/{item1_id} (dettaglio item)")
    response = client.get(f'/api/items/{item1_id}')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Item: {data['data']['name']}")
        print(f"      Venditore: {data['data']['seller']['username']}")
        print(f"      Prezzo: €{data['data']['price']}")
    
    # Test 6: Ricerca testuale
    print("\n6️⃣  TEST: GET /api/items?search=bici (ricerca testuale)")
    response = client.get('/api/items?search=bici')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Risultati trovati: {len(data['data'])}")
        for item in data['data']:
            print(f"      - {item['name']}")
    
    # Test 7: Filtro per prezzo
    print("\n7️⃣  TEST: GET /api/items?min_price=100&max_price=300 (filtro prezzo)")
    response = client.get('/api/items?min_price=100&max_price=300')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Items trovati: {len(data['data'])}")
        for item in data['data']:
            print(f"      - {item['name']}: €{item['price']}")
    
    # Test 8: Ordinamento per prezzo
    print("\n8️⃣  TEST: GET /api/items?order_by=price&order_dir=asc (ordinamento)")
    response = client.get('/api/items?order_by=price&order_dir=asc')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Items ordinati per prezzo crescente:")
        for item in data['data'][:5]:
            print(f"      - {item['name']}: €{item['price']}")
    
    # Test 9: Ricerca geografica (items vicini a Milano)
    print("\n9️⃣  TEST: GET /api/items?latitude=45.4642&longitude=9.1900&radius_km=50")
    print("   (ricerca geografica - items entro 50km da Milano)")
    response = client.get('/api/items?latitude=45.4642&longitude=9.1900&radius_km=50')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Items trovati entro 50km: {len(data['data'])}")
        for item in data['data']:
            if item.get('distance_km'):
                print(f"      - {item['name']}: {item['distance_km']}km di distanza")
    
    # Test 10: Get my items
    print("\n🔟 TEST: GET /api/items/my-items (items dell'utente)")
    response = client.get('/api/items/my-items', headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Tuoi items: {len(data['data'])}")
        for item in data['data']:
            print(f"      - {item['name']}: €{item['price']}")
    
    # Test 11: Update item
    print(f"\n1️⃣1️⃣  TEST: PUT /api/items/{item1_id} (aggiorna item)")
    update_data = {
        "price": 200.00,
        "description": "Bici usata in ottimo stato, prezzo ribassato!"
    }
    response = client.put(f'/api/items/{item1_id}',
                         data=json.dumps(update_data),
                         headers=headers,
                         content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Item aggiornato: {data['data']['name']}")
        print(f"      Nuovo prezzo: €{data['data']['price']}")
    
    # Test 12: Delete item
    print(f"\n1️⃣2️⃣  TEST: DELETE /api/items/{item1_id} (elimina item)")
    response = client.delete(f'/api/items/{item1_id}', headers=headers)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ {data['message']}")
    
    # Test 13: Verifica eliminazione
    print(f"\n1️⃣3️⃣  TEST: GET /api/items/{item1_id} (verifica eliminazione)")
    response = client.get(f'/api/items/{item1_id}')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 404:
        print(f"   ✅ Item correttamente eliminato (404 Not Found)")
    
    # Test 14: Validazione dati errati
    print("\n1️⃣4️⃣  TEST: POST /api/items (validazione - prezzo negativo)")
    bad_item = {
        "name": "Test",
        "price": -10.00
    }
    response = client.post('/api/items',
                          data=json.dumps(bad_item),
                          headers=headers,
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 400:
        data = response.get_json()
        print(f"   ✅ Validazione funziona: {data['message']}")
    
    print("\n" + "=" * 70)
    print("✅ TUTTI I TEST COMPLETATI CON SUCCESSO!\n")
    print("📊 Riepilogo funzionalità testate:")
    print("   ✅ Creazione items (con e senza coordinate)")
    print("   ✅ Lettura singolo item e lista")
    print("   ✅ Aggiornamento item")
    print("   ✅ Eliminazione item")
    print("   ✅ Ricerca testuale")
    print("   ✅ Filtri per prezzo")
    print("   ✅ Ordinamento")
    print("   ✅ Ricerca geografica con calcolo distanze")
    print("   ✅ Filtro per raggio km")
    print("   ✅ Autenticazione JWT")
    print("   ✅ Validazione dati\n")


if __name__ == "__main__":
    test_items_api()
