import 'package:flutter/material.dart';
import 'emmi_lite_webview_cross.dart';

class EmmiLiteWebViewScreen extends StatelessWidget {
  const EmmiLiteWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: const EmmiLiteWebViewPlatformComponent(),
    );
  }
}
