import 'package:flutter/material.dart';
import 'keyboard_game_webview_cross.dart';

class KeyboardGameWebViewScreen extends StatelessWidget {
  const KeyboardGameWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: const KeyboardGameWebViewPlatformComponent(),
    );
  }
}
