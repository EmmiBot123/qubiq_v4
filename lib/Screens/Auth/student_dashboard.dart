// lib/Screens/Auth/student_dashboard.dart

import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:path/path.dart' as p;
import 'dart:io' show Platform, Process;
// import 'package:provider/provider.dart';
// import 'package:little_emmi/Providers/api_key_provider.dart'; // REMOVED

import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';

// APP IMPORTS
import 'package:little_emmi/Screens/flowchart_ide_screen.dart';
import 'package:little_emmi/Screens/python_ide_screen.dart';
import 'package:little_emmi/Screens/inappwebview_screen.dart';
import 'package:little_emmi/Screens/MIT/mit_dashboard_screen.dart';
import 'package:little_emmi/Screens/ai_chat_screen.dart';
import 'package:little_emmi/Screens/ar_dashboard.dart';
import 'package:little_emmi/Screens/Auth/login_screen.dart';
import 'package:little_emmi/Screens/emmi_lite_screen.dart';
import 'package:little_emmi/Screens/GenAI/image_gen_screen.dart';
import 'package:little_emmi/Screens/GenAI/music_gen_screen.dart';
import 'package:little_emmi/Screens/qubiqaudio/main.dart' as qubiq_audio;
import 'package:little_emmi/Screens/Help/help_chat_screen.dart';
import 'package:little_emmi/Screens/adaptive_quiz_demo.dart';
import 'package:permission_handler/permission_handler.dart';

