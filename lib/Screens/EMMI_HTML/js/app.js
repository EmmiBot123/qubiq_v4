/**
 * ESP32 Blockly - Main Application (OttoBlockly Style)
 */

class ESP32BlocklyApp {
    constructor() {
        this.workspace = null;
        this.currentLanguage = 'arduino';
        this.uiLanguage = 'en';
        this.currentLevel = 1;
        this.codePanelVisible = true;
        this.port = null;
        this.writer = null;
        this.reader = null;
        this.lastEmmiScript = '';
        this.emmiExporter = new EMMIScriptExporter();
        this.awsSdkLoadPromise = null;
        this.serialListenersAttached = false;
        this.usbDisconnectInProgress = false;
        this.usbHealthIntervalId = null;
        this.usbNoSignalCount = 0;
        this.usbEverHadSignal = false;
        this.lastSerialRxAt = 0;
        this.uploadConfirmationResolver = null;
        this.uploadConfirmationRejecter = null;
        this.uploadConfirmationToken = ':$#$:';
        this.uploadConfirmationTimeoutMs = 12000;
        this.toastHideTimeoutId = null;
        this.serialBuffer = '';
        this.aiRequestInFlight = false;
        this.aiBlockTypeMap = this.buildDefaultBlocklyMap();
        this.loadedBoardAssets = new Set();
        this.loadingScripts = {};
        this.missingGeneratorWarned = new Set();

        // Firmware S3 configuration
        this.FIRMWARE_BASE_URL = 'https://emmi-lite-firmware.s3.us-east-1.amazonaws.com';
        this.FIRMWARE_FILES = [
            { name: 'bootloader.bin', offset: 0x1000 },
            { name: 'partitions.bin', offset: 0x8000 },
            { name: 'firmware.bin', offset: 0x10000 }
        ];
        this.FIRMWARE_VERSION_URL = this.FIRMWARE_BASE_URL + '/version.txt';
        this.installedFirmwareVersion = this.getInstalledFirmwareVersion();
        this.latestFirmwareVersion = null;
        this.firmwareFlashInProgress = false;

        // Listen for authentication tokens from Flutter (for EMMI Lite WebView)
        window.addEventListener('message', (event) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data && data.type === 'emmi_auth') {
                    window.EMMI_AUTH_TOKEN = data.token;
                    window.EMMI_SCHOOL_ID = data.schoolId;
                    console.log("EMMI_HTML received auth token from Flutter host.");
                }
            } catch (err) {
                // Ignore parsing errors for other messages
            }
        });

        this.init();
    }

    init() {
        this.initBlockly();
        window.loadEmmiProgramToBlockly = (program) => this.loadEmmiProgramToBlockly(program);
        this.bindEvents();
        this.initializeBoardSelector();
        this.hideLoading();
        this.switchLanguage('arduino');
        console.log('ESP32 Blockly initialized');
    }

    initBlockly() {
        const blocklyDiv = document.getElementById('blockly-workspace');
        const codePanel = document.getElementById('code-panel');

        // Calculate workspace width (minus code panel)
        const codePanelWidth = codePanel ? codePanel.offsetWidth : 300;

        this.workspace = Blockly.inject(blocklyDiv, {
            toolbox: this.getSafeToolbox(ESP32Toolbox),
            media: 'lib/blockly/media/',
            grid: { spacing: 20, length: 3, colour: '#8a9aaa', snap: true },
            zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
            trashcan: true,
            move: { scrollbars: true, drag: true, wheel: true },
            renderer: 'geras',
            theme: Blockly.Themes.Classic
        });

        // Register Dynamic Variable Category
        this.workspace.registerToolboxCategoryCallback('VARIABLE_DYNAMIC', this.getVariableCategory.bind(this));
        this.workspace.registerButtonCallback('CREATE_VARIABLE', () => this.openVariableModal());

        // Add change listener for code generation
        this.workspace.addChangeListener((event) => {
            if (event.type !== Blockly.Events.UI) {
                this.updateCode();
            }
        });

        // Handle window resize (Standard)
        window.addEventListener('resize', () => {
            Blockly.svgResize(this.workspace);
        });

        // Advanced Resizing: Use ResizeObserver to detect container size changes
        // This fixes issues where the sidebar gets "stuck" when panels open/close
        const resizeObserver = new ResizeObserver(() => {
            Blockly.svgResize(this.workspace);
        });
        resizeObserver.observe(blocklyDiv);
    }

    getSafeToolbox(toolbox) {
        if (!toolbox || toolbox.kind !== 'categoryToolbox' || !Array.isArray(toolbox.contents)) {
            return toolbox;
        }

        const removedTypes = [];

        const sanitizeItems = (items) => {
            const out = [];
            for (const item of items || []) {
                if (!item) continue;

                if (item.kind === 'category') {
                    const cloned = { ...item };
                    if (Array.isArray(item.contents)) {
                        cloned.contents = sanitizeItems(item.contents);
                    }
                    out.push(cloned);
                    continue;
                }

                if (item.kind === 'block') {
                    if (item.type && Blockly.Blocks[item.type]) {
                        out.push(item);
                    } else if (item.type) {
                        removedTypes.push(item.type);
                    }
                    continue;
                }

                out.push(item);
            }
            return out;
        };

        const safeToolbox = {
            ...toolbox,
            contents: sanitizeItems(toolbox.contents)
        };

        if (removedTypes.length > 0) {
            console.warn('Removed toolbox blocks without definitions:', Array.from(new Set(removedTypes)));
        }

        return safeToolbox;
    }

    buildDefaultBlocklyMap() {
        return {
            base: {
                type: 'base_setup_loop',
                setupInput: 'SETUP',
                loopInput: 'LOOP'
            },
            blocks: {
                delay: 'custom_wait',
                setVar: 'custom_variable_set',
                changeVar: 'custom_variable_change',
                if: 'custom_controls_if',
                while: 'custom_controls_whileUntil',
                for: 'custom_controls_for',
                break: 'custom_flow_statements',
                logicCompare: 'logic_compare',
                logicAnd: 'custom_logic_and',
                mathArithmetic: 'math_arithmetic',
                forVarName: 'i'
            },
            value: {
                number: 'math_number',
                text: 'custom_text_value',
                variable: 'custom_variable_get',
                touch: 'emmi_touch_read',
                mic: 'emmi_mic_read',
                light: 'emmi_light_read'
            },
            commandMap: {
                ERN: { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_RED', STATE: 'HIGH' } },
                ERF: { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_RED', STATE: 'LOW' } },
                EGN: { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_GREEN', STATE: 'HIGH' } },
                EGF: { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_GREEN', STATE: 'LOW' } },
                EBN: { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_BLUE', STATE: 'HIGH' } },
                EBF: { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_BLUE', STATE: 'LOW' } },
                EAN: [
                    { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_RED', STATE: 'HIGH' } },
                    { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_GREEN', STATE: 'HIGH' } },
                    { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_BLUE', STATE: 'HIGH' } }
                ],
                EAF: [
                    { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_RED', STATE: 'LOW' } },
                    { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_GREEN', STATE: 'LOW' } },
                    { type: 'emmi_eyes_digital', fields: { PIN: 'PIN_EYE_BLUE', STATE: 'LOW' } }
                ],
                MF: { type: 'emmi_wheels_simple', fields: { DIRECTION: 'FORWARD', SPEED: '180', STEP: '1' } },
                MB: { type: 'emmi_wheels_simple', fields: { DIRECTION: 'BACKWARD', SPEED: '180', STEP: '1' } },
                ML: { type: 'emmi_wheels_simple', fields: { DIRECTION: 'LEFT', SPEED: '180', STEP: '1' } },
                MR: { type: 'emmi_wheels_simple', fields: { DIRECTION: 'RIGHT', SPEED: '180', STEP: '1' } },
                BS: { type: 'emmi_buzzer_stop', fields: { PIN: 'PIN_BUZZER' } },
                X: { type: 'custom_flow_statements', fields: { FLOW: 'BREAK' } }
            }
        };
    }

    appendAiChatMessage(role, message, kind = 'assistant') {
        const container = document.getElementById('ai-chat-output');
        if (!container || !message) return;

        // Remove welcome message on first real message
        const welcome = container.querySelector('.chatbot-welcome');
        if (welcome) welcome.remove();

        const item = document.createElement('div');
        item.className = 'ai-chat-msg ' + (kind || 'assistant');
        item.textContent = (role ? role + ': ' : '') + message;
        container.appendChild(item);
        container.scrollTop = container.scrollHeight;
    }

    showTypingIndicator() {
        const container = document.getElementById('ai-chat-output');
        if (!container) return;
        // Remove existing typing indicator
        this.removeTypingIndicator();
        const typing = document.createElement('div');
        typing.className = 'chatbot-typing';
        typing.id = 'chatbot-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    removeTypingIndicator() {
        const el = document.getElementById('chatbot-typing');
        if (el) el.remove();
    }

    toggleChatbot(forceOpen) {
        const panel = document.getElementById('chatbot-panel');
        const toggle = document.getElementById('chatbot-toggle');
        const backdrop = document.getElementById('chatbot-backdrop');
        if (!panel) return;

        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('open');

        panel.classList.toggle('open', shouldOpen);
        if (toggle) toggle.classList.toggle('active', shouldOpen);
        if (backdrop) backdrop.classList.toggle('visible', shouldOpen);

        if (shouldOpen) {
            const input = document.getElementById('ai-prompt-input');
            if (input) setTimeout(() => input.focus(), 350);
        }
    }

    clearChatMessages() {
        const container = document.getElementById('ai-chat-output');
        if (!container) return;
        container.innerHTML = '<div class="chatbot-welcome"><i class="fas fa-wand-magic-sparkles"></i><p>Describe what you want your EMMI robot to do and I\'ll generate the blocks for you.</p></div>';
    }

    getApiBaseCandidates() {
        const bases = [];
        const add = (value) => {
            if (!value || typeof value !== 'string') return;
            const cleaned = value.replace(/\/$/, '');
            if (!bases.includes(cleaned)) {
                bases.push(cleaned);
            }
        };

        add('');

        if (typeof window !== 'undefined') {
            if (typeof window.EMMI_API_BASE_URL === 'string') {
                add(window.EMMI_API_BASE_URL);
            }
            try {
                const stored = window.localStorage.getItem('emmi_api_base_url');
                if (stored) add(stored);
            } catch (_) {
                // localStorage access may fail in restricted environments
            }
        }

        return bases;
    }

    getDirectAiConfig() {
        const readStored = (key) => {
            try {
                return window.localStorage.getItem(key) || '';
            } catch (_) {
                return '';
            }
        };

        const provider = (window.EMMI_AI_PROVIDER || readStored('emmi_ai_provider') || 'openrouter').toLowerCase();
        const model = window.EMMI_AI_MODEL || readStored('emmi_ai_model') || 'openai/gpt-4.1-mini';
        const baseUrl = (window.OPENROUTER_BASE_URL || readStored('emmi_openrouter_base_url') || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
        const apiKey = window.OPENROUTER_API_KEY || readStored('emmi_openrouter_api_key') || '';
        return { provider, model, baseUrl, apiKey };
    }

    extractFirstJsonObject(text) {
        if (typeof text !== 'string') return null;
        const trimmed = text.trim();
        try {
            return JSON.parse(trimmed);
        } catch (_) {
            const start = trimmed.indexOf('{');
            const end = trimmed.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    return JSON.parse(trimmed.slice(start, end + 1));
                } catch (_) {
                    return null;
                }
            }
            return null;
        }
    }

    sanitizeScalarValue(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value.trim().slice(0, 120);
        return 0;
    }

    sanitizeExpr(expr, warnings) {
        if (!expr || typeof expr !== 'object') {
            warnings.push('Invalid condition replaced with 1==0.');
            return { op: '==', left: 1, right: 0 };
        }
        const op = typeof expr.op === 'string' ? expr.op.trim() : '';
        const validOps = new Set(['==', '!=', '>', '>=', '<', '<=']);
        const safeOp = validOps.has(op) ? op : '==';
        if (safeOp !== op) {
            warnings.push('Unsupported expression operator replaced with ==.');
        }
        return {
            op: safeOp,
            left: this.sanitizeScalarValue(expr.left),
            right: this.sanitizeScalarValue(expr.right)
        };
    }

    sanitizeNodeList(nodes, warnings, depth = 0) {
        if (!Array.isArray(nodes) || depth > 6) return [];
        const out = [];

        for (const raw of nodes.slice(0, 200)) {
            if (!raw || typeof raw !== 'object') continue;
            const type = typeof raw.type === 'string' ? raw.type.trim() : '';

            switch (type) {
                case 'cmd': {
                    const cmd = typeof raw.cmd === 'string' ? raw.cmd.trim().toUpperCase() : '';
                    if (cmd) out.push({ type: 'cmd', cmd });
                    break;
                }
                case 'delay':
                    out.push({ type: 'delay', ms: Math.max(0, Math.round(Number(raw.ms) || 0)) });
                    break;
                case 'set_var': {
                    const varType = typeof raw.varType === 'string' ? raw.varType.toUpperCase() : 'I';
                    const safeType = /^[IFCSB]$/.test(varType) ? varType : 'I';
                    const index = Math.max(1, Math.min(5, Math.round(Number(raw.index) || 1)));
                    const op = raw.op === '+' ? '+' : '=';
                    out.push({
                        type: 'set_var',
                        varType: safeType,
                        index,
                        op,
                        value: this.sanitizeScalarValue(raw.value)
                    });
                    break;
                }
                case 'if':
                    out.push({
                        type: 'if',
                        expr: this.sanitizeExpr(raw.expr, warnings),
                        then: this.sanitizeNodeList(raw.then, warnings, depth + 1),
                        else: this.sanitizeNodeList(raw.else, warnings, depth + 1)
                    });
                    break;
                case 'while':
                    out.push({
                        type: 'while',
                        expr: this.sanitizeExpr(raw.expr, warnings),
                        body: this.sanitizeNodeList(raw.body, warnings, depth + 1)
                    });
                    break;
                case 'for': {
                    let step = Math.round(Number(raw.step) || 1);
                    if (step === 0) step = 1;
                    out.push({
                        type: 'for',
                        start: Math.round(Number(raw.start) || 0),
                        end: Math.round(Number(raw.end) || 0),
                        step,
                        body: this.sanitizeNodeList(raw.body, warnings, depth + 1)
                    });
                    break;
                }
                case 'switch': {
                    const cases = Array.isArray(raw.cases) ? raw.cases.slice(0, 12).map((entry) => ({
                        match: this.sanitizeScalarValue(entry && entry.match),
                        body: this.sanitizeNodeList(entry && entry.body, warnings, depth + 1)
                    })) : [];
                    out.push({
                        type: 'switch',
                        value: this.sanitizeScalarValue(raw.value),
                        cases,
                        default: this.sanitizeNodeList(raw.default, warnings, depth + 1)
                    });
                    break;
                }
                case 'break':
                    out.push({ type: 'break' });
                    break;
                default:
                    if (type) {
                        warnings.push('Skipped unsupported node type: ' + type);
                    }
            }
        }

        return out;
    }

    sanitizeProgram(program, warnings) {
        const source = program && typeof program === 'object' ? program : {};

        // Log warnings for bad AI-generated init flags (diagnostic only)
        const allowedInit = new Set(['E', 'B', 'M', 'T', 'A', 'V']);
        const btFlags = [];
        for (const raw of (Array.isArray(source.initFlags) ? source.initFlags : [])) {
            const token = typeof raw === 'string' ? raw.trim() : '';
            if (!token) continue;
            if (/^R".*"$/.test(token)) {
                btFlags.push(token);
            } else if (!allowedInit.has(token)) {
                warnings.push('Dropped unsupported init flag: ' + token);
            }
        }

        const setup = this.sanitizeNodeList(source.setup, warnings, 0);
        const loop = this.sanitizeNodeList(source.loop, warnings, 0);

        // Infer hardware init flags from commands actually used in the program
        const inferred = this.inferInitFlags(setup, loop);
        const initFlags = inferred.concat(btFlags);

        return { initFlags, setup, loop };
    }

    /**
     * Walk sanitized AST nodes and infer which hardware init flags are needed.
     * Returns an ordered array like ['E', 'M', 'T'] based on commands and
     * sensor references found in the program.
     */
    inferInitFlags(setup, loop) {
        const flags = new Set();

        const scanValue = (val) => {
            if (typeof val !== 'string') return;
            const s = val.trim().toUpperCase();
            if (s === 'TR') flags.add('T');
            else if (s === 'AR') flags.add('A');
            else if (s === 'VR') flags.add('V');
        };

        const scanExpr = (expr) => {
            if (!expr || typeof expr !== 'object') return;
            scanValue(expr.left);
            scanValue(expr.right);
        };

        const scanNodes = (nodes) => {
            if (!Array.isArray(nodes)) return;
            for (const node of nodes) {
                if (!node || typeof node !== 'object') continue;
                switch (node.type) {
                    case 'cmd': {
                        const cmd = typeof node.cmd === 'string' ? node.cmd.toUpperCase() : '';
                        if (/^E[RGBA][NF]$/.test(cmd)) flags.add('E');
                        else if (/^M[FBLRS]$/.test(cmd)) flags.add('M');
                        else if (/^B[SNF]/.test(cmd) || /^B[NF]\d/.test(cmd)) flags.add('B');
                        break;
                    }
                    case 'set_var':
                        scanValue(typeof node.value === 'string' ? node.value : '');
                        break;
                    case 'if':
                        scanExpr(node.expr);
                        scanNodes(node.then);
                        scanNodes(node.else);
                        break;
                    case 'while':
                        scanExpr(node.expr);
                        scanNodes(node.body);
                        break;
                    case 'for':
                        scanNodes(node.body);
                        break;
                    case 'switch':
                        scanValue(typeof node.value === 'string' ? node.value : '');
                        if (Array.isArray(node.cases)) {
                            for (const c of node.cases) {
                                if (c) scanNodes(c.body);
                            }
                        }
                        scanNodes(node.default);
                        break;
                }
            }
        };

        scanNodes(setup);
        scanNodes(loop);

        const order = ['E', 'B', 'M', 'T', 'A', 'V'];
        return order.filter((f) => flags.has(f));
    }

    hasProgramActions(program) {
        const setup = Array.isArray(program?.setup) ? program.setup.length : 0;
        const loop = Array.isArray(program?.loop) ? program.loop.length : 0;
        return (setup + loop) > 0;
    }

    parseRequestedDelayMs(text) {
        const matchMs = text.match(/(\d{2,5})\s*(ms|msec|millisecond)/i);
        if (matchMs) return Math.max(20, Math.min(10000, Number(matchMs[1])));
        const matchSec = text.match(/(\d{1,3})\s*(s|sec|second)/i);
        if (matchSec) return Math.max(20, Math.min(10000, Number(matchSec[1]) * 1000));
        return 500;
    }

    serializeValueToken(value) {
        if (typeof value === 'number' && Number.isFinite(value)) return String(value);
        if (typeof value === 'boolean') return value ? '1' : '0';
        if (typeof value !== 'string') return '0';

        const token = value.trim();
        if (!token) return '""';
        if (/^-?\d+(\.\d+)?$/.test(token)) return token;
        if (/^[IFCSB][1-5]$/.test(token)) return token;
        if (/^(TR|AR|VR)$/.test(token)) return token;
        if (/^(["']).*\1$/.test(token)) return token;
        return '"' + token.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    }

    serializeExprToken(expr) {
        const opMap = { '==': '=', '!=': '!=', '>': '>', '>=': '>=', '<': '<', '<=': '<=' };
        const op = opMap[expr.op] || '=';
        return 'O' + op + ',' + this.serializeValueToken(expr.left) + ',' + this.serializeValueToken(expr.right);
    }

    serializeNodeTokens(nodes) {
        const out = [];
        for (const node of (Array.isArray(nodes) ? nodes : [])) {
            switch (node.type) {
                case 'cmd':
                    out.push(node.cmd);
                    break;
                case 'delay':
                    out.push('D' + String(Math.max(0, Math.round(node.ms))));
                    break;
                case 'set_var':
                    out.push('G(' + node.varType + ',' + node.index + ',' + node.op + ',' + this.serializeValueToken(node.value) + ')');
                    break;
                case 'if': {
                    const thenBody = this.serializeNodeTokens(node.then);
                    const elseBody = this.serializeNodeTokens(node.else);
                    out.push('C(' + this.serializeExprToken(node.expr) + '){' + (thenBody.length ? '|' + thenBody.join('|') + '|' : '') + '}{' + (elseBody.length ? '|' + elseBody.join('|') + '|' : '') + '}');
                    break;
                }
                case 'while': {
                    const body = this.serializeNodeTokens(node.body);
                    out.push('W(' + this.serializeExprToken(node.expr) + '){' + (body.length ? '|' + body.join('|') + '|' : '') + '}');
                    break;
                }
                case 'for': {
                    const body = this.serializeNodeTokens(node.body);
                    out.push('F(' + node.start + '-' + node.end + ',' + node.step + '){' + (body.length ? '|' + body.join('|') + '|' : '') + '}');
                    break;
                }
                case 'switch': {
                    const parts = [];
                    for (const entry of (Array.isArray(node.cases) ? node.cases : [])) {
                        const body = this.serializeNodeTokens(entry.body);
                        parts.push('(' + this.serializeValueToken(entry.match) + '){' + (body.length ? '|' + body.join('|') + '|' : '') + '}');
                    }
                    const defaultBody = this.serializeNodeTokens(node.default);
                    parts.push('(D){' + (defaultBody.length ? '|' + defaultBody.join('|') + '|' : '') + '}');
                    out.push('K(' + this.serializeValueToken(node.value) + ', ' + parts.join(' ') + ')');
                    break;
                }
                case 'break':
                    out.push('X');
                    break;
                default:
                    break;
            }
        }
        return out;
    }

    buildScriptFromProgram(program) {
        const init = (Array.isArray(program.initFlags) ? program.initFlags : []).join('|');
        const setup = this.serializeNodeTokens(program.setup).join('|');
        const loop = this.serializeNodeTokens(program.loop).join('|');
        return '|I|' + init + '|S|' + setup + '|L|' + loop + '|';
    }

    buildHeuristicAiPayload(message) {
        const text = String(message || '').toLowerCase();

        const hasState = text.includes('i1') || text.includes('state');
        const hasTouch = text.includes('touch');
        const hasRgb = text.includes('green') && text.includes('red') && text.includes('blue');
        if (hasState && hasTouch && hasRgb) {
            const delay = text.includes('500') || text.includes('debounce') ? 500 : 300;
            const program = {
                initFlags: ['E', 'T'],
                setup: [{ type: 'set_var', varType: 'I', index: 1, op: '=', value: 0 }],
                loop: [
                    {
                        type: 'if',
                        expr: { op: '==', left: 'TR', right: 1 },
                        then: [
                            { type: 'set_var', varType: 'I', index: 1, op: '+', value: 1 },
                            {
                                type: 'if',
                                expr: { op: '>', left: 'I1', right: 2 },
                                then: [{ type: 'set_var', varType: 'I', index: 1, op: '=', value: 0 }],
                                else: []
                            },
                            { type: 'delay', ms: delay }
                        ],
                        else: []
                    },
                    {
                        type: 'switch',
                        value: 'I1',
                        cases: [
                            { match: 0, body: [{ type: 'cmd', cmd: 'EAF' }, { type: 'cmd', cmd: 'EGN' }] },
                            { match: 1, body: [{ type: 'cmd', cmd: 'EAF' }, { type: 'cmd', cmd: 'ERN' }] },
                            { match: 2, body: [{ type: 'cmd', cmd: 'EAF' }, { type: 'cmd', cmd: 'EBN' }] }
                        ],
                        default: [{ type: 'cmd', cmd: 'EAF' }]
                    }
                ]
            };

            return {
                program,
                explanation: 'Touch increments I1 with wrap-around and updates LED color by state.',
                warnings: ['Using local heuristic translator.']
            };
        }

        const mentionsEyes = text.includes('led') || text.includes('eye') || text.includes('eyes') || text.includes('rgb');
        if (!mentionsEyes) {
            return null;
        }

        const delay = this.parseRequestedDelayMs(text);
        const color = text.includes('green') ? 'green'
            : text.includes('blue') ? 'blue'
                : text.includes('all') ? 'all'
                    : 'red';
        const tokenPair = {
            red: ['ERN', 'ERF'],
            green: ['EGN', 'EGF'],
            blue: ['EBN', 'EBF'],
            all: ['EAN', 'EAF']
        }[color];

        const wantsBlink = text.includes('blink') || text.includes('blinking') || text.includes('flash') || text.includes('toggle');
        const wantsOff = text.includes(' off') || text.includes('switch off') || text.includes('turn off') || text.includes('disable');

        const loop = [];
        if (wantsBlink) {
            loop.push({ type: 'cmd', cmd: tokenPair[0] });
            loop.push({ type: 'delay', ms: delay });
            loop.push({ type: 'cmd', cmd: tokenPair[1] });
            loop.push({ type: 'delay', ms: delay });
        } else {
            loop.push({ type: 'cmd', cmd: wantsOff ? tokenPair[1] : tokenPair[0] });
        }

        const program = {
            initFlags: ['E'],
            setup: [],
            loop
        };

        return {
            program,
            explanation: wantsBlink
                ? ('Blinking ' + color + ' LED by toggling eyes on/off with a delay.')
                : ('Setting ' + color + ' LED ' + (wantsOff ? 'off' : 'on') + '.'),
            warnings: ['Using local heuristic translator.']
        };
    }

    async requestDirectAiTranslation(mode, message) {
        const config = this.getDirectAiConfig();
        const warnings = ['Using direct browser AI mode (no backend route).'];

        const heuristic = this.buildHeuristicAiPayload(message);

        if (config.provider !== 'openrouter' || !config.apiKey) {
            if (heuristic) {
                const script = this.buildScriptFromProgram(heuristic.program);
                return mode === 'legacy'
                    ? { script, explanation: heuristic.explanation, warnings: warnings.concat(heuristic.warnings) }
                    : { program: heuristic.program, script, explanation: heuristic.explanation, warnings: warnings.concat(heuristic.warnings) };
            }
            throw new Error('Set OpenRouter key in browser: localStorage.setItem("emmi_openrouter_api_key","<key>")');
        }

        const systemPrompt = [
            'You convert user intent into an EMMI robot program as JSON AST.',
            'Return ONLY valid JSON. No markdown fences, no commentary outside JSON.',
            '',
            'RESPONSE SHAPE:',
            '{"program":{"initFlags":[],"setup":[],"loop":[]},"explanation":"...","warnings":[]}',
            '',
            'NODE TYPES (use these exactly):',
            '- {"type":"cmd","cmd":"TOKEN"} — hardware command (see VALID TOKENS below)',
            '- {"type":"delay","ms":500} — pause in milliseconds',
            '- {"type":"set_var","varType":"I","index":1,"op":"=","value":0} — variable. varType: I|F|C|S|B, index: 1-5, op: "=" or "+"',
            '- {"type":"if","expr":{"op":"==","left":"TR","right":1},"then":[...],"else":[]}',
            '- {"type":"while","expr":{...},"body":[...]}',
            '- {"type":"for","start":0,"end":10,"step":1,"body":[...]}',
            '- {"type":"switch","value":"I1","cases":[{"match":0,"body":[...]}],"default":[...]}',
            '- {"type":"break"}',
            '',
            'VALID CMD TOKENS (use ONLY these in cmd nodes):',
            'Eyes: ERN(red on), ERF(red off), EGN(green on), EGF(green off), EBN(blue on), EBF(blue off), EAN(all on), EAF(all off)',
            'Motors: MF(forward), MB(backward), ML(left), MR(right), MS(stop)',
            'Buzzer: BS(stop)',
            'IMPORTANT: Do NOT invent tokens. Only use the tokens listed above.',
            '',
            'SENSOR VALUES (use in expr left/right, NOT as cmd):',
            'TR = touch sensor, AR = audio/mic, VR = light/LDR',
            '',
            'VARIABLE REFS: I1-I5(int), F1-F5(float), C1-C5(char), S1-S5(string), B1-B5(bool)',
            '',
            'EXPRESSION: {"op":"==","left":"TR","right":1}  ops: ==, !=, >, >=, <, <=',
            '',
            'INIT FLAGS: E=Eyes, B=Buzzer, M=Motors, T=Touch, A=Audio, V=Light',
            'Include only flags for hardware actually used.',
            '',
            'RULES:',
            '- AR is ACTIVE-LOW: AR==0 means noise detected, AR==1 means quiet',
            '- VR is INVERSE: brighter light -> lower value; direct light ~600',
            '- For LED blink: use cmd on + delay + cmd off + delay in loop',
            '- Use conservative safe defaults when ambiguous',
            '- Keep explanation and warnings concise',
            '',
            'EXAMPLE — blink red LED every 500ms:',
            '{"program":{"initFlags":["E"],"setup":[],"loop":[{"type":"cmd","cmd":"ERN"},{"type":"delay","ms":500},{"type":"cmd","cmd":"ERF"},{"type":"delay","ms":500}]},"explanation":"Blinks red LED on/off every 500ms.","warnings":[]}'
        ].join('\n');

        const response = await fetch(config.baseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + config.apiKey
            },
            body: JSON.stringify({
                model: config.model,
                temperature: 0.2,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: JSON.stringify({ message }) }
                ]
            })
        });

        if (!response.ok) {
            if (heuristic) {
                const script = this.buildScriptFromProgram(heuristic.program);
                warnings.push('AI request failed, used local heuristic fallback.');
                return mode === 'legacy'
                    ? { script, explanation: heuristic.explanation, warnings: warnings.concat(heuristic.warnings) }
                    : { program: heuristic.program, script, explanation: heuristic.explanation, warnings: warnings.concat(heuristic.warnings) };
            }
            const text = await response.text();
            throw new Error('Direct AI request failed: ' + response.status + ' ' + text);
        }

        const body = await response.json();
        const content = body && body.choices && body.choices[0] && body.choices[0].message
            ? body.choices[0].message.content
            : '';
        const parsed = this.extractFirstJsonObject(content);
        if (!parsed) {
            throw new Error('AI returned invalid JSON.');
        }

        const sanitizeWarnings = [];
        const rawProgram = parsed.program && typeof parsed.program === 'object' ? parsed.program : parsed;
        let safeProgram = this.sanitizeProgram(rawProgram, sanitizeWarnings);
        let script = this.buildScriptFromProgram(safeProgram);

        if (!this.hasProgramActions(safeProgram) && heuristic) {
            safeProgram = heuristic.program;
            script = this.buildScriptFromProgram(safeProgram);
            sanitizeWarnings.push('AI returned empty program. Applied heuristic block generation.');
        }

        const validation = this.emmiExporter.validateScript(script);
        if (!validation.valid) {
            if (heuristic) {
                safeProgram = heuristic.program;
                script = this.buildScriptFromProgram(safeProgram);
                sanitizeWarnings.push('AI output invalid. Applied heuristic block generation.');
            } else {
                throw new Error('Generated script invalid: ' + validation.error);
            }
        }

        const explanation = typeof parsed.explanation === 'string' && parsed.explanation.trim()
            ? parsed.explanation.trim()
            : 'Program generated successfully.';
        const mergedWarnings = warnings
            .concat(Array.isArray(parsed.warnings) ? parsed.warnings.map((w) => String(w)) : [])
            .concat(sanitizeWarnings);

        if (mode === 'legacy') {
            return { script, explanation, warnings: mergedWarnings };
        }

        return {
            program: safeProgram,
            script,
            explanation,
            warnings: mergedWarnings
        };
    }

    async requestTranslation(endpoint, message) {
        window.EMMI_AUTH_TOKEN = window.EMMI_AUTH_TOKEN || localStorage.getItem('EMMI_AUTH_TOKEN');
        window.EMMI_SCHOOL_ID = window.EMMI_SCHOOL_ID || localStorage.getItem('EMMI_SCHOOL_ID');

        if (window.EMMI_AUTH_TOKEN && window.EMMI_SCHOOL_ID) {
            try {
                const proxyUrl = 'https://edu-ai-backend-vl7s.onrender.com/proxy/chat';

                const systemPrompt = [
                    'You convert user intent into an EMMI robot program as JSON AST.',
                    'Return ONLY valid JSON. No markdown fences, no commentary outside JSON.',
                    '',
                    'RESPONSE SHAPE:',
                    '{"program":{"initFlags":[],"setup":[],"loop":[]},"explanation":"...","warnings":[]}',
                    '',
                    'NODE TYPES (use these exactly):',
                    '- {"type":"cmd","cmd":"TOKEN"} — hardware command (see VALID TOKENS below)',
                    '- {"type":"delay","ms":500} — pause in milliseconds',
                    '- {"type":"set_var","varType":"I","index":1,"op":"=","value":0} — variable. varType: I|F|C|S|B, index: 1-5, op: "=" or "+"',
                    '- {"type":"if","expr":{"op":"==","left":"TR","right":1},"then":[...],"else":[]}',
                    '- {"type":"while","expr":{...},"body":[...]}',
                    '- {"type":"for","start":0,"end":10,"step":1,"body":[...]}',
                    '- {"type":"switch","value":"I1","cases":[{"match":0,"body":[...]}],"default":[...]}',
                    '- {"type":"break"}',
                    '',
                    'VALID CMD TOKENS (use ONLY these in cmd nodes):',
                    'Eyes: ERN(red on), ERF(red off), EGN(green on), EGF(green off), EBN(blue on), EBF(blue off), EAN(all on), EAF(all off)',
                    'Motors: MF(forward), MB(backward), ML(left), MR(right), MS(stop)',
                    'Buzzer: BS(stop)',
                    'IMPORTANT: Do NOT invent tokens. Only use the tokens listed above.',
                    '',
                    'SENSOR VALUES (use in expr left/right, NOT as cmd):',
                    'TR = touch sensor, AR = audio/mic, VR = light/LDR',
                    '',
                    'VARIABLE REFS: I1-I5(int), F1-F5(float), C1-C5(char), S1-S5(string), B1-B5(bool)',
                    '',
                    'EXPRESSION: {"op":"==","left":"TR","right":1}  ops: ==, !=, >, >=, <, <=',
                    '',
                    'INIT FLAGS: E=Eyes, B=Buzzer, M=Motors, T=Touch, A=Audio, V=Light',
                    'Include only flags for hardware actually used.',
                    '',
                    'RULES:',
                    '- AR is ACTIVE-LOW: AR==0 means noise detected, AR==1 means quiet',
                    '- VR is INVERSE: brighter light -> lower value; direct light ~600',
                    '- For LED blink: use cmd on + delay + cmd off + delay in loop',
                    '- Use conservative safe defaults when ambiguous',
                    '- Keep explanation and warnings concise',
                    '',
                    'EXAMPLE — blink red LED every 500ms:',
                    '{"program":{"initFlags":["E"],"setup":[],"loop":[{"type":"cmd","cmd":"ERN"},{"type":"delay","ms":500},{"type":"cmd","cmd":"ERF"},{"type":"delay","ms":500}]},"explanation":"Blinks red LED on/off every 500ms.","warnings":[]}'
                ].join('\n');

                const combinedPrompt = systemPrompt + '\n\nUser Request:\n' + JSON.stringify({ message });

                const response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + window.EMMI_AUTH_TOKEN
                    },
                    body: JSON.stringify({
                        prompt: combinedPrompt,
                        botType: 'emmiLite',
                        schoolId: window.EMMI_SCHOOL_ID
                    })
                });

                if (!response.ok) {
                    throw new Error('Backend Proxy Error: ' + await response.text());
                }

                const data = await response.json();
                const content = data.response || data.reply || data;

                let parseTarget = typeof content === 'string' ? content : JSON.stringify(content);

                // Add console logging for debugging
                console.log("PROXY RAW DATA:", data);
                console.log("PROXY CONTENT TO PARSE:", parseTarget);

                const parsed = this.extractFirstJsonObject(parseTarget);

                if (!parsed) {
                    console.error("PROXY PARSE FAILED. parseTarget was:", parseTarget);
                    throw new Error('AI returned invalid JSON formatting. Raw: ' + parseTarget.substring(0, 100));
                }

                const sanitizeWarnings = [];
                const rawProgram = parsed.program && typeof parsed.program === 'object' ? parsed.program : parsed;
                let safeProgram = this.sanitizeProgram(rawProgram, sanitizeWarnings);
                let script = this.buildScriptFromProgram(safeProgram);

                const mode = endpoint.includes('translate-blockly') ? 'blockly' : 'legacy';
                if (!this.hasProgramActions(safeProgram)) {
                    const heuristic = this.buildHeuristicAiPayload(message);
                    if (heuristic) {
                        safeProgram = heuristic.program;
                        script = this.buildScriptFromProgram(safeProgram);
                        sanitizeWarnings.push('AI returned blank program. Applied fallback blocks.');
                    }
                }

                const explanation = parsed.explanation || 'Program generated successfully via proxy.';
                const mergedWarnings = (Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : []).concat(sanitizeWarnings);

                if (mode === 'legacy') {
                    return { script, explanation, warnings: mergedWarnings };
                }
                return { program: safeProgram, script, explanation, warnings: mergedWarnings };
            } catch (err) {
                console.error("PROXY ROUTE ERROR DETAILED:", err.message, err.stack);
                throw new Error("Proxy connection failed: " + err.message);
            }
        }

        const candidates = this.getApiBaseCandidates();
        let lastError = null;

        for (const base of candidates) {
            const url = (base || '') + endpoint;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });

                let payload = null;
                try {
                    payload = await response.json();
                } catch (err) {
                    payload = null;
                }

                if (response.ok) {
                    return payload || {};
                }

                if (response.status === 404) {
                    lastError = new Error('Endpoint not found at ' + (base || 'current origin'));
                    continue;
                }

                const errMessage = payload && payload.error
                    ? payload.error
                    : ('Request failed (' + response.status + ')');
                throw new Error(errMessage);
            } catch (err) {
                lastError = err;
            }
        }

        const mode = endpoint.includes('translate-blockly') ? 'blockly' : 'legacy';
        return this.requestDirectAiTranslation(mode, message);
    }

    getAiTranslateMode() {
        return document.getElementById('ai-translate-mode')?.value || 'blockly';
    }

    loadEmmiProgramToBlockly(program) {
        if (!window.EMMIBlocklyMapper || typeof window.EMMIBlocklyMapper.loadProgramIntoWorkspace !== 'function') {
            throw new Error('Blockly mapper is not loaded.');
        }
        if (!this.workspace) {
            throw new Error('Blockly workspace is not ready.');
        }

        const result = window.EMMIBlocklyMapper.loadProgramIntoWorkspace(
            this.workspace,
            program,
            this.aiBlockTypeMap
        );

        this.updateCode();
        return result;
    }

    async handleAiGenerate() {
        if (this.aiRequestInFlight) return;

        const input = document.getElementById('ai-prompt-input');
        const button = document.getElementById('btn-ai-generate');
        const message = (input?.value || '').trim();
        if (!message) {
            this.showToast('Please enter a description for AI generation.', 'error');
            return;
        }

        // Auto-open chatbot panel
        this.toggleChatbot(true);

        const mode = this.getAiTranslateMode();
        const endpoint = mode === 'legacy' ? '/api/translate' : '/api/translate-blockly';
        this.aiRequestInFlight = true;
        if (button) button.disabled = true;
        if (input) input.value = '';

        this.appendAiChatMessage('You', message, 'user');
        this.showTypingIndicator();

        try {
            const payload = await this.requestTranslation(endpoint, message);

            this.removeTypingIndicator();

            if (payload.explanation) {
                this.appendAiChatMessage('AI', payload.explanation, 'assistant');
            }

            const warnings = Array.isArray(payload.warnings) ? payload.warnings : [];
            for (const warning of warnings) {
                this.appendAiChatMessage('Warning', warning, 'warn');
            }

            if (typeof payload.script === 'string' && payload.script.trim()) {
                this.lastEmmiScript = payload.script;
                this.appendAiChatMessage('Script', payload.script, 'assistant');
            }

            if (mode !== 'legacy' && payload.program) {
                const mapped = this.loadEmmiProgramToBlockly(payload.program);
                const mapperWarnings = Array.isArray(mapped?.warnings) ? mapped.warnings : [];
                for (const warning of mapperWarnings) {
                    this.appendAiChatMessage('Blockly', warning, 'warn');
                }
                this.showToast('AI program loaded into Blockly.', 'success');
            } else {
                this.showToast('AI translation complete.', 'success');
            }
        } catch (err) {
            this.removeTypingIndicator();
            this.appendAiChatMessage('Error', err.message, 'error');
            this.showToast(err.message, 'error', { persistent: true, showClose: true });
        } finally {
            this.aiRequestInFlight = false;
            if (button) button.disabled = false;
        }
    }

    updateDynamicControls(mode) {
        const cloudInput = document.getElementById('input-cloud-id');
        const connectBtn = document.getElementById('btn_connect');
        const connectLabel = document.getElementById('lbl_connect');
        const connectIcon = connectBtn?.querySelector('i');

        if (!cloudInput || !connectBtn) return;

        console.log('Switching to mode:', mode);
        this.showToast('Switched to ' + mode + ' Mode');

        if (mode === 'Cloud') {
            cloudInput.style.display = 'block';
            connectBtn.style.display = 'none';
        } else {
            cloudInput.style.display = 'none';
            connectBtn.style.display = 'flex';

            if (mode === 'USB') {
                if (this.isUsbActuallyConnected()) {
                    connectLabel.textContent = 'Disconnect';
                    connectIcon.className = 'fas fa-unlink';
                    connectBtn.title = 'Disconnect USB Serial';
                    connectBtn.classList.add('connected');
                } else {
                    connectLabel.textContent = 'Connect USB';
                    connectIcon.className = 'fas fa-plug';
                    connectBtn.title = 'Connect via USB Serial';
                    connectBtn.classList.remove('connected');
                }
            } else if (mode === 'BLE') {
                connectLabel.textContent = 'Connect BLE';
                connectIcon.className = 'fab fa-bluetooth-b';
                connectBtn.title = 'Connect via Bluetooth';
                connectBtn.classList.remove('connected');
            }
        }
    }

    isUsbActuallyConnected() {
        return Boolean(this.port && (this.port.readable || this.port.writable));
    }

    updateUsbButtonState(isConnected) {
        const btn = document.getElementById('btn_connect');
        const label = document.getElementById('lbl_connect');
        const icon = btn?.querySelector('i');

        if (label) label.textContent = isConnected ? 'Disconnect' : 'Connect USB';
        if (btn) {
            btn.classList.toggle('connected', isConnected);
            btn.title = isConnected ? 'Disconnect USB Serial' : 'Connect via USB Serial';
        }
        if (icon) {
            icon.className = isConnected ? 'fas fa-unlink' : 'fas fa-plug';
        }
    }

    startUsbHealthMonitor() {
        this.stopUsbHealthMonitor();
        this.usbHealthIntervalId = setInterval(() => {
            this.checkUsbHealth().catch((err) => {
                console.warn('USB health check failed:', err);
            });
        }, 1500);
    }

    stopUsbHealthMonitor() {
        if (this.usbHealthIntervalId) {
            clearInterval(this.usbHealthIntervalId);
            this.usbHealthIntervalId = null;
        }
    }

    async checkUsbHealth() {
        if (!this.port || this.usbDisconnectInProgress) return;

        if (!this.isUsbActuallyConnected()) {
            await this.cleanupUsbConnection({
                showToast: true,
                message: 'USB connection lost',
                toastType: 'error',
                tryClosePort: false
            });
            return;
        }

        if ('serial' in navigator && typeof navigator.serial.getPorts === 'function') {
            try {
                const ports = await navigator.serial.getPorts();
                if (!ports.includes(this.port)) {
                    await this.cleanupUsbConnection({
                        showToast: true,
                        message: 'USB device removed',
                        toastType: 'error',
                        tryClosePort: false
                    });
                    return;
                }
            } catch (err) {
                console.warn('navigator.serial.getPorts check failed:', err);
            }
        }

        if (typeof this.port.getSignals === 'function') {
            try {
                const signals = await this.port.getSignals();
                const hasAnySignal = Boolean(
                    signals.clearToSend ||
                    signals.dataSetReady ||
                    signals.dataCarrierDetect ||
                    signals.ringIndicator
                );

                if (hasAnySignal) {
                    this.usbEverHadSignal = true;
                    this.usbNoSignalCount = 0;
                } else if (this.usbEverHadSignal) {
                    this.usbNoSignalCount += 1;
                    if (this.usbNoSignalCount >= 3) {
                        await this.cleanupUsbConnection({
                            showToast: true,
                            message: 'ESP32 appears powered off',
                            toastType: 'error',
                            tryClosePort: false
                        });
                    }
                }
            } catch (err) {
                await this.cleanupUsbConnection({
                    showToast: true,
                    message: 'USB connection lost',
                    toastType: 'error',
                    tryClosePort: false
                });
            }
        }
    }

    async cleanupUsbConnection({
        showToast = false,
        message = '',
        toastType = 'info',
        tryClosePort = true
    } = {}) {
        if (this.usbDisconnectInProgress) return;
        this.usbDisconnectInProgress = true;
        this.keepReading = false;

        try {
            if (this.reader) {
                try {
                    await this.reader.cancel();
                } catch (err) {
                    console.warn('Reader cancel during cleanup failed:', err);
                }
            }

            if (this.writer) {
                try {
                    this.writer.releaseLock();
                } catch (err) {
                    console.warn('Writer release during cleanup failed:', err);
                }
            }

            if (tryClosePort && this.port && (this.port.readable || this.port.writable)) {
                try {
                    await this.port.close();
                } catch (err) {
                    console.warn('Port close during cleanup failed:', err);
                }
            }
        } finally {
            if (this.uploadConfirmationRejecter) {
                this.uploadConfirmationRejecter(new Error('USB disconnected while waiting for ESP32 confirmation.'));
            }
            this.stopUsbHealthMonitor();
            this.reader = null;
            this.writer = null;
            this.port = null;
            this.usbNoSignalCount = 0;
            this.usbEverHadSignal = false;
            this.lastSerialRxAt = 0;
            this.serialBuffer = '';
            this.usbDisconnectInProgress = false;
            this.updateUsbButtonState(false);
            this.updateDynamicControls(this.getSelectedBotMode());
        }

        if (showToast && message) {
            this.showToast(message, toastType);
        }
    }

    handleSerialDisconnectEvent(event) {
        if (!this.port) return;
        const disconnectedPort = event?.port || event?.target || null;
        if (disconnectedPort && disconnectedPort !== this.port) {
            return;
        }

        console.warn('Serial disconnect event detected', event);
        this.cleanupUsbConnection({
            showToast: true,
            message: 'USB device removed',
            toastType: 'error',
            tryClosePort: false
        });
    }

    bindEvents() {
        // Toolbar buttons

        // Toolbar buttons
        document.getElementById('btn-new')?.addEventListener('click', () => this.newProject());
        document.getElementById('btn-open')?.addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('btn-save')?.addEventListener('click', () => this.saveProject());
        document.getElementById('btn-block-creator')?.addEventListener('click', () => window.open('block-creator.html', '_blank'));
        // File input
        document.getElementById('file-input')?.addEventListener('change', (e) => this.loadProject(e));

        // Code tabs
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchLanguage(tab.dataset.lang));
        });

        // Code actions
        document.getElementById('btn_copy')?.addEventListener('click', () => this.copyCode());
        document.getElementById('btn_saveino')?.addEventListener('click', () => this.downloadCode());
        document.getElementById('btn_send_emmi')?.addEventListener('click', () => this.sendCurrentEmmiScript());
        document.getElementById('btn_upload_last_emmi')?.addEventListener('click', () => this.sendLastEmmiScript());

        // Language selector
        document.getElementById('languageMenu')?.addEventListener('change', (e) => this.setUILanguage(e.target.value));

        // Board selector - Update toolbox when board changes
        document.getElementById('board-select')?.addEventListener('change', (e) => this.changeBoardType(e.target.value));

        // Code Preview Toggle
        document.getElementById('btn_preview')?.addEventListener('click', () => this.toggleCodePanel());

        // Firmware Update Modal bindings
        document.getElementById('btn-close-firmware')?.addEventListener('click', () => this.closeFirmwareModal());
        document.getElementById('btn-firmware-cancel')?.addEventListener('click', () => this.closeFirmwareModal());
        document.getElementById('btn-firmware-flash')?.addEventListener('click', () => this.flashFirmwareFromS3());

        // Ensure title is correct
        const btnToggle = document.getElementById('btn_toggle');
        if (btnToggle) btnToggle.title = "Firmware Update";

        // Run Button
        document.getElementById('btn_run')?.addEventListener('click', () => {
            this.sendCurrentEmmiScript();
        });

        document.getElementById('btn-ai-generate')?.addEventListener('click', () => this.handleAiGenerate());
        document.getElementById('ai-prompt-input')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.handleAiGenerate();
            }
        });

        // Chatbot panel controls
        document.getElementById('chatbot-toggle')?.addEventListener('click', () => this.toggleChatbot());
        document.getElementById('chatbot-close')?.addEventListener('click', () => this.toggleChatbot(false));
        document.getElementById('chatbot-clear')?.addEventListener('click', () => this.clearChatMessages());

        // Create and attach backdrop for mobile
        if (!document.getElementById('chatbot-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'chatbot-backdrop';
            backdrop.className = 'chatbot-backdrop';
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => this.toggleChatbot(false));
        }

        // Bot Mode Segmented Control
        // Bot Mode Segmented Control
        document.querySelectorAll('input[name="bot-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.updateDynamicControls(e.target.value);
                }
            });
        });

        // Variable Modal
        // Use optional chaining carefully, or check existence
        const btnCloseVar = document.getElementById('btn-close-variable');
        if (btnCloseVar) btnCloseVar.addEventListener('click', () => this.closeVariableModal());

        const btnConfirmVar = document.getElementById('btn-confirm-variable');
        if (btnConfirmVar) {
            btnConfirmVar.addEventListener('click', () => {
                console.log('OK Button Clicked');
                this.confirmVariable();
            });
        }

        const outputVar = document.getElementById('variable-name-input');
        if (outputVar) {
            outputVar.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') this.confirmVariable();
            });
        }

        // Connect Button
        document.getElementById('btn_connect')?.addEventListener('click', async () => {
            const mode = document.querySelector('input[name="bot-mode"]:checked').value;
            if (mode === 'USB') {
                if (this.port) {
                    await this.disconnectUSB();
                } else {
                    await this.connectUSB();
                }
            } else if (mode === 'BLE') {
                this.showToast('Scanning for BLE Devices...', 'info');
                // Mock BLE connection
                setTimeout(() => this.showToast('Connected to EMMI-BOT (BLE)', 'success'), 1500);
            }
        });

        // Initialize controls state
        this.updateDynamicControls('USB');

        // Serial connect/disconnect listeners
        if ('serial' in navigator && !this.serialListenersAttached) {
            navigator.serial.addEventListener('disconnect', (event) => this.handleSerialDisconnectEvent(event));
            this.serialListenersAttached = true;
        }

        // Firmware Update Button
        document.getElementById('btn_firmware')?.addEventListener('click', () => {
            this.showToast('Checking for Firmware Updates...', 'info');
            // Mock firmware check
            setTimeout(() => {
                this.showToast('Firmware is up to date!', 'success');
            }, 1500);
        });

        // Window control buttons
        document.getElementById('btn_max')?.addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        });

        // Serial Monitor Events
        document.getElementById('btn_search')?.addEventListener('click', () => this.toggleSerialMonitor());
        document.getElementById('btn-close-serial')?.addEventListener('click', () => this.closeSerialMonitor());
        document.getElementById('btn-send-serial')?.addEventListener('click', () => this.sendSerial());
        document.getElementById('btn-clear-serial')?.addEventListener('click', () => {
            document.getElementById('serial-output').textContent = '';
        });
        document.getElementById('serial-input')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.sendSerial();
        });
    }

    async connectUSB() {
        if ('serial' in navigator) {
            try {
                this.port = await navigator.serial.requestPort();
                await this.port.open({ baudRate: 115200 });

                this.showToast('USB Connected!', 'success');
                this.updateUsbButtonState(true);
                this.usbNoSignalCount = 0;
                this.usbEverHadSignal = false;
                this.lastSerialRxAt = Date.now();
                this.serialBuffer = '';

                // Start reading loop
                this.keepReading = true;
                this.readLoop();
                this.startUsbHealthMonitor();

            } catch (err) {
                console.error('Serial Connection Error:', err);
                this.port = null;
                this.updateUsbButtonState(false);
                this.showToast('Failed to connect: ' + err.message, 'error');
            }
        } else {
            this.showToast('Web Serial API not supported.', 'error');
        }
    }

    async disconnectUSB() {
        if (!this.port) {
            this.updateUsbButtonState(false);
            return;
        }

        try {
            await this.cleanupUsbConnection({
                showToast: true,
                message: 'USB Disconnected',
                toastType: 'info',
                tryClosePort: true
            });
        } catch (err) {
            console.error('Error closing port:', err);
            this.showToast('Error disconnecting: ' + err.message, 'error');
        }
    }

    async readLoop() {
        let readError = null;

        while (this.port && this.keepReading) {
            if (!this.port.readable) {
                break;
            }

            this.reader = this.port.readable.getReader();
            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        // Reader has been canceled.
                        break;
                    }
                    if (value) {
                        const text = new TextDecoder().decode(value);
                        this.lastSerialRxAt = Date.now();
                        this.usbNoSignalCount = 0;
                        this.handleIncomingSerialText(text);
                        this.writeToSerialMonitor(text);
                    }
                }
            } catch (error) {
                console.error('Read error:', error);
                readError = error;
                break;
            } finally {
                try {
                    this.reader.releaseLock();
                } catch (err) {
                    console.warn('Reader release error:', err);
                }
                this.reader = null;
            }
        }

        if (this.keepReading && this.port && !this.isUsbActuallyConnected()) {
            await this.cleanupUsbConnection({
                showToast: true,
                message: 'USB device removed',
                toastType: 'error',
                tryClosePort: false
            });
            return;
        }

        if (this.keepReading && readError && this.port) {
            await this.cleanupUsbConnection({
                showToast: true,
                message: 'USB connection lost',
                toastType: 'error',
                tryClosePort: false
            });
        }
    }

    writeToSerialMonitor(text) {
        const output = document.getElementById('serial-output');
        if (output) {
            const timestamp = document.getElementById('chk-timestamp')?.checked;
            if (timestamp) {
                const now = new Date();
                const time = now.toLocaleTimeString('en-GB') + '.' + String(now.getMilliseconds()).padStart(3, '0');
                const tsPrefix = `[${time}] -> `;

                // Check if we are at the start of a new line (or buffer empty)
                // Note: we check output.textContent to see if the previous print ended with a newline
                const isAtStart = output.textContent.length === 0 || output.textContent.endsWith('\n');

                if (isAtStart) {
                    text = tsPrefix + text;
                }

                // Replace all newlines that are NOT at the very end of the string
                // This splits the chunk into lines and timestamps them, but leaves the final newline alone
                // so the NEXT chunk will generate a fresh timestamp for the next line.
                text = text.replace(/\n(?!$)/g, '\n' + tsPrefix);
            }

            output.textContent += text;

            if (document.getElementById('chk-autoscroll')?.checked) {
                output.scrollTop = output.scrollHeight;
            }
        }
    }

    handleIncomingSerialText(text) {
        if (!text) return;

        this.serialBuffer += text;
        if (this.serialBuffer.length > 4096) {
            this.serialBuffer = this.serialBuffer.slice(-4096);
        }

        if (this.uploadConfirmationResolver && this.serialBuffer.includes(this.uploadConfirmationToken)) {
            this.serialBuffer = '';
            this.uploadConfirmationResolver();
        }
    }

    waitForUploadConfirmation() {
        if (this.serialBuffer.includes(this.uploadConfirmationToken)) {
            this.serialBuffer = '';
            return Promise.resolve();
        }

        if (this.uploadConfirmationRejecter) {
            this.uploadConfirmationRejecter(new Error('Previous upload confirmation wait was replaced.'));
        }

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (this.uploadConfirmationRejecter) {
                    this.uploadConfirmationRejecter(
                        new Error('Upload failed: no response from ESP32. Check if EMMI BOT V2 is turned on or if another product is connected.')
                    );
                }
            }, this.uploadConfirmationTimeoutMs);

            const complete = () => {
                clearTimeout(timeoutId);
                this.uploadConfirmationResolver = null;
                this.uploadConfirmationRejecter = null;
                resolve();
            };

            const fail = (error) => {
                clearTimeout(timeoutId);
                this.uploadConfirmationResolver = null;
                this.uploadConfirmationRejecter = null;
                reject(error instanceof Error ? error : new Error(String(error)));
            };

            this.uploadConfirmationResolver = complete;
            this.uploadConfirmationRejecter = fail;
        });
    }

    async sendSerial() {
        if (!this.port || !this.port.writable) {
            this.showToast('Not connected!', 'error');
            return;
        }

        const input = document.getElementById('serial-input');
        const text = input.value;
        if (!text) return;

        const writer = this.port.writable.getWriter();
        try {
            const data = new TextEncoder().encode(text + '\n'); // Add newline
            await writer.write(data);
            input.value = '';
            // Echo locally?
            this.writeToSerialMonitor('> ' + text + '\n');
        } catch (err) {
            console.error('Write error:', err);
            this.showToast('Failed to send', 'error');
        } finally {
            writer.releaseLock();
        }
    }

    generateEmmiScript() {
        const generated = this.emmiExporter.generateFromWorkspace(this.workspace);
        const validation = this.emmiExporter.validateScript(generated.script);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        this.lastEmmiScript = generated.script;
        return generated;
    }

    async sendEmmiScriptToSerial(script) {
        if (!script || !script.trim()) {
            throw new Error('EMMI script is empty.');
        }

        if (!this.port) {
            await this.connectUSB();
        }
        if (!this.port) {
            throw new Error('Serial port unavailable.');
        }
        if (!this.port.writable) {
            await this.port.open({ baudRate: 115200 });
        }

        const writer = this.port.writable.getWriter();
        try {
            console.log('EMMI TX:', script);
            const payload = new TextEncoder().encode(script + '\n');
            await writer.write(payload);
            this.writeToSerialMonitor('> EMMI TX: ' + script + '\n');
        } catch (err) {
            console.error('EMMI send failed:', err);
            throw new Error('Failed to send EMMI script: ' + err.message);
        } finally {
            writer.releaseLock();
        }
    }

    getSelectedBotMode() {
        const selected = document.querySelector('input[name="bot-mode"]:checked');
        return selected ? selected.value : 'USB';
    }

    getCloudConfig() {
        let config = null;

        const direct = localStorage.getItem('emmiCloudConfig');
        if (direct) {
            try {
                config = JSON.parse(direct);
            } catch (err) {
                console.warn('Invalid emmiCloudConfig in localStorage:', err);
            }
        }

        if (!config) {
            const creatorRaw = localStorage.getItem('blockCreatorData');
            if (creatorRaw) {
                try {
                    const creatorData = JSON.parse(creatorRaw);
                    config = creatorData.cloudConfig || null;
                } catch (err) {
                    console.warn('Invalid blockCreatorData in localStorage:', err);
                }
            }
        }

        return {
            accessKeyId: config?.accessKeyId || '',
            secretAccessKey: config?.secretAccessKey || '',
            region: config?.region || '',
            bucketName: config?.bucketName || ''
        };
    }

    normalizeCloudConfig(config = {}) {
        const src = config && typeof config === 'object' ? config : {};
        return {
            accessKeyId: String(src.accessKeyId || '').trim(),
            secretAccessKey: String(src.secretAccessKey || '').trim(),
            region: String(src.region || '').trim(),
            bucketName: String(src.bucketName || '').trim()
        };
    }

    isCloudConfigComplete(config) {
        const cfg = this.normalizeCloudConfig(config);
        return Boolean(cfg.accessKeyId && cfg.secretAccessKey && cfg.region && cfg.bucketName);
    }

    async fetchCloudConfigFromServer() {
        try {
            const response = await fetch('/api/cloud-config', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const body = await response.json();
            const cloudConfig = this.normalizeCloudConfig(body.cloudConfig || body);
            if (!this.isCloudConfigComplete(cloudConfig)) {
                return null;
            }

            try {
                localStorage.setItem('emmiCloudConfig', JSON.stringify(cloudConfig));
            } catch (_) {
                // localStorage can fail in restricted browser contexts
            }

            return cloudConfig;
        } catch (err) {
            console.warn('Could not load cloud config from server:', err.message);
            return null;
        }
    }

    async getCloudConfigWithFallback() {
        const localConfig = this.normalizeCloudConfig(this.getCloudConfig());
        if (this.isCloudConfigComplete(localConfig)) {
            return localConfig;
        }

        const serverConfig = await this.fetchCloudConfigFromServer();
        if (serverConfig) {
            return serverConfig;
        }

        return localConfig;
    }

    validateCloudConfig(config) {
        if (!config.accessKeyId) {
            throw new Error('Cloud config missing Access Key ID. Set it in Block Creator > Cloud Settings.');
        }
        if (!config.secretAccessKey) {
            throw new Error('Cloud config missing Secret Access Key. Set it in Block Creator > Cloud Settings.');
        }
        if (!config.region) {
            throw new Error('Cloud config missing Region. Set it in Block Creator > Cloud Settings.');
        }
        if (!config.bucketName) {
            throw new Error('Cloud config missing Bucket Name. Set it in Block Creator > Cloud Settings.');
        }
    }

    buildCloudCorsHelp(error, bucketName) {
        const raw = (error && (error.message || error.code || String(error))) || 'Unknown cloud error';
        const needsLocalhost = window.location.protocol === 'file:';
        const endpointOrigin = window.location.origin || 'null';

        let help = 'Cloud upload failed: ' + raw + '.';
        help += ' Ensure S3 CORS allows your app origin and required methods/headers.';
        if (needsLocalhost) {
            help += ' You are running from file:// (origin null); run via http://localhost instead.';
        }
        help += ' Bucket: ' + bucketName + ', Origin: ' + endpointOrigin + '.';
        return help;
    }

    async ensureAwsSdkLoaded() {
        if (window.AWS && window.AWS.S3) {
            return;
        }

        if (!this.awsSdkLoadPromise) {
            this.awsSdkLoadPromise = new Promise((resolve, reject) => {
                const existing = document.getElementById('aws-sdk-script');
                if (existing) {
                    existing.addEventListener('load', () => resolve());
                    existing.addEventListener('error', () => reject(new Error('Failed to load AWS SDK script.')));
                    return;
                }

                const script = document.createElement('script');
                script.id = 'aws-sdk-script';
                script.src = 'https://sdk.amazonaws.com/js/aws-sdk-2.1563.0.min.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load AWS SDK script.'));
                document.head.appendChild(script);
            });
        }

        await this.awsSdkLoadPromise;
    }

    async sendEmmiScriptToCloud(script) {
        if (!script || !script.trim()) {
            throw new Error('EMMI script is empty.');
        }

        if (window.location.protocol === 'file:') {
            throw new Error('Cloud upload requires HTTP/HTTPS origin. Open the app via localhost (not file://).');
        }

        const cloudDeviceId = (document.getElementById('input-cloud-id')?.value || '').trim();
        if (!cloudDeviceId) {
            throw new Error('Cloud Device ID is required in Cloud mode.');
        }

        const cloudConfig = await this.getCloudConfigWithFallback();
        this.validateCloudConfig(cloudConfig);
        await this.ensureAwsSdkLoaded();

        window.AWS.config.update({
            accessKeyId: cloudConfig.accessKeyId,
            secretAccessKey: cloudConfig.secretAccessKey,
            region: cloudConfig.region
        });

        const s3 = new window.AWS.S3({ apiVersion: '2006-03-01' });
        const devicePrefix = cloudDeviceId + '/';

        let prefixExists = false;
        try {
            const listing = await s3.listObjectsV2({
                Bucket: cloudConfig.bucketName,
                Prefix: devicePrefix,
                MaxKeys: 1
            }).promise();
            prefixExists = Array.isArray(listing.Contents) && listing.Contents.length > 0;
        } catch (err) {
            console.error('Cloud directory check failed:', err);
            throw new Error(this.buildCloudCorsHelp(err, cloudConfig.bucketName));
        }

        if (!prefixExists) {
            throw new Error('Device directory "' + devicePrefix + '" not found in bucket "' + cloudConfig.bucketName + '".');
        }

        const commandKey = devicePrefix + cloudDeviceId + '_cmd.txt';
        const checkKey = devicePrefix + cloudDeviceId + '_check.txt';

        console.log('Cloud TX:', {
            bucket: cloudConfig.bucketName,
            prefix: devicePrefix,
            commandKey,
            checkKey,
            payload: script
        });

        try {
            await s3.putObject({
                Bucket: cloudConfig.bucketName,
                Key: commandKey,
                Body: script,
                ContentType: 'text/plain'
            }).promise();

            await s3.putObject({
                Bucket: cloudConfig.bucketName,
                Key: checkKey,
                Body: '1',
                ContentType: 'text/plain'
            }).promise();
        } catch (err) {
            console.error('Cloud upload failed:', err);
            throw new Error(this.buildCloudCorsHelp(err, cloudConfig.bucketName));
        }
    }

    async sendCurrentEmmiScript() {
        try {
            const generated = this.generateEmmiScript();
            const mode = this.getSelectedBotMode();

            if (mode === 'Cloud') {
                this.showToast('Sending EMMI script to cloud...', 'info');
                await this.sendEmmiScriptToCloud(generated.script);
                this.showToast('Cloud upload completed successfully.', 'success');
            } else {
                if (mode === 'USB') {
                    this.serialBuffer = '';
                    this.showToast('Uploading command...', 'info', {
                        persistent: true,
                        showClose: true
                    });
                } else {
                    this.showToast('Sending EMMI script...', 'info');
                }

                await this.sendEmmiScriptToSerial(generated.script);

                if (mode === 'USB') {
                    await this.waitForUploadConfirmation();
                    this.showToast('Upload successful.', 'success', {
                        durationMs: 2000,
                        showClose: true
                    });
                } else {
                    this.showToast('EMMI script sent successfully.', 'success');
                }
            }

            if (this.currentLanguage === 'emmi') {
                this.updateCode();
            }
        } catch (err) {
            this.showToast(err.message, 'error', {
                persistent: true,
                showClose: true
            });
        }
    }

    async sendLastEmmiScript() {
        try {
            if (!this.lastEmmiScript) {
                const generated = this.generateEmmiScript();
                this.lastEmmiScript = generated.script;
            }

            const mode = this.getSelectedBotMode();
            if (mode === 'Cloud') {
                await this.sendEmmiScriptToCloud(this.lastEmmiScript);
                this.showToast('Last EMMI script uploaded to cloud!', 'success');
            } else {
                await this.sendEmmiScriptToSerial(this.lastEmmiScript);
                this.showToast('Last EMMI script sent!', 'success');
            }
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    }

    toggleSerialMonitor() {
        const modal = document.getElementById('serial-monitor-modal');
        if (modal.classList.contains('hidden')) {
            this.openSerialMonitor();
        } else {
            this.closeSerialMonitor();
        }
    }

    toggleCodePanel() {
        const panel = document.getElementById('code-panel');
        if (panel) {
            panel.classList.toggle('hidden');
            // Trigger resize for Blockly
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        }
    }

    openSerialMonitor() {
        document.getElementById('serial-monitor-modal').classList.remove('hidden');
    }

    closeSerialMonitor() {
        document.getElementById('serial-monitor-modal').classList.add('hidden');
    }

    // ── Firmware Version Tracking ──────────────────────────────────────

    getInstalledFirmwareVersion() {
        try {
            return localStorage.getItem('emmiFirmwareVersion') || null;
        } catch (_) {
            return null;
        }
    }

    setInstalledFirmwareVersion(version) {
        try {
            localStorage.setItem('emmiFirmwareVersion', version);
            this.installedFirmwareVersion = version;
        } catch (_) { }
    }

    async fetchFirmwareVersion() {
        const resp = await fetch(this.FIRMWARE_VERSION_URL, { cache: 'no-store' });
        if (!resp.ok) throw new Error('Failed to fetch firmware version (HTTP ' + resp.status + ')');
        return (await resp.text()).trim();
    }

    // ── Firmware Modal ───────────────────────────────────────────────

    openFirmwareModal() {
        document.getElementById('firmware-update-modal')?.classList.remove('hidden');
    }

    closeFirmwareModal() {
        if (this.firmwareFlashInProgress) return; // Don't close mid-flash
        document.getElementById('firmware-update-modal')?.classList.add('hidden');
        // Reset UI
        this.setFirmwareProgress(0, false);
        this.setFirmwareLog('', false);
        this.setFirmwareStatus('');
    }

    setFirmwareStatus(text) {
        const el = document.getElementById('firmware-status-text');
        if (el) el.textContent = text;
    }

    setFirmwareStatusWithConnect(message) {
        const el = document.getElementById('firmware-status-text');
        if (!el) return;

        el.innerHTML = '';

        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-triangle';
        icon.style.cssText = 'color: #ff9800; margin-right: 8px;';

        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;

        const connectBtn = document.createElement('button');
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
        connectBtn.style.cssText = 'margin-left: 12px; padding: 6px 16px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s;';
        connectBtn.onmouseenter = () => connectBtn.style.background = '#1976D2';
        connectBtn.onmouseleave = () => connectBtn.style.background = '#2196F3';
        connectBtn.addEventListener('click', async () => {
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            await this.connectUSB();
            // Re-run upload firmware to refresh the modal state
            if (this.port) {
                this.uploadFirmware();
            } else {
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
            }
        });

        el.appendChild(icon);
        el.appendChild(msgSpan);
        el.appendChild(document.createElement('br'));
        el.appendChild(connectBtn);
    }

    setFirmwareProgress(pct, show = true) {
        const container = document.getElementById('firmware-progress-container');
        const bar = document.getElementById('firmware-progress-bar');
        const label = document.getElementById('firmware-progress-text');
        if (container) container.style.display = show ? 'block' : 'none';
        if (bar) bar.style.width = pct + '%';
        if (label) label.textContent = Math.round(pct) + '%';
    }

    setFirmwareLog(text, show = true) {
        const el = document.getElementById('firmware-log');
        if (!el) return;
        el.style.display = show ? 'block' : 'none';
        el.textContent = text;
        el.scrollTop = el.scrollHeight;
    }

    appendFirmwareLog(line) {
        const el = document.getElementById('firmware-log');
        if (!el) return;
        el.style.display = 'block';
        el.textContent += line + '\n';
        el.scrollTop = el.scrollHeight;
    }

    // ── Upload Firmware (Entry Point) ────────────────────────────────

    async uploadFirmware() {
        // Show modal immediately
        this.openFirmwareModal();

        const installedEl = document.getElementById('firmware-installed-version');
        const availableEl = document.getElementById('firmware-available-version');
        const flashBtn = document.getElementById('btn-firmware-flash');

        if (installedEl) installedEl.textContent = this.installedFirmwareVersion || 'Not installed';
        if (availableEl) availableEl.textContent = '...';
        if (flashBtn) flashBtn.disabled = false;

        this.setFirmwareProgress(0, false);
        this.setFirmwareLog('', false);

        // Check if port is connected
        if (!this.port) {
            this.setFirmwareStatusWithConnect('Port not connected. Please connect your device first.');
            if (flashBtn) flashBtn.disabled = true;
            return;
        }

        this.setFirmwareStatus('Checking for updates...');

        try {
            this.latestFirmwareVersion = await this.fetchFirmwareVersion();
            if (availableEl) availableEl.textContent = this.latestFirmwareVersion;

            if (this.installedFirmwareVersion === this.latestFirmwareVersion) {
                this.setFirmwareStatus('Firmware is up to date. You can re-flash if needed.');
            } else if (this.installedFirmwareVersion) {
                this.setFirmwareStatus('A new firmware version is available!');
            } else {
                this.setFirmwareStatus('Ready to install firmware.');
            }
        } catch (err) {
            console.error('Version check failed:', err);
            if (availableEl) availableEl.textContent = 'Error';
            this.setFirmwareStatus('Could not check version: ' + err.message);
        }
    }

    // ── Flash Firmware from S3 ───────────────────────────────────────

    async flashFirmwareFromS3() {
        if (this.firmwareFlashInProgress) return;

        if (!this.port) {
            this.setFirmwareStatusWithConnect('Port not connected. Please connect your device first.');
            return;
        }

        this.firmwareFlashInProgress = true;
        const flashBtn = document.getElementById('btn-firmware-flash');
        if (flashBtn) flashBtn.disabled = true;

        let LoaderClass, TransportClass;

        // 1. Load esptool-js
        if (window.esptool && window.esptool.ESPLoader && window.esptool.Transport) {
            LoaderClass = window.esptool.ESPLoader;
            TransportClass = window.esptool.Transport;
        }

        if (!LoaderClass) {
            this.setFirmwareStatus('Loading flash library...');
            this.appendFirmwareLog('Loading esptool-js...');
            try {
                const module = await import('https://jspm.dev/esptool-js');
                if (module.default && module.default.ESPLoader) {
                    LoaderClass = module.default.ESPLoader;
                    TransportClass = module.default.Transport;
                } else if (module.ESPLoader) {
                    LoaderClass = module.ESPLoader;
                    TransportClass = module.Transport;
                } else if (module.default && module.default.default && module.default.default.ESPLoader) {
                    LoaderClass = module.default.default.ESPLoader;
                    TransportClass = module.default.default.Transport;
                }
                this.appendFirmwareLog('esptool-js loaded.');
            } catch (e) {
                console.error('Failed to load esptool module:', e);
                this.setFirmwareStatus('Error loading flash library: ' + e.message);
                this.firmwareFlashInProgress = false;
                if (flashBtn) flashBtn.disabled = false;
                return;
            }
        }

        if (!LoaderClass || !TransportClass) {
            this.setFirmwareStatus('Error: esptool classes not found');
            this.firmwareFlashInProgress = false;
            if (flashBtn) flashBtn.disabled = false;
            return;
        }

        // 2. Download firmware files from S3
        this.setFirmwareStatus('Downloading firmware files...');
        this.setFirmwareProgress(0, true);
        const fileArray = [];

        try {
            for (let i = 0; i < this.FIRMWARE_FILES.length; i++) {
                const fw = this.FIRMWARE_FILES[i];
                const url = this.FIRMWARE_BASE_URL + '/' + fw.name;
                this.appendFirmwareLog('Downloading ' + fw.name + '...');

                const resp = await fetch(url, { cache: 'no-store' });
                if (!resp.ok) throw new Error('Failed to download ' + fw.name + ' (HTTP ' + resp.status + ')');

                const blob = await resp.blob();
                const data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('Failed to read ' + fw.name));
                    reader.readAsBinaryString(blob);
                });

                fileArray.push({ data: data, address: fw.offset });
                this.appendFirmwareLog(fw.name + ' downloaded (' + Math.round(blob.size / 1024) + ' KB)');

                const downloadPct = ((i + 1) / this.FIRMWARE_FILES.length) * 30;
                this.setFirmwareProgress(downloadPct);
            }
        } catch (err) {
            console.error('Firmware download error:', err);
            this.setFirmwareStatus('Download failed: ' + err.message);
            this.firmwareFlashInProgress = false;
            if (flashBtn) flashBtn.disabled = false;
            return;
        }

        // 3. Flash to ESP32
        this.setFirmwareStatus('Flashing firmware to ESP32...');
        this.setFirmwareProgress(30);

        try {
            await this.stopReadingOnly();

            const transport = new TransportClass(this.port);
            const terminalProxy = {
                clean: () => { },
                writeLine: (data) => {
                    this.appendFirmwareLog(data);
                },
                write: (data) => {
                    this.appendFirmwareLog(data);
                }
            };

            let esploader;
            try {
                esploader = new LoaderClass({
                    transport: transport,
                    baudrate: 921600,
                    terminal: terminalProxy
                });
            } catch (e) {
                esploader = new LoaderClass(transport, 921600, terminalProxy, 921600);
            }

            this.appendFirmwareLog('Connecting to ESP32 bootloader...');
            this.setFirmwareStatus('Connecting to bootloader...');
            this.setFirmwareProgress(35);

            try {
                await esploader.main_fn();
                await esploader.flash_id();
            } catch (e) {
                this.appendFirmwareLog('Connection failed: ' + e.message);
                throw e;
            }

            this.appendFirmwareLog('Connected! Flashing ' + fileArray.length + ' files...');
            this.setFirmwareStatus('Writing flash...');
            this.setFirmwareProgress(40);

            await esploader.write_flash({
                fileArray: fileArray,
                flashSize: 'keep',
                flashMode: 'keep',
                flashFreq: 'keep',
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex, written, total) => {
                    const filePct = total > 0 ? (written / total) : 0;
                    const overallPct = 40 + ((fileIndex + filePct) / fileArray.length) * 55;
                    this.setFirmwareProgress(overallPct);
                }
            });

            this.setFirmwareProgress(100);
            this.appendFirmwareLog('--- FLASH COMPLETE ---');
            this.setFirmwareStatus('Firmware updated successfully!');
            this.showToast('Firmware Updated Successfully!', 'success');

            // Save installed version
            if (this.latestFirmwareVersion) {
                this.setInstalledFirmwareVersion(this.latestFirmwareVersion);
                const installedEl = document.getElementById('firmware-installed-version');
                if (installedEl) installedEl.textContent = this.latestFirmwareVersion;
            }

        } catch (err) {
            console.error('Flash error:', err);
            this.appendFirmwareLog('ERROR: ' + err.message);
            this.setFirmwareStatus('Flash failed: ' + err.message);
            this.showToast('Firmware Update Failed', 'error');
        } finally {
            // Re-enable serial reading
            if (this.port && !this.port.readable) {
                try {
                    await this.port.open({ baudRate: 115200 });
                } catch (e) {
                    console.warn('Could not re-open port:', e);
                }
            }
            this.keepReading = true;
            this.readLoop();
            this.startUsbHealthMonitor();

            this.firmwareFlashInProgress = false;
            if (flashBtn) flashBtn.disabled = false;
        }
    }

    async stopReadingOnly() {
        this.stopUsbHealthMonitor();
        this.keepReading = false;
        if (this.reader) {
            await this.reader.cancel();
        }
        if (this.writer) {
            this.writer.releaseLock();
            this.writer = null;
        }
        // Wait for loop to exit
        await new Promise(resolve => setTimeout(resolve, 100));

        // Close port so esptool can open it
        if (this.port && this.port.readable) {
            await this.port.close();
        }
        // Do NOT set this.port = null
    }

    setUILanguage(lang) {
        this.uiLanguage = lang;
        const t = EMMITranslations[lang] || EMMITranslations['en'];

        // Update Toolbox
        ESP32Toolbox = getLocalizedToolbox(lang);
        this.workspace.updateToolbox(this.getSafeToolbox(ESP32Toolbox));

        // Update UI Text elements
        document.getElementById('labelToolboxDefinition').textContent = t['LEVEL'];
        document.getElementById('labelToolboxDefinition').textContent = t['LEVEL'];

        // Update button titles (tooltips)
        document.getElementById('btn-new').title = t['NEW'];
        document.getElementById('btn-save').title = t['SAVE'];
        document.getElementById('btn-open').title = t['OPEN'];
        document.getElementById('btn-undo').title = t['UNDO'];
        document.getElementById('btn-redo').title = t['REDO'];

        this.showToast('Language: ' + document.getElementById('languageMenu').options[document.getElementById('languageMenu').selectedIndex].text);
    }

    setLevel(level) {
        this.currentLevel = level;
        document.querySelectorAll('.btn-level').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btn_level' + level)?.classList.add('active');
        this.showToast('Level ' + level + ' selected');
    }

    getBoardDisplayName(boardType) {
        const names = {
            'emmi-bot-v2': 'EMMI BOT V2',
            'explorer-kit': 'Explorer Kit',
            'emmi-bipedal': 'EMMI Bipedal'
        };
        if (names[boardType]) return names[boardType];

        return boardType
            .split('-')
            .filter(Boolean)
            .map(part => part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    getOrderedBoardTypes(boardTypes) {
        const preferred = ['emmi-bot-v2', 'explorer-kit', 'emmi-bipedal'];
        const unique = Array.from(new Set((boardTypes || []).filter(Boolean)));
        const orderedPreferred = preferred.filter(type => unique.includes(type));
        const extras = unique.filter(type => !preferred.includes(type)).sort((a, b) => a.localeCompare(b));
        return orderedPreferred.concat(extras);
    }

    getAvailableBoardTypes() {
        if (typeof window.getAvailableBoardTypes === 'function') {
            try {
                const list = window.getAvailableBoardTypes();
                if (Array.isArray(list) && list.length > 0) {
                    return this.getOrderedBoardTypes(list);
                }
            } catch (err) {
                console.warn('Failed reading getAvailableBoardTypes():', err);
            }
        }

        if (typeof window.getToolbox === 'function') {
            try {
                const source = window.getToolbox.toString();
                const matches = [...source.matchAll(/case\s+['"]([^'"]+)['"]/g)];
                const fromCases = matches.map(m => m[1]).filter(Boolean);
                if (fromCases.length > 0) {
                    return this.getOrderedBoardTypes(fromCases);
                }
            } catch (err) {
                console.warn('Failed parsing getToolbox() cases:', err);
            }
        }

        const derived = [];
        Object.keys(window).forEach(name => {
            if (!/^get[A-Z0-9].*Categories$/.test(name)) return;
            if (name === 'getCommonCategories') return;

            const suffix = name.replace(/^get/, '').replace(/Categories$/, '');
            const boardType = suffix.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            if (boardType && !derived.includes(boardType)) {
                derived.push(boardType);
            }
        });

        if (derived.length > 0) return this.getOrderedBoardTypes(derived);

        return ['emmi-bot-v2', 'explorer-kit', 'emmi-bipedal'];
    }

    initializeBoardSelector() {
        const select = document.getElementById('board-select');
        if (!select) return;

        const existingValue = select.value;
        const boardTypes = this.getAvailableBoardTypes();

        select.innerHTML = '';
        boardTypes.forEach(boardType => {
            const option = document.createElement('option');
            option.value = boardType;
            option.textContent = this.getBoardDisplayName(boardType);
            select.appendChild(option);
        });

        const selected = boardTypes.includes(existingValue) ? existingValue : (boardTypes[0] || 'emmi-bot-v2');
        select.value = selected;

        this.changeBoardType(selected);
    }

    normalizeScriptPath(src) {
        return String(src || '')
            .replace(/^[.][/\\]/, '')
            .replace(/\\/g, '/')
            .split('?')[0]
            .toLowerCase();
    }

    isScriptLoaded(scriptPath) {
        const target = this.normalizeScriptPath(scriptPath);
        const scripts = Array.from(document.getElementsByTagName('script'));
        return scripts.some(script => {
            const src = script.getAttribute('src');
            if (!src) return false;
            const normalized = this.normalizeScriptPath(src);
            return normalized.endsWith(target);
        });
    }

    loadScript(scriptPath) {
        if (this.isScriptLoaded(scriptPath)) {
            return Promise.resolve();
        }

        if (this.loadingScripts[scriptPath]) {
            return this.loadingScripts[scriptPath];
        }

        this.loadingScripts[scriptPath] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const sep = scriptPath.includes('?') ? '&' : '?';
            script.src = scriptPath + sep + 'v=' + Date.now();
            script.onload = () => {
                delete this.loadingScripts[scriptPath];
                resolve();
            };
            script.onerror = () => {
                delete this.loadingScripts[scriptPath];
                reject(new Error('Failed to load ' + scriptPath));
            };
            document.body.appendChild(script);
        });

        return this.loadingScripts[scriptPath];
    }

    async ensureBoardAssetsLoaded(boardType) {
        if (!boardType || this.loadedBoardAssets.has(boardType)) return;

        const blockScript = `blocks/${boardType}_blocks.js`;
        const generatorScript = `js/generators/${boardType}_generators.js`;
        const commandScript = `js/commands/${boardType}_commands.js`;

        await this.loadScript(blockScript);
        try {
            await this.loadScript(generatorScript);
        } catch (err) {
            // Some legacy boards may not have a dedicated *_generators.js file.
            // Keep board switching functional even when only block definitions exist.
            console.warn('Optional generator file not loaded:', generatorScript, err.message);
        }

        try {
            await this.loadScript(commandScript);
        } catch (err) {
            // Command mapping files are optional.
            console.warn('Optional command file not loaded:', commandScript, err.message);
        }

        this.loadedBoardAssets.add(boardType);
    }

    async changeBoardType(boardType) {
        try {
            await this.ensureBoardAssetsLoaded(boardType);

            // Update global toolbox with new board configuration
            ESP32Toolbox = getToolboxForBoard(boardType);

            // Update the workspace toolbox
            this.workspace.updateToolbox(this.getSafeToolbox(ESP32Toolbox));

            // Refresh code preview after assets/toolbox update
            this.updateCode();

            this.showToast('Switched to ' + this.getBoardDisplayName(boardType), 'info');
        } catch (err) {
            console.error('Board switch failed:', err);
            this.showToast('Failed to switch board: ' + err.message, 'error');
        }
    }

    getCodeGeneratorByLanguage(lang) {
        switch (lang) {
            case 'arduino': return (typeof arduinoGenerator !== 'undefined') ? arduinoGenerator : null;
            case 'python': return (typeof pythonGenerator !== 'undefined') ? pythonGenerator : null;
            case 'java': return (typeof javaGenerator !== 'undefined') ? javaGenerator : null;
            default: return null;
        }
    }

    registerMissingGeneratorFallbacks(lang) {
        const generator = this.getCodeGeneratorByLanguage(lang);
        if (!generator || !this.workspace || !generator.forBlock) return [];

        const blocks = this.workspace.getAllBlocks(false);
        const newlyMissing = [];

        for (const block of blocks) {
            const type = block && block.type;
            if (!type) continue;
            if (typeof generator.forBlock[type] === 'function') continue;

            const warnKey = lang + ':' + type;
            if (!this.missingGeneratorWarned.has(warnKey)) {
                this.missingGeneratorWarned.add(warnKey);
                newlyMissing.push(type);
            }

            generator.forBlock[type] = function (b) {
                if (b && b.outputConnection) {
                    return ['0', generator.ORDER_ATOMIC];
                }
                const prefix = (lang === 'python') ? '# ' : '// ';
                return prefix + 'TODO: add ' + lang + ' generator for block "' + type + '"\n';
            };
        }

        return newlyMissing;
    }

    updateCode() {
        let code = '';
        try {
            const missing = this.registerMissingGeneratorFallbacks(this.currentLanguage);
            if (missing.length > 0) {
                console.warn('Missing ' + this.currentLanguage + ' generators, using fallback stubs:', missing);
            }

            switch (this.currentLanguage) {
                case 'arduino':
                    code = arduinoGenerator.workspaceToCode(this.workspace);
                    if (!code.trim()) code = 'void setup() {\n\n}\n\nvoid loop() {\n\n}';
                    break;
                case 'python':
                    code = pythonGenerator.workspaceToCode(this.workspace);
                    if (!code.trim()) code = '# MicroPython code\n\nwhile True:\n    pass';
                    break;
                case 'java':
                    code = javaGenerator.workspaceToCode(this.workspace);
                    if (!code.trim()) code = '// ESP32 Java style Code\n// Note: This is pseudocode for educational purposes\n\npublic class ESP32Program {\n\n}';
                    break;
                case 'emmi': {
                    const emmi = this.generateEmmiScript();
                    code = emmi.pretty + '\n\nMinified:\n' + emmi.script;
                    break;
                }
            }
        } catch (e) {
            code = '// Error: ' + e.message;
            console.error('Code generation error:', e);
        }

        const codeOutput = document.getElementById('code-output');
        if (codeOutput) {
            codeOutput.textContent = code;
            codeOutput.className = 'language-' + (this.currentLanguage === 'arduino' ? 'cpp' : (this.currentLanguage === 'emmi' ? 'none' : this.currentLanguage));
            if (window.Prism) {
                Prism.highlightElement(codeOutput);
            }
        }
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.lang === lang);
        });
        this.updateCode();
    }

    newProject() {
        if (confirm('Create a new project? Current work will be lost.')) {
            this.workspace.clear();
            // document.getElementById('project-name').value = 'NewProject';
            this.showToast('New project created');
        }
    }

    saveProject() {
        const xml = Blockly.Xml.workspaceToDom(this.workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        // Prompt for filename
        let projectName = prompt('Enter project name:', 'esp32_project');
        if (!projectName) projectName = 'esp32_project';
        // Sanitize filename
        projectName = projectName.replace(/[^a-z0-9_\-]/gi, '_');

        const projectData = {
            name: projectName,
            board: document.getElementById('board-select').value,
            blocks: xmlText,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = projectName + '.bloc';
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Project saved');
    }

    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                this.workspace.clear();
                const xml = Blockly.utils.xml.textToDom(projectData.blocks);
                Blockly.Xml.domToWorkspace(xml, this.workspace);
                // document.getElementById('project-name').value = projectData.name || 'Loaded';
                this.showToast('Project loaded');
            } catch (err) {
                try {
                    this.workspace.clear();
                    const xml = Blockly.utils.xml.textToDom(e.target.result);
                    Blockly.Xml.domToWorkspace(xml, this.workspace);
                    this.showToast('XML loaded');
                } catch (xmlErr) {
                    this.showToast('Error loading', 'error');
                }
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    copyCode() {
        const code = document.getElementById('code-output')?.textContent || '';
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('Copied!', 'success');
        }).catch(() => {
            this.showToast('Copy failed', 'error');
        });
    }

    downloadCode() {
        const code = document.getElementById('code-output')?.textContent || '';

        let projectName = prompt('Enter file name:', 'code');
        if (!projectName) projectName = 'code';
        // Sanitize filename
        projectName = projectName.replace(/[^a-z0-9_\-]/gi, '_');
        const extensions = { arduino: '.ino', python: '.py', java: '.java', emmi: '.emmi' };
        const ext = extensions[this.currentLanguage];

        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = projectName + ext;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Saved');
    }

    showToast(message, type = 'info', options = {}) {
        const toastOptions = options && typeof options === 'object' ? options : {};
        const persistent = Boolean(toastOptions.persistent);
        const durationMs = Number.isFinite(toastOptions.durationMs) ? toastOptions.durationMs : 2000;
        const showClose = typeof toastOptions.showClose === 'boolean' ? toastOptions.showClose : persistent;

        if (this.toastHideTimeoutId) {
            clearTimeout(this.toastHideTimeoutId);
            this.toastHideTimeoutId = null;
        }

        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast ' + type;

        const text = document.createElement('span');
        text.className = 'toast-message';
        text.textContent = message;
        toast.appendChild(text);

        const hideToast = () => {
            if (this.toastHideTimeoutId) {
                clearTimeout(this.toastHideTimeoutId);
                this.toastHideTimeoutId = null;
            }
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        };

        if (showClose) {
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'toast-close';
            closeBtn.setAttribute('aria-label', 'Close notification');
            closeBtn.textContent = 'x';
            closeBtn.addEventListener('click', hideToast);
            toast.appendChild(closeBtn);
        }

        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        if (!persistent) {
            this.toastHideTimeoutId = setTimeout(hideToast, Math.max(500, durationMs));
        }
    }

    // ===========================================
    // Variable Modal & Dynamic Category
    // ===========================================

    openVariableModal() {
        const modal = document.getElementById('variable-modal');
        const input = document.getElementById('variable-name-input');
        if (modal) {
            modal.classList.remove('hidden');
            input.value = '';
            input.focus();
        }
    }

    closeVariableModal() {
        const modal = document.getElementById('variable-modal');
        if (modal) modal.classList.add('hidden');
    }

    confirmVariable() {
        console.log('Confirming variable...');
        const input = document.getElementById('variable-name-input');
        const name = input.value.trim();
        if (name) {
            try {
                // Use getVariableMap() to avoid deprecation warning
                const existingVar = this.workspace.getVariableMap().getVariable(name);
                if (existingVar) {
                    this.showToast('Variable "' + name + '" already exists', 'info');
                    this.closeVariableModal();
                } else {
                    // createVariable is on workspace, generally safe, but let's see.
                    // Some blockly versions prefer workspace.getVariableMap().createVariable? 
                    // No, usually createVariable is on workspace.
                    const newVar = this.workspace.getVariableMap().createVariable(name);
                    console.log('Created variable object:', newVar);
                    this.showToast('Variable "' + name + '" created', 'success');
                    this.closeVariableModal();

                    // Refresh toolbox to show new blocks
                    console.log('Refreshing toolbox after creation...');
                    this.workspace.updateToolbox(this.getSafeToolbox(ESP32Toolbox));
                }
            } catch (e) {
                console.error('Error in confirmVariable:', e);
                this.showToast('Error: ' + e.message, 'error');
            }
        } else {
            this.showToast('Please enter a variable name', 'error');
        }
    }

    getVariableCategory(workspace) {
        var xmlList = [];

        // 1. "Make a Variable" Button
        var button = document.createElement('button');
        button.setAttribute('text', 'make a variable');
        button.setAttribute('callbackKey', 'CREATE_VARIABLE');
        xmlList.push(button);

        // 2. Add Generic Variable Blocks (if any variables exist)
        // We only add one set of blocks. The 'VAR' field in these blocks 
        // will automatically become a dropdown listing all variables.
        var variables = this.workspace.getVariableMap().getAllVariables();
        console.log('Main Workspace has ' + variables.length + ' variables');

        if (variables.length > 0) {
            var firstVar = variables[0];
            var varName = firstVar.name;
            var varId = firstVar.getId();

            // Block: Declare
            var blockDeclare = document.createElement('block');
            blockDeclare.setAttribute('type', 'custom_variable_declare');
            var fieldVar = document.createElement('field');
            fieldVar.setAttribute('name', 'VAR');
            fieldVar.setAttribute('id', varId);
            fieldVar.textContent = varName;
            blockDeclare.appendChild(fieldVar);
            // Default Type
            var fieldType = document.createElement('field');
            fieldType.setAttribute('name', 'TYPE');
            fieldType.textContent = 'char';
            blockDeclare.appendChild(fieldType);
            // Shadow Value
            var value = document.createElement('value');
            value.setAttribute('name', 'VALUE');
            var shadow = document.createElement('shadow');
            shadow.setAttribute('type', 'math_number');
            var fieldNum = document.createElement('field');
            fieldNum.setAttribute('name', 'NUM');
            fieldNum.textContent = '0';
            shadow.appendChild(fieldNum);
            value.appendChild(shadow);
            blockDeclare.appendChild(value);
            xmlList.push(blockDeclare);

            // Block: Set
            var blockSet = document.createElement('block');
            blockSet.setAttribute('type', 'custom_variable_set');
            var fieldVarSet = document.createElement('field');
            fieldVarSet.setAttribute('name', 'VAR');
            fieldVarSet.setAttribute('id', varId);
            fieldVarSet.textContent = varName;
            blockSet.appendChild(fieldVarSet);
            // Shadow Value
            var valueSet = document.createElement('value');
            valueSet.setAttribute('name', 'VALUE');
            var shadowSet = document.createElement('shadow');
            shadowSet.setAttribute('type', 'math_number');
            var fieldNumSet = document.createElement('field');
            fieldNumSet.setAttribute('name', 'NUM');
            fieldNumSet.textContent = '0';
            shadowSet.appendChild(fieldNumSet);
            valueSet.appendChild(shadowSet);
            blockSet.appendChild(valueSet);
            xmlList.push(blockSet);

            // Block: Change
            var blockChange = document.createElement('block');
            blockChange.setAttribute('type', 'custom_variable_change');
            var fieldVarChange = document.createElement('field');
            fieldVarChange.setAttribute('name', 'VAR');
            fieldVarChange.setAttribute('id', varId);
            fieldVarChange.textContent = varName;
            blockChange.appendChild(fieldVarChange);
            // Shadow Value
            var valueChange = document.createElement('value');
            valueChange.setAttribute('name', 'VALUE');
            var shadowChange = document.createElement('shadow');
            shadowChange.setAttribute('type', 'math_number');
            var fieldNumChange = document.createElement('field');
            fieldNumChange.setAttribute('name', 'NUM');
            fieldNumChange.textContent = '1';
            shadowChange.appendChild(fieldNumChange);
            valueChange.appendChild(shadowChange);
            blockChange.appendChild(valueChange);
            xmlList.push(blockChange);

            // Block: Getter (Reporter)
            var blockGet = document.createElement('block');
            blockGet.setAttribute('type', 'custom_variable_get');
            var fieldVarGet = document.createElement('field');
            fieldVarGet.setAttribute('name', 'VAR');
            fieldVarGet.setAttribute('id', varId);
            fieldVarGet.textContent = varName;
            blockGet.appendChild(fieldVarGet);
            xmlList.push(blockGet);

            // Constants - Optional: Just one set for generic constant creation?
            // The user request was about "variables" specifically having dropdowns.
            // Constants using InputText likely don't need a list repeated unless we track them.
            // For now, let's include one set of Constant blocks as templates.

            // Block: Declare Constant
            var blockConst = document.createElement('block');
            blockConst.setAttribute('type', 'custom_constant_declare');
            var fieldVarConst = document.createElement('field');
            fieldVarConst.setAttribute('name', 'VAR');
            fieldVarConst.textContent = varName;
            blockConst.appendChild(fieldVarConst);
            var fieldTypeConst = document.createElement('field');
            fieldTypeConst.setAttribute('name', 'TYPE');
            fieldTypeConst.textContent = 'char';
            blockConst.appendChild(fieldTypeConst);
            var valueConst = document.createElement('value');
            valueConst.setAttribute('name', 'VALUE');
            var shadowConst = document.createElement('shadow');
            shadowConst.setAttribute('type', 'math_number');
            var fieldNumConst = document.createElement('field');
            fieldNumConst.setAttribute('name', 'NUM');
            fieldNumConst.textContent = '0';
            shadowConst.appendChild(fieldNumConst);
            valueConst.appendChild(shadowConst);
            blockConst.appendChild(valueConst);
            xmlList.push(blockConst);

            // Block: Set Constant
            var blockEquiv = document.createElement('block');
            blockEquiv.setAttribute('type', 'custom_constant_set');
            var fieldVarEquiv = document.createElement('field');
            fieldVarEquiv.setAttribute('name', 'VAR');
            fieldVarEquiv.textContent = varName;
            blockEquiv.appendChild(fieldVarEquiv);
            var valueEquiv = document.createElement('value');
            valueEquiv.setAttribute('name', 'VALUE');
            var shadowEquiv = document.createElement('shadow');
            shadowEquiv.setAttribute('type', 'math_number');
            var fieldNumEquiv = document.createElement('field');
            fieldNumEquiv.setAttribute('name', 'NUM');
            fieldNumEquiv.textContent = '0';
            shadowEquiv.appendChild(fieldNumEquiv);
            valueEquiv.appendChild(shadowEquiv);
            blockEquiv.appendChild(valueEquiv);
            xmlList.push(blockEquiv);
        }

        return xmlList;
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        setTimeout(() => overlay?.classList.add('hidden'), 500);
    }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ESP32BlocklyApp();
});
