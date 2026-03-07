import 'package:flutter/material.dart';
import 'excel_ai_webview_cross.dart';

class ExcelAiWebViewScreen extends StatelessWidget {
  const ExcelAiWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors
          .transparent, // CRITICAL: Must be transparent for Web IFrame to show
      // Scaffold is already provided by ExcelAiWebViewCross
      body: const ExcelAiWebViewPlatformComponent(),
    );
  }
}
