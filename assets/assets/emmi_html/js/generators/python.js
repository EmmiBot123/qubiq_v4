/**
 * MicroPython Code Generator for ESP32 Blocks
 */

const pythonGenerator = new Blockly.Generator('Python');

pythonGenerator.ORDER_ATOMIC = 0;
pythonGenerator.ORDER_MULTIPLICATIVE = 3;
pythonGenerator.ORDER_ADDITIVE = 4;
pythonGenerator.ORDER_RELATIONAL = 5;
pythonGenerator.ORDER_NONE = 99;

pythonGenerator.imports_ = {};
pythonGenerator.definitions_ = {};
pythonGenerator.INDENT = '    ';

pythonGenerator.init = function (workspace) {
    this.imports_ = {};
    this.definitions_ = {};
    this.emmi_setup = {};
};

pythonGenerator.scrub_ = function (block, code) {
    var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    var nextCode = pythonGenerator.blockToCode(nextBlock);
    return code + nextCode;
};

pythonGenerator.finish = function (code) {
    let imports = Object.values(this.imports_).join('\n');
    let defs = Object.values(this.definitions_).join('\n');
    return (imports ? imports + '\n\n' : '') + (defs ? defs + '\n\n' : '') + code;
};

pythonGenerator.scrubNakedValue = function (line) { return line + '\n'; };
pythonGenerator.quote_ = function (text) { return '"' + text.replace(/"/g, '\\"') + '"'; };

// ============================================
// BASE SETUP/LOOP BLOCK (from Qubiq AI)
// ============================================

pythonGenerator.forBlock['base_setup_loop'] = function (block) {
    var setupCode = pythonGenerator.statementToCode(block, "SETUP");
    var loopCode = pythonGenerator.statementToCode(block, "LOOP");

    var code = '';

    // Add setup code
    if (setupCode) {
        code += '# Setup\n' + setupCode + '\n';
    }

    // Add loop code
    code += '# Main loop\n';
    code += 'while True:\n';
    if (loopCode) {
        code += loopCode;
    } else {
        code += '    pass\n';
    }

    return code;
};

// ============================================
// GPIO
// ============================================

// Setup & Loop
pythonGenerator.forBlock['esp32_setup'] = function (block) {
    return '# Setup\n' + pythonGenerator.statementToCode(block, 'SETUP_CODE') + '\n';
};

pythonGenerator.forBlock['esp32_loop'] = function (block) {
    return 'while True:\n' + pythonGenerator.statementToCode(block, 'LOOP_CODE') + '\n';
};

// GPIO
pythonGenerator.forBlock['esp32_pin_mode'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return '';
};

pythonGenerator.forBlock['esp32_digital_write'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return 'Pin(' + block.getFieldValue('PIN') + ', Pin.OUT).value(' + (block.getFieldValue('STATE') === 'HIGH' ? '1' : '0') + ')\n';
};

pythonGenerator.forBlock['esp32_digital_read'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return ['Pin(' + block.getFieldValue('PIN') + ', Pin.IN).value()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_analog_read'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return ['ADC(Pin(' + block.getFieldValue('PIN') + ')).read()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_analog_write'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    let val = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'PWM(Pin(' + block.getFieldValue('PIN') + '), freq=1000).duty(' + val + ')\n';
};

// Time
pythonGenerator.forBlock['esp32_delay'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    return 'time.sleep_ms(' + (pythonGenerator.valueToCode(block, 'TIME', pythonGenerator.ORDER_ATOMIC) || '1000') + ')\n';
};

pythonGenerator.forBlock['esp32_delay_seconds'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    return 'time.sleep(' + (pythonGenerator.valueToCode(block, 'TIME', pythonGenerator.ORDER_ATOMIC) || '1') + ')\n';
};

pythonGenerator.forBlock['esp32_millis'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    return ['time.ticks_ms()', pythonGenerator.ORDER_ATOMIC];
};

// Serial
pythonGenerator.forBlock['esp32_serial_begin'] = function (block) { return ''; };

pythonGenerator.forBlock['esp32_serial_print'] = function (block) {
    let text = pythonGenerator.valueToCode(block, 'TEXT', pythonGenerator.ORDER_ATOMIC) || '""';
    return block.getFieldValue('NEWLINE') === 'PRINTLN' ? 'print(' + text + ')\n' : 'print(' + text + ', end="")\n';
};

pythonGenerator.forBlock['esp32_serial_available'] = function (block) { return ['True', pythonGenerator.ORDER_ATOMIC]; };
pythonGenerator.forBlock['esp32_serial_read'] = function (block) { return ['input()', pythonGenerator.ORDER_ATOMIC]; };

// WiFi
pythonGenerator.forBlock['esp32_wifi_connect'] = function (block) {
    pythonGenerator.imports_['network'] = 'import network';
    pythonGenerator.imports_['time'] = 'import time';
    return 'wlan = network.WLAN(network.STA_IF)\nwlan.active(True)\nwlan.connect("' +
        block.getFieldValue('SSID') + '", "' + block.getFieldValue('PASSWORD') + '")\nwhile not wlan.isconnected(): time.sleep(0.5)\n';
};

pythonGenerator.forBlock['esp32_wifi_status'] = function (block) {
    pythonGenerator.imports_['network'] = 'import network';
    return ['network.WLAN(network.STA_IF).isconnected()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_wifi_ip'] = function (block) {
    pythonGenerator.imports_['network'] = 'import network';
    return ['network.WLAN(network.STA_IF).ifconfig()[0]', pythonGenerator.ORDER_ATOMIC];
};

// LED
pythonGenerator.forBlock['esp32_builtin_led'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return 'Pin(2, Pin.OUT).value(' + (block.getFieldValue('STATE') === 'HIGH' ? '1' : '0') + ')\n';
};

pythonGenerator.forBlock['esp32_led_blink'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    let pin = block.getFieldValue('PIN');
    let delay = pythonGenerator.valueToCode(block, 'DELAY', pythonGenerator.ORDER_ATOMIC) || '500';
    return 'Pin(' + pin + ', Pin.OUT).value(1)\ntime.sleep_ms(' + delay + ')\nPin(' + pin + ', Pin.OUT).value(0)\ntime.sleep_ms(' + delay + ')\n';
};

// Sensors
pythonGenerator.forBlock['esp32_touch_read'] = function (block) {
    pythonGenerator.imports_['touch'] = 'from machine import TouchPad, Pin';
    let gpioMap = { '0': '4', '1': '0', '2': '2', '3': '15', '4': '13', '5': '12', '6': '14', '7': '27', '8': '33', '9': '32' };
    return ['TouchPad(Pin(' + gpioMap[block.getFieldValue('TOUCH_PIN')] + ')).read()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_hall_sensor'] = function (block) {
    pythonGenerator.imports_['esp32'] = 'import esp32';
    return ['esp32.hall_sensor()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_temperature'] = function (block) {
    pythonGenerator.imports_['esp32'] = 'import esp32';
    return ['esp32.raw_temperature()', pythonGenerator.ORDER_ATOMIC];
};

// OLED
pythonGenerator.forBlock['esp32_oled_init'] = function (block) {
    pythonGenerator.imports_['ssd1306'] = 'import ssd1306\nfrom machine import I2C, Pin';
    pythonGenerator.definitions_['oled'] = 'oled = ssd1306.SSD1306_I2C(128, ' + (block.getFieldValue('SIZE') === '128x64' ? '64' : '32') + ', I2C(0, scl=Pin(22), sda=Pin(21)))';
    return 'oled.fill(0)\n';
};

pythonGenerator.forBlock['esp32_oled_clear'] = function (block) { return 'oled.fill(0)\n'; };

pythonGenerator.forBlock['esp32_oled_print'] = function (block) {
    let text = pythonGenerator.valueToCode(block, 'TEXT', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'oled.text(str(' + text + '), ' + block.getFieldValue('X') + ', ' + block.getFieldValue('Y') + ')\n';
};

pythonGenerator.forBlock['esp32_oled_display'] = function (block) { return 'oled.show()\n'; };

// Standard Blocks
pythonGenerator.forBlock['text'] = function (block) { return [pythonGenerator.quote_(block.getFieldValue('TEXT')), pythonGenerator.ORDER_ATOMIC]; };
pythonGenerator.forBlock['custom_text_value'] = function (block) { return [pythonGenerator.quote_(block.getFieldValue('TEXT')), pythonGenerator.ORDER_ATOMIC]; };
pythonGenerator.forBlock['math_number'] = function (block) { return [block.getFieldValue('NUM'), pythonGenerator.ORDER_ATOMIC]; };

pythonGenerator.forBlock['math_arithmetic'] = function (block) {
    let ops = { 'ADD': '+', 'MINUS': '-', 'MULTIPLY': '*', 'DIVIDE': '/', 'POWER': '**' };
    let left = pythonGenerator.valueToCode(block, 'A', pythonGenerator.ORDER_ADDITIVE) || '0';
    let right = pythonGenerator.valueToCode(block, 'B', pythonGenerator.ORDER_ADDITIVE) || '0';
    return [left + ' ' + ops[block.getFieldValue('OP')] + ' ' + right, pythonGenerator.ORDER_ADDITIVE];
};

pythonGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['logic_compare'] = function (block) {
    let ops = { 'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' };
    let left = pythonGenerator.valueToCode(block, 'A', pythonGenerator.ORDER_RELATIONAL) || '0';
    let right = pythonGenerator.valueToCode(block, 'B', pythonGenerator.ORDER_RELATIONAL) || '0';
    return [left + ' ' + ops[block.getFieldValue('OP')] + ' ' + right, pythonGenerator.ORDER_RELATIONAL];
};

pythonGenerator.forBlock['controls_if'] = function (block) {
    let code = '', n = 0;
    do {
        let cond = pythonGenerator.valueToCode(block, 'IF' + n, pythonGenerator.ORDER_NONE) || 'False';
        let branch = pythonGenerator.statementToCode(block, 'DO' + n) || '    pass\n';
        code += (n === 0 ? 'if' : 'elif') + ' ' + cond + ':\n' + branch;
        n++;
    } while (block.getInput('IF' + n));
    if (block.getInput('ELSE')) code += 'else:\n' + (pythonGenerator.statementToCode(block, 'ELSE') || '    pass\n');
    return code;
};

pythonGenerator.forBlock['controls_repeat_ext'] = function (block) {
    let times = pythonGenerator.valueToCode(block, 'TIMES', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'for _ in range(' + times + '):\n' + (pythonGenerator.statementToCode(block, 'DO') || '    pass\n');
};

pythonGenerator.forBlock['controls_whileUntil'] = function (block) {
    let cond = pythonGenerator.valueToCode(block, 'BOOL', pythonGenerator.ORDER_NONE) || 'False';
    if (block.getFieldValue('MODE') === 'UNTIL') cond = 'not (' + cond + ')';
    return 'while ' + cond + ':\n' + (pythonGenerator.statementToCode(block, 'DO') || '    pass\n');
};

// ============================================
// TIMING BLOCKS (Custom)
// ============================================

pythonGenerator.forBlock['custom_wait'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    var delay = pythonGenerator.valueToCode(block, 'DELAY', pythonGenerator.ORDER_ATOMIC) || '0';
    var unit = block.getFieldValue('UNIT');

    if (unit === 'SECONDS') {
        return 'time.sleep(' + delay + ')\n';
    } else if (unit === 'MICROSECONDS') {
        return 'time.sleep_us(' + delay + ')\n';
    } else {
        return 'time.sleep_ms(' + delay + ')\n';
    }
};

pythonGenerator.forBlock['custom_timer'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    var interval = pythonGenerator.valueToCode(block, 'interval', pythonGenerator.ORDER_ATOMIC) || '1000';
    var unit = block.getFieldValue('UNIT');
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    var scale = (unit === 'SECONDS') ? ' * 1000' : '';
    var varName = 'timer_last';

    pythonGenerator.definitions_[varName] = varName + ' = 0';

    var code = 'if time.ticks_diff(time.ticks_ms(), ' + varName + ') > ' + interval + scale + ':\n';
    code += '    ' + varName + ' = time.ticks_ms()\n';
    code += branch;
    return code;
};

pythonGenerator.forBlock['start_timekeeping'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['start_time'] = 'start_time = 0';
    return 'start_time = time.ticks_ms()\n';
};

pythonGenerator.forBlock['get_duration'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    var unit = block.getFieldValue('UNIT');
    if (unit === 'SECONDS') {
        return ['(time.ticks_ms() // 1000)', pythonGenerator.ORDER_ATOMIC];
    }
    return ['time.ticks_ms()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['state_duration'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    var state = block.getFieldValue('STATE');
    var pin = pythonGenerator.valueToCode(block, 'PIN', pythonGenerator.ORDER_ATOMIC) || '0';
    return ['time_pulse_us(Pin(' + pin + ', Pin.IN), ' + (state === 'HIGH' ? '1' : '0') + ')', pythonGenerator.ORDER_ATOMIC];
};

// ============================================
// CONTROL BLOCKS (Custom)
// ============================================

pythonGenerator.forBlock['custom_controls_if'] = function (block) {
    var n = 0;
    var code = '';
    do {
        var conditionCode = pythonGenerator.valueToCode(block, 'IF' + n, pythonGenerator.ORDER_NONE) || 'False';
        var branchCode = pythonGenerator.statementToCode(block, 'DO' + n) || '    pass\n';
        code += (n > 0 ? 'el' : '') + 'if ' + conditionCode + ':\n' + branchCode;
        ++n;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE')) {
        var branchCode = pythonGenerator.statementToCode(block, 'ELSE') || '    pass\n';
        code += 'else:\n' + branchCode;
    }
    return code;
};

pythonGenerator.forBlock['custom_controls_repeat'] = function (block) {
    var repeats = pythonGenerator.valueToCode(block, 'TIMES', pythonGenerator.ORDER_ATOMIC) || '0';
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return 'for _count in range(' + repeats + '):\n' + branch;
};

pythonGenerator.forBlock['custom_controls_whileUntil'] = function (block) {
    var until = block.getFieldValue('MODE') === 'UNTIL';
    var condition = pythonGenerator.valueToCode(block, 'BOOL', pythonGenerator.ORDER_NONE) || 'False';
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    if (until) {
        condition = 'not (' + condition + ')';
    }
    return 'while ' + condition + ':\n' + branch;
};

pythonGenerator.forBlock['custom_controls_for'] = function (block) {
    var variable0 = block.getFieldValue('VAR') || 'i';
    var from = pythonGenerator.valueToCode(block, 'FROM', pythonGenerator.ORDER_ATOMIC) || '0';
    var to = pythonGenerator.valueToCode(block, 'TO', pythonGenerator.ORDER_ATOMIC) || '0';
    var by = pythonGenerator.valueToCode(block, 'BY', pythonGenerator.ORDER_ATOMIC) || '1';
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return 'for ' + variable0 + ' in range(' + from + ', int(' + to + ') + 1, ' + by + '):\n' + branch;
};

pythonGenerator.forBlock['custom_controls_switch'] = function (block) {
    var switchValue = pythonGenerator.valueToCode(block, 'SWITCH_VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var targetValue = pythonGenerator.valueToCode(block, 'CASE_VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return 'if ' + switchValue + ' == ' + targetValue + ':\n' + branch;
};

pythonGenerator.forBlock['custom_flow_statements'] = function (block) {
    switch (block.getFieldValue('FLOW')) {
        case 'BREAK':
            return 'break\n';
        case 'CONTINUE':
            return 'continue\n';
    }
    return 'break\n';
};

pythonGenerator.forBlock['custom_logic_and'] = function (block) {
    var operator = (block.getFieldValue('OP') == 'OR') ? ' or ' : ' and ';
    var order = pythonGenerator.ORDER_ATOMIC;
    var argument0 = pythonGenerator.valueToCode(block, 'A', order) || 'False';
    var argument1 = pythonGenerator.valueToCode(block, 'B', order) || 'False';
    return [argument0 + operator + argument1, order];
};

pythonGenerator.forBlock['custom_logic_not'] = function (block) {
    var argument0 = pythonGenerator.valueToCode(block, 'BOOL', pythonGenerator.ORDER_ATOMIC) || 'True';
    return ['not ' + argument0, pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['custom_logic_null'] = function (block) {
    return ['None', pythonGenerator.ORDER_ATOMIC];
};

// ============================================
// OPERATOR BLOCKS (Custom)
// ============================================

pythonGenerator.forBlock['custom_math_map'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var fromLow = pythonGenerator.valueToCode(block, 'FROM_LOW', pythonGenerator.ORDER_ATOMIC) || '0';
    var fromHigh = pythonGenerator.valueToCode(block, 'FROM_HIGH', pythonGenerator.ORDER_ATOMIC) || '1023';
    var toLow = pythonGenerator.valueToCode(block, 'TO_LOW', pythonGenerator.ORDER_ATOMIC) || '0';
    var toHigh = pythonGenerator.valueToCode(block, 'TO_HIGH', pythonGenerator.ORDER_ATOMIC) || '255';
    pythonGenerator.definitions_['def_map'] = 'def map_value(x, in_min, in_max, out_min, out_max):\n    return (x - in_min) * (out_max - out_min) // (in_max - in_min) + out_min';
    return ['map_value(' + value + ', ' + fromLow + ', ' + fromHigh + ', ' + toLow + ', ' + toHigh + ')', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['custom_math_random_int'] = function (block) {
    pythonGenerator.imports_['random'] = 'import random';
    var from = pythonGenerator.valueToCode(block, 'FROM', pythonGenerator.ORDER_ATOMIC) || '0';
    var to = pythonGenerator.valueToCode(block, 'TO', pythonGenerator.ORDER_ATOMIC) || '100';
    return ['random.randint(' + from + ', ' + to + ')', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['custom_math_constrain'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var low = pythonGenerator.valueToCode(block, 'LOW', pythonGenerator.ORDER_ATOMIC) || '0';
    var high = pythonGenerator.valueToCode(block, 'HIGH', pythonGenerator.ORDER_ATOMIC) || '100';
    return ['max(' + low + ', min(' + value + ', ' + high + '))', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['cast_to_byte'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return ['int(' + value + ') & 0xFF', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['cast_to_unsigned_int'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return ['int(' + value + ') & 0xFFFF', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['cast_to_int'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return ['int(' + value + ')', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['cast_to_float'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return ['float(' + value + ')', pythonGenerator.ORDER_ATOMIC];
};

// ============================================
// EXTRA GPIO BLOCKS
// ============================================

pythonGenerator.forBlock['esp32_digital_state'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = block.getFieldValue('PIN');
    var pullup = block.getFieldValue('PULLUP') === 'TRUE';
    if (pullup) {
        return ['Pin(' + pin + ', Pin.IN, Pin.PULL_UP).value()', pythonGenerator.ORDER_ATOMIC];
    }
    return ['Pin(' + pin + ', Pin.IN).value()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_toggle_pin'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = block.getFieldValue('PIN');
    return 'p = Pin(' + pin + ', Pin.OUT)\np.value(not p.value())\n';
};

pythonGenerator.forBlock['esp32_interrupt'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = block.getFieldValue('PIN');
    var mode = block.getFieldValue('MODE');
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    var modeMap = { 'RISING': 'Pin.IRQ_RISING', 'FALLING': 'Pin.IRQ_FALLING', 'CHANGE': 'Pin.IRQ_RISING | Pin.IRQ_FALLING' };
    var pyMode = modeMap[mode] || 'Pin.IRQ_RISING';
    var funcName = 'isr_pin_' + pin;
    pythonGenerator.definitions_[funcName] = 'def ' + funcName + '(p):\n' + branch;
    return 'Pin(' + pin + ', Pin.IN, Pin.PULL_UP).irq(trigger=' + pyMode + ', handler=' + funcName + ')\n';
};

pythonGenerator.forBlock['esp32_detach_interrupt'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = block.getFieldValue('PIN');
    return 'Pin(' + pin + ', Pin.IN).irq(handler=None)\n';
};

pythonGenerator.forBlock['esp32_restart'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['machine_reset'] = 'from machine import reset';
    return 'reset()\n';
};

pythonGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['machine_deepsleep'] = 'from machine import deepsleep';
    var time = pythonGenerator.valueToCode(block, 'TIME', pythonGenerator.ORDER_ATOMIC) || '1';
    return 'deepsleep(' + time + ' * 1000)\n';
};

console.log('Python generator loaded');
