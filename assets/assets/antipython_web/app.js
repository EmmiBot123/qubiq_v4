// Initialize Lucide Icons
lucide.createIcons();

// State
let editor;
let theme = 'dark';
const initialCode = `print("Hello Python!")

# Simple loop example
for i in range(5):
    print(f"Count: {i}")
`;

// Monaco Editor Config
require.config({ paths: { vs: 'lib/monaco/vs' } });

require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: initialCode,
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Fira Code',
        minimap: { enabled: false },
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        cursorStyle: 'line',
    });
});

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const html = document.documentElement;

themeToggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', theme);

    // Update Monaco Theme
    if (editor) {
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }

    // Update Icon
    if (theme === 'dark') {
        themeIcon.setAttribute('data-lucide', 'moon');
    } else {
        themeIcon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons();
});

// Custom Input Modal Logic
const inputModal = document.getElementById('input-modal');
const modalPrompt = document.getElementById('modal-prompt');
const modalInput = document.getElementById('modal-input');
const modalSubmit = document.getElementById('modal-submit');

// Python Execution (Skulpt)
const outputConsole = document.getElementById('output-console');
const runBtn = document.getElementById('run-btn');
const stopBtn = document.getElementById('stop-btn');

window.isRunning = false;

function setRunningState(running) {
    window.isRunning = running;
    if (running) {
        runBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
    } else {
        runBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
    }
}

function stopPython() {
    Sk.hardInterrupt = true;
    setRunningState(false);
}

stopBtn.addEventListener('click', stopPython);

function customInput(prompt) {
    if (prompt) {
        outf(prompt);
    }
    return new Promise((resolve) => {
        modalPrompt.innerText = prompt || "Python Input:";
        modalInput.value = "";
        inputModal.classList.remove('hidden');
        modalInput.focus();

        const handleSubmit = () => {
            const value = modalInput.value;
            inputModal.classList.add('hidden');
            modalSubmit.removeEventListener('click', handleSubmit);
            modalInput.removeEventListener('keypress', handleKeyPress);
            // Print the input to the console as well, matching native behavior
            outf(value + "\n");
            resolve(value);
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') handleSubmit();
        };

        modalSubmit.addEventListener('click', handleSubmit);
        modalInput.addEventListener('keypress', handleKeyPress);
    });
}

function outf(text) {
    outputConsole.innerText += text;
}

function builtinRead(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
}

async function runPython() {
    const code = editor.getValue();
    outputConsole.innerText = '';

    // Reset Interrupt State
    Sk.hardInterrupt = false;
    setRunningState(true);

    // Reset Plotting if available
    if (window.resetMatplotlib) {
        window.resetMatplotlib();
    }

    Sk.pre = "output-console";
    Sk.configure({
        output: outf,
        read: builtinRead,
        inputfun: customInput,
        inputfunTakesPrompt: true, // Crucial for passing prompt text to customInput
        yieldLimit: 100,           // Frequent checks for interrupts
        execLimit: Infinity,       // No time limit
        __future__: Sk.python3
    });

    try {
        await Sk.misceval.asyncToPromise(function () {
            return Sk.importMainWithBody("main", false, code, true);
        });
        console.log('Execution Finished Successfully');
    } catch (err) {
        if (err.toString().includes("Interrupt")) {
            outf("\n[Execution Interrupted]");
        } else {
            outf("\n" + err.toString());
        }
    } finally {
        setRunningState(false);
    }
}

runBtn.addEventListener('click', runPython);

// Proxy API Integration (Previously OpenRouter)
let cachedAuthToken = null;
let cachedSchoolId = "";

// Listen for token broadcast from Flutter Web wrapper
window.addEventListener('message', function (event) {
    try {
        if (event.data && typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            if (data.type === 'emmi_auth') {
                cachedAuthToken = data.token;
                cachedSchoolId = data.schoolId;
                window.EMMI_AUTH_TOKEN = data.token;
                window.EMMI_SCHOOL_ID = data.schoolId;
            }
        }
    } catch (e) { }
});

