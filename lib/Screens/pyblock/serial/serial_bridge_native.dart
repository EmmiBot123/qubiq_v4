import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter_libserialport/flutter_libserialport.dart';
import 'serial_bridge_interface.dart';

class SerialBridgeNative implements SerialBridge {
  SerialPort? _port;
  SerialPortReader? _reader;
  StreamSubscription? _subscription;
  final Function(Uint8List) onDataReceived;
  final Function(String) onError;

  SerialBridgeNative({required this.onDataReceived, required this.onError});

  @override
  List<String> getAvailablePorts() {
    try {
      return SerialPort.availablePorts;
    } catch (e) {
      debugPrint("Error listing ports: $e");
      return [];
    }
  }

  @override
  bool connect(String address, {int baudRate = 9600}) {
    try {
      disconnect();

      _port = SerialPort(address);
      if (!_port!.openReadWrite()) {
        onError("Failed to open port $address");
        return false;
      }

      final config = _port!.config;
      config.baudRate = baudRate;
      config.bits = 8;
      config.stopBits = 1;
      config.parity = 0; // None
      _port!.config = config;

      _reader = SerialPortReader(_port!);
      _subscription = _reader!.stream.listen(
        (data) {
          onDataReceived(data);
        },
        onError: (error) {
          onError("Read error: $error");
          disconnect();
        },
      );

      debugPrint("Connected to $address at $baudRate baud");
      return true;
    } catch (e) {
      onError("Connection exception: $e");
      return false;
    }
  }

  @override
  void write(Uint8List data) {
    if (_port == null || !_port!.isOpen) {
      onError("Port not open");
      return;
    }
    try {
      _port!.write(data);
    } catch (e) {
      onError("Write error: $e");
    }
  }

  @override
  void disconnect() {
    _subscription?.cancel();
    _subscription = null;
    _reader?.close();
    _reader = null;

    if (_port != null && _port!.isOpen) {
      _port!.close();
    }
    _port = null;
    debugPrint("Disconnected");
  }

  @override
  bool get isConnected => _port != null && _port!.isOpen;
}

SerialBridge getSerialBridge({
  required Function(Uint8List) onDataReceived,
  required Function(String) onError,
}) => SerialBridgeNative(onDataReceived: onDataReceived, onError: onError);
