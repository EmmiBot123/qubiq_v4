import 'package:flutter/material.dart';
import '../powerpoint_webview_cross.dart';

class PresentationWebViewScreen extends StatelessWidget {
  const PresentationWebViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors
          .transparent, // CRITICAL: Must be transparent for Web IFrame to show
      // Scaffold is already provided by PowerPointWebViewCross
      body:
          const PowerPointWebViewPlatformComponent(), // Connect to the cross-platform widget
    );
  }
}
