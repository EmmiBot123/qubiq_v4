# Emmi Lite Asset Synchronization Plan

The user has added a new folder `assets/assets/emmi-bot-lite/` and wants the "Emmi Lite" screen to use it.

## Proposed Changes

### [Project Configuration]

#### [MODIFY] [pubspec.yaml](file:///c:/qubiq/qubiq_V3-gh-pages/pubspec.yaml)
Register the new `emmi-bot-lite` assets so Flutter bundles them.
- Add the following paths:
    - `assets/assets/emmi-bot-lite/`
    - `assets/assets/emmi-bot-lite/blocks/`
    - `assets/assets/emmi-bot-lite/css/`
    - `assets/assets/emmi-bot-lite/headers/`
    - `assets/assets/emmi-bot-lite/js/`
    - `assets/assets/emmi-bot-lite/js/commands/`
    - `assets/assets/emmi-bot-lite/js/generators/`
    - `assets/assets/emmi-bot-lite/js/tests/`
    - `assets/assets/emmi-bot-lite/lib/`
    - `assets/assets/emmi-bot-lite/lib/blockly/`
    - `assets/assets/emmi-bot-lite/lib/blockly/media/`
    - `assets/assets/emmi-bot-lite/lib/font-awesome/`
    - `assets/assets/emmi-bot-lite/lib/font-awesome/css/`
    - `assets/assets/emmi-bot-lite/lib/font-awesome/webfonts/`
    - `assets/assets/emmi-bot-lite/lib/prism/`
    - `assets/assets/emmi-bot-lite/lib/prism/components/`
    - `assets/assets/emmi-bot-lite/lib/prism/themes/`
    - `assets/assets/emmi-bot-lite/media/`

### [Flutter Screens]

#### [MODIFY] [emmi_lite_screen.dart](file:///c:/qubiq/qubiq_V3-gh-pages/lib/Screens/emmi_lite_screen.dart)
Update the iframe registration to use the triple-nested path for web.
- From: `registerIframe('emmi-lite-web-view', "EMMI_HTML/index.html");`
- To: `registerIframe('emmi-lite-web-view', "assets/assets/assets/emmi-bot-lite/index.html");`

Update the documentation extraction logic (used for Native/Desktop) to use the new folder.
- From: `.where((key) => key.startsWith('assets/emmi_html/'))`
- To: `.where((key) => key.startsWith('assets/assets/emmi-bot-lite/'))`

#### [MODIFY] [emmi_lite_webview_web.dart](file:///c:/qubiq/qubiq_V3-gh-pages/lib/Screens/emmi_lite_webview_web.dart)
Update the web source to point to the triple-nested asset location.
- From: `iframe.src = '${cleanBaseUrl}EMMI_HTML/index.html';`
- To: `iframe.src = '${cleanBaseUrl}assets/assets/assets/emmi-bot-lite/index.html';`

## Verification Plan

### Automated Tests
- Run `flutter clean` and `flutter run -d chrome`.
- Navage to "Emmi Lite" through the dashboard.
- Verify the "Loading EMMI BOT V2..." splash screen appears and the UI loads correctly.
- Check the browser console to ensure all JS/CSS files are loading from the `emmi_lite` path.
