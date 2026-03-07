/**
 * Arduino C++ Code Generator for ESP32 Blocks
 */

// Create Arduino generator
const arduinoGenerator = new Blockly.Generator('Arduino');

// Set operator precedence
arduinoGenerator.ORDER_ATOMIC = 0;
arduinoGenerator.ORDER_UNARY = 1;
arduinoGenerator.ORDER_MULTIPLICATIVE = 2;
arduinoGenerator.ORDER_ADDITIVE = 3;
arduinoGenerator.ORDER_RELATIONAL = 4;
arduinoGenerator.ORDER_EQUALITY = 5;
arduinoGenerator.ORDER_LOGICAL_AND = 6;
arduinoGenerator.ORDER_LOGICAL_OR = 7;
arduinoGenerator.ORDER_NONE = 99;

// Store includes and setup code
arduinoGenerator.includes_ = {};
arduinoGenerator.setupCode_ = [];
arduinoGenerator.variables_ = {};

// Initialize generator
arduinoGenerator.init = function (workspace) {
    this.includes_ = {};
    this.setupCode_ = [];
    this.variables_ = {};
};

// Finalize and generate complete code
arduinoGenerator.finish = function (code) {
    // Build includes
    let includes = '';
    for (let key in this.includes_) {
        includes += this.includes_[key] + '\n';
    }

    // Build variable declarations
    let variables = '';
    for (let key in this.variables_) {
        variables += this.variables_[key] + '\n';
    }

    // Build setup code
    let setupCode = this.setupCode_.join('\n  ');

    // Combine all parts
    let fullCode = '';
    if (includes) {
        fullCode += includes + '\n';
    }
    if (variables) {
        fullCode += variables + '\n';
    }

    return fullCode + code;
};

// Scrub naked value
arduinoGenerator.scrubNakedValue = function (line) {
    return line + ';\n';
};

// Quote text
arduinoGenerator.quote_ = function (text) {
    return '"' + text.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
};

// Common traverse for all blocks
arduinoGenerator.scrub_ = function (block, code) {
    var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    var nextCode = arduinoGenerator.blockToCode(nextBlock);
    return code + nextCode;
};

// ============================================
// BASE SETUP/LOOP BLOCK (from Qubiq AI)
// ============================================

arduinoGenerator.forBlock['base_setup_loop'] = function (block) {
    var setupCode = arduinoGenerator.statementToCode(block, "SETUP");
    var loopCode = arduinoGenerator.statementToCode(block, "LOOP");

    // Generate the full Arduino program
    var code = '';

    // Add includes
    if (arduinoGenerator.includes_) {
        for (var key in arduinoGenerator.includes_) {
            code += arduinoGenerator.includes_[key] + '\n';
        }
        if (Object.keys(arduinoGenerator.includes_).length > 0) {
            code += '\n';
        }
    }

    // Add variables
    if (arduinoGenerator.variables_) {
        for (var key in arduinoGenerator.variables_) {
            code += arduinoGenerator.variables_[key] + '\n';
        }
        if (Object.keys(arduinoGenerator.variables_).length > 0) {
            code += '\n';
        }
    }

    // Add setup function
    code += 'void setup() {\n';
    if (Array.isArray(arduinoGenerator.setupCode_) && arduinoGenerator.setupCode_.length > 0) {
        const setupLines = Array.from(new Set(arduinoGenerator.setupCode_));
        setupLines.forEach(line => {
            code += '  ' + String(line).trim() + '\n';
        });
    }
    if (setupCode) {
        code += setupCode;
    }
    code += '}\n\n';

    // Add loop function
    code += 'void loop() {\n';
    if (loopCode) {
        code += loopCode;
    }
    code += '}\n';

    return code;
};

// ============================================
// BLOCK GENERATORS
// ============================================

// Setup block
arduinoGenerator.forBlock['esp32_setup'] = function (block) {
    let statements = arduinoGenerator.statementToCode(block, 'SETUP_CODE');
    return 'void setup() {\n' + statements + '}\n\n';
};

// Loop block
arduinoGenerator.forBlock['esp32_loop'] = function (block) {
    let statements = arduinoGenerator.statementToCode(block, 'LOOP_CODE');
    return 'void loop() {\n' + statements + '}\n\n';
};

// Pin mode
arduinoGenerator.forBlock['esp32_pin_mode'] = function (block) {
    let pin = block.getFieldValue('PIN');
    let mode = block.getFieldValue('MODE');
    return '  pinMode(' + pin + ', ' + mode + ');\n';
};

// Digital write
arduinoGenerator.forBlock['esp32_digital_write'] = function (block) {
    let pin = block.getFieldValue('PIN');
    let state = block.getFieldValue('STATE');
    arduinoGenerator.setupCode_.push('pinMode(' + pin + ', OUTPUT);');
    return '  digitalWrite(' + pin + ', ' + state + ');\n';
};

// Digital state (Read with optional pull-up)
arduinoGenerator.forBlock['esp32_digital_state'] = function (block) {
    let pin = block.getFieldValue('PIN');
    let pullup = block.getFieldValue('PULLUP') === 'TRUE';
    if (pullup) {
        arduinoGenerator.setupCode_.push('pinMode(' + pin + ', INPUT_PULLUP);');
    } else {
        arduinoGenerator.setupCode_.push('pinMode(' + pin + ', INPUT);');
    }
    return ['digitalRead(' + pin + ')', arduinoGenerator.ORDER_ATOMIC];
};

