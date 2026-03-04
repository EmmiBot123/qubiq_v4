import 'package:flutter/material.dart';
import 'powerpoint_app_webview_cross.dart';

class PowerPointAppWebViewScreen extends StatelessWidget {
  const PowerPointAppWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: const PowerPointAppWebViewPlatformComponent(),
    );
  }
}
