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
    var u = block.getFieldValue('UNIT');
    if (u === 'u') return ['time.ticks_us()', pythonGenerator.ORDER_ATOMIC];
    if (u === 's') return ['time.ticks_ms()//1000', pythonGenerator.ORDER_ATOMIC];
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
pythonGenerator.forBlock['math_number'] = function (block) {
    var n = parseFloat(block.getFieldValue('NUM'));
    return [n, n < 0 ? pythonGenerator.ORDER_UNARY_SIGN : pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['math_arithmetic'] = function (block) {
    var ORDERS = {
        ADD: pythonGenerator.ORDER_ADDITIVE, MINUS: pythonGenerator.ORDER_ADDITIVE,
        MULTIPLY: pythonGenerator.ORDER_MULTIPLICATIVE, DIVIDE: pythonGenerator.ORDER_MULTIPLICATIVE,
        POWER: pythonGenerator.ORDER_EXPONENTIATION
    };
    var OPS = { ADD: ' + ', MINUS: ' - ', MULTIPLY: ' * ', DIVIDE: ' / ', POWER: ' ** ' };
    var mode = block.getFieldValue('OP');
    var order = ORDERS[mode] || pythonGenerator.ORDER_NONE;
    var a = pythonGenerator.valueToCode(block, 'A', order) || '0';
    var b = pythonGenerator.valueToCode(block, 'B', order) || '0';
    return [a + OPS[mode] + b, order];
};

pythonGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['logic_compare'] = function (block) {
    var ops = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var op = ops[block.getFieldValue('OP')];
    var a = pythonGenerator.valueToCode(block, 'A', pythonGenerator.ORDER_RELATIONAL) || '0';
    var b = pythonGenerator.valueToCode(block, 'B', pythonGenerator.ORDER_RELATIONAL) || '0';
    return [a + ' ' + op + ' ' + b, pythonGenerator.ORDER_RELATIONAL];
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
    var delay = block.getFieldValue('DELAY') || '0';
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
    var interval = block.getFieldValue('interval') || '1000';
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
    pythonGenerator.imports_['machine'] = 'from machine import Pin, time_pulse_us';
    var state = block.getFieldValue('STATE');
    var pin = block.getFieldValue('PIN') || '0';
    return ['time_pulse_us(Pin(' + pin + ', Pin.IN), ' + (state === 'HIGH' ? '1' : '0') + ')', pythonGenerator.ORDER_ATOMIC];
};

// ============================================
// CONTROL BLOCKS
// ============================================

pythonGenerator.forBlock['ifelse'] = pythonGenerator.forBlock['controls_if'];
pythonGenerator.forBlock['ifandifnot'] = pythonGenerator.forBlock['controls_if'];

pythonGenerator.forBlock['controls_for'] = function (block) {
    var v = block.getFieldValue('VAR') || 'i';
    var from = pythonGenerator.valueToCode(block, 'FROM', pythonGenerator.ORDER_ATOMIC) || '0';
    var to = pythonGenerator.valueToCode(block, 'TO', pythonGenerator.ORDER_ATOMIC) || '0';
    var by = pythonGenerator.valueToCode(block, 'BY', pythonGenerator.ORDER_ATOMIC) || '1';
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return 'for ' + v + ' in range(' + from + ', int(' + to + ') + 1, ' + by + '):\n' + branch;
};

pythonGenerator.forBlock['controls_forEach'] = function (block) {
    var v = block.getFieldValue('VAR') || 'item';
    var list = pythonGenerator.valueToCode(block, 'LIST', pythonGenerator.ORDER_ATOMIC) || '[]';
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    return 'for ' + v + ' in ' + list + ':\n' + branch;
};

pythonGenerator.forBlock['controls_switch'] = function (block) {
    var sv = block.getFieldValue('SWVAR') || 'i';
    var arg = pythonGenerator.valueToCode(block, 'CASE0', pythonGenerator.ORDER_NONE) || '0';
    var branch = pythonGenerator.statementToCode(block, 'DO0') || '    pass\n';
    var code = 'if ' + sv + ' == ' + arg + ':\n' + branch;
    for (var n = 1; n <= (block.casebreakCount_ || 0); n++) {
        arg = pythonGenerator.valueToCode(block, 'CASE' + n, pythonGenerator.ORDER_NONE) || '0';
        branch = pythonGenerator.statementToCode(block, 'DO' + n) || '    pass\n';
        code += 'elif ' + sv + ' == ' + arg + ':\n' + branch;
    }
    if (block.defaultCount_) {
        branch = pythonGenerator.statementToCode(block, 'DEFAULT') || '    pass\n';
        code += 'else:\n' + branch;
    }
    return code;
};

pythonGenerator.forBlock['controls_flow_statements'] = function (block) {
    return block.getFieldValue('FLOW') === 'BREAK' ? 'break\n' : 'continue\n';
};

pythonGenerator.forBlock['logic_operation'] = function (block) {
    var op = (block.getFieldValue('OP') == 'or') ? ' or ' : ' and ';
    var a = pythonGenerator.valueToCode(block, 'A', pythonGenerator.ORDER_ATOMIC) || 'False';
    var b = pythonGenerator.valueToCode(block, 'B', pythonGenerator.ORDER_ATOMIC) || 'False';
    return [a + op + b, pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['logic_negate'] = function (block) {
    return ['not ' + (pythonGenerator.valueToCode(block, 'BOOL', pythonGenerator.ORDER_ATOMIC) || 'True'), pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['logic_null'] = function () { return ['None', pythonGenerator.ORDER_ATOMIC]; };

pythonGenerator.forBlock['inout_onoff'] = function (block) {
    return [block.getFieldValue('BOOL') == 'HIGH' ? '1' : '0', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['inout_onoff2'] = pythonGenerator.forBlock['inout_onoff'];

// ============================================
// OPERATOR BLOCKS
// ============================================

pythonGenerator.forBlock['custom_math_map'] = function (block) {
    var v = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var fl = pythonGenerator.valueToCode(block, 'FROM_LOW', pythonGenerator.ORDER_ATOMIC) || '0';
    var fh = pythonGenerator.valueToCode(block, 'FROM_HIGH', pythonGenerator.ORDER_ATOMIC) || '1023';
    var tl = pythonGenerator.valueToCode(block, 'TO_LOW', pythonGenerator.ORDER_ATOMIC) || '0';
    var th = pythonGenerator.valueToCode(block, 'TO_HIGH', pythonGenerator.ORDER_ATOMIC) || '255';
    pythonGenerator.definitions_['def_map'] = 'def map_value(x, in_min, in_max, out_min, out_max):\n    return (x - in_min) * (out_max - out_min) // (in_max - in_min) + out_min';
    return ['map_value(' + v + ', ' + fl + ', ' + fh + ', ' + tl + ', ' + th + ')', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['custom_math_random_int'] = function (block) {
    pythonGenerator.imports_['random'] = 'import random';
    var f = pythonGenerator.valueToCode(block, 'FROM', pythonGenerator.ORDER_ATOMIC) || '0';
    var t = pythonGenerator.valueToCode(block, 'TO', pythonGenerator.ORDER_ATOMIC) || '100';
    return ['random.randint(' + f + ', ' + t + ')', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['custom_math_constrain'] = function (block) {
    var v = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var l = pythonGenerator.valueToCode(block, 'LOW', pythonGenerator.ORDER_ATOMIC) || '0';
    var h = pythonGenerator.valueToCode(block, 'HIGH', pythonGenerator.ORDER_ATOMIC) || '100';
    return ['max(' + l + ', min(' + v + ', ' + h + '))', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['cast_to_byte'] = function (block) {
    return ['int(' + (pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0') + ') & 0xFF', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['cast_to_unsigned_int'] = function (block) {
    return ['int(' + (pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0') + ') & 0xFFFF', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['cast_to_int'] = function (block) {
    return ['int(' + (pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0') + ')', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['cast_to_float'] = function (block) {
    return ['float(' + (pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0') + ')', pythonGenerator.ORDER_ATOMIC];
};

// ============================================
// EXTRA GPIO BLOCKS
// ============================================

pythonGenerator.forBlock['esp32_digital_state'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = block.getFieldValue('PIN');
    var pullup = block.getFieldValue('PULLUP') === 'TRUE';
    return [pullup ? 'Pin(' + pin + ', Pin.IN, Pin.PULL_UP).value()' : 'Pin(' + pin + ', Pin.IN).value()', pythonGenerator.ORDER_ATOMIC];
};
pythonGenerator.forBlock['esp32_toggle_pin'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = block.getFieldValue('PIN');
    return 'p = Pin(' + pin + ', Pin.OUT)\np.value(not p.value())\n';
};
pythonGenerator.forBlock['esp32_interrupt'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = block.getFieldValue('PIN'), mode = block.getFieldValue('MODE');
    var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    var modeMap = { 'RISING': 'Pin.IRQ_RISING', 'FALLING': 'Pin.IRQ_FALLING', 'CHANGE': 'Pin.IRQ_RISING | Pin.IRQ_FALLING' };
    var funcName = 'isr_pin_' + pin;
    pythonGenerator.definitions_[funcName] = 'def ' + funcName + '(p):\n' + branch;
    return 'Pin(' + pin + ', Pin.IN, Pin.PULL_UP).irq(trigger=' + (modeMap[mode] || 'Pin.IRQ_RISING') + ', handler=' + funcName + ')\n';
};
pythonGenerator.forBlock['esp32_detach_interrupt'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return 'Pin(' + block.getFieldValue('PIN') + ', Pin.IN).irq(handler=None)\n';
};
pythonGenerator.forBlock['esp32_restart'] = function () {
    pythonGenerator.imports_['machine_reset'] = 'from machine import reset';
    return 'reset()\n';
};
pythonGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    pythonGenerator.imports_['machine_deepsleep'] = 'from machine import deepsleep';
    var time = block.getFieldValue('TIME') || '1';
    return 'deepsleep(' + time + ' * 1000)\n';
};

pythonGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    pythonGenerator.imports_['machine_deepsleep'] = 'from machine import deepsleep';
    var time = block.getFieldValue('TIME') || '1';
    return 'deepsleep(' + time + ' * 1000)\n';
};

// ── Buzzer / Audio Blocks (Python/MicroPython) ──────────


pythonGenerator.forBlock['buzzer_play_rtttl'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = block.getFieldValue('MELODY');
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    // MicroPython: no PlayRtttl lib, output a comment + simple beep
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '# Play RTTTL melody: ' + melody + '\n_buz' + pinNum + '.freq(440)\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(200)\n_buz' + pinNum + '.duty(0)\n';
};

pythonGenerator.forBlock['buzzer_play_rtttl_custom'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = pythonGenerator.valueToCode(block, 'MELODY', pythonGenerator.ORDER_ATOMIC) || '"custom"';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '# Play custom RTTTL: ' + melody + '\n_buz' + pinNum + '.freq(440)\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(200)\n_buz' + pinNum + '.duty(0)\n';
};

pythonGenerator.forBlock['buzzer_play_note'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var note = block.getFieldValue('NOTE');    // frequency value e.g. "440"
    var tempo = block.getFieldValue('TEMPO');   // duration in ms e.g. "250"
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '_buz' + pinNum + '.freq(' + note + ')\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(' + tempo + ')\n_buz' + pinNum + '.duty(0)\n';
};

pythonGenerator.forBlock['buzzer_play_tone'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var freq = pythonGenerator.valueToCode(block, 'FREQ', pythonGenerator.ORDER_ATOMIC) || '880';
    var duration = pythonGenerator.valueToCode(block, 'DURATION', pythonGenerator.ORDER_ATOMIC) || '100';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '_buz' + pinNum + '.freq(' + freq + ')\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(' + duration + ')\n_buz' + pinNum + '.duty(0)\n';
};

pythonGenerator.forBlock['buzzer_stop'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return '_buz' + pinNum + '.duty(0)\n';
};

// ── Extended Arduino Hardware Blocks (Python/MicroPython) ──────────


pythonGenerator.forBlock['esp32_pulse_in'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    var pin = pythonGenerator.valueToCode(block, 'PIN', pythonGenerator.ORDER_ATOMIC) || '2';
    var state = block.getFieldValue('STATE') === 'HIGH' ? '1' : '0';
    pythonGenerator.definitions_['pulse_pin_' + pin] = '_pp' + pin + ' = Pin(' + pin + ', Pin.IN)';
    return ['time.time_pulse_us(_pp' + pin + ', ' + state + ')', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_millis'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    var u = block.getFieldValue('UNIT');
    if (u === 'u') return ['time.ticks_us()', pythonGenerator.ORDER_ATOMIC];
    if (u === 's') return ['time.ticks_ms()//1000', pythonGenerator.ORDER_ATOMIC];
    return ['time.ticks_ms()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_millis_start'] = function (block) {
    pythonGenerator.imports_['time'] = 'import time';
    var u = block.getFieldValue('UNIT');
    var fn = (u === 'u') ? 'time.ticks_us()' : 'time.ticks_ms()';
    return '_t_start = ' + fn + '\n';
};

pythonGenerator.forBlock['esp32_timer_noblocking'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Timer';
    var interval = pythonGenerator.valueToCode(block, 'INTERVAL', pythonGenerator.ORDER_ATOMIC) || '1000';
    var u = block.getFieldValue('UNIT');
    var body = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
    var mul = (u === 's') ? '*1000' : '';
    var fn = '_timer_cb';
    pythonGenerator.definitions_[fn] = 'def ' + fn + '(t):\n' + body;
    return '_timer = Timer(-1)\n_timer.init(period=' + interval + mul + ', mode=Timer.PERIODIC, callback=' + fn + ')\n';
};

pythonGenerator.forBlock['esp32_raw_code'] = function (block) {
    return block.getFieldValue('CODE') + '\n';
};

pythonGenerator.forBlock['esp32_raw_value'] = function (block) {
    return [block.getFieldValue('CODE'), pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_eeprom_write'] = function (block) {
    pythonGenerator.imports_['nvs_flash'] = 'import nvs';
    var val = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var addr = pythonGenerator.valueToCode(block, 'ADDRESS', pythonGenerator.ORDER_ATOMIC) || '0';
    // MicroPython EEPROM emulation via file
    return '# EEPROM write: addr=' + addr + ', val=' + val + '\n' +
        'with open("eeprom.bin", "rb+") as _ef:\n' +
        '    _ef.seek(' + addr + ')\n' +
        '    _ef.write(bytes([' + val + ' & 0xFF]))\n';
};

pythonGenerator.forBlock['esp32_eeprom_read'] = function (block) {
    var addr = pythonGenerator.valueToCode(block, 'ADDRESS', pythonGenerator.ORDER_ATOMIC) || '0';
    return ['([b for b in open("eeprom.bin","rb").read()[' + addr + ':' + addr + '+1]] or [0])[0]', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_digital_write_var'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = pythonGenerator.valueToCode(block, 'PIN', pythonGenerator.ORDER_ATOMIC) || '2';
    var state = block.getFieldValue('STATE') === 'HIGH' ? '1' : '0';
    return 'Pin(' + pin + ', Pin.OUT).value(' + state + ')\n';
};

pythonGenerator.forBlock['esp32_digital_read_var'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pin = pythonGenerator.valueToCode(block, 'PIN', pythonGenerator.ORDER_ATOMIC) || '2';
    var pullup = block.getFieldValue('PULLUP') === 'TRUE';
    return [pullup ? 'Pin(' + pin + ', Pin.IN, Pin.PULL_UP).value()' : 'Pin(' + pin + ', Pin.IN).value()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_analog_read_temp'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['math'] = 'import math';
    var pin = block.getFieldValue('PIN');
    pythonGenerator.definitions_['ntc_adc_' + pin] = '_ntc_adc' + pin + ' = ADC(Pin(' + pin + '))\n_ntc_adc' + pin + '.atten(ADC.ATTN_11DB)';
    var code = '(lambda r: 1/(math.log(r/10000)/3950+1/298.15)-273.15)(' +
        '10000*(4095/_ntc_adc' + pin + '.read()-1))';
    return [code, pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_analog_read_ds18b20'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['onewire'] = 'import onewire';
    pythonGenerator.imports_['ds18x20'] = 'import ds18x20';
    var pin = block.getFieldValue('PIN');
    pythonGenerator.definitions_['ds18_' + pin] =
        '_ds_ow' + pin + ' = onewire.OneWire(Pin(' + pin + '))\n' +
        '_ds' + pin + ' = ds18x20.DS18X20(_ds_ow' + pin + ')\n' +
        '_ds_rom' + pin + ' = _ds' + pin + '.scan()[0]';
    return ['(_ds' + pin + '.convert_temp() or _ds' + pin + '.read_temp(_ds_rom' + pin + '))', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_capacitive_touch'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import TouchPad, Pin';
    var pin = block.getFieldValue('PIN');
    pythonGenerator.definitions_['touch_' + pin] = '_tp' + pin + ' = TouchPad(Pin(' + pin + '))';
    return ['_tp' + pin + '.read()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['esp32_voice_play'] = function (block) {
    var id = block.getFieldValue('VOICE_ID');
    return '# play voice: ' + id + '\n';
};

pythonGenerator.forBlock['esp32_voice_stop'] = function (block) {
    return '# stop voice\n';
};

// ── Extended Operator Blocks ──────────


pythonGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['math_number'] = function (block) {
    var n = parseFloat(block.getFieldValue('NUM'));
    return [n, n < 0 ? pythonGenerator.ORDER_UNARY_SIGN : pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['math_arithmetic'] = function (block) {
    var ORDERS = {
        ADD: pythonGenerator.ORDER_ADDITIVE, MINUS: pythonGenerator.ORDER_ADDITIVE,
        MULTIPLY: pythonGenerator.ORDER_MULTIPLICATIVE, DIVIDE: pythonGenerator.ORDER_MULTIPLICATIVE,
        POWER: pythonGenerator.ORDER_EXPONENTIATION
    };
    var OPS = { ADD: ' + ', MINUS: ' - ', MULTIPLY: ' * ', DIVIDE: ' / ', POWER: ' ** ' };
    var mode = block.getFieldValue('OP');
    var order = ORDERS[mode] || pythonGenerator.ORDER_NONE;
    var a = pythonGenerator.valueToCode(block, 'A', order) || '0';
    var b = pythonGenerator.valueToCode(block, 'B', order) || '0';
    return [a + OPS[mode] + b, order];
};

pythonGenerator.forBlock['logic_compare'] = function (block) {
    var ops = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var op = ops[block.getFieldValue('OP')];
    var a = pythonGenerator.valueToCode(block, 'A', pythonGenerator.ORDER_RELATIONAL) || '0';
    var b = pythonGenerator.valueToCode(block, 'B', pythonGenerator.ORDER_RELATIONAL) || '0';
    return [a + ' ' + op + ' ' + b, pythonGenerator.ORDER_RELATIONAL];
};

pythonGenerator.forBlock['math_single'] = function (block) {
    pythonGenerator.imports_['math'] = 'import math';
    var op = block.getFieldValue('OP');
    var arg = pythonGenerator.valueToCode(block, 'NUM', pythonGenerator.ORDER_NONE) || '0';
    switch (op) {
        case 'NEG': return ['-(' + arg + ')', pythonGenerator.ORDER_UNARY_SIGN];
        case 'ABS': return ['abs(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'ROOT': return ['math.sqrt(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'ROUND': return ['round(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'ROUNDUP': return ['math.ceil(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'ROUNDDOWN': return ['math.floor(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'SIN': return ['math.sin(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'COS': return ['math.cos(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'TAN': return ['math.tan(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        default: return ['0', pythonGenerator.ORDER_ATOMIC];
    }
};
pythonGenerator.forBlock['math_trig'] = pythonGenerator.forBlock['math_single'];
pythonGenerator.forBlock['math_round'] = pythonGenerator.forBlock['math_single'];

pythonGenerator.forBlock['math_constant'] = function (block) {
    pythonGenerator.imports_['math'] = 'import math';
    var CONSTANTS = {
        PI: ['math.pi', pythonGenerator.ORDER_MEMBER],
        E: ['math.e', pythonGenerator.ORDER_MEMBER],
        GOLDEN_RATIO: ['(1 + math.sqrt(5)) / 2', pythonGenerator.ORDER_MULTIPLICATIVE],
        SQRT2: ['math.sqrt(2)', pythonGenerator.ORDER_FUNCTION_CALL],
        SQRT1_2: ['math.sqrt(0.5)', pythonGenerator.ORDER_FUNCTION_CALL],
        INFINITY: ['float("inf")', pythonGenerator.ORDER_ATOMIC]
    };
    return CONSTANTS[block.getFieldValue('CONSTANT')] || ['0', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['math_modulo'] = function (block) {
    var a = pythonGenerator.valueToCode(block, 'DIVIDEND', pythonGenerator.ORDER_MULTIPLICATIVE) || '0';
    var b = pythonGenerator.valueToCode(block, 'DIVISOR', pythonGenerator.ORDER_MULTIPLICATIVE) || '1';
    return [a + ' % ' + b, pythonGenerator.ORDER_MULTIPLICATIVE];
};

pythonGenerator.forBlock['math_random_int'] = function (block) {
    pythonGenerator.imports_['random'] = 'import random';
    var from = pythonGenerator.valueToCode(block, 'FROM', pythonGenerator.ORDER_NONE) || '0';
    var to = pythonGenerator.valueToCode(block, 'TO', pythonGenerator.ORDER_NONE) || '100';
    return ['random.randint(' + from + ', ' + to + ')', pythonGenerator.ORDER_FUNCTION_CALL];
};

pythonGenerator.forBlock['math_number_property'] = function (block) {
    var num = pythonGenerator.valueToCode(block, 'NUMBER_TO_CHECK', pythonGenerator.ORDER_MULTIPLICATIVE) || '0';
    var prop = block.getFieldValue('PROPERTY');
    switch (prop) {
        case 'EVEN': return ['(' + num + ' % 2 == 0)', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'ODD': return ['(' + num + ' % 2 != 0)', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'WHOLE': return ['(' + num + ' % 1 == 0)', pythonGenerator.ORDER_FUNCTION_CALL];
        case 'POSITIVE': return ['(' + num + ' > 0)', pythonGenerator.ORDER_RELATIONAL];
        case 'NEGATIVE': return ['(' + num + ' < 0)', pythonGenerator.ORDER_RELATIONAL];
        case 'PRIME': {
            pythonGenerator.definitions_['math_isPrime'] =
                'def _is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(n**0.5)+1):\n        if n % i == 0: return False\n    return True\n';
            return ['_is_prime(' + num + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        }
        case 'DIVISIBLE_BY': {
            var div = pythonGenerator.valueToCode(block, 'DIVISOR', pythonGenerator.ORDER_MULTIPLICATIVE) || '1';
            return ['(' + num + ' % ' + div + ' == 0)', pythonGenerator.ORDER_FUNCTION_CALL];
        }
        default: return ['False', pythonGenerator.ORDER_ATOMIC];
    }
};

pythonGenerator.forBlock['intervalle'] = function (block) {
    var OPS = { LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var inf = pythonGenerator.valueToCode(block, 'inf', pythonGenerator.ORDER_RELATIONAL) || '0';
    var val = pythonGenerator.valueToCode(block, 'valeur', pythonGenerator.ORDER_RELATIONAL) || '0';
    var sup = pythonGenerator.valueToCode(block, 'sup', pythonGenerator.ORDER_RELATIONAL) || '0';
    var leftOp = { LT: '>', GT: '<', GTE: '<=', LTE: '>=' }[block.getFieldValue('comp_inf')] || '>';
    var rightOp = OPS[block.getFieldValue('comp_sup')] || '<';
    return ['(' + inf + ' ' + leftOp + ' ' + val + ' ' + rightOp + ' ' + sup + ')',
    pythonGenerator.ORDER_RELATIONAL];
};

pythonGenerator.forBlock['text_join'] = function (block) {
    if (block.itemCount_ === 0) return ['""', pythonGenerator.ORDER_ATOMIC];
    var parts = [];
    for (var i = 0; i < block.itemCount_; i++) {
        var arg = pythonGenerator.valueToCode(block, 'ADD' + i, pythonGenerator.ORDER_NONE) || '""';
        parts.push('str(' + arg + ')');
    }
    return [parts.join(' + '), pythonGenerator.ORDER_ADDITIVE];
};

pythonGenerator.forBlock['text_length'] = function (block) {
    var arg = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '""';
    return ['len(' + arg + ')', pythonGenerator.ORDER_FUNCTION_CALL];
};

pythonGenerator.forBlock['text_isEmpty'] = function (block) {
    var arg = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '""';
    return ['(len(' + arg + ') == 0)', pythonGenerator.ORDER_FUNCTION_CALL];
};

console.log('Python generator loaded');



