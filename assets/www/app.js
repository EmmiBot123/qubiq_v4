/**
 * PyBlocks - Block-Based Python Editor
 * Main Application Logic
 */

// Global variables
let workspace;
let codeEditor;
let isRunning = false;

// DOM Elements - initialized after DOM loads
let runBtn, stopBtn, clearBtn, saveBtn, loadBtn, copyCodeBtn, clearOutputBtn, outputEl, fileInput;

// Initialize the application
/**
 * SerialController
 * Handles Web Serial API interactions
 */
class SerialController {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.readableStream = null;
        this.baudRate = 9600;
        this.buffer = "";
        this.isConnected = false;
        this.onStatusChange = null;
    }

    async connect() {
        if (!("serial" in navigator)) {
            alert("Web Serial API is not supported in this browser.");
            return false;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: this.baudRate });

            this.isConnected = true;
            if (this.onStatusChange) this.onStatusChange(true);

            // Start and track reading loop
            this.readLoopPromise = this.readLoop();
            return true;
        } catch (err) {
            console.error("Serial Connection Error:", err);
            return false;
        }
    }

    async disconnect() {
        this.isConnected = false;

        if (this.reader) {
            try {
                await this.reader.cancel();
            } catch (err) {
                console.error("Reader cancel error:", err);
            }
        }

        // Wait for loop to finish and release lock
        if (this.readLoopPromise) {
            await this.readLoopPromise;
            this.readLoopPromise = null;
        }

        if (this.port) {
            try {
                await this.port.close();
            } catch (err) {
                console.error("Port close error:", err);
            }
            this.port = null;
        }

        if (this.onStatusChange) this.onStatusChange(false);
    }

    async readLoop() {
        const decoder = new TextDecoder();

        while (this.port && this.port.readable && this.isConnected) {
            this.reader = this.port.readable.getReader();

            try {
                while (this.isConnected) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value) {
                        this.buffer += decoder.decode(value);
                        // Limit buffer size
                        if (this.buffer.length > 10000) {
                            this.buffer = this.buffer.slice(-10000);
                        }
                    }
                }
            } catch (err) {
                console.error("Serial Read Loop Error:", err);
            } finally {
                if (this.reader) {
                    this.reader.releaseLock();
                    this.reader = null;
                }
            }
        }
    }

    async write(data) {
        if (!this.port || !this.port.writable) return;

        const encoder = new TextEncoder();
        const writer = this.port.writable.getWriter();
        await writer.write(encoder.encode(data));
        writer.releaseLock();
    }

    readLine() {
        const index = this.buffer.indexOf('\n');
        if (index !== -1) {
            const line = this.buffer.substring(0, index + 1);
            this.buffer = this.buffer.substring(index + 1);
            return line;
        }
        return null;
    }

    hasData() {
        return this.buffer.length > 0;
    }
}

/**
 * WebcamController
 * Handles camera access and frame capture
 */
class WebcamController {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.container = null;
    }

    async start() {
        this.video = document.getElementById('webcamPreview');
        this.canvas = document.getElementById('webcamCanvas');
        this.container = document.getElementById('webcamContainer');

        if (!this.video || !this.container) return false;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 },
                audio: false
            });
            this.video.srcObject = this.stream;
            this.container.classList.add('active');
            return true;
        } catch (err) {
            console.error("Webcam Error:", err);
            return false;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) this.video.srcObject = null;
        if (this.container) this.container.classList.remove('active');
    }

    capture() {
        if (!this.video || !this.canvas || !this.stream) return null;

        const ctx = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        ctx.drawImage(this.video, 0, 0);

        return this.canvas.toDataURL('image/jpeg');
    }
}

// Global controller instances
window.serialController = new SerialController();
window.webcamController = new WebcamController();

document.addEventListener('DOMContentLoaded', function () {
    // Get DOM elements
    runBtn = document.getElementById('runBtn');
    stopBtn = document.getElementById('stopBtn');
    clearBtn = document.getElementById('clearBtn');
    saveBtn = document.getElementById('saveBtn');
    loadBtn = document.getElementById('loadBtn');
    copyCodeBtn = document.getElementById('copyCodeBtn');
    clearOutputBtn = document.getElementById('clearOutputBtn');
    outputEl = document.getElementById('output');
    fileInput = document.getElementById('fileInput');
    const connectSerialBtn = document.getElementById('connectSerialBtn');

    // Initialize Serial UI
    if (connectSerialBtn) {
        connectSerialBtn.addEventListener('click', async () => {
            if (window.serialController.isConnected) {
                await window.serialController.disconnect();
            } else {
                await window.serialController.connect();
            }
        });

        window.serialController.onStatusChange = (connected) => {
            if (connected) {
                connectSerialBtn.classList.add('connected');
                connectSerialBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
                    </svg>
                    <span>Disconnect</span>
                `;
            } else {
                connectSerialBtn.classList.remove('connected');
                connectSerialBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Connect</span>
                `;
            }
        };
    }

    initBlockly();
    initCodeEditor();
    initResizers();
    initEventListeners();

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    console.log('PyBlocks initialized successfully!');
});

