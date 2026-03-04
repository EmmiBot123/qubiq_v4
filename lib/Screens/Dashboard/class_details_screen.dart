import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class ClassDetailsScreen extends StatefulWidget {
  final String classId;
  final String className;
  final String schoolId;

  const ClassDetailsScreen({
    Key? key,
    required this.classId,
    required this.className,
    required this.schoolId,
  }) : super(key: key);

  @override
  State<ClassDetailsScreen> createState() => _ClassDetailsScreenState();
}

class _ClassDetailsScreenState extends State<ClassDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _classData;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showAddSubjectDialog() {
    String subjectName = "";
    String? selectedTeacherId;
    String? selectedTeacherName;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setDialogState) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text("Add Subject to ${widget.className}"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                onChanged: (v) => subjectName = v,
                decoration: const InputDecoration(
                    labelText: "Subject Name (e.g. Math)",
                    border: OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              Text("Select Subject Teacher",
                  style: TextStyle(fontSize: 12, color: Colors.grey[700])),
              const SizedBox(height: 8),
              StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('users')
                    .where('role', isEqualTo: 'teacher')
                    .where('schoolId', isEqualTo: widget.schoolId)
                    .snapshots(),
                builder: (context, snapshot) {
                  if (!snapshot.hasData)
                    return const CircularProgressIndicator();
                  final teachers = snapshot.data!.docs;
                  return DropdownButtonFormField<String>(
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                    value: selectedTeacherId,
                    hint: const Text("Select a Teacher"),
                    items: teachers
                        .map((t) => DropdownMenuItem(
                            value: t.id, child: Text(t['name'])))
                        .toList(),
                    onChanged: (val) {
                      setDialogState(() {
                        selectedTeacherId = val;
                        selectedTeacherName =
                            teachers.firstWhere((t) => t.id == val)['name'];
                      });
                    },
                  );
                },
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel")),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white),
              onPressed: () async {
                if (subjectName.trim().isEmpty || selectedTeacherId == null)
                  return;
                await FirebaseFirestore.instance
                    .collection('classes')
                    .doc(widget.classId)
                    .set({
                  'subjects': {
                    subjectName.trim(): {
                      'teacherId': selectedTeacherId,
                      'teacherName': selectedTeacherName,
                    }
                  }
                }, SetOptions(merge: true));
                if (mounted) Navigator.pop(context);
              },
              child: const Text("Add Subject"),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildOverviewTab() {
    // Placeholder for actual performance metrics - can be upgraded later
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: _buildStatCard("Attendance", "92%", Icons.calendar_month,
                    Colors.teal, Colors.teal[50]!),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard("Avg Grade", "A-", Icons.grade,
                    Colors.indigo, Colors.indigo[50]!),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text("Class Information",
              style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.blueGrey[800])),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[200]!)),
            child: Column(
              children: [
                _buildInfoRow(Icons.person, "Class Teacher",
                    _classData?['classTeacherName'] ?? 'Unassigned'),
                const Divider(),
                _buildInfoRow(
                    Icons.book,
                    "Total Subjects",
                    ((_classData?['subjects'] as Map?)?.length ?? 0)
                        .toString()),
                const Divider(),
                _buildInfoRow(Icons.date_range, "Created On",
                    "Since 2024 Academic Year"), // Can connect to createdAt timestamp
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String title, String val, IconData icon, Color iconCol, Color bgCol) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey[200]!)),
      child: Row(
        children: [
          Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                  color: bgCol, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: iconCol)),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(val,
                  style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.blueGrey[800])),
              Text(title,
                  style: TextStyle(color: Colors.blueGrey[400], fontSize: 13)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey, size: 20),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: Colors.grey)),
          const Spacer(),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildInsightsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("AI Predictive Analytics",
                  style: GoogleFonts.poppins(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                      color: Colors.purple[50],
                      borderRadius: BorderRadius.circular(20)),
                  child: Row(children: [
                    const Icon(Icons.auto_awesome,
                        color: Colors.purple, size: 16),
                    const SizedBox(width: 6),
                    Text("Live",
                        style: TextStyle(
                            color: Colors.purple[700],
                            fontWeight: FontWeight.bold,
                            fontSize: 12))
                  ]))
            ],
          ),
          const SizedBox(height: 24),
          _buildInsightCard(
              "At-Risk Students Detected",
              "2 students showing a 15% drop in attendance over the last two weeks.",
              Icons.warning_amber_rounded,
              Colors.orange),
          const SizedBox(height: 16),
          _buildInsightCard(
              "Skill Gap: Python Loops",
              "60% of the class spent 3x longer on the 'For Loops' PyLearn module.",
              Icons.trending_down,
              Colors.redAccent),
          const SizedBox(height: 16),
          _buildInsightCard(
              "Positive Trend: Robotics",
              "Class completion rate for 'Line Follower Robot' is 20% above school average.",
              Icons.trending_up,
              Colors.teal),
        ],
      ),
    );
  }

  Widget _buildInsightCard(
      String title, String desc, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[200]!)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                  color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color)),
          const SizedBox(width: 16),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 4),
                Text(desc,
                    style: TextStyle(color: Colors.grey[600], fontSize: 13))
              ]))
        ],
      ),
    );
  }

  void _showTimetableSetupDialog(Map<String, dynamic> subjects) {
    TimeOfDay startTime = const TimeOfDay(hour: 8, minute: 0);
    int periodDuration = 45;
    int totalPeriods = 6;
    List<Map<String, int>> breaks = [
      {'afterPeriod': 3, 'duration': 15}
    ];

    showDialog(
        context: context,
        builder: (context) =>
            StatefulBuilder(builder: (context, setDialogState) {
              return AlertDialog(
                  backgroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  title: const Text("Timetable Configuration"),
                  content: SingleChildScrollView(
                      child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text("Class Start Time"),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                  color: Colors.indigo[50],
                                  borderRadius: BorderRadius.circular(8)),
                              child: Text(startTime.format(context),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.indigo)),
                            ),
                            onTap: () async {
                              final time = await showTimePicker(
                                  context: context, initialTime: startTime);
                              if (time != null)
                                setDialogState(() => startTime = time);
                            }),
                        const SizedBox(height: 8),
                        TextFormField(
                          initialValue: periodDuration.toString(),
                          decoration: const InputDecoration(
                              labelText: "Duration of each period (mins)",
                              border: OutlineInputBorder()),
                          keyboardType: TextInputType.number,
                          onChanged: (v) =>
                              periodDuration = int.tryParse(v) ?? 45,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          initialValue: totalPeriods.toString(),
                          decoration: const InputDecoration(
                              labelText: "Total periods per day",
                              border: OutlineInputBorder()),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => totalPeriods = int.tryParse(v) ?? 6,
                        ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text("Breaks",
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 16)),
                            TextButton.icon(
                                onPressed: () => setDialogState(() => breaks
                                    .add({'afterPeriod': 3, 'duration': 15})),
                                icon: const Icon(Icons.add, size: 16),
                                label: const Text("Add Break"))
                          ],
                        ),
                        const Divider(),
                        ...breaks.asMap().entries.map((e) {
                          int idx = e.key;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(children: [
                              Expanded(
                                child: TextFormField(
                                  initialValue:
                                      e.value['afterPeriod'].toString(),
                                  decoration: const InputDecoration(
                                      labelText: "After Period",
                                      hintText: "e.g. 3",
                                      border: OutlineInputBorder()),
                                  keyboardType: TextInputType.number,
                                  onChanged: (v) => breaks[idx]['afterPeriod'] =
                                      int.tryParse(v) ?? 3,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextFormField(
                                  initialValue: e.value['duration'].toString(),
                                  decoration: const InputDecoration(
                                      labelText: "Duration (mins)",
                                      border: OutlineInputBorder()),
                                  keyboardType: TextInputType.number,
                                  onChanged: (v) => breaks[idx]['duration'] =
                                      int.tryParse(v) ?? 15,
                                ),
                              ),
                              IconButton(
                                  icon: const Icon(Icons.delete,
                                      color: Colors.red),
                                  onPressed: () => setDialogState(
                                      () => breaks.removeAt(idx)))
                            ]),
                          );
                        }).toList(),
                      ])),
                  actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text("Cancel")),
                    ElevatedButton(
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo,
                            foregroundColor: Colors.white),
                        onPressed: () async {
                          if (mounted) Navigator.pop(context);
                          await _generateTimetable(subjects, startTime,
                              periodDuration, totalPeriods, breaks);
                        },
                        child: const Text("Generate Timetable"))
                  ]);
            }));
  }

  Future<void> _generateTimetable(
      Map<String, dynamic> subjects,
      TimeOfDay start,
      int periodDuration,
      int totalPeriods,
      List<Map<String, int>> breaks) async {
    // 1. Generate local time slots for the configuration
    List<Map<String, dynamic>> timeSlots = [];
    DateTime currentTime = DateTime(2024, 1, 1, start.hour, start.minute);

    int periodCount = 1;
    while (periodCount <= totalPeriods) {
      DateTime endTime = currentTime.add(Duration(minutes: periodDuration));
      timeSlots.add({
        'label': 'Period $periodCount',
        'isBreak': false,
        'startTime':
            "${currentTime.hour.toString().padLeft(2, '0')}:${currentTime.minute.toString().padLeft(2, '0')}",
        'endTime':
            "${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}"
      });
      currentTime = endTime;

      var potentialBreaks = breaks
          .cast<Map<String, int>>()
          .where((b) => b['afterPeriod'] == periodCount);
      if (potentialBreaks.isNotEmpty) {
        var brk = potentialBreaks.first;
        DateTime breakEnd =
            currentTime.add(Duration(minutes: brk['duration']!));
        timeSlots.add({
          'label': 'Break',
          'isBreak': true,
          'startTime':
              "${currentTime.hour.toString().padLeft(2, '0')}:${currentTime.minute.toString().padLeft(2, '0')}",
          'endTime':
              "${breakEnd.hour.toString().padLeft(2, '0')}:${breakEnd.minute.toString().padLeft(2, '0')}"
        });
        currentTime = breakEnd;
      }
      periodCount++;
    }

    // Helper to convert "HH:mm" to minutes since midnight
    int _parseMins(String timeStr) {
      final parts = timeStr.split(':');
      if (parts.length != 2) return 0;
      return int.parse(parts[0]) * 60 + int.parse(parts[1]);
    }

    // 2. Fetch ALL classes to build cross-class teacher occupancy map
    final allClassesSnapshot =
        await FirebaseFirestore.instance.collection('classes').get();

    // Map: Day -> List of Occupied Blocks ({ teacherId, startMins, endMins })
    Map<String, List<Map<String, dynamic>>> globalOccupancy = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': []
    };

    for (var doc in allClassesSnapshot.docs) {
      if (doc.id == widget.classId) continue; // Skip current class

      final docData = doc.data();
      final otherTimetable =
          (docData['timetable'] as Map<String, dynamic>?) ?? {};
      final otherConfig = (docData['timetableConfig'] as List<dynamic>?) ?? [];
      final otherSubjects =
          (docData['subjects'] as Map<String, dynamic>?) ?? {};

      if (otherTimetable.isEmpty || otherConfig.isEmpty) continue;

      for (String day in globalOccupancy.keys) {
        List<dynamic> daySchedule = otherTimetable[day] ?? [];
        for (int i = 0; i < otherConfig.length; i++) {
          if (i >= daySchedule.length) continue;

          bool isBreak = otherConfig[i]['isBreak'] == true;
          if (isBreak) continue;

          String subjectName = daySchedule[i].toString();
          if (subjectName == 'Free' || subjectName == 'Break') continue;

          // Find teacher for this subject
          final teacherData = otherSubjects[subjectName];
          if (teacherData != null && teacherData['teacherId'] != null) {
            String tId = teacherData['teacherId'].toString();
            int sMins = _parseMins(otherConfig[i]['startTime'].toString());
            int eMins = _parseMins(otherConfig[i]['endTime'].toString());

            globalOccupancy[day]!
                .add({'teacherId': tId, 'startMins': sMins, 'endMins': eMins});
          }
        }
      }
    }

    final days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    Map<String, List<String>> newSchedule = {};
    List<String> allAvailableSubjects = subjects.keys.toList();

    for (String day in days) {
      List<String> dailySchedule = [];

      // Initialize a fresh queue for the day and shuffle it
      List<String> subjectQueue = List.from(allAvailableSubjects);
      subjectQueue.shuffle();

      for (var slot in timeSlots) {
        if (slot['isBreak']) {
          dailySchedule.add('Break');
        } else {
          if (allAvailableSubjects.isNotEmpty) {
            int currentSlotStart = _parseMins(slot['startTime']);
            int currentSlotEnd = _parseMins(slot['endTime']);

            // Filter the CURRENT queue to only those whose teacher is free
            List<String> collisionFreeInQueue = subjectQueue.where((subName) {
              final teacherData = subjects[subName];
              if (teacherData == null || teacherData['teacherId'] == null)
                return true;

              String currentTeacherId = teacherData['teacherId'].toString();
              for (var occ in globalOccupancy[day]!) {
                if (occ['teacherId'] == currentTeacherId) {
                  int maxStart = currentSlotStart > occ['startMins']
                      ? currentSlotStart
                      : occ['startMins'] as int;
                  int minEnd = currentSlotEnd < occ['endMins']
                      ? currentSlotEnd
                      : occ['endMins'] as int;
                  if (maxStart < minEnd) return false;
                }
              }
              return true;
            }).toList();

            // If no one in the current queue is free, check if ANY teacher in the full list is free
            if (collisionFreeInQueue.isEmpty) {
              List<String> allCollisionFree =
                  allAvailableSubjects.where((subName) {
                final teacherData = subjects[subName];
                if (teacherData == null || teacherData['teacherId'] == null)
                  return true;
                String currentTeacherId = teacherData['teacherId'].toString();
                for (var occ in globalOccupancy[day]!) {
                  if (occ['teacherId'] == currentTeacherId) {
                    int maxStart = currentSlotStart > occ['startMins']
                        ? currentSlotStart
                        : occ['startMins'] as int;
                    int minEnd = currentSlotEnd < occ['endMins']
                        ? currentSlotEnd
                        : occ['endMins'] as int;
                    if (maxStart < minEnd) return false;
                  }
                }
                return true;
              }).toList();

              if (allCollisionFree.isEmpty) {
                dailySchedule.add('Free'); // Literally no teacher is available
                continue;
              } else {
                // Refill queue with the available ones and shuffle
                subjectQueue = List.from(allCollisionFree);
                subjectQueue.shuffle();
                collisionFreeInQueue = subjectQueue;
              }
            }

            // Pick the first valid subject from our queue
            String chosenSubject = collisionFreeInQueue.first;

            // Try not to immediately repeat the last subject if possible
            if (dailySchedule.isNotEmpty &&
                dailySchedule.last == chosenSubject &&
                collisionFreeInQueue.length > 1) {
              chosenSubject = collisionFreeInQueue[1];
            }

            dailySchedule.add(chosenSubject);

            // Remove it from the queue so we don't pick it again until the queue is empty
            subjectQueue.remove(chosenSubject);

            // If the queue is now empty, refill it for the next periods today
            if (subjectQueue.isEmpty) {
              subjectQueue = List.from(allAvailableSubjects);
              subjectQueue.shuffle();
              // Ensure the new queue doesn't start with the subject we just placed
              if (subjectQueue.first == chosenSubject &&
                  subjectQueue.length > 1) {
                String temp = subjectQueue[0];
                subjectQueue[0] = subjectQueue[1];
                subjectQueue[1] = temp;
              }
            }

            // Register occupancy
            final tData = subjects[chosenSubject];
            if (tData != null && tData['teacherId'] != null) {
              globalOccupancy[day]!.add({
                'teacherId': tData['teacherId'].toString(),
                'startMins': currentSlotStart,
                'endMins': currentSlotEnd
              });
            }
          } else {
            dailySchedule.add('Free');
          }
        }
      }
      newSchedule[day] = dailySchedule;
    }

    await FirebaseFirestore.instance
        .collection('classes')
        .doc(widget.classId)
        .set({'timetable': newSchedule, 'timetableConfig': timeSlots},
            SetOptions(merge: true));

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content:
              Text("AI Smart Timetable Generated with Collision Detection!")));
    }
  }

  Widget _buildTimetableTab() {
    final timetable = (_classData?['timetable'] as Map<String, dynamic>?) ?? {};
    final config = (_classData?['timetableConfig'] as List<dynamic>?) ?? [];
    final subjects = (_classData?['subjects'] as Map<String, dynamic>?) ?? {};
    final days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    if (timetable.isEmpty || config.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_month_outlined,
                size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text("No timetable generated yet.",
                style: TextStyle(color: Colors.grey[500])),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                if (subjects.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text(
                          "Add subjects first before generating a schedule.")));
                  return;
                }
                _showTimetableSetupDialog(subjects);
              },
              icon: const Icon(Icons.settings, size: 16),
              label: const Text("Configure & Generate Schedule"),
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12))),
            )
          ],
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Weekly Timetable",
                  style: GoogleFonts.poppins(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              Row(
                children: [
                  TextButton.icon(
                    onPressed: () async {
                      String csv = "Day,";
                      csv += config.map((c) => c['label']).join(",") + "\n";
                      for (String day in days) {
                        List<dynamic> classes = timetable[day] ?? [];
                        List<String> rowStrings = [day];
                        for (int i = 0; i < config.length; i++) {
                          rowStrings.add(i < classes.length
                              ? classes[i].toString()
                              : "Free");
                        }
                        csv += rowStrings.join(",") + "\n";
                      }
                      final uri = Uri.parse(
                          "data:text/csv;charset=utf-8,${Uri.encodeComponent(csv)}");
                      if (await canLaunchUrl(uri)) {
                        await launchUrl(uri);
                      } else {
                        if (mounted)
                          ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text("Could not export CSV")));
                      }
                    },
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text("Export CSV"),
                  ),
                  IconButton(
                    onPressed: () async {
                      await FirebaseFirestore.instance
                          .collection('classes')
                          .doc(widget.classId)
                          .update({
                        'timetable': FieldValue.delete(),
                        'timetableConfig': FieldValue.delete()
                      });
                    },
                    icon: const Icon(Icons.refresh, color: Colors.indigo),
                  ),
                ],
              )
            ],
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            scrollDirection: Axis.vertical,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(Colors.indigo[50]),
                dataRowMinHeight: 60,
                dataRowMaxHeight: 60,
                columns: [
                  const DataColumn(
                      label: Text('Day',
                          style: TextStyle(fontWeight: FontWeight.bold))),
                  ...config
                      .map((c) => DataColumn(
                              label: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                Text(c['label'].toString(),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold)),
                                Text("${c['startTime']} - ${c['endTime']}",
                                    style: const TextStyle(
                                        fontSize: 10, color: Colors.grey)),
                              ])))
                      .toList()
                ],
                rows: days.map((day) {
                  List<dynamic> classesThatDay = timetable[day] ?? [];
                  return DataRow(cells: [
                    DataCell(Text(day,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.indigo))),
                    ...List.generate(config.length, (i) {
                      String p = i < classesThatDay.length
                          ? classesThatDay[i].toString()
                          : "Free";
                      bool isBreak = config[i]['isBreak'] == true;
                      return DataCell(Chip(
                          label: Text(p,
                              style: TextStyle(
                                  fontSize: 12,
                                  color: isBreak
                                      ? Colors.purple[700]
                                      : Colors.blueGrey[800],
                                  fontWeight: isBreak
                                      ? FontWeight.bold
                                      : FontWeight.normal)),
                          backgroundColor: isBreak
                              ? Colors.purple[50]
                              : (p == "Free"
                                  ? Colors.grey[100]
                                  : Colors.blue[50]),
                          side: BorderSide.none));
                    })
                  ]);
                }).toList(),
              ),
            ),
          ),
        )
      ],
    );
  }

  Widget _buildSubjectsTab() {
    final subjects = (_classData?['subjects'] as Map<String, dynamic>?) ?? {};
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Subjects",
                  style: GoogleFonts.poppins(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                onPressed: _showAddSubjectDialog,
                icon: const Icon(Icons.add, size: 16),
                label: const Text("Add Subject"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: subjects.isEmpty
              ? const Center(
                  child: Text("No subjects assigned",
                      style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  itemCount: subjects.length,
                  itemBuilder: (context, index) {
                    String subjName = subjects.keys.elementAt(index);
                    Map<String, dynamic> projData =
                        subjects[subjName] as Map<String, dynamic>;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[200]!)),
                      child: ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                              color: Colors.indigo[50],
                              borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.book, color: Colors.indigo),
                        ),
                        title: Text(subjName,
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(
                            "Teacher: ${projData['teacherName'] ?? 'Unassigned'}",
                            style: TextStyle(color: Colors.blueGrey[400])),
                      ),
                    );
                  },
                ),
        )
      ],
    );
  }

  Widget _buildStudentsTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(24),
          child: Text("Enrolled Students",
              style: GoogleFonts.poppins(
                  fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('users')
                .where('role', isEqualTo: 'student')
                .where('schoolId', isEqualTo: widget.schoolId)
                .where('class', isEqualTo: widget.className)
                .snapshots(),
            builder: (context, snapshot) {
              if (!snapshot.hasData)
                return const Center(child: CircularProgressIndicator());
              final students = snapshot.data!.docs;

              if (students.isEmpty)
                return const Center(
                    child: Text("No students enrolled in this class yet.",
                        style: TextStyle(color: Colors.grey)));

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: students.length,
                itemBuilder: (context, index) {
                  final s = students[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[200]!)),
                    child: ListTile(
                      leading: CircleAvatar(
                          backgroundColor: Colors.blueGrey[100],
                          child: const Icon(Icons.person, color: Colors.white)),
                      title: Text(s['name'] ?? 'Unknown Student',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(s['email'] ?? '',
                          style: TextStyle(color: Colors.blueGrey[400])),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTeachersTab() {
    // Collect all unique teachers from classTeacher and subjects
    Set<String> teacherNames = {};
    if (_classData?['classTeacherName'] != null &&
        _classData!['classTeacherName'].toString().isNotEmpty) {
      teacherNames.add(_classData!['classTeacherName'] + " (Class Teacher)");
    }

    final subjects = (_classData?['subjects'] as Map<String, dynamic>?) ?? {};
    subjects.forEach((key, value) {
      if (value['teacherName'] != null) {
        teacherNames.add(value['teacherName'] + " ($key)");
      }
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(24),
          child: Text("Assigned Teachers",
              style: GoogleFonts.poppins(
                  fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        Expanded(
          child: teacherNames.isEmpty
              ? const Center(
                  child: Text("No teachers assigned yet.",
                      style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  itemCount: teacherNames.length,
                  itemBuilder: (context, index) {
                    final name = teacherNames.elementAt(index);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[200]!)),
                      child: ListTile(
                        leading: CircleAvatar(
                            backgroundColor: Colors.indigo[100],
                            child:
                                const Icon(Icons.person, color: Colors.indigo)),
                        title: Text(name,
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text("Class ${widget.className}",
            style: GoogleFonts.poppins(
                color: Colors.blueGrey[900], fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.blueGrey[900]),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.indigo,
          unselectedLabelColor: Colors.grey,
          indicatorColor: Colors.indigo,
          tabs: const [
            Tab(text: "Overview"),
            Tab(text: "Insights"), // NEW
            Tab(text: "Timetable"), // NEW
            Tab(text: "Subjects"),
            Tab(text: "Students"),
            Tab(text: "Teachers"),
          ],
        ),
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('classes')
            .doc(widget.classId)
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData)
            return const Center(child: CircularProgressIndicator());

          if (!snapshot.data!.exists) {
            return const Center(child: Text("Class not found"));
          }

          _classData = snapshot.data!.data() as Map<String, dynamic>;

          return TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(),
              _buildInsightsTab(), // NEW
              _buildTimetableTab(), // NEW
              _buildSubjectsTab(),
              _buildStudentsTab(),
              _buildTeachersTab(),
            ],
          );
        },
      ),
    );
  }
}
