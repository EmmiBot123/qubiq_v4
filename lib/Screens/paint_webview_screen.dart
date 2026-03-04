import 'package:flutter/material.dart';
import 'paint_webview_cross.dart';

class PaintWebViewScreen extends StatelessWidget {
  const PaintWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: const PaintWebViewPlatformComponent(),
    );
  }
}