/**
 * Initialize Blockly workspace
 */
function initBlockly() {
    const blocklyDiv = document.getElementById('blocklyDiv');
    const toolbox = document.getElementById('toolbox');

    // Blockly configuration
    workspace = Blockly.inject(blocklyDiv, {
        toolbox: toolbox,
        theme: Blockly.Theme.defineTheme('pyblocks', {
            'base': Blockly.Themes.Classic,
            'componentStyles': {
                'workspaceBackgroundColour': '#0d1117',
                'toolboxBackgroundColour': '#161b22',
                'toolboxForegroundColour': '#e6edf3',
                'flyoutBackgroundColour': '#1c2128',
                'flyoutForegroundColour': '#e6edf3',
                'flyoutOpacity': 0.95,
                'scrollbarColour': '#484f58',
                'insertionMarkerColour': '#58a6ff',
                'insertionMarkerOpacity': 0.3,
                'scrollbarOpacity': 0.4,
                'cursorColour': '#58a6ff'
            },
            'fontStyle': {
                'family': 'Inter, sans-serif',
                'weight': '500',
                'size': 12
            },
            'startHats': true
        }),
        grid: {
            spacing: 20,
            length: 1,
            colour: '#30363d',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true,
        move: {
            scrollbars: true,
            drag: true,
            wheel: true
        },
        sounds: false,
        renderer: 'geras'
    });

    // Register toolbox button callbacks
    workspace.registerButtonCallback('CREATE_VARIABLE', function (button) {
        Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
    });
    workspace.registerButtonCallback('CREATE_FUNCTION', function (button) {
        Blockly.Procedures.createProcedureByPrompt(button.getTargetWorkspace());
    });

    // Listen for workspace changes to update code and auto-save
    // Listen for workspace changes to update code and auto-save
    workspace.addChangeListener(function (event) {
        if (event.type !== Blockly.Events.UI) {
            updateCode();
            autoSaveWorkspace();
        }
    });

    // Custom: Trigger file picker on block click (Direct DOM listener for browser compatibility)
    blocklyDiv.addEventListener('click', function (e) {
        let node = e.target;
        while (node && node !== blocklyDiv) {
            if (node.getAttribute && node.getAttribute('data-id')) {
                const blockId = node.getAttribute('data-id');
                const block = workspace.getBlockById(blockId);
                if (block && block.type === 'cv_load_local') {
                    if (localImageInput) localImageInput.click();
                    return;
                }
            }
            node = node.parentNode;
        }
    }, true);

    // Handle window resize
    window.addEventListener('resize', function () {
        Blockly.svgResize(workspace);
    });

    // Load saved project or add starter blocks
    if (!loadWorkspaceFromLocalStorage()) {
        addStarterBlocks();
    }
}

/**
 * Auto-save workspace to LocalStorage
 */
function autoSaveWorkspace() {
    if (!workspace) return;
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);
    localStorage.setItem('pyblocks_autosave', xmlText);
}

/**
 * Load workspace from LocalStorage
 * @returns {boolean} true if successful
 */
function loadWorkspaceFromLocalStorage() {
    const saved = localStorage.getItem('pyblocks_autosave');
    if (saved) {
        try {
            const xml = Blockly.utils.xml.textToDom(saved);
            Blockly.Xml.domToWorkspace(xml, workspace);
            return true;
        } catch (e) {
            console.warn('Failed to load auto-save:', e);
            return false;
        }
    }
    return false;
}

/**
 * Add starter blocks to the workspace
 */
function addStarterBlocks() {
    const xml = `
        <xml>
            <block type="text_print" x="50" y="50">
                <value name="TEXT">
                    <shadow type="text">
                        <field name="TEXT">Welcome to PyBlocks!</field>
                    </shadow>
                </value>
            </block>
        </xml>
    `;
    try {
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), workspace);
    } catch (e) {
        console.warn('Could not add starter blocks:', e);
    }
}

