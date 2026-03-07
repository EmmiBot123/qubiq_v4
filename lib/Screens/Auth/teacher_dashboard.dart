import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dotted_border/dotted_border.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:little_emmi/Services/cloudinary_service.dart';
import 'package:little_emmi/Screens/Dashboard/dashboard_screen.dart';

// ✅ IMPORT THE LOGIN SCREEN (Adjust path if needed)
import 'package:little_emmi/Screens/Auth/login_screen.dart';

class TeacherDashboardScreen extends StatefulWidget {
  const TeacherDashboardScreen({super.key});

  @override
  State<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen> {
  String _teacherName = "Teacher";
  String _teacherSchoolId = "";
  bool _isUploading = false;
  File? _selectedImageFile;
  final CloudinaryService _cloudinary = CloudinaryService();

  // 🎓 Dynamic Classes State
  List<String> _classes = [];
  bool _isLoadingClasses = true;
  int _selectedClassIndex = 0;

  // 📢 BROADCAST STATE
  final TextEditingController _noticeTitleController = TextEditingController();
  final TextEditingController _noticeMessageController =
      TextEditingController();
  bool _isSendingNotice = false;

  final List<DashboardItem> _availableTools = [
    DashboardItem(
        title: 'Little Emmi',
        subtitle: '',
        icon: Icons.child_care_outlined,
        accentColor: Colors.teal,
        onTap: () {}),
    DashboardItem(
        title: 'Python IDE',
        subtitle: '',
        icon: Icons.code_outlined,
        accentColor: Colors.amber.shade700,
        onTap: () {}),
    DashboardItem(
        title: 'Flowchart',
        subtitle: '',
        icon: Icons.account_tree_outlined,
        accentColor: Colors.orange,
        onTap: () {}),
    DashboardItem(
        title: 'MIT App Inventor',
        subtitle: '',
        icon: Icons.extension_outlined,
        accentColor: Colors.green,
        onTap: () {}),
    DashboardItem(
        title: 'Office Suite',
        subtitle: '',
        icon: Icons.grid_view_rounded,
        accentColor: Colors.indigo,
        onTap: () {}),
    DashboardItem(
        title: 'Custom / Paper',
        subtitle: '',
        icon: Icons.edit_document,
        accentColor: Colors.pinkAccent,
        onTap: () {}),
  ];

  DashboardItem? _selectedToolForProject;
  final TextEditingController _projectTitleController = TextEditingController();
  final TextEditingController _projectDescController = TextEditingController();
  final TextEditingController _hintTextController = TextEditingController();

  DateTime? _selectedDueDate;
  String _hintType = 'none'; // 'none', 'text', 'image'

  // ✅ APP ACCESS CHECKLIST
  final List<String> _allAvailableApps = [
    'Qubiq Music', 'Neural Chat', 'Sonic Lab', 'Vision Forge',
    'Word', 'PowerPoint', 'Excel',
    'AI Word', 'AI PowerPoint', 'AI Excel',
    'Python IDE', 'Block Python', 'Vibe Python',
    'Java IDE', 'Block Java', 'Vibe Java',
    'Emmi Lite', 'Emmi Vibe Coding', 'Emmi Core', 'Little Emmi', 'Drone Tuning',
    'Image Recognition', 'Voice Recognition', 'Pose Training',
    'Qubiq Studio',
    'English', "Math's", 'IT', 'Social Science', 'Science',
    'AR Studio',
    'HTML Learning', 'Paint', 'Keyboard Game', 'PowerPoint App', 'Drone Block Coding', 'Emmi Core'
  ];
  List<String> _allowedAppsForCurrentClass = [];
  bool _isLoadingAppPermissions = false;

  @override
  void initState() {
    super.initState();
    _fetchTeacherDetails();
  }

  Future<void> _fetchTeacherDetails() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      try {
        final doc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get();
        if (doc.exists) {
          Map<String, dynamic> data = doc.data()!;
          setState(() {
            _teacherName = data['name'] ?? "Teacher";
            _teacherSchoolId = data['schoolId'] ?? "";
            if (data['assignedClasses'] != null) {
              _classes = List<String>.from(data['assignedClasses']);
            } else {
              _classes = [];
            }
            _isLoadingClasses = false;
          });
          
          if (_classes.isNotEmpty) {
             _fetchAppPermissions();
          }
        }
      } catch (e) {
        debugPrint("Error fetching teacher details: $e");
        setState(() => _isLoadingClasses = false);
      }
    }
  }

  // --- FIXED DATE PICKER LOGIC ---
  Future<void> _pickDateTime() async {
    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (pickedDate != null) {
      if (!mounted) return;
      final TimeOfDay? pickedTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );

      if (pickedTime != null) {
        setState(() {
          _selectedDueDate = DateTime(
            pickedDate.year,
            pickedDate.month,
            pickedDate.day,
            pickedTime.hour,
            pickedTime.minute,
          );
        });
      }
    }
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: ImageSource.gallery);
      if (pickedFile != null)
        setState(() => _selectedImageFile = File(pickedFile.path));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text("Gallery Error: $e"), backgroundColor: Colors.red));
    }
  }

  // --- FETCH & SAVE CLASS APP PERMISSIONS ---
  Future<void> _fetchAppPermissions() async {
     if (_classes.isEmpty) return;
     setState(() {
       _isLoadingAppPermissions = true;
       _allowedAppsForCurrentClass = [];
     });
     
     String selectedClass = _classes[_selectedClassIndex];
     
     // 🔧 FIX: Normalize class name to match Student Dashboard query pattern (e.g. "Class 5-A")
     if (!selectedClass.trim().startsWith("Class")) {
       selectedClass = "Class $selectedClass";
     }
     
     try {
       final doc = await FirebaseFirestore.instance.collection('classes').doc(selectedClass).get();
       
       if (doc.exists && doc.data()!.containsKey('approvedApps')) {
          setState(() {
            _allowedAppsForCurrentClass = List<String>.from(doc.data()!['approvedApps']);
          });
       } else {
          // If no explicitly approved apps, default to empty list (none accessible)
          setState(() {
            _allowedAppsForCurrentClass = [];
          });
       }
     } catch (e) {
       debugPrint("Error fetching app permissions: $e");
     } finally {
       if (mounted) {
         setState(() => _isLoadingAppPermissions = false);
       }
     }
  }

  void _toggleAppPermission(String appName, bool isAllowed) {
    setState(() {
       if (isAllowed) {
         if (!_allowedAppsForCurrentClass.contains(appName)) _allowedAppsForCurrentClass.add(appName);
       } else {
         _allowedAppsForCurrentClass.remove(appName);
       }
    });
  }

  Future<void> _saveAppPermissions() async {
    if (_classes.isEmpty) return;
    String selectedClass = _classes[_selectedClassIndex];
    
    // 🔧 FIX: Normalize class name to match Student Dashboard query pattern (e.g. "Class 5-A")
    if (!selectedClass.trim().startsWith("Class")) {
      selectedClass = "Class $selectedClass";
    }
    
    // Show a small loading indicator or temporary disablement via state if desired.
    // For simplicity, we just execute and show a SnackBar on success.
    try {
      await FirebaseFirestore.instance.collection('classes').doc(selectedClass).set({
         'approvedApps': _allowedAppsForCurrentClass,
         'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Permissions saved successfully!"), backgroundColor: Colors.green));
      }
    } catch (e) {
      debugPrint("Error saving permissions: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Error updating app permissions"), backgroundColor: Colors.red));
      }
    }
  }

  void _handleAppDrop(DashboardItem item) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(children: [
          const Icon(Icons.post_add_rounded, color: Colors.deepPurple),
          const SizedBox(width: 10),
          Text("Assign ${item.title}?",
              style: GoogleFonts.poppins(
                  fontSize: 18, fontWeight: FontWeight.bold)),
        ]),
        content: Text(
          "Do you want to create a new task for students using '${item.title}'?",
          style: GoogleFonts.poppins(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child:
                Text("Cancel", style: GoogleFonts.poppins(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepPurple,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              setState(() => _selectedToolForProject = item);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text("Selected ${item.title} for assignment"),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: Text("Confirm",
                style: GoogleFonts.poppins(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // 📢 SEND BROADCAST FUNCTION
  Future<void> _sendBroadcast() async {
    if (_noticeTitleController.text.isEmpty ||
        _noticeMessageController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Please fill in Title and Message!")));
      return;
    }

    setState(() => _isSendingNotice = true);

    try {
      await FirebaseFirestore.instance.collection('broadcasts').add({
        'title': _noticeTitleController.text.trim(),
        'message': _noticeMessageController.text.trim(),
        'className': _classes[_selectedClassIndex],
        'teacherName': _teacherName,
        'schoolId': _teacherSchoolId,
        'timestamp': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text("Notice sent to ${_classes[_selectedClassIndex]}!"),
            backgroundColor: Colors.orangeAccent));
        setState(() {
          _noticeTitleController.clear();
          _noticeMessageController.clear();
          _isSendingNotice = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSendingNotice = false);
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _createProject() async {
    if (_projectTitleController.text.isEmpty ||
        _selectedToolForProject == null ||
        _selectedDueDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text("Please fill in Title, Tool, and Due Date!")));
      return;
    }
    setState(() => _isUploading = true);
    try {
      String? imageUrl;
      if (_hintType == 'image' && _selectedImageFile != null) {
        imageUrl = await _cloudinary.uploadImage(_selectedImageFile!);
      }

      await FirebaseFirestore.instance.collection('assignments').add({
        'title': _projectTitleController.text.trim(),
        'description': _projectDescController.text.trim(),
        'tool': _selectedToolForProject!.title,
        'className': _classes[_selectedClassIndex],
        'schoolId': _teacherSchoolId,
        'dueDate': Timestamp.fromDate(_selectedDueDate!),
        'createdAt': FieldValue.serverTimestamp(),
        'teacherName': _teacherName,
        'hintType': _hintType,
        'hintContent': _hintType == 'text'
            ? _hintTextController.text.trim()
            : (imageUrl ?? ''),
        'status': 'active',
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(
                "Assignment uploaded for ${_classes[_selectedClassIndex]}!"),
            backgroundColor: Colors.green));
        setState(() {
          _projectTitleController.clear();
          _projectDescController.clear();
          _hintTextController.clear();
          _selectedToolForProject = null;
          _selectedDueDate = null;
          _selectedImageFile = null;
          _hintType = 'none';
          _isUploading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red));
      }
    }
  }

  // --- 📋 MARK ATTENDANCE ---
  Future<void> _showMarkAttendanceDialog() async {
    if (_classes.isEmpty) return;
    final selectedClass = _classes[_selectedClassIndex];

    // Fetch students for this class
    final studentsSnap = await FirebaseFirestore.instance
        .collection('users')
        .where('role', isEqualTo: 'student')
        .where('class', isEqualTo: selectedClass)
        .get();

    if (studentsSnap.docs.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("No students found in this class.")));
      }
      return;
    }

    // Build attendance map: studentId -> true (present by default)
    Map<String, bool> attendance = {};
    Map<String, String> studentNames = {};
    for (var doc in studentsSnap.docs) {
      attendance[doc.id] = true;
      studentNames[doc.id] = doc.data()['name'] ?? 'Unknown';
    }

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setDialogState) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(children: [
            const Icon(Icons.fact_check_rounded, color: Colors.indigo),
            const SizedBox(width: 10),
            Text("Attendance: $selectedClass",
                style: GoogleFonts.poppins(
                    fontSize: 16, fontWeight: FontWeight.bold)),
          ]),
          content: SizedBox(
            width: 400,
            height: 400,
            child: Column(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                      color: Colors.indigo.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                          "${DateFormat.yMMMd().format(DateTime.now())} • ${attendance.values.where((v) => v).length}/${attendance.length} Present",
                          style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.indigo[800])),
                      TextButton(
                        onPressed: () {
                          setDialogState(() {
                            bool allPresent = attendance.values.every((v) => v);
                            attendance.updateAll((k, v) => !allPresent);
                          });
                        },
                        child: Text(
                            attendance.values.every((v) => v)
                                ? "Mark All Absent"
                                : "Mark All Present",
                            style: const TextStyle(fontSize: 11)),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: ListView(
                    children: attendance.entries.map((entry) {
                      final name = studentNames[entry.key] ?? entry.key;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                            color: entry.value
                                ? Colors.green.withOpacity(0.05)
                                : Colors.red.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: entry.value
                                    ? Colors.green.shade200
                                    : Colors.red.shade200)),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(children: [
                              CircleAvatar(
                                backgroundColor: entry.value
                                    ? Colors.green.shade100
                                    : Colors.red.shade100,
                                radius: 16,
                                child: Text(
                                    name.isNotEmpty
                                        ? name[0].toUpperCase()
                                        : '?',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: entry.value
                                            ? Colors.green[800]
                                            : Colors.red[800])),
                              ),
                              const SizedBox(width: 10),
                              Text(name,
                                  style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w500)),
                            ]),
                            Switch(
                              value: entry.value,
                              activeColor: Colors.green,
                              inactiveThumbColor: Colors.red,
                              onChanged: (val) {
                                setDialogState(
                                    () => attendance[entry.key] = val);
                              },
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel")),
            ElevatedButton.icon(
              icon: const Icon(Icons.save_rounded, size: 18),
              label: const Text("Save Attendance"),
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white),
              onPressed: () async {
                // Upsert: check if a record already exists for today
                final today = DateTime.now();
                final dayStart = DateTime(today.year, today.month, today.day);
                final dayEnd = dayStart.add(const Duration(days: 1));

                final existingSnap = await FirebaseFirestore.instance
                    .collection('attendance')
                    .where('class', isEqualTo: selectedClass)
                    .where('date',
                        isGreaterThanOrEqualTo: Timestamp.fromDate(dayStart))
                    .where('date', isLessThan: Timestamp.fromDate(dayEnd))
                    .limit(1)
                    .get();

                if (existingSnap.docs.isNotEmpty) {
                  // Update existing record
                  await existingSnap.docs.first.reference.update({
                    'records': attendance,
                    'teacher': _teacherName,
                    'date': Timestamp.fromDate(DateTime.now()),
                  });
                } else {
                  // Create new record
                  await FirebaseFirestore.instance
                      .collection('attendance')
                      .add({
                    'class': selectedClass,
                    'schoolId': _teacherSchoolId,
                    'teacher': _teacherName,
                    'date': Timestamp.fromDate(DateTime.now()),
                    'records': attendance,
                  });
                }
                if (context.mounted) Navigator.pop(context);
                if (mounted) {
                  ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(
                      content: Text(
                          "Attendance saved for $selectedClass! (${attendance.values.where((v) => v).length}/${attendance.length} Present)"),
                      backgroundColor: Colors.green));
                }
              },
            ),
          ],
        );
      }),
    );
  }

  // --- 📅 VIEW TIMETABLE ---
  Future<void> _showTimetableDialog() async {
    if (_classes.isEmpty) return;
    final selectedClass = _classes[_selectedClassIndex];

    // Fetch class doc that contains the timetable
    final classSnap = await FirebaseFirestore.instance
        .collection('classes')
        .where('className', isEqualTo: selectedClass)
        .where('schoolId', isEqualTo: _teacherSchoolId)
        .limit(1)
        .get();

    if (!mounted) return;

    if (classSnap.docs.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content:
              Text("No timetable found. Ask your Admin to generate one.")));
      return;
    }

    final classData = classSnap.docs.first.data();
    final timetable = classData['timetable'] as Map<String, dynamic>?;
    final config = (classData['timetableConfig'] as List<dynamic>?) ?? [];

    if (timetable == null || timetable.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text("No timetable generated yet for this class.")));
      return;
    }

    final days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(children: [
          const Icon(Icons.calendar_month_rounded, color: Colors.teal),
          const SizedBox(width: 10),
          Text("Timetable: $selectedClass",
              style: GoogleFonts.poppins(
                  fontSize: 16, fontWeight: FontWeight.bold)),
        ]),
        content: SizedBox(
          width: 500,
          height: 450,
          child: DefaultTabController(
            length: days.length,
            child: Column(
              children: [
                TabBar(
                  isScrollable: true,
                  labelColor: Colors.teal,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: Colors.teal,
                  labelStyle: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600, fontSize: 13),
                  tabs: days.map((d) => Tab(text: d)).toList(),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: TabBarView(
                    children: days.map((day) {
                      final daySlots = timetable[day] as List<dynamic>? ?? [];
                      if (daySlots.isEmpty) {
                        return Center(
                            child: Text("No classes on $day",
                                style:
                                    GoogleFonts.poppins(color: Colors.grey)));
                      }
                      return ListView.builder(
                        itemCount: daySlots.length,
                        itemBuilder: (context, index) {
                          // Slots are strings like "Hindi", "Math", "Free", "Lunch Break"
                          final subject = daySlots[index].toString();
                          final isFree =
                              subject == 'Free' || subject == 'Lunch Break';

                          // Get time from config if available
                          String timeLabel = '';
                          if (index < config.length) {
                            final slotConfig =
                                config[index] as Map<String, dynamic>;
                            timeLabel = slotConfig['label'] ?? '';
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isFree
                                  ? Colors.orange.withOpacity(0.08)
                                  : Colors.teal.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color: isFree
                                      ? Colors.orange.shade200
                                      : Colors.teal.shade200),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(children: [
                                  Icon(
                                      isFree
                                          ? Icons.free_breakfast_rounded
                                          : Icons.menu_book_rounded,
                                      color:
                                          isFree ? Colors.orange : Colors.teal,
                                      size: 20),
                                  const SizedBox(width: 12),
                                  Text(subject,
                                      style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14)),
                                ]),
                                if (timeLabel.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                        color: Colors.blueGrey.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8)),
                                    child: Text(timeLabel,
                                        style: GoogleFonts.poppins(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w500,
                                            color: Colors.blueGrey[700])),
                                  ),
                              ],
                            ),
                          );
                        },
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Close")),
        ],
      ),
    );
  }

  // --- 📆 VIEW ATTENDANCE HISTORY (Calendar) ---
  Future<void> _showAttendanceCalendarDialog() async {
    if (_classes.isEmpty) return;
    final selectedClass = _classes[_selectedClassIndex];

    // Step 1: Pick a date
    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      helpText: 'Select date to view attendance',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.indigo,
              onPrimary: Colors.white,
              surface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate == null || !mounted) return;

    // Step 2: Query Firestore for that date's records
    final dayStart =
        DateTime(pickedDate.year, pickedDate.month, pickedDate.day);
    final dayEnd = dayStart.add(const Duration(days: 1));

    final attendanceSnap = await FirebaseFirestore.instance
        .collection('attendance')
        .where('class', isEqualTo: selectedClass)
        .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(dayStart))
        .where('date', isLessThan: Timestamp.fromDate(dayEnd))
        .get();

    if (!mounted) return;

    if (attendanceSnap.docs.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(
              "No attendance recorded for $selectedClass on ${DateFormat.yMMMd().format(pickedDate)}")));
      return;
    }

    // Use the latest record if multiple exist for the same day
    final recordData = attendanceSnap.docs.first.data();
    final records = (recordData['records'] as Map<String, dynamic>?) ?? {};
    final teacher = recordData['teacher'] ?? 'Unknown';

    // Fetch student names
    final studentIds = records.keys.toList();
    Map<String, String> studentNames = {};
    if (studentIds.isNotEmpty) {
      final usersSnap = await FirebaseFirestore.instance
          .collection('users')
          .where(FieldPath.documentId, whereIn: studentIds)
          .get();
      for (var doc in usersSnap.docs) {
        studentNames[doc.id] = doc.data()['name'] ?? 'Unknown';
      }
    }

    if (!mounted) return;

    final presentCount = records.values.where((v) => v == true).length;
    final absentCount = records.length - presentCount;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.calendar_today_rounded, color: Colors.indigo),
              const SizedBox(width: 10),
              Text("Attendance: $selectedClass",
                  style: GoogleFonts.poppins(
                      fontSize: 16, fontWeight: FontWeight.bold)),
            ]),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                  color: Colors.indigo.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(DateFormat.yMMMMd().format(pickedDate),
                      style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.indigo[800])),
                  Text("By: $teacher",
                      style: GoogleFonts.poppins(
                          fontSize: 11, color: Colors.grey[600])),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(8)),
                  child: Text("✅ Present: $presentCount",
                      style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.green[800])),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8)),
                  child: Text("❌ Absent: $absentCount",
                      style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.red[800])),
                ),
              ],
            ),
          ],
        ),
        content: SizedBox(
          width: 400,
          height: 350,
          child: ListView(
            children: records.entries.map((entry) {
              final name = studentNames[entry.key] ?? 'ID: ${entry.key}';
              final isPresent = entry.value == true;
              return Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isPresent
                      ? Colors.green.withOpacity(0.05)
                      : Colors.red.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: isPresent
                          ? Colors.green.shade200
                          : Colors.red.shade200),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(children: [
                      CircleAvatar(
                        backgroundColor: isPresent
                            ? Colors.green.shade100
                            : Colors.red.shade100,
                        radius: 16,
                        child: Text(
                            name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isPresent
                                    ? Colors.green[800]
                                    : Colors.red[800])),
                      ),
                      const SizedBox(width: 12),
                      Text(name,
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w500, fontSize: 14)),
                    ]),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                          color: isPresent
                              ? Colors.green.shade100
                              : Colors.red.shade100,
                          borderRadius: BorderRadius.circular(20)),
                      child: Text(isPresent ? "Present" : "Absent",
                          style: TextStyle(
                              color: isPresent
                                  ? Colors.green[800]
                                  : Colors.red[800],
                              fontSize: 12,
                              fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Close")),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 📝 CREATE TEST (MCQ + Short Answer + Scheduling)
  // ═══════════════════════════════════════════════════════════
  Future<void> _showCreateTestDialog() async {
    if (_classes.isEmpty) return;
    final selectedClass = _classes[_selectedClassIndex];
    final titleCtrl = TextEditingController();
    final subjectCtrl = TextEditingController();
    int durationMins = 15;
    DateTime? scheduledDate;
    TimeOfDay? scheduledTime;
    List<Map<String, dynamic>> questions = [];
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setDialogState) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(children: [
            const Icon(Icons.quiz_rounded, color: Colors.deepPurple),
            const SizedBox(width: 10),
            Text("Create Test: $selectedClass",
                style: GoogleFonts.poppins(
                    fontSize: 15, fontWeight: FontWeight.bold)),
          ]),
          content: SizedBox(
            width: 520,
            height: 520,
            child: SingleChildScrollView(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                        controller: subjectCtrl,
                        decoration: InputDecoration(
                            labelText: 'Subject',
                            prefixIcon: const Icon(Icons.book, size: 18),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)))),
                    const SizedBox(height: 10),
                    TextField(
                        controller: titleCtrl,
                        decoration: InputDecoration(
                            labelText: 'Test Title',
                            prefixIcon:
                                const Icon(Icons.title_rounded, size: 18),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)))),
                    const SizedBox(height: 10),
                    Row(children: [
                      Text("Duration: ",
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w500, fontSize: 13)),
                      DropdownButton<int>(
                        value: durationMins,
                        items: [5, 10, 15, 20, 30, 45, 60]
                            .map((m) => DropdownMenuItem(
                                value: m, child: Text("$m min")))
                            .toList(),
                        onChanged: (v) =>
                            setDialogState(() => durationMins = v ?? 15),
                      ),
                    ]),
                    const SizedBox(height: 6),
                    Text("Schedule Test",
                        style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: Colors.deepPurple)),
                    const SizedBox(height: 6),
                    Row(children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.calendar_today, size: 16),
                          label: Text(
                              scheduledDate != null
                                  ? DateFormat.yMMMd().format(scheduledDate!)
                                  : "Pick Date",
                              style: const TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 10),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10))),
                          onPressed: () async {
                            final d = await showDatePicker(
                                context: context,
                                initialDate: DateTime.now(),
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now()
                                    .add(const Duration(days: 365)));
                            if (d != null)
                              setDialogState(() => scheduledDate = d);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.access_time, size: 16),
                          label: Text(
                              scheduledTime != null
                                  ? scheduledTime!.format(context)
                                  : "Pick Time",
                              style: const TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 10),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10))),
                          onPressed: () async {
                            final t = await showTimePicker(
                                context: context, initialTime: TimeOfDay.now());
                            if (t != null)
                              setDialogState(() => scheduledTime = t);
                          },
                        ),
                      ),
                    ]),
                    if (scheduledDate == null)
                      Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text("Leave empty to publish immediately",
                              style: TextStyle(
                                  fontSize: 11, color: Colors.grey[500]))),
                    const Divider(height: 20),
                    Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Questions (${questions.length})",
                              style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold, fontSize: 14)),
                          TextButton.icon(
                            icon:
                                const Icon(Icons.add_circle_outline, size: 18),
                            label: const Text("Add Question"),
                            onPressed: () => _showAddQuestionDialog(context,
                                (q) => setDialogState(() => questions.add(q))),
                          ),
                        ]),
                    ...questions.asMap().entries.map((entry) {
                      final i = entry.key;
                      final q = entry.value;
                      final isMCQ = q['type'] == 'mcq';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                            color: Colors.deepPurple.withOpacity(0.04),
                            borderRadius: BorderRadius.circular(10),
                            border:
                                Border.all(color: Colors.deepPurple.shade100)),
                        child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                              color: isMCQ
                                                  ? Colors.deepPurple.shade50
                                                  : Colors.blue.shade50,
                                              borderRadius:
                                                  BorderRadius.circular(4)),
                                          child: Text(
                                              isMCQ ? "MCQ" : "Short Answer",
                                              style: TextStyle(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.bold,
                                                  color: isMCQ
                                                      ? Colors.deepPurple
                                                      : Colors.blue)),
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(
                                            child: Text(
                                                "Q${i + 1}: ${q['question']}",
                                                style: GoogleFonts.poppins(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 12),
                                                maxLines: 2,
                                                overflow:
                                                    TextOverflow.ellipsis)),
                                      ]),
                                      const SizedBox(height: 4),
                                      if (isMCQ)
                                        ...List.generate(
                                            (q['options'] as List).length,
                                            (oi) {
                                          final options =
                                              q['options'] as List<String>;
                                          final isCorrect = q['correct'] == oi;
                                          return Text(
                                              "${String.fromCharCode(65 + oi)}) ${options[oi]}",
                                              style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: isCorrect
                                                      ? FontWeight.bold
                                                      : FontWeight.normal,
                                                  color: isCorrect
                                                      ? Colors.green[700]
                                                      : Colors.grey[700]));
                                        })
                                      else
                                        Text(
                                            "Model Answer: ${q['modelAnswer'] ?? 'N/A'}",
                                            style: TextStyle(
                                                fontSize: 11,
                                                color: Colors.grey[600]),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis),
                                    ]),
                              ),
                              IconButton(
                                  icon: Icon(Icons.delete_outline,
                                      size: 18, color: Colors.red[300]),
                                  onPressed: () => setDialogState(
                                      () => questions.removeAt(i))),
                            ]),
                      );
                    }),
                  ]),
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel")),
            ElevatedButton.icon(
              icon: const Icon(Icons.publish_rounded, size: 18),
              label:
                  Text(scheduledDate != null ? "Schedule Test" : "Publish Now"),
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.deepPurple,
                  foregroundColor: Colors.white),
              onPressed: () async {
                if (titleCtrl.text.isEmpty ||
                    subjectCtrl.text.isEmpty ||
                    questions.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text(
                          "Please fill Title, Subject, and add at least 1 question.")));
                  return;
                }
                DateTime? scheduledDateTime;
                if (scheduledDate != null) {
                  final time =
                      scheduledTime ?? const TimeOfDay(hour: 9, minute: 0);
                  scheduledDateTime = DateTime(
                      scheduledDate!.year,
                      scheduledDate!.month,
                      scheduledDate!.day,
                      time.hour,
                      time.minute);
                }
                await FirebaseFirestore.instance.collection('tests').add({
                  'class': selectedClass,
                  'schoolId': _teacherSchoolId,
                  'teacherName': _teacherName,
                  'subject': subjectCtrl.text.trim(),
                  'title': titleCtrl.text.trim(),
                  'duration': durationMins,
                  'questions': questions,
                  'createdAt': FieldValue.serverTimestamp(),
                  'status': scheduledDateTime != null ? 'scheduled' : 'active',
                  if (scheduledDateTime != null)
                    'scheduledAt': Timestamp.fromDate(scheduledDateTime),
                });
                if (context.mounted) Navigator.pop(context);
                if (mounted) {
                  final msg = scheduledDateTime != null
                      ? "Test '${titleCtrl.text}' scheduled for ${DateFormat.yMMMd().add_jm().format(scheduledDateTime)}!"
                      : "Test '${titleCtrl.text}' published for $selectedClass!";
                  ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(
                      content: Text(msg), backgroundColor: Colors.deepPurple));
                }
              },
            ),
          ],
        );
      }),
    );
  }

  void _showAddQuestionDialog(
      BuildContext parentCtx, Function(Map<String, dynamic>) onAdd) {
    final qCtrl = TextEditingController();
    final optCtrls = List.generate(4, (_) => TextEditingController());
    final answerCtrl = TextEditingController();
    int correctIdx = 0;
    String questionType = 'mcq';

    showDialog(
      context: parentCtx,
      builder: (context) => StatefulBuilder(builder: (context, setDialogState) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text("Add Question",
              style: GoogleFonts.poppins(
                  fontSize: 15, fontWeight: FontWeight.bold)),
          content: SizedBox(
            width: 420,
            child: SingleChildScrollView(
              child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text("Type: ",
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w500, fontSize: 13)),
                      const SizedBox(width: 8),
                      ChoiceChip(
                          label: const Text("MCQ"),
                          selected: questionType == 'mcq',
                          selectedColor: Colors.deepPurple.shade100,
                          onSelected: (_) =>
                              setDialogState(() => questionType = 'mcq')),
                      const SizedBox(width: 8),
                      ChoiceChip(
                          label: const Text("Short Answer"),
                          selected: questionType == 'short',
                          selectedColor: Colors.blue.shade100,
                          onSelected: (_) =>
                              setDialogState(() => questionType = 'short')),
                    ]),
                    const SizedBox(height: 12),
                    TextField(
                        controller: qCtrl,
                        maxLines: 2,
                        decoration: InputDecoration(
                            labelText: 'Question',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10)))),
                    const SizedBox(height: 12),
                    if (questionType == 'mcq') ...[
                      ...List.generate(
                          4,
                          (i) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(children: [
                                  Radio<int>(
                                      value: i,
                                      groupValue: correctIdx,
                                      activeColor: Colors.green,
                                      onChanged: (v) => setDialogState(
                                          () => correctIdx = v ?? 0)),
                                  Text("${String.fromCharCode(65 + i)}) ",
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold)),
                                  Expanded(
                                      child: TextField(
                                          controller: optCtrls[i],
                                          decoration: InputDecoration(
                                              hintText:
                                                  'Option ${String.fromCharCode(65 + i)}',
                                              contentPadding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 8),
                                              border: OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          8))))),
                                ]),
                              )),
                      Text("(Select the correct answer)",
                          style:
                              TextStyle(fontSize: 11, color: Colors.grey[500])),
                    ],
                    if (questionType == 'short') ...[
                      TextField(
                          controller: answerCtrl,
                          maxLines: 3,
                          decoration: InputDecoration(
                              labelText: 'Model Answer (optional)',
                              hintText:
                                  'Write the expected answer for reference',
                              alignLabelWithHint: true,
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10)))),
                    ],
                  ]),
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel")),
            ElevatedButton(
              onPressed: () {
                if (qCtrl.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text("Enter the question text.")));
                  return;
                }
                if (questionType == 'mcq' &&
                    optCtrls.any((c) => c.text.isEmpty)) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Fill all 4 MCQ options.")));
                  return;
                }
                final questionData = <String, dynamic>{
                  'question': qCtrl.text.trim(),
                  'type': questionType
                };
                if (questionType == 'mcq') {
                  questionData['options'] =
                      optCtrls.map((c) => c.text.trim()).toList();
                  questionData['correct'] = correctIdx;
                } else {
                  questionData['modelAnswer'] = answerCtrl.text.trim();
                }
                onAdd(questionData);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.deepPurple,
                  foregroundColor: Colors.white),
              child: const Text("Add"),
            ),
          ],
        );
      }),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🧪 CREATE EXPERIMENT
  // ═══════════════════════════════════════════════════════════
  Future<void> _showCreateExperimentDialog() async {
    if (_classes.isEmpty) return;
    final selectedClass = _classes[_selectedClassIndex];

    final titleCtrl = TextEditingController();
    final subjectCtrl = TextEditingController();
    final objectiveCtrl = TextEditingController();
    final materialsCtrl = TextEditingController();
    final procedureCtrl = TextEditingController();
    final outcomeCtrl = TextEditingController();

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(children: [
          const Icon(Icons.science_rounded, color: Colors.orange),
          const SizedBox(width: 10),
          Text("New Experiment: $selectedClass",
              style: GoogleFonts.poppins(
                  fontSize: 15, fontWeight: FontWeight.bold)),
        ]),
        content: SizedBox(
          width: 500,
          height: 450,
          child: SingleChildScrollView(
            child: Column(
              children: [
                _styledField(subjectCtrl, 'Subject', Icons.book),
                const SizedBox(height: 10),
                _styledField(titleCtrl, 'Experiment Title', Icons.science),
                const SizedBox(height: 10),
                _styledField(objectiveCtrl, 'Objective', Icons.flag_outlined,
                    maxLines: 2),
                const SizedBox(height: 10),
                _styledField(materialsCtrl, 'Materials Required',
                    Icons.inventory_2_outlined,
                    maxLines: 3),
                const SizedBox(height: 10),
                _styledField(
                    procedureCtrl, 'Procedure (Steps)', Icons.list_alt_rounded,
                    maxLines: 4),
                const SizedBox(height: 10),
                _styledField(
                    outcomeCtrl, 'Expected Outcome', Icons.check_circle_outline,
                    maxLines: 2),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel")),
          ElevatedButton.icon(
            icon: const Icon(Icons.publish_rounded, size: 18),
            label: const Text("Publish Experiment"),
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange, foregroundColor: Colors.white),
            onPressed: () async {
              if (titleCtrl.text.isEmpty || subjectCtrl.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text("Title and Subject are required.")));
                return;
              }
              await FirebaseFirestore.instance.collection('experiments').add({
                'class': selectedClass,
                'schoolId': _teacherSchoolId,
                'teacherName': _teacherName,
                'subject': subjectCtrl.text.trim(),
                'title': titleCtrl.text.trim(),
                'objective': objectiveCtrl.text.trim(),
                'materials': materialsCtrl.text.trim(),
                'procedure': procedureCtrl.text.trim(),
                'expectedOutcome': outcomeCtrl.text.trim(),
                'createdAt': FieldValue.serverTimestamp(),
              });
              if (context.mounted) Navigator.pop(context);
              if (mounted) {
                ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(
                    content: Text(
                        "Experiment '${titleCtrl.text}' published for $selectedClass!"),
                    backgroundColor: Colors.orange));
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _styledField(TextEditingController ctrl, String label, IconData icon,
          {int maxLines = 1}) =>
      TextField(
          controller: ctrl,
          maxLines: maxLines,
          decoration: InputDecoration(
              labelText: label,
              prefixIcon: Icon(icon, size: 18),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(12))));

  // ═══════════════════════════════════════════════════════════
  // 📒 CREATE CHAPTER NOTES (Text + Image Upload)
  // ═══════════════════════════════════════════════════════════
  Future<void> _showCreateNotesDialog() async {
    if (_classes.isEmpty) return;
    final selectedClass = _classes[_selectedClassIndex];
    final subjectCtrl = TextEditingController();
    final chapterCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    List<String> uploadedImageUrls = [];
    bool isUploading = false;
    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setDialogState) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(children: [
            const Icon(Icons.note_alt_rounded, color: Colors.blue),
            const SizedBox(width: 10),
            Text("Chapter Notes: $selectedClass",
                style: GoogleFonts.poppins(
                    fontSize: 15, fontWeight: FontWeight.bold)),
          ]),
          content: SizedBox(
            width: 500,
            height: 480,
            child: SingleChildScrollView(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _styledField(subjectCtrl, 'Subject', Icons.book),
                    const SizedBox(height: 10),
                    _styledField(chapterCtrl, 'Chapter Title', Icons.bookmark),
                    const SizedBox(height: 10),
                    TextField(
                        controller: contentCtrl,
                        maxLines: 5,
                        decoration: InputDecoration(
                            labelText: 'Notes Content (optional)',
                            hintText: 'Type notes here, or upload images below',
                            alignLabelWithHint: true,
                            prefixIcon: const Padding(
                                padding: EdgeInsets.only(bottom: 80),
                                child: Icon(Icons.edit_note, size: 18)),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)))),
                    const SizedBox(height: 14),
                    Text("Upload Images",
                        style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: Colors.blue)),
                    const SizedBox(height: 4),
                    Text(
                        "Take photos of handwritten notes, worksheets, or slides",
                        style:
                            TextStyle(fontSize: 11, color: Colors.grey[500])),
                    const SizedBox(height: 8),
                    Row(children: [
                      OutlinedButton.icon(
                        icon: const Icon(Icons.camera_alt_rounded, size: 16),
                        label: const Text("Camera"),
                        style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10))),
                        onPressed: isUploading
                            ? null
                            : () async {
                                final picker = ImagePicker();
                                final XFile? photo = await picker.pickImage(
                                    source: ImageSource.camera,
                                    imageQuality: 80);
                                if (photo == null) return;
                                setDialogState(() => isUploading = true);
                                final cloudinary = CloudinaryService();
                                final url = await cloudinary
                                    .uploadImage(File(photo.path));
                                if (url != null)
                                  setDialogState(
                                      () => uploadedImageUrls.add(url));
                                setDialogState(() => isUploading = false);
                              },
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.photo_library_rounded, size: 16),
                        label: const Text("Gallery"),
                        style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10))),
                        onPressed: isUploading
                            ? null
                            : () async {
                                final picker = ImagePicker();
                                final List<XFile> photos = await picker
                                    .pickMultiImage(imageQuality: 80);
                                if (photos.isEmpty) return;
                                setDialogState(() => isUploading = true);
                                final cloudinary = CloudinaryService();
                                for (final photo in photos) {
                                  final url = await cloudinary
                                      .uploadImage(File(photo.path));
                                  if (url != null)
                                    setDialogState(
                                        () => uploadedImageUrls.add(url));
                                }
                                setDialogState(() => isUploading = false);
                              },
                      ),
                    ]),
                    if (isUploading)
                      const Padding(
                          padding: EdgeInsets.only(top: 8),
                          child: Row(children: [
                            SizedBox(
                                width: 14,
                                height: 14,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2)),
                            SizedBox(width: 8),
                            Text("Uploading...", style: TextStyle(fontSize: 12))
                          ])),
                    if (uploadedImageUrls.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text("${uploadedImageUrls.length} image(s) attached",
                          style: TextStyle(
                              fontSize: 12,
                              color: Colors.green[700],
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      SizedBox(
                        height: 60,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: uploadedImageUrls.length,
                          itemBuilder: (_, i) => Stack(children: [
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  image: DecorationImage(
                                      image: NetworkImage(uploadedImageUrls[i]),
                                      fit: BoxFit.cover)),
                            ),
                            Positioned(
                                top: -4,
                                right: 0,
                                child: GestureDetector(
                                  onTap: () => setDialogState(
                                      () => uploadedImageUrls.removeAt(i)),
                                  child: Container(
                                      padding: const EdgeInsets.all(2),
                                      decoration: const BoxDecoration(
                                          color: Colors.red,
                                          shape: BoxShape.circle),
                                      child: const Icon(Icons.close,
                                          size: 12, color: Colors.white)),
                                )),
                          ]),
                        ),
                      ),
                    ],
                  ]),
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel")),
            ElevatedButton.icon(
              icon: const Icon(Icons.publish_rounded, size: 18),
              label: const Text("Publish Notes"),
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue, foregroundColor: Colors.white),
              onPressed: isUploading
                  ? null
                  : () async {
                      if (subjectCtrl.text.isEmpty ||
                          chapterCtrl.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    "Subject and Chapter Title are required.")));
                        return;
                      }
                      if (contentCtrl.text.isEmpty &&
                          uploadedImageUrls.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    "Add some notes text or upload images.")));
                        return;
                      }
                      await FirebaseFirestore.instance.collection('notes').add({
                        'class': selectedClass,
                        'schoolId': _teacherSchoolId,
                        'teacherName': _teacherName,
                        'subject': subjectCtrl.text.trim(),
                        'chapter': chapterCtrl.text.trim(),
                        'content': contentCtrl.text.trim(),
                        'images': uploadedImageUrls,
                        'createdAt': FieldValue.serverTimestamp(),
                      });
                      if (context.mounted) Navigator.pop(context);
                      if (mounted) {
                        ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(
                            content: Text(
                                "Notes for '${chapterCtrl.text}' published for $selectedClass!"),
                            backgroundColor: Colors.blue));
                      }
                    },
            ),
          ],
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingClasses)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_classes.isEmpty)
      return const Scaffold(body: Center(child: Text("No classes assigned.")));

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/presentation'),
        tooltip: "Test Presentation",
        child: const Icon(Icons.slideshow),
      ),
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          const Positioned.fill(child: _TeacherBackground()),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 24),

                  // Class Selector
                  SizedBox(
                    height: 50,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _classes.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        final isSelected = index == _selectedClassIndex;
                        return GestureDetector(
                          onTap: () {
                              setState(() => _selectedClassIndex = index);
                              _fetchAppPermissions();
                          },
                          child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 12),
                              decoration: BoxDecoration(
                                  color: isSelected
                                      ? Colors.indigoAccent
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(25),
                                  border: Border.all(
                                      color: isSelected
                                          ? Colors.indigoAccent
                                          : Colors.grey.shade300)),
                              child: Text(_classes[index],
                                  style: GoogleFonts.poppins(
                                      color: isSelected
                                          ? Colors.white
                                          : Colors.blueGrey[700],
                                      fontWeight: FontWeight.w600))),
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 16),
                  // --- 🆕 ACTION BUTTONS: ATTENDANCE + TIMETABLE ---
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: _showMarkAttendanceDialog,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.green.shade200),
                              boxShadow: [
                                BoxShadow(
                                    color: Colors.green.withOpacity(0.08),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4))
                              ],
                            ),
                            child: Row(children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                    color: Colors.green.shade50,
                                    shape: BoxShape.circle),
                                child: Icon(Icons.fact_check_rounded,
                                    color: Colors.green.shade700, size: 22),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("Mark Attendance",
                                      style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13)),
                                  Text("Today's roll call",
                                      style: GoogleFonts.poppins(
                                          fontSize: 11,
                                          color: Colors.grey[500])),
                                ],
                              ),
                            ]),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: _showTimetableDialog,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.teal.shade200),
                              boxShadow: [
                                BoxShadow(
                                    color: Colors.teal.withOpacity(0.08),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4))
                              ],
                            ),
                            child: Row(children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                    color: Colors.teal.shade50,
                                    shape: BoxShape.circle),
                                child: Icon(Icons.calendar_month_rounded,
                                    color: Colors.teal.shade700, size: 22),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text("View Timetable",
                                      style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13)),
                                  Text("Weekly schedule",
                                      style: GoogleFonts.poppins(
                                          fontSize: 11,
                                          color: Colors.grey[500])),
                                ],
                              ),
                            ]),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),
                  // --- 🆕 VIEW ATTENDANCE HISTORY BUTTON ---
                  GestureDetector(
                    onTap: _showAttendanceCalendarDialog,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.purple.shade200),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.purple.withOpacity(0.08),
                              blurRadius: 12,
                              offset: const Offset(0, 4))
                        ],
                      ),
                      child: Row(children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                              color: Colors.purple.shade50,
                              shape: BoxShape.circle),
                          child: Icon(Icons.calendar_today_rounded,
                              color: Colors.purple.shade700, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Attendance History",
                                style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold, fontSize: 13)),
                            Text("Pick a date to view past records",
                                style: GoogleFonts.poppins(
                                    fontSize: 11, color: Colors.grey[500])),
                          ],
                        ),
                        const Spacer(),
                        Icon(Icons.arrow_forward_ios_rounded,
                            size: 14, color: Colors.grey[400]),
                      ]),
                    ),
                  ),

                  // ═══════════════════════════════════════════════
                  // 📝 TESTS & QUIZZES SECTION
                  // ═══════════════════════════════════════════════
                  const SizedBox(height: 30),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Tests & Quizzes",
                          style: GoogleFonts.poppins(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blueGrey[900])),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text("Create Test"),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.deepPurple,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12))),
                        onPressed: _showCreateTestDialog,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('tests')
                        .where('class',
                            isEqualTo: _classes.isNotEmpty
                                ? _classes[_selectedClassIndex]
                                : '')
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                              color: Colors.deepPurple.withOpacity(0.03),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: Colors.deepPurple.shade100)),
                          child: Center(
                              child: Text(
                                  "No tests yet. Create your first quiz!",
                                  style: GoogleFonts.poppins(
                                      color: Colors.grey, fontSize: 13))),
                        );
                      }
                      return ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: snapshot.data!.docs.length,
                        itemBuilder: (context, index) {
                          final data = snapshot.data!.docs[index].data()
                              as Map<String, dynamic>;
                          final qCount =
                              (data['questions'] as List?)?.length ?? 0;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                    color: Colors.deepPurple.shade100)),
                            child: Row(children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                    color: Colors.deepPurple.shade50,
                                    shape: BoxShape.circle),
                                child: const Icon(Icons.quiz_rounded,
                                    color: Colors.deepPurple, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(data['title'] ?? 'Untitled',
                                        style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13)),
                                    Text(
                                        "${data['subject'] ?? ''} • $qCount Qs • ${data['duration'] ?? 15} min",
                                        style: GoogleFonts.poppins(
                                            fontSize: 11,
                                            color: Colors.grey[600])),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                    color: data['status'] == 'scheduled'
                                        ? Colors.orange.shade50
                                        : Colors.green.shade50,
                                    borderRadius: BorderRadius.circular(8)),
                                child: Text(
                                    data['status'] == 'scheduled'
                                        ? "Scheduled"
                                        : "Active",
                                    style: TextStyle(
                                        color: data['status'] == 'scheduled'
                                            ? Colors.orange[700]
                                            : Colors.green[700],
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold)),
                              ),
                            ]),
                          );
                        },
                      );
                    },
                  ),

                  // ═══════════════════════════════════════════════
                  // 🧪 EXPERIMENTS SECTION
                  // ═══════════════════════════════════════════════
                  const SizedBox(height: 30),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Experiments",
                          style: GoogleFonts.poppins(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blueGrey[900])),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text("New Experiment"),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12))),
                        onPressed: _showCreateExperimentDialog,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('experiments')
                        .where('class',
                            isEqualTo: _classes.isNotEmpty
                                ? _classes[_selectedClassIndex]
                                : '')
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.03),
                              borderRadius: BorderRadius.circular(12),
                              border:
                                  Border.all(color: Colors.orange.shade100)),
                          child: Center(
                              child: Text(
                                  "No experiments yet. Create your first lab activity!",
                                  style: GoogleFonts.poppins(
                                      color: Colors.grey, fontSize: 13))),
                        );
                      }
                      return ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: snapshot.data!.docs.length,
                        itemBuilder: (context, index) {
                          final data = snapshot.data!.docs[index].data()
                              as Map<String, dynamic>;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border:
                                    Border.all(color: Colors.orange.shade100)),
                            child: Row(children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                    color: Colors.orange.shade50,
                                    shape: BoxShape.circle),
                                child: const Icon(Icons.science_rounded,
                                    color: Colors.orange, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(data['title'] ?? 'Untitled',
                                        style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13)),
                                    Text(
                                        "${data['subject'] ?? ''} • ${data['objective'] ?? ''}",
                                        style: GoogleFonts.poppins(
                                            fontSize: 11,
                                            color: Colors.grey[600]),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis),
                                  ],
                                ),
                              ),
                            ]),
                          );
                        },
                      );
                    },
                  ),

                  // ═══════════════════════════════════════════════
                  // 📒 CHAPTER NOTES SECTION
                  // ═══════════════════════════════════════════════
                  const SizedBox(height: 30),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Chapter Notes",
                          style: GoogleFonts.poppins(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blueGrey[900])),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text("New Notes"),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12))),
                        onPressed: _showCreateNotesDialog,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('notes')
                        .where('class',
                            isEqualTo: _classes.isNotEmpty
                                ? _classes[_selectedClassIndex]
                                : '')
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                        return Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.03),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.blue.shade100)),
                          child: Center(
                              child: Text(
                                  "No notes yet. Share study material with your class!",
                                  style: GoogleFonts.poppins(
                                      color: Colors.grey, fontSize: 13))),
                        );
                      }
                      return ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: snapshot.data!.docs.length,
                        itemBuilder: (context, index) {
                          final data = snapshot.data!.docs[index].data()
                              as Map<String, dynamic>;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border:
                                    Border.all(color: Colors.blue.shade100)),
                            child: Row(children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                    color: Colors.blue.shade50,
                                    shape: BoxShape.circle),
                                child: const Icon(Icons.note_alt_rounded,
                                    color: Colors.blue, size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(data['chapter'] ?? 'Untitled',
                                        style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13)),
                                    Text(
                                        "${data['subject'] ?? ''}${(data['images'] as List?)?.isNotEmpty == true ? ' • ${(data['images'] as List).length} 📷' : ''} • By ${data['teacherName'] ?? ''}",
                                        style: GoogleFonts.poppins(
                                            fontSize: 11,
                                            color: Colors.grey[600])),
                                  ],
                                ),
                              ),
                            ]),
                          );
                        },
                      );
                    },
                  ),

                  Text("Create Assignment",
                      style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.blueGrey[900])),
                  const SizedBox(height: 16),

                  SizedBox(
                    height: 80,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _availableTools.length,
                      itemBuilder: (context, index) {
                        return Draggable<DashboardItem>(
                          data: _availableTools[index],
                          feedback: Material(
                            color: Colors.transparent,
                            child: Opacity(
                              opacity: 0.7,
                              child: _buildToolChip(_availableTools[index],
                                  isDragging: true),
                            ),
                          ),
                          childWhenDragging: Opacity(
                              opacity: 0.3,
                              child: _buildToolChip(_availableTools[index])),
                          child: _buildToolChip(_availableTools[index]),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),

                  _buildProjectCreatorCard(),

                  const SizedBox(height: 30),
                  
                  // 🛡️ CLASS APP PERMISSIONS CHECKBOX LIST
                  Row(
                    children: [
                      const Icon(Icons.security, color: Colors.blueGrey, size: 28),
                      const SizedBox(width: 10),
                      Text("Class App Permissions",
                          style: GoogleFonts.poppins(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blueGrey[900])),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text("Select which apps the students in ${_classes.isNotEmpty ? _classes[_selectedClassIndex] : 'this class'} can see.",
                      style: GoogleFonts.poppins(fontSize: 13, color: Colors.grey[600])),
                  const SizedBox(height: 16),
                  
                  _isLoadingAppPermissions 
                    ? const Center(child: CircularProgressIndicator())
                    : Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                           color: Colors.white,
                           borderRadius: BorderRadius.circular(16),
                           border: Border.all(color: Colors.grey.shade300)
                        ),
                        child: Wrap(
                           spacing: 12,
                           runSpacing: 12,
                           children: _allAvailableApps.map((appName) {
                              final isAllowed = _allowedAppsForCurrentClass.contains(appName);
                              return IntrinsicWidth(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  decoration: BoxDecoration(
                                     color: isAllowed ? Colors.green.shade50 : Colors.grey.shade50,
                                     borderRadius: BorderRadius.circular(10),
                                     border: Border.all(color: isAllowed ? Colors.green.shade300 : Colors.grey.shade300)
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Checkbox(
                                        value: isAllowed,
                                        activeColor: Colors.green,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                        onChanged: (val) {
                                           if (val != null) {
                                              _toggleAppPermission(appName, val);
                                           }
                                        },
                                      ),
                                      Text(appName, style: GoogleFonts.poppins(
                                         fontSize: 13,
                                         fontWeight: isAllowed ? FontWeight.w600 : FontWeight.w400,
                                         color: isAllowed ? Colors.green[800] : Colors.grey[700],
                                      )),
                                      const SizedBox(width: 8)
                                    ],
                                  ),
                                ),
                              );
                           }).toList(),
                        ),
                      ),
                  if (!_isLoadingAppPermissions)
                    Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: ElevatedButton.icon(
                          onPressed: _saveAppPermissions,
                          icon: const Icon(Icons.save_rounded, color: Colors.white, size: 20),
                          label: Text("Save Changes", style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blueAccent,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ),

                  const SizedBox(height: 30),

                  // 📢 NEW: BROADCAST SECTION
                  Text("Class Announcement",
                      style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.blueGrey[900])),
                  const SizedBox(height: 16),
                  _buildBroadcastCard(),

                  const SizedBox(height: 40),
                  Text("Recent Uploads",
                      style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.blueGrey[900])),
                  const SizedBox(height: 16),
                  _buildAssignmentList(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- WIDGET BUILDERS ---

  Widget _buildBroadcastCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF8E1), // Light Amber
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.orange.withOpacity(0.3), width: 1),
        boxShadow: [
          BoxShadow(color: Colors.orange.withOpacity(0.1), blurRadius: 20)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.campaign_rounded,
                  color: Colors.orange, size: 28),
              const SizedBox(width: 10),
              Text("Send Notice to ${_classes[_selectedClassIndex]}",
                  style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.brown[800])),
            ],
          ),
          const SizedBox(height: 16),
          _buildStyledTextField(_noticeTitleController,
              "Subject (e.g., Exam Postponed)", Icons.title),
          const SizedBox(height: 12),
          _buildStyledTextField(_noticeMessageController,
              "Type your message here...", Icons.message_outlined,
              maxLines: 3),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 45,
            child: ElevatedButton.icon(
              onPressed: _isSendingNotice ? null : _sendBroadcast,
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0),
              icon: _isSendingNotice
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.send_rounded, size: 18),
              label: Text("Broadcast Notice",
                  style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildToolChip(DashboardItem item, {bool isDragging = false}) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: item.accentColor.withOpacity(0.5)),
        boxShadow: isDragging
            ? []
            : [
                BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2))
              ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(item.icon, color: item.accentColor, size: 20),
          const SizedBox(width: 8),
          Text(item.title,
              style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.blueGrey[800])),
        ],
      ),
    );
  }

  Widget _buildProjectCreatorCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStyledTextField(
              _projectTitleController, "Project Title", Icons.title),
          const SizedBox(height: 12),
          _buildStyledTextField(
              _projectDescController, "Instructions...", Icons.description,
              maxLines: 3),
          const SizedBox(height: 20),
          Text("Required Tool (Drag & Drop here)",
              style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600])),
          const SizedBox(height: 8),
          DragTarget<DashboardItem>(
            onAcceptWithDetails: (details) {
              _handleAppDrop(details.data);
            },
            builder: (context, candidateData, rejectedData) {
              bool isHovered = candidateData.isNotEmpty;
              return DottedBorder(
                borderType: BorderType.RRect,
                radius: const Radius.circular(12),
                color: isHovered
                    ? Colors.indigoAccent
                    : (_selectedToolForProject != null
                        ? _selectedToolForProject!.accentColor
                        : Colors.grey.shade400),
                strokeWidth: 2,
                dashPattern: const [6, 3],
                child: Container(
                  width: double.infinity,
                  height: 60,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isHovered
                        ? Colors.indigo.withOpacity(0.05)
                        : (_selectedToolForProject != null
                            ? _selectedToolForProject!.accentColor
                                .withOpacity(0.1)
                            : Colors.transparent),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: _selectedToolForProject != null
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(_selectedToolForProject!.icon,
                                color: _selectedToolForProject!.accentColor),
                            const SizedBox(width: 8),
                            Text(_selectedToolForProject!.title,
                                style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold,
                                    color:
                                        _selectedToolForProject!.accentColor)),
                            const SizedBox(width: 8),
                            IconButton(
                                icon: const Icon(Icons.close, size: 16),
                                onPressed: () => setState(
                                    () => _selectedToolForProject = null))
                          ],
                        )
                      : Text("Drop Tool Here",
                          style: GoogleFonts.poppins(
                              color: Colors.grey[500], fontSize: 13)),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          Text("Add Hint (Optional)",
              style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600])),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildHintTypeChip('none', 'No Hint'),
              const SizedBox(width: 8),
              _buildHintTypeChip('text', 'Text Hint'),
              const SizedBox(width: 8),
              _buildHintTypeChip('image', 'Image Hint'),
            ],
          ),
          const SizedBox(height: 12),
          if (_hintType == 'text')
            _buildStyledTextField(_hintTextController, "Enter hint text...",
                Icons.lightbulb_outline),
          if (_hintType == 'image')
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                    image: _selectedImageFile != null
                        ? DecorationImage(
                            image: FileImage(_selectedImageFile!),
                            fit: BoxFit.cover)
                        : null),
                child: _selectedImageFile == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                            const Icon(Icons.add_photo_alternate,
                                color: Colors.grey),
                            Text("Tap to upload image",
                                style: GoogleFonts.poppins(
                                    fontSize: 12, color: Colors.grey))
                          ])
                    : null,
              ),
            ),
          const SizedBox(height: 20),
          Text("Deadline",
              style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600])),
          const SizedBox(height: 8),
          InkWell(
            onTap: _pickDateTime,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                  color: _selectedDueDate != null
                      ? Colors.indigoAccent.withOpacity(0.1)
                      : Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: _selectedDueDate != null
                          ? Colors.indigoAccent
                          : Colors.grey.shade300)),
              child: Row(
                children: [
                  Icon(Icons.calendar_today_rounded,
                      size: 18,
                      color: _selectedDueDate != null
                          ? Colors.indigoAccent
                          : Colors.grey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _selectedDueDate == null
                          ? "Select Date & Time"
                          : DateFormat('MMM dd • HH:mm')
                              .format(_selectedDueDate!),
                      style: GoogleFonts.poppins(
                          color: _selectedDueDate != null
                              ? Colors.indigo[900]
                              : Colors.grey[600],
                          fontWeight: FontWeight.w600,
                          fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: (_isUploading) ? null : _createProject,
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigoAccent,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12))),
              child: _isUploading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : Text(
                      "Assign to ${_classes.isNotEmpty ? _classes[_selectedClassIndex] : 'Class'}",
                      style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHintTypeChip(String type, String label) {
    bool isSelected = _hintType == type;
    return GestureDetector(
      onTap: () => setState(() => _hintType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.indigo : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: isSelected ? Colors.indigo : Colors.grey.shade300),
        ),
        child: Text(label,
            style: GoogleFonts.poppins(
                fontSize: 11,
                color: isSelected ? Colors.white : Colors.grey[600],
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal)),
      ),
    );
  }

  Widget _buildAssignmentList() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('assignments')
          .where('className',
              isEqualTo:
                  _classes.isNotEmpty ? _classes[_selectedClassIndex] : '')
          .orderBy('createdAt', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty)
          return const SizedBox.shrink();
        return ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: snapshot.data!.docs.length,
            itemBuilder: (context, index) {
              final data =
                  snapshot.data!.docs[index].data() as Map<String, dynamic>;
              DateTime due = DateTime.now();
              if (data['dueDate'] != null && data['dueDate'] is Timestamp)
                due = (data['dueDate'] as Timestamp).toDate();
              return _buildProjectListTile({
                'title': data['title'] ?? 'Untitled',
                'tool': data['tool'] ?? 'Unknown',
                'due': due,
              });
            });
      },
    );
  }

  Widget _buildProjectListTile(Map<String, dynamic> project) {
    return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200)),
        child: Row(children: [
          const Icon(Icons.assignment),
          const SizedBox(width: 16),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(project['title']),
                Text("Due: ${DateFormat('MMM dd').format(project['due'])}",
                    style: const TextStyle(fontSize: 12))
              ]))
        ]));
  }

  Widget _buildStyledTextField(
          TextEditingController controller, String hint, IconData icon,
          {int maxLines = 1}) =>
      TextField(
          controller: controller,
          maxLines: maxLines,
          decoration: InputDecoration(
              hintText: hint,
              prefixIcon: Icon(icon, size: 20, color: Colors.grey[400]),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200))));

  // ✅ FIXED HEADER AND LOGOUT
  Widget _buildHeader(BuildContext context) =>
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text("Teacher Portal",
              style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: Colors.blueGrey[500],
                  fontWeight: FontWeight.w600)),
          Text("Welcome, $_teacherName",
              style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.blueGrey[900]))
        ]),
        IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
            onPressed: () async {
              // 1. Sign out from Firebase
              await FirebaseAuth.instance.signOut();

              if (!context.mounted) return;

              // 2. Clear history and go to Login Screen
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(
                    builder: (context) => const LittleEmmiLoginScreen()),
                (route) => false,
              );
            })
      ]);
}

class _TeacherBackground extends StatelessWidget {
  const _TeacherBackground();
  @override
  Widget build(BuildContext context) =>
      Container(color: const Color(0xFFF8FAFC));
}
