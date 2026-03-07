import cv2

print("--- Verifying OpenCV Constants ---")
try:
    print(f"✅ cv2.COLOR_BGR2GRAY: {cv2.COLOR_BGR2GRAY}")
    print(f"✅ cv2.COLOR_BGR2RGB: {cv2.COLOR_BGR2RGB}")
    print(f"✅ cv2.FONT_HERSHEY_SIMPLEX: {cv2.FONT_HERSHEY_SIMPLEX}")
    print("All required constants are present.")
except AttributeError as e:
    print(f"❌ AttributeError: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
