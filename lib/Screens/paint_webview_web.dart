import 'package:flutter/material.dart';
import 'dart:ui_web' as ui_web;
import 'package:web/web.dart' as web;
import 'package:pointer_interceptor/pointer_interceptor.dart';

class PaintWebViewPlatformComponent extends StatefulWidget {
  const PaintWebViewPlatformComponent({super.key});

  @override
  State<PaintWebViewPlatformComponent> createState() =>
      _PaintWebViewPlatformComponentState();
}

class _PaintWebViewPlatformComponentState
    extends State<PaintWebViewPlatformComponent> {
  final String viewId = 'paint-web-view';

  @override
  void initState() {
    super.initState();
    ui_web.platformViewRegistry.registerViewFactory(
      viewId,
      (int viewId) {
        final web.HTMLIFrameElement iframe = web.HTMLIFrameElement();
        // Dynamic path resolution for GitHub Pages subdirectories
        final String currentUrl = web.window.location.href;
        final String baseUrl = currentUrl.contains('#') 
            ? currentUrl.substring(0, currentUrl.indexOf('#'))
            : currentUrl;
        final String cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : '$baseUrl/';
        iframe.src = '${cleanBaseUrl}assets/assets/paint/paint.html';
        iframe.style.border = 'none';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        return iframe;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        fit: StackFit.expand,
        children: [
          HtmlElementView(viewType: viewId),
          Positioned(
            top: 10,
            left: 10,
            child: PointerInterceptor(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => Navigator.of(context).pop(),
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Colors.transparent,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
