import tkinter
from tkinter import filedialog

print(f"Tkinter imported: {tkinter}")
root = tkinter.Tk()
root.withdraw()
print("Tk main window (mock) initialized")

if hasattr(filedialog, 'askopenfilename'):
    print("✅ filedialog.askopenfilename exists")
else:
    print("❌ filedialog.askopenfilename MISSING")
