import datetime
import time
import json
import random

print("--- Standard Library Verification ---")

# 1. Datetime
try:
    now = datetime.datetime.now()
    print(f"✅ datetime.now(): {now}")
    print(f"✅ datetime.date: {datetime.date(2023, 1, 1)}")
except Exception as e:
    print(f"❌ datetime Error: {e}")

# 2. Time
try:
    start = time.time()
    time.sleep(0.1)
    end = time.time()
    print(f"✅ time.sleep(0.1) took {end - start:.4f}s")
except Exception as e:
    print(f"❌ time Error: {e}")

# 3. JSON
try:
    data = {"key": "value", "list": [1, 2, 3]}
    json_str = json.dumps(data)
    print(f"✅ json.dumps(): {json_str}")
    loaded = json.loads(json_str)
    print(f"✅ json.loads(): {loaded['key']}")
except Exception as e:
    print(f"❌ json Error: {e}")

# 4. Random (Standard)
try:
    print(f"✅ random.random(): {random.random()}")
    print(f"✅ random.choice([1,2,3]): {random.choice([1,2,3])}")
except Exception as e:
    print(f"❌ random Error: {e}")
