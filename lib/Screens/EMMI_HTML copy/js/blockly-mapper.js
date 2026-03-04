'use strict';

(function (globalScope) {
    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function cloneDescriptor(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function toFiniteNumber(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function normalizeProgram(program, warnings) {
        const safe = program && typeof program === 'object' ? program : {};
        return {
            initFlags: asArray(safe.initFlags).filter((f) => typeof f === 'string'),
            setup: asArray(safe.setup),
            loop: asArray(safe.loop),
            warnings
        };
    }

    function createNumberDescriptor(value, map) {
        return {
            type: map.value.number,
            fields: { NUM: String(value) }
        };
    }

    function buildValueDescriptor(value, map, warnings) {
        if (typeof value === 'number') {
            return createNumberDescriptor(value, map);
        }

        if (typeof value === 'boolean') {
            return createNumberDescriptor(value ? 1 : 0, map);
        }

        if (value && typeof value === 'object' && typeof value.op === 'string') {
            const opMap = {
                '+': 'ADD',
                '-': 'MINUS',
                '*': 'MULTIPLY',
                '/': 'DIVIDE'
            };
            const mathOp = opMap[value.op];
            if (mathOp) {
                return {
                    type: map.blocks.mathArithmetic,
                    fields: { OP: mathOp },
                    inputs: {
                        A: buildValueDescriptor(value.left, map, warnings),
                        B: buildValueDescriptor(value.right, map, warnings)
                    }
                };
            }
        }

        if (typeof value !== 'string') {
            warnings.push('Unsupported value type. Falling back to 0.');
            return createNumberDescriptor(0, map);
        }

        const token = value.trim();
        if (/^-?\d+(\.\d+)?$/.test(token)) {
            return createNumberDescriptor(Number(token), map);
        }

        if (/^[IFCSB][1-5]$/.test(token)) {
            return {
                type: map.value.variable,
                fields: { VAR: token }
            };
        }

        if (token === 'TR') {
            return { type: map.value.touch, fields: { PIN: 'PIN_TOUCH', MODE: 'INPUT_PULLUP' } };
        }
        if (token === 'AR') {
            return { type: map.value.mic, fields: { PIN: 'PIN_MIC', MODE: 'INPUT_PULLUP' } };
        }
        if (token === 'VR') {
            return { type: map.value.light, fields: { PIN: 'PIN_LIGHT' } };
        }

        const quoted = token.match(/^(["'])(.*)\1$/);
        if (quoted) {
            return {
                type: map.value.text,
                fields: { TEXT: quoted[2] }
            };
        }

        return {
            type: map.value.text,
            fields: { TEXT: token }
        };
    }

    function buildCompareDescriptor(expr, map, warnings) {
        const opMap = {
            '==': 'EQ',
            '!=': 'NEQ',
            '>': 'GT',
            '>=': 'GTE',
            '<': 'LT',
            '<=': 'LTE'
        };
        const op = opMap[expr && expr.op] || 'EQ';
        if (!opMap[expr && expr.op]) {
            warnings.push('Unsupported expression op "' + (expr && expr.op ? expr.op : '') + '". Using ==.');
        }
        return {
            type: map.blocks.logicCompare,
            fields: { OP: op },
            inputs: {
                A: buildValueDescriptor(expr ? expr.left : 0, map, warnings),
                B: buildValueDescriptor(expr ? expr.right : 0, map, warnings)
            }
        };
    }

    function invertExpr(expr) {
        if (!expr || typeof expr !== 'object') return null;
        const inverse = {
            '==': '!=',
            '!=': '==',
            '>': '<=',
            '>=': '<',
            '<': '>=',
            '<=': '>'
        };
        const invOp = inverse[expr.op];
        if (!invOp) return null;
        return {
            op: invOp,
            left: expr.left,
            right: expr.right
        };
    }

    function combineWithAnd(descriptors, map) {
        if (!descriptors.length) return null;
        if (descriptors.length === 1) return descriptors[0];
        let current = descriptors[0];
        for (let i = 1; i < descriptors.length; i += 1) {
            current = {
                type: map.blocks.logicAnd,
                fields: { OP: 'AND' },
                inputs: {
                    A: current,
                    B: descriptors[i]
                }
            };
        }
        return current;
    }

    function mapSwitchNode(node, map, warnings) {
        const output = [];
        const cases = asArray(node.cases).filter((entry) => entry && typeof entry === 'object');
        const switchValue = node.value;

        for (const entry of cases) {
            const ifNode = {
                type: 'if',
                expr: { op: '==', left: switchValue, right: entry.match },
                then: asArray(entry.body)
            };
            output.push(...mapNodeToDescriptors(ifNode, map, warnings));
        }

        if (Array.isArray(node.default) && node.default.length > 0 && cases.length > 0) {
            const notEquals = cases.map((entry) => buildCompareDescriptor({ op: '!=', left: switchValue, right: entry.match }, map, warnings));
            const defaultCondition = combineWithAnd(notEquals, map);
            if (defaultCondition) {
                output.push({
                    type: map.blocks.if,
                    inputs: { IF0: defaultCondition },
                    statements: { DO0: mapNodeListToDescriptors(node.default, map, warnings) }
                });
            }
        }

        return output;
    }

    function mapCommandToken(cmd, map, warnings) {
        const descriptor = map.commandMap[cmd];
        if (!descriptor) {
            warnings.push('Command "' + cmd + '" is not mapped to a Blockly block.');
            return [];
        }
        const list = Array.isArray(descriptor) ? descriptor : [descriptor];
        return list.map((item) => cloneDescriptor(item));
    }

    function mapNodeToDescriptors(node, map, warnings) {
        if (!node || typeof node !== 'object') {
            warnings.push('Ignored invalid node.');
            return [];
        }

        switch (node.type) {
            case 'cmd': {
                const cmd = typeof node.cmd === 'string' ? node.cmd.trim().toUpperCase() : '';
                if (!cmd) {
                    warnings.push('Ignored cmd node without token.');
                    return [];
                }
                return mapCommandToken(cmd, map, warnings);
            }

            case 'delay': {
                const ms = Math.max(0, Math.round(toFiniteNumber(node.ms, 0)));
                return [{
                    type: map.blocks.delay,
                    fields: { UNIT: 'MILLISECONDS' },
                    inputs: { DELAY: createNumberDescriptor(ms, map) }
                }];
            }

            case 'set_var': {
                const varType = typeof node.varType === 'string' ? node.varType.toUpperCase() : 'I';
                const index = Math.max(1, Math.min(5, Math.round(toFiniteNumber(node.index, 1))));
                const varName = varType + String(index);
                const value = buildValueDescriptor(node.value, map, warnings);

                if (node.op === '=') {
                    return [{
                        type: map.blocks.setVar,
                        fields: { VAR: varName },
                        inputs: { VALUE: value }
                    }];
                }

                if (node.op === '+') {
                    return [{
                        type: map.blocks.changeVar,
                        fields: { VAR: varName },
                        inputs: { VALUE: value }
                    }];
                }

                warnings.push('Unsupported set_var op "' + node.op + '".');
                return [];
            }

            case 'if': {
                const thenBlocks = mapNodeListToDescriptors(node.then, map, warnings);
                const baseIf = {
                    type: map.blocks.if,
                    inputs: { IF0: buildCompareDescriptor(node.expr, map, warnings) },
                    statements: { DO0: thenBlocks }
                };
                const output = [baseIf];

                const elseNodes = asArray(node.else);
                if (elseNodes.length > 0) {
                    const inverted = invertExpr(node.expr);
                    if (inverted) {
                        output.push({
                            type: map.blocks.if,
                            inputs: { IF0: buildCompareDescriptor(inverted, map, warnings) },
                            statements: { DO0: mapNodeListToDescriptors(elseNodes, map, warnings) }
                        });
                    } else {
                        warnings.push('Else branch skipped because condition cannot be inverted in current block set.');
                    }
                }
                return output;
            }

            case 'while': {
                return [{
                    type: map.blocks.while,
                    fields: { MODE: 'WHILE' },
                    inputs: { BOOL: buildCompareDescriptor(node.expr, map, warnings) },
                    statements: { DO: mapNodeListToDescriptors(node.body, map, warnings) }
                }];
            }

            case 'for': {
                const start = toFiniteNumber(node.start, 0);
                const end = toFiniteNumber(node.end, 0);
                const stepRaw = toFiniteNumber(node.step, 1);
                const step = stepRaw === 0 ? 1 : stepRaw;
                return [{
                    type: map.blocks.for,
                    fields: { VAR: map.blocks.forVarName || 'i' },
                    inputs: {
                        FROM: createNumberDescriptor(start, map),
                        TO: createNumberDescriptor(end, map),
                        BY: createNumberDescriptor(step, map)
                    },
                    statements: { DO: mapNodeListToDescriptors(node.body, map, warnings) }
                }];
            }

            case 'switch':
                return mapSwitchNode(node, map, warnings);

            case 'break':
                return [{ type: map.blocks.break, fields: { FLOW: 'BREAK' } }];

            default:
                warnings.push('Unsupported node type "' + node.type + '" skipped.');
                return [];
        }
    }

    function mapNodeListToDescriptors(nodes, map, warnings) {
        const output = [];
        for (const node of asArray(nodes)) {
            output.push(...mapNodeToDescriptors(node, map, warnings));
        }
        return output;
    }

    function programToBlocklyJson(program, blockTypeMap) {
        const warnings = [];
        const normalized = normalizeProgram(program, warnings);

        const map = blockTypeMap || {};
        const setup = mapNodeListToDescriptors(normalized.setup, map, warnings);
        const loop = mapNodeListToDescriptors(normalized.loop, map, warnings);

        return {
            type: 'emmi-blockly-program',
            initFlags: normalized.initFlags.slice(),
            setup,
            loop,
            warnings
        };
    }

    function ensureVariable(workspace, name) {
        if (!workspace || !name) return null;
        const map = workspace.getVariableMap();
        let variable = map.getVariable(name);
        if (!variable) {
            variable = map.createVariable(name);
        }
        return variable;
    }

    function setFieldSmart(block, fieldName, value, workspace, warnings) {
        const field = block.getField(fieldName);
        if (!field) return;

        if (typeof field.getVariable === 'function') {
            const variable = ensureVariable(workspace, String(value));
            if (variable) {
                field.setValue(variable.getId());
            }
            return;
        }

        try {
            block.setFieldValue(String(value), fieldName);
        } catch (err) {
            warnings.push('Failed setting field ' + fieldName + ' on ' + block.type + ': ' + err.message);
        }
    }

    function instantiateBlockDescriptor(workspace, descriptor, map, warnings) {
        if (!descriptor || !descriptor.type) return null;
        if (!Blockly.Blocks[descriptor.type]) {
            warnings.push('Missing block type: ' + descriptor.type);
            return null;
        }

        const block = workspace.newBlock(descriptor.type);
        if (typeof block.initSvg === 'function') block.initSvg();

        const fields = descriptor.fields || {};
        for (const key of Object.keys(fields)) {
            setFieldSmart(block, key, fields[key], workspace, warnings);
        }

        const inputs = descriptor.inputs || {};
        for (const inputName of Object.keys(inputs)) {
            const childDescriptor = inputs[inputName];
            const child = instantiateBlockDescriptor(workspace, childDescriptor, map, warnings);
            const input = block.getInput(inputName);
            if (!child || !input || !input.connection || !child.outputConnection) {
                if (child) child.dispose();
                continue;
            }
            input.connection.connect(child.outputConnection);
        }

        const statements = descriptor.statements || {};
        for (const inputName of Object.keys(statements)) {
            const input = block.getInput(inputName);
            const nodes = asArray(statements[inputName]);
            if (!input || !input.connection || nodes.length === 0) continue;

            let firstChild = null;
            let prevChild = null;
            for (const childDescriptor of nodes) {
                const child = instantiateBlockDescriptor(workspace, childDescriptor, map, warnings);
                if (!child) continue;

                if (!firstChild) {
                    firstChild = child;
                }

                if (prevChild && prevChild.nextConnection && child.previousConnection) {
                    prevChild.nextConnection.connect(child.previousConnection);
                }

                prevChild = child;
            }

            if (firstChild && firstChild.previousConnection) {
                input.connection.connect(firstChild.previousConnection);
            }
        }

        if (typeof block.render === 'function') block.render();
        return block;
    }

    function loadProgramIntoWorkspace(workspace, program, blockTypeMap) {
        if (!workspace) {
            return { warnings: ['Blockly workspace is unavailable.'] };
        }

        const map = blockTypeMap || {};
        const payload = programToBlocklyJson(program, map);
        const warnings = payload.warnings.slice();

        if (!map.base || !map.base.type) {
            warnings.push('Missing base block mapping.');
            return { warnings };
        }

        if (!Blockly.Blocks[map.base.type]) {
            warnings.push('Base block type not found: ' + map.base.type);
            return { warnings };
        }

        workspace.clear();
        const base = workspace.newBlock(map.base.type);
        if (typeof base.initSvg === 'function') base.initSvg();

        const stacks = [
            { input: map.base.setupInput || 'SETUP', nodes: payload.setup },
            { input: map.base.loopInput || 'LOOP', nodes: payload.loop }
        ];

        for (const stack of stacks) {
            const input = base.getInput(stack.input);
            if (!input || !input.connection) {
                warnings.push('Base block input missing: ' + stack.input);
                continue;
            }

            let first = null;
            let prev = null;
            for (const descriptor of stack.nodes) {
                const block = instantiateBlockDescriptor(workspace, descriptor, map, warnings);
                if (!block) continue;

                if (!first) first = block;
                if (prev && prev.nextConnection && block.previousConnection) {
                    prev.nextConnection.connect(block.previousConnection);
                }
                prev = block;
            }

            if (first && first.previousConnection) {
                input.connection.connect(first.previousConnection);
            }
        }

        if (typeof base.render === 'function') base.render();
        if (typeof base.moveBy === 'function') base.moveBy(30, 30);
        if (typeof workspace.scrollCenter === 'function') workspace.scrollCenter();

        return {
            warnings,
            blocklyJson: payload
        };
    }

    const api = {
        programToBlocklyJson,
        loadProgramIntoWorkspace
    };

    globalScope.EMMIBlocklyMapper = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
}(typeof window !== 'undefined' ? window : globalThis));
