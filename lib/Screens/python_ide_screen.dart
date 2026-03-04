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

class PythonIdeScreen extends StatefulWidget {
  const PythonIdeScreen({super.key});

  @override
  State<PythonIdeScreen> createState() => _PythonIdeScreenState();
}

class _PythonIdeScreenState extends State<PythonIdeScreen> {
  InAppWebViewController? webViewController;
  HttpServer? _server;
  String? _localUrl;
  bool _isLoading = true;
  String _statusMessage = "Initializing...";

  @override
  void initState() {
    super.initState();
    _startLocalServer();

    if (kIsWeb) {
      // For Flutter Web, we use the iframe registry
      registerIframe(
          'pythonide-web-view', "assets/assets/pythonide/index.html");
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
      print("Starting asset extraction for Python IDE...");
      if (mounted) setState(() => _statusMessage = "Extracting assets...");

      final docsDir = await getApplicationDocumentsDirectory();
      final webRoot = Directory(p.join(docsDir.path, 'pythonide_web'));

      // Clean old assets to ensure updates
      if (await webRoot.exists()) {
        try {
          await webRoot.delete(recursive: true);
        } catch (e) {
          print("Warning: Could not delete old assets: $e");
        }
      }
      await webRoot.create(recursive: true);

      // Read AssetManifest safely
      print("Loading AssetManifest...");
      String manifestContent;
      try {
        manifestContent = await rootBundle.loadString('AssetManifest.json');
      } catch (e) {
        print("Error loading AssetManifest.json: $e");
        throw "Could not find AssetManifest.json. Please rebuild the app.";
      }

      final Map<String, dynamic> manifestMap = json.decode(manifestContent);

      final webAssets = manifestMap.keys
          .where((key) => key.startsWith('assets/pythonide/'))
          .toList();

      if (webAssets.isEmpty) {
        print("Warning: No assets found in assets/pythonide/");
      }

      for (final assetPath in webAssets) {
        final data = await rootBundle.load(assetPath);
        final bytes = data.buffer.asUint8List();

        final relativePath = assetPath.replaceFirst('assets/pythonide/', '');
        final file = File(p.join(webRoot.path, relativePath));

        await file.parent.create(recursive: true);
        await file.writeAsBytes(bytes);
      }

      print('Extracted ${webAssets.length} files to ${webRoot.path}');

      if (mounted) setState(() => _statusMessage = "Starting server...");

      // Configure Server with COOP/COEP headers for Pyodide/SharedArrayBuffer
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

      // Explicitly use 127.0.0.1 for Windows
      _server = await shelf_io.serve(handler, InternetAddress.loopbackIPv4, 0);

      final server = _server;
      if (server == null) {
        throw "HttpServer could not be started.";
      }

      _localUrl = 'http://127.0.0.1:${server.port}';

      print('Server running on $_localUrl');

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e, stack) {
      print("Error starting server: $e");
      print(stack);
      if (mounted) {
        setState(() => _statusMessage = "Error: $e\n\nStack: $stack");
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
                    const CircularProgressIndicator(color: Colors.blueAccent),
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
                        ? const HtmlElementView(viewType: 'pythonide-web-view')
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
                              iframeAllow: "camera; microphone",
                              iframeAllowFullscreen: true,
                            ),
                            onWebViewCreated: (controller) {
                              webViewController = controller;
                            },
                            onConsoleMessage: (controller, consoleMessage) {
                              if (kDebugMode) {
                                print(
                                    "PYTHON IDE CONSOLE: ${consoleMessage.message}");
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