async function callProxyChat(prompt) {
    // Attempt to pull from window, cache, or parent explicitly
    let token = window.EMMI_AUTH_TOKEN || cachedAuthToken;
    let schoolId = window.EMMI_SCHOOL_ID || cachedSchoolId || "";

    if (!token) {
        try {
            token = localStorage.getItem('EMMI_AUTH_TOKEN') || window.parent.localStorage.getItem('EMMI_AUTH_TOKEN');
            schoolId = localStorage.getItem('EMMI_SCHOOL_ID') || window.parent.localStorage.getItem('EMMI_SCHOOL_ID') || "";
        } catch (e) { }
    }

    if (!token) {
        return "Not authenticated via QubiQ app. Cannot use the AI Assistant.";
    }

    const systemPrompt = "You are a Python tutor for students using a browser-based Python environment (Skulpt). \n\nRULES:\n1. Keep answers SHORT and CONCISE.\n2. Provide RUNNABLE Python code compatible with Skulpt.\n3. Supported Libraries: standard libs, `turtle`, `matplotlib.pyplot` (plots show in modal), `numpy` (mocked), `pandas` (mocked), `cv2` (Webcam mock), `pyttsx3` (TTS mock), `speech_recognition` (STT mock).\n4. Key Limitations: NO `pip install`, NO `subprocess`, NO `time.sleep()` (blocks browser), NO `sys.stdin` (use `input()` instead).\n5. For `cv2`: Use `cv2.VideoCapture(0)` to capture frames.\n6. For Speech: Use `pyttsx3.init()` and `speech_recognition.Recognizer()`.\n\nAlways wrap code in ```python blocks.";

    const apiUrl = `${window.EMMI_API_BASE_URL || 'https://edu-ai-backend-vl7s.onrender.com'}/proxy/chat`;

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "prompt": `${systemPrompt}\n\nUser: ${prompt}`,
                "botType": "pyVibe",
                "schoolId": schoolId
            })
        });

        const data = await response.json();
        if (data.error || data.details?.error) {
            const errDetail = data.details?.error?.message || data.error || "Unknown error";
            return `AI Error: ${errDetail}`;
        }

        // Parse proxy response properly 
        let answerText = "";
        if (data.reply) {
            answerText = data.reply;
        } else if (data.response) {
            answerText = data.response;
        } else if (data.choices && data.choices.length > 0) {
            answerText = data.choices[0].message.content;
        } else {
            answerText = typeof data === 'string' ? data : JSON.stringify(data);
        }

        // Sometimes the reply field itself is mistakenly stringified JSON from deep wrapper
        try {
            const innerJson = JSON.parse(answerText);
            if (innerJson && innerJson.reply) {
                answerText = innerJson.reply;
            } else if (innerJson && innerJson.response) {
                answerText = innerJson.response;
            }
        } catch (e) {
            // It's just a normal string, do nothing
        }

        return answerText;
    } catch (error) {
        console.error("Proxy Chat Error:", error);
        return "Sorry, I had trouble connecting to the AI service. Please check your connection.";
    }
}

function extractPythonCode(text) {
    const regex = /```python\n([\s\S]*?)```/g;
    let match;
    const codes = [];
    while ((match = regex.exec(text)) !== null) {
        codes.push(match[1]);
    }
    return codes;
}

// Chat Logic
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

