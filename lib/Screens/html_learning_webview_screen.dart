import 'package:flutter/material.dart';
import 'html_learning_webview_cross.dart';

class HtmlLearningWebViewScreen extends StatelessWidget {
  const HtmlLearningWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: const HtmlLearningWebViewPlatformComponent(),
    );
  }
}
