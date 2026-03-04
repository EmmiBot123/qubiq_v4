/**
 * PyBlocks - AI & Data Science Mocks for Skulpt
 * This script provides fake implementations for advanced Python libraries.
 */

(function () {
    if (typeof Sk !== 'undefined') {
        // Define module codes separately for clarity
        const modules = {
            "pandas": `
class DataFrame:
    def __init__(self, data=None):
        self.columns = []
        self.shape = (0, 0)
        print("Mock: DataFrame initialized")
    
    def head(self, n=5):
        print(f"Mock: Displaying first {n} rows")
        return self
    
    def describe(self):
        print("Mock: Generating statistical summary")
        return self
    
    def dropna(self):
        print("Mock: Dropping NA values")
        return self
    
    def fillna(self, value):
        print(f"Mock: Filling NA with {value}")
        return self

def read_csv(url):
    print(f"Mock: Loading CSV from '{url}'")
    return DataFrame()
`,
            "sklearn_selection": `
def train_test_split(X, y, test_size=0.2):
    print(f"Mock: Splitting data (test_size={test_size})")
    return [X, X, y, y]
`,
            "sklearn_base": `
class BaseMLModel:
    def fit(self, X, y):
        print(f"Mock: Training {self.__class__.__name__} model...")
    
    def predict(self, X):
        print(f"Mock: Making predictions with {self.__class__.__name__}")
        return [0] * len(X)

class LinearRegression(BaseMLModel): pass
class DecisionTreeClassifier(BaseMLModel): pass
class KNeighborsClassifier(BaseMLModel): pass

def accuracy_score(y_true, y_pred):
    print("Mock: Calculating accuracy score")
    return 0.85
`,
            "textblob": `
class Sentiment:
    def __init__(self):
        self.polarity = 0.5
        self.subjectivity = 0.6

class TextBlob:
    def __init__(self, text):
        self.text = text
        self.sentiment = Sentiment()
        print(f"Mock: Analyzing sentiment of '{text}'")
`,
            "pickle": `
def dump(obj, file):
    print("Mock: pickle.dump() - Serialized object to file.")

def load(file):
    print("Mock: pickle.load() - Deserialized object from file.")
    return {"status": "mock_data"}
`,
            "csv": `
class MockCSVStream:
    def __init__(self, mode):
        self.mode = mode
    def writerow(self, row):
        print(f"Mock: CSV writerow - {row}")
    def __iter__(self):
        print("Mock: CSV reader iterating...")
        return iter([["col1", "col2"], ["data1", "data2"]])

def reader(file, delimiter=','):
    print("Mock: csv.reader() initialized.")
    return MockCSVStream("read")

def writer(file, delimiter=','):
    print("Mock: csv.writer() initialized.")
    return MockCSVStream("write")
`,
            "serial": `
import _serial_native
class Serial:
    def __init__(self, port, baudrate=9600):
        _serial_native.init(baudrate)
        self.port = port
        self.baudrate = baudrate
    
    def write(self, data):
        _serial_native.write(data)
    
    def readline(self):
        return _serial_native.readline()

    @property
    def in_waiting(self):
        return _serial_native.in_waiting()
`
        };

        // Inject into Skulpt's internal file system
        Sk.builtinFiles = Sk.builtinFiles || { "files": {} };

        function addMock(path, code) {
            Sk.builtinFiles["files"][path] = code;
            Sk.builtinFiles["files"]["src/lib/" + path] = code;
        }

        // Pandas
        addMock("pandas/__init__.py", modules.pandas);

        // Scikit-Learn
        addMock("sklearn/__init__.py", "");
        addMock("sklearn/model_selection.py", modules.sklearn_selection);
        addMock("sklearn/linear_model.py", "from sklearn.base import LinearRegression");
        addMock("sklearn/tree.py", "from sklearn.base import DecisionTreeClassifier");
        addMock("sklearn/neighbors.py", "from sklearn.base import KNeighborsClassifier");
        addMock("sklearn/metrics.py", "from sklearn.base import accuracy_score");
        addMock("sklearn/base.py", modules.sklearn_base);

        // Others
        addMock("textblob/__init__.py", modules.textblob);
        addMock("pickle.py", modules.pickle);
        addMock("csv.py", modules.csv);
        addMock("serial.py", modules.serial);

        // --- REAL-TIME SERIAL NATIVE BRIDGE ---
        const serialNativeModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("_serial_native") };

            mod.init = new Sk.builtin.func(function (baud) {
                const jsBaud = Sk.ffi.remapToJs(baud);
                window.serialController.baudRate = jsBaud;
                return Sk.builtin.none.none$;
            });

            mod.write = new Sk.builtin.func(function (data) {
                const jsData = Sk.ffi.remapToJs(data);
                if (window.serialController.isConnected) {
                    window.serialController.write(jsData);
                } else {
                    throw new Sk.builtin.RuntimeError("Serial port not connected. Click 'Connect' button first.");
                }
                return Sk.builtin.none.none$;
            });

            mod.readline = new Sk.builtin.func(function () {
                if (!window.serialController.isConnected) {
                    throw new Sk.builtin.RuntimeError("Serial port not connected.");
                }

                const susp = new Sk.misceval.Suspension();
                susp.resume = function () {
                    if (window.isRunning === false) {
                        throw new Sk.builtin.RuntimeError("Execution stopped");
                    }
                    const line = window.serialController.readLine();
                    if (line !== null) return new Sk.builtin.str(line);
                    return Sk.misceval.promiseToSuspension(new Promise(r => setTimeout(r, 100)));
                };

                susp.data = {
                    type: "Sk.promise",
                    promise: new Promise((resolve, reject) => {
                        const check = () => {
                            if (window.isRunning === false) {
                                reject(new Sk.builtin.RuntimeError("Execution stopped"));
                                return;
                            }
                            const line = window.serialController.readLine();
                            if (line !== null) {
                                resolve(new Sk.builtin.str(line));
                            } else {
                                setTimeout(check, 10);
                            }
                        };
                        check();
                    })
                };
                return susp;
            });

            mod.in_waiting = new Sk.builtin.func(function () {
                return new Sk.builtin.int_(window.serialController.hasData() ? 1 : 0);
            });

            return mod;
        };

        Sk.builtinFiles["files"]["src/lib/_serial_native.js"] = "var $builtinmodule = " + serialNativeModuleCode.toString();
        Sk.builtinFiles["files"]["_serial_native.js"] = "var $builtinmodule = " + serialNativeModuleCode.toString();

        // OpenCV Mock (Native JS for window access)
        const cv2ModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("cv2") };

            const printMock = (msg) => {
                // Safe way to print to Skulpt console from JS
                if (Sk.onPrint) Sk.onPrint(msg + "\n");
                else console.log(msg);
            };

            mod.imread = new Sk.builtin.func(function (path) {
                const jsPath = Sk.ffi.remapToJs(path);
                printMock("Mock: Loading image from '" + jsPath + "'");

                if (jsPath === 'local_image' && window.__PYBLOCKS_LOCAL_IMAGE__) {
                    return new Sk.builtin.str(window.__PYBLOCKS_LOCAL_IMAGE__);
                }

                return new Sk.builtin.str("mock_image_data");
            });

            mod.resize = new Sk.builtin.func(function (img, size) {
                printMock("Mock: Resizing image to " + Sk.ffi.remapToJs(size));
                return img;
            });

            mod.blur = new Sk.builtin.func(function (img, ksize) {
                printMock("Mock: Blurring image with kernel " + Sk.ffi.remapToJs(ksize));
                return img;
            });

            mod.Canny = new Sk.builtin.func(function (img, t1, t2) {
                printMock("Mock: Canny edge detection (t1=" + Sk.ffi.remapToJs(t1) + ", t2=" + Sk.ffi.remapToJs(t2) + ")");
                return new Sk.builtin.str("gray");
            });

            mod.rectangle = new Sk.builtin.func(function (img, pt1, pt2, color, thickness) {
                printMock("Mock: Drawing rectangle from " + Sk.ffi.remapToJs(pt1) + " to " + Sk.ffi.remapToJs(pt2));
                return Sk.builtin.none.none$;
            });

            mod.putText = new Sk.builtin.func(function (img, text, org, font, scale, color, thickness) {
                printMock("Mock: Drawing text '" + Sk.ffi.remapToJs(text) + "' at " + Sk.ffi.remapToJs(org));
                return Sk.builtin.none.none$;
            });

            mod.cvtColor = new Sk.builtin.func(function (img, code) {
                printMock("Mock: Converting image color space");
                return Sk.ffi.remapToJs(code) === 6 ? new Sk.builtin.str("gray") : img;
            });

            mod.imshow = new Sk.builtin.func(function (winName, img) {
                printMock("Mock: Showing image in window '" + Sk.ffi.remapToJs(winName) + "'");
                if (window.__PYBLOCKS_PLT__) {
                    window.__PYBLOCKS_PLT__.showImage(Sk.ffi.remapToJs(img));
                }
                return Sk.builtin.none.none$;
            });

            mod.waitKey = new Sk.builtin.func(function (delay) {
                printMock("Mock: cv2.waitKey(" + (Sk.ffi.remapToJs(delay) || 0) + ") called.");
                return new Sk.builtin.int_(-1);
            });

            mod.COLOR_BGR2GRAY = new Sk.builtin.int_(6);
            mod.FONT_HERSHEY_SIMPLEX = new Sk.builtin.int_(0);

            return mod;
        };

        Sk.builtinFiles["files"]["src/lib/cv2.js"] = "var $builtinmodule = " + cv2ModuleCode.toString();
        // Compatibility paths
        Sk.builtinFiles["files"]["cv2.js"] = "var $builtinmodule = " + cv2ModuleCode.toString();
        Sk.builtinFiles["files"]["cv2/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["src/lib/cv2/__init__.py"] = "pass";

        // Facial Feature Mock (Native JS)
        const facialFeatureModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("facialfeature") };

            const printMock = (msg) => {
                if (Sk.onPrint) Sk.onPrint(msg + "\n");
                else console.log(msg);
            };

            mod.load = new Sk.builtin.func(function (path) {
                printMock("Mock: facialfeature.load('" + Sk.ffi.remapToJs(path) + "')");
                return new Sk.builtin.str("mock_facial_data");
            });

            mod.getcount = new Sk.builtin.func(function (img, feature) {
                const f = Sk.ffi.remapToJs(feature);
                printMock("Mock: facialfeature.getcount() - Counting " + f);
                return new Sk.builtin.int_(f === 'face' ? 2 : 4);
            });

            mod.gendercount = new Sk.builtin.func(function (img, gender) {
                const g = Sk.ffi.remapToJs(gender);
                printMock("Mock: facialfeature.gendercount() - Counting " + g);
                return new Sk.builtin.int_(1);
            });

            mod.expressioncount = new Sk.builtin.func(function (img, exp) {
                printMock("Mock: facialfeature.expressioncount() - Counting " + Sk.ffi.remapToJs(exp));
                return new Sk.builtin.int_(1);
            });

            mod.agelist = new Sk.builtin.func(function (img) {
                printMock("Mock: facialfeature.agelist() called");
                return new Sk.builtin.list([new Sk.builtin.int_(25), new Sk.builtin.int_(30)]);
            });

            mod.show = new Sk.builtin.func(function (img, border) {
                printMock("Mock: facialfeature.show() with border: " + Sk.ffi.remapToJs(border));
                if (window.__PYBLOCKS_PLT__) {
                    window.__PYBLOCKS_PLT__.showImage("mock_facial_data");
                }
                return Sk.builtin.none.none$;
            });

            return mod;
        };

        // playsound Mock (Native JS - using Web Speech API)
        const playsoundModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("playsound") };

            const printMock = (msg) => {
                if (Sk.onPrint) Sk.onPrint(msg + "\n");
                else console.log(msg);
            };

            mod.say = new Sk.builtin.func(function (text) {
                if (window.isRunning === false) {
                    throw new Sk.builtin.RuntimeError("Execution stopped");
                }
                const jsText = Sk.ffi.remapToJs(text);
                printMock("Mock: playsound.say('" + jsText + "')");

                if (!('speechSynthesis' in window)) {
                    printMock("Warning: Web Speech API not supported in this browser.");
                    return Sk.builtin.none.none$;
                }

                // Create a suspension to wait for speech to finish
                const susp = new Sk.misceval.Suspension();
                susp.resume = function () { return Sk.builtin.none.none$; };
                susp.data = {
                    type: "Sk.promise",
                    promise: new Promise((resolve) => {
                        const utterance = new SpeechSynthesisUtterance(jsText);

                        // Chrome GC bug fix: keep a reference
                        window._lastUtterance = utterance;

                        const timer = setTimeout(() => {
                            console.warn("Speech Synthesis safety timeout reached.");
                            resolve();
                        }, 5000 + (jsText.length * 100)); // Dynamic timeout based on text length

                        utterance.onend = function () {
                            clearTimeout(timer);
                            resolve();
                        };

                        utterance.onerror = function (err) {
                            console.error("Speech Error:", err);
                            clearTimeout(timer);
                            resolve();
                        };

                        if (window.isRunning === false) {
                            window.speechSynthesis.cancel();
                            clearTimeout(timer);
                            resolve();
                            return;
                        }

                        window.speechSynthesis.speak(utterance);
                    })
                };
                return susp;
            });

            return mod;
        };

        // Register facialfeature
        Sk.builtinFiles["files"]["src/lib/facialfeature.js"] = "var $builtinmodule = " + facialFeatureModuleCode.toString();
        Sk.builtinFiles["files"]["facialfeature.js"] = "var $builtinmodule = " + facialFeatureModuleCode.toString();
        Sk.builtinFiles["files"]["facialfeature/__init__.py"] = "pass";

        // Register playsound
        Sk.builtinFiles["files"]["src/lib/playsound.js"] = "var $builtinmodule = " + playsoundModuleCode.toString();
        Sk.builtinFiles["files"]["playsound.js"] = "var $builtinmodule = " + playsoundModuleCode.toString();
        Sk.builtinFiles["files"]["playsound/__init__.py"] = "pass";

        // Object Detection Mock (Native JS)
        const objectDetectModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("objectdetect") };

            const printMock = (msg) => {
                if (Sk.onPrint) Sk.onPrint(msg + "\n");
                else console.log(msg);
            };

            mod.load = new Sk.builtin.func(function (path) {
                printMock("Mock: objectdetect.load('" + Sk.ffi.remapToJs(path) + "')");
                return new Sk.builtin.str("mock_object_data");
            });

            mod.count = new Sk.builtin.func(function (img, obj_type) {
                const obj = Sk.ffi.remapToJs(obj_type);
                printMock("Mock: objectdetect.count() - Scanning for " + obj);
                return new Sk.builtin.int_(obj === 'aeroplane' ? 3 : 1);
            });

            mod.show = new Sk.builtin.func(function (img, show_border) {
                printMock("Mock: objectdetect.show() - with border: " + Sk.ffi.remapToJs(show_border));
                if (window.__PYBLOCKS_PLT__) {
                    window.__PYBLOCKS_PLT__.showImage("mock_object_data");
                }
                return Sk.builtin.none.none$;
            });

            return mod;
        };

        // Register objectdetect
        Sk.builtinFiles["files"]["src/lib/objectdetect.js"] = "var $builtinmodule = " + objectDetectModuleCode.toString();
        Sk.builtinFiles["files"]["objectdetect.js"] = "var $builtinmodule = " + objectDetectModuleCode.toString();
        // Teachable Machine Mock (Native JS)
        const teachablemachineModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("teachablemachine") };

            const printMock = (msg) => {
                if (Sk.onPrint) Sk.onPrint(msg + "\n");
                else console.log(msg);
            };

            mod.load_model = new Sk.builtin.func(function (url) {
                const jsUrl = Sk.ffi.remapToJs(url);
                printMock("Mock: Loading Teachable Machine model from '" + jsUrl + "'");
                return new Sk.builtin.str("mock_tm_model");
            });

            mod.webcam_on = new Sk.builtin.func(function () {
                if (window.webcamController) {
                    window.webcamController.start();
                }
                printMock("Mock: Webcam switched ON");
                return Sk.builtin.none.none$;
            });

            mod.webcam_off = new Sk.builtin.func(function () {
                if (window.webcamController) {
                    window.webcamController.stop();
                }
                printMock("Mock: Webcam switched OFF");
                return Sk.builtin.none.none$;
            });

            mod.capture = new Sk.builtin.func(function () {
                if (window.webcamController) {
                    const data = window.webcamController.capture();
                    printMock("Mock: Frame captured from webcam");
                    return new Sk.builtin.str(data || "mock_frame_data");
                }
                return new Sk.builtin.str("mock_frame_data");
            });

            mod.classify = new Sk.builtin.func(function (img, model) {
                printMock("Mock: Classifying image using Teachable Machine model...");
                // Return a mock result dictionary
                const result = {
                    "Class 1": 0.85,
                    "Class 2": 0.10,
                    "Other": 0.05
                };
                return Sk.ffi.remapToPy(result);
            });

            mod.get_prediction = new Sk.builtin.func(function (result, className) {
                const jsResult = Sk.ffi.remapToJs(result);
                const jsClass = Sk.ffi.remapToJs(className);
                const confidence = jsResult[jsClass] || 0.0;
                printMock("Mock: Prediction for '" + jsClass + "' is " + confidence);
                return new Sk.builtin.float_(confidence);
            });

            // --- VOICE/AUDIO MODEL FUNCTIONS ---
            mod.load_audio_model = new Sk.builtin.func(function (url) {
                const jsUrl = Sk.ffi.remapToJs(url);
                printMock("Mock: Loading Teachable Machine audio model from '" + jsUrl + "'");
                return new Sk.builtin.str("mock_tm_audio_model");
            });

            mod.mic_on = new Sk.builtin.func(function () {
                printMock("Mock: Microphone switched ON");
                return Sk.builtin.none.none$;
            });

            mod.mic_off = new Sk.builtin.func(function () {
                printMock("Mock: Microphone switched OFF");
                return Sk.builtin.none.none$;
            });

            mod.listen = new Sk.builtin.func(function () {
                printMock("Mock: Listening for audio...");
                return new Sk.builtin.str("mock_audio_data");
            });

            mod.classify_audio = new Sk.builtin.func(function (audio, model) {
                printMock("Mock: Classifying audio using Teachable Machine audio model...");
                const result = {
                    "Sound 1": 0.75,
                    "Sound 2": 0.20,
                    "Background Noise": 0.05
                };
                return Sk.ffi.remapToPy(result);
            });

            return mod;

        };

        // Register teachablemachine
        Sk.builtinFiles["files"]["src/lib/teachablemachine.js"] = "var $builtinmodule = " + teachablemachineModuleCode.toString();
        Sk.builtinFiles["files"]["teachablemachine.js"] = "var $builtinmodule = " + teachablemachineModuleCode.toString();
        Sk.builtinFiles["files"]["teachablemachine/__init__.py"] = "pass";
    }
})();
