import time

print("--- Speech Support Verification ---")

# 1. Text-to-Speech (TTS)
try:
    import pyttsx3
    print("\n[TTS] Initializing engine...")
    engine = pyttsx3.init()
    
    text = "Hello! I can now speak from Python."
    print(f"[TTS] Saying: '{text}'")
    engine.say(text)
    engine.runAndWait()
    print("✅ TTS command sent.")
except ImportError:
    print("❌ pyttsx3 not found (Mock missing?)")
except Exception as e:
    print(f"❌ TTS Error: {e}")

# 2. Speech-to-Text (STT)
try:
    import speech_recognition as sr
    print("\n[STT] Initializing recognizer...")
    r = sr.Recognizer()
    
    print("[STT] Please speak something now (Browser should listen)...")
    with sr.Microphone() as source:
        print("[STT] Listening...")
        audio = r.listen(source)
    
    print("[STT] Processing...")
    try:
        text = r.recognize_google(audio)
        print(f"✅ You said: '{text}'")
    except Exception as e:
        print(f"❌ Recognition Error: {e}")
        
except ImportError:
    print("❌ speech_recognition not found (Mock missing?)")
except Exception as e:
    print(f"❌ STT Error: {e}")