// Digital read
arduinoGenerator.forBlock['esp32_digital_read'] = function (block) {
    let pin = block.getFieldValue('PIN');
    arduinoGenerator.setupCode_.push('pinMode(' + pin + ', INPUT);');
    return ['digitalRead(' + pin + ')', arduinoGenerator.ORDER_ATOMIC];
};

// Analog read
arduinoGenerator.forBlock['esp32_analog_read'] = function (block) {
    let pin = block.getFieldValue('PIN');
    return ['analogRead(' + pin + ')', arduinoGenerator.ORDER_ATOMIC];
};

// Analog write (PWM)
arduinoGenerator.forBlock['esp32_analog_write'] = function (block) {
    let pin = block.getFieldValue('PIN');
    let value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    arduinoGenerator.includes_['ledc'] = '// Using LEDC for PWM';
    return '  analogWrite(' + pin + ', ' + value + ');\n';
};

// Delay milliseconds
arduinoGenerator.forBlock['esp32_delay'] = function (block) {
    let time = arduinoGenerator.valueToCode(block, 'TIME', arduinoGenerator.ORDER_ATOMIC) || '1000';
    return '  delay(' + time + ');\n';
};

// Delay seconds
arduinoGenerator.forBlock['esp32_delay_seconds'] = function (block) {
    let time = arduinoGenerator.valueToCode(block, 'TIME', arduinoGenerator.ORDER_ATOMIC) || '1';
    return '  delay(' + time + ' * 1000);\n';
};

// Millis
arduinoGenerator.forBlock['esp32_millis'] = function (block) {
    var u = block.getFieldValue('UNIT');
    if (u === 'u') return ['micros()', arduinoGenerator.ORDER_ATOMIC];
    if (u === 's') return ['millis()/1000', arduinoGenerator.ORDER_ATOMIC];
    return ['millis()', arduinoGenerator.ORDER_ATOMIC];
};

// Serial begin
arduinoGenerator.forBlock['esp32_serial_begin'] = function (block) {
    let baud = block.getFieldValue('BAUD');
    return '  Serial.begin(' + baud + ');\n';
};

// Serial print
arduinoGenerator.forBlock['esp32_serial_print'] = function (block) {
    let text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.ORDER_ATOMIC) || '""';
    let newline = block.getFieldValue('NEWLINE');
    if (newline === 'PRINTLN') {
        return '  Serial.println(' + text + ');\n';
    } else {
        return '  Serial.print(' + text + ');\n';
    }
};

// Serial available
arduinoGenerator.forBlock['esp32_serial_available'] = function (block) {
    return ['Serial.available() > 0', arduinoGenerator.ORDER_RELATIONAL];
};

// Serial read
arduinoGenerator.forBlock['esp32_serial_read'] = function (block) {
    return ['Serial.readString()', arduinoGenerator.ORDER_ATOMIC];
};

// WiFi connect
arduinoGenerator.forBlock['esp32_wifi_connect'] = function (block) {
    let ssid = block.getFieldValue('SSID');
    let password = block.getFieldValue('PASSWORD');
    arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';
    return '  WiFi.begin("' + ssid + '", "' + password + '");\n' +
        '  while (WiFi.status() != WL_CONNECTED) {\n' +
        '    delay(500);\n' +
        '    Serial.print(".");\n' +
        '  }\n' +
        '  Serial.println("\\nWiFi connected!");\n';
};

// WiFi status
arduinoGenerator.forBlock['esp32_wifi_status'] = function (block) {
    arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';
    return ['WiFi.status() == WL_CONNECTED', arduinoGenerator.ORDER_EQUALITY];
};

// WiFi IP
arduinoGenerator.forBlock['esp32_wifi_ip'] = function (block) {
    arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';
    return ['WiFi.localIP().toString()', arduinoGenerator.ORDER_ATOMIC];
};

// Built-in LED
arduinoGenerator.forBlock['esp32_builtin_led'] = function (block) {
    let state = block.getFieldValue('STATE');
    arduinoGenerator.setupCode_.push('pinMode(2, OUTPUT);');
    return '  digitalWrite(2, ' + state + ');\n';
};

// LED blink
arduinoGenerator.forBlock['esp32_led_blink'] = function (block) {
    let pin = block.getFieldValue('PIN');
    let delay = arduinoGenerator.valueToCode(block, 'DELAY', arduinoGenerator.ORDER_ATOMIC) || '500';
    arduinoGenerator.setupCode_.push('pinMode(' + pin + ', OUTPUT);');
    return '  digitalWrite(' + pin + ', HIGH);\n' +
        '  delay(' + delay + ');\n' +
        '  digitalWrite(' + pin + ', LOW);\n' +
        '  delay(' + delay + ');\n';
};

// Touch read
arduinoGenerator.forBlock['esp32_touch_read'] = function (block) {
    let pin = block.getFieldValue('TOUCH_PIN');
    return ['touchRead(T' + pin + ')', arduinoGenerator.ORDER_ATOMIC];
};

// Hall sensor
arduinoGenerator.forBlock['esp32_hall_sensor'] = function (block) {
    return ['hallRead()', arduinoGenerator.ORDER_ATOMIC];
};

// Temperature
arduinoGenerator.forBlock['esp32_temperature'] = function (block) {
    return ['temperatureRead()', arduinoGenerator.ORDER_ATOMIC];
};

