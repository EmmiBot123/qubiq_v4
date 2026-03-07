import 'package:flutter/material.dart';
import 'dart:ui_web' as ui_web;
import 'package:web/web.dart' as web;
import 'package:pointer_interceptor/pointer_interceptor.dart';

class EmmiCoreWebViewPlatformComponent extends StatefulWidget {
  const EmmiCoreWebViewPlatformComponent({super.key});

  @override
  State<EmmiCoreWebViewPlatformComponent> createState() =>
      _EmmiCoreWebViewPlatformComponentState();
}

class _EmmiCoreWebViewPlatformComponentState
    extends State<EmmiCoreWebViewPlatformComponent> {
  final String viewId = 'emmi-core-web-view';

  @override
  void initState() {
    super.initState();
    ui_web.platformViewRegistry.registerViewFactory(
      viewId,
      (int viewId) {
        final web.HTMLIFrameElement iframe = web.HTMLIFrameElement();
        iframe.src = 'https://emmibot123.github.io/emmi-core/';
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
            right: 10,
            child: PointerInterceptor(
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
          ),
        ],
      ),
    );
  }
}
