export 'emmi_core_webview_platform_interface.dart'
    if (dart.library.html) 'emmi_core_webview_web.dart'
    if (dart.library.io) 'emmi_core_webview_native.dart';