/**
 * Initialize CodeMirror editor
 */
function initCodeEditor() {
    const codeArea = document.getElementById('codeArea');

    codeEditor = CodeMirror.fromTextArea(codeArea, {
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        readOnly: true,
        lineWrapping: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4
    });

    // Initial code generation
    updateCode();
}

/**
 * Update code editor with generated Python code
 */
function updateCode() {
    if (!workspace || !codeEditor) return;

    try {
        // Generate Python code from blocks using Blockly.Python
        const code = Blockly.Python.workspaceToCode(workspace);
        codeEditor.setValue(code || '# Add blocks to generate Python code');
    } catch (error) {
        console.error('Code generation error:', error);
        codeEditor.setValue('# Error generating code: ' + error.message);
    }
}

/**
 * Initialize panel resizers
 */
function initResizers() {
    const resizer1 = document.getElementById('resizer1');
    const resizer2 = document.getElementById('resizer2');
    const blocksPanel = document.getElementById('blocksPanel');
    const mainRight = document.getElementById('mainRight');
    const codePanel = document.getElementById('codePanel');
    const outputPanel = document.getElementById('outputPanel');

    let isResizing = false;
    let currentResizer = null;

    function startResize(e, resizer) {
        isResizing = true;
        currentResizer = resizer;
        resizer.classList.add('active');
        document.body.style.cursor = resizer === resizer1 ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        if (currentResizer) {
            currentResizer.classList.remove('active');
        }
        currentResizer = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        Blockly.svgResize(workspace);
    }

    function resize(e) {
        if (!isResizing) return;

        if (currentResizer === resizer1) {
            const mainContent = document.querySelector('.main-content');
            const totalWidth = mainContent.offsetWidth;
            const newBlocksWidth = e.clientX;
            const ratio = newBlocksWidth / totalWidth;
            if (ratio > 0.1 && ratio < 0.8) {
                blocksPanel.style.flex = ratio;
                mainRight.style.flex = 1 - ratio;
            }
        } else if (currentResizer === resizer2) {
            const rect = mainRight.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            const totalHeight = mainRight.offsetHeight;
            const ratio = relativeY / totalHeight;
            if (ratio > 0.1 && ratio < 0.9) {
                codePanel.style.flex = ratio;
                outputPanel.style.flex = 1 - ratio;
            }
        }
    }

    resizer1.addEventListener('mousedown', (e) => startResize(e, resizer1));
    resizer2.addEventListener('mousedown', (e) => startResize(e, resizer2));
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    runBtn.addEventListener('click', runCode);
    stopBtn.addEventListener('click', stopCode);
    clearBtn.addEventListener('click', clearWorkspace);
    saveBtn.addEventListener('click', saveProject);
    loadBtn.addEventListener('click', () => fileInput.click());
    copyCodeBtn.addEventListener('click', copyCode);
    clearOutputBtn.addEventListener('click', clearOutput);
    fileInput.addEventListener('change', loadProject);

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => workspace.undo(false));
    }
    if (redoBtn) {
        redoBtn.addEventListener('click', () => workspace.undo(true));
    }

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('pyblocks-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }

        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('pyblocks-theme', isLight ? 'light' : 'dark');
            showToast(isLight ? 'Light theme activated' : 'Dark theme activated', 'info');
        });
    }
}



/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
    }

    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
    }
}

/**
 * Configure Skulpt for Python execution
 */
function configureSkulpt() {
    // Set global limits to be very high as a second-layer safety
    Sk.execLimit = 1000000;
    Sk.timeout = 0;

    Sk.configure({
        output: function (text) {
            appendOutput(text.replace(/\n$/, ''));
        },
        read: function (filename) {
            if (Sk.builtinFiles !== undefined && Sk.builtinFiles["files"][filename] !== undefined) {
                return Sk.builtinFiles["files"][filename];
            }
            console.log("Skulpt looking for: " + filename);
            throw "File not found: '" + filename + "'";
        },
        inputfun: function (prompt) {
            return new Promise(function (resolve) {
                const userInput = window.prompt(prompt);
                resolve(userInput || '');
            });
        },
        inputfunTakesPrompt: true,
        // Interrupt & Yield logic
        execLimit: 10000, // Yield to the browser every 10,000 instructions
        timeout: 0,       // Disable the internal watchdog timer
        yieldCondition: function () {
            // ALWAYS return true here. 
            // In Skulpt, returning true resets the instruction counter and watchdog.
            // This prevents TimeLimitError even in infinite loops.
            return true;
        },
        handleInterrupt: function () {
            if (!isRunning) throw new Sk.builtin.RuntimeError("Execution stopped");
        },
        __future__: Sk.python3
    });

    // Simple Matplotlib canvas configuration handled by plt_wrapper.js
    document.getElementById('modalCanvasContainer').innerHTML = '';
}

