import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_static/shelf_static.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

class TeachableImageScreen extends StatefulWidget {
  const TeachableImageScreen({super.key});

  @override
  State<TeachableImageScreen> createState() => _TeachableImageScreenState();
}

class _TeachableImageScreenState extends State<TeachableImageScreen> {
  HttpServer? _server;
  String? _localUrl;
  bool isServerRunning = false;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _startLocalServer();
    _requestPermissions();
  }

  Future<void> _startLocalServer() async {
    if (kIsWeb) {
      setState(() {
        isServerRunning = true;
      });
      return;
    }

    try {
      print("Starting asset extraction for Teachable Image...");

      final docsDir = await getApplicationDocumentsDirectory();
      final webRoot = Directory(p.join(docsDir.path, 'teachable_image_web'));

      if (!await webRoot.exists()) {
        await webRoot.create(recursive: true);
      }

      // Read AssetManifest safely
      String manifestContent =
          await rootBundle.loadString('AssetManifest.json');
      final Map<String, dynamic> manifestMap = json.decode(manifestContent);

      final webAssets = manifestMap.keys
          .where((key) => key.startsWith('assets/teachable/image/'))
          .toList();

      for (final assetPath in webAssets) {
        final data = await rootBundle.load(assetPath);
        final bytes = data.buffer.asUint8List();

        final relativePath =
            assetPath.replaceFirst('assets/teachable/image/', '');
        final file = File(p.join(webRoot.path, relativePath));

        await file.parent.create(recursive: true);
        await file.writeAsBytes(bytes);
      }

      print('Extracted ${webAssets.length} files to ${webRoot.path}');

      final handler = const Pipeline().addMiddleware(logRequests()).addHandler(
            createStaticHandler(
              webRoot.path,
              defaultDocument: 'teachable.html',
            ),
          );

      _server = await shelf_io.serve(handler, InternetAddress.loopbackIPv4, 0);

      if (_server != null) {
        _localUrl = 'http://127.0.0.1:${_server!.port}';
        print('Teachable Image server running on $_localUrl');
        setState(() {
          isServerRunning = true;
        });
      }
    } catch (e, stack) {
      print("Error starting Teachable Image server: $e");
      print(stack);
      if (mounted) {
        setState(() {
          _statusMessage = "Error: $e\n\nStack: $stack";
        });
      }
    }
  }

  Future<void> _requestPermissions() async {
    if (kIsWeb || Platform.isMacOS || Platform.isWindows) {
      return;
    }
    await [Permission.camera, Permission.microphone].request();
  }

  @override
  void dispose() {
    _server?.close(force: true);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Train Image Model'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: !isServerRunning
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  if (_statusMessage != null) ...[
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        _statusMessage!,
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ],
              ),
            )
          : SafeArea(
              child: InAppWebView(
                initialUrlRequest: URLRequest(
                  url: kIsWeb
                      ? WebUri(
                          "assets/assets/teachable/image/teachable.html#/image?mode=standalone")
                      : WebUri(
                          "$_localUrl/#/image?mode=standalone",
                        ),
                ),
                initialSettings: InAppWebViewSettings(
                  isInspectable: kDebugMode,
                  javaScriptEnabled: true,
                  domStorageEnabled: true,
                  hardwareAcceleration: true,
                  safeBrowsingEnabled: false,
                  mediaPlaybackRequiresUserGesture: false,
                  allowsInlineMediaPlayback: true,
                  iframeAllow: "camera; microphone",
                  iframeAllowFullscreen: true,
                  allowFileAccessFromFileURLs: true,
                  allowUniversalAccessFromFileURLs: true,
                ),
                onPermissionRequest: (controller, request) async {
                  return PermissionResponse(
                    resources: request.resources,
                    action: PermissionResponseAction.GRANT,
                  );
                },
                onConsoleMessage: (controller, consoleMessage) {
                  if (kDebugMode) {
                    print("TEACHABLE IMAGE CONSOLE: ${consoleMessage.message}");
                  }
                },
              ),
            ),
    );
  }
}
