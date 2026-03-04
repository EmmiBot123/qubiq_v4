import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';

// Providers
import 'package:little_emmi/Providers/block_provider.dart';
// import 'package:little_emmi/Providers/api_key_provider.dart'; // REMOVED
import 'package:little_emmi/Services/bluetooth_manager.dart';

// Firebase
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_options.dart';

// Screens
import 'package:little_emmi/Screens/BodyLayout/body_layout.dart';
import 'package:little_emmi/Screens/TopBar/top_bar.dart';
// import 'package:camera_windows/camera_windows.dart';

import 'package:little_emmi/Screens/Auth/login_screen.dart';
import 'package:little_emmi/Screens/Auth/activation_screen.dart';
import 'package:little_emmi/Screens/Auth/student_dashboard.dart';
import 'package:little_emmi/Screens/Auth/teacher_dashboard.dart';
import 'package:little_emmi/Screens/Dashboard/admin_dashboard.dart';
import 'package:little_emmi/Screens/MIT/mit_dashboard_screen.dart';
import 'package:little_emmi/Screens/MIT/mit_login_screen.dart';
import 'package:little_emmi/Screens/MIT/mobile_inventor_screen.dart';
import 'package:little_emmi/screens/antipython/webview_screen.dart'
    as antipython;
import 'package:little_emmi/screens/pyblock/webview_screen.dart';
import 'package:little_emmi/Screens/powerpoint_webview/webview_screen.dart'
    as powerpoint;
import 'package:little_emmi/Screens/powerpoint_no_ai_webview/webview_screen.dart'
    as powerpoint_no_ai;
import 'package:little_emmi/Screens/excel_webview_screen.dart';
import 'package:little_emmi/Screens/word_webview_screen.dart';
import 'package:little_emmi/Screens/unknown_route_screen.dart';
import 'package:little_emmi/Screens/html_learning_webview_screen.dart';
import 'package:little_emmi/Screens/paint_webview_screen.dart';
import 'package:little_emmi/Screens/keyboard_game_webview_screen.dart';
import 'package:little_emmi/Screens/powerpoint_app_webview_screen.dart';
import 'package:little_emmi/Screens/drone_block_webview_screen.dart';
import 'package:little_emmi/Screens/emmi_core_webview_screen.dart';

import 'package:little_emmi/Services/keep_alive_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const QubiQApp());
}

class QubiQApp extends StatelessWidget {
  const QubiQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => BlockProvider()),
        // ChangeNotifierProvider(create: (_) => ApiKeyProvider()), // REMOVED
        ChangeNotifierProvider(create: (_) => BluetoothManager()),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'QubiQAI',
        theme: ThemeData(
          brightness: Brightness.light,
          primarySwatch: Colors.indigo,
          useMaterial3: true,
        ),
        home: const RobotLaunchScreen(),
        routes: {
          '/activation': (_) => const ActivationScreen(),
          '/login': (_) => const LittleEmmiLoginScreen(),
          '/auth/student': (_) => const StudentDashboardScreen(),
          '/auth/teacher': (_) => const TeacherDashboardScreen(),
          '/mit/login': (_) => const MitLoginScreen(),
          '/mit/dashboard': (_) => const MitDashboardScreen(),
          '/mit/mobile_inventor': (_) => const MobileInventorScreen(),
          '/app/antipython': (_) => const antipython.WebViewScreen(),
          '/app/pyblock': (_) => const PyBlocksWebview(),
          '/presentation': (_) => const powerpoint.PresentationWebViewScreen(),
          '/presentation_normal': (_) => const powerpoint_no_ai.PresentationNoAiWebViewScreen(),
          '/excel': (_) => const ExcelWebViewScreen(),
          '/word': (_) => const WordWebViewScreen(),
          '/app/html_learning': (_) => const HtmlLearningWebViewScreen(),
          '/app/paint': (_) => const PaintWebViewScreen(),
          '/app/keyboard_game': (_) => const KeyboardGameWebViewScreen(),
          '/app/powerpoint_app': (_) => const PowerPointAppWebViewScreen(),
          '/app/drone_block': (_) => const DroneBlockWebViewScreen(),
          '/app/emmi_core': (_) => const EmmiCoreWebViewScreen(),
          '/app/robot_workspace': (_) => const Scaffold(
                body: SafeArea(
                  child: Column(
                    children: [
                      TopBar(),
                      Expanded(child: BodyLayout()),
                    ],
                  ),
                ),
              ),
        },
        onUnknownRoute: (settings) {
          return MaterialPageRoute(
            builder: (context) => const UnknownRouteScreen(),
          );
        },
      ),
    );
  }
}

// ------------------------------------------------------------------
// SPLASH SCREEN
// ------------------------------------------------------------------
class RobotLaunchScreen extends StatefulWidget {
  const RobotLaunchScreen({super.key});

  @override
  State<RobotLaunchScreen> createState() => _RobotLaunchScreenState();
}

class _RobotLaunchScreenState extends State<RobotLaunchScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initializeApp());
  }

  Future<void> _initializeApp() async {
    // Start backend keep-alive pinger
    KeepAliveService().start();

    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // ✅ AUTO LOGOUT ONLY ON DESKTOP (Guard against Web crash)
    if (!kIsWeb) {
      bool isDesktop = false;
      try {
        isDesktop = Platform.isWindows || Platform.isMacOS;
      } catch (_) {}

      if (isDesktop) {
        await FirebaseAuth.instance.signOut();
      }
    }

    /*
    if (!kIsWeb && Platform.isWindows) {
      try {
        CameraWindows.registerWith();
      } catch (_) {}
    }
    */

    final prefs = await SharedPreferences.getInstance();
    final isActivated = prefs.getBool('is_activated') ?? false;

    if (!mounted) return;

    if (isActivated) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const AuthWrapper()),
      );
    } else {
      Navigator.pushReplacementNamed(context, '/activation');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

// ------------------------------------------------------------------
// AUTH WRAPPER (ROLE-BASED, SAFE)
// ------------------------------------------------------------------
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  Future<Widget> _resolveDashboard(User user) async {
    final snap = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .get();

    final role = snap.data()?['role']?.toString().trim().toLowerCase();

    if (role == 'admin') return const AdminDashboardScreen();
    if (role == 'teacher') return const TeacherDashboardScreen();
    return const StudentDashboardScreen();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, authSnap) {
        if (!authSnap.hasData) {
          return const LittleEmmiLoginScreen();
        }

        // 🔍 DEBUG: Print Firebase ID Token for Backend Testing
        authSnap.data!.getIdToken().then((token) {
          debugPrint(
              "\n👇👇👇 FIREBASE ID TOKEN (COPY THIS for Curl/Postman) 👇👇👇");
          debugPrint(token);
          debugPrint("👆👆👆 END TOKEN 👆👆👆\n");
        });

        return FutureBuilder<Widget>(
          future: _resolveDashboard(authSnap.data!),
          builder: (context, roleSnap) {
            if (roleSnap.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            return roleSnap.data!;
          },
        );
      },
    );
  }
}
