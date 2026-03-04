import 'dart:typed_data';
import 'serial_bridge_interface.dart';

import 'serial_bridge_native.dart'
    if (dart.library.html) 'serial_bridge_web.dart';

export 'serial_bridge_interface.dart';

/// Factory to create the platform-specific SerialBridge
SerialBridge createSerialBridge({
  required Function(Uint8List) onDataReceived,
  required Function(String) onError,
}) {
  return getSerialBridge(onDataReceived: onDataReceived, onError: onError);
}
