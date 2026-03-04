import 'package:flutter/material.dart';
import '../powerpoint_no_ai_webview_cross.dart';

class PresentationNoAiWebViewScreen extends StatelessWidget {
  const PresentationNoAiWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors
          .transparent, // CRITICAL: Must be transparent for Web IFrame to show
      // Scaffold is already provided by PowerPointNoAiWebViewCross
      body:
          const PowerPointNoAiWebViewPlatformComponent(), // Connect to the cross-platform widget
    );
  }
}
