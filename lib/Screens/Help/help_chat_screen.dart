// import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;
import 'package:uuid/uuid.dart';
import 'package:little_emmi/Services/proxy_service.dart';

class HelpChatScreen extends StatefulWidget {
  const HelpChatScreen({super.key});

  @override
  State<HelpChatScreen> createState() => _HelpChatScreenState();
}

class _HelpChatScreenState extends State<HelpChatScreen> {
  final List<types.Message> _messages = [];
  final _user = const types.User(id: 'user-id');

  // ✅ UPDATED: Bot Name & Persona
  final _bot = const types.User(id: 'bot-id', firstName: 'EmmiBot');

  bool _isLoading = false;

  // ✅ UPDATED: Quick Questions specific to Emmi's new Hybrid Knowledge
  final List<String> _quickQuestions = [
    "My robot won't connect",
    "How do I use Flowchart?",
    "What sensors do you have?",
    "Generate a song with Suno",
  ];

  @override
  void initState() {
    super.initState();
    // ✅ UPDATED: Friendly EmmiBot Greeting
    _addMessage(types.TextMessage(
      author: _bot,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      id: const Uuid().v4(),
      text:
          "Hi! I'm EmmiBot 🤖. I can help you with your robot, your code, or AI tools. What are we building today?",
    ));
  }

  Future<void> _sendMessageToGemini(String text) async {
    try {
      final botReply = await ProxyService().sendRequest(
        prompt: text,
        botType: 'help_bot',
      );

      _addMessage(types.TextMessage(
        author: _bot,
        createdAt: DateTime.now().millisecondsSinceEpoch,
        id: const Uuid().v4(),
        text: botReply,
      ));
    } catch (e) {
      debugPrint("🔴 PROXY ERROR: $e");
      _showError("I can't reach the server. Check your internet!");
    }
  }

  void _handleSend(String text) async {
    if (text.trim().isEmpty) return;

    final textMessage = types.TextMessage(
      author: _user,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      id: const Uuid().v4(),
      text: text,
    );
    _addMessage(textMessage);

    setState(() => _isLoading = true);

    await _sendMessageToGemini(text);

    setState(() => _isLoading = false);
  }

  void _addMessage(types.Message message) {
    setState(() {
      _messages.insert(0, message);
    });
  }

  void _showError(String msg) {
    _addMessage(types.TextMessage(
      author: _bot,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      id: const Uuid().v4(),
      text: "⚠️ $msg",
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text("EmmiBot Help",
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0.5,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _quickQuestions.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    backgroundColor: Colors.white,
                    side: BorderSide(color: Colors.purple.withOpacity(0.2)),
                    label: Text(
                      _quickQuestions[index],
                      style: TextStyle(
                          color: Colors.purple.shade700, fontSize: 13),
                    ),
                    onPressed: () => _handleSend(_quickQuestions[index]),
                  ),
                );
              },
            ),
          ),
          Expanded(
            child: Chat(
              messages: _messages,
              onSendPressed: (partialText) => _handleSend(partialText.text),
              user: _user,
              typingIndicatorOptions: TypingIndicatorOptions(
                typingUsers: _isLoading ? [_bot] : [],
              ),
              theme: const DefaultChatTheme(
                  primaryColor: Colors.deepPurple,
                  secondaryColor: Colors.white,
                  inputBackgroundColor: Color(0xFFEFF6FF),
                  userNameTextStyle: TextStyle(
                      fontFamily: 'Avenir', fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