// Teachable Machine Local Screens
import 'package:little_emmi/Screens/teachable/teachable_image_screen.dart';
import 'package:little_emmi/Screens/teachable/teachable_audio_screen.dart';
import 'package:little_emmi/Screens/teachable/teachable_pose_screen.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen>
    with WidgetsBindingObserver {
  String _userName = "Student";
  String _studentClass =
      "Loading..."; // Starts as loading to prevent empty queries

  List<String>? _approvedApps; // ✅ Added to hold allowed apps


  Timer? _internetCheckTimer;
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchUserData();
    _requestCameraPermission();
    _internetCheckTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _verifyRealInternet();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _precacheAssets();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    bool isDesktop = false;
    try {
      if (!kIsWeb) {
        isDesktop = Platform.isWindows || Platform.isMacOS;
      }
    } catch (_) {}

    if (isDesktop && state == AppLifecycleState.detached) {
      FirebaseAuth.instance.signOut();
    }
  }

  void _precacheAssets() {
    final List<String> assets = [
      'assets/images/suno.png',
      'assets/images/chatai.png',
      'assets/images/imagegen.png',
      'assets/images/soundgen.png',
      'assets/images/word.png',
      'assets/images/ppt.png',
      'assets/images/excel.png',
    ];
    for (String path in assets) {
      precacheImage(AssetImage(path), context);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _internetCheckTimer?.cancel();
    super.dispose();
  }

  Future<void> _verifyRealInternet() async {
    try {
      if (kIsWeb) {
        var connectivityResult = await Connectivity().checkConnectivity();
        bool isConnected =
            connectivityResult.contains(ConnectivityResult.mobile) ||
                connectivityResult.contains(ConnectivityResult.wifi) ||
                connectivityResult.contains(ConnectivityResult.ethernet);

        if (isConnected) {
          if (_isOffline && mounted) setState(() => _isOffline = false);
        } else {
          if (!_isOffline && mounted) setState(() => _isOffline = true);
        }
        return;
      }

      final response = await http
          .get(Uri.parse('https://www.google.com'))
          .timeout(const Duration(seconds: 2));
      if (response.statusCode == 200) {
        if (_isOffline && mounted) setState(() => _isOffline = false);
      }
    } catch (e) {
      if (!_isOffline && mounted) setState(() => _isOffline = true);
    }
  }

  Future<void> _requestCameraPermission() async {
    if (kIsWeb) return;
    try {
      bool isWindows = false;
      if (!kIsWeb) {
        try {
          isWindows = Platform.isWindows;
        } catch (_) {}
      }
      if (isWindows) return;
    } catch (_) {}
    var status = await Permission.camera.status;
    if (status.isDenied) await Permission.camera.request();
    if (await Permission.camera.isPermanentlyDenied) openAppSettings();
  }

  Future<void> _launchEmmiV2App() async {
    if (kIsWeb) return;
    try {
      String appDirectory = '';
      if (!kIsWeb) {
        try {
          appDirectory = p.dirname(Platform.resolvedExecutable);
        } catch (_) {}
      }
      if (appDirectory.isNotEmpty) {
        await Process.start('EmmiV2.exe', [], workingDirectory: appDirectory);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text("Launch Error: EmmiV2.exe not found"),
            backgroundColor: Colors.red),
      );
    }
  }

  // ✅ FIXED: Normalizes "5-A" to "Class 5-A"
  Future<void> _fetchUserData() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      try {
        var doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();

        if (doc.exists && mounted) {
          final data = doc.data() as Map<String, dynamic>;

          setState(() {
            _userName = data['name'] ?? "Student";

            if (data.containsKey('class')) {
              String rawClass = data['class']; // e.g., "5-A"

              // 🔧 FIX: Check if "Class" is missing and add it
              if (!rawClass.trim().startsWith("Class")) {
                _studentClass = "Class $rawClass"; // Becomes "Class 5-A"
              } else {
                _studentClass = rawClass;
              }
              debugPrint("✅ Fixed Class Name for Query: $_studentClass");
            } else {
              _studentClass = "No Class Assigned";
            }
            if (data.containsKey('schoolId')) {
              final schoolId = data['schoolId'];
              debugPrint("🏫 Student School ID from Firestore: $schoolId");

              // ignore: use_build_context_synchronously
              if (mounted && schoolId != null) {
                // Keys are now handled via ProxyService
              } else {
                debugPrint("⚠️ School ID is null or widget not mounted");
              }
            } else {
              debugPrint("⚠️ No 'schoolId' field in user document.");
            }

            // Fetch approved apps for the class
            if (_studentClass != "No Class Assigned" && _studentClass != "Loading...") {
               _fetchApprovedApps();
            }
          });
        }
      } catch (e) {
        debugPrint("🔥 ERROR: $e");
      }
    }
  }

  Future<void> _fetchApprovedApps() async {
    try {
      final doc = await FirebaseFirestore.instance.collection('classes').doc(_studentClass).get();
      
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>?;
        if (data != null && data.containsKey('approvedApps')) {
           if (mounted) {
             setState(() {
                _approvedApps = List<String>.from(data['approvedApps']);
             });
           }
           return; 
        }
      }
      
      // Fallback if doc doesn't exist or doesn't have the field
      if (mounted) {
         setState(() {
            _approvedApps = []; // Explicitly empty 
         });
      }
    } catch (e) {
      debugPrint("Error fetching approved apps: $e");
    }
  }

  void _showComingSoon(BuildContext context, String featureName) {
    showDialog(
        context: context,
        builder: (context) => AlertDialog(
            title: const Text("Coming Soon"),
            content: Text("$featureName is under development.")));
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Shows the fixed class name so you can verify it matches the teacher's dashboard
          Text("Student Portal ($_studentClass)",
              style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: Colors.blueGrey[500],
                  fontWeight: FontWeight.w600)),
          Text("Welcome, $_userName",
              style: GoogleFonts.poppins(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Colors.blueGrey[900])),
        ]),
        IconButton(
          icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
          onPressed: () async {
            await FirebaseAuth.instance.signOut();
            if (context.mounted) {
              Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(
                      builder: (context) => const LittleEmmiLoginScreen()),
                  (route) => false);
            }
          },
        ),
      ],
    ).animate().fadeIn();
  }

  Widget _buildNoticeBoard() {
    // Wait for the class name to be fixed before querying
    if (_studentClass == "Loading..." || _studentClass == "No Class Assigned") {
      return const SizedBox.shrink();
    }

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('broadcasts')
          .where('className',
              isEqualTo: _studentClass) // Matches "Class 5-A" now!
          .orderBy('timestamp', descending: true)
          .limit(3)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          debugPrint("🔥 NOTICE ERROR: ${snapshot.error}");
          // If you still see this, check debug console for index link
          return const SizedBox.shrink();
        }

        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.campaign_rounded,
                    color: Colors.orangeAccent, size: 24),
                const SizedBox(width: 8),
                Text("Notice Board",
                    style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.blueGrey[800])),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 140,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: snapshot.data!.docs.length,
                itemBuilder: (context, index) {
                  var doc = snapshot.data!.docs[index];
                  var data = doc.data() as Map<String, dynamic>;
                  String title = data['title'] ?? 'Notice';
                  String message = data['message'] ?? 'No details provided.';
                  String teacher = data['teacherName'] ?? 'Teacher';

                  return Container(
                    width: 280,
                    margin: const EdgeInsets.only(right: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                          colors: [Color(0xFFFFF8E1), Color(0xFFFFECB3)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                          color: Colors.orangeAccent.withOpacity(0.3)),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.orange.withOpacity(0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 4))
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                                child: Text(title,
                                    style: GoogleFonts.poppins(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        color: Colors.brown[800]),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis)),
                            Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8)),
                                child: Text("NEW",
                                    style: GoogleFonts.poppins(
                                        fontSize: 8,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.red)))
                          ],
                        ),
                        const SizedBox(height: 8),
                        Expanded(
                            child: Text(message,
                                style: GoogleFonts.poppins(
                                    fontSize: 12, color: Colors.brown[600]),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis)),
                        const SizedBox(height: 8),
                        Row(children: [
                          const Icon(Icons.person_outline,
                              size: 12, color: Colors.brown),
                          const SizedBox(width: 4),
                          Text(teacher,
                              style: GoogleFonts.poppins(
                                  fontSize: 10,
                                  fontStyle: FontStyle.italic,
                                  color: Colors.brown))
                        ]),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 30),
          ],
        ).animate().fadeIn().slideX();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 800;

    // 1. Generative AI
    final List<DashboardItem> generativeAIApps = [
      DashboardItem(
          title: 'Qubiq Music',
          subtitle: 'Music Generation',
          imagePath: 'assets/images/qubiq_music.png',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const qubiq_audio.WebViewScreen()))),
      DashboardItem(
          title: 'Neural Chat',
          subtitle: 'QubiQAI Assistant',
          imagePath: 'assets/images/chatai.png',
          onTap: () => Navigator.push(context,
              MaterialPageRoute(builder: (context) => const AiChatScreen()))),
      DashboardItem(
          title: 'Sonic Lab',
          subtitle: 'Sound Effect Generator',
          imagePath: 'assets/images/soundgen.png',
          onTap: () => Navigator.push(context,
              MaterialPageRoute(builder: (context) => const MusicGenScreen()))),
      DashboardItem(
          title: 'Vision Forge',
          subtitle: 'Image Generation',
          imagePath: 'assets/images/imagegen.png',
          onTap: () => Navigator.push(context,
              MaterialPageRoute(builder: (context) => const ImageGenScreen()))),
    ];

    // 2. Office Tools
    final List<DashboardItem> officeToolsApps = [
      DashboardItem(
          title: 'Word',
          subtitle: 'Documents',
          imagePath: 'assets/images/word.png',
          onTap: () => Navigator.pushNamed(context, '/word')),
      DashboardItem(
          title: 'PowerPoint',
          subtitle: 'Create Slides',
          imagePath: 'assets/images/ppt.png',
          onTap: () => Navigator.pushNamed(context, '/app/powerpoint_app')),
      DashboardItem(
          title: 'Excel',
          subtitle: 'Spreadsheets',
          imagePath: 'assets/images/excel.png',
          onTap: () => Navigator.pushNamed(context, '/excel')),
    ];

    // 3. AI Powered Office Tools
    final List<DashboardItem> aiOfficeToolsApps = [
      DashboardItem(
          title: 'AI Word',
          subtitle: 'Coming Soon',
          imagePath: 'assets/images/word.png',
          onTap: () => _showComingSoon(context, "AI Powered Word")),
      DashboardItem(
          title: 'AI PowerPoint',
          subtitle: 'Create AI Slides',
          imagePath: 'assets/images/ppt.png',
          onTap: () => Navigator.pushNamed(context, '/presentation')),
      DashboardItem(
          title: 'AI Excel',
          subtitle: 'Coming Soon',
          imagePath: 'assets/images/excel.png',
          onTap: () => _showComingSoon(context, "AI Powered Excel")),
    ];

    // 4. Python
    final List<DashboardItem> pythonApps = [
      DashboardItem(
          title: 'Python IDE',
          subtitle: 'Code Editor',
          imagePath: 'assets/images/python.jpg',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const PythonIdeScreen()))),
      DashboardItem(
          title: 'Block Python',
          subtitle: 'Visual Python',
          icon: Icons.extension,
          iconColor: Colors.purpleAccent,
          onTap: () => Navigator.pushNamed(context, '/app/pyblock')),
      DashboardItem(
          title: 'Vibe Python',
          subtitle: 'Web Sandbox',
          icon: Icons.security,
          iconColor: Colors.redAccent,
          onTap: () => Navigator.pushNamed(context, '/app/antipython')),
    ];

    // 5. Java
    final List<DashboardItem> javaApps = [
      DashboardItem(
          title: 'Java IDE',
          subtitle: 'Coming Soon',
          imagePath: 'assets/images/java.jpg',
          onTap: () => _showComingSoon(context, "Professional Java IDE")),
      DashboardItem(
          title: 'Block Java',
          subtitle: 'Visual Java',
          imagePath: 'assets/images/javaflownobg.png',
          onTap: () => _showComingSoon(context, "Flowchart Java")),
      DashboardItem(
          title: 'Vibe Java',
          subtitle: 'Coming Soon',
          imagePath: 'assets/images/java.jpg',
          onTap: () => _showComingSoon(context, "Vibe Java Sandbox")),
    ];

    // 6. Robotics Tools
    final List<DashboardItem> roboticsApps = [
      DashboardItem(
          title: 'Emmi Lite',
          subtitle: 'Block-Based Robot Coding',
          imagePath: 'assets/images/emmi.png',
          onTap: () => Navigator.push(context,
              MaterialPageRoute(builder: (context) => const EmmiLiteScreen()))),
      DashboardItem(
          title: 'Emmi Vibe Coding',
          subtitle: 'Web Interface',
          imagePath: 'assets/images/emmi_vibe.png',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const InAppWebViewScreen(
                      url: 'https://staging.d1atsf4l0agpui.amplifyapp.com/',
                      title: 'Emmi Vibe')))),
      DashboardItem(
          title: 'Emmi Core',
          subtitle: 'Robot Manager',
          imagePath: 'assets/images/emmi.png',
          onTap: () => Navigator.pushNamed(context, '/app/emmi_core')),
      DashboardItem(
          title: 'Little Emmi',
          subtitle: 'Robot Learning',
          imagePath: 'assets/images/littleemmi.png',
          onTap: () => Navigator.pushNamed(context, '/app/robot_workspace')),
      DashboardItem(
          title: 'Drone Tuning',
          subtitle: 'Block Coding',
          icon: Icons.flight_takeoff,
          iconColor: Colors.lightGreen,
          onTap: () => Navigator.pushNamed(context, '/app/drone_block')),
      DashboardItem(
          title: 'Drone Block Coding',
          subtitle: 'AeroBlock IDE',
          icon: Icons.code,
          iconColor: Colors.cyan,
          onTap: () => Navigator.pushNamed(context, '/app/drone_block')),
    ];

    // 7. AI Training Tools
    final List<DashboardItem> aiTrainingApps = [
      DashboardItem(
          title: 'Image Recognition',
          subtitle: 'Object Training',
          imagePath: 'assets/images/imgnobgnew.png',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const TeachableImageScreen()))),
      DashboardItem(
          title: 'Voice Recognition',
          subtitle: 'Sound Training',
          imagePath: 'assets/images/soundmachinenobg.png',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const TeachableAudioScreen()))),
      DashboardItem(
          title: 'Pose Training',
          subtitle: 'Body Tracking',
          imagePath: 'assets/images/posemodelnobg.png',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const TeachablePoseScreen()))),
    ];

    // 8. Mobile App Development
    final List<DashboardItem> mobileApps = [
      DashboardItem(
          title: 'Qubiq Studio',
          subtitle: 'MIT Blocks',
          imagePath: 'assets/images/mitnobg.png',
          onTap: () => Navigator.pushNamed(context, '/mit/mobile_inventor')),
    ];

    // 9. Adaptive Learning
    final List<DashboardItem> adaptiveApps = [
      DashboardItem(
          title: 'English',
          subtitle: 'Grammar & Vocab',
          icon: Icons.menu_book,
          iconColor: Colors.pink,
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) =>
                      const AdaptiveQuizScreen(subject: "English")))),
      DashboardItem(
          title: "Math's", // Spelled "Math's" explicitly per user request
          subtitle: 'Level 1-3',
          icon: Icons.calculate,
          iconColor: Colors.orange,
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) =>
                      const AdaptiveQuizScreen(subject: "Maths")))),
      DashboardItem(
          title: 'IT',
          subtitle: 'Tech & Computers',
          icon: Icons.computer,
          iconColor: Colors.grey,
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) =>
                      const AdaptiveQuizScreen(subject: "IT")))),
      DashboardItem(
          title: 'Social Science',
          subtitle: 'History & Civics',
          icon: Icons.public,
          iconColor: Colors.teal,
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) =>
                      const AdaptiveQuizScreen(subject: "Social Science")))),
      DashboardItem(
          title: 'Science',
          subtitle: 'Nature & Physics',
          icon: Icons.science,
          iconColor: Colors.green,
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) =>
                      const AdaptiveQuizScreen(subject: "Science")))),
    ];

    // 10. AR Tools
    final List<DashboardItem> arApps = [
      DashboardItem(
          title: 'AR Studio',
          subtitle: '3D Exploration',
          imagePath: 'assets/images/ar.png',
          onTap: () => Navigator.push(
              context, MaterialPageRoute(builder: (context) => ARDashboard()))),
    ];

    // 11. Games
    final List<DashboardItem> gamesApps = [
      DashboardItem(
          title: 'Paint',
          subtitle: 'KidsPaint Studio',
          icon: Icons.brush,
          iconColor: Colors.pinkAccent,
          onTap: () => Navigator.pushNamed(context, '/app/paint')),
      DashboardItem(
          title: 'Keyboard Game',
          subtitle: 'Balloon Pop Typing',
          icon: Icons.keyboard,
          iconColor: Colors.purple,
          onTap: () => Navigator.pushNamed(context, '/app/keyboard_game')),
    ];

    // 12. Web Dev Learning
    final List<DashboardItem> webDevApps = [
      DashboardItem(
          title: 'HTML Learning',
          subtitle: 'HTML/CSS Lab',
          icon: Icons.code,
          iconColor: Colors.deepOrange,
          onTap: () => Navigator.pushNamed(context, '/app/html_learning')),
    ];

    final List<_CategoryTile> categories = [
      _CategoryTile(
          name: "1. Generative AI",
          color: Colors.blue,
          items: generativeAIApps),
      _CategoryTile(
          name: "2. Office Tools",
          color: Colors.indigo,
          items: officeToolsApps),
      _CategoryTile(
          name: "3. AI Powered Office Tools",
          color: Colors.cyan,
          items: aiOfficeToolsApps),
      _CategoryTile(name: "4. Python", color: Colors.amber, items: pythonApps),
      _CategoryTile(name: "5. Java", color: Colors.deepOrange, items: javaApps),
      _CategoryTile(
          name: "6. Robotics Tools", color: Colors.teal, items: roboticsApps),
      _CategoryTile(
          name: "7. AI Training Tools",
          color: Colors.orange,
          items: aiTrainingApps),
      _CategoryTile(
          name: "8. Mobile App Development",
          color: Colors.green,
          items: mobileApps),
      _CategoryTile(
          name: "9. Adaptive Learning",
          color: Colors.deepPurpleAccent,
          items: adaptiveApps),
      _CategoryTile(
          name: "10. AR Tools", color: Colors.pinkAccent, items: arApps),
      _CategoryTile(
          name: "11. Games", color: Colors.lime, items: gamesApps),
      _CategoryTile(
          name: "12. Web Dev Learning", color: Colors.lightBlue, items: webDevApps),
    ];

    // Filter categories based on approved apps
    final List<_CategoryTile> filteredCategories = _approvedApps == null
        ? categories // If null, we haven't loaded permissions yet (show all or hide all depending on preference, currently hiding all below via loading check)
        : categories.map((cat) {
            final allowedItems = cat.items.where((app) => _approvedApps!.contains(app.title)).toList();
            return _CategoryTile(name: cat.name, color: cat.color, items: allowedItems);
          }).where((cat) => cat.items.isNotEmpty).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context,
            MaterialPageRoute(builder: (context) => const HelpChatScreen())),
        backgroundColor: Colors.deepPurple,
        icon: const Icon(Icons.support_agent_rounded, color: Colors.white),
        label: const Text("Help AI",
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: Stack(
        children: [
          const Positioned.fill(child: PastelAnimatedBackground()),
          SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(isMobile ? 16 : 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 30),
                  if (isMobile)
                    Column(children: [
                      _buildGlassProgressCard(),
                      const SizedBox(height: 16),
                      _buildStatsGrid(isMobile)
                    ])
                  else
                    Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(flex: 3, child: _buildGlassProgressCard()),
                          const SizedBox(width: 20),
                          Expanded(flex: 5, child: _buildStatsGrid(isMobile))
                        ]),

                  const SizedBox(height: 30),
                  _buildNoticeBoard(),

                  Text("Experiments",
                      style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.blueGrey[800])),
                  const SizedBox(height: 16),

                  // ✅ FIXED EXPERIMENTS LIST
                  _buildExperimentsList(),

                  const SizedBox(height: 30),
                  
                  if (_approvedApps == null)
                     const Padding(
                       padding: EdgeInsets.all(40.0),
                       child: Center(child: CircularProgressIndicator()),
                     )
                  else if (filteredCategories.isEmpty)
                     Padding(
                       padding: const EdgeInsets.all(40.0),
                       child: Center(
                         child: Text("No apps have been approved for $_studentClass yet.", 
                           style: GoogleFonts.poppins(color: Colors.grey, fontSize: 16)),
                       ),
                     )
                  else
                     ...filteredCategories.map(
                         (category) => _buildCategorySection(category, isMobile)),
                         
                  const SizedBox(height: 60),
                ],
              ),
            ),
          ),
          _buildOfflineBanner(),
        ],
      ),
    );
  }

  Widget _buildExperimentsList() {
    if (_studentClass == "Loading..." || _studentClass == "No Class Assigned") {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Text("Waiting for class data: $_studentClass",
              style: const TextStyle(color: Colors.grey)),
        ),
      );
    }

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('assignments')
          .where('className', isEqualTo: _studentClass) // e.g. "Class 5-A"
          .orderBy('dueDate', descending: false)
          .snapshots(),
      builder: (context, snapshot) {
        // 🛑 DEBUG: Catch Database Index Errors
        if (snapshot.hasError) {
          debugPrint("🔥 EXPERIMENTS ERROR: ${snapshot.error}");
          return Container(
            padding: const EdgeInsets.all(12),
            color: Colors.red[50],
            child: Column(
              children: [
                const Text("Database Error",
                    style: TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.red)),
                const Text(
                    "Check your IDE Debug Console to create the missing index!",
                    style: TextStyle(fontSize: 10)),
              ],
            ),
          );
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return Center(
            child: Column(
              children: [
                const SizedBox(height: 20),
                Icon(Icons.assignment_turned_in_outlined,
                    size: 40, color: Colors.grey[300]),
                const SizedBox(height: 10),
                Text("No tasks found for: '$_studentClass'",
                    style: GoogleFonts.poppins(color: Colors.grey)),
              ],
            ),
          );
        }

        return ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: snapshot.data!.docs.length,
            itemBuilder: (context, index) {
              var doc = snapshot.data!.docs[index];
              return _buildRealProjectTile(
                  context, doc.data() as Map<String, dynamic>, doc.id);
            });
      },
    );
  }

  // --- HELPERS ---
  Widget _buildRealProjectTile(
      BuildContext context, Map<String, dynamic> data, String docId) {
    String tool = data['tool'] ?? 'General';
    DateTime? dueDate = data['dueDate'] != null
        ? (data['dueDate'] as Timestamp).toDate()
        : null;
    Color accentColor = tool.contains('Python')
        ? Colors.amber.shade700
        : tool.contains('Flowchart')
            ? Colors.orange
            : tool.contains('Emmi')
                ? Colors.teal
                : (tool.contains('AR') || tool.contains('3D'))
                    ? Colors.pinkAccent
                    : Colors.blue;
    return GestureDetector(
      onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) =>
                  AssignmentDetailScreen(assignmentData: data, docId: docId))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.6),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white)),
        child: Row(children: [
          Container(
              height: 40,
              width: 4,
              decoration: BoxDecoration(
                  color: accentColor, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 16),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(data['title'] ?? 'Untitled',
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        color: Colors.blueGrey[800],
                        fontSize: 15)),
                Text(
                    dueDate != null
                        ? "Due: ${DateFormat('MMM dd').format(dueDate)}"
                        : "No Due Date",
                    style: GoogleFonts.poppins(
                        color: Colors.blueGrey[400], fontSize: 12))
              ])),
          Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8)),
              child: Text("Start >",
                  style: GoogleFonts.poppins(
                      color: accentColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12)))
        ]),
      ),
    ).animate().fadeIn().slideX();
  }

  Widget _buildCategorySection(_CategoryTile category, bool isMobile) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
          padding: const EdgeInsets.only(left: 4.0, bottom: 16.0),
          child: Row(children: [
            Container(
                width: 4,
                height: 24,
                decoration: BoxDecoration(
                    color: category.color,
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 10),
            Text(category.name,
                style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blueGrey[800]))
          ])),
      GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isMobile ? 4 : 7,
              crossAxisSpacing: 10,
              mainAxisSpacing: 16,
              childAspectRatio: 0.75),
          itemCount: category.items.length,
          itemBuilder: (context, index) =>
              _ImageAppCard(item: category.items[index])),
      const SizedBox(height: 24)
    ]);
  }

  Widget _buildOfflineBanner() {
    return Positioned(
        bottom: 24,
        right: 24,
        child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            child: _isOffline
                ? Container(
                    width: 300,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                        color: Colors.redAccent.withOpacity(0.95),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.redAccent.withOpacity(0.3),
                              blurRadius: 20)
                        ]),
                    child: Row(children: [
                      const Icon(Icons.wifi_off_rounded, color: Colors.white),
                      const SizedBox(width: 12),
                      Expanded(
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                            Text("Offline Mode",
                                style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14)),
                            Text("Using local cached data.",
                                style: GoogleFonts.poppins(
                                    color: Colors.white.withOpacity(0.9),
                                    fontSize: 11))
                          ]))
                    ]))
                : const SizedBox.shrink()));
  }

  Widget _buildGlassProgressCard() {
    return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.7),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white, width: 2)),
        child: Column(children: [
          CircularPercentIndicator(
              radius: 45.0,
              lineWidth: 8.0,
              percent: 0.75,
              center: const Text("75%"),
              progressColor: Colors.indigoAccent),
          const SizedBox(height: 12),
          Text("Weekly Progress",
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold))
        ]));
  }

  Widget _buildStatsGrid(bool isMobile) {
    return GridView.count(
        crossAxisCount: isMobile ? 2 : 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          _buildStatTile("Projects", "12", Icons.folder_outlined, Colors.blue),
          _buildStatTile(
              "Tests", "5/6", Icons.assignment_outlined, Colors.green),
          _buildStatTile("Pending", "2", Icons.hourglass_empty, Colors.orange),
          _buildStatTile(
              "Rank", "#4", Icons.emoji_events_outlined, Colors.purple)
        ]);
  }

  Widget _buildStatTile(
      String title, String value, IconData icon, Color color) {
    return Container(
        decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.8),
            borderRadius: BorderRadius.circular(16)),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 20),
          Text(value,
              style: GoogleFonts.poppins(
                  fontSize: 18, fontWeight: FontWeight.bold)),
          Text(title,
              style: GoogleFonts.poppins(
                  fontSize: 11, color: Colors.blueGrey[500]))
        ]));
  }
}

