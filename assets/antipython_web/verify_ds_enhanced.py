import pandas as pd
import numpy as np

print("--- Data Science Mock Verification ---")

# 1. Pandas Enhancements
print("\n[Pandas]")
try:
    df = pd.DataFrame()
    print("✅ DataFrame initialized")
    
    # Info
    df.info()
    print("✅ df.info() called")
    
    # iloc/loc
    print(f"✅ df.iloc[0]: {df.iloc[0]}")
    print(f"✅ df.loc['row1']: {df.loc['row1']}")
    
except Exception as e:
    print(f"❌ Pandas Error: {e}")

# 2. NumPy Enhancements
print("\n[NumPy]")
try:
    # Zeros/Ones
    z = np.zeros(5)
    print(f"✅ np.zeros(5): {z.shape}")
    o = np.ones((2,2))
    print(f"✅ np.ones((2,2)): {o.shape}")
    
    # Statistics
    data = np.array([1, 2, 3, 4, 5])
    print(f"✅ np.mean(): {np.mean(data)}")
    print(f"✅ np.sum(): {np.sum(data)}")
    
    # len
    print(f"✅ len(arr): {len(data)}")

except Exception as e:
    print(f"❌ NumPy Error: {e}")

# 3. Scikit-learn Score
print("\n[Sklearn]")
try:
    from sklearn.linear_model import LinearRegression
    model = LinearRegression()
    print(f"✅ model.score(): {model.score([], [])}")
except Exception as e:
    print(f"❌ Sklearn Error: {e}")
