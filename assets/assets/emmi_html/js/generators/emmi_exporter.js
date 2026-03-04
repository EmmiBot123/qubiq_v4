'use strict';

(function (globalScope) {
    const SIMPLE_TOKENS = new Set([
        'ERN', 'ERF', 'EGN', 'EGF', 'EBN', 'EBF', 'EAN', 'EAF',
        'MF', 'MB', 'ML', 'MR', 'MS',
        'BS', 'TR', 'VR', 'AR', 'X'
    ]);

    class EMMIScriptExporter {
        constructor() {
            this.resetState();
        }

        resetState() {
            this.initTokens = [];
            this.initTokenSet = new Set();
            this.variableSlots = new Map();
            this.typeCounters = { I: 0, F: 0, C: 0, S: 0, B: 0 };
        }

        generateFromWorkspace(workspace) {
            this.resetState();
            if (!workspace) {
                throw new Error('No Blockly workspace available.');
            }

            const base = this.findBaseBlock(workspace);
            const setupTokens = base ? this.serializeChain(base.getInputTargetBlock('SETUP')) : [];
            const loopTokens = base ? this.serializeChain(base.getInputTargetBlock('LOOP')) : [];

            const script = this.buildScript(this.initTokens, setupTokens, loopTokens);
            const pretty = this.buildPretty(this.initTokens, setupTokens, loopTokens);
            const validation = this.validateScript(script);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            return {
                script,
                pretty,
                initTokens: this.initTokens.slice(),
                setupTokens,
                loopTokens
            };
        }

        findBaseBlock(workspace) {
            const topBlocks = workspace.getTopBlocks(true);
            return topBlocks.find((b) => b.type === 'base_setup_loop') || null;
        }

        addInitToken(token) {
            if (!this.initTokenSet.has(token)) {
                this.initTokenSet.add(token);
                this.initTokens.push(token);
            }
        }

        splitCommandComponent(component) {
            if (Array.isArray(component)) {
                return component
                    .map((part) => String(part || '').trim())
                    .filter(Boolean);
            }
            return String(component || '')
                .split('|')
                .map((part) => part.trim())
                .filter(Boolean);
        }

        addInitTokensFrom(value) {
            const tokens = this.splitCommandComponent(value);
            for (const token of tokens) {
                this.addInitToken(token);
            }
        }

        getCustomCommandRegistry() {
            const registry = globalScope.emmiCommandGenerator;
            if (!registry || typeof registry !== 'object') return null;
            return registry;
        }

        normalizeCustomStatementResult(result) {
            if (result == null) return [];
            if (Array.isArray(result)) return this.splitCommandComponent(result);

            if (typeof result === 'string') {
                return this.splitCommandComponent(result);
            }

            if (typeof result === 'object') {
                this.addInitTokensFrom(result.init || result.initTokens || []);
                const body = result.mainTokens || result.tokens || result.main || result.loop || result.setup || [];
                return this.splitCommandComponent(body);
            }

            return [];
        }

        resolveCustomStatementTokens(block) {
            const registry = this.getCustomCommandRegistry();
            if (!registry || !registry.forBlock || !block || !block.type) {
                return { matched: false, tokens: [] };
            }

            const entry = registry.forBlock[block.type];
            if (entry == null) {
                return { matched: false, tokens: [] };
            }

            if (typeof entry === 'function') {
                const result = entry(block, this);
                return { matched: true, tokens: this.normalizeCustomStatementResult(result) };
            }

            return { matched: true, tokens: this.normalizeCustomStatementResult(entry) };
        }

        resolveCustomValueToken(block) {
            const registry = this.getCustomCommandRegistry();
            if (!registry || !registry.forValue || !block || !block.type) {
                return { matched: false, value: '' };
            }

            const entry = registry.forValue[block.type];
            if (entry == null) {
                return { matched: false, value: '' };
            }

            let result = entry;
            if (typeof entry === 'function') {
                result = entry(block, this);
            }

            if (result && typeof result === 'object') {
                this.addInitTokensFrom(result.init || result.initTokens || []);
                const value = result.valueToken || result.value || result.token || '';
                return { matched: true, value: String(value || '') };
            }

            return { matched: true, value: String(result || '') };
        }

        normalizeVarType(typeField) {
            switch (typeField) {
                case 'int':
                case 'long':
                    return 'I';
                case 'float':
                    return 'F';
                case 'char':
                    return 'C';
                case 'String':
                    return 'S';
                case 'boolean':
                    return 'B';
                default:
                    return 'I';
            }
        }

        getVarDisplayName(block) {
            const field = block.getField && block.getField('VAR');
            if (field && typeof field.getText === 'function') {
                return field.getText();
            }
            return block.getFieldValue ? block.getFieldValue('VAR') : 'var';
        }

        allocateVarRef(varName, varType) {
            const existing = this.variableSlots.get(varName);
            if (existing) {
                return existing;
            }
            this.typeCounters[varType] += 1;
            if (this.typeCounters[varType] > 5) {
                throw new Error('Too many variables for type ' + varType + '. Max is 5.');
            }
            const ref = varType + this.typeCounters[varType];
            this.variableSlots.set(varName, { type: varType, ref });
            return this.variableSlots.get(varName);
        }

        getOrCreateVarRef(block, explicitType) {
            const varName = this.getVarDisplayName(block);
            const known = this.variableSlots.get(varName);
            if (known) {
                return known;
            }
            return this.allocateVarRef(varName, explicitType || 'I');
        }

        getInputTarget(block, inputName) {
            if (!block || typeof block.getInputTargetBlock !== 'function') return null;
            return block.getInputTargetBlock(inputName);
        }

        getNextBlock(block) {
            if (!block || !block.nextConnection || typeof block.nextConnection.targetBlock !== 'function') {
                return null;
            }
            return block.nextConnection.targetBlock();
        }

        serializeChain(startBlock) {
            const tokens = [];
            let current = startBlock;
            while (current) {
                const blockTokens = this.serializeStatementBlock(current);
                for (const token of blockTokens) {
                    tokens.push(token);
                }
                current = this.getNextBlock(current);
            }
            return tokens;
        }

        serializeStatementBlock(block) {
            const custom = this.resolveCustomStatementTokens(block);
            if (custom.matched) {
                return custom.tokens;
            }

            switch (block.type) {
                case 'emmi_eyes_digital':
                    this.addInitToken('E');
                    return [this.mapEyeToken(block)];
                case 'emmi_wheels_init':
                    this.addInitToken('M');
                    return [];
                case 'emmi_wheels_simple':
                    this.addInitToken('M');
                    return [this.mapMotorToken(block)];
                case 'emmi_buzzer_note':
                    this.addInitToken('B');
                    return ['BN' + (block.getFieldValue('SOLFA') || block.getFieldValue('NOTE') || 'A4')];
                case 'emmi_buzzer_frequency': {
                    this.addInitToken('B');
                    const freq = this.serializeValueInput(block, 'FREQUENCY', 'F') || '440';
                    const duration = this.serializeValueInput(block, 'DURATION', 'I');
                    const out = ['BF' + freq];
                    if (duration) out.push(this.mapDelayValue(duration));
                    out.push('BS');
                    return out;
                }
                case 'emmi_buzzer_stop':
                    this.addInitToken('B');
                    return ['BS'];
                case 'custom_wait': {
                    const unit = block.getFieldValue('UNIT');
                    let value = this.serializeValueInput(block, 'DELAY', 'I') || '0';
                    if (unit === 'SECONDS' && this.isNumeric(value)) {
                        value = String(Number(value) * 1000);
                    }
                    return [this.mapDelayValue(value)];
                }
                case 'custom_variable_declare':
                    return [this.mapVariableAssign(block, true)];
                case 'custom_variable_set':
                    return [this.mapVariableAssign(block, false)];
                case 'custom_variable_change': {
                    const slot = this.getOrCreateVarRef(block, 'I');
                    const rhs = this.serializeValueInput(block, 'VALUE', slot.type) || '1';
                    return ['G(' + slot.type + ',' + slot.ref.slice(1) + ',+,' + rhs + ')'];
                }
                case 'usb_serial_print_same_line':
                case 'usb_serial_print_new_line':
                case 'usb_serial_print_format': {
                    const value = this.serializeValueInput(block, 'VALUE') || '""';
                    return ['P' + value];
                }
                case 'usb_serial_write': {
                    const value = this.serializeValueInput(block, 'VALUE') || '""';
                    return ['P' + value];
                }
                case 'bluetooth_serial_init': {
                    const name = (block.getFieldValue('NAME') || 'EMMI').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                    this.addInitToken('R"' + name + '"');
                    return [];
                }
                case 'bluetooth_serial_print_same_line':
                    return ['R(P,' + (this.serializeValueInput(block, 'VALUE') || '""') + ')'];
                case 'bluetooth_serial_print_new_line':
                    return ['R(PE,' + (this.serializeValueInput(block, 'VALUE') || '""') + ')'];
                case 'bluetooth_serial_print_format':
                    return ['R(P,' + (this.serializeValueInput(block, 'VALUE') || '0') + ')'];
                case 'bluetooth_serial_write':
                    return ['R(W,' + (this.serializeValueInput(block, 'VALUE') || '""') + ')'];
                case 'custom_controls_if': {
                    const expr = this.serializeValueInput(block, 'IF0') || 'O=,1,0';
                    const thenTokens = this.serializeChain(this.getInputTarget(block, 'DO0'));
                    return ['C(' + expr + '){' + this.wrapBody(thenTokens) + '}{}'];
                }
                case 'custom_controls_whileUntil': {
                    let expr = this.serializeValueInput(block, 'BOOL') || 'O=,1,0';
                    if (block.getFieldValue('MODE') === 'UNTIL') {
                        expr = 'O=,' + expr + ',0';
                    }
                    const body = this.serializeChain(this.getInputTarget(block, 'DO'));
                    return ['W(' + expr + '){' + this.wrapBody(body) + '}'];
                }
                case 'custom_controls_for': {
                    const from = this.serializeValueInput(block, 'FROM', 'I') || '1';
                    const to = this.serializeValueInput(block, 'TO', 'I') || '1';
                    const step = this.serializeValueInput(block, 'BY', 'I') || '1';
                    const body = this.serializeChain(this.getInputTarget(block, 'DO'));
                    return ['F(' + from + '-' + to + ',' + step + '){' + this.wrapBody(body) + '}'];
                }
                case 'custom_controls_switch': {
                    const value = this.serializeValueInput(block, 'SWITCH_VALUE') || '0';
                    const caseValue = this.serializeValueInput(block, 'CASE_VALUE') || '0';
                    const body = this.serializeChain(this.getInputTarget(block, 'DO'));
                    return ['K(' + value + ', (' + caseValue + '){' + this.wrapBody(body) + '} (D){})'];
                }
                case 'custom_flow_statements': {
                    const flow = block.getFieldValue('FLOW');
                    if (flow === 'BREAK') return ['X'];
                    throw new Error('Continue is not supported in EMMI scripts.');
                }
                default:
                    throw new Error('Unsupported block for EMMI export: ' + block.type);
            }
        }

        wrapBody(tokens) {
            if (!tokens || tokens.length === 0) return '';
            return '|' + tokens.join('|') + '|';
        }

        mapEyeToken(block) {
            const pin = block.getFieldValue('PIN');
            const state = block.getFieldValue('STATE') === 'HIGH' ? 'N' : 'F';
            const colorMap = {
                PIN_EYE_RED: 'ER',
                PIN_EYE_GREEN: 'EG',
                PIN_EYE_BLUE: 'EB'
            };
            return (colorMap[pin] || 'EA') + state;
        }

        mapMotorToken(block) {
            const dir = block.getFieldValue('DIRECTION');
            const map = {
                FORWARD: 'MF',
                BACKWARD: 'MB',
                LEFT: 'ML',
                RIGHT: 'MR'
            };
            return map[dir] || 'MS';
        }

        mapVariableAssign(block, isDeclare) {
            let explicitType = isDeclare ? this.normalizeVarType(block.getFieldValue('TYPE')) : null;
            if (!explicitType) {
                const valueBlock = this.getInputTarget(block, 'VALUE');
                explicitType = this.inferValueType(valueBlock) || 'I';
            }
            const slot = this.getOrCreateVarRef(block, explicitType);
            const value = this.serializeValueInput(block, 'VALUE', slot.type) || this.defaultValueForType(slot.type);
            return 'G(' + slot.type + ',' + slot.ref.slice(1) + ',=,' + value + ')';
        }

        defaultValueForType(type) {
            if (type === 'C') return "'\\0'";
            if (type === 'S') return '""';
            if (type === 'B') return '0';
            return '0';
        }

        serializeValueInput(block, inputName, expectedType) {
            const target = this.getInputTarget(block, inputName);
            if (!target) return '';
            return this.serializeValueBlock(target, expectedType || null);
        }

        serializeValueBlock(block, expectedType) {
            const custom = this.resolveCustomValueToken(block);
            if (custom.matched) {
                return custom.value;
            }

            switch (block.type) {
                case 'math_number':
                    return String(block.getFieldValue('NUM'));
                case 'text':
                case 'custom_text_value':
                    return this.formatTextLiteral(block.getFieldValue('TEXT') || '', expectedType);
                case 'custom_variable_get': {
                    const slot = this.getOrCreateVarRef(block, expectedType || 'I');
                    return slot.ref;
                }
                case 'emmi_touch_read':
                    this.addInitToken('T');
                    return 'TR';
                case 'emmi_light_read':
                    this.addInitToken('V');
                    return 'VR';
                case 'emmi_mic_read':
                    this.addInitToken('A');
                    return 'AR';
                case 'bluetooth_serial_available':
                    return 'R(A)';
                case 'bluetooth_serial_read_byte':
                    return 'R(R)';
                case 'bluetooth_serial_read_string_until':
                    return block.getFieldValue('UNTIL_NEWLINE') === 'TRUE' ? 'R(TE)' : 'R(T)';
                case 'bluetooth_serial_read_number_until':
                    return 'R(F)';
                case 'logic_compare':
                    return this.serializeCompare(block);
                case 'math_arithmetic':
                    return this.serializeArithmetic(block);
                case 'custom_logic_not': {
                    const inner = this.serializeValueInput(block, 'BOOL');
                    return 'O=,' + inner + ',0';
                }
                case 'custom_logic_and': {
                    const a = this.serializeValueInput(block, 'A') || '0';
                    const b = this.serializeValueInput(block, 'B') || '0';
                    const op = block.getFieldValue('OP') === 'OR' ? '+' : '*';
                    return 'O' + op + ',' + a + ',' + b;
                }
                case 'logic_boolean':
                    return block.getFieldValue('BOOL') === 'TRUE' ? '1' : '0';
                default:
                    return '0';
            }
        }

        serializeCompare(block) {
            const opMap = {
                EQ: '=',
                NEQ: '!=',
                LT: '<',
                LTE: '<=',
                GT: '>',
                GTE: '>='
            };
            const op = opMap[block.getFieldValue('OP')] || '=';
            const leftBlock = this.getInputTarget(block, 'A');
            const rightBlock = this.getInputTarget(block, 'B');
            const inferred = this.inferComparisonType(leftBlock, rightBlock);
            const left = leftBlock ? this.serializeValueBlock(leftBlock, inferred) : '0';
            const right = rightBlock ? this.serializeValueBlock(rightBlock, inferred) : '0';
            return 'O' + op + ',' + left + ',' + right;
        }

        serializeArithmetic(block) {
            const opMap = {
                ADD: '+',
                MINUS: '-',
                MULTIPLY: '*',
                DIVIDE: '/'
            };
            const op = opMap[block.getFieldValue('OP')];
            if (!op) {
                throw new Error('Unsupported arithmetic op for EMMI expression.');
            }
            const left = this.serializeValueInput(block, 'A') || '0';
            const right = this.serializeValueInput(block, 'B') || '0';
            return 'O' + op + ',' + left + ',' + right;
        }

        inferComparisonType(leftBlock, rightBlock) {
            const leftType = this.inferValueType(leftBlock);
            const rightType = this.inferValueType(rightBlock);
            if (leftType === 'C' || rightType === 'C') return 'C';
            if (leftType === 'S' || rightType === 'S') return 'S';
            if (leftType === 'F' || rightType === 'F') return 'F';
            return null;
        }

        inferValueType(block) {
            if (!block) return null;
            if (block.type === 'math_number') {
                const n = String(block.getFieldValue('NUM'));
                return n.includes('.') ? 'F' : 'I';
            }
            if (block.type === 'text' || block.type === 'custom_text_value') {
                const t = String(block.getFieldValue('TEXT') || '');
                return t.length === 1 ? 'C' : 'S';
            }
            if (block.type === 'custom_variable_get') {
                const name = this.getVarDisplayName(block);
                const slot = this.variableSlots.get(name);
                return slot ? slot.type : null;
            }
            if (block.type === 'bluetooth_serial_read_string_until') return 'S';
            if (block.type === 'bluetooth_serial_read_number_until') return 'F';
            return null;
        }

        formatTextLiteral(text, expectedType) {
            const escaped = String(text).replace(/\\/g, '\\\\');
            if (expectedType === 'C' && escaped.length === 1) {
                return "'" + escaped.replace(/'/g, "\\'") + "'";
            }
            return '"' + escaped.replace(/"/g, '\\"') + '"';
        }

        mapDelayValue(value) {
            if (/^[IFCSB][1-5]$/.test(value)) {
                return 'D ' + value;
            }
            return 'D' + value;
        }

        isNumeric(value) {
            return /^-?\d+(\.\d+)?$/.test(String(value));
        }

        buildScript(initTokens, setupTokens, loopTokens) {
            const orderedInit = this.orderInitTokens(initTokens);
            const i = orderedInit.join('|');
            const s = setupTokens.join('|');
            const l = loopTokens.join('|');
            return '|I|' + i + '|S|' + s + '|L|' + l + '|';
        }

        buildPretty(initTokens, setupTokens, loopTokens) {
            const orderedInit = this.orderInitTokens(initTokens);
            return [
                '|I|',
                ...orderedInit.map((t) => '  ' + t),
                '|S|',
                ...setupTokens.map((t) => '  ' + t),
                '|L|',
                ...loopTokens.map((t) => '  ' + t)
            ].join('\n');
        }

        orderInitTokens(tokens) {
            const priority = ['E', 'B', 'M', 'T', 'A', 'V'];
            const ordered = [];
            for (const p of priority) {
                if (tokens.includes(p)) ordered.push(p);
            }
            for (const token of tokens) {
                if (!priority.includes(token)) ordered.push(token);
            }
            return ordered;
        }

        validateScript(script) {
            if (typeof script !== 'string' || script.length === 0) {
                return { valid: false, error: 'Script is empty.' };
            }
            const iPos = script.indexOf('|I|');
            const sPos = script.indexOf('|S|');
            const lPos = script.indexOf('|L|');
            if (iPos !== 0 || sPos < 0 || lPos < 0 || !(iPos < sPos && sPos < lPos)) {
                return { valid: false, error: 'Script must contain ordered |I|, |S|, |L| sections.' };
            }
            const balance = this.checkBalanced(script);
            if (!balance.valid) return balance;

            const malformed = this.validateCommonCommands(script);
            if (!malformed.valid) return malformed;

            return { valid: true };
        }

        checkBalanced(script) {
            const stack = [];
            const openers = { '(': ')', '{': '}' };
            const closers = new Set([')', '}']);
            for (let i = 0; i < script.length; i += 1) {
                const ch = script[i];
                if (openers[ch]) {
                    stack.push(openers[ch]);
                } else if (closers.has(ch)) {
                    const expected = stack.pop();
                    if (expected !== ch) {
                        return { valid: false, error: 'Unbalanced delimiters near index ' + i + '.' };
                    }
                }
            }
            if (stack.length > 0) {
                return { valid: false, error: 'Unbalanced delimiters: missing closing bracket.' };
            }
            return { valid: true };
        }

        validateCommonCommands(script) {
            const gMatches = script.match(/G\([^)]*\)/g) || [];
            for (const g of gMatches) {
                const inner = g.slice(2, -1);
                const args = inner.split(',');
                if (args.length !== 4) {
                    return { valid: false, error: 'Malformed ' + g + ': expected 4 arguments.' };
                }
                if (!/^[IFCSB]$/.test(args[0])) {
                    return { valid: false, error: 'Malformed ' + g + ': invalid type ' + args[0] + '.' };
                }
            }

            const oMatches = script.match(/O(?:[!<>=+\-*/]{1,2}),[^,|{}()]+,[^|{}()]+/g) || [];
            for (const o of oMatches) {
                const firstComma = o.indexOf(',');
                const rest = o.slice(firstComma + 1);
                const parts = rest.split(',');
                if (parts.length !== 2) {
                    return { valid: false, error: 'Malformed expression ' + o + ': expected 2 operands.' };
                }
            }

            const cCount = (script.match(/C\(/g) || []).length;
            const wCount = (script.match(/W\(/g) || []).length;
            const fCount = (script.match(/F\(/g) || []).length;
            const kCount = (script.match(/K\(/g) || []).length;
            if (cCount + wCount + fCount + kCount > 0) {
                if ((script.match(/\{/g) || []).length !== (script.match(/\}/g) || []).length) {
                    return { valid: false, error: 'Malformed control structure: unbalanced control braces.' };
                }
            }
            return { valid: true };
        }
    }

    globalScope.EMMIScriptExporter = EMMIScriptExporter;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EMMIScriptExporter };
    }
}(typeof window !== 'undefined' ? window : globalThis));