class AssignmentDetailScreen extends StatelessWidget {
  final Map<String, dynamic> assignmentData;
  final String docId;
  const AssignmentDetailScreen(
      {super.key, required this.assignmentData, required this.docId});
  void _showInfoPopup(BuildContext context, String title, String message) {
    showDialog(
        context: context,
        builder: (context) => Center(
            child: Container(
                width: MediaQuery.of(context).size.width * 0.8,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(color: Colors.black26, blurRadius: 20)
                    ]),
                child: Material(
                    color: Colors.transparent,
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.info_outline_rounded,
                          color: Colors.indigo, size: 48),
                      const SizedBox(height: 16),
                      Text(title,
                          style: GoogleFonts.poppins(
                              fontSize: 20, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Text(message,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 14)),
                      const SizedBox(height: 24),
                      ElevatedButton(
                          onPressed: () => Navigator.pop(context),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.indigo,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12))),
                          child: const Text("OK",
                              style: TextStyle(color: Colors.white)))
                    ])))).animate().scale().fadeIn());
  }

  void _launchAssignedTool(BuildContext context, String toolName) {
    if (toolName.contains("Python")) {
      Navigator.push(context,
          MaterialPageRoute(builder: (context) => const PythonIdeScreen()));
    } else if (toolName.contains("Flowchart"))
      Navigator.push(context,
          MaterialPageRoute(builder: (context) => const FlowchartIdeScreen()));
    else if (toolName.contains("App Inventor") || toolName.contains("Mobile"))
      Navigator.push(context,
          MaterialPageRoute(builder: (context) => const MitDashboardScreen()));
    else if (toolName.contains("Little Emmi"))
      Navigator.pushNamed(context, '/app/robot_workspace');
    else if (toolName.contains("AR") || toolName.contains("3D"))
      Navigator.push(
          context, MaterialPageRoute(builder: (context) => ARDashboard()));
    else if (toolName.contains("Vision") || toolName.contains("Image"))
      Navigator.push(context,
          MaterialPageRoute(builder: (context) => const ImageGenScreen()));
    else if (toolName.contains("Sonic") || toolName.contains("Sound"))
      Navigator.push(context,
          MaterialPageRoute(builder: (context) => const MusicGenScreen()));
    else
      _showInfoPopup(context, "Manual Start Required",
          "The tool '$toolName' is not integrated for auto-launch.");
  }

  @override
  Widget build(BuildContext context) {
    String tool = assignmentData['tool'] ?? 'None';
    DateTime? dueDate = assignmentData['dueDate'] != null
        ? (assignmentData['dueDate'] as Timestamp).toDate()
        : null;
    return Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
            title: Text("Assignment Details",
                style: GoogleFonts.poppins(
                    color: Colors.black, fontWeight: FontWeight.bold)),
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: const BackButton(color: Colors.black)),
        body: Padding(
            padding: const EdgeInsets.all(24.0),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                  padding: const EdgeInsets.all(24),
                  width: double.infinity,
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 15)
                      ]),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                  color: Colors.indigo.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8)),
                              child: Text(tool,
                                  style: GoogleFonts.poppins(
                                      color: Colors.indigo,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12))),
                          const Spacer(),
                          Icon(Icons.access_time,
                              size: 16, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                              dueDate != null
                                  ? DateFormat('MMM dd, hh:mm a')
                                      .format(dueDate)
                                  : "No Due Date",
                              style: GoogleFonts.poppins(
                                  color: Colors.grey[600], fontSize: 12))
                        ]),
                        const SizedBox(height: 16),
                        Text(assignmentData['title'] ?? 'Assignment',
                            style: GoogleFonts.poppins(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.blueGrey[900])),
                        const SizedBox(height: 8),
                        Text(
                            "Assigned by ${assignmentData['teacherName'] ?? 'Teacher'}",
                            style: GoogleFonts.poppins(
                                fontSize: 14, color: Colors.blueGrey[500]))
                      ])),
              const SizedBox(height: 24),
              Text("Instructions",
                  style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.blueGrey[800])),
              const SizedBox(height: 12),
              Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200)),
                  child: Text(
                      assignmentData['description'] ?? 'No instructions.',
                      style: GoogleFonts.poppins(
                          fontSize: 15,
                          color: Colors.blueGrey[700],
                          height: 1.6))),
              const Spacer(),
              SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                      onPressed: () => _launchAssignedTool(context, tool),
                      icon:
                          const Icon(Icons.rocket_launch, color: Colors.white),
                      label: Text("Launch $tool",
                          style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigoAccent,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                          elevation: 4)))
            ])));
  }
}

