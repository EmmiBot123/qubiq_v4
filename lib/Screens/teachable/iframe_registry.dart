// Conditional export routing Web and Native to their respective dart compiler implementations
export 'iframe_registry_stub.dart'
    if (dart.library.js_interop) 'iframe_registry_web.dart';