function addMessage(text, isStudent = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isStudent ? 'student' : 'ai'}`;

    // Check for code blocks in AI messages
    if (!isStudent) {
        const codes = extractPythonCode(text);
        let displayText = text.replace(/```python\n[\s\S]*?```/g, "\n[Applied Below]\n");
        msgDiv.innerText = displayText;

        if (codes.length > 0) {
            // Automatically apply the first code block
            const codeToApply = codes[0];
            editor.setValue(codeToApply);

            // Visual feedback
            const feedback = document.createElement('div');
            feedback.className = 'apply-code-btn';
            feedback.style.pointerEvents = 'none'; // Make it informative only
            feedback.innerHTML = `<i data-lucide="check-circle"></i> Code applied automatically`;
            msgDiv.appendChild(feedback);

            // Highlight the run button
            const runBtn = document.getElementById('run-btn');
            runBtn.style.boxShadow = "0 0 15px var(--primary-color)";
            setTimeout(() => runBtn.style.boxShadow = "none", 2000);
        }
    } else {
        msgDiv.textContent = text;
    }

    chatMessages.appendChild(msgDiv);
    // Request animation frame to ensure the DOM has updated before scrolling
    requestAnimationFrame(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    });
    lucide.createIcons();
}

async function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, true);
    chatInput.value = '';

    // Show loading state
    const loadingId = Date.now();
    addMessage("Thinking...", false);
    const messages = chatMessages.querySelectorAll('.message.ai');
    const loadingMsg = messages[messages.length - 1];
    loadingMsg.id = `loading-${loadingId}`;

    const aiResponse = await callProxyChat(text);

    // Remove loading and show real response
    loadingMsg.remove();
    addMessage(aiResponse, false);
}

chatSend.addEventListener('click', handleChat);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChat();
});

// --- WEBCAM SUPPORT ---
class WebcamController {
    constructor() {
        this.videoElement = document.getElementById('webcam-video');
        this.canvasElement = document.getElementById('webcam-canvas');
        this.stream = null;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.videoElement.srcObject = this.stream;
            return true;
        } catch (err) {
            console.error("Webcam Error:", err);
            return false;
        }
    }

    capture() {
        if (!this.stream) return null;

        const context = this.canvasElement.getContext('2d');
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

        // Return as Data URL (JPEG format for OpenCV compatibility)
        return this.canvasElement.toDataURL('image/jpeg');
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

// Global instance for Skulpt bridge
window.webcamController = new WebcamController();

// --- SPEECH SUPPORT ---
class SpeechController {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    }

    speak(text) {
        if (!this.synthesis) {
            console.error("Text-to-Speech not supported.");
            return;
        }
        // Cancel any previous speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.volume = 1;
        utterance.rate = 1;
        utterance.pitch = 1;

        this.synthesis.speak(utterance);
    }

    listen() {
        if (!this.SpeechRecognition) {
            console.error("Speech Recognition not supported.");
            return Promise.resolve("Error: Browser does not support Speech Recognition.");
        }

        return new Promise((resolve, reject) => {
            const recognition = new this.SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log("Listening...");
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("Heard:", transcript);
                resolve(transcript);
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                resolve(""); // Resolve gracefully effectively "hearing nothing"
            };

            recognition.onend = () => {
                // If no result was returned, could resolve empty here too ensure promise settles
            };

            try {
                recognition.start();
            } catch (e) {
                console.error("Failed to start recognition:", e);
                resolve("");
            }
        });
    }
}

// Global instance for Skulpt bridge
window.speechController = new SpeechController();

// --- SERIAL PORT SUPPORT ---
class SerialController {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.baudRate = 9600;
        this.isConnected = false;
        this.inputBuffer = "";
    }

    async connect() {
        if (!("serial" in navigator)) {
            alert("Web Serial API is not supported in this browser. Please use Chrome or Edge.");
            return false;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: this.baudRate });

            this.isConnected = true;
            this.startReading();
            return true;
        } catch (err) {
            console.error("Serial Connection Error:", err);
            return false;
        }
    }

    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        this.isConnected = false;
    }

    async startReading() {
        while (this.port && this.port.readable && this.isConnected) {
            this.reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value) {
                        const text = new TextDecoder().decode(value);
                        this.inputBuffer += text;
                    }
                }
            } catch (err) {
                console.error("Serial Read Error:", err);
            } finally {
                this.reader.releaseLock();
            }
        }
    }

    async write(data) {
        if (!this.port || !this.port.writable) return;
        const writer = this.port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(data));
        writer.releaseLock();
    }

    readLine() {
        const index = this.inputBuffer.indexOf("\n");
        if (index !== -1) {
            const line = this.inputBuffer.substring(0, index + 1);
            this.inputBuffer = this.inputBuffer.substring(index + 1);
            return line;
        }
        return null;
    }

    hasData() {
        return this.inputBuffer.includes("\n");
    }
}

// Global instance for Skulpt bridge
window.serialController = new SerialController();

const serialBtn = document.getElementById('serial-btn');
const serialIcon = document.getElementById('serial-icon');

serialBtn.addEventListener('click', async () => {
    if (window.serialController.isConnected) {
        await window.serialController.disconnect();
        serialBtn.innerHTML = '<i data-lucide="unplug" id="serial-icon"></i> Connect';
        serialBtn.style.color = "var(--text-color)";
    } else {
        const success = await window.serialController.connect();
        if (success) {
            serialBtn.innerHTML = '<i data-lucide="zap" id="serial-icon"></i> Connected';
            serialBtn.style.color = "#10b981"; // Emerald green
        }
    }
    lucide.createIcons();
});

// --- LAYOUT CONTROLLER (Resizable Panels) ---
class LayoutController {
    constructor() {
        this.resizerLeft = document.getElementById('resizer-left');
        this.resizerRight = document.getElementById('resizer-right');
        this.mainContainer = document.querySelector('main');

        // State
        this.isResizing = false;
        this.currentResizer = null;

        // Load saved preferences
        this.loadPreferences();

        // Bind events
        this.attachListeners();

        // Handle window resize for dynamic layouts
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 1024) {
                // Clear inline widths to let CSS media queries take over
                this.mainContainer.style.removeProperty('--left-width');
                this.mainContainer.style.removeProperty('--right-width');
            } else {
                this.loadPreferences();
            }
            if (editor) editor.layout();
        });
    }

    attachListeners() {
        // Left Resizer
        this.resizerLeft.addEventListener('mousedown', (e) => {
            this.startResize(e, 'left');
        });

        // Right Resizer
        this.resizerRight.addEventListener('mousedown', (e) => {
            this.startResize(e, 'right');
        });

        // Global Mouse Events
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.stopResize());
    }

    startResize(e, side) {
        this.isResizing = true;
        this.currentResizer = side;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Prevent text selection

        if (side === 'left') this.resizerLeft.classList.add('resizing');
        if (side === 'right') this.resizerRight.classList.add('resizing');
    }

    stopResize() {
        if (!this.isResizing) return;

        this.isResizing = false;
        this.currentResizer = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        this.resizerLeft.classList.remove('resizing');
        this.resizerRight.classList.remove('resizing');

        // Save new sizes
        this.savePreferences();

        // Trigger resize event for editor and charts
        window.dispatchEvent(new Event('resize'));
        if (editor) editor.layout();
    }

    handleMouseMove(e) {
        if (!this.isResizing) return;

        const containerRect = this.mainContainer.getBoundingClientRect();

        if (this.currentResizer === 'left') {
            // Calculate new left width
            let newWidth = e.clientX - containerRect.left;

            // Constraints
            if (newWidth < 200) newWidth = 200; // Min width
            if (newWidth > containerRect.width - 400) newWidth = containerRect.width - 400; // max width safety

            this.mainContainer.style.setProperty('--left-width', `${newWidth}px`);
        }
        else if (this.currentResizer === 'right') {
            // Calculate new right width (from right edge)
            let newWidth = containerRect.right - e.clientX;

            // Constraints
            if (newWidth < 200) newWidth = 200;
            if (newWidth > containerRect.width - 400) newWidth = containerRect.width - 400;

            this.mainContainer.style.setProperty('--right-width', `${newWidth}px`);
        }
    }

    savePreferences() {
        const leftWidth = this.mainContainer.style.getPropertyValue('--left-width');
        const rightWidth = this.mainContainer.style.getPropertyValue('--right-width');

        if (leftWidth) localStorage.setItem('layout_left_width', leftWidth);
        if (rightWidth) localStorage.setItem('layout_right_width', rightWidth);
    }

    loadPreferences() {
        const leftWidth = localStorage.getItem('layout_left_width');
        const rightWidth = localStorage.getItem('layout_right_width');

        if (leftWidth) this.mainContainer.style.setProperty('--left-width', leftWidth);
        if (rightWidth) this.mainContainer.style.setProperty('--right-width', rightWidth);
    }
}

// Initialize Layout
window.layoutController = new LayoutController();
