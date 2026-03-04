import 'dart:ui_web' as ui_web;
import 'package:web/web.dart' as web;
import 'dart:js_interop';

void registerIframe(String viewId, String src) {
  ui_web.platformViewRegistry.registerViewFactory(
    viewId,
    (int viewId) {
      final web.HTMLIFrameElement iframe = web.HTMLIFrameElement();
      iframe.src = src;
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.allow =
          "camera; microphone; fullscreen; clipboard-read; clipboard-write; autoplay";
      iframe.id = 'emmi-lite-iframe';
      return iframe;
    },
  );
}

void sendAuthToWebIframe(String token, String schoolId) {
  // 1. Direct LocalStorage injection (works because iframe shares same origin on Web)
  web.window.localStorage.setItem('EMMI_AUTH_TOKEN', token);
  web.window.localStorage.setItem('EMMI_SCHOOL_ID', schoolId);

  // 2. Fallback: postMessage into any active iframe
  final iframes = web.document.querySelectorAll('iframe');
  for (int i = 0; i < iframes.length; i++) {
    final iframe = iframes.item(i) as web.HTMLIFrameElement?;
    if (iframe != null) {
      final msg =
          '{"type": "emmi_auth", "token": "$token", "schoolId": "$schoolId"}'
              .toJS;
      iframe.contentWindow?.postMessage(msg, '*'.toJS);
    }
  }
}
