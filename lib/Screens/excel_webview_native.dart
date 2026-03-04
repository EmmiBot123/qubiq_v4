import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class ExcelWebViewPlatformComponent extends StatefulWidget {
  const ExcelWebViewPlatformComponent({super.key});

  @override
  State<ExcelWebViewPlatformComponent> createState() =>
      _ExcelWebViewPlatformComponentState();
}

class _ExcelWebViewPlatformComponentState
    extends State<ExcelWebViewPlatformComponent> {
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
      documentRoot: 'assets/excel_web/dist',
      port: 8082,
    );

    try {
      await localhostServer?.start();
      if (!mounted) return;
      setState(() {
        isServerRunning = true;
      });
      debugPrint("Excel Localhost server started on port 8082");
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
            url: WebUri("http://127.0.0.1:8082/index.html"),
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
            debugPrint("EXCEL NATIVE LOAD START: $url");
          },
          onLoadStop: (controller, url) {
            debugPrint("EXCEL NATIVE LOAD STOP: $url");
          },
          onReceivedError: (controller, request, error) {
            debugPrint("EXCEL NATIVE LOAD ERROR: \${error.description}");
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
