'use strict';

const assert = require('assert');
const { EMMIScriptExporter } = require('../generators/emmi_exporter.js');

function mockBlock(type, fields = {}, inputs = {}, next = null) {
    return {
        type,
        getFieldValue(name) {
            return fields[name];
        },
        getField(name) {
            if (name === 'VAR' && typeof fields.VAR_TEXT === 'string') {
                return { getText: () => fields.VAR_TEXT };
            }
            return null;
        },
        getInputTargetBlock(name) {
            return inputs[name] || null;
        },
        nextConnection: {
            targetBlock() {
                return next;
            }
        }
    };
}

function buildWorkspace(baseBlock) {
    return {
        getTopBlocks() {
            return [baseBlock];
        }
    };
}

function testSerializationOrder() {
    const ledOn = mockBlock('emmi_eyes_digital', { PIN: 'PIN_EYE_RED', STATE: 'HIGH' });
    const wait = mockBlock('custom_wait', { UNIT: 'MILLISECONDS' }, { DELAY: mockBlock('math_number', { NUM: '200' }) });
    const ledOff = mockBlock('emmi_eyes_digital', { PIN: 'PIN_EYE_RED', STATE: 'LOW' });
    ledOn.nextConnection.targetBlock = () => wait;
    wait.nextConnection.targetBlock = () => ledOff;

    const base = mockBlock('base_setup_loop', {}, { SETUP: null, LOOP: ledOn });
    const exporter = new EMMIScriptExporter();
    const out = exporter.generateFromWorkspace(buildWorkspace(base));

    assert.strictEqual(out.script, '|I|E|S||L|ERN|D200|ERF|');
}

function testNestedIfWhile() {
    const ifBlock = mockBlock('custom_controls_if', {}, {
        IF0: mockBlock('logic_compare', { OP: 'GT' }, {
            A: mockBlock('emmi_light_read'),
            B: mockBlock('math_number', { NUM: '10' })
        }),
        DO0: mockBlock('emmi_eyes_digital', { PIN: 'PIN_EYE_GREEN', STATE: 'HIGH' })
    });

    const whileBlock = mockBlock('custom_controls_whileUntil', { MODE: 'WHILE' }, {
        BOOL: mockBlock('logic_compare', { OP: 'EQ' }, {
            A: mockBlock('emmi_touch_read'),
            B: mockBlock('math_number', { NUM: '1' })
        }),
        DO: ifBlock
    });

    const base = mockBlock('base_setup_loop', {}, { SETUP: null, LOOP: whileBlock });
    const exporter = new EMMIScriptExporter();
    const out = exporter.generateFromWorkspace(buildWorkspace(base));

    assert.ok(out.script.includes('W(O=,TR,1){|C(O>,VR,10){|EGN|}{}|}|'));
}

function testTypedComparisons() {
    const declareChar = mockBlock('custom_variable_declare', { TYPE: 'char', VAR_TEXT: 'ch' }, {
        VALUE: mockBlock('text', { TEXT: 'E' })
    });
    const declareFloat = mockBlock('custom_variable_declare', { TYPE: 'float', VAR_TEXT: 'f1' }, {
        VALUE: mockBlock('math_number', { NUM: '1.2' })
    });
    declareChar.nextConnection.targetBlock = () => declareFloat;

    const compareChar = mockBlock('logic_compare', { OP: 'EQ' }, {
        A: mockBlock('custom_variable_get', { VAR_TEXT: 'ch' }),
        B: mockBlock('text', { TEXT: 'E' })
    });
    const compareFloat = mockBlock('logic_compare', { OP: 'GT' }, {
        A: mockBlock('custom_variable_get', { VAR_TEXT: 'f1' }),
        B: mockBlock('math_number', { NUM: '1.5' })
    });

    const if1 = mockBlock('custom_controls_if', {}, { IF0: compareChar, DO0: null });
    const if2 = mockBlock('custom_controls_if', {}, { IF0: compareFloat, DO0: null });
    if1.nextConnection.targetBlock = () => if2;

    const base = mockBlock('base_setup_loop', {}, { SETUP: declareChar, LOOP: if1 });
    const exporter = new EMMIScriptExporter();
    const out = exporter.generateFromWorkspace(buildWorkspace(base));

    assert.ok(out.script.includes('O=,C1,\'E\''));
    assert.ok(out.script.includes('O>,F1,1.5'));
}

function testBluetoothFlowSample() {
    const btInit = mockBlock('bluetooth_serial_init', { NAME: 'EMMI' });

    const readIntoChar = mockBlock('custom_variable_declare', { TYPE: 'char', VAR_TEXT: 'btChar' }, {
        VALUE: mockBlock('bluetooth_serial_read_byte')
    });

    const ifAvailable = mockBlock('custom_controls_if', {}, {
        IF0: mockBlock('logic_compare', { OP: 'GT' }, {
            A: mockBlock('bluetooth_serial_available'),
            B: mockBlock('math_number', { NUM: '0' })
        }),
        DO0: readIntoChar
    });

    const blinkRed = mockBlock('emmi_eyes_digital', { PIN: 'PIN_EYE_RED', STATE: 'HIGH' });
    const d1 = mockBlock('custom_wait', { UNIT: 'MILLISECONDS' }, { DELAY: mockBlock('math_number', { NUM: '200' }) });
    const redOff = mockBlock('emmi_eyes_digital', { PIN: 'PIN_EYE_RED', STATE: 'LOW' });
    const d2 = mockBlock('custom_wait', { UNIT: 'MILLISECONDS' }, { DELAY: mockBlock('math_number', { NUM: '200' }) });
    blinkRed.nextConnection.targetBlock = () => d1;
    d1.nextConnection.targetBlock = () => redOff;
    redOff.nextConnection.targetBlock = () => d2;

    const ifEqualsE = mockBlock('custom_controls_if', {}, {
        IF0: mockBlock('logic_compare', { OP: 'EQ' }, {
            A: mockBlock('custom_variable_get', { VAR_TEXT: 'btChar' }),
            B: mockBlock('text', { TEXT: 'E' })
        }),
        DO0: blinkRed
    });

    ifAvailable.nextConnection.targetBlock = () => ifEqualsE;
    const base = mockBlock('base_setup_loop', {}, { SETUP: btInit, LOOP: ifAvailable });

    const exporter = new EMMIScriptExporter();
    const out = exporter.generateFromWorkspace(buildWorkspace(base));

    const expected = '|I|E|R"EMMI"|S||L|C(O>,R(A),0){|G(C,1,=,R(R))|}{}|C(O=,C1,\'E\'){|ERN|D200|ERF|D200|}{}|';
    assert.strictEqual(out.script, expected);
}

function testInvalidValidation() {
    const exporter = new EMMIScriptExporter();
    const noSections = exporter.validateScript('|S|A|L|B|');
    assert.strictEqual(noSections.valid, false);

    const malformedG = exporter.validateScript('|I||S|G(I,1,=)|L||');
    assert.strictEqual(malformedG.valid, false);

    const unbalanced = exporter.validateScript('|I||S||L|C(O=,1,1){|ERN|{}|');
    assert.strictEqual(unbalanced.valid, false);
}

function run() {
    testSerializationOrder();
    testNestedIfWhile();
    testTypedComparisons();
    testBluetoothFlowSample();
    testInvalidValidation();
    console.log('EMMI exporter tests passed.');
}

run();
