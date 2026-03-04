import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform; // Import Platform for strict checks
import 'package:webview_flutter/webview_flutter.dart';
// Conditional import: Uses the stub by default, but the web implementation on web
//import 'web_registration_stub.dart'
//    if (dart.library.js_interop) 'web_registration_web.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Register Web implementation if applicable
//  if (kIsWeb) {
//    registerWebViewWebImplementation();
//  }

  runApp(const QubiQApp());
}

class QubiQApp extends StatelessWidget {
  const QubiQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'QubiQ Studio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6C5CE7)),
        useMaterial3: true,
      ),
      home: const QubiQWebView(),
    );
  }
}

class QubiQWebView extends StatefulWidget {
  const QubiQWebView({super.key});

  @override
  State<QubiQWebView> createState() => _QubiQWebViewState();
}

class _QubiQWebViewState extends State<QubiQWebView> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    controller = WebViewController();

    if (kIsWeb) {
      // ON WEB: Resolve relative path using current origin
      final String origin = Uri.base.origin;
      controller
          .loadRequest(Uri.parse('$origin/assets/assets/www/index_MIT.html'));
    } else {
      // ON NATIVE (Mobile/Desktop)
      controller.setJavaScriptMode(JavaScriptMode.unrestricted);

      // setBackgroundColor is strictly Mobile-only for now
      // as macOS/Windows implementations may throw UnimplementedError
      if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
        controller.setBackgroundColor(const Color(0x00000000));
      }

      controller.loadFlutterAsset('assets/www/index_MIT.html');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF6C5CE7), // Match your app theme
      body: SafeArea(child: WebViewWidget(controller: controller)),
    );
  }
}