// OLED init
arduinoGenerator.forBlock['esp32_oled_init'] = function (block) {
    let size = block.getFieldValue('SIZE');
    let height = size === '128x64' ? '64' : '32';
    arduinoGenerator.includes_['wire'] = '#include <Wire.h>';
    arduinoGenerator.includes_['adafruit_gfx'] = '#include <Adafruit_GFX.h>';
    arduinoGenerator.includes_['adafruit_ssd1306'] = '#include <Adafruit_SSD1306.h>';
    arduinoGenerator.variables_['display'] = 'Adafruit_SSD1306 display(128, ' + height + ', &Wire, -1);';
    return '  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);\n' +
        '  display.clearDisplay();\n' +
        '  display.setTextColor(WHITE);\n';
};

// OLED clear
arduinoGenerator.forBlock['esp32_oled_clear'] = function (block) {
    return '  display.clearDisplay();\n';
};

// OLED print
arduinoGenerator.forBlock['esp32_oled_print'] = function (block) {
    let text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.ORDER_ATOMIC) || '""';
    let x = block.getFieldValue('X');
    let y = block.getFieldValue('Y');
    return '  display.setCursor(' + x + ', ' + y + ');\n' +
        '  display.print(' + text + ');\n';
};

// OLED display
arduinoGenerator.forBlock['esp32_oled_display'] = function (block) {
    return '  display.display();\n';
};

// Toggle Pin
arduinoGenerator.forBlock['esp32_toggle_pin'] = function (block) {
    let pin = block.getFieldValue('PIN');
    arduinoGenerator.setupCode_.push('pinMode(' + pin + ', OUTPUT);');
    return '  digitalWrite(' + pin + ', !digitalRead(' + pin + '));\n';
};

// Interrupt
arduinoGenerator.forBlock['esp32_interrupt'] = function (block) {
    let pin = block.getFieldValue('PIN');
    let mode = block.getFieldValue('MODE');
    let branch = arduinoGenerator.statementToCode(block, 'DO');
    let isrName = 'ISR_PIN_' + pin + '_' + Math.floor(Math.random() * 1000); // Unique name

    // Define ISR function
    arduinoGenerator.definitions_[isrName] =
        'void IRAM_ATTR ' + isrName + '() {\n' + branch + '}\n';

    // Setup interrupt
    arduinoGenerator.setupCode_.push('pinMode(' + pin + ', INPUT_PULLUP);'); // Assume pullup for safety often needed
    arduinoGenerator.setupCode_.push('attachInterrupt(digitalPinToInterrupt(' + pin + '), ' + isrName + ', ' + mode + ');');

    return '';
};

// Detach Interrupt
arduinoGenerator.forBlock['esp32_detach_interrupt'] = function (block) {
    let pin = block.getFieldValue('PIN');
    return '  detachInterrupt(digitalPinToInterrupt(' + pin + '));\n';
};

// Restart
arduinoGenerator.forBlock['esp32_restart'] = function (block) {
    return '  ESP.restart();\n';
};

// Deep Sleep
arduinoGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    var time = block.getFieldValue('TIME') || '1';
    return 'ESP.deepSleep(' + time + ' * 1000000UL);\n';
};

// ============================================
// STANDARD BLOCKLY BLOCKS
// ============================================

// Text
arduinoGenerator.forBlock['text'] = function (block) {
    let text = block.getFieldValue('TEXT');
    return [arduinoGenerator.quote_(text), arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['custom_text_value'] = function (block) {
    let text = block.getFieldValue('TEXT');
    return [arduinoGenerator.quote_(text), arduinoGenerator.ORDER_ATOMIC];
};

// Number
arduinoGenerator.forBlock['math_number'] = function (block) {
    var n = parseFloat(block.getFieldValue('NUM'));
    return [n, n < 0 ? arduinoGenerator.ORDER_UNARY_PREFIX : arduinoGenerator.ORDER_ATOMIC];
};

// Arithmetic
arduinoGenerator.forBlock['math_arithmetic'] = function (block) {
    var OPERATORS = {
        ADD: [' + ', arduinoGenerator.ORDER_ADDITIVE],
        MINUS: [' - ', arduinoGenerator.ORDER_ADDITIVE],
        MULTIPLY: [' * ', arduinoGenerator.ORDER_MULTIPLICATIVE],
        DIVIDE: [' / ', arduinoGenerator.ORDER_MULTIPLICATIVE],
        POWER: [null, arduinoGenerator.ORDER_NONE]
    };
    var mode = block.getFieldValue('OP');
    var tuple = OPERATORS[mode];
    var op = tuple[0], order = tuple[1];
    var a = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    var b = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    if (!op) return ['pow(' + a + ', ' + b + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
    return [a + op + b, order];
};

// Logic boolean
arduinoGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', arduinoGenerator.ORDER_ATOMIC];
};

// Logic compare
arduinoGenerator.forBlock['logic_compare'] = function (block) {
    var ops = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var op = ops[block.getFieldValue('OP')];
    var order = (op === '==' || op === '!=') ? arduinoGenerator.ORDER_EQUALITY : arduinoGenerator.ORDER_RELATIONAL;
    var a = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    var b = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    return [a + ' ' + op + ' ' + b, order];
};

// If/else
arduinoGenerator.forBlock['controls_if'] = function (block) {
    var n = 0, code = '';
    do {
        var condition = arduinoGenerator.valueToCode(block, 'IF' + n, arduinoGenerator.ORDER_NONE) || 'false';
        var branch = arduinoGenerator.statementToCode(block, 'DO' + n);
        code += (n === 0 ? 'if' : ' else if') + ' (' + condition + ') {\n' + branch + '}';
        n++;
    } while (block.getInput('IF' + n));
    if (block.getInput('ELSE')) {
        var elseBranch = arduinoGenerator.statementToCode(block, 'ELSE');
        code += ' else {\n' + elseBranch + '}';
    }
    return code + '\n';
};

// Repeat times
arduinoGenerator.forBlock['controls_repeat_ext'] = function (block) {
    var repeats = arduinoGenerator.valueToCode(block, 'TIMES', arduinoGenerator.ORDER_ASSIGNMENT) || '0';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    return 'for (int count = 0; count < ' + repeats + '; count++) {\n' + branch + '}\n';
};

// While loop
arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
    var until = block.getFieldValue('MODE') === 'UNTIL';
    var arg = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.ORDER_NONE) || 'false';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    if (until) arg = '!(' + arg + ')';
    return 'while (' + arg + ') {\n' + branch + '}\n';
};

