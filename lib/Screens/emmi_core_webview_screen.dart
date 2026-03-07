import 'package:flutter/material.dart';
import 'emmi_core_webview_cross.dart';

class EmmiCoreWebViewScreen extends StatelessWidget {
  const EmmiCoreWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: const EmmiCoreWebViewPlatformComponent(),
    );
  }
}
