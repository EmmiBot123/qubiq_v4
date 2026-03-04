/**
 * Java Code Generator for ESP32 Blocks
 */

const javaGenerator = new Blockly.Generator('Java');

javaGenerator.ORDER_ATOMIC = 0;
javaGenerator.ORDER_MULTIPLICATIVE = 3;
javaGenerator.ORDER_ADDITIVE = 4;
javaGenerator.ORDER_RELATIONAL = 5;
javaGenerator.ORDER_NONE = 99;

javaGenerator.imports_ = {};
javaGenerator.INDENT = '        ';

javaGenerator.setupCode_ = [];

javaGenerator.init = function (workspace) { this.imports_ = {}; this.setupCode_ = []; };

javaGenerator.scrub_ = function (block, code) {
    var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    var nextCode = javaGenerator.blockToCode(nextBlock);
    return code + nextCode;
};

javaGenerator.finish = function (code) {
    let imports = Object.values(this.imports_).join('\n');
    let header = '// ESP32 Java-style Code\n// Note: This is pseudocode for educational purposes\n\n';
    if (imports) header += imports + '\n\n';
    header += 'public class ESP32Program {\n\n';
    return header + code + '}\n';
};

javaGenerator.scrubNakedValue = function (line) { return line + ';\n'; };
javaGenerator.quote_ = function (text) { return '"' + text.replace(/"/g, '\\"') + '"'; };

// ============================================
// BASE SETUP/LOOP BLOCK (from Qubiq AI)
// ============================================

javaGenerator.forBlock['base_setup_loop'] = function (block) {
    var setupCode = javaGenerator.statementToCode(block, "SETUP");
    var loopCode = javaGenerator.statementToCode(block, "LOOP");

    var code = '';

    // Add setup method
    code += '    public void setup() {\n';
    if (javaGenerator.setupCode_ && javaGenerator.setupCode_.length > 0) {
        const setupLines = Array.from(new Set(javaGenerator.setupCode_));
        code += setupLines.join('\n') + '\n';
    }
    if (setupCode) {
        code += setupCode;
    }
    code += '    }\n\n';

    // Add loop method
    code += '    public void loop() {\n';
    code += '        while (true) {\n';
    if (loopCode) {
        code += loopCode;
    }
    code += '        }\n';
    code += '    }\n';

    return code;
};

// ============================================
// GPIO
// ============================================

// Setup & Loop
javaGenerator.forBlock['esp32_setup'] = function (block) {
    let code = javaGenerator.statementToCode(block, 'SETUP_CODE');
    return '    public void setup() {\n' + code + '    }\n\n';
};

javaGenerator.forBlock['esp32_loop'] = function (block) {
    let code = javaGenerator.statementToCode(block, 'LOOP_CODE');
    return '    public void loop() {\n        while (true) {\n' + code + '        }\n    }\n\n';
};

// GPIO
javaGenerator.forBlock['esp32_pin_mode'] = function (block) {
    return '        gpio.pinMode(' + block.getFieldValue('PIN') + ', GPIO.' + block.getFieldValue('MODE') + ');\n';
};

javaGenerator.forBlock['esp32_digital_write'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var state = block.getFieldValue('STATE');
    if (!javaGenerator.setupCode_) javaGenerator.setupCode_ = [];
    var setupLine = '        gpio.pinMode(' + pin + ', GPIO.OUTPUT);';
    if (!javaGenerator.setupCode_.includes(setupLine)) javaGenerator.setupCode_.push(setupLine);
    return '        gpio.digitalWrite(' + pin + ', GPIO.' + state + ');\n';
};

javaGenerator.forBlock['esp32_digital_read'] = function (block) {
    var pin = block.getFieldValue('PIN');
    if (!javaGenerator.setupCode_) javaGenerator.setupCode_ = [];
    var setupLine = '        gpio.pinMode(' + pin + ', GPIO.INPUT);';
    if (!javaGenerator.setupCode_.includes(setupLine)) javaGenerator.setupCode_.push(setupLine);
    return ['gpio.digitalRead(' + pin + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_analog_read'] = function (block) {
    return ['adc.read(' + block.getFieldValue('PIN') + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_analog_write'] = function (block) {
    let val = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        pwm.write(' + block.getFieldValue('PIN') + ', ' + val + ');\n';
};

// Time
javaGenerator.forBlock['esp32_delay'] = function (block) {
    let time = javaGenerator.valueToCode(block, 'TIME', javaGenerator.ORDER_ATOMIC) || '1000';
    return '        Thread.sleep(' + time + ');\n';
};

javaGenerator.forBlock['esp32_delay_seconds'] = function (block) {
    let time = javaGenerator.valueToCode(block, 'TIME', javaGenerator.ORDER_ATOMIC) || '1';
    return '        Thread.sleep(' + time + ' * 1000);\n';
};

javaGenerator.forBlock['esp32_millis'] = function (block) {
    return ['System.currentTimeMillis()', javaGenerator.ORDER_ATOMIC];
};

// Serial
javaGenerator.forBlock['esp32_serial_begin'] = function (block) {
    return '        serial = new Serial(' + block.getFieldValue('BAUD') + ');\n';
};

javaGenerator.forBlock['esp32_serial_print'] = function (block) {
    let text = javaGenerator.valueToCode(block, 'TEXT', javaGenerator.ORDER_ATOMIC) || '""';
    return block.getFieldValue('NEWLINE') === 'PRINTLN' ?
        '        System.out.println(' + text + ');\n' :
        '        System.out.print(' + text + ');\n';
};

javaGenerator.forBlock['esp32_serial_available'] = function (block) {
    return ['serial.available() > 0', javaGenerator.ORDER_RELATIONAL];
};

javaGenerator.forBlock['esp32_serial_read'] = function (block) {
    return ['serial.readString()', javaGenerator.ORDER_ATOMIC];
};

// WiFi
javaGenerator.forBlock['esp32_wifi_connect'] = function (block) {
    javaGenerator.imports_['wifi'] = 'import esp32.WiFi;';
    return '        WiFi wifi = new WiFi();\n        wifi.connect("' +
        block.getFieldValue('SSID') + '", "' + block.getFieldValue('PASSWORD') + '");\n' +
        '        while (!wifi.isConnected()) { Thread.sleep(500); }\n';
};

javaGenerator.forBlock['esp32_wifi_status'] = function (block) {
    return ['wifi.isConnected()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_wifi_ip'] = function (block) {
    return ['wifi.getLocalIP()', javaGenerator.ORDER_ATOMIC];
};

// LED
javaGenerator.forBlock['esp32_builtin_led'] = function (block) {
    return '        gpio.digitalWrite(2, GPIO.' + block.getFieldValue('STATE') + ');\n';
};

javaGenerator.forBlock['esp32_led_blink'] = function (block) {
    let pin = block.getFieldValue('PIN');
    let delay = javaGenerator.valueToCode(block, 'DELAY', javaGenerator.ORDER_ATOMIC) || '500';
    return '        gpio.digitalWrite(' + pin + ', GPIO.HIGH);\n        Thread.sleep(' + delay + ');\n' +
        '        gpio.digitalWrite(' + pin + ', GPIO.LOW);\n        Thread.sleep(' + delay + ');\n';
};

// Sensors
javaGenerator.forBlock['esp32_touch_read'] = function (block) {
    return ['touchSensor.read(' + block.getFieldValue('TOUCH_PIN') + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_hall_sensor'] = function (block) {
    return ['hallSensor.read()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_temperature'] = function (block) {
    return ['temperatureSensor.read()', javaGenerator.ORDER_ATOMIC];
};

// OLED
javaGenerator.forBlock['esp32_oled_init'] = function (block) {
    javaGenerator.imports_['oled'] = 'import esp32.display.OLED;';
    let size = block.getFieldValue('SIZE');
    return '        OLED display = new OLED(128, ' + (size === '128x64' ? '64' : '32') + ');\n        display.clear();\n';
};

javaGenerator.forBlock['esp32_oled_clear'] = function (block) { return '        display.clear();\n'; };

javaGenerator.forBlock['esp32_oled_print'] = function (block) {
    let text = javaGenerator.valueToCode(block, 'TEXT', javaGenerator.ORDER_ATOMIC) || '""';
    return '        display.setCursor(' + block.getFieldValue('X') + ', ' + block.getFieldValue('Y') + ');\n' +
        '        display.print(' + text + ');\n';
};

javaGenerator.forBlock['esp32_oled_display'] = function (block) { return '        display.update();\n'; };

// Standard Blocks
javaGenerator.forBlock['text'] = function (block) { return [javaGenerator.quote_(block.getFieldValue('TEXT')), javaGenerator.ORDER_ATOMIC]; };
javaGenerator.forBlock['custom_text_value'] = function (block) { return [javaGenerator.quote_(block.getFieldValue('TEXT')), javaGenerator.ORDER_ATOMIC]; };
javaGenerator.forBlock['math_number'] = function (block) { return [block.getFieldValue('NUM'), javaGenerator.ORDER_ATOMIC]; };

javaGenerator.forBlock['math_arithmetic'] = function (block) {
    let ops = { 'ADD': '+', 'MINUS': '-', 'MULTIPLY': '*', 'DIVIDE': '/', 'POWER': '^' };
    let left = javaGenerator.valueToCode(block, 'A', javaGenerator.ORDER_ADDITIVE) || '0';
    let right = javaGenerator.valueToCode(block, 'B', javaGenerator.ORDER_ADDITIVE) || '0';
    let op = block.getFieldValue('OP');
    if (op === 'POWER') return ['Math.pow(' + left + ', ' + right + ')', javaGenerator.ORDER_ATOMIC];
    return [left + ' ' + ops[op] + ' ' + right, javaGenerator.ORDER_ADDITIVE];
};

javaGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['logic_compare'] = function (block) {
    let ops = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' };
    let left = javaGenerator.valueToCode(block, 'A', javaGenerator.ORDER_RELATIONAL) || '0';
    let right = javaGenerator.valueToCode(block, 'B', javaGenerator.ORDER_RELATIONAL) || '0';
    return [left + ' ' + ops[block.getFieldValue('OP')] + ' ' + right, javaGenerator.ORDER_RELATIONAL];
};

javaGenerator.forBlock['controls_if'] = function (block) {
    let code = '', n = 0;
    do {
        let cond = javaGenerator.valueToCode(block, 'IF' + n, javaGenerator.ORDER_NONE) || 'false';
        let branch = javaGenerator.statementToCode(block, 'DO' + n);
        code += (n === 0 ? '        if' : ' else if') + ' (' + cond + ') {\n' + branch + '        }';
        n++;
    } while (block.getInput('IF' + n));
    if (block.getInput('ELSE')) code += ' else {\n' + javaGenerator.statementToCode(block, 'ELSE') + '        }';
    return code + '\n';
};

javaGenerator.forBlock['controls_repeat_ext'] = function (block) {
    let times = javaGenerator.valueToCode(block, 'TIMES', javaGenerator.ORDER_ATOMIC) || '0';
    return '        for (int i = 0; i < ' + times + '; i++) {\n' + javaGenerator.statementToCode(block, 'DO') + '        }\n';
};

javaGenerator.forBlock['controls_whileUntil'] = function (block) {
    let cond = javaGenerator.valueToCode(block, 'BOOL', javaGenerator.ORDER_NONE) || 'false';
    if (block.getFieldValue('MODE') === 'UNTIL') cond = '!(' + cond + ')';
    return '        while (' + cond + ') {\n' + javaGenerator.statementToCode(block, 'DO') + '        }\n';
};

// ============================================
// TIMING BLOCKS (Custom)
// ============================================

javaGenerator.forBlock['custom_wait'] = function (block) {
    var delay = javaGenerator.valueToCode(block, 'DELAY', javaGenerator.ORDER_ATOMIC) || '0';
    var unit = block.getFieldValue('UNIT');

    if (unit === 'SECONDS') {
        return '        Thread.sleep(' + delay + ' * 1000);\n';
    } else if (unit === 'MICROSECONDS') {
        return '        Thread.sleep(0, ' + delay + ' * 1000);\n';
    } else {
        return '        Thread.sleep(' + delay + ');\n';
    }
};

javaGenerator.forBlock['custom_timer'] = function (block) {
    var interval = javaGenerator.valueToCode(block, 'interval', javaGenerator.ORDER_ATOMIC) || '1000';
    var unit = block.getFieldValue('UNIT');
    var branch = javaGenerator.statementToCode(block, 'DO');
    var scale = (unit === 'SECONDS') ? ' * 1000' : '';

    return '        if (System.currentTimeMillis() - timerLast > ' + interval + scale + ') {\n' +
        '            timerLast = System.currentTimeMillis();\n' +
        branch + '        }\n';
};

javaGenerator.forBlock['start_timekeeping'] = function (block) {
    return '        startTime = System.currentTimeMillis();\n';
};

javaGenerator.forBlock['get_duration'] = function (block) {
    var unit = block.getFieldValue('UNIT');
    if (unit === 'SECONDS') {
        return ['(System.currentTimeMillis() / 1000)', javaGenerator.ORDER_ATOMIC];
    }
    return ['System.currentTimeMillis()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['state_duration'] = function (block) {
    var state = block.getFieldValue('STATE');
    var pin = javaGenerator.valueToCode(block, 'PIN', javaGenerator.ORDER_ATOMIC) || '0';
    return ['pulseIn(' + pin + ', ' + state + ')', javaGenerator.ORDER_ATOMIC];
};

// ============================================
// CONTROL BLOCKS (Custom)
// ============================================

javaGenerator.forBlock['custom_controls_if'] = function (block) {
    var n = 0;
    var code = '';
    do {
        var conditionCode = javaGenerator.valueToCode(block, 'IF' + n, javaGenerator.ORDER_NONE) || 'false';
        var branchCode = javaGenerator.statementToCode(block, 'DO' + n);
        code += (n > 0 ? ' else ' : '        ') + 'if (' + conditionCode + ') {\n' + branchCode + '        }';
        ++n;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE')) {
        var branchCode = javaGenerator.statementToCode(block, 'ELSE');
        code += ' else {\n' + branchCode + '        }';
    }
    return code + '\n';
};

javaGenerator.forBlock['custom_controls_repeat'] = function (block) {
    var repeats = javaGenerator.valueToCode(block, 'TIMES', javaGenerator.ORDER_ATOMIC) || '0';
    var branch = javaGenerator.statementToCode(block, 'DO');
    return '        for (int count = 0; count < ' + repeats + '; count++) {\n' + branch + '        }\n';
};

javaGenerator.forBlock['custom_controls_whileUntil'] = function (block) {
    var until = block.getFieldValue('MODE') === 'UNTIL';
    var condition = javaGenerator.valueToCode(block, 'BOOL', javaGenerator.ORDER_NONE) || 'false';
    var branch = javaGenerator.statementToCode(block, 'DO');
    if (until) {
        condition = '!(' + condition + ')';
    }
    return '        while (' + condition + ') {\n' + branch + '        }\n';
};

javaGenerator.forBlock['custom_controls_for'] = function (block) {
    var variable0 = block.getFieldValue('VAR') || 'i';
    var from = javaGenerator.valueToCode(block, 'FROM', javaGenerator.ORDER_ATOMIC) || '0';
    var to = javaGenerator.valueToCode(block, 'TO', javaGenerator.ORDER_ATOMIC) || '0';
    var by = javaGenerator.valueToCode(block, 'BY', javaGenerator.ORDER_ATOMIC) || '1';
    var branch = javaGenerator.statementToCode(block, 'DO');
    return '        for (int ' + variable0 + ' = ' + from + '; ' + variable0 + ' <= ' + to + '; ' + variable0 + ' += ' + by + ') {\n' + branch + '        }\n';
};

javaGenerator.forBlock['custom_controls_switch'] = function (block) {
    var switchValue = javaGenerator.valueToCode(block, 'SWITCH_VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var targetValue = javaGenerator.valueToCode(block, 'CASE_VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var branch = javaGenerator.statementToCode(block, 'DO');
    return '        if (' + switchValue + ' == ' + targetValue + ') {\n' + branch + '        }\n';
};

javaGenerator.forBlock['custom_flow_statements'] = function (block) {
    switch (block.getFieldValue('FLOW')) {
        case 'BREAK':
            return '        break;\n';
        case 'CONTINUE':
            return '        continue;\n';
    }
    return '        break;\n';
};

javaGenerator.forBlock['custom_logic_and'] = function (block) {
    var operator = (block.getFieldValue('OP') == 'OR') ? ' || ' : ' && ';
    var order = javaGenerator.ORDER_ATOMIC;
    var argument0 = javaGenerator.valueToCode(block, 'A', order) || 'false';
    var argument1 = javaGenerator.valueToCode(block, 'B', order) || 'false';
    return [argument0 + operator + argument1, order];
};

javaGenerator.forBlock['custom_logic_not'] = function (block) {
    var argument0 = javaGenerator.valueToCode(block, 'BOOL', javaGenerator.ORDER_ATOMIC) || 'true';
    return ['!' + argument0, javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['custom_logic_null'] = function (block) {
    return ['null', javaGenerator.ORDER_ATOMIC];
};

// ============================================
// OPERATOR BLOCKS (Custom)
// ============================================

javaGenerator.forBlock['custom_math_map'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var fromLow = javaGenerator.valueToCode(block, 'FROM_LOW', javaGenerator.ORDER_ATOMIC) || '0';
    var fromHigh = javaGenerator.valueToCode(block, 'FROM_HIGH', javaGenerator.ORDER_ATOMIC) || '1023';
    var toLow = javaGenerator.valueToCode(block, 'TO_LOW', javaGenerator.ORDER_ATOMIC) || '0';
    var toHigh = javaGenerator.valueToCode(block, 'TO_HIGH', javaGenerator.ORDER_ATOMIC) || '255';
    return ['(int)((' + value + ' - ' + fromLow + ') * (' + toHigh + ' - ' + toLow + ') / (' + fromHigh + ' - ' + fromLow + ') + ' + toLow + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['custom_math_random_int'] = function (block) {
    var from = javaGenerator.valueToCode(block, 'FROM', javaGenerator.ORDER_ATOMIC) || '0';
    var to = javaGenerator.valueToCode(block, 'TO', javaGenerator.ORDER_ATOMIC) || '100';
    return ['(int)(Math.random() * (' + to + ' - ' + from + ' + 1) + ' + from + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['custom_math_constrain'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var low = javaGenerator.valueToCode(block, 'LOW', javaGenerator.ORDER_ATOMIC) || '0';
    var high = javaGenerator.valueToCode(block, 'HIGH', javaGenerator.ORDER_ATOMIC) || '100';
    return ['Math.max(' + low + ', Math.min(' + value + ', ' + high + '))', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['cast_to_byte'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return ['(byte)(' + value + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['cast_to_unsigned_int'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return ['(int)(' + value + ') & 0xFFFF', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['cast_to_int'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return ['(int)(' + value + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['cast_to_float'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return ['(float)(' + value + ')', javaGenerator.ORDER_ATOMIC];
};

// ============================================
// EXTRA GPIO BLOCKS
// ============================================

javaGenerator.forBlock['esp32_digital_state'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var pullup = block.getFieldValue('PULLUP') === 'TRUE';
    if (pullup) {
        return ['gpio.digitalRead(' + pin + ', GPIO.INPUT_PULLUP)', javaGenerator.ORDER_ATOMIC];
    }
    return ['gpio.digitalRead(' + pin + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_toggle_pin'] = function (block) {
    var pin = block.getFieldValue('PIN');
    if (!javaGenerator.setupCode_) javaGenerator.setupCode_ = [];
    var setupLine = '        gpio.pinMode(' + pin + ', GPIO.OUTPUT);';
    if (!javaGenerator.setupCode_.includes(setupLine)) javaGenerator.setupCode_.push(setupLine);
    return '        gpio.digitalWrite(' + pin + ', !gpio.digitalRead(' + pin + '));\n';
};

javaGenerator.forBlock['esp32_interrupt'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var mode = block.getFieldValue('MODE');
    var branch = javaGenerator.statementToCode(block, 'DO');
    return '        // Interrupt on pin ' + pin + ' (' + mode + ')\n' +
        '        attachInterrupt(' + pin + ', () -> {\n' + branch + '        }, GPIO.' + mode + ');\n';
};

javaGenerator.forBlock['esp32_detach_interrupt'] = function (block) {
    var pin = block.getFieldValue('PIN');
    return '        detachInterrupt(' + pin + ');\n';
};

javaGenerator.forBlock['esp32_restart'] = function (block) {
    return '        ESP32.restart();\n';
};

javaGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    var time = javaGenerator.valueToCode(block, 'TIME', javaGenerator.ORDER_ATOMIC) || '1';
    return '        ESP32.deepSleep(' + time + ' * 1000000);\n';
};

console.log('Java generator loaded');
