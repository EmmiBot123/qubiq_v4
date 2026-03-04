import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_static/shelf_static.dart';
import 'package:path/path.dart' as p;
import 'package:pointer_interceptor/pointer_interceptor.dart';
import 'package:little_emmi/Screens/teachable/iframe_registry.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class EmmiLiteScreen extends StatefulWidget {
  const EmmiLiteScreen({super.key});

  @override
  State<EmmiLiteScreen> createState() => _EmmiLiteScreenState();
}

class _EmmiLiteScreenState extends State<EmmiLiteScreen> {
  InAppWebViewController? webViewController;
  HttpServer? _server;
  String? _localUrl;
  bool _isLoading = true;
  String _statusMessage = "Initializing EMMI BOT Lite...";

  @override
  void initState() {
    super.initState();
    _startLocalServer();

    if (kIsWeb) {
      registerIframe('emmi-lite-web-view', "assets/emmi_html/index.html");
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
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          sendAuthToWebIframe(token!, schoolId);
        }
      });
    } catch (e) {
      debugPrint("Error fetching auth for web iframe: $e");
    }
  }

  @override
  void dispose() {
    _server?.close(force: true);
    super.dispose();
  }

  Future<void> _startLocalServer() async {
    if (kIsWeb) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    try {
      if (mounted) setState(() => _statusMessage = "Extracting assets...");

      final docsDir = await getApplicationDocumentsDirectory();
      final webRoot = Directory(p.join(docsDir.path, 'emmi_html_web'));

      if (await webRoot.exists()) {
        try {
          await webRoot.delete(recursive: true);
        } catch (e) {
          print("Warning: Could not delete old assets: $e");
        }
      }
      await webRoot.create(recursive: true);

      String manifestContent;
      try {
        manifestContent = await rootBundle.loadString('AssetManifest.json');
      } catch (e) {
        throw "Could not find AssetManifest.json. Please rebuild the app.";
      }

      final Map<String, dynamic> manifestMap = json.decode(manifestContent);

      final webAssets = manifestMap.keys
          .where((key) => key.startsWith('assets/emmi_html/'))
          .toList();

      for (final assetPath in webAssets) {
        final data = await rootBundle.load(assetPath);
        final bytes = data.buffer.asUint8List();

        final relativePath = assetPath.replaceFirst('assets/emmi_html/', '');
        final file = File(p.join(webRoot.path, relativePath));

        await file.parent.create(recursive: true);
        await file.writeAsBytes(bytes);
      }

      print('Extracted ${webAssets.length} EMMI Lite files to ${webRoot.path}');

      if (mounted) setState(() => _statusMessage = "Starting server...");

      final handler = const Pipeline()
          .addMiddleware(
            (innerHandler) => (request) async {
              final response = await innerHandler(request);
              return response.change(
                headers: {
                  'Cross-Origin-Opener-Policy': 'same-origin',
                  'Cross-Origin-Embedder-Policy': 'require-corp',
                  'Access-Control-Allow-Origin': '*',
                },
              );
            },
          )
          .addHandler(
            createStaticHandler(
              webRoot.path,
              defaultDocument: 'index.html',
            ),
          );

      _server = await shelf_io.serve(handler, InternetAddress.loopbackIPv4, 0);

      final server = _server;
      if (server == null) {
        throw "HttpServer could not be started.";
      }

      _localUrl = 'http://127.0.0.1:${server.port}';
      print('EMMI Lite server running on $_localUrl');

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e, stack) {
      print("Error starting EMMI Lite server: $e");
      print(stack);
      if (mounted) {
        setState(() => _statusMessage = "Error: $e");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: _isLoading
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(color: Colors.tealAccent),
                    const SizedBox(height: 20),
                    Text(
                      _statusMessage,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              )
            : Stack(
                fit: StackFit.expand,
                children: [
                  Positioned.fill(
                    child: kIsWeb
                        ? const HtmlElementView(viewType: 'emmi-lite-web-view')
                        : InAppWebView(
                            initialUrlRequest: URLRequest(
                              url: WebUri(_localUrl ?? ""),
                            ),
                            initialSettings: InAppWebViewSettings(
                              isInspectable: kDebugMode,
                              javaScriptEnabled: true,
                              domStorageEnabled: true,
                              hardwareAcceleration: true,
                              mediaPlaybackRequiresUserGesture: false,
                              allowsInlineMediaPlayback: true,
                              iframeAllow: "camera; microphone; serial; usb",
                              iframeAllowFullscreen: true,
                            ),
                            onWebViewCreated: (controller) {
                              webViewController = controller;
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
                                  final schoolId =
                                      doc.data()?['schoolId'] ?? '';
                                  final script =
                                      "window.EMMI_AUTH_TOKEN = '$token'; window.EMMI_SCHOOL_ID = '$schoolId'; window.EMMI_API_BASE_URL = 'https://edu-ai-backend-vl7s.onrender.com';";
                                  await controller.evaluateJavascript(
                                      source: script);
                                } catch (e) {
                                  debugPrint(
                                      "Error injecting auth in WebView: $e");
                                }
                              }
                            },
                            onConsoleMessage: (controller, consoleMessage) {
                              if (kDebugMode) {
                                print(
                                    "EMMI LITE CONSOLE: ${consoleMessage.message}");
                              }
                            },
                          ),
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: PointerInterceptor(
                      child: IconButton(
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.5),
                            shape: BoxShape.circle,
                          ),
                          child:
                              const Icon(Icons.arrow_back, color: Colors.white),
                        ),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
