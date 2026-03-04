'use strict';

try {
    require('dotenv').config();
} catch (_) {
    // dotenv is optional in production environments
}

const path = require('path');
const fs = require('fs');
const os = require('os');
const express = require('express');
const archiver = require('archiver');
const { EMMIScriptExporter } = require('./js/generators/emmi_exporter.js');

const app = express();
app.use(express.json({ limit: '5mb' }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    return next();
});

app.use(express.static(path.resolve(__dirname)));

// Serve block-creator.html when accessed without .html extension
app.get('/block-creator', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'block-creator.html'));
});

const FALLBACK_SCRIPT = '|I||S||L||';
const MAX_DEPTH = 6;
const MAX_NODES = 200;
const CLOUD_CONFIG_FILE = process.env.EMMI_CLOUD_CONFIG_PATH
    ? path.resolve(process.env.EMMI_CLOUD_CONFIG_PATH)
    : path.join(os.homedir(), '.emmi-html', 'cloud-config.json');

function parseFallbackProgram() {
    return {
        initFlags: [],
        setup: [],
        loop: []
    };
}

function makeFallbackResponse(reason) {
    const program = parseFallbackProgram();
    return {
        program,
        script: FALLBACK_SCRIPT,
        explanation: 'Using safe fallback program.',
        warnings: [reason]
    };
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function sanitizeCloudField(value, maxLength) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed.slice(0, maxLength);
}

function normalizeCloudConfig(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        accessKeyId: sanitizeCloudField(source.accessKeyId, 128),
        secretAccessKey: sanitizeCloudField(source.secretAccessKey, 256),
        region: sanitizeCloudField(source.region, 64),
        bucketName: sanitizeCloudField(source.bucketName, 128)
    };
}

function getDefaultCloudConfigFromEnv() {
    return normalizeCloudConfig({
        accessKeyId: process.env.EMMI_CLOUD_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.EMMI_CLOUD_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.EMMI_CLOUD_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '',
        bucketName: process.env.EMMI_CLOUD_BUCKET || ''
    });
}

function mergeCloudConfig(preferred, fallback) {
    const p = normalizeCloudConfig(preferred);
    const f = normalizeCloudConfig(fallback);
    return {
        accessKeyId: p.accessKeyId || f.accessKeyId,
        secretAccessKey: p.secretAccessKey || f.secretAccessKey,
        region: p.region || f.region,
        bucketName: p.bucketName || f.bucketName
    };
}

function readCloudConfigFromDisk() {
    const envDefaults = getDefaultCloudConfigFromEnv();
    try {
        if (!fs.existsSync(CLOUD_CONFIG_FILE)) {
            return envDefaults;
        }
        const text = fs.readFileSync(CLOUD_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(text);
        return mergeCloudConfig(parsed, envDefaults);
    } catch (err) {
        console.warn('[cloud-config] Failed to read config file:', err.message);
        return envDefaults;
    }
}

function writeCloudConfigToDisk(rawConfig) {
    const normalized = normalizeCloudConfig(rawConfig);
    fs.mkdirSync(path.dirname(CLOUD_CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CLOUD_CONFIG_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
    return normalized;
}

function parseHostCandidates(value) {
    const hosts = new Set();
    if (!value || typeof value !== 'string') return hosts;

    const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
    for (const part of parts) {
        const lower = part.toLowerCase();
        hosts.add(lower);

        const withoutPort = lower.split(':')[0];
        if (withoutPort) hosts.add(withoutPort);
    }

    return hosts;
}

function parseHostFromUrl(value) {
    if (!value || typeof value !== 'string') return '';
    try {
        return new URL(value).host.toLowerCase();
    } catch (_) {
        return '';
    }
}

function isSameOriginRequest(req) {
    const allowedHosts = new Set();
    const addHosts = (value) => {
        for (const host of parseHostCandidates(value)) {
            allowedHosts.add(host);
        }
    };

    addHosts(req.get('host'));
    addHosts(req.get('x-forwarded-host'));
    addHosts(req.get('x-original-host'));
    addHosts(req.get('x-forwarded-server'));
    if (allowedHosts.size === 0) return false;

    const origin = req.get('origin');
    if (origin) {
        const originHost = parseHostFromUrl(origin);
        if (originHost) {
            if (allowedHosts.has(originHost) || allowedHosts.has(originHost.split(':')[0])) {
                return true;
            }
            return false;
        }
        return false;
    }

    const referer = req.get('referer');
    if (referer) {
        const refererHost = parseHostFromUrl(referer);
        if (refererHost) {
            if (allowedHosts.has(refererHost) || allowedHosts.has(refererHost.split(':')[0])) {
                return true;
            }
            return false;
        }
        return false;
    }

    // Allow non-browser clients that do not send origin/referer.
    return !origin && !referer;
}

function sanitizeScalarValue(value, warnings, pathLabel) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length <= 120) return trimmed;
        warnings.push(pathLabel + ': string truncated to 120 chars.');
        return trimmed.slice(0, 120);
    }
    warnings.push(pathLabel + ': unsupported value type, replaced with 0.');
    return 0;
}

