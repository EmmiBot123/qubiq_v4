import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class KeyboardGameWebViewPlatformComponent extends StatefulWidget {
  const KeyboardGameWebViewPlatformComponent({super.key});

  @override
  State<KeyboardGameWebViewPlatformComponent> createState() =>
      _KeyboardGameWebViewPlatformComponentState();
}

class _KeyboardGameWebViewPlatformComponentState
    extends State<KeyboardGameWebViewPlatformComponent> {
  final GlobalKey webViewKey = GlobalKey();
  InAppWebViewController? webViewController;
  InAppLocalhostServer? localhostServer;
  bool isServerRunning = false;
  double progress = 0;

  @override
  void initState() {
    super.initState();
    _startLocalServer();
  }

  Future<void> _startLocalServer() async {
    localhostServer = InAppLocalhostServer(
      documentRoot: 'assets/keyboard_game',
      port: 8092,
    );

    try {
      await localhostServer?.start();
      if (!mounted) return;
      setState(() {
        isServerRunning = true;
      });
      debugPrint("Keyboard Game localhost server started on port 8092");
    } catch (e) {
      debugPrint("Error starting localhost server: $e");
    }
  }

  @override
  void dispose() {
    localhostServer?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!isServerRunning) {
      return const Center(child: CircularProgressIndicator());
    }

    return Stack(
      children: [
        InAppWebView(
          key: webViewKey,
          initialUrlRequest: URLRequest(
            url: WebUri("http://127.0.0.1:8092/index.html"),
          ),
          initialSettings: InAppWebViewSettings(
            isInspectable: true,
            javaScriptEnabled: true,
            useWideViewPort: true,
            loadWithOverviewMode: true,
            allowFileAccess: true,
            allowContentAccess: true,
            domStorageEnabled: true,
          ),
          onWebViewCreated: (controller) {
            webViewController = controller;
          },
          onProgressChanged: (controller, p) {
            setState(() {
              progress = p / 100;
            });
          },
        ),
        if (progress < 1.0) LinearProgressIndicator(value: progress),
      ],
    );
  }
}
