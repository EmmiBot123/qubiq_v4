import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class PowerPointWebViewPlatformComponent extends StatefulWidget {
  const PowerPointWebViewPlatformComponent({super.key});

  @override
  State<PowerPointWebViewPlatformComponent> createState() =>
      _PowerPointWebViewPlatformComponentState();
}

class _PowerPointWebViewPlatformComponentState
    extends State<PowerPointWebViewPlatformComponent> {
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
      documentRoot: 'assets/web/dist',
      port: 8083,
    );

    try {
      await localhostServer?.start();
      if (!mounted) return;
      setState(() {
        isServerRunning = true;
      });
      debugPrint("PowerPoint Localhost server started on port 8083");
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
            url: WebUri("http://127.0.0.1:8083/index.html"),
          ),
          initialSettings: InAppWebViewSettings(
            isInspectable: true,
            javaScriptEnabled: true,
            useWideViewPort: true,
            loadWithOverviewMode: true,
          ),
          onWebViewCreated: (controller) {
            webViewController = controller;
          },
          onLoadStart: (controller, url) {
            debugPrint("POWERPOINT NATIVE LOAD START: $url");
          },
          onLoadStop: (controller, url) {
            debugPrint("POWERPOINT NATIVE LOAD STOP: $url");
          },
          onReceivedError: (controller, request, error) {
            debugPrint("POWERPOINT NATIVE LOAD ERROR: \${error.description}");
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
