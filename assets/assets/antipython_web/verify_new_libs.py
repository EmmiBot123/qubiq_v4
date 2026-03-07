import requests
import sqlite3
import json

print("--- New Libraries Verification ---")

# 1. Requests
print("\n[Requests]")
try:
    # Test GET
    url = "https://api.example.com/users"
    print(f"Testing GET {url}...")
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"JSON Data: {response.json()}")
    
    # Test POST
    url = "https://api.example.com/posts"
    print(f"Testing POST {url}...")
    response = requests.post(url, data={"title": "foo"})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
except Exception as e:
    print(f"❌ Requests Error: {e}")

# 2. SQLite3
print("\n[SQLite3]")
try:
    conn = sqlite3.connect("test.db")
    print("✅ Connected to database")
    
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    
    rows = cursor.fetchall()
    print(f"✅ Fetched {len(rows)} rows: {rows}")
    
    conn.close()
    print("✅ Connection closed")

except Exception as e:
    print(f"❌ SQLite3 Error: {e}")
