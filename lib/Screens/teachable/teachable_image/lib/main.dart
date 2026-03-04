import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';

final InAppLocalhostServer localhostServer = InAppLocalhostServer(
  documentRoot: 'assets/www',
  port: 8080,
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Start the localhost server
  if (!kIsWeb) {
    await localhostServer.start();
  } else {
    // For Web, we don't need localhostServer, but we might need to adjust based on deployment
  }

  runApp(const MaterialApp(home: TeachableImageApp()));
}

class TeachableImageApp extends StatefulWidget {
  const TeachableImageApp({super.key});

  @override
  State<TeachableImageApp> createState() => _TeachableImageAppState();
}

class _TeachableImageAppState extends State<TeachableImageApp> {
  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    if (!kIsWeb && Platform.isMacOS) {
      return;
    }
    await [Permission.camera, Permission.microphone].request();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(
            url: kIsWeb
                ? WebUri("/webapp/teachable.html#/image?mode=standalone")
                : WebUri(
                    "http://localhost:8080/teachable.html#/image?mode=standalone",
                  ),
          ),
          initialSettings: InAppWebViewSettings(
            isInspectable: kDebugMode,
            mediaPlaybackRequiresUserGesture: false,
            allowsInlineMediaPlayback: true,
            iframeAllow: "camera; microphone",
            iframeAllowFullscreen: true,
          ),
          onPermissionRequest: (controller, request) async {
            return PermissionResponse(
              resources: request.resources,
              action: PermissionResponseAction.GRANT,
            );
          },
          onConsoleMessage: (controller, consoleMessage) {
            if (kDebugMode) {
              print("CONSOLE: ${consoleMessage.message}");
            }
          },
        ),
      ),
    );
  }
}
