import cv2
import time

print("--- Webcam Verification ---")

try:
    # 1. Open Camera
    print("MOCK: python code asking to open camera...")
    cap = cv2.VideoCapture(0)
    
    if cap.isOpened():
        print("✅ Webcam accessed successfully")
        
        # 2. Capture Frame
        print("Capturing frame...")
        # In a real app, we might wait or loop. Here we just grab one.
        ret, frame = cap.read()
        
        if ret:
            print(f"✅ Frame captured (len={len(frame)})")
            
            # 3. Display Frame
            print("Displaying frame...")
            cv2.imshow("Webcam Feed", frame)
            
            # 4. Release
            cap.release()
            print("✅ Camera released")
        else:
            print("❌ Failed to capture frame")
            
    else:
        print("❌ Failed to open webcam")

except Exception as e:
    print(f"❌ Webcam Error: {e}")
