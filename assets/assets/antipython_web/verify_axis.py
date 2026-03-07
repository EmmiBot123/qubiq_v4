import matplotlib.pyplot as plt

print("--- Verifying plt.axis() ---")
try:
    plt.plot([1, 2, 3])
    plt.axis('off')
    print("✅ plt.axis('off') executed successfully")
    
    plt.axis(False)
    print("✅ plt.axis(False) executed successfully")
    
    print("All axis tests passed.")
except AttributeError as e:
    print(f"❌ AttributeError: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
