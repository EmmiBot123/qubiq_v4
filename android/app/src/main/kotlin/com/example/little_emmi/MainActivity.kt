package com.example.little_emmi

import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform

class MainActivity: FlutterActivity() {
    // This MUST match the channel name in your Dart files (PythonIdeScreen & FlowchartIdeScreen)
    private val CHANNEL = "com.qubiq.app/python"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // 1. Initialize Python for Android (Chaquopy)
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(this))
        }

        // 2. Set up the MethodChannel to listen for calls from Flutter
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "runPython") {
                val code = call.argument<String>("code")
                if (code != null) {
                    executePythonCode(code, result)
                } else {
                    result.error("INVALID", "Code cannot be null", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun executePythonCode(code: String, result: MethodChannel.Result) {
        try {
            val py = Python.getInstance()

            // 3. Redirect Python's stdout (print statements) to a string
            val sys = py.getModule("sys")
            val io = py.getModule("io")
            val textOutputStream = io.callAttr("StringIO")
            sys.put("stdout", textOutputStream)

            // 4. Execute the script
            py.getModule("__main__").callAttr("exec", code)

            // 5. Retrieve the output and send it back to Flutter
            val output = textOutputStream.callAttr("getvalue").toString()
            result.success(output)

        } catch (e: Exception) {
            // Return any Python errors (syntax, runtime) back to the app
            result.success("Error: ${e.message}")
        }
    }
}