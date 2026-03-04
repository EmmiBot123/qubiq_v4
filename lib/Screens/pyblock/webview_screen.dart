import 'dart:async';
import 'dart:collection';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';
import 'serial/serial_bridge.dart';

class PyBlocksWebview extends StatefulWidget {
  const PyBlocksWebview({super.key});

  @override
  State<PyBlocksWebview> createState() => _PyBlocksWebviewState();
}

class _PyBlocksWebviewState extends State<PyBlocksWebview> {
  final GlobalKey webViewKey = GlobalKey();
  InAppWebViewController? webViewController;
  InAppLocalhostServer? localhostServer;
  bool isServerRunning = false;
  SerialBridge? _serialBridge;

  @override
  void initState() {
    super.initState();
    _startLocalServer();

    // Initialize Serial Bridge (Only needed for Native)
    // On Web, the browser handles it natively.
    if (!kIsWeb) {
      _serialBridge = createSerialBridge(
        onDataReceived: (data) {
          try {
            webViewController?.evaluateJavascript(
              source: """
                  if (window.serialPolyfill && window.serialPolyfill.activePort) {
                      window.serialPolyfill.activePort.emitData([${data.join(',')}]);
                  }
              """,
            );
          } catch (e) {
            debugPrint("Error sending data to JS: $e");
          }
        },
        onError: (error) {
          debugPrint("Serial Bridge Error: $error");
          webViewController?.evaluateJavascript(
            source: "console.error('Bridge Error: $error')",
          );
        },
      );
    }
  }

  Future<void> _startLocalServer() async {
    if (kIsWeb) {
      // On Web, we don't need a local server. The assets are served by the browser.
      setState(() {
        isServerRunning = true;
      });
      return;
    }

    // Start localhost server to serve assets (avoids CORS and file protocol issues)
    localhostServer = InAppLocalhostServer(
      documentRoot: 'assets/www',
      port: 8080,
    );
    try {
      await localhostServer?.start();
      setState(() {
        isServerRunning = true;
      });
      debugPrint("Localhost server started on port 8080");
    } catch (e) {
      debugPrint("Error starting localhost server: $e");
    }
  }

  @override
  void dispose() {
    localhostServer?.close();
    _serialBridge?.disconnect();
    super.dispose();
  }

  // JavaScript Polyfill for Web Serial API
  // Only inject this on Native platforms where navigator.serial is missing/unsupported in WebView
  final String _serialPolyfill = """
    console.log("Initializing Web Serial Polyfill...");
    
    class SerialPortPolyfill {
        constructor(id) {
            this.id = id;
            this.onDisconnect = null;
            this.readable = this._createReadable();
            this.writable = this._createWritable();
            this.connected = false;
        }

        async open(options) {
            console.log("Opening port with options:", options);
            const baudRate = options.baudRate || 9600;
            const success = await window.flutter_inappwebview.callHandler('serialOpen', {
                address: this.id,
                baudRate: baudRate
            });
            if (!success) throw new Error("Failed to open port");
            this.connected = true;
            window.serialPolyfill.activePort = this;
        }

        async close() {
             await window.flutter_inappwebview.callHandler('serialClose');
             this.connected = false;
        }
        
        // Internal method to trigger data reception from Dart
        emitData(byteArray) {
             if (this._controller) {
                 this._controller.enqueue(new Uint8Array(byteArray));
             }
        }

        _createReadable() {
            return new ReadableStream({
                start: (controller) => {
                    this._controller = controller;
                }
            });
        }

        _createWritable() {
            return new WritableStream({
                write: (chunk) => {
                    // Send to Dart
                    const data = Array.from(chunk); // Convert Uint8Array to plain array
                    window.flutter_inappwebview.callHandler('serialWrite', data);
                }
            });
        }
    }

    window.serialPolyfill = {
        activePort: null,
        ports: []
    };

    navigator.serial = {
        requestPort: async function() {
            // Ask Flutter to show port selection dialog
            const portPath = await window.flutter_inappwebview.callHandler('serialRequestPort');
            if (!portPath) throw new Error("No port selected");
            
            const port = new SerialPortPolyfill(portPath);
            return port;
        },
        getPorts: async function() {
            return []; // TODO: Implement persistent ports if needed
        }
    };
    console.log("Web Serial Polyfill injected!");
  """;

