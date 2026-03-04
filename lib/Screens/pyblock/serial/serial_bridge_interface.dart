import 'dart:typed_data';

abstract class SerialBridge {
  List<String> getAvailablePorts();
  bool connect(String address, {int baudRate = 9600});
  void write(Uint8List data);
  void disconnect();
  bool get isConnected;

  factory SerialBridge({
    required Function(Uint8List) onDataReceived,
    required Function(String) onError,
  }) {
    throw UnimplementedError("Use the platform-specific factory");
  }
}
