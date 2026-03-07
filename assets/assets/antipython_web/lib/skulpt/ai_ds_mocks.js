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
        self.columns = ["col1", "col2", "col3"]
        self.shape = (5, 3)
        self.data = data
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

    def info(self):
        print("Mock: DataFrame Info")
        print(f"Columns: {self.columns}")
        print(f"Shape: {self.shape}")
    
    @property
    def iloc(self):
        class _Iloc:
            def __getitem__(self, item):
                print(f"Mock: df.iloc[{item}] accessed")
                return "Mock Row/Value"
        return _Iloc()

    @property
    def loc(self):
        class _Loc:
            def __getitem__(self, item):
                print(f"Mock: df.loc[{item}] accessed")
                return "Mock Row/Value"
        return _Loc()

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
        
    def score(self, X, y):
        print(f"Mock: Scoring {self.__class__.__name__}")
        return 0.88

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
            "tkinter_init": `
class Tk:
    def __init__(self):
        pass
    def withdraw(self):
        pass
`,
            "tkinter_filedialog": `
import _tkinter_native
def askopenfilename(**kwargs):
    print("Mock: tkinter.filedialog.askopenfilename called") 
    return _tkinter_native.askopenfilename()
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
`,
            "statistics": `
def mean(data):
    return sum(data) / len(data) if data else 0

def median(data):
    if not data: return 0
    s = sorted(data)
    n = len(s)
    m = n // 2
    if n % 2 == 0:
        return (s[m-1] + s[m]) / 2
    return s[m]

def mode(data):
    if not data: return None
    # Simple mode implementation without collections to avoid extra imports
    counts = {}
    for x in data:
        counts[x] = counts.get(x, 0) + 1
    max_count = max(counts.values())
    for k, v in counts.items():
        if v == max_count:
            return k
`,
            "seaborn": `
import matplotlib.pyplot as plt
def set_theme(style="darkgrid"):
    print(f"Mock: seaborn.set_theme(style='{style}')")

def lineplot(data=None, x=None, y=None, **kwargs):
    print("Mock: seaborn.lineplot()")
    plt.plot(x, y)

def scatterplot(data=None, x=None, y=None, **kwargs):
    print("Mock: seaborn.scatterplot()")
    plt.scatter(x, y)

def barplot(data=None, x=None, y=None, **kwargs):
    print("Mock: seaborn.barplot()")
    plt.bar(x, y)

def histplot(data=None, x=None, **kwargs):
    print("Mock: seaborn.histplot()")
    plt.hist(x)
`,
            "nltk": `
def word_tokenize(text):
    print("Mock: nltk.word_tokenize()")
    return text.split()

def sent_tokenize(text):
    print("Mock: nltk.sent_tokenize()")
    return [text]

class FreqDist:
    def __init__(self, words):
        self.words = words
        print("Mock: nltk.FreqDist initialized")
    def most_common(self, n=5):
        return []
`,
            "keras": `
class Sequential:
    def __init__(self, layers=None):
        print("Mock: keras.Sequential model initialized")
    def add(self, layer):
        print("Mock: Adding layer to model")
    def compile(self, optimizer='adam', loss='mse', metrics=None):
        print(f"Mock: Compiling model (optimizer='{optimizer}', loss='{loss}')")
    def fit(self, x, y, epochs=1, batch_size=32):
        print(f"Mock: Training model for {epochs} epochs...")
    def predict(self, x):
        print("Mock: Making predictions")
        return [0] * len(x)

class layers:
    class Dense:
        def __init__(self, units, activation=None, input_shape=None):
            print(f"Mock: Keras Dense layer ({units} units)")
`,
            "sklearn": `
class linear_model:
    class LinearRegression:
        def __init__(self):
            print("Mock: sklearn.linear_model.LinearRegression initialized")
        def fit(self, X, y):
            print(f"Mock: Fitting model with X={len(X)} samples")
        def predict(self, X):
            print("Mock: Predicting...")
            return [0] * len(X)
        def score(self, X, y):
            print("Mock: Calculating score...")
            return 0.95
`,
            "requests": `
class Response:
    def __init__(self, data, status_code=200):
        self.data = data
        self.status_code = status_code
    
    def json(self):
        return self.data
    
    @property
    def text(self):
        return str(self.data)

def get(url, **kwargs):
    print(f"Mock: requests.get('{url}')")
    # Simulate different responses based on URL
    if "users" in url:
        return Response([{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}])
    return Response({"message": "Success", "url": url})

def post(url, data=None, json=None, **kwargs):
    print(f"Mock: requests.post('{url}') with data={data} json={json}")
    return Response({"id": 101, "message": "Created successfully"}, 201)
`,
            "sqlite3": `
class Cursor:
    def execute(self, sql, params=None):
        print(f"Mock: Executing SQL -> {sql}")
        if params:
            print(f"      Params -> {params}")
        return self

    def fetchall(self):
        print("Mock: Cursor.fetchall()")
        # Return dummy data
        return [(1, "Alice", "alice@example.com"), (2, "Bob", "bob@example.com")]

    def fetchone(self):
        print("Mock: Cursor.fetchone()")
        return (1, "Alice", "alice@example.com")
    
    def close(self):
        print("Mock: Cursor closed")

class Connection:
    def cursor(self):
        return Cursor()
    
    def commit(self):
        print("Mock: Connection.commit()")
    
    def close(self):
        print("Mock: Connection closed")

def connect(database):
    print(f"Mock: Connecting to SQLite database '{database}'")
    return Connection()
`,
            "numpy": `
class ndarray:
    def __init__(self, data):
        self.data = data
        self.shape = (len(data),)
        print(f"Mock: Created numpy array with shape {self.shape}")

    def tolist(self):
        return self.data
    
    def __len__(self):
        return len(self.data)

def array(data):
    return ndarray(data)

def arange(start, stop=None, step=1):
    if stop is None:
        stop = start
        start = 0
    print(f"Mock: numpy.arange({start}, {stop}, {step})")
    return ndarray(list(range(start, stop, step)))

def linspace(start, stop, num=50):
    print(f"Mock: numpy.linspace({start}, {stop}, {num})")
    step = (stop - start) / (num - 1)
    return ndarray([start + step * i for i in range(num)])

def zeros(shape):
    print(f"Mock: numpy.zeros({shape})")
    if isinstance(shape, int):
        return ndarray([0.0] * shape)
    # Simplified: only support 1D or flat total size for mock
    total = 1
    for s in shape: total *= s
    return ndarray([0.0] * total)

def ones(shape):
    print(f"Mock: numpy.ones({shape})")
    if isinstance(shape, int):
        return ndarray([1.0] * shape)
    total = 1
    for s in shape: total *= s
    return ndarray([1.0] * total)

def mean(a):
    if hasattr(a, 'data'): nums = a.data
    else: nums = a
    return sum(nums) / len(nums) if nums else 0

def sum(a):
    if hasattr(a, 'data'): nums = a.data
    else: nums = a
    total = 0
    for x in nums: total += x
    return total

def argmax(a):
    # Mock argmax
    return 0

# Random Module Mock
import random as _py_random

class _RandomMock:
            def seed(self, a = None):
                _py_random.seed(a)
    
    def rand(self, * args):
        count = 1
        for d in args: count *= d
        return ndarray([_py_random.random() for _ in range(count)])
    
    def randn(self, * args):
        count = 1
        for d in args: count *= d
        return ndarray([_py_random.gauss(0, 1) for _ in range(count)])
    
    def normal(self, loc = 0.0, scale = 1.0, size = None):
        if size is None:
        return _py_random.gauss(loc, scale)
        if isinstance(size, int):
            return ndarray([_py_random.gauss(loc, scale) for _ in range(size)])
        count = 1
        for d in size: count *= d
        return ndarray([_py_random.gauss(loc, scale) for _ in range(count)])

        random = _RandomMock()

# Constants
        pi = 3.141592653589793

# Mathematical Functions(Mocked via Python's math or simple implementation if needed)
import math
def sin(x):
        if isinstance(x, ndarray):
            return ndarray([math.sin(v) for v in x.data])
        return math.sin(x)

def cos(x):
        if isinstance(x, ndarray):
            return ndarray([math.cos(v) for v in x.data])
        return math.cos(x)

def tan(x):
        if isinstance(x, ndarray):
            return ndarray([math.tan(v) for v in x.data])
        return math.tan(x)

def exp(x):
        if isinstance(x, ndarray):
            return ndarray([math.exp(v) for v in x.data])
        return math.exp(x)

def log(x):
        if isinstance(x, ndarray):
            return ndarray([math.log(v) for v in x.data])
        return math.log(x)

def sqrt(x):
        if isinstance(x, ndarray):
            return ndarray([math.sqrt(v) for v in x.data])
        return math.sqrt(x)
            `
        };

        // Inject into Skulpt's internal file system
        Sk.builtinFiles = Sk.builtinFiles || { "files": {} };

        function addMock(path, code) {
            Sk.builtinFiles["files"][path] = code;
            Sk.builtinFiles["files"]["src/lib/" + path] = code;
        }

        // Numpy
        addMock("numpy/__init__.py", modules.numpy);

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
        addMock("statistics.py", modules.statistics);
        addMock("seaborn/__init__.py", modules.seaborn);
        addMock("nltk/__init__.py", modules.nltk);
        addMock("keras/__init__.py", modules.keras);
        addMock("keras/layers.py", "from keras import layers");
        addMock("tensorflow/__init__.py", "import keras\nfrom keras import layers");
        addMock("tensorflow/keras/__init__.py", "from keras import *");
        addMock("tensorflow/keras/layers/__init__.py", "from keras.layers import *");

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

        Sk.builtinFiles["files"]["_serial_native.js"] = "var $builtinmodule = " + serialNativeModuleCode.toString();

        // Register Tkinter
        addMock("tkinter/__init__.py", modules.tkinter_init);
        addMock("tkinter/filedialog.py", modules.tkinter_filedialog);

        // --- TKINTER NATIVE BRIDGE ---
        const tkinterNativeModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("_tkinter_native") };

            mod.askopenfilename = new Sk.builtin.func(function (kwargs) {
                const susp = new Sk.misceval.Suspension();
                susp.resume = function () {
                    if (window.isRunning === false) {
                        throw new Sk.builtin.RuntimeError("Execution stopped");
                    }
                    // Check if file was selected
                    if (window.__tkinter_file_path !== undefined) {
                        return new Sk.builtin.str(window.__tkinter_file_path);
                    }
                    return Sk.misceval.promiseToSuspension(new Promise(r => setTimeout(r, 100)));
                };
                susp.data = {
                    type: "Sk.promise",
                    promise: new Promise((resolve, reject) => {
                        const fileInput = document.getElementById('python-file-input');
                        if (!fileInput) {
                            console.error("No file input found for tkinter mock");
                            resolve(new Sk.builtin.str(""));
                            return;
                        }

                        // Clean up old listener using replaceWith (Clone)
                        const newInput = fileInput.cloneNode(true);
                        fileInput.parentNode.replaceChild(newInput, fileInput);

                        // Reset
                        newInput.value = "";
                        window.__tkinter_file_path = undefined;

                        const changeHandler = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                // "Fake" path logic
                                // We'll also try to read it as data URL for potential image usage
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                    window.__PYBLOCKS_LOCAL_IMAGE__ = evt.target.result;
                                    window.__tkinter_file_path = "C:/fakepath/" + file.name;
                                    resolve(new Sk.builtin.str(window.__tkinter_file_path));
                                };
                                reader.readAsDataURL(file);
                            } else {
                                window.__tkinter_file_path = "";
                                resolve(new Sk.builtin.str(""));
                            }
                        };

                        newInput.addEventListener('change', changeHandler);
                        newInput.click();
                    })
                };
                return susp;
            });
            return mod;
        };
        Sk.builtinFiles["files"]["src/lib/_tkinter_native.js"] = "var $builtinmodule = " + tkinterNativeModuleCode.toString();
        Sk.builtinFiles["files"]["_tkinter_native.js"] = "var $builtinmodule = " + tkinterNativeModuleCode.toString();

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
                // Return a suspension to yield control to browser event loop
                var susp = new Sk.misceval.Suspension();
                susp.resume = function () {
                    return new Sk.builtin.int_(-1); // Always return -1 (no key pressed)
                };
                susp.data = {
                    type: "Sk.promise",
                    promise: new Promise(function (resolve) {
                        // Use a minimum delay of 1ms to ensure event loop yields
                        var ms = Sk.ffi.remapToJs(delay) || 1;
                        setTimeout(function () {
                            if (window.isRunning === false) {
                                resolve(); // Let Skulpt handle the interrupt
                            } else {
                                resolve();
                            }
                        }, ms);
                    })
                };
                return susp;
            });

            mod.COLOR_BGR2GRAY = new Sk.builtin.int_(6);
            mod.COLOR_BGR2RGB = new Sk.builtin.int_(4);
            mod.FONT_HERSHEY_SIMPLEX = new Sk.builtin.int_(0);

            // VideoCapture Mock
            mod.VideoCapture = new Sk.builtin.func(function (index) {
                printMock("Mock: cv2.VideoCapture(" + Sk.ffi.remapToJs(index) + ") opened.");

                // Start Webcam
                if (window.webcamController) {
                    window.webcamController.start();
                }

                var cap = new Sk.misceval.buildClass(mod, function ($gbl, $loc) {
                    $loc.read = new Sk.builtin.func(function (self) {
                        var susp = new Sk.misceval.Suspension();
                        susp.resume = function () {
                            if (window.webcamController) {
                                var frame = window.webcamController.capture();
                                return new Sk.builtin.tuple([
                                    Sk.builtin.bool.true$,
                                    new Sk.builtin.str(frame || "mock_frame")
                                ]);
                            }
                            return new Sk.builtin.tuple([Sk.builtin.bool.false$, Sk.builtin.none.none$]);
                        };
                        susp.data = {
                            type: "Sk.promise",
                            promise: new Promise(function (resolve) {
                                // Simulate ~30fps delay (30ms) to prevent freezing even without waitKey
                                setTimeout(function () {
                                    if (window.isRunning === false) {
                                        resolve();
                                    } else {
                                        resolve();
                                    }
                                }, 30);
                            })
                        };
                        return susp;
                    });

                    $loc.release = new Sk.builtin.func(function (self) {
                        printMock("Mock: cv2.VideoCapture released.");
                        if (window.webcamController) {
                            window.webcamController.stop();
                        }
                        return Sk.builtin.none.none$;
                    });

                    $loc.isOpened = new Sk.builtin.func(function (self) {
                        return Sk.builtin.bool.true$;
                    });
                }, "VideoCapture", []);

                return Sk.misceval.callsimArray(cap);
            });

            return mod;
        };

        Sk.builtinFiles["files"]["src/lib/cv2.js"] = "var $builtinmodule = " + cv2ModuleCode.toString();
        // Compatibility paths
        Sk.builtinFiles["files"]["cv2.js"] = "var $builtinmodule = " + cv2ModuleCode.toString();
        Sk.builtinFiles["files"]["cv2/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["src/lib/cv2/__init__.py"] = "pass";

        // Text-to-Speech (pyttsx3)
        const pyttsx3ModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("pyttsx3") };

            var Engine = function () {
                this.say = new Sk.builtin.func(function (text) {
                    var jsText = Sk.ffi.remapToJs(text);
                    if (window.speechController) {
                        window.speechController.speak(jsText);
                    }
                    return Sk.builtin.none.none$;
                });

                this.runAndWait = new Sk.builtin.func(function () {
                    // In browser, speech is async but fire-and-forget for this simple mock
                    return Sk.builtin.none.none$;
                });

                this.setProperty = new Sk.builtin.func(function (name, value) {
                    return Sk.builtin.none.none$;
                });
            };

            mod.init = new Sk.builtin.func(function () {
                var engine = new Sk.misceval.buildClass(mod, function ($gbl, $loc) {
                    $loc.say = new Sk.builtin.func(function (self, text) {
                        var jsText = Sk.ffi.remapToJs(text);
                        if (window.speechController) {
                            window.speechController.speak(jsText);
                        }
                        return Sk.builtin.none.none$;
                    });
                    $loc.runAndWait = new Sk.builtin.func(function (self) {
                        return Sk.builtin.none.none$;
                    });
                    $loc.setProperty = new Sk.builtin.func(function (self, name, value) {
                        return Sk.builtin.none.none$;
                    });
                }, "Engine", []);
                return Sk.misceval.callsimArray(engine);
            });

            return mod;
        };

        // Speech Recognition (speech_recognition)
        const speechRecognitionModuleCode = function (name) {
            var mod = { __name__: new Sk.builtin.str("speech_recognition") };

            mod.Recognizer = new Sk.builtin.func(function () {
                var rec = new Sk.misceval.buildClass(mod, function ($gbl, $loc) {
                    $loc.listen = new Sk.builtin.func(function (self, source) {
                        const susp = new Sk.misceval.Suspension();
                        susp.resume = function (val) {
                            if (window.isRunning === false) throw new Sk.builtin.RuntimeError("Execution stopped");
                            if (val) return val;
                            return Sk.builtin.none.none$;
                        };

                        susp.data = {
                            type: "Sk.promise",
                            promise: new Promise((resolve, reject) => {
                                if (window.speechController) {
                                    window.speechController.listen().then(transcript => {
                                        // Create AudioData mock
                                        var ad = new Sk.builtin.object();
                                        ad.mock_text = transcript;
                                        resolve(ad);
                                    }).catch(err => {
                                        var ad = new Sk.builtin.object();
                                        ad.mock_text = "";
                                        resolve(ad);
                                    });
                                } else {
                                    var ad = new Sk.builtin.object();
                                    ad.mock_text = "";
                                    resolve(ad);
                                }
                            })
                        };
                        return susp;
                    });

                    $loc.recognize_google = new Sk.builtin.func(function (self, audio_data) {
                        var text = "";
                        // Access the ad.mock_text property we set in listen
                        if (audio_data && audio_data.mock_text) {
                            text = audio_data.mock_text;
                        }
                        return new Sk.builtin.str(text);
                    });
                }, "Recognizer", []);
                return Sk.misceval.callsimArray(rec);
            });

            mod.Microphone = new Sk.builtin.func(function () {
                var mic = new Sk.misceval.buildClass(mod, function ($gbl, $loc) {
                    $loc.__enter__ = new Sk.builtin.func(function (self) { return self; });
                    $loc.__exit__ = new Sk.builtin.func(function (self) { return Sk.builtin.none.none$; });
                }, "Microphone", []);
                return Sk.misceval.callsimArray(mic);
            });

            return mod;
        };

        // Register Modules
        // Register Modules - COMPREHENSIVE PATHS
        // pyttsx3
        const pyttsx3Code = "var $builtinmodule = " + pyttsx3ModuleCode.toString();
        Sk.builtinFiles["files"]["src/lib/pyttsx3/__init__.js"] = pyttsx3Code;
        Sk.builtinFiles["files"]["src/lib/pyttsx3.js"] = pyttsx3Code;
        Sk.builtinFiles["files"]["pyttsx3/__init__.js"] = pyttsx3Code;
        Sk.builtinFiles["files"]["pyttsx3.js"] = pyttsx3Code;
        Sk.builtinFiles["files"]["pyttsx3/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["src/lib/pyttsx3/__init__.py"] = "pass";

        // speech_recognition
        const speechRecognitionCode = "var $builtinmodule = " + speechRecognitionModuleCode.toString();
        Sk.builtinFiles["files"]["src/lib/speech_recognition/__init__.js"] = speechRecognitionCode;
        Sk.builtinFiles["files"]["src/lib/speech_recognition.js"] = speechRecognitionCode;
        Sk.builtinFiles["files"]["speech_recognition/__init__.js"] = speechRecognitionCode;
        Sk.builtinFiles["files"]["speech_recognition.js"] = speechRecognitionCode;
        Sk.builtinFiles["files"]["speech_recognition/__init__.py"] = "pass";
        Sk.builtinFiles["files"]["src/lib/speech_recognition/__init__.py"] = "pass";

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
    console.log("PyBlocks: ai_ds_mocks.js loaded successfully.");
})();