class _CategoryTile {
  final String name;
  final Color color;
  final List<DashboardItem> items;
  _CategoryTile({required this.name, required this.color, required this.items});
}

class _ImageAppCard extends StatelessWidget {
  final DashboardItem item;
  const _ImageAppCard({required this.item});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
        onTap: item.onTap,
        child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 3))
                ]),
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                      child: Container(
                          padding: EdgeInsets.all(item.icon != null ? 20 : 34),
                          decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              color: Colors.white),
                          child: item.icon != null
                              ? Center(
                                  child: Icon(item.icon,
                                      size: 40,
                                      color: item.iconColor ?? Colors.blue))
                              : (item.imagePath != null
                                  ? Image.asset(item.imagePath!,
                                      fit: BoxFit.contain,
                                      errorBuilder: (context, error,
                                              stackTrace) =>
                                          const Icon(Icons.broken_image_rounded,
                                              size: 30, color: Colors.grey))
                                  : const Icon(Icons.broken_image_rounded,
                                      size: 30, color: Colors.grey)))),
                  const SizedBox(height: 8),
                  Text(item.title,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.blueGrey[900]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(item.subtitle,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                          fontSize: 9, color: Colors.blueGrey[400]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis)
                ])));
  }
}

class DashboardItem {
  final String title;
  final String subtitle;
  final String? imagePath;
  final IconData? icon;
  final Color? iconColor;
  final VoidCallback onTap;
  DashboardItem(
      {required this.title,
      required this.subtitle,
      this.imagePath,
      this.icon,
      this.iconColor,
      required this.onTap});
}

class PastelAnimatedBackground extends StatelessWidget {
  const PastelAnimatedBackground({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(color: Colors.white);
  }
}
