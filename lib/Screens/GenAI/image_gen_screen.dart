import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:little_emmi/Services/proxy_service.dart';

class ImageGenScreen extends StatefulWidget {
  const ImageGenScreen({super.key});

  @override
  State<ImageGenScreen> createState() => _ImageGenScreenState();
}

class _ImageGenScreenState extends State<ImageGenScreen> {
  final TextEditingController _controller = TextEditingController();

  Uint8List? _imageBytes;
  String? _imageUrl;
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _generateImage() async {
    final prompt = _controller.text.trim();
    if (prompt.isEmpty) return;

    FocusScope.of(context).unfocus();
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _imageBytes = null;
      _imageUrl = null;
    });

    try {
      debugPrint("🚀 Sending request to Proxy (image_gen)...");

      final responseText = await ProxyService().sendImageRequest(
        prompt: prompt,
      );

      _parseImage(responseText);
    } catch (e) {
      debugPrint("❌ Error: $e");
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceAll("Exception: ", "");
        });
      }
    }
  }

  void _parseImage(String urlOrData) {
    if (urlOrData.startsWith("data:image")) {
      final base64String = urlOrData.split(",").last;
      _parseBase64(base64String);
    } else if (urlOrData.startsWith("http")) {
      setState(() {
        _imageUrl = urlOrData;
        _isLoading = false;
      });
    } else {
      // Received text or invalid data
      setState(() {
        _isLoading = false;
        _errorMessage =
            "Received text instead of image: ${urlOrData.length > 50 ? '${urlOrData.substring(0, 50)}...' : urlOrData}";
      });
      debugPrint("⚠️ Unexpected Image Gen Response: $urlOrData");
    }
  }

  void _parseBase64(String base64String) {
    try {
      final cleanString = base64String.replaceAll(RegExp(r'\s+'), '');
      final bytes = base64Decode(cleanString);
      setState(() {
        _imageBytes = bytes;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Base64 Decode Error: $e");
      throw Exception("Failed to decode image data");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E1E2C),
      appBar: AppBar(
        title: Text("Vision Forge",
            style: GoogleFonts.poppins(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white12),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_imageUrl == null &&
                        _imageBytes == null &&
                        !_isLoading &&
                        _errorMessage == null)
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.palette_outlined,
                              size: 60, color: Colors.white24),
                          const SizedBox(height: 10),
                          Text("Enter a prompt to start",
                              style:
                                  GoogleFonts.poppins(color: Colors.white54)),
                        ],
                      ),
                    if (_isLoading)
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const CircularProgressIndicator(
                                color: Colors.pinkAccent),
                            const SizedBox(height: 20),
                            Text("Generating With QubiQ Image Generation...",
                                style:
                                    GoogleFonts.poppins(color: Colors.white70)),
                          ],
                        ),
                      ),
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline,
                                color: Colors.redAccent, size: 40),
                            const SizedBox(height: 10),
                            Text("Generation Failed",
                                style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold)),
                            const SizedBox(height: 5),
                            Text(_errorMessage!,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                    color: Colors.white70, fontSize: 12)),
                          ],
                        ),
                      ),
                    if (_imageBytes != null && !_isLoading)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.memory(_imageBytes!, fit: BoxFit.contain)
                            .animate()
                            .fadeIn(),
                      ),
                    if (_imageUrl != null && !_isLoading)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.network(_imageUrl!, fit: BoxFit.contain)
                            .animate()
                            .fadeIn(),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(30),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: "e.g., Cyberpunk city...",
                        hintStyle:
                            TextStyle(color: Colors.white.withOpacity(0.4)),
                        border: InputBorder.none,
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 20),
                      ),
                      onSubmitted: (_) => _generateImage(),
                    ),
                  ),
                  IconButton(
                    icon: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.pinkAccent))
                        : const Icon(Icons.auto_awesome,
                            color: Colors.pinkAccent),
                    onPressed: _isLoading ? null : _generateImage,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
