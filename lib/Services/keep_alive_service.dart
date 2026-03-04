import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class KeepAliveService {
  // Singleton pattern
  static final KeepAliveService _instance = KeepAliveService._internal();
  factory KeepAliveService() => _instance;
  KeepAliveService._internal();

  Timer? _timer;
  final String _targetUrl = "https://edu-ai-backend-vl7s.onrender.com/";
  final Duration _interval = const Duration(seconds: 20);

  void start() {
    if (_timer != null && _timer!.isActive) return;

    debugPrint("🚀 KeepAliveService: Starting ping to $_targetUrl every ${_interval.inSeconds}s");
    
    // Initial ping immediately
    _ping();

    _timer = Timer.periodic(_interval, (timer) {
      _ping();
    });
  }

  Future<void> _ping() async {
    try {
      final response = await http.get(Uri.parse(_targetUrl));
      debugPrint("💓 KeepAlive Ping: ${response.statusCode}");
    } catch (e) {
      debugPrint("⚠️ KeepAlive Error: $e");
    }
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    debugPrint("🛑 KeepAliveService: Stopped");
  }
}
