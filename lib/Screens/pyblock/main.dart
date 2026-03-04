import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'webview_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Request camera permission on startup (especially for mobile)
  await _requestPermissions();

  runApp(const MyApp());
}

Future<void> _requestPermissions() async {
  await Permission.camera.request();
  await Permission.microphone.request();
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PyBlocks',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const PyBlocksWebview(),
    );
  }
}