// ============================================
// TIMING BLOCKS
// ============================================

// 1. Wait
arduinoGenerator.forBlock['custom_wait'] = function (block) {
    var delay = block.getFieldValue('DELAY') || '0';
    var unit = block.getFieldValue('UNIT');

    if (unit === 'SECONDS') {
        return 'delay(' + delay + ' * 1000);\n';
    } else if (unit === 'MICROSECONDS') {
        return 'delayMicroseconds(' + delay + ');\n';
    } else {
        return 'delay(' + delay + ');\n';
    }
};

// 2. Timer
arduinoGenerator.forBlock['custom_timer'] = function (block) {
    var interval = block.getFieldValue('interval') || '1000';
    var unit = block.getFieldValue('UNIT');
    var branch = arduinoGenerator.statementToCode(block, 'DO');

    var scale = (unit === 'SECONDS') ? 1000 : 1;
    var varName = 'timer_' + Math.floor(Math.random() * 1000); // Simple unique basic

    arduinoGenerator.definitions_[varName] = 'unsigned long ' + varName + ' = 0;';

    var code = 'if (millis() - ' + varName + ' > ' + interval + ' * ' + scale + ') {\n';
    code += '  ' + varName + ' = millis();\n';
    code += branch;
    code += '}\n';
    return code;
};

// 3. Start Timekeeping
arduinoGenerator.forBlock['start_timekeeping'] = function (block) {
    arduinoGenerator.definitions_['timekeeping'] = 'unsigned long startTime = 0;';
    return 'startTime = millis();\n';
};

// 4. Duration from beginning
arduinoGenerator.forBlock['get_duration'] = function (block) {
    var unit = block.getFieldValue('UNIT');
    var scale = (unit === 'SECONDS') ? 1000 : 1;
    var code = '(millis() / ' + scale + ')';
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

// 5. State duration
arduinoGenerator.forBlock['state_duration'] = function (block) {
    var state = block.getFieldValue('STATE');
    var pin = block.getFieldValue('PIN') || '0';
    return ['pulseIn(' + pin + ', ' + state + ')', arduinoGenerator.ORDER_ATOMIC];
};

// ============================================
// CONTROL BLOCKS
// ============================================

arduinoGenerator.forBlock['controls_if'] = function (block) {
    var n = 0, code = '';
    do {
        var condition = arduinoGenerator.valueToCode(block, 'IF' + n, arduinoGenerator.ORDER_NONE) || 'false';
        var branch = arduinoGenerator.statementToCode(block, 'DO' + n);
        code += (n === 0 ? 'if' : ' else if') + ' (' + condition + ') {\n' + branch + '}';
        n++;
    } while (block.getInput('IF' + n));
    if (block.getInput('ELSE')) {
        var elseBranch = arduinoGenerator.statementToCode(block, 'ELSE');
        code += ' else {\n' + elseBranch + '}';
    }
    return code + '\n';
};
arduinoGenerator.forBlock['ifelse'] = arduinoGenerator.forBlock['controls_if'];
arduinoGenerator.forBlock['ifandifnot'] = arduinoGenerator.forBlock['controls_if'];

arduinoGenerator.forBlock['controls_repeat_ext'] = function (block) {
    var repeats = arduinoGenerator.valueToCode(block, 'TIMES', arduinoGenerator.ORDER_ASSIGNMENT) || '0';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    return 'for (int count = 0; count < ' + repeats + '; count++) {\n' + branch + '}\n';
};

arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
    var until = block.getFieldValue('MODE') === 'UNTIL';
    var arg = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.ORDER_NONE) || 'false';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    if (until) arg = '!(' + arg + ')';
    return 'while (' + arg + ') {\n' + branch + '}\n';
};

arduinoGenerator.forBlock['controls_for'] = function (block) {
    var v = arduinoGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    var from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.ORDER_ASSIGNMENT) || '0';
    var to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.ORDER_ASSIGNMENT) || '0';
    var inc = arduinoGenerator.valueToCode(block, 'BY', arduinoGenerator.ORDER_ASSIGNMENT) || '1';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    if (Blockly.isNumber(from) && Blockly.isNumber(to) && Blockly.isNumber(inc)) {
        var up = parseFloat(from) <= parseFloat(to);
        var step = Math.abs(parseFloat(inc));
        var code = 'for (' + v + ' = ' + from + '; ' + v + (up ? ' <= ' : ' >= ') + to + '; ' + v;
        code += (step == 1) ? (up ? '++' : '--') : ((up ? ' += ' : ' -= ') + step);
        return code + ') {\n' + branch + '}\n';
    }
    var incVar = v + '_inc';
    var code = 'int ' + incVar + ' = ' + inc + ';\n';
    code += 'for (' + v + ' = ' + from + '; ' + incVar + ' >= 0 ? ' + v + ' <= ' + to + ' : ' + v + ' >= ' + to + '; ' + v + ' += ' + incVar + ') {\n' + branch + '}\n';
    return code;
};

