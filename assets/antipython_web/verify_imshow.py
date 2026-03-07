import matplotlib.pyplot as plt
import cv2

print("--- Testing plt.imshow ---")

# 1. Test with mock image from cv2
try:
    print("Reading mock image...")
    img = cv2.imread("test.jpg")
    print(f"Image data type: {type(img)}")
    
    print("Displaying with plt.imshow()...")
    plt.figure()
    plt.imshow(img)
    plt.title("Mock Image Test")
    plt.show()
    print("✅ plt.imshow() executed successfully")

except AttributeError as e:
    print(f"❌ AttributeError: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
