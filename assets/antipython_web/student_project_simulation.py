import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import accuracy_score

print("--- STUDENT PROJECT SIMULATION ---")

# 1. Data Loading & Cleaning
print("\n[Step 1] Loading Data...")
data = pd.read_csv("student_scores.csv")
data.info()

print("Cleaning data...")
data = data.dropna()
data = data.fillna(0)

# 2. Analysis with NumPy
print("\n[Step 2] Analyzing Data...")
scores = np.array([85, 92, 78, 90, 88])
avg_score = np.mean(scores)
print(f"Average Score: {avg_score}")
max_score = np.sum(scores)
print(f"Total Score: {max_score}")

# 3. Visualization
print("\n[Step 3] Visualizing Results...")
plt.figure(figsize=(10, 6))

plt.subplot(1, 2, 1)
sns.histplot(scores)
plt.title("Score Distribution")

plt.subplot(1, 2, 2)
sns.scatterplot(x=[1,2,3,4,5], y=scores)
plt.title("Scores vs Time")

plt.tight_layout()
plt.show()

# 4. Machine Learning
print("\n[Step 4] Training Model...")
X = np.array([[1], [2], [3], [4], [5]])
y = scores

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = LinearRegression()
model.fit(X_train, y_train)

preds = model.predict(X_test)
print(f"Predictions: {preds}")
score = model.score(X_test, y_test)
print(f"Model Accuracy: {score}")

print("\n✅ Project Simulation Complete!")
