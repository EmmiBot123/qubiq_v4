import 'package:flutter/material.dart';
import 'dart:ui_web' as ui_web;
import 'package:web/web.dart' as web;
import 'package:pointer_interceptor/pointer_interceptor.dart';

class HtmlLearningWebViewPlatformComponent extends StatefulWidget {
  const HtmlLearningWebViewPlatformComponent({super.key});

  @override
  State<HtmlLearningWebViewPlatformComponent> createState() =>
      _HtmlLearningWebViewPlatformComponentState();
}

class _HtmlLearningWebViewPlatformComponentState
    extends State<HtmlLearningWebViewPlatformComponent> {
  final String viewId = 'html-learning-web-view';

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
        iframe.src = '${cleanBaseUrl}assets/assets/html_learning/index.html';
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
            top: 15,
            right: 170, // Placed next to the "Run Code" button
            child: PointerInterceptor(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => Navigator.of(context).pop(),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.redAccent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red, width: 1),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.redAccent.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          "Exit 🚪",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
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
