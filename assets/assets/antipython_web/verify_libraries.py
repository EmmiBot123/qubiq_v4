print("--- Starting Curriculum Library Verification ---")

try:
    # 1. Standard / CS Libs
    import math
    print(f"✅ Math: sqrt(16) = {math.sqrt(16)}")
    
    import random
    print(f"✅ Random: randint(1,10) = {random.randint(1,10)}")
    
    import statistics
    print(f"✅ Statistics: mean([1,2,3]) = {statistics.mean([1,2,3])}")
    
    import csv
    print("✅ CSV: Imported successfully")
    
    import pickle
    print("✅ Pickle: Imported successfully")
    
    import mysql.connector as sql
    print("✅ MySQL Connector: Imported successfully")

    # 2. Data Science Libs
    import numpy as np
    print(f"✅ NumPy: Array shape {np.array([1,2]).shape}")
    
    import pandas as pd
    print("✅ Pandas: Imported successfully")
    
    import matplotlib.pyplot as plt
    print("✅ Matplotlib: Imported successfully")
    
    import seaborn as sns
    print("✅ Seaborn: Imported (Mock)")
    
    import sklearn
    from sklearn.model_selection import train_test_split
    print("✅ Scikit-learn: Imported successfully")

    # 3. AI / Specialized Libs
    import nltk
    print("✅ NLTK: Imported successfully")
    
    import cv2
    print("✅ OpenCV: Imported successfully")
    
    import tensorflow as tf
    from tensorflow import keras
    print("✅ TensorFlow/Keras: Imported successfully")

except Exception as e:
    print(f"❌ ERROR: {e}")

print("--- Verification Complete ---")
