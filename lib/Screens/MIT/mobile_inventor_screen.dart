import 'dart:async';
import 'dart:collection';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';

class MobileInventorScreen extends StatefulWidget {
  const MobileInventorScreen({super.key});

  @override
  State<MobileInventorScreen> createState() => _MobileInventorScreenState();
}

class _MobileInventorScreenState extends State<MobileInventorScreen> {
  final GlobalKey webViewKey = GlobalKey();
  InAppWebViewController? webViewController;
  InAppLocalhostServer? localhostServer;
  bool isServerRunning = false;

  @override
  void initState() {
    super.initState();
    _startLocalServer();
  }

  Future<void> _startLocalServer() async {
    if (kIsWeb) {
      // On Web, we don't need a local server. The assets are served by the browser.
      setState(() {
        isServerRunning = true;
      });
      return;
    }

    // Start localhost server to serve assets (avoids CORS and file protocol issues)
    // Using port 8081 to avoid conflict with PyBlocks (8080)
    localhostServer = InAppLocalhostServer(
      documentRoot: 'assets/www',
      port: 8081,
    );
    try {
      await localhostServer?.start();
      setState(() {
        isServerRunning = true;
      });
      debugPrint("MobileInventor Localhost server started on port 8081");
    } catch (e) {
      debugPrint("Error starting MobileInventor localhost server: $e");
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
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: InAppWebView(
              key: webViewKey,
              initialUrlRequest: URLRequest(
                url: kIsWeb
                    ? WebUri("assets/assets/www/index_MIT.html") // Web path
                    : WebUri("http://localhost:8081/index_MIT.html"), // Native path
              ),
              initialSettings: InAppWebViewSettings(
                isInspectable: kDebugMode,
                mediaPlaybackRequiresUserGesture: false,
                allowsInlineMediaPlayback: true,
                iframeAllow: "camera; microphone",
                iframeAllowFullscreen: true,
              ),
              onWebViewCreated: (controller) {
                webViewController = controller;
              },
              onPermissionRequest: (controller, request) async {
                // Automatically grant camera/microphone permissions
                return PermissionResponse(
                  resources: request.resources,
                  action: PermissionResponseAction.GRANT,
                );
              },
              onConsoleMessage: (controller, consoleMessage) {
                debugPrint("MobileInventor JS Console: ${consoleMessage.message}");
              },
              onLoadStart: (controller, url) {
                debugPrint("MobileInventor Page started loading: $url");
              },
              onLoadStop: (controller, url) {
                debugPrint("MobileInventor Page finished loading: $url");
              },
              onReceivedError: (controller, request, error) {
                debugPrint(
                  "MobileInventor WebView Error: ${error.description} - Code: ${error.type}",
                );
              },
              onReceivedHttpError: (controller, request, errorResponse) {
                debugPrint(
                  "MobileInventor WebView HTTP Error: ${errorResponse.statusCode} - ${errorResponse.reasonPhrase}",
                );
              },
            ),
          ),
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
                  child: const Icon(Icons.arrow_back, color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
