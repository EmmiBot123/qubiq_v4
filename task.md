# Task: Update Emmi Lite & Fix Emmi Core Sidebar

## Emmi Lite Asset Alignment
- [x] Identify active Emmi Lite asset folder (`assets/emmi_html/`)
- [x] Register `assets/assets/emmi-bot-lite/` in `pubspec.yaml`
- [x] Update `EmmiLiteScreen` and its webview to use `assets/assets/assets/emmi-bot-lite/`
- [x] Update `emmi_lite_webview_web.dart` to use `assets/assets/assets/emmi-bot-lite/`

## Emmi Core Sidebar Fix
- [x] Fix absolute paths (e.g., `/toolbox/`, `/vendor/`) in `emmi_core_source/index.html` and `src/modules/app.js`
- [x] Rebuild `emmi_core_source` using `npm run build`
- [x] Deploy fixed files from `dist` to `assets/emmi_core/`
- [x] Verify relative paths in the final build
