import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ProxyService {
  final String _baseUrl = 'https://edu-ai-backend-vl7s.onrender.com/proxy/chat';

  Future<String> sendRequest(
      {required String prompt,
      required String botType,
      String? model,
      List<String>? modalities}) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception("User not logged in");
      }

      final token = await user.getIdToken();

      // Fetch user document to get schoolId
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get();
      if (!userDoc.exists) {
        throw Exception("User profile not found");
      }

      final schoolId = userDoc.data()?['schoolId'];
      if (schoolId == null) {
        throw Exception("School ID missing in user profile");
      }

      debugPrint(
          "🚀 Proxy Request: $botType | Model: $model | Modalities: $modalities | School: $schoolId | Prompt: $prompt");

      final Map<String, dynamic> body = {
        'prompt': prompt,
        'botType': botType,
        'schoolId': schoolId,
      };

      if (model != null) {
        body['model'] = model;
      }

      if (modalities != null) {
        body['modalities'] = modalities; // Assuming backend wants this key
      }

      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );

      debugPrint("📩 Proxy Status: ${response.statusCode}");

      if (response.statusCode == 200) {
        // Assuming the backend returns the raw text response or a JSON with a 'response' field.
        try {
          final data = jsonDecode(response.body);
          if (data is Map && data.containsKey('response')) {
            return data['response'];
          } else if (data is Map && data.containsKey('reply')) {
            // Common alternate key
            return data['reply'];
          }
          return response.body;
        } catch (e) {
          return response.body;
        }
      } else {
        throw Exception(
            "Backend Error: ${response.statusCode} - ${response.body}");
      }
    } catch (e) {
      debugPrint("❌ Proxy Error: $e");
      throw Exception("Failed to get AI response: $e");
    }
  }

  Future<String> sendImageRequest({required String prompt}) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception("User not logged in");
      }

      final token = await user.getIdToken();

      // Fetch user document to get schoolId
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get();
      if (!userDoc.exists) {
        throw Exception("User profile not found");
      }

      final schoolId = userDoc.data()?['schoolId'];
      if (schoolId == null) {
        throw Exception("School ID missing in user profile");
      }

      debugPrint("🚀 Proxy Image Request: School: $schoolId | Prompt: $prompt");

      final response = await http.post(
        Uri.parse(
            'https://edu-ai-backend-vl7s.onrender.com/proxy/image'), // Dedicated image endpoint
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'prompt': prompt,
          'schoolId': schoolId,
          // Add default parameters required by many providers (like Sourceful)
          'width': 512,
          'height': 512,
          'steps': 30,
        }),
      );

      debugPrint("📩 Proxy Status: ${response.statusCode}");

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data.containsKey('image')) {
          return data['image']; // Backend returns { "image": "url" }
        }
        // Fallback if backend returns differently
        return response.body;
      } else {
        throw Exception(
            "Backend Error: ${response.statusCode} - ${response.body}");
      }
    } catch (e) {
      debugPrint("❌ Proxy Error: $e");
      throw Exception("Failed to generate image: $e");
    }
  }
}