/**
 * Clear the plotting canvas
 */
function resetPlotCanvas() {
    const container = document.getElementById('modalCanvasContainer');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Run the Python code using Skulpt
 */
function runCode() {
    if (isRunning) return;

    const code = codeEditor.getValue();
    if (!code || code.startsWith('# Add blocks') || code.startsWith('# Error')) {
        showToast('Add some blocks first!', 'info');
        return;
    }

    isRunning = true;
    window.isRunning = true;
    runBtn.disabled = true;
    stopBtn.disabled = false;
    document.body.classList.add('running');

    // Clear previous output
    clearOutput();
    resetPlotCanvas();
    if (window.resetMatplotlib) window.resetMatplotlib();
    appendOutput('▶ Running code...', 'info');
    appendOutput('─'.repeat(40), 'info');

    // Plotting is now handled by plt_wrapper.js via a modal
    // No need for inline display logic here

    // Configure and run with Skulpt
    configureSkulpt();

    Sk.misceval.asyncToPromise(function () {
        return Sk.importMainWithBody("<stdin>", false, code, true);
    }).then(function () {
        appendOutput('─'.repeat(40), 'info');
        appendOutput('✓ Finished successfully', 'success');
        finishExecution();
    }).catch(function (err) {
        appendOutput('Error: ' + err.toString(), 'error');
        appendOutput('─'.repeat(40), 'info');
        appendOutput('✗ Execution failed', 'error');
        finishExecution();
    });
}

/**
 * Stop code execution
 */
function stopCode() {
    finishExecution();
    appendOutput('■ Execution stopped', 'warning');
}

/**
 * Finish code execution
 */
function finishExecution() {
    isRunning = false;
    window.isRunning = false;
    runBtn.disabled = false;
    stopBtn.disabled = true;
    document.body.classList.remove('running');

    // Stop any pending speech
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Append output to the console
 */
function appendOutput(text, className = '') {
    // Remove welcome message if present
    const welcome = outputEl.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }

    const line = document.createElement('div');
    line.className = 'output-line' + (className ? ' ' + className : '');
    line.textContent = text;
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
}

/**
 * Clear the output console
 */
function clearOutput() {
    outputEl.innerHTML = '';
}

/**
 * Clear the Blockly workspace
 */
function clearWorkspace() {
    if (confirm('Are you sure you want to clear the workspace?')) {
        workspace.clear();
        updateCode();
        showToast('Workspace cleared', 'info');
    }
}

/**
 * Copy code to clipboard
 */
function copyCode() {
    const code = codeEditor.getValue();
    navigator.clipboard.writeText(code).then(() => {
        showToast('Code copied to clipboard!', 'success');
    }).catch(err => {
        showToast('Failed to copy code', 'error');
    });
}

/**
 * Save project to file
 */
function saveProject() {
    // Get project name from input field
    const projectNameInput = document.getElementById('projectName');
    const projectName = projectNameInput ? projectNameInput.value.trim() || 'My Project' : 'My Project';

    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);

    const projectData = {
        version: '1.0',
        name: projectName,
        created: new Date().toISOString(),
        blocks: xmlText,
        code: codeEditor.getValue()
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Use project name as filename (sanitize for valid filename)
    const fileName = projectName.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_') + '.json';

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Project "' + projectName + '" saved!', 'success');
}


/**
 * Load project from file
 */
function loadProject(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const projectData = JSON.parse(e.target.result);

            if (projectData.blocks) {
                workspace.clear();
                const xml = Blockly.utils.xml.textToDom(projectData.blocks);
                Blockly.Xml.domToWorkspace(xml, workspace);
                updateCode();

                // Restore project name if available
                if (projectData.name) {
                    const projectNameInput = document.getElementById('projectName');
                    if (projectNameInput) {
                        projectNameInput.value = projectData.name;
                    }
                }

                showToast('Project "' + (projectData.name || 'Untitled') + '" loaded!', 'success');
            }
        } catch (error) {
            showToast('Failed to load project: Invalid file format', 'error');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}


/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
    };

    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('PyBlocks app.js loaded');
