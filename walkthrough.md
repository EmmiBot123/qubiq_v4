# Walkthrough - Mobile Inventor Integration

I have integrated the offline Mobile Inventor editor into the application.

## Changes

### 1. Created `MobileInventorScreen`
- **File**: `lib/Screens/MIT/mobile_inventor_screen.dart`
- **Purpose**: Serves the local `assets/www/index_MIT.html` using an internal web server on port 8081.
- **Features**:
    - Offline access to the editor.
    - Camera and Microphone permissions handled.
    - Back navigation support.

### 2. Updated `MitDashboardScreen`
- **File**: `lib/Screens/MIT/mit_dashboard_screen.dart`
- **Change**: Added a new "Launch Offline Editor" card.
- **UI**: Orange gradient card distinguished from the online editor.

### 3. Registered Route
- **File**: `lib/main.dart`
- **Route**: `/mit/mobile_inventor`

### 4. Build Fixes
- **Files**: `windows/runner/CMakeLists.txt`, `windows/CMakeLists.txt`
- **Change**: Updated `cmake_minimum_required` to `3.20` to support newer plugins.
- **Action**: Ran `flutter pub upgrade` to update dependencies.

## Verification Steps

1.  **Open App**: Launch the QubiQ application.
2.  **Navigate**: Go to **Mobile App** -> **MIT Blocks**.
3.  **Check UI**: You should see two cards:
    - "Launch Web Editor" (Teal)
    - "Launch Offline Editor" (Orange)
4.  **Test Offline Editor**:
    - Click "Launch Offline Editor".
    - Verify that the "QubiQ Studio" interface loads.
    - Ensure blocks and menus work without internet.

## Troubleshooting

> [!IMPORTANT]
> If build fails with CMake errors:
> 1. Run `flutter clean`
> 2. Run `flutter pub get`
> 3. Run `flutter build windows`

## Screenshots

> [!NOTE]
> No screenshots are available as I cannot run the visual interface, but the code structure ensures the UI elements are present.