arduinoGenerator.forBlock['controls_forEach'] = function (block) {
    var v = arduinoGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    var list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.ORDER_ASSIGNMENT) || '{}';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    return 'for (auto ' + v + ' : ' + list + ') {\n' + branch + '}\n';
};

arduinoGenerator.forBlock['controls_switch'] = function (block) {
    var switchvar = arduinoGenerator.nameDB_.getName(block.getFieldValue('SWVAR'), Blockly.Variables.NAME_TYPE);
    var arg = arduinoGenerator.valueToCode(block, 'CASE0', arduinoGenerator.ORDER_NONE) || '0';
    var branch = arduinoGenerator.statementToCode(block, 'DO0');
    var code = 'switch (' + switchvar + ') {\n  case ' + arg + ':\n' + branch + '    break;\n';
    for (var n = 1; n <= (block.casebreakCount_ || 0); n++) {
        arg = arduinoGenerator.valueToCode(block, 'CASE' + n, arduinoGenerator.ORDER_NONE) || '0';
        branch = arduinoGenerator.statementToCode(block, 'DO' + n);
        code += '  case ' + arg + ':\n' + branch + '    break;\n';
    }
    if (block.defaultCount_) {
        branch = arduinoGenerator.statementToCode(block, 'DEFAULT');
        code += '  default:\n' + branch;
    }
    return code + '}\n';
};

arduinoGenerator.forBlock['controls_flow_statements'] = function (block) {
    switch (block.getFieldValue('FLOW')) {
        case 'BREAK': return 'break;\n';
        case 'CONTINUE': return 'continue;\n';
    }
    return 'break;\n';
};

arduinoGenerator.forBlock['logic_operation'] = function (block) {
    var mode = block.getFieldValue('OP');
    var operator = (mode == 'and') ? '&&' : '||';
    var order = (operator == '&&') ? arduinoGenerator.ORDER_LOGICAL_AND : arduinoGenerator.ORDER_LOGICAL_OR;
    var a = arduinoGenerator.valueToCode(block, 'A', order) || 'false';
    var b = arduinoGenerator.valueToCode(block, 'B', order) || 'false';
    return [a + ' ' + operator + ' ' + b, order];
};

arduinoGenerator.forBlock['logic_negate'] = function (block) {
    var arg = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.ORDER_UNARY_PREFIX) || 'true';
    return ['!' + arg, arduinoGenerator.ORDER_UNARY_PREFIX];
};

