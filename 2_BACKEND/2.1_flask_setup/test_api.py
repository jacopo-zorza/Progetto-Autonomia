"""
Test completo delle API
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '1_PROGETTAZIONE_BASE'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '2.2_models'))

from app import flask_app
import json

def test_endpoints():
    """Test di tutti gli endpoint"""
    app = flask_app.get_app()
    client = app.test_client()
    
    print("🧪 TEST API - Progetto Autonomia\n")
    print("=" * 60)
    
    # Test 1: Homepage
    print("\n1️⃣  TEST: GET /")
    response = client.get('/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ {data['message']}")
    
    # Test 2: Health check
    print("\n2️⃣  TEST: GET /health")
    response = client.get('/health')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Status: {data['status']}, DB: {data['database']}")
    
    # Test 3: API Status
    print("\n3️⃣  TEST: GET /api/status")
    response = client.get('/api/status')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Versione: {data['api_version']}, Fase: {data['current_phase']}")
    
    # Test 4: Models test
    print("\n4️⃣  TEST: GET /api/models/test")
    response = client.get('/api/models/test')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        print(f"   ✅ Modelli funzionanti:")
        for model, count in data['models'].items():
            print(f"      - {model}: {count} record")
    
    # Test 5: Registrazione utente
    print("\n5️⃣  TEST: POST /api/auth/register")
    test_user = {
        "username": "test_user_api",
        "email": "test@api.com",
        "password": "password123"
    }
    response = client.post('/api/auth/register', 
                          data=json.dumps(test_user),
                          content_type='application/json')
    print(f"   Status: {response.status_code}")
    
    access_token = None
    if response.status_code == 201:
        data = response.get_json()
        print(f"   ✅ Utente registrato: {data['user']['username']}")
        access_token = data['access_token']
        print(f"   ✅ Access token ricevuto (primi 20 char): {access_token[:20]}...")
    elif response.status_code == 409:
        print(f"   ⚠️  Utente già esistente, procedo con login...")
        
        # Login se già esiste
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"]
        }
        response = client.post('/api/auth/login',
                              data=json.dumps(login_data),
                              content_type='application/json')
        if response.status_code == 200:
            data = response.get_json()
            access_token = data['access_token']
            print(f"   ✅ Login effettuato, token ricevuto")
    
    # Test 6: Get current user (protetto)
    if access_token:
        print("\n6️⃣  TEST: GET /api/auth/me (protetto)")
        headers = {'Authorization': f'Bearer {access_token}'}
        response = client.get('/api/auth/me', headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.get_json()
            print(f"   ✅ Utente autenticato: {data['user']['username']}")
            print(f"      Email: {data['user']['email']}")
    
    print("\n" + "=" * 60)
    print("✅ TEST COMPLETATI CON SUCCESSO!\n")

if __name__ == "__main__":
    test_endpoints()
