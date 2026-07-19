import requests
import time
import sys

BASE_URL = "http://localhost:8000/api/v1"

def wait_for_api():
    print("Waiting for API to be ready...")
    for _ in range(30):
        try:
            r = requests.get("http://localhost:8000/")
            if r.status_code == 200:
                print("API is ready.")
                return
        except:
            pass
        time.sleep(1)
    print("API not ready after 30s")
    sys.exit(1)

def test_registration_validation_error():
    print("Testing 422 Validation Error...")
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "invalid@test.com",
        "password": "short", # Fails length, special char, uppercase
        "full_name": "Test User",
        "role": "patient"
    })
    print(f"Status: {r.status_code}")
    print(f"Response: {r.json()}")
    if r.status_code != 422:
        print("FAIL: Expected 422")
        sys.exit(1)
    if "error" not in r.json():
        print("FAIL: Missing 'error' object in response")
        sys.exit(1)
    print("PASS: 422 Validation Error formatted correctly")

def test_successful_registration_and_login():
    print("Testing successful registration...")
    email = f"test_{int(time.time())}@hospital.org"
    password = "Valid123456!"
    
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Test Doctor",
        "role": "doctor"
    })
    print(f"Status: {r.status_code}")
    print(f"Response: {r.json()}")
    
    if r.status_code != 201:
        print("FAIL: Expected 201 Created")
        sys.exit(1)
    print("PASS: Registration successful")
    
    print("Testing login...")
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    print(f"Status: {r.status_code}")
    
    if r.status_code != 200:
        print("FAIL: Expected 200 OK")
        sys.exit(1)
        
    data = r.json()
    if "access_token" not in data or "refresh_token" not in data:
        print("FAIL: Missing tokens in response")
        sys.exit(1)
        
    print("PASS: Login successful")
    print("ALL TESTS PASSED")

if __name__ == "__main__":
    wait_for_api()
    test_registration_validation_error()
    test_successful_registration_and_login()
