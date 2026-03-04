import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class WordWebViewScreen extends StatefulWidget {
  const WordWebViewScreen({super.key});

  @override
  State<WordWebViewScreen> createState() => _WordWebViewScreenState();
}

class _WordWebViewScreenState extends State<WordWebViewScreen> {
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
    if (kIsWeb) {
      setState(() {
        isServerRunning = true;
      });
      return;
    }

    // Start localhost server to serve assets
    // Using port 8085 to avoid conflict with other servers
    localhostServer = InAppLocalhostServer(
      documentRoot: 'assets/word_web/word',
      port: 8085,
    );

    try {
      await localhostServer?.start();
      setState(() {
        isServerRunning = true;
      });
      debugPrint("Word Localhost server started on port 8085");
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Microsoft Word'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              webViewController?.reload();
            },
          ),
        ],
      ),
      body: !isServerRunning
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                InAppWebView(
                  initialUrlRequest: URLRequest(
                    url: WebUri(
                      kIsWeb
                          ? "assets/word_web/word/index.html"
                          : "http://127.0.0.1:8085/index.html",
                    ),
                  ),
                  initialSettings: InAppWebViewSettings(
                    isInspectable: kDebugMode,
                    javaScriptEnabled: true,
                    // Allow scaling if needed
                    useWideViewPort: true,
                    loadWithOverviewMode: true,
                    allowFileAccessFromFileURLs: true,
                    allowUniversalAccessFromFileURLs: true,
                  ),
                  onWebViewCreated: (controller) {
                    webViewController = controller;
                  },
                  onProgressChanged: (controller, p) {
                    setState(() {
                      progress = p / 100;
                    });
                  },
                  onConsoleMessage: (controller, consoleMessage) {
                    debugPrint("Word JS: ${consoleMessage.message}");
                  },
                ),
                if (progress < 1.0) LinearProgressIndicator(value: progress),
              ],
            ),
    );
  }
}
