import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:little_emmi/Screens/teachable/iframe_registry.dart';

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  final GlobalKey webViewKey = GlobalKey();
  InAppWebViewController? webViewController;
  InAppLocalhostServer? localhostServer;
  bool _isLoading = true;
  String _loadingText = "Preparing Python Environment...";
  List<String> _debugLog = [];

  InAppWebViewSettings settings = InAppWebViewSettings(
    isInspectable: true,
    mediaPlaybackRequiresUserGesture: false,
    allowsInlineMediaPlayback: true,
    iframeAllow: "camera; microphone",
    iframeAllowFullscreen: true,
    useHybridComposition: true,
    allowContentAccess: true,
    allowFileAccess: true,
    allowFileAccessFromFileURLs: true,
    allowUniversalAccessFromFileURLs: true,
  );

  @override
  void initState() {
    super.initState();
    _initApp();

    if (kIsWeb) {
      registerIframe(
          'antipython-web-view', "assets/assets/antipython_web/index.html");
      _injectAuthTokenWeb();
    }
  }

  void _injectAuthTokenWeb() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    try {
      final token = await user.getIdToken();
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get();
      final schoolId = doc.data()?['schoolId'] ?? '';

      // Delay to ensure the iframe has mounted and is ready to receive messages
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          sendAuthToWebIframe(token!, schoolId);
        }
      });
    } catch (e) {
      debugPrint("Error fetching auth for web iframe: $e");
    }
  }

  void _log(String message) {
    debugPrint("[AppDebug] $message");
    _debugLog.add(message);
  }

  Future<void> _initApp() async {
    // 1. Setup Local Assets
    await _setupWebAssets();

    // 2. Request Permissions (Platform specific)
    if (!kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS)) {
      _log("Requesting Mobile Permissions...");
      await _requestPermissions();
    } else {
      _log("Skipping permissions (Desktop/Web)");
    }
  }

  Future<void> _setupWebAssets() async {
    try {
      if (!kIsWeb) {
        // Start localhost server to serve assets for Native platforms
        localhostServer = InAppLocalhostServer(
          documentRoot: 'assets/antipython_web',
          port: 8084,
        );
        await localhostServer?.start();
        _log("Localhost server started on port 8084");
      }

      if (!mounted) return;
      setState(() {
        _loadingText = "Loading WebView...";
        _isLoading = false;
      });
    } catch (e) {
      _log("Asset Setup Error: $e");
      if (!mounted) return;
      setState(() {
        _loadingText = "Error: $e";
      });
    }
  }

  Future<void> _requestPermissions() async {
    try {
      await [Permission.camera, Permission.microphone].request();
    } catch (e) {
      _log("Error requesting permissions: $e");
    }
  }

  @override
  void dispose() {
    localhostServer?.close();
    webViewController?.dispose(); // Ensure controller is disposed
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  _loadingText,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _loadingText.startsWith("Error")
                        ? Colors.red
                        : Colors.black,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        fit: StackFit.expand, // Force children to fill the available space
        children: [
          Container(
            color: Colors.white, // Background to prevent transparency issues
            child: kIsWeb
                ? const HtmlElementView(viewType: 'antipython-web-view')
                : InAppWebView(
                    key: webViewKey,
                    initialUrlRequest: URLRequest(
                      url: WebUri("http://127.0.0.1:8084/index.html"),
                    ),
                    initialSettings: settings,
                    onWebViewCreated: (controller) {
                      webViewController = controller;
                    },
                    onPermissionRequest: (controller, request) async {
                      return PermissionResponse(
                        resources: request.resources,
                        action: PermissionResponseAction.GRANT,
                      );
                    },
                    onConsoleMessage: (controller, consoleMessage) {
                      debugPrint("WEBVIEW: ${consoleMessage.message}");
                    },
                    onLoadError: (controller, url, code, message) {
                      _log("WebView Load Error: $code, $message");
                    },
                    onLoadHttpError:
                        (controller, url, statusCode, description) {
                      _log("WebView HTTP Error: $statusCode, $description");
                    },
                    onLoadStop: (controller, url) async {
                      final user = FirebaseAuth.instance.currentUser;
                      if (user != null) {
                        try {
                          final token = await user.getIdToken();
                          final doc = await FirebaseFirestore.instance
                              .collection('users')
                              .doc(user.uid)
                              .get();
                          final schoolId = doc.data()?['schoolId'] ?? '';
                          final script =
                              "window.EMMI_AUTH_TOKEN = '$token'; window.EMMI_SCHOOL_ID = '$schoolId'; window.EMMI_API_BASE_URL = 'https://edu-ai-backend-vl7s.onrender.com';";
                          await controller.evaluateJavascript(source: script);
                        } catch (e) {
                          debugPrint(
                              "Error injecting auth in PyVibe WebView: $e");
                        }
                      }
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
