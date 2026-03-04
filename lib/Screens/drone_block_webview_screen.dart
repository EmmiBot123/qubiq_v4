import 'package:flutter/material.dart';
import 'drone_block_webview_cross.dart';

class DroneBlockWebViewScreen extends StatelessWidget {
  const DroneBlockWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: const DroneBlockWebViewPlatformComponent(),
    );
  }
}
