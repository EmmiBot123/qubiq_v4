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
    var u = block.getFieldValue('UNIT');
    if (u === 'u') return ['(System.currentTimeMillis() * 1000)', javaGenerator.ORDER_ATOMIC];
    if (u === 's') return ['(System.currentTimeMillis() / 1000)', javaGenerator.ORDER_ATOMIC];
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
javaGenerator.forBlock['math_number'] = function (block) {
    return [block.getFieldValue('NUM'), javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['math_arithmetic'] = function (block) {
    var ops = { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/', POWER: null };
    var mode = block.getFieldValue('OP');
    var a = javaGenerator.valueToCode(block, 'A', javaGenerator.ORDER_ADDITIVE) || '0';
    var b = javaGenerator.valueToCode(block, 'B', javaGenerator.ORDER_ADDITIVE) || '0';
    if (mode === 'POWER') return ['Math.pow(' + a + ', ' + b + ')', javaGenerator.ORDER_ATOMIC];
    return [a + ' ' + ops[mode] + ' ' + b, javaGenerator.ORDER_ADDITIVE];
};

javaGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['logic_compare'] = function (block) {
    var ops = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var op = ops[block.getFieldValue('OP')];
    var a = javaGenerator.valueToCode(block, 'A', javaGenerator.ORDER_RELATIONAL) || '0';
    var b = javaGenerator.valueToCode(block, 'B', javaGenerator.ORDER_RELATIONAL) || '0';
    return [a + ' ' + op + ' ' + b, javaGenerator.ORDER_RELATIONAL];
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
    var delay = block.getFieldValue('DELAY') || '0';
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
    var interval = block.getFieldValue('interval') || '1000';
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
    var pin = block.getFieldValue('PIN') || '0';
    return ['pulseIn(' + pin + ', ' + state + ')', javaGenerator.ORDER_ATOMIC];
};

// ============================================
// CONTROL BLOCKS
// ============================================

javaGenerator.forBlock['ifelse'] = javaGenerator.forBlock['controls_if'];
javaGenerator.forBlock['ifandifnot'] = javaGenerator.forBlock['controls_if'];

javaGenerator.forBlock['controls_for'] = function (block) {
    var v = block.getFieldValue('VAR') || 'i';
    var from = javaGenerator.valueToCode(block, 'FROM', javaGenerator.ORDER_ATOMIC) || '0';
    var to = javaGenerator.valueToCode(block, 'TO', javaGenerator.ORDER_ATOMIC) || '0';
    var by = javaGenerator.valueToCode(block, 'BY', javaGenerator.ORDER_ATOMIC) || '1';
    var branch = javaGenerator.statementToCode(block, 'DO');
    return '        for (int ' + v + ' = ' + from + '; ' + v + ' <= ' + to + '; ' + v + ' += ' + by + ') {\n' + branch + '        }\n';
};

javaGenerator.forBlock['controls_forEach'] = function (block) {
    var v = block.getFieldValue('VAR') || 'item';
    var list = javaGenerator.valueToCode(block, 'LIST', javaGenerator.ORDER_ATOMIC) || '{}';
    var branch = javaGenerator.statementToCode(block, 'DO');
    return '        for (var ' + v + ' : ' + list + ') {\n' + branch + '        }\n';
};

javaGenerator.forBlock['controls_switch'] = function (block) {
    var sv = block.getFieldValue('SWVAR') || 'i';
    var arg = javaGenerator.valueToCode(block, 'CASE0', javaGenerator.ORDER_NONE) || '0';
    var branch = javaGenerator.statementToCode(block, 'DO0');
    var code = '        switch (' + sv + ') {\n            case ' + arg + ':\n' + branch + '                break;\n';
    for (var n = 1; n <= (block.casebreakCount_ || 0); n++) {
        arg = javaGenerator.valueToCode(block, 'CASE' + n, javaGenerator.ORDER_NONE) || '0';
        branch = javaGenerator.statementToCode(block, 'DO' + n);
        code += '            case ' + arg + ':\n' + branch + '                break;\n';
    }
    if (block.defaultCount_) {
        branch = javaGenerator.statementToCode(block, 'DEFAULT');
        code += '            default:\n' + branch;
    }
    return code + '        }\n';
};

javaGenerator.forBlock['controls_flow_statements'] = function (block) {
    return block.getFieldValue('FLOW') === 'BREAK' ? '        break;\n' : '        continue;\n';
};

javaGenerator.forBlock['logic_operation'] = function (block) {
    var op = (block.getFieldValue('OP') == 'or') ? ' || ' : ' && ';
    var a = javaGenerator.valueToCode(block, 'A', javaGenerator.ORDER_ATOMIC) || 'false';
    var b = javaGenerator.valueToCode(block, 'B', javaGenerator.ORDER_ATOMIC) || 'false';
    return [a + op + b, javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['logic_negate'] = function (block) {
    return ['!' + (javaGenerator.valueToCode(block, 'BOOL', javaGenerator.ORDER_ATOMIC) || 'true'), javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['logic_null'] = function () { return ['null', javaGenerator.ORDER_ATOMIC]; };

javaGenerator.forBlock['inout_onoff'] = function (block) {
    return [block.getFieldValue('BOOL') == 'HIGH' ? 'HIGH' : 'LOW', javaGenerator.ORDER_ATOMIC];
};
javaGenerator.forBlock['inout_onoff2'] = javaGenerator.forBlock['inout_onoff'];

// ============================================
// OPERATOR BLOCKS
// ============================================

javaGenerator.forBlock['custom_math_map'] = function (block) {
    var v = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var fl = javaGenerator.valueToCode(block, 'FROM_LOW', javaGenerator.ORDER_ATOMIC) || '0';
    var fh = javaGenerator.valueToCode(block, 'FROM_HIGH', javaGenerator.ORDER_ATOMIC) || '1023';
    var tl = javaGenerator.valueToCode(block, 'TO_LOW', javaGenerator.ORDER_ATOMIC) || '0';
    var th = javaGenerator.valueToCode(block, 'TO_HIGH', javaGenerator.ORDER_ATOMIC) || '255';
    return ['(int)((' + v + ' - ' + fl + ') * (' + th + ' - ' + tl + ') / (' + fh + ' - ' + fl + ') + ' + tl + ')', javaGenerator.ORDER_ATOMIC];
};
javaGenerator.forBlock['custom_math_random_int'] = function (block) {
    var f = javaGenerator.valueToCode(block, 'FROM', javaGenerator.ORDER_ATOMIC) || '0';
    var t = javaGenerator.valueToCode(block, 'TO', javaGenerator.ORDER_ATOMIC) || '100';
    return ['(int)(Math.random() * (' + t + ' - ' + f + ' + 1) + ' + f + ')', javaGenerator.ORDER_ATOMIC];
};
javaGenerator.forBlock['custom_math_constrain'] = function (block) {
    var v = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var l = javaGenerator.valueToCode(block, 'LOW', javaGenerator.ORDER_ATOMIC) || '0';
    var h = javaGenerator.valueToCode(block, 'HIGH', javaGenerator.ORDER_ATOMIC) || '100';
    return ['Math.max(' + l + ', Math.min(' + v + ', ' + h + '))', javaGenerator.ORDER_ATOMIC];
};
javaGenerator.forBlock['cast_to_byte'] = function (block) { return ['(byte)(' + (javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0') + ')', javaGenerator.ORDER_ATOMIC]; };
javaGenerator.forBlock['cast_to_unsigned_int'] = function (block) { return ['(int)(' + (javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0') + ') & 0xFFFF', javaGenerator.ORDER_ATOMIC]; };
javaGenerator.forBlock['cast_to_int'] = function (block) { return ['(int)(' + (javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0') + ')', javaGenerator.ORDER_ATOMIC]; };
javaGenerator.forBlock['cast_to_float'] = function (block) { return ['(float)(' + (javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0') + ')', javaGenerator.ORDER_ATOMIC]; };

// ============================================
// EXTRA GPIO BLOCKS
// ============================================

javaGenerator.forBlock['esp32_digital_state'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var pullup = block.getFieldValue('PULLUP') === 'TRUE';
    return [pullup ? 'gpio.digitalRead(' + pin + ', GPIO.INPUT_PULLUP)' : 'gpio.digitalRead(' + pin + ')', javaGenerator.ORDER_ATOMIC];
};
javaGenerator.forBlock['esp32_toggle_pin'] = function (block) {
    var pin = block.getFieldValue('PIN');
    if (!javaGenerator.setupCode_) javaGenerator.setupCode_ = [];
    var s = '        gpio.pinMode(' + pin + ', GPIO.OUTPUT);';
    if (!javaGenerator.setupCode_.includes(s)) javaGenerator.setupCode_.push(s);
    return '        gpio.digitalWrite(' + pin + ', !gpio.digitalRead(' + pin + '));\n';
};
javaGenerator.forBlock['esp32_interrupt'] = function (block) {
    var pin = block.getFieldValue('PIN'), mode = block.getFieldValue('MODE');
    var branch = javaGenerator.statementToCode(block, 'DO');
    return '        attachInterrupt(' + pin + ', () -> {\n' + branch + '        }, GPIO.' + mode + ');\n';
};
javaGenerator.forBlock['esp32_detach_interrupt'] = function (block) {
    return '        detachInterrupt(' + block.getFieldValue('PIN') + ');\n';
};
javaGenerator.forBlock['esp32_restart'] = function () { return '        ESP32.restart();\n'; };
javaGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    var time = block.getFieldValue('TIME') || '1';
    return '        ESP32.deepSleep(' + time + ' * 1000000);\n';
};


javaGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    var time = block.getFieldValue('TIME') || '1';
    return '        ESP32.deepSleep(' + time + ' * 1000000);\n';
};

// ── Buzzer / Audio Blocks (Java) ──────────


javaGenerator.forBlock['buzzer_play_rtttl'] = function (block) {
    var melody = block.getFieldValue('MELODY');
    return '        Buzzer.playRTTTL("' + melody + '");\n';
};

javaGenerator.forBlock['buzzer_play_rtttl_custom'] = function (block) {
    var melody = javaGenerator.valueToCode(block, 'MELODY', javaGenerator.ORDER_ATOMIC) || '"StarWars:d=4,o=5,b=45:32p"';
    return '        Buzzer.playRTTTL(' + melody + ');\n';
};

javaGenerator.forBlock['buzzer_play_note'] = function (block) {
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    return '        Buzzer.tone(' + note + ', ' + tempo + ');\n';
};

javaGenerator.forBlock['buzzer_play_tone'] = function (block) {
    var freq = javaGenerator.valueToCode(block, 'FREQ', javaGenerator.ORDER_ATOMIC) || '880';
    var duration = javaGenerator.valueToCode(block, 'DURATION', javaGenerator.ORDER_ATOMIC) || '100';
    return '        Buzzer.tone(' + freq + ', ' + duration + ');\n';
};

javaGenerator.forBlock['buzzer_stop'] = function (block) {
    return '        Buzzer.noTone();\n';
};

// ── Extended Arduino Hardware Blocks (Java) ──────────


javaGenerator.forBlock['esp32_pulse_in'] = function (block) {
    var pin = javaGenerator.valueToCode(block, 'PIN', javaGenerator.ORDER_ATOMIC) || '2';
    var state = block.getFieldValue('STATE');
    return ['GPIO.pulseIn(' + pin + ', GPIO.' + state + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_millis'] = function (block) {
    var u = block.getFieldValue('UNIT');
    if (u === 'u') return ['(System.currentTimeMillis() * 1000)', javaGenerator.ORDER_ATOMIC];
    if (u === 's') return ['(System.currentTimeMillis() / 1000)', javaGenerator.ORDER_ATOMIC];
    return ['System.currentTimeMillis()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_millis_start'] = function (block) {
    javaGenerator.definitions_['millis_start_field'] = '    private static long _t_start = 0;';
    return '        _t_start = System.currentTimeMillis();\n';
};

javaGenerator.forBlock['esp32_timer_noblocking'] = function (block) {
    var interval = javaGenerator.valueToCode(block, 'INTERVAL', javaGenerator.ORDER_ATOMIC) || '1000';
    var u = block.getFieldValue('UNIT');
    var body = javaGenerator.statementToCode(block, 'DO') || '            ;';
    var mul = (u === 's') ? ' * 1000' : '';
    javaGenerator.imports_['timer'] = 'import java.util.concurrent.*;';
    return '        new ScheduledThreadPoolExecutor(1).scheduleAtFixedRate(() -> {\n' +
        body + '\n        }, 0, ' + interval + mul + ', TimeUnit.MILLISECONDS);\n';
};

javaGenerator.forBlock['esp32_raw_code'] = function (block) {
    return '        ' + block.getFieldValue('CODE') + '\n';
};

javaGenerator.forBlock['esp32_raw_value'] = function (block) {
    return [block.getFieldValue('CODE'), javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_eeprom_write'] = function (block) {
    var val = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var addr = javaGenerator.valueToCode(block, 'ADDRESS', javaGenerator.ORDER_ATOMIC) || '0';
    javaGenerator.imports_['prefs'] = 'import android.content.SharedPreferences;';
    return '        eeprom.edit().putInt("addr_" + ' + addr + ', ' + val + ').apply();\n';
};

javaGenerator.forBlock['esp32_eeprom_read'] = function (block) {
    var addr = javaGenerator.valueToCode(block, 'ADDRESS', javaGenerator.ORDER_ATOMIC) || '0';
    return ['eeprom.getInt("addr_" + ' + addr + ', 0)', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_digital_write_var'] = function (block) {
    var pin = javaGenerator.valueToCode(block, 'PIN', javaGenerator.ORDER_ATOMIC) || '2';
    var state = block.getFieldValue('STATE');
    return '        GPIO.pinMode(' + pin + ', GPIO.OUTPUT);\n' +
        '        GPIO.digitalWrite(' + pin + ', GPIO.' + state + ');\n';
};

javaGenerator.forBlock['esp32_digital_read_var'] = function (block) {
    var pin = javaGenerator.valueToCode(block, 'PIN', javaGenerator.ORDER_ATOMIC) || '2';
    var pullup = block.getFieldValue('PULLUP') === 'TRUE';
    var mode = pullup ? 'GPIO.INPUT_PULLUP' : 'GPIO.INPUT';
    return ['(GPIO.pinMode(' + pin + ', ' + mode + ') == 0 ? GPIO.digitalRead(' + pin + ') : 0)', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_analog_read_temp'] = function (block) {
    var pin = block.getFieldValue('PIN');
    return ['TemperatureSensor.readNTC(' + pin + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_analog_read_ds18b20'] = function (block) {
    var pin = block.getFieldValue('PIN');
    return ['DS18B20.readTemperature(' + pin + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_capacitive_touch'] = function (block) {
    var pin = block.getFieldValue('PIN');
    return ['GPIO.touchRead(' + pin + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['esp32_voice_play'] = function (block) {
    var id = block.getFieldValue('VOICE_ID');
    return '        EmmiVoice.play("' + id + '");\n';
};

javaGenerator.forBlock['esp32_voice_stop'] = function (block) {
    return '        EmmiVoice.stop();\n';
};

// ── Extended Operator Blocks ──────────


javaGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['math_number'] = function (block) {
    return [block.getFieldValue('NUM'), javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['math_arithmetic'] = function (block) {
    var ops = { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/', POWER: null };
    var mode = block.getFieldValue('OP');
    var a = javaGenerator.valueToCode(block, 'A', javaGenerator.ORDER_ADDITIVE) || '0';
    var b = javaGenerator.valueToCode(block, 'B', javaGenerator.ORDER_ADDITIVE) || '0';
    if (mode === 'POWER') return ['Math.pow(' + a + ', ' + b + ')', javaGenerator.ORDER_ATOMIC];
    return [a + ' ' + ops[mode] + ' ' + b, javaGenerator.ORDER_ADDITIVE];
};

javaGenerator.forBlock['logic_compare'] = function (block) {
    var ops = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var op = ops[block.getFieldValue('OP')];
    var a = javaGenerator.valueToCode(block, 'A', javaGenerator.ORDER_RELATIONAL) || '0';
    var b = javaGenerator.valueToCode(block, 'B', javaGenerator.ORDER_RELATIONAL) || '0';
    return [a + ' ' + op + ' ' + b, javaGenerator.ORDER_RELATIONAL];
};

javaGenerator.forBlock['math_single'] = function (block) {
    var op = block.getFieldValue('OP');
    var arg = javaGenerator.valueToCode(block, 'NUM', javaGenerator.ORDER_ATOMIC) || '0';
    switch (op) {
        case 'NEG': return ['-(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'ABS': return ['Math.abs(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'ROOT': return ['Math.sqrt(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'ROUND': return ['(long)Math.round(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'ROUNDUP': return ['(long)Math.ceil(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'ROUNDDOWN': return ['(long)Math.floor(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'SIN': return ['Math.sin(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'COS': return ['Math.cos(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        case 'TAN': return ['Math.tan(' + arg + ')', javaGenerator.ORDER_ATOMIC];
        default: return ['0', javaGenerator.ORDER_ATOMIC];
    }
};
javaGenerator.forBlock['math_trig'] = javaGenerator.forBlock['math_single'];
javaGenerator.forBlock['math_round'] = javaGenerator.forBlock['math_single'];

javaGenerator.forBlock['math_constant'] = function (block) {
    var CONSTANTS = {
        PI: ['Math.PI', javaGenerator.ORDER_ATOMIC],
        E: ['Math.E', javaGenerator.ORDER_ATOMIC],
        GOLDEN_RATIO: ['(1 + Math.sqrt(5)) / 2.0', javaGenerator.ORDER_ADDITIVE],
        SQRT2: ['Math.sqrt(2)', javaGenerator.ORDER_ATOMIC],
        SQRT1_2: ['Math.sqrt(0.5)', javaGenerator.ORDER_ATOMIC],
        INFINITY: ['Double.POSITIVE_INFINITY', javaGenerator.ORDER_ATOMIC]
    };
    return CONSTANTS[block.getFieldValue('CONSTANT')] || ['0', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['math_modulo'] = function (block) {
    var a = javaGenerator.valueToCode(block, 'DIVIDEND', javaGenerator.ORDER_MULTIPLICATIVE) || '0';
    var b = javaGenerator.valueToCode(block, 'DIVISOR', javaGenerator.ORDER_MULTIPLICATIVE) || '1';
    return [a + ' % ' + b, javaGenerator.ORDER_MULTIPLICATIVE];
};

javaGenerator.forBlock['math_random_int'] = function (block) {
    var f = javaGenerator.valueToCode(block, 'FROM', javaGenerator.ORDER_ATOMIC) || '0';
    var t = javaGenerator.valueToCode(block, 'TO', javaGenerator.ORDER_ATOMIC) || '100';
    return ['(int)(Math.random() * (' + t + ' - ' + f + ' + 1) + ' + f + ')', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['math_number_property'] = function (block) {
    var num = javaGenerator.valueToCode(block, 'NUMBER_TO_CHECK', javaGenerator.ORDER_MULTIPLICATIVE) || '0';
    var prop = block.getFieldValue('PROPERTY');
    switch (prop) {
        case 'EVEN': return ['(' + num + ' % 2 == 0)', javaGenerator.ORDER_EQUALITY];
        case 'ODD': return ['(' + num + ' % 2 != 0)', javaGenerator.ORDER_EQUALITY];
        case 'WHOLE': return ['(' + num + ' % 1 == 0)', javaGenerator.ORDER_EQUALITY];
        case 'POSITIVE': return ['(' + num + ' > 0)', javaGenerator.ORDER_RELATIONAL];
        case 'NEGATIVE': return ['(' + num + ' < 0)', javaGenerator.ORDER_RELATIONAL];
        case 'PRIME': return ['isPrime((int)' + num + ')', javaGenerator.ORDER_ATOMIC];
        case 'DIVISIBLE_BY': {
            var div = javaGenerator.valueToCode(block, 'DIVISOR', javaGenerator.ORDER_MULTIPLICATIVE) || '1';
            return ['(' + num + ' % ' + div + ' == 0)', javaGenerator.ORDER_EQUALITY];
        }
        default: return ['false', javaGenerator.ORDER_ATOMIC];
    }
};

javaGenerator.forBlock['intervalle'] = function (block) {
    var OPS = { LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var inf = javaGenerator.valueToCode(block, 'inf', javaGenerator.ORDER_RELATIONAL) || '0';
    var val = javaGenerator.valueToCode(block, 'valeur', javaGenerator.ORDER_RELATIONAL) || '0';
    var sup = javaGenerator.valueToCode(block, 'sup', javaGenerator.ORDER_RELATIONAL) || '0';
    var leftOp = { LT: '>', GT: '<', GTE: '<=', LTE: '>=' }[block.getFieldValue('comp_inf')] || '>';
    var rightOp = OPS[block.getFieldValue('comp_sup')] || '<';
    return ['(' + val + ' ' + leftOp + ' ' + inf + ' && ' + val + ' ' + rightOp + ' ' + sup + ')',
    javaGenerator.ORDER_RELATIONAL];
};

javaGenerator.forBlock['text_join'] = function (block) {
    if (block.itemCount_ === 0) return ['""', javaGenerator.ORDER_ATOMIC];
    var parts = [];
    for (var i = 0; i < block.itemCount_; i++) {
        var arg = javaGenerator.valueToCode(block, 'ADD' + i, javaGenerator.ORDER_ADDITIVE) || '""';
        parts.push('String.valueOf(' + arg + ')');
    }
    return [parts.join(' + '), javaGenerator.ORDER_ADDITIVE];
};

javaGenerator.forBlock['text_length'] = function (block) {
    var arg = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '""';
    return ['String.valueOf(' + arg + ').length()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['text_isEmpty'] = function (block) {
    var arg = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '""';
    return ['String.valueOf(' + arg + ').isEmpty()', javaGenerator.ORDER_ATOMIC];
};

console.log('Java generator loaded');