arduinoGenerator.forBlock['logic_null'] = function () {
    return ['NULL', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['inout_onoff'] = function (block) {
    return [block.getFieldValue('BOOL') == 'HIGH' ? 'HIGH' : 'LOW', arduinoGenerator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['inout_onoff2'] = function (block) {
    return [block.getFieldValue('BOOL') == 'HIGH' ? 'LOW' : 'LOW', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['esp32_deep_sleep'] = function (block) {
    var time = block.getFieldValue('TIME') || '1';
    return 'ESP.deepSleep(' + time + ' * 1000000UL);\n';
};

// ============================================
// BUZZER / AUDIO BLOCKS
// ============================================

arduinoGenerator.forBlock['buzzer_play_rtttl'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = block.getFieldValue('MELODY');
    // Resolve BUZZER label to an actual pin number (default 25)
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    arduinoGenerator.includes_['rtttl'] = '#include <PlayRtttl.hpp>';
    arduinoGenerator.definitions_['buzzer_pin'] = 'const int BUZZER_PIN = ' + pinNum + ';';
    arduinoGenerator.setupCode_['buzzer_setup'] = 'pinMode(BUZZER_PIN, OUTPUT);';
    return 'playRtttlBlockingPGM(BUZZER_PIN, (char*)' + melody + ');\n';
};

arduinoGenerator.forBlock['buzzer_play_rtttl_custom'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = arduinoGenerator.valueToCode(block, 'MELODY', arduinoGenerator.ORDER_ATOMIC) || '"StarWars:d=4,o=5,b=45:32p"';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    var mname = '_mel' + Math.abs(melody.hashCode ? melody.hashCode() : 0);
    arduinoGenerator.includes_['rtttl'] = '#include <PlayRtttl.hpp>';
    arduinoGenerator.definitions_['buzzer_pin'] = 'const int BUZZER_PIN = ' + pinNum + ';';
    arduinoGenerator.definitions_['rtttl_' + mname] = 'static const char ' + mname + '[] PROGMEM = ' + melody + ';';
    arduinoGenerator.setupCode_['buzzer_setup'] = 'pinMode(BUZZER_PIN, OUTPUT);';
    return 'playRtttlBlockingPGM(BUZZER_PIN, (char*)' + mname + ');\n';
};

arduinoGenerator.forBlock['buzzer_play_note'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    arduinoGenerator.definitions_['buzzer_pin'] = 'const int BUZZER_PIN = ' + pinNum + ';';
    arduinoGenerator.setupCode_['buzzer_esp32'] = 'ledcSetup(4, 5000, 8);\nledcAttachPin(BUZZER_PIN, 4);';
    return 'ledcWriteTone(4, ' + note + ');\ndelay(' + tempo + ');\n';
};

arduinoGenerator.forBlock['buzzer_play_tone'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var freq = arduinoGenerator.valueToCode(block, 'FREQ', arduinoGenerator.ORDER_ATOMIC) || '880';
    var duration = arduinoGenerator.valueToCode(block, 'DURATION', arduinoGenerator.ORDER_ATOMIC) || '100';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    arduinoGenerator.definitions_['buzzer_pin'] = 'const int BUZZER_PIN = ' + pinNum + ';';
    arduinoGenerator.setupCode_['buzzer_esp32'] = 'ledcSetup(4, 5000, 8);\nledcAttachPin(BUZZER_PIN, 4);';
    return 'ledcWriteTone(4, ' + freq + ');\ndelay(' + duration + ');\nledcWriteTone(4, 0);\n';
};

arduinoGenerator.forBlock['buzzer_stop'] = function (block) {
    arduinoGenerator.setupCode_['buzzer_esp32'] = 'ledcSetup(4, 5000, 8);\nledcAttachPin(BUZZER_PIN, 4);';
    return 'ledcWriteTone(4, 0);\n';
};

// ============================================
// EXTENDED ARDUINO HARDWARE BLOCKS
// ============================================

arduinoGenerator.forBlock['esp32_pulse_in'] = function (block) {
    var pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.ORDER_ATOMIC) || '2';
    var state = block.getFieldValue('STATE');
    arduinoGenerator.setupCode_['setup_input_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['pulseIn(' + pin + ', ' + state + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['esp32_millis'] = function (block) {
    var u = block.getFieldValue('UNIT');
    if (u === 'u') return ['micros()', arduinoGenerator.ORDER_ATOMIC];
    if (u === 's') return ['millis()/1000', arduinoGenerator.ORDER_ATOMIC];
    return ['millis()', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['esp32_millis_start'] = function (block) {
    var u = block.getFieldValue('UNIT');
    arduinoGenerator.definitions_['millis_start_var'] = 'unsigned long _t_start = 0;';
    var fn = (u === 'u') ? 'micros()' : 'millis()';
    return '_t_start = ' + fn + ';\n';
};

arduinoGenerator.forBlock['esp32_timer_noblocking'] = function (block) {
    var interval = arduinoGenerator.valueToCode(block, 'INTERVAL', arduinoGenerator.ORDER_ATOMIC) || '1000';
    var u = block.getFieldValue('UNIT');
    var body = arduinoGenerator.statementToCode(block, 'DO') || '  ;';
    var mul = (u === 's') ? '*1000' : '';
    var key = '_tmr' + interval;
    arduinoGenerator.definitions_[key] = 'unsigned long ' + key + ' = 0;';
    return 'if ((millis() - ' + key + ') >= ' + interval + mul + ') {\n  ' + key + ' = millis();\n' + body + '}\n';
};

arduinoGenerator.forBlock['esp32_raw_code'] = function (block) {
    return block.getFieldValue('CODE') + '\n';
};

arduinoGenerator.forBlock['esp32_raw_value'] = function (block) {
    return [block.getFieldValue('CODE'), arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['esp32_eeprom_write'] = function (block) {
    arduinoGenerator.includes_['eeprom'] = '#include <EEPROM.h>';
    var val = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    var addr = arduinoGenerator.valueToCode(block, 'ADDRESS', arduinoGenerator.ORDER_ATOMIC) || '0';
    return 'EEPROM.write(' + addr + ', ' + val + ');\n';
};

arduinoGenerator.forBlock['esp32_eeprom_read'] = function (block) {
    arduinoGenerator.includes_['eeprom'] = '#include <EEPROM.h>';
    var addr = arduinoGenerator.valueToCode(block, 'ADDRESS', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['EEPROM.read(' + addr + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['esp32_digital_write_var'] = function (block) {
    var pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.ORDER_ATOMIC) || '2';
    var state = block.getFieldValue('STATE');
    arduinoGenerator.setupCode_['setup_output_v_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'digitalWrite(' + pin + ', ' + state + ');\n';
};

arduinoGenerator.forBlock['esp32_digital_read_var'] = function (block) {
    var pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.ORDER_ATOMIC) || '2';
    var pullup = block.getFieldValue('PULLUP') === 'TRUE';
    arduinoGenerator.setupCode_['setup_input_v_' + pin] = pullup
        ? 'pinMode(' + pin + ', INPUT_PULLUP);'
        : 'pinMode(' + pin + ', INPUT);';
    return ['digitalRead(' + pin + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['esp32_analog_read_temp'] = function (block) {
    var pin = block.getFieldValue('PIN');
    arduinoGenerator.includes_['math_h'] = '#include <math.h>';
    arduinoGenerator.definitions_['ntc_params'] =
        '#define SERIES_RESISTOR 10000.0\n#define NOMINAL_RESISTANCE 10000.0\n' +
        '#define NOMINAL_TEMPERATURE 25.0\n#define BETA_COEFFICIENT 3950.0\n' +
        '#define ADC_MAX 4095.0\nfloat TEMP_OFFSET = 9.0;';
    arduinoGenerator.setupCode_['adc_res'] = 'analogReadResolution(12);\nanalogSetAttenuation(ADC_11db);';
    var code = '([&]() -> float {\n' +
        '  int raw = analogRead(' + pin + ');\n' +
        '  if(raw <= 0) return 0.0f;\n' +
        '  float r = SERIES_RESISTOR * (ADC_MAX / raw - 1.0);\n' +
        '  float t = log(r/NOMINAL_RESISTANCE)/BETA_COEFFICIENT + 1.0/(NOMINAL_TEMPERATURE+273.15);\n' +
        '  return 1.0/t - 273.15 + TEMP_OFFSET;\n' +
        '}())';
    return [code, arduinoGenerator.ORDER_UNARY_POSTFIX];
};

arduinoGenerator.forBlock['esp32_analog_read_ds18b20'] = function (block) {
    var pin = block.getFieldValue('PIN');
    arduinoGenerator.includes_['onewire'] = '#include <OneWire.h>';
    arduinoGenerator.includes_['dallas'] = '#include <DallasTemperature.h>';
    arduinoGenerator.definitions_['onewire_' + pin] = 'OneWire oneWire' + pin + '(' + pin + ');\nDallasTemperature sensors' + pin + '(&oneWire' + pin + ');';
    arduinoGenerator.setupCode_['dallas_begin_' + pin] = 'sensors' + pin + '.begin();';
    return ['(sensors' + pin + '.requestTemperatures(), sensors' + pin + '.getTempCByIndex(0))', arduinoGenerator.ORDER_UNARY_POSTFIX];
};

arduinoGenerator.forBlock['esp32_capacitive_touch'] = function (block) {
    var pin = block.getFieldValue('PIN');
    return ['touchRead(' + pin + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['esp32_voice_play'] = function (block) {
    var id = block.getFieldValue('VOICE_ID');
    arduinoGenerator.includes_['emmi_voice'] = '#include <Emmi_Voice_Lib.h>';
    arduinoGenerator.setupCode_['speaker_init'] = 'pinMode(26, OUTPUT);\ndacWrite(26, 128);';
    return 'playVoice_' + id + '();\n';
};

arduinoGenerator.forBlock['esp32_voice_stop'] = function (block) {
    arduinoGenerator.includes_['emmi_voice'] = '#include <Emmi_Voice_Lib.h>';
    return 'stopVoice();\n';
};

// ============================================
// OPERATOR BLOCKS
// ============================================

arduinoGenerator.forBlock['custom_math_map'] = function (block) {
    var value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    var fl = arduinoGenerator.valueToCode(block, 'FROM_LOW', arduinoGenerator.ORDER_ATOMIC) || '0';
    var fh = arduinoGenerator.valueToCode(block, 'FROM_HIGH', arduinoGenerator.ORDER_ATOMIC) || '1023';
    var tl = arduinoGenerator.valueToCode(block, 'TO_LOW', arduinoGenerator.ORDER_ATOMIC) || '0';
    var th = arduinoGenerator.valueToCode(block, 'TO_HIGH', arduinoGenerator.ORDER_ATOMIC) || '255';
    return ['map(' + value + ', ' + fl + ', ' + fh + ', ' + tl + ', ' + th + ')', arduinoGenerator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['custom_math_random_int'] = function (block) {
    var from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.ORDER_ATOMIC) || '0';
    var to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.ORDER_ATOMIC) || '100';
    return ['random(' + from + ', ' + to + ' + 1)', arduinoGenerator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['custom_math_constrain'] = function (block) {
    var value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    var low = arduinoGenerator.valueToCode(block, 'LOW', arduinoGenerator.ORDER_ATOMIC) || '0';
    var high = arduinoGenerator.valueToCode(block, 'HIGH', arduinoGenerator.ORDER_ATOMIC) || '100';
    return ['constrain(' + value + ', ' + low + ', ' + high + ')', arduinoGenerator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['cast_to_byte'] = function (block) {
    var v = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(byte)(' + v + ')', arduinoGenerator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['cast_to_unsigned_int'] = function (block) {
    var v = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(unsigned int)(' + v + ')', arduinoGenerator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['cast_to_int'] = function (block) {
    var v = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(int)(' + v + ')', arduinoGenerator.ORDER_ATOMIC];
};
arduinoGenerator.forBlock['cast_to_float'] = function (block) {
    var v = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(float)(' + v + ')', arduinoGenerator.ORDER_ATOMIC];
};

// ── Extended Operator Blocks ──────────

arduinoGenerator.forBlock['logic_boolean'] = function (block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_number'] = function (block) {
    var n = parseFloat(block.getFieldValue('NUM'));
    return [n, n < 0 ? arduinoGenerator.ORDER_UNARY_PREFIX : arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_arithmetic'] = function (block) {
    var OPERATORS = {
        ADD: [' + ', arduinoGenerator.ORDER_ADDITIVE],
        MINUS: [' - ', arduinoGenerator.ORDER_ADDITIVE],
        MULTIPLY: [' * ', arduinoGenerator.ORDER_MULTIPLICATIVE],
        DIVIDE: [' / ', arduinoGenerator.ORDER_MULTIPLICATIVE],
        POWER: [null, arduinoGenerator.ORDER_NONE]
    };
    var mode = block.getFieldValue('OP');
    var tuple = OPERATORS[mode];
    var op = tuple[0], order = tuple[1];
    var a = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    var b = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    if (!op) return ['pow(' + a + ', ' + b + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
    return [a + op + b, order];
};

arduinoGenerator.forBlock['logic_compare'] = function (block) {
    var ops = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var op = ops[block.getFieldValue('OP')];
    var order = (op === '==' || op === '!=') ? arduinoGenerator.ORDER_EQUALITY : arduinoGenerator.ORDER_RELATIONAL;
    var a = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    var b = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    return [a + ' ' + op + ' ' + b, order];
};

// math_single, math_trig, math_round all share the same handler 
arduinoGenerator.forBlock['math_single'] = function (block) {
    var op = block.getFieldValue('OP');
    var arg;
    if (op === 'NEG') {
        arg = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.ORDER_UNARY_PREFIX) || '0';
        if (arg[0] === '-') arg = ' ' + arg;
        return ['-' + arg, arduinoGenerator.ORDER_UNARY_PREFIX];
    }
    arg = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.ORDER_NONE) || '0';
    switch (op) {
        case 'ABS': return ['abs(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        case 'ROOT': return ['sqrt(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        case 'ROUND': return ['round(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        case 'ROUNDUP': return ['ceil(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        case 'ROUNDDOWN': return ['floor(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        case 'SIN': return ['sin(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        case 'COS': return ['cos(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        case 'TAN': return ['tan(' + arg + ')', arduinoGenerator.ORDER_UNARY_POSTFIX];
        default: throw 'Unknown math operator: ' + op;
    }
};
arduinoGenerator.forBlock['math_trig'] = arduinoGenerator.forBlock['math_single'];
arduinoGenerator.forBlock['math_round'] = arduinoGenerator.forBlock['math_single'];

arduinoGenerator.forBlock['math_constant'] = function (block) {
    var CONSTANTS = {
        PI: ['PI', arduinoGenerator.ORDER_ATOMIC],
        E: ['exp(1)', arduinoGenerator.ORDER_UNARY_POSTFIX],
        GOLDEN_RATIO: ['(1 + sqrt(5)) / 2', arduinoGenerator.ORDER_DIVISION],
        SQRT2: ['sqrt(2)', arduinoGenerator.ORDER_UNARY_POSTFIX],
        SQRT1_2: ['sqrt(0.5)', arduinoGenerator.ORDER_UNARY_POSTFIX],
        INFINITY: ['INFINITY', arduinoGenerator.ORDER_ATOMIC]
    };
    return CONSTANTS[block.getFieldValue('CONSTANT')] || ['0', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_modulo'] = function (block) {
    var a = arduinoGenerator.valueToCode(block, 'DIVIDEND', arduinoGenerator.ORDER_MODULUS) || '0';
    var b = arduinoGenerator.valueToCode(block, 'DIVISOR', arduinoGenerator.ORDER_MODULUS) || '1';
    return ['(' + a + ') % (' + b + ')', arduinoGenerator.ORDER_MODULUS];
};

arduinoGenerator.forBlock['math_random_int'] = function (block) {
    var from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.ORDER_ATOMIC) || '0';
    var to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.ORDER_ATOMIC) || '100';
    return ['random(' + from + ', ' + to + ' + 1)', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['math_number_property'] = function (block) {
    var num = arduinoGenerator.valueToCode(block, 'NUMBER_TO_CHECK', arduinoGenerator.ORDER_MODULUS) || '0';
    var prop = block.getFieldValue('PROPERTY');
    switch (prop) {
        case 'EVEN': return [num + ' % 2 == 0', arduinoGenerator.ORDER_EQUALITY];
        case 'ODD': return [num + ' % 2 != 0', arduinoGenerator.ORDER_EQUALITY];
        case 'WHOLE': return [num + ' % 1 == 0', arduinoGenerator.ORDER_EQUALITY];
        case 'POSITIVE': return [num + ' > 0', arduinoGenerator.ORDER_RELATIONAL];
        case 'NEGATIVE': return [num + ' < 0', arduinoGenerator.ORDER_RELATIONAL];
        case 'DIVISIBLE_BY': {
            var div = arduinoGenerator.valueToCode(block, 'DIVISOR', arduinoGenerator.ORDER_MODULUS) || '1';
            return [num + ' % ' + div + ' == 0', arduinoGenerator.ORDER_EQUALITY];
        }
        default: return ['false', arduinoGenerator.ORDER_ATOMIC];
    }
};

arduinoGenerator.forBlock['intervalle'] = function (block) {
    var OPS = { LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
    var inf = arduinoGenerator.valueToCode(block, 'inf', arduinoGenerator.ORDER_ATOMIC) || '0';
    var val = arduinoGenerator.valueToCode(block, 'valeur', arduinoGenerator.ORDER_ATOMIC) || '0';
    var sup = arduinoGenerator.valueToCode(block, 'sup', arduinoGenerator.ORDER_ATOMIC) || '0';
    var cInf = block.getFieldValue('comp_inf');
    var cSup = OPS[block.getFieldValue('comp_sup')];
    // comp_inf is the relation from value's perspective vs inf:  e.g. LT means "value > inf"
    var leftOp = { LT: '>', GT: '<', GTE: '<=', LTE: '>=' }[cInf] || '>';
    return ['(' + val + ' ' + leftOp + ' ' + inf + ') && (' + val + ' ' + cSup + ' ' + sup + ')',
    arduinoGenerator.ORDER_NONE];
};

arduinoGenerator.forBlock['text_join'] = function (block) {
    if (block.itemCount_ === 0) return ['String("")', arduinoGenerator.ORDER_ATOMIC];
    var parts = [];
    for (var i = 0; i < block.itemCount_; i++) {
        var arg = arduinoGenerator.valueToCode(block, 'ADD' + i, arduinoGenerator.ORDER_NONE) || '""';
        parts.push('String(' + arg + ')');
    }
    return [parts.join(' + '), arduinoGenerator.ORDER_UNARY_POSTFIX];
};

arduinoGenerator.forBlock['text_length'] = function (block) {
    var arg = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_UNARY_POSTFIX) || '""';
    return ['String(' + arg + ').length()', arduinoGenerator.ORDER_UNARY_POSTFIX];
};

arduinoGenerator.forBlock['text_isEmpty'] = function (block) {
    var arg = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_UNARY_POSTFIX) || '""';
    return ['(String(' + arg + ').length() == 0)', arduinoGenerator.ORDER_EQUALITY];
};

console.log('Arduino generator loaded successfully');
