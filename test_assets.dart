import 'dart:io';

void main() async {
  final urls = [
    'http://127.0.0.1:53555/assets/assets/web/dist/index.html',
    'http://127.0.0.1:53555/assets/web/dist/index.html',
    'http://127.0.0.1:53555/web/dist/index.html',
    'http://127.0.0.1:53555/assets/packages/qubiq_V3/assets/web/dist/index.html',
    'http://127.0.0.1:53555/assets/packages/qubiq_V3/assets/assets/web/dist/index.html',
    'http://localhost:53555/assets/assets/web/dist/index.html',
    'http://localhost:53555/assets/web/dist/index.html',
  ];

  for (final url in urls) {
    try {
      final request = await HttpClient().getUrl(Uri.parse(url));
      final response = await request.close();
      print('URL: $url -> Status: ${response.statusCode}');
    } catch (e) {
      print('URL: $url -> Error: $e');
    }
  }
}
