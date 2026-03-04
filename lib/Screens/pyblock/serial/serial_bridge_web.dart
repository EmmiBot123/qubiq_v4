import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'serial_bridge_interface.dart';

class SerialBridgeWeb implements SerialBridge {
  final Function(Uint8List) onDataReceived;
  final Function(String) onError;

  SerialBridgeWeb({required this.onDataReceived, required this.onError});

  @override
  List<String> getAvailablePorts() {
    debugPrint("Web Serial: Port listing handled by browser.");
    return [];
  }

  @override
  bool connect(String address, {int baudRate = 9600}) {
    debugPrint("Web Serial: Connection handled by browser.");
    return false;
  }

  @override
  void write(Uint8List data) {
    debugPrint("Web Serial: Write handled by browser.");
  }

  @override
  void disconnect() {
    debugPrint("Web Serial: Disconnect handled by browser.");
  }

  @override
  bool get isConnected => false;
}

SerialBridge getSerialBridge({
  required Function(Uint8List) onDataReceived,
  required Function(String) onError,
}) => SerialBridgeWeb(onDataReceived: onDataReceived, onError: onError);