function sanitizeExpr(expr, warnings, pathLabel, depth) {
    if (!expr || typeof expr !== 'object' || depth > MAX_DEPTH) {
        warnings.push(pathLabel + ': invalid expression, replaced with 1==0.');
        return { op: '==', left: 1, right: 0 };
    }

    const op = typeof expr.op === 'string' ? expr.op.trim() : '';
    const allowed = new Set(['==', '!=', '>', '>=', '<', '<=']);
    const safeOp = allowed.has(op) ? op : '==';
    if (safeOp !== op) {
        warnings.push(pathLabel + ': unsupported op "' + op + '", replaced with ==.');
    }

    return {
        op: safeOp,
        left: sanitizeScalarValue(expr.left, warnings, pathLabel + '.left'),
        right: sanitizeScalarValue(expr.right, warnings, pathLabel + '.right')
    };
}

function sanitizeNodes(nodes, warnings, depth, pathLabel) {
    if (depth > MAX_DEPTH) {
        warnings.push(pathLabel + ': maximum nesting depth exceeded.');
        return [];
    }

    const source = asArray(nodes);
    const output = [];
    for (let i = 0; i < source.length && output.length < MAX_NODES; i += 1) {
        const raw = source[i];
        if (!raw || typeof raw !== 'object') {
            warnings.push(pathLabel + '[' + i + ']: skipped invalid node.');
            continue;
        }

        const type = typeof raw.type === 'string' ? raw.type.trim() : '';
        switch (type) {
            case 'cmd': {
                const cmd = typeof raw.cmd === 'string' ? raw.cmd.trim().toUpperCase() : '';
                if (!cmd) {
                    warnings.push(pathLabel + '[' + i + ']: cmd missing token.');
                    break;
                }
                output.push({ type: 'cmd', cmd });
                break;
            }

            case 'delay': {
                const ms = Math.max(0, Math.round(Number(raw.ms) || 0));
                output.push({ type: 'delay', ms });
                break;
            }

            case 'set_var': {
                const varType = typeof raw.varType === 'string' ? raw.varType.toUpperCase() : 'I';
                const safeType = /^[IFCSB]$/.test(varType) ? varType : 'I';
                const index = Math.max(1, Math.min(5, Math.round(Number(raw.index) || 1)));
                const op = raw.op === '+' ? '+' : '=';
                const value = sanitizeScalarValue(raw.value, warnings, pathLabel + '[' + i + '].value');
                output.push({ type: 'set_var', varType: safeType, index, op, value });
                break;
            }

            case 'if': {
                output.push({
                    type: 'if',
                    expr: sanitizeExpr(raw.expr, warnings, pathLabel + '[' + i + '].expr', depth + 1),
                    then: sanitizeNodes(raw.then, warnings, depth + 1, pathLabel + '[' + i + '].then'),
                    else: sanitizeNodes(raw.else, warnings, depth + 1, pathLabel + '[' + i + '].else')
                });
                break;
            }

            case 'while': {
                output.push({
                    type: 'while',
                    expr: sanitizeExpr(raw.expr, warnings, pathLabel + '[' + i + '].expr', depth + 1),
                    body: sanitizeNodes(raw.body, warnings, depth + 1, pathLabel + '[' + i + '].body')
                });
                break;
            }

            case 'for': {
                const start = Math.round(Number(raw.start) || 0);
                const end = Math.round(Number(raw.end) || 0);
                let step = Math.round(Number(raw.step) || 1);
                if (step === 0) step = 1;
                output.push({
                    type: 'for',
                    start,
                    end,
                    step,
                    body: sanitizeNodes(raw.body, warnings, depth + 1, pathLabel + '[' + i + '].body')
                });
                break;
            }

            case 'switch': {
                const cases = asArray(raw.cases).slice(0, 12).map((entry, idx) => ({
                    match: sanitizeScalarValue(entry && entry.match, warnings, pathLabel + '[' + i + '].cases[' + idx + '].match'),
                    body: sanitizeNodes(entry && entry.body, warnings, depth + 1, pathLabel + '[' + i + '].cases[' + idx + '].body')
                }));
                output.push({
                    type: 'switch',
                    value: sanitizeScalarValue(raw.value, warnings, pathLabel + '[' + i + '].value'),
                    cases,
                    default: sanitizeNodes(raw.default, warnings, depth + 1, pathLabel + '[' + i + '].default')
                });
                break;
            }

            case 'break':
                output.push({ type: 'break' });
                break;

            default:
                warnings.push(pathLabel + '[' + i + ']: unsupported node type "' + type + '" skipped.');
        }
    }

    if (source.length > MAX_NODES) {
        warnings.push(pathLabel + ': node list trimmed to ' + MAX_NODES + ' entries.');
    }
    return output;
}

