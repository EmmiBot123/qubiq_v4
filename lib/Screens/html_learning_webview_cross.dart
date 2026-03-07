export 'html_learning_webview_platform_interface.dart'
    if (dart.library.html) 'html_learning_webview_web.dart'
    if (dart.library.io) 'html_learning_webview_native.dart';
