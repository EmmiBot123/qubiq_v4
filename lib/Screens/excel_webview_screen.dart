import 'package:flutter/material.dart';
import 'excel_webview_cross.dart';

class ExcelWebViewScreen extends StatelessWidget {
  const ExcelWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors
          .transparent, // CRITICAL: Must be transparent for Web IFrame to show
      // Scaffold is already provided by ExcelWebViewCross
      body: const ExcelWebViewPlatformComponent(),
    );
  }
}