function sanitizeProgram(program, warnings) {
    const source = program && typeof program === 'object' ? program : {};

    // Log warnings for bad AI-generated init flags (diagnostic only)
    const allowedInit = new Set(['E', 'B', 'M', 'T', 'A', 'V']);
    const btFlags = [];
    for (const raw of asArray(source.initFlags)) {
        const flag = typeof raw === 'string' ? raw.trim() : '';
        if (!flag) continue;
        if (/^R".*"$/.test(flag)) {
            btFlags.push(flag);
        } else if (!allowedInit.has(flag)) {
            warnings.push('Dropped unsupported init flag: ' + flag);
        }
    }

    const setup = sanitizeNodes(source.setup, warnings, 0, 'setup');
    const loop = sanitizeNodes(source.loop, warnings, 0, 'loop');

    // Infer hardware init flags from commands actually used in the program
    const inferred = inferInitFlags(setup, loop);
    const initFlags = inferred.concat(btFlags);

    return { initFlags, setup, loop };
}

/**
 * Walk sanitized AST nodes and infer which hardware init flags are needed.
 * Returns an ordered array like ['E', 'M', 'T'] based on commands and
 * sensor references found in the program.
 */
function inferInitFlags(setup, loop) {
    const flags = new Set();

    function scanValue(val) {
        if (typeof val !== 'string') return;
        const s = val.trim().toUpperCase();
        if (s === 'TR') flags.add('T');
        else if (s === 'AR') flags.add('A');
        else if (s === 'VR') flags.add('V');
    }

    function scanExpr(expr) {
        if (!expr || typeof expr !== 'object') return;
        scanValue(expr.left);
        scanValue(expr.right);
    }

    function scanNodes(nodes) {
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
    }

    scanNodes(setup);
    scanNodes(loop);

    const order = ['E', 'B', 'M', 'T', 'A', 'V'];
    return order.filter((f) => flags.has(f));
}

function serializeValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (typeof value !== 'string') return '0';

    const token = value.trim();
    if (token === '') return '""';
    if (/^-?\d+(\.\d+)?$/.test(token)) return token;
    if (/^[IFCSB][1-5]$/.test(token)) return token;
    if (/^(TR|AR|VR)$/.test(token)) return token;
    if (/^(["']).*\1$/.test(token)) return token;
    return '"' + token.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function serializeExpr(expr) {
    const opMap = {
        '==': '=',
        '!=': '!=',
        '>': '>',
        '>=': '>=',
        '<': '<',
        '<=': '<='
    };
    const op = opMap[expr.op] || '=';
    return 'O' + op + ',' + serializeValue(expr.left) + ',' + serializeValue(expr.right);
}

function wrapBody(tokens) {
    return tokens.length ? '|' + tokens.join('|') + '|' : '';
}

function serializeNodes(nodes) {
    const out = [];
    for (const node of asArray(nodes)) {
        switch (node.type) {
            case 'cmd':
                out.push(node.cmd);
                break;
            case 'delay':
                out.push('D' + String(Math.max(0, Math.round(node.ms))));
                break;
            case 'set_var':
                out.push('G(' + node.varType + ',' + node.index + ',' + node.op + ',' + serializeValue(node.value) + ')');
                break;
            case 'if':
                out.push('C(' + serializeExpr(node.expr) + '){' + wrapBody(serializeNodes(node.then)) + '}{' + wrapBody(serializeNodes(node.else)) + '}');
                break;
            case 'while':
                out.push('W(' + serializeExpr(node.expr) + '){' + wrapBody(serializeNodes(node.body)) + '}');
                break;
            case 'for':
                out.push('F(' + node.start + '-' + node.end + ',' + node.step + '){' + wrapBody(serializeNodes(node.body)) + '}');
                break;
            case 'switch': {
                const bodyParts = [];
                for (const entry of asArray(node.cases)) {
                    bodyParts.push('(' + serializeValue(entry.match) + '){' + wrapBody(serializeNodes(entry.body)) + '}');
                }
                bodyParts.push('(D){' + wrapBody(serializeNodes(node.default)) + '}');
                out.push('K(' + serializeValue(node.value) + ', ' + bodyParts.join(' ') + ')');
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

function buildScript(program) {
    const init = asArray(program.initFlags).join('|');
    const setup = serializeNodes(program.setup).join('|');
    const loop = serializeNodes(program.loop).join('|');
    return '|I|' + init + '|S|' + setup + '|L|' + loop + '|';
}

function extractJsonObject(text) {
    if (typeof text !== 'string') return null;
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch (err) {
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return JSON.parse(trimmed.slice(start, end + 1));
        }
    }
    return null;
}

function parseRequestedDelayMs(text) {
    const matchMs = text.match(/(\d{2,5})\s*(ms|msec|millisecond)/i);
    if (matchMs) return Math.max(20, Math.min(10000, Number(matchMs[1])));
    const matchSec = text.match(/(\d{1,3})\s*(s|sec|second)/i);
    if (matchSec) return Math.max(20, Math.min(10000, Number(matchSec[1]) * 1000));
    return 500;
}

function buildHeuristicProgram(message) {
    const text = String(message || '').toLowerCase();

    // --- Pattern 1: Touch-state-color (I1/state + touch + RGB) ---
    const mentionsI1 = text.includes('i1') || text.includes('state');
    const mentionsTouch = text.includes('touch');
    const mentionsColors = text.includes('green') && text.includes('red') && text.includes('blue');

    if (mentionsI1 && mentionsTouch && mentionsColors) {
        const mentionsDebounce = text.includes('500') || text.includes('debounce');
        const program = {
            initFlags: ['E', 'T'],
            setup: [
                { type: 'set_var', varType: 'I', index: 1, op: '=', value: 0 }
            ],
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
                        { type: 'delay', ms: mentionsDebounce ? 500 : 300 }
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
            explanation: 'Touch input cycles I1 through 0, 1, 2 with debounce, then drives LED color per state.',
            warnings: ['Used deterministic local translator for this request.']
        };
    }

    // --- Pattern 2 & 3: LED blink / on / off ---
    const mentionsEyes = text.includes('led') || text.includes('eye') || text.includes('eyes') || text.includes('rgb');
    if (!mentionsEyes) {
        return null;
    }

    const delay = parseRequestedDelayMs(text);
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
            ? ('Blinking ' + color + ' LED by toggling eyes on/off with a ' + delay + 'ms delay.')
            : ('Setting ' + color + ' LED ' + (wantsOff ? 'off' : 'on') + '.'),
        warnings: ['Used deterministic local translator for this request.']
    };
}

function getAiClientConfig() {
    const provider = String(process.env.AI_PROVIDER || 'openai').toLowerCase();
    const model = process.env.AI_MODEL || (provider === 'openrouter' ? 'openai/gpt-4.1-mini' : 'gpt-4.1-mini');

    if (provider === 'openrouter') {
        return {
            provider,
            model,
            baseUrl: String(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
            apiKey: process.env.OPENROUTER_API_KEY || '',
            headers: {
                ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
                ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {})
            }
        };
    }

    return {
        provider: 'openai',
        model,
        baseUrl: String(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
        apiKey: process.env.OPENAI_API_KEY || '',
        headers: {}
    };
}

async function callAiForBlockly(message) {
    const aiConfig = getAiClientConfig();
    if (!aiConfig.apiKey) {
        const keyName = aiConfig.provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY';
        throw new Error(keyName + ' is not configured.');
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

    const userPrompt = JSON.stringify({ message });
    const response = await fetch(aiConfig.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + aiConfig.apiKey,
            ...aiConfig.headers
        },
        body: JSON.stringify({
            model: aiConfig.model,
            temperature: 0.2,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error('AI request failed (' + aiConfig.provider + '): ' + response.status + ' ' + text);
    }

    const body = await response.json();
    const content = body && body.choices && body.choices[0] && body.choices[0].message
        ? body.choices[0].message.content
        : '';

    const parsed = extractJsonObject(content);
    if (!parsed) {
        throw new Error('AI returned invalid JSON.');
    }
    return parsed;
}

function buildResponseFromProgram(program, explanation, warnings) {
    const mergedWarnings = asArray(warnings).map((w) => String(w));
    const script = buildScript(program);
    const validator = new EMMIScriptExporter();
    const validation = validator.validateScript(script);
    if (!validation.valid) {
        return makeFallbackResponse('Validation failed: ' + validation.error);
    }
    return {
        program,
        script,
        explanation: explanation || 'Program generated successfully.',
        warnings: mergedWarnings
    };
}

async function translateToBlocklyPayload(message) {
    const warnings = [];
    let aiPayload = null;

    try {
        aiPayload = await callAiForBlockly(message);
    } catch (err) {
        warnings.push('AI service unavailable: ' + err.message);
    }

    if (!aiPayload) {
        const heuristic = buildHeuristicProgram(message);
        if (heuristic) {
            const sanitized = sanitizeProgram(heuristic.program, warnings);
            return buildResponseFromProgram(
                sanitized,
                heuristic.explanation,
                warnings.concat(asArray(heuristic.warnings))
            );
        }
        return makeFallbackResponse('Could not generate program automatically.');
    }

    const rawProgram = aiPayload.program && typeof aiPayload.program === 'object'
        ? aiPayload.program
        : aiPayload;
    const sanitizedProgram = sanitizeProgram(rawProgram, warnings);

    return buildResponseFromProgram(
        sanitizedProgram,
        typeof aiPayload.explanation === 'string' ? aiPayload.explanation : 'Program generated successfully.',
        warnings.concat(asArray(aiPayload.warnings))
    );
}

// ===================================
// BLOCK CREATOR SYNC & EXPORT APIs
// ===================================

/**
 * GET /api/cloud-config
 * Returns persisted cloud configuration for Block Creator / main app.
 */
app.get('/api/cloud-config', (req, res) => {
    try {
        if (!isSameOriginRequest(req)) {
            return res.status(403).json({ success: false, error: 'Forbidden origin.' });
        }
        const cloudConfig = readCloudConfigFromDisk();
        return res.json({ success: true, cloudConfig });
    } catch (err) {
        console.error('[cloud-config:get] Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/cloud-config
 * Persists cloud configuration on disk so it survives host/origin changes.
 */
app.post('/api/cloud-config', (req, res) => {
    try {
        if (!isSameOriginRequest(req)) {
            return res.status(403).json({ success: false, error: 'Forbidden origin.' });
        }

        const payload = req.body && typeof req.body === 'object'
            ? (req.body.cloudConfig && typeof req.body.cloudConfig === 'object' ? req.body.cloudConfig : req.body)
            : {};

        const cloudConfig = writeCloudConfigToDisk(payload);
        return res.json({ success: true, cloudConfig });
    } catch (err) {
        console.error('[cloud-config:post] Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * DELETE /api/cloud-config
 * Clears the persisted cloud configuration from disk.
 */
app.delete('/api/cloud-config', (req, res) => {
    try {
        if (!isSameOriginRequest(req)) {
            return res.status(403).json({ success: false, error: 'Forbidden origin.' });
        }

        if (fs.existsSync(CLOUD_CONFIG_FILE)) {
            fs.unlinkSync(CLOUD_CONFIG_FILE);
        }
        return res.json({ success: true });
    } catch (err) {
        console.error('[cloud-config:delete] Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/load-source-files
 * Reads block definition files, generator files, command mapping files, and toolbox from disk.
 * Returns { files: { "relative/path.js": "file content", ... } }
 */
app.get('/api/load-source-files', (req, res) => {
    try {
        const projectRoot = path.resolve(__dirname);
        const filesToLoad = [];

        // Discover block files
        const blocksDir = path.join(projectRoot, 'blocks');
        if (fs.existsSync(blocksDir)) {
            fs.readdirSync(blocksDir).filter(f => f.endsWith('.js')).forEach(f => {
                filesToLoad.push('blocks/' + f);
            });
        }

        // Discover generator files
        const genDir = path.join(projectRoot, 'js', 'generators');
        if (fs.existsSync(genDir)) {
            fs.readdirSync(genDir).filter(f => f.endsWith('.js')).forEach(f => {
                filesToLoad.push('js/generators/' + f);
            });
        }

        // Discover EMMI command mapping files
        const commandDir = path.join(projectRoot, 'js', 'commands');
        if (fs.existsSync(commandDir)) {
            fs.readdirSync(commandDir).filter(f => f.endsWith('.js')).forEach(f => {
                filesToLoad.push('js/commands/' + f);
            });
        }

        // Toolbox
        filesToLoad.push('js/toolbox.js');

        const files = {};
        for (const fp of filesToLoad) {
            const fullPath = path.join(projectRoot, fp);
            try {
                files[fp] = fs.readFileSync(fullPath, 'utf-8');
            } catch (_) { /* skip missing files */ }
        }

        return res.json({ success: true, files });
    } catch (err) {
        console.error('[load-source-files] Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/sync-files
 * Receives generated file contents from Block Creator and writes them to the project directory.
 * Body: { files: [ { path: "relative/path.js", content: "file content" }, ... ] }
 */
app.post('/api/sync-files', (req, res) => {
    try {
        const files = req.body && Array.isArray(req.body.files) ? req.body.files : [];

        if (files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files provided.' });
        }

        const projectRoot = path.resolve(__dirname);
        const results = [];

        for (const file of files) {
            if (!file.path || typeof file.path !== 'string' || typeof file.content !== 'string') {
                results.push({ path: file.path || '(unknown)', status: 'skipped', reason: 'Invalid path or content.' });
                continue;
            }

            // Security: prevent path traversal
            const resolved = path.resolve(projectRoot, file.path);
            if (!resolved.startsWith(projectRoot)) {
                results.push({ path: file.path, status: 'rejected', reason: 'Path traversal not allowed.' });
                continue;
            }

            // Prevent overwriting critical files
            const baseName = path.basename(file.path);
            const forbidden = ['.env', 'server.js', 'package.json', 'package-lock.json', '.emmi-cloud-config.json'];
            if (forbidden.includes(baseName)) {
                results.push({ path: file.path, status: 'rejected', reason: 'Cannot overwrite protected file.' });
                continue;
            }

            // Create parent directories if needed
            const dir = path.dirname(resolved);
            fs.mkdirSync(dir, { recursive: true });

            // Write file
            fs.writeFileSync(resolved, file.content, 'utf-8');
            results.push({ path: file.path, status: 'written' });
        }

        const writtenCount = results.filter(r => r.status === 'written').length;
        console.log(`[sync-files] Wrote ${writtenCount}/${files.length} files.`);

        return res.json({ success: true, written: writtenCount, total: files.length, results });
    } catch (err) {
        console.error('[sync-files] Error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/export-app
 * Bundles the entire EMMI BOT Lite application (excluding Block Creator and dev files) as a ZIP download.
 */
app.get('/api/export-app', (req, res) => {
    const projectRoot = path.resolve(__dirname);

    // Files and directories to exclude from the export
    const excludeFiles = new Set([
        'block-creator.html',
        '.env',
        '.emmi-cloud-config.json',
        'package.json',
        'package-lock.json',
        'server.js',
        '.gitignore',
        '.git'
    ]);

    const excludeDirs = new Set([
        'node_modules',
        '.git'
    ]);

    // File paths (relative) that should be excluded
    const excludePaths = new Set([
        'js/block-creator.js',
        'css/block-creator.css'
    ]);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="emmi-bot-lite.zip"');

    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', (err) => {
        console.error('[export-app] Archive error:', err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    archive.pipe(res);

    // Recursively add files from the project root
    function addDirectory(dirPath, archivePath) {
        let entries;
        try {
            entries = fs.readdirSync(dirPath, { withFileTypes: true });
        } catch (e) {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                if (excludeDirs.has(entry.name)) continue;
                addDirectory(fullPath, relPath);
            } else {
                if (excludeFiles.has(entry.name) && dirPath === projectRoot) continue;
                if (excludePaths.has(relPath)) continue;

                if (relPath === 'index.html') {
                    try {
                        let html = fs.readFileSync(fullPath, 'utf-8');
                        html = html.replace(/^[ \t]*<!--\s*Block Creator Tool Button\s*-->\s*\r?\n?/m, '');
                        html = html.replace(/^[ \t]*<button id="btn-block-creator"[\s\S]*?<\/button>\s*\r?\n?/m, '');
                        html = html.replace(/^[ \t]*<button id="btn_send_emmi"[\s\S]*?<\/button>\s*\r?\n?/m, '');
                        html = html.replace(/^[ \t]*<button id="btn_upload_last_emmi"[\s\S]*?<\/button>\s*\r?\n?/m, '');
                        html = html.replace(/^[ \t]*<button[^>]*data-lang="emmi"[^>]*>[\s\S]*?<\/button>\s*\r?\n?/m, '');
                        archive.append(html, { name: relPath });
                    } catch (e) {
                        archive.file(fullPath, { name: relPath });
                    }
                    continue;
                }

                archive.file(fullPath, { name: relPath });
            }
        }
    }

    addDirectory(projectRoot, '');
    archive.finalize();
});

app.post('/api/translate-blockly', async (req, res) => {
    try {
        const message = req.body && typeof req.body.message === 'string' ? req.body.message.trim() : '';
        if (!message) {
            return res.status(400).json(makeFallbackResponse('Request message is required.'));
        }

        const payload = await translateToBlocklyPayload(message);
        return res.json(payload);
    } catch (err) {
        return res.status(500).json(makeFallbackResponse('Unexpected translation error: ' + err.message));
    }
});

app.post('/api/translate', async (req, res) => {
    try {
        const message = req.body && typeof req.body.message === 'string' ? req.body.message.trim() : '';
        if (!message) {
            return res.status(400).json({
                script: FALLBACK_SCRIPT,
                explanation: 'No message provided.',
                warnings: ['Request message is required.']
            });
        }

        const payload = await translateToBlocklyPayload(message);
        return res.json({
            script: payload.script,
            explanation: payload.explanation,
            warnings: payload.warnings
        });
    } catch (err) {
        return res.status(500).json({
            script: FALLBACK_SCRIPT,
            explanation: 'Translation failed.',
            warnings: [err.message]
        });
    }
});

const PORT = Number(process.env.PORT || 3000);
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('EMMIBOT server running on http://localhost:' + PORT);
        console.log('Cloud settings storage: ' + CLOUD_CONFIG_FILE);
    });
}

module.exports = { app };
