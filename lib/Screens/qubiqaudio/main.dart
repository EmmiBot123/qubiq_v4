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

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'QubiQ Audio',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  InAppWebViewController? webViewController;
  HttpServer? _server;
  String? _localUrl;
  bool _isLoading = true;
  String _statusMessage = "Initializing...";

  @override
  void initState() {
    super.initState();
    _startLocalServer();
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
      print("Starting asset extraction for QubiQ Audio...");
      if (mounted) setState(() => _statusMessage = "Extracting assets...");

      final docsDir = await getApplicationDocumentsDirectory();
      final webRoot = Directory(p.join(docsDir.path, 'qubiq_web'));

      // Always re-extract in debug mode or if missing
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
          .where((key) => key.startsWith('assets/qubiq_web/'))
          .toList();

      if (webAssets.isEmpty) {
        print("Warning: No assets found in assets/qubiq_web/");
      }

      for (final assetPath in webAssets) {
        final data = await rootBundle.load(assetPath);
        final bytes = data.buffer.asUint8List();

        final relativePath = assetPath.replaceFirst('assets/qubiq_web/', '');
        final file = File(p.join(webRoot.path, relativePath));

        await file.parent.create(recursive: true);
        await file.writeAsBytes(bytes);
      }

      print('Extracted ${webAssets.length} files to ${webRoot.path}');

      if (mounted) setState(() => _statusMessage = "Starting server...");

      // Configure Server with COOP/COEP headers
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
              defaultDocument: 'qubiq_audio.html',
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
                    const CircularProgressIndicator(),
                    const SizedBox(height: 20),
                    Text(
                      _statusMessage,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              )
            : Stack(
                children: [
                  InAppWebView(
                    initialUrlRequest: URLRequest(
                      url: kIsWeb
                          ? WebUri("assets/assets/qubiq_web/qubiq_audio.html")
                          : WebUri(_localUrl ?? ""),
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
                    onPermissionRequest: (controller, request) async {
                      return PermissionResponse(
                        resources: request.resources,
                        action: PermissionResponseAction.GRANT,
                      );
                    },
                    onConsoleMessage: (controller, consoleMessage) {
                      if (kDebugMode) {
                        print("QUBIQ AUDIO CONSOLE: ${consoleMessage.message}");
                      }
                    },
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
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
                ],
              ),
      ),
    );
  }
}
