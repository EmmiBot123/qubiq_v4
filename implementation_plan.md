# Implementation Plan - Add MobileInventor

I will integrate the local `index_MIT.html` as an offline "MobileInventor" editor, accessible from the MIT Dashboard.

## Proposed Changes

### New Screen
#### [NEW] [mobile_inventor_screen.dart](file:///c:/Users/abrah/OneDrive/Desktop/qubiq/lib/Screens/MIT/mobile_inventor_screen.dart)
- Create a new widget `MobileInventorScreen` based on `PyBlocksWebview`.
- Setup `InAppLocalhostServer` on port 8081.
- Serve assets from `assets/www`.
- Load `index_MIT.html`.
- Handle WebView permissions (camera, etc.).

### Dashboard Update
#### [MODIFY] [mit_dashboard_screen.dart](file:///c:/Users/abrah/OneDrive/Desktop/qubiq/lib/Screens/MIT/mit_dashboard_screen.dart)
- Add navigation to the new `MobileInventorScreen`.
- Add a new "Launch Offline Editor" button.

### Helper
#### [MODIFY] [main.dart](file:///c:/Users/abrah/OneDrive/Desktop/qubiq/lib/main.dart)
- Register new route `/mit/mobile_inventor` (optional, can also use `MaterialPageRoute` directly).

## Verification Plan

### Manual Verification
1.  **Launch App**: Run the app on Windows/Android.
2.  **Navigate**: Go to "Mobile App" -> "MIT Blocks" (Dashboard).
3.  **Click**: Click the new "Launch Offline Editor" button.
4.  **Verify**:
    - The `index_MIT.html` page loads.
    - No 404 errors for assets (`index-xPsAilHw.js`, etc.).
    - The interface appears correctly ("QubiQ Studio").
