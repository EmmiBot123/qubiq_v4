/**
 * PyBlocks - Custom Block Definitions for Data Science, ML and AI
 */

(function () {
    // Define custom blocks
    Blockly.defineBlocksWithJsonArray([
        // --- B. DATA SCIENCE (Pandas) ---
        {
            "type": "pandas_load_csv",
            "message0": "load_csv %1",
            "args0": [{ "type": "field_input", "name": "URL", "text": "data.csv" }],
            "output": "DataFrame",
            "colour": "#FFD700",
            "tooltip": "df = pd.read_csv('url')",
            "helpUrl": ""
        },
        {
            "type": "pandas_df_inspect",
            "message0": "df %1 . %2",
            "args0": [
                { "type": "input_value", "name": "DF" },
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["head()", "head()"],
                        ["shape", "shape"],
                        ["columns", "columns"]
                    ]
                }
            ],
            "output": null,
            "colour": "#FFD700",
            "tooltip": "Inspect DataFrame",
            "helpUrl": ""
        },
        {
            "type": "pandas_df_describe",
            "message0": "describe df %1",
            "args0": [{ "type": "input_value", "name": "DF" }],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#FFD700",
            "tooltip": "print(df.describe())",
            "helpUrl": ""
        },
        {
            "type": "pandas_df_cleaning",
            "message0": "clean df %1 : %2",
            "args0": [
                { "type": "input_value", "name": "DF" },
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["dropna()", "dropna()"],
                        ["fillna(0)", "fillna(0)"]
                    ]
                }
            ],
            "output": "DataFrame",
            "colour": "#FFD700",
            "tooltip": "Clean DataFrame",
            "helpUrl": ""
        },

        // --- C. VISUALIZATION (Matplotlib) ---
        {
            "type": "plt_plot_setup",
            "message0": "plot x: %1 y: %2",
            "args0": [
                { "type": "input_value", "name": "X" },
                { "type": "input_value", "name": "Y" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "plt.plot(x, y)",
            "helpUrl": ""
        },
        {
            "type": "plt_plot_type",
            "message0": "plot type %1 x: %2 y: %3",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "TYPE",
                    "options": [
                        ["Line", "plot"],
                        ["Bar", "bar"],
                        ["Scatter", "scatter"],
                        ["Histogram", "hist"]
                    ]
                },
                { "type": "input_value", "name": "X" },
                { "type": "input_value", "name": "Y" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "Select plot type",
            "helpUrl": ""
        },
        {
            "type": "plt_plot_labels",
            "message0": "plot labels title: %1 x: %2 y: %3",
            "args0": [
                { "type": "input_value", "name": "TITLE" },
                { "type": "input_value", "name": "X" },
                { "type": "input_value", "name": "Y" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "Set plot labels",
            "helpUrl": ""
        },

        // --- D. MACHINE LEARNING (Scikit-Learn) ---
        {
            "type": "ml_train_test_split",
            "message0": "split data features: %1 target: %2",
            "args0": [
                { "type": "input_value", "name": "X" },
                { "type": "input_value", "name": "Y" }
            ],
            "output": null,
            "colour": "#6A5ACD",
            "tooltip": "train_test_split(X, y)",
            "helpUrl": ""
        },
        {
            "type": "ml_init_model",
            "message0": "init model %1",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "MODEL",
                    "options": [
                        ["LinearRegression", "LinearRegression()"],
                        ["DecisionTree", "DecisionTreeClassifier()"],
                        ["KNN", "KNeighborsClassifier()"]
                    ]
                }
            ],
            "output": "Model",
            "colour": "#6A5ACD",
            "tooltip": "Initialize ML model",
            "helpUrl": ""
        },
        {
            "type": "ml_fit_model",
            "message0": "fit model %1 with X: %2 y: %3",
            "args0": [
                { "type": "input_value", "name": "MODEL" },
                { "type": "input_value", "name": "X" },
                { "type": "input_value", "name": "Y" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#6A5ACD",
            "tooltip": "model.fit(X_train, y_train)",
            "helpUrl": ""
        },
        {
            "type": "ml_predict_model",
            "message0": "predict using %1 data %2",
            "args0": [
                { "type": "input_value", "name": "MODEL" },
                { "type": "input_value", "name": "X" }
            ],
            "output": "Array",
            "colour": "#6A5ACD",
            "tooltip": "model.predict(X_test)",
            "helpUrl": ""
        },
        {
            "type": "ml_check_accuracy",
            "message0": "accuracy actual: %1 pred: %2",
            "args0": [
                { "type": "input_value", "name": "Y_TEST" },
                { "type": "input_value", "name": "PRED" }
            ],
            "output": "Number",
            "colour": "#6A5ACD",
            "tooltip": "accuracy_score(y_test, predictions)",
            "helpUrl": ""
        },

        // --- E. AI DOMAINS (Class 12 Specials) ---
        {
            "type": "cv_load_image",
            "message0": "load image %1",
            "args0": [{ "type": "field_input", "name": "PATH", "text": "image.jpg" }],
            "output": "Image",
            "colour": "#00CED1",
            "tooltip": "cv2.imread()",
            "helpUrl": ""
        },
        {
            "type": "cv_load_local",
            "message0": "load image from computer",
            "output": "Image",
            "colour": "#00CED1",
            "tooltip": "Click this block to browse and select an image from your computer.",
            "helpUrl": ""
        },
        {
            "type": "cv_convert_gray",
            "message0": "convert %1 to grayscale",
            "args0": [{ "type": "input_value", "name": "IMG" }],
            "output": "Image",
            "colour": "#00CED1",
            "tooltip": "cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)",
            "helpUrl": ""
        },
        {
            "type": "cv_show_image",
            "message0": "show image %1",
            "args0": [{ "type": "input_value", "name": "IMG" }],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#00CED1",
            "tooltip": "cv2.imshow('Image', img)",
            "helpUrl": ""
        },
        {
            "type": "cv_resize",
            "message0": "resize %1 to width %2 height %3",
            "args0": [
                { "type": "input_value", "name": "IMG" },
                { "type": "field_number", "name": "W", "value": 300 },
                { "type": "field_number", "name": "H", "value": 300 }
            ],
            "output": "Image",
            "colour": "#00CED1",
            "tooltip": "cv2.resize(img, (w, h))",
            "helpUrl": ""
        },
        {
            "type": "cv_blur",
            "message0": "blur %1 kernel %2",
            "args0": [
                { "type": "input_value", "name": "IMG" },
                { "type": "field_number", "name": "K", "value": 5 }
            ],
            "output": "Image",
            "colour": "#00CED1",
            "tooltip": "cv2.blur(img, (k, k))",
            "helpUrl": ""
        },
        {
            "type": "cv_canny",
            "message0": "edges of %1 thresh1 %2 thresh2 %3",
            "args0": [
                { "type": "input_value", "name": "IMG" },
                { "type": "field_number", "name": "T1", "value": 100 },
                { "type": "field_number", "name": "T2", "value": 200 }
            ],
            "output": "Image",
            "colour": "#00CED1",
            "tooltip": "cv2.Canny(img, t1, t2)",
            "helpUrl": ""
        },
        {
            "type": "cv_rectangle",
            "message0": "draw rectangle on %1 at (%2, %3) to (%4, %5)",
            "args0": [
                { "type": "input_value", "name": "IMG" },
                { "type": "field_number", "name": "X1", "value": 10 },
                { "type": "field_number", "name": "Y1", "value": 10 },
                { "type": "field_number", "name": "X2", "value": 100 },
                { "type": "field_number", "name": "Y2", "value": 100 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#00CED1",
            "tooltip": "cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)",
            "helpUrl": ""
        },
        {
            "type": "cv_put_text",
            "message0": "draw text %1 on %2 at (%3, %4)",
            "args0": [
                { "type": "field_input", "name": "TEXT", "text": "Hello" },
                { "type": "input_value", "name": "IMG" },
                { "type": "field_number", "name": "X", "value": 50 },
                { "type": "field_number", "name": "Y", "value": 50 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#00CED1",
            "tooltip": "cv2.putText(img, text, (x, y), font, scale, color, thickness)",
            "helpUrl": ""
        },
        {
            "type": "cv_wait_key",
            "message0": "wait for key %1 ms",
            "args0": [{ "type": "field_number", "name": "DELAY", "value": 0 }],
            "output": "Number",
            "colour": "#00CED1",
            "tooltip": "cv2.waitKey(delay)",
            "helpUrl": ""
        },
        {
            "type": "nlp_analyze_sentiment",
            "message0": "analyze sentiment of %1",
            "args0": [{ "type": "input_value", "name": "TEXT" }],
            "output": "Number",
            "colour": "#00CED1",
            "tooltip": "TextBlob(text).sentiment",
            "helpUrl": ""
        },
        // --- FACIAL FEATURE LIBRARY ---
        {
            "type": "facial_load",
            "message0": "Load Image %1",
            "args0": [
                { "type": "field_input", "name": "PATH", "text": "img.jpg" }
            ],
            "output": "Image",
            "colour": "#00A8A8",
            "tooltip": "facialfeature.load(path)",
            "helpUrl": ""
        },
        {
            "type": "facial_get_count",
            "message0": "Get %1 count",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "FEATURE",
                    "options": [
                        ["face", "face"],
                        ["eye", "eye"],
                        ["mouth", "mouth"]
                    ]
                }
            ],
            "output": "Number",
            "colour": "#00A8A8",
            "tooltip": "facialfeature.getcount(img, feature)",
            "helpUrl": ""
        },
        {
            "type": "facial_gender_count",
            "message0": "Get %1 count",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "GENDER",
                    "options": [
                        ["male", "male"],
                        ["female", "female"]
                    ]
                }
            ],
            "output": "Number",
            "colour": "#00A8A8",
            "tooltip": "facialfeature.gendercount(img, gender)",
            "helpUrl": ""
        },
        {
            "type": "facial_expression_count",
            "message0": "Get %1 expression count",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "EXPRESSION",
                    "options": [
                        ["happy", "happy"],
                        ["sad", "sad"],
                        ["surprise", "surprise"],
                        ["neutral", "neutral"]
                    ]
                }
            ],
            "output": "Number",
            "colour": "#00A8A8",
            "tooltip": "facialfeature.expressioncount(img, expression)",
            "helpUrl": ""
        },
        {
            "type": "facial_age_list",
            "message0": "Get age list",
            "output": "Array",
            "colour": "#00A8A8",
            "tooltip": "facialfeature.agelist(img)",
            "helpUrl": ""
        },
        {
            "type": "facial_show",
            "message0": "Show Image with %1 border",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BORDER",
                    "options": [
                        ["with", "with"],
                        ["without", "without"]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#00A8A8",
            "tooltip": "facialfeature.show(img, border_type)",
            "helpUrl": ""
        },
        // --- SPEAK CATEGORY ---
        {
            "type": "speak_text",
            "message0": "Speak %1",
            "args0": [
                { "type": "input_value", "name": "TEXT" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#FF6347",
            "tooltip": "playsound.say(text)",
            "helpUrl": ""
        },
        // --- OBJECT DETECTION CATEGORY ---
        {
            "type": "obj_load",
            "message0": "Load Image %1",
            "args0": [
                { "type": "field_input", "name": "PATH", "text": "img.jpg" }
            ],
            "output": "Image",
            "colour": "#008B8B",
            "tooltip": "objectdetect.load(path)",
            "helpUrl": ""
        },
        {
            "type": "obj_count",
            "message0": "Get %1 count",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "OBJECT",
                    "options": [
                        ["aeroplane", "aeroplane"],
                        ["bicycle", "bicycle"],
                        ["bird", "bird"],
                        ["boat", "boat"],
                        ["bottle", "bottle"],
                        ["bus", "bus"],
                        ["car", "car"],
                        ["cat", "cat"],
                        ["chair", "chair"],
                        ["cow", "cow"],
                        ["diningtable", "diningtable"],
                        ["dog", "dog"],
                        ["horse", "horse"],
                        ["motorbike", "motorbike"],
                        ["person", "person"],
                        ["pottedplant", "pottedplant"],
                        ["sheep", "sheep"],
                        ["sofa", "sofa"],
                        ["train", "train"],
                        ["tvmonitor", "tvmonitor"]
                    ]
                }
            ],
            "output": "Number",
            "colour": "#008B8B",
            "tooltip": "objectdetect.count(img, object_type)",
            "helpUrl": ""
        },
        {
            "type": "obj_show",
            "message0": "Show Image with %1 border",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BORDER",
                    "options": [
                        ["with", "True"],
                        ["without", "False"]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#008B8B",
            "tooltip": "objectdetect.show(img, show_border)",
            "helpUrl": ""
        },
        // --- SERIAL CATEGORY ---
        {
            "type": "serial_init",
            "message0": "Initialize Serial Port %1 Baud %2",
            "args0": [
                { "type": "field_input", "name": "PORT", "text": "COM3" },
                { "type": "field_number", "name": "BAUD", "value": 9600 }
            ],
            "output": "Serial",
            "colour": "#000080",
            "tooltip": "ser = serial.Serial(port, baud)",
            "helpUrl": ""
        },
        {
            "type": "serial_send",
            "message0": "Serial %1 send %2",
            "args0": [
                { "type": "input_value", "name": "SER" },
                { "type": "input_value", "name": "DATA" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#000080",
            "tooltip": "ser.write(data)",
            "helpUrl": ""
        },
        {
            "type": "serial_read",
            "message0": "Serial %1 Read Line",
            "args0": [
                { "type": "input_value", "name": "SER" }
            ],
            "output": "String",
            "colour": "#000080",
            "tooltip": "ser.readline()",
            "helpUrl": ""
        },
        {
            "type": "serial_available",
            "message0": "Serial %1 Available?",
            "args0": [
                { "type": "input_value", "name": "SER" }
            ],
            "output": "Boolean",
            "colour": "#000080",
            "tooltip": "ser.in_waiting > 0",
            "helpUrl": ""
        },
        // --- TEACHABLE MACHINE CATEGORY ---
        {
            "type": "tm_load_model",
            "message0": "load model from URL %1",
            "args0": [
                { "type": "field_input", "name": "URL", "text": "https://teachablemachine.withgoogle.com/models/..." }
            ],
            "output": "TMModel",
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.load_model(url)",
            "helpUrl": ""
        },
        {
            "type": "tm_webcam_on",
            "message0": "switch on camera",
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.webcam_on()",
            "helpUrl": ""
        },
        {
            "type": "tm_webcam_off",
            "message0": "switch off camera",
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.webcam_off()",
            "helpUrl": ""
        },
        {
            "type": "tm_webcam_capture",
            "message0": "capture image from camera",
            "output": "Image",
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.capture()",
            "helpUrl": ""
        },
        {
            "type": "tm_classify_image",
            "message0": "classify image %1 using model %2",
            "args0": [
                { "type": "input_value", "name": "IMG" },
                { "type": "input_value", "name": "MODEL" }
            ],
            "output": "TMResult",
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.classify(image, model)",
            "helpUrl": ""
        },
        {
            "type": "tm_get_prediction",
            "message0": "get confidence of %1 from %2",
            "args0": [
                { "type": "field_input", "name": "CLASS", "text": "Class 1" },
                { "type": "input_value", "name": "RESULT" }
            ],
            "output": "Number",
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.get_prediction(result, class_name)",
            "helpUrl": ""
        },
        // --- TEACHABLE MACHINE VOICE/AUDIO BLOCKS ---
        {
            "type": "tm_load_audio_model",
            "message0": "load audio model from URL %1",
            "args0": [
                { "type": "field_input", "name": "URL", "text": "https://teachablemachine.withgoogle.com/models/..." }
            ],
            "output": "TMAudioModel",
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.load_audio_model(url)",
            "helpUrl": ""
        },
        {
            "type": "tm_mic_on",
            "message0": "switch on microphone",
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.mic_on()",
            "helpUrl": ""
        },
        {
            "type": "tm_mic_off",
            "message0": "switch off microphone",
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.mic_off()",
            "helpUrl": ""
        },
        {
            "type": "tm_listen",
            "message0": "listen for audio",
            "output": "Audio",
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.listen()",
            "helpUrl": ""
        },
        {
            "type": "tm_classify_audio",
            "message0": "classify audio %1 using model %2",
            "args0": [
                { "type": "input_value", "name": "AUDIO" },
                { "type": "input_value", "name": "MODEL" }
            ],
            "output": "TMResult",
            "colour": "#6A5ACD",
            "tooltip": "teachablemachine.classify_audio(audio, model)",
            "helpUrl": ""
        }

    ]);

    // Code Generators
    if (typeof Blockly.Python !== 'undefined') {
        const pythonGenerator = Blockly.Python;

        function registerGenerator(blockName, generatorFunc) {
            if (pythonGenerator.forBlock) {
                pythonGenerator.forBlock[blockName] = generatorFunc;
            } else {
                pythonGenerator[blockName] = generatorFunc;
            }
        }

        // Pandas
        registerGenerator('pandas_load_csv', function (block) {
            var url = block.getFieldValue('URL');
            pythonGenerator.definitions_['import_pandas'] = 'import pandas as pd';
            return ["pd.read_csv('" + url + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('pandas_df_inspect', function (block) {
            var df = pythonGenerator.valueToCode(block, 'DF', pythonGenerator.ORDER_MEMBER) || 'df';
            var op = block.getFieldValue('OP');
            return [df + '.' + op, pythonGenerator.ORDER_MEMBER];
        });

        registerGenerator('pandas_df_describe', function (block) {
            var df = pythonGenerator.valueToCode(block, 'DF', pythonGenerator.ORDER_NONE) || 'df';
            return 'print(' + df + '.describe())\n';
        });

        registerGenerator('pandas_df_cleaning', function (block) {
            var df = pythonGenerator.valueToCode(block, 'DF', pythonGenerator.ORDER_MEMBER) || 'df';
            var op = block.getFieldValue('OP');
            return [df + '.' + op, pythonGenerator.ORDER_FUNCTION_CALL];
        });

        // Matplotlib
        registerGenerator('plt_plot_setup', function (block) {
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || '[]';
            var y = pythonGenerator.valueToCode(block, 'Y', pythonGenerator.ORDER_NONE) || '[]';
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.plot(' + x + ', ' + y + ')\n';
        });

        registerGenerator('plt_plot_type', function (block) {
            var type = block.getFieldValue('TYPE');
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || '[]';
            var y = pythonGenerator.valueToCode(block, 'Y', pythonGenerator.ORDER_NONE) || '[]';
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.' + type + '(' + x + ', ' + y + ')\n';
        });

        registerGenerator('plt_plot_labels', function (block) {
            var title = pythonGenerator.valueToCode(block, 'TITLE', pythonGenerator.ORDER_NONE) || "''";
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || "''";
            var y = pythonGenerator.valueToCode(block, 'Y', pythonGenerator.ORDER_NONE) || "''";
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.title(' + title + ')\nplt.xlabel(' + x + ')\nplt.ylabel(' + y + ')\n';
        });

        // ML
        registerGenerator('ml_train_test_split', function (block) {
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || 'X';
            var y = pythonGenerator.valueToCode(block, 'Y', pythonGenerator.ORDER_NONE) || 'y';
            pythonGenerator.definitions_['import_skl_split'] = 'from sklearn.model_selection import train_test_split';
            return ["train_test_split(" + x + ", " + y + ")", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('ml_init_model', function (block) {
            var model = block.getFieldValue('MODEL');
            if (model.includes('Linear')) {
                pythonGenerator.definitions_['import_skl_linear'] = 'from sklearn.linear_model import LinearRegression';
            } else if (model.includes('Decision')) {
                pythonGenerator.definitions_['import_skl_tree'] = 'from sklearn.tree import DecisionTreeClassifier';
            } else if (model.includes('KNN')) {
                pythonGenerator.definitions_['import_skl_knn'] = 'from sklearn.neighbors import KNeighborsClassifier';
            }
            return [model, pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('ml_fit_model', function (block) {
            var model = pythonGenerator.valueToCode(block, 'MODEL', pythonGenerator.ORDER_MEMBER) || 'model';
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || 'X_train';
            var y = pythonGenerator.valueToCode(block, 'Y', pythonGenerator.ORDER_NONE) || 'y_train';
            return model + '.fit(' + x + ', ' + y + ')\n';
        });

        registerGenerator('ml_predict_model', function (block) {
            var model = pythonGenerator.valueToCode(block, 'MODEL', pythonGenerator.ORDER_MEMBER) || 'model';
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || 'X_test';
            return [model + '.predict(' + x + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('ml_check_accuracy', function (block) {
            var y_test = pythonGenerator.valueToCode(block, 'Y_TEST', pythonGenerator.ORDER_NONE) || 'y_test';
            var pred = pythonGenerator.valueToCode(block, 'PRED', pythonGenerator.ORDER_NONE) || 'predictions';
            pythonGenerator.definitions_['import_skl_acc'] = 'from sklearn.metrics import accuracy_score';
            return ["accuracy_score(" + y_test + ", " + pred + ")", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        // AI Domains
        registerGenerator('cv_load_image', function (block) {
            var path = block.getFieldValue('PATH');
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return ["cv2.imread('" + path + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('cv_load_local', function (block) {
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return ["cv2.imread('local_image')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('cv_convert_gray', function (block) {
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'img';
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return ["cv2.cvtColor(" + img + ", cv2.COLOR_BGR2GRAY)", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('cv_show_image', function (block) {
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'img';
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return "cv2.imshow('Image', " + img + ")\n";
        });

        registerGenerator('cv_resize', function (block) {
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'img';
            var w = block.getFieldValue('W');
            var h = block.getFieldValue('H');
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return ["cv2.resize(" + img + ", (" + w + ", " + h + "))", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('cv_blur', function (block) {
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'img';
            var k = block.getFieldValue('K');
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return ["cv2.blur(" + img + ", (" + k + ", " + k + "))", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('cv_canny', function (block) {
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'img';
            var t1 = block.getFieldValue('T1');
            var t2 = block.getFieldValue('T2');
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return ["cv2.Canny(" + img + ", " + t1 + ", " + t2 + ")", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('cv_rectangle', function (block) {
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'img';
            var x1 = block.getFieldValue('X1');
            var y1 = block.getFieldValue('Y1');
            var x2 = block.getFieldValue('X2');
            var y2 = block.getFieldValue('Y2');
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return "cv2.rectangle(" + img + ", (" + x1 + ", " + y1 + "), (" + x2 + ", " + y2 + "), (255, 0, 0), 2)\n";
        });

        registerGenerator('cv_put_text', function (block) {
            var text = block.getFieldValue('TEXT');
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'img';
            var x = block.getFieldValue('X');
            var y = block.getFieldValue('Y');
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return "cv2.putText(" + img + ", '" + text + "', (" + x + ", " + y + "), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)\n";
        });

        registerGenerator('cv_wait_key', function (block) {
            var delay = block.getFieldValue('DELAY');
            pythonGenerator.definitions_['import_cv2'] = 'import cv2';
            return ["cv2.waitKey(" + delay + ")", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('nlp_analyze_sentiment', function (block) {
            var text = pythonGenerator.valueToCode(block, 'TEXT', pythonGenerator.ORDER_NONE) || "''";
            pythonGenerator.definitions_['import_textblob'] = 'from textblob import TextBlob';
            return ["TextBlob(" + text + ").sentiment", pythonGenerator.ORDER_MEMBER];
        });

        // --- FACIAL FEATURE GENERATORS ---
        registerGenerator('facial_load', function (block) {
            var path = block.getFieldValue('PATH');
            pythonGenerator.definitions_['import_facialfeature'] = 'import facialfeature';
            return ["facialfeature.load('" + path + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('facial_get_count', function (block) {
            var feature = block.getFieldValue('FEATURE');
            pythonGenerator.definitions_['import_facialfeature'] = 'import facialfeature';
            return ["facialfeature.getcount(image, '" + feature + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('facial_gender_count', function (block) {
            var gender = block.getFieldValue('GENDER');
            pythonGenerator.definitions_['import_facialfeature'] = 'import facialfeature';
            return ["facialfeature.gendercount(image, '" + gender + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('facial_expression_count', function (block) {
            var exp = block.getFieldValue('EXPRESSION');
            pythonGenerator.definitions_['import_facialfeature'] = 'import facialfeature';
            return ["facialfeature.expressioncount(image, '" + exp + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('facial_age_list', function (block) {
            pythonGenerator.definitions_['import_facialfeature'] = 'import facialfeature';
            return ["facialfeature.agelist(image)", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('facial_show', function (block) {
            var border = block.getFieldValue('BORDER');
            pythonGenerator.definitions_['import_facialfeature'] = 'import facialfeature';
            return "facialfeature.show(image, '" + border + "')\n";
        });

        // --- SPEAK GENERATOR ---
        registerGenerator('speak_text', function (block) {
            var text = pythonGenerator.valueToCode(block, 'TEXT', pythonGenerator.ORDER_NONE) || "''";
            pythonGenerator.definitions_['import_playsound'] = 'import playsound';
            return "playsound.say(" + text + ")\n";
        });

        // --- OBJECT DETECTION GENERATORS ---
        registerGenerator('obj_load', function (block) {
            var path = block.getFieldValue('PATH');
            pythonGenerator.definitions_['import_objectdetect'] = 'import objectdetect';
            return ["objectdetect.load('" + path + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('obj_count', function (block) {
            var obj = block.getFieldValue('OBJECT');
            pythonGenerator.definitions_['import_objectdetect'] = 'import objectdetect';
            return ["objectdetect.count(image, '" + obj + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('obj_show', function (block) {
            var border = block.getFieldValue('BORDER');
            pythonGenerator.definitions_['import_objectdetect'] = 'import objectdetect';
            return "objectdetect.show(image, " + border + ")\n";
        });

        // --- SERIAL GENERATORS ---
        registerGenerator('serial_init', function (block) {
            var port = block.getFieldValue('PORT');
            var baud = block.getFieldValue('BAUD');
            pythonGenerator.definitions_['import_serial'] = 'import serial';
            return ["serial.Serial('" + port + "', " + baud + ")", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('serial_send', function (block) {
            var ser = pythonGenerator.valueToCode(block, 'SER', pythonGenerator.ORDER_MEMBER) || 'ser';
            var data = pythonGenerator.valueToCode(block, 'DATA', pythonGenerator.ORDER_NONE) || "''";
            pythonGenerator.definitions_['import_serial'] = 'import serial';
            return ser + ".write(" + data + ")\n";
        });

        registerGenerator('serial_read', function (block) {
            var ser = pythonGenerator.valueToCode(block, 'SER', pythonGenerator.ORDER_MEMBER) || 'ser';
            pythonGenerator.definitions_['import_serial'] = 'import serial';
            return [ser + ".readline()", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('serial_available', function (block) {
            var ser = pythonGenerator.valueToCode(block, 'SER', pythonGenerator.ORDER_MEMBER) || 'ser';
            pythonGenerator.definitions_['import_serial'] = 'import serial';
            return [ser + ".in_waiting > 0", pythonGenerator.ORDER_RELATIONAL];
        });

        // --- TEACHABLE MACHINE GENERATORS ---
        registerGenerator('tm_load_model', function (block) {
            var url = block.getFieldValue('URL');
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return ["teachablemachine.load_model('" + url + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('tm_webcam_on', function (block) {
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return "teachablemachine.webcam_on()\n";
        });

        registerGenerator('tm_webcam_off', function (block) {
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return "teachablemachine.webcam_off()\n";
        });

        registerGenerator('tm_webcam_capture', function (block) {
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return ["teachablemachine.capture()", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('tm_classify_image', function (block) {
            var img = pythonGenerator.valueToCode(block, 'IMG', pythonGenerator.ORDER_NONE) || 'image';
            var model = pythonGenerator.valueToCode(block, 'MODEL', pythonGenerator.ORDER_NONE) || 'model';
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return ["teachablemachine.classify(" + img + ", " + model + ")", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('tm_get_prediction', function (block) {
            var className = block.getFieldValue('CLASS');
            var result = pythonGenerator.valueToCode(block, 'RESULT', pythonGenerator.ORDER_NONE) || 'result';
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return ["teachablemachine.get_prediction(" + result + ", '" + className + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        // --- TEACHABLE MACHINE VOICE/AUDIO GENERATORS ---
        registerGenerator('tm_load_audio_model', function (block) {
            var url = block.getFieldValue('URL');
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return ["teachablemachine.load_audio_model('" + url + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('tm_mic_on', function (block) {
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return "teachablemachine.mic_on()\n";
        });

        registerGenerator('tm_mic_off', function (block) {
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return "teachablemachine.mic_off()\n";
        });

        registerGenerator('tm_listen', function (block) {
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return ["teachablemachine.listen()", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('tm_classify_audio', function (block) {
            var audio = pythonGenerator.valueToCode(block, 'AUDIO', pythonGenerator.ORDER_NONE) || 'audio';
            var model = pythonGenerator.valueToCode(block, 'MODEL', pythonGenerator.ORDER_NONE) || 'model';
            pythonGenerator.definitions_['import_tm'] = 'import teachablemachine';
            return ["teachablemachine.classify_audio(" + audio + ", " + model + ")", pythonGenerator.ORDER_FUNCTION_CALL];
        });
    }
})();

