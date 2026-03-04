import 'package:flutter/material.dart';
import 'dart:ui_web' as ui_web;
import 'package:web/web.dart' as web;

class ExcelWebViewPlatformComponent extends StatefulWidget {
  const ExcelWebViewPlatformComponent({super.key});

  @override
  State<ExcelWebViewPlatformComponent> createState() =>
      _ExcelWebViewPlatformComponentState();
}

class _ExcelWebViewPlatformComponentState
    extends State<ExcelWebViewPlatformComponent> {
  final String viewId = 'excel-web-view';

  @override
  void initState() {
    super.initState();
    // Register the IFrame element for Flutter Web
    ui_web.platformViewRegistry.registerViewFactory(
      viewId,
      (int viewId) {
        final web.HTMLIFrameElement iframe = web.HTMLIFrameElement();
        // Crucial: use the path relative to the flutter web entrypoint
        iframe.src = 'assets/assets/excel_web/dist/index.html';
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
          // Use Flutter's native web wrapper instead of InAppWebView
          HtmlElementView(viewType: viewId),
          Positioned(
            top: 10,
            left: 10,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => Navigator.of(context).pop(),
                borderRadius: BorderRadius.circular(30),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.8),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_back, color: Colors.black87),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