  @override
  Widget build(BuildContext context) {
    if (!isServerRunning) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: InAppWebView(
              key: webViewKey,
              initialUrlRequest: URLRequest(
                url: kIsWeb
                    ? WebUri("assets/assets/www/index.html") // Web path
                    : WebUri("http://127.0.0.1:8080/index.html"), // Native path
              ),
              initialSettings: InAppWebViewSettings(
                isInspectable: kDebugMode,
                mediaPlaybackRequiresUserGesture: false,
                allowsInlineMediaPlayback: true,
                iframeAllow: "camera; microphone; serial", // Added serial
                iframeAllowFullscreen: true,
              ),
              initialUserScripts: kIsWeb
                  ? UnmodifiableListView([])
                  : UnmodifiableListView<UserScript>([
                      UserScript(
                        source: _serialPolyfill,
                        injectionTime:
                            UserScriptInjectionTime.AT_DOCUMENT_START,
                      ),
                    ]),
              onWebViewCreated: (controller) {
                webViewController = controller;

                if (!kIsWeb) {
                  // Register Handlers (Native Only)
                  controller.addJavaScriptHandler(
                    handlerName: 'serialRequestPort',
                    callback: (args) async {
                      // Show native dialog to select port
                      final ports = _serialBridge?.getAvailablePorts() ?? [];
                      if (ports.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text("No serial ports found")),
                        );
                        return null;
                      }

                      // Simple dialog for selection
                      return await showDialog<String>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text("Select Serial Port"),
                          content: SizedBox(
                            width: double.maxFinite,
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: ports.length,
                              itemBuilder: (ctx, i) => ListTile(
                                title: Text(ports[i]),
                                onTap: () => Navigator.pop(ctx, ports[i]),
                              ),
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, null),
                              child: const Text("Cancel"),
                            ),
                          ],
                        ),
                      );
                    },
                  );

                  controller.addJavaScriptHandler(
                    handlerName: 'serialOpen',
                    callback: (args) async {
                      final data = args[0] as Map<String, dynamic>;
                      final String address = data['address'];
                      final int baudRate = data['baudRate'] ?? 9600;
                      return _serialBridge?.connect(address,
                              baudRate: baudRate) ??
                          false;
                    },
                  );

                  controller.addJavaScriptHandler(
                    handlerName: 'serialClose',
                    callback: (args) async {
                      _serialBridge?.disconnect();
                      return true;
                    },
                  );

                  controller.addJavaScriptHandler(
                    handlerName: 'serialWrite',
                    callback: (args) async {
                      final List<dynamic> data = args[0];
                      _serialBridge
                          ?.write(Uint8List.fromList(data.cast<int>()));
                    },
                  );
                }
              },
              onPermissionRequest: (controller, request) async {
                // Automatically grant camera/microphone permissions
                return PermissionResponse(
                  resources: request.resources,
                  action: PermissionResponseAction.GRANT,
                );
              },
              onConsoleMessage: (controller, consoleMessage) {
                debugPrint("JS Console: ${consoleMessage.message}");
              },
              onLoadStart: (controller, url) {
                debugPrint("Page started loading: $url");
              },
              onLoadStop: (controller, url) {
                debugPrint("Page finished loading: $url");
              },
              onReceivedError: (controller, request, error) {
                debugPrint(
                  "WebView Error: ${error.description} - Code: ${error.type}",
                );
              },
              onReceivedHttpError: (controller, request, errorResponse) {
                debugPrint(
                  "WebView HTTP Error: ${errorResponse.statusCode} - ${errorResponse.reasonPhrase}",
                );
              },
            ),
          ),
          Positioned(
            top: 50,
            left: 10,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => Navigator.of(context).pop(),
                borderRadius: BorderRadius.circular(30),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.8),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 5,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.arrow_back, color: Colors.black87),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
