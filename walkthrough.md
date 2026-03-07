# Walkthrough: Emmi Core Sidebar Fix

## The Issue
The Emmi Core sidebar (Blockly toolbox) was missing when launched through the dashboard. This was caused by **absolute paths** (e.g., `/toolbox/`, `/vendor/`) in the source code. While these work in a local Vite dev server, they fail in the Flutter Web build where the app is served from a subfolder (`assets/assets/emmi_core/`).

## Changes Made
1.  **Fixed `emmi_core_source/index.html`**: Converted ~60 absolute asset paths (scripts, links, images) to relative paths.
2.  **Fixed `emmi_core_source/src/modules/app.js`**: Updated `fetch` calls for toolbox XML and examples to use relative paths.
3.  **Rebuilt & Deployed**:
    -   Ran `npm run build` in `emmi_core_source`.
    -   Copied the fixed build from `dist/` to `assets/emmi_core/`.

## Verification
- [x] Verified `assets/emmi_core/index.html` contains the new relative paths.
- [x] Verified `assets/emmi_core/assets/index-*.js` (the compiled JS) now correctly points to the relative `toolbox/` folder.

The sidebar should now appear correctly in the dashboard.
