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
    let time = arduinoGenerator.valueToCode(block, 'TIME', arduinoGenerator.ORDER_ATOMIC) || '1';
    return '  esp_sleep_enable_timer_wakeup(' + time + ' * 1000000);\n' +
        '  esp_deep_sleep_start();\n';
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
    let number = block.getFieldValue('NUM');
    return [number, arduinoGenerator.ORDER_ATOMIC];
};

// Arithmetic
arduinoGenerator.forBlock['math_arithmetic'] = function (block) {
    let operator = block.getFieldValue('OP');
    let order = (operator === 'MULTIPLY' || operator === 'DIVIDE')
        ? arduinoGenerator.ORDER_MULTIPLICATIVE
        : arduinoGenerator.ORDER_ADDITIVE;
    let left = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    let right = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    let ops = {
        'ADD': '+',
        'MINUS': '-',
        'MULTIPLY': '*',
        'DIVIDE': '/',
        'POWER': '^'
    };
    if (operator === 'POWER') {
        return ['pow(' + left + ', ' + right + ')', arduinoGenerator.ORDER_ATOMIC];
    }
    return [left + ' ' + ops[operator] + ' ' + right, order];
};

// Logic boolean
arduinoGenerator.forBlock['logic_boolean'] = function (block) {
    let code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

// Logic compare
arduinoGenerator.forBlock['logic_compare'] = function (block) {
    let ops = {
        'EQ': '==',
        'NEQ': '!=',
        'LT': '<',
        'LTE': '<=',
        'GT': '>',
        'GTE': '>='
    };
    let operator = ops[block.getFieldValue('OP')];
    let order = (operator === '==' || operator === '!=')
        ? arduinoGenerator.ORDER_EQUALITY
        : arduinoGenerator.ORDER_RELATIONAL;
    let left = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    let right = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    return [left + ' ' + operator + ' ' + right, order];
};

// If/else
arduinoGenerator.forBlock['controls_if'] = function (block) {
    let n = 0;
    let code = '';
    do {
        let condition = arduinoGenerator.valueToCode(block, 'IF' + n, arduinoGenerator.ORDER_NONE) || 'false';
        let branch = arduinoGenerator.statementToCode(block, 'DO' + n);
        code += (n === 0 ? '  if' : ' else if') + ' (' + condition + ') {\n' + branch + '  }';
        n++;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE')) {
        let branch = arduinoGenerator.statementToCode(block, 'ELSE');
        code += ' else {\n' + branch + '  }';
    }
    return code + '\n';
};

// Repeat times
arduinoGenerator.forBlock['controls_repeat_ext'] = function (block) {
    let times = arduinoGenerator.valueToCode(block, 'TIMES', arduinoGenerator.ORDER_ATOMIC) || '0';
    let branch = arduinoGenerator.statementToCode(block, 'DO');
    return '  for (int i = 0; i < ' + times + '; i++) {\n' + branch + '  }\n';
};

// While loop
arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
    let until = block.getFieldValue('MODE') === 'UNTIL';
    let condition = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.ORDER_NONE) || 'false';
    if (until) {
        condition = '!(' + condition + ')';
    }
    let branch = arduinoGenerator.statementToCode(block, 'DO');
    return '  while (' + condition + ') {\n' + branch + '  }\n';
};

// ============================================
// TIMING BLOCKS
// ============================================

// 1. Wait
arduinoGenerator.forBlock['custom_wait'] = function (block) {
    var delay = arduinoGenerator.valueToCode(block, 'DELAY', arduinoGenerator.ORDER_ATOMIC) || '0';
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
    var interval = arduinoGenerator.valueToCode(block, 'interval', arduinoGenerator.ORDER_ATOMIC) || '1000';
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
    var pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.ORDER_ATOMIC) || '0';
    var code = 'pulseIn(' + pin + ', ' + state + ')';
    return [code, arduinoGenerator.ORDER_ATOMIC];
};

// ============================================
// CONTROL BLOCKS
// ============================================

// 1. If
arduinoGenerator.forBlock['custom_controls_if'] = function (block) {
    var n = 0;
    var code = '';
    if (arduinoGenerator.STATEMENT_PREFIX) {
        code += arduinoGenerator.injectId(arduinoGenerator.STATEMENT_PREFIX, block);
    }
    do {
        var conditionCode = arduinoGenerator.valueToCode(block, 'IF' + n,
            arduinoGenerator.ORDER_NONE) || 'false';
        var branchCode = arduinoGenerator.statementToCode(block, 'DO' + n);
        if (arduinoGenerator.STATEMENT_SUFFIX) {
            branchCode = arduinoGenerator.PREFIX_SUFFIX + branchCode;
        }
        code += (n > 0 ? ' else ' : '') +
            'if (' + conditionCode + ') {\n' + branchCode + '}';
        ++n;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE') || arduinoGenerator.STATEMENT_SUFFIX) {
        var branchCode = arduinoGenerator.statementToCode(block, 'ELSE');
        if (arduinoGenerator.STATEMENT_SUFFIX) {
            branchCode = arduinoGenerator.PREFIX_SUFFIX + branchCode;
        }
        code += ' else {\n' + branchCode + '}';
    }
    return code + '\n';
};

// 2. Repeat Times
arduinoGenerator.forBlock['custom_controls_repeat'] = function (block) {
    var repeats = arduinoGenerator.valueToCode(block, 'TIMES',
        arduinoGenerator.ORDER_ASSIGNMENT) || '0';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    branch = arduinoGenerator.addLoopTrap(branch, block);
    var loopVar = arduinoGenerator.nameDB_.getDistinctName(
        'count', Blockly.Variables.NAME_TYPE);
    var code = 'for (int ' + loopVar + ' = 0; ' +
        loopVar + ' < ' + repeats + '; ' +
        loopVar + '++) {\n' +
        branch + '}\n';
    return code;
};

// 3. Repeat While/Until
arduinoGenerator.forBlock['custom_controls_whileUntil'] = function (block) {
    var until = block.getFieldValue('MODE') === 'UNTIL';
    var argument0 = arduinoGenerator.valueToCode(block, 'BOOL',
        until ? arduinoGenerator.ORDER_LOGICAL_NOT :
            arduinoGenerator.ORDER_NONE) || 'false';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    branch = arduinoGenerator.addLoopTrap(branch, block);
    if (until) {
        argument0 = '!' + argument0;
    }
    return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

// 4. For Loop
arduinoGenerator.forBlock['custom_controls_for'] = function (block) {
    var variable0 = arduinoGenerator.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    var argument0 = arduinoGenerator.valueToCode(block, 'FROM',
        arduinoGenerator.ORDER_ASSIGNMENT) || '0';
    var argument1 = arduinoGenerator.valueToCode(block, 'TO',
        arduinoGenerator.ORDER_ASSIGNMENT) || '0';
    var increment = arduinoGenerator.valueToCode(block, 'BY',
        arduinoGenerator.ORDER_ASSIGNMENT) || '1';
    var branch = arduinoGenerator.statementToCode(block, 'DO');
    branch = arduinoGenerator.addLoopTrap(branch, block);
    var code;
    if (Blockly.isNumber(argument0) && Blockly.isNumber(argument1) &&
        Blockly.isNumber(increment)) {
        var up = parseFloat(argument0) <= parseFloat(argument1);
        code = 'for (' + variable0 + ' = ' + argument0 + '; ' +
            variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' +
            variable0;
        var step = Math.abs(parseFloat(increment));
        if (step == 1) {
            code += (up ? '++' : '--');
        } else {
            code += (up ? ' += ' : ' -= ') + step;
        }
        code += ') {\n' + branch + '}\n';
    } else {
        code = '';
        var startVar = argument0;
        if (!argument0.match(/^\w+$/) && !Blockly.isNumber(argument0)) {
            startVar = arduinoGenerator.nameDB_.getDistinctName(
                variable0 + '_start', Blockly.Variables.NAME_TYPE);
            code += 'int ' + startVar + ' = ' + argument0 + ';\n';
        }
        var endVar = argument1;
        if (!argument1.match(/^\w+$/) && !Blockly.isNumber(argument1)) {
            endVar = arduinoGenerator.nameDB_.getDistinctName(
                variable0 + '_end', Blockly.Variables.NAME_TYPE);
            code += 'int ' + endVar + ' = ' + argument1 + ';\n';
        }
        var incVar = arduinoGenerator.nameDB_.getDistinctName(
            variable0 + '_inc', Blockly.Variables.NAME_TYPE);
        code += 'int ' + incVar + ' = ' + increment + ';\n';
        code += 'for (' + variable0 + ' = ' + startVar + '; ' +
            incVar + ' >= 0 ? ' +
            variable0 + ' <= ' + endVar + ' : ' +
            variable0 + ' >= ' + endVar + '; ' +
            variable0 + ' += ' + incVar + ') {\n' +
            branch + '}\n';
    }
    return code;
};

// 5. Switch
arduinoGenerator.forBlock['custom_controls_switch'] = function (block) {
    var switchValue = arduinoGenerator.valueToCode(block, 'SWITCH_VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    var n = 0;
    var code = 'switch (' + switchValue + ') {\n';

    // Check for cases (assuming standard 'CASE' + n inputs if mutable, or simpler structure)
    // For simplicity, we'll try to find connected CASE blocks or check inputs
    // This generator assumes a specific block structure which we'll define in `esp32_blocks.js`
    // If it's a mutation, we loop inputs. Let's assume standard 'CASE' inputs.

    // NOTE: This basic generator handles one default "match" case if strict structure, 
    // or iterates if mutable. Let's implementing iterating 'CASE' + n.
    // If the block is mutable, it likely has CASE0, CASE1...

    // But wait, the standard Blockly doesn't have a "controls_switch". 
    // We'll write a simple one: 1 Default case? Or just "switch(val) { ... }" and user puts "case" blocks inside?
    // The screenshot shows "switch [i] is [ ] then". It looks like "If [i] == [ ] then".
    // Actually, it might be a "Switch Case" block where the "then" is the statement.
    // BUT usually switch has ONE value and MULTIPLE cases.
    // The block "switch [i] is [ ] then" looks like a SINGLE case switch? Or a "Case" block?
    // "switch [i] is [ ]" sounds like "if [i] == [ ]".
    // Let's implement it as: `switch (i) { case [ ]: [statement] break; }` for now?
    // Or maybe it is just an "if (i == val)" logic labeled as "switch"?
    // User says "switch i is [ ] then".
    // If it's a standalone block, it might be `if (i == val)`.
    // Let's implement as `if (val1 == val2)` for safety, unless user connects multiple.
    // BUT proper switch: `switch (val) { case target: do; break; }`

    var targetValue = arduinoGenerator.valueToCode(block, 'CASE_VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    var branch = arduinoGenerator.statementToCode(block, 'DO');

    // If it is truly a "switch" block, it should be the container.
    // If the screenshot shows "switch i is [ ] then", it implies checking `i` against a value.
    // I will implement it as `if (switchValue == targetValue) { ... }` because a partial switch is weird in C++.
    // Or `switch(switchValue) { case targetValue: ... break; }`.

    code += '  case ' + targetValue + ':\n';
    code += branch;
    code += '    break;\n';
    code += '}\n';
    // Wait, wrapping in `switch` for every block is wrong if they are meant to be stacked. 
    // Maybe it's just "Case" block? But label says "switch".
    // I'll implement as `if (switchValue == targetValue)` for now as it's safer logic for a single block.

    return 'if (' + switchValue + ' == ' + targetValue + ') {\n' + branch + '}\n';
};

// 6. Flow Statements (Break/Continue)
arduinoGenerator.forBlock['custom_flow_statements'] = function (block) {
    switch (block.getFieldValue('FLOW')) {
        case 'BREAK':
            return 'break;\n';
        case 'CONTINUE':
            return 'continue;\n';
    }
    return 'break;\n';
};

// 7. Logic And
arduinoGenerator.forBlock['custom_logic_and'] = function (block) {
    var operator = (block.getFieldValue('OP') == 'OR') ? '||' : '&&';
    var order = (operator == '||') ? arduinoGenerator.ORDER_LOGICAL_OR :
        arduinoGenerator.ORDER_LOGICAL_AND;
    var argument0 = arduinoGenerator.valueToCode(block, 'A', order) || 'false';
    var argument1 = arduinoGenerator.valueToCode(block, 'B', order) || 'false';
    var code = argument0 + ' ' + operator + ' ' + argument1;
    return [code, order];
};

// 8. Logic Not
arduinoGenerator.forBlock['custom_logic_not'] = function (block) {
    var argument0 = arduinoGenerator.valueToCode(block, 'BOOL',
        arduinoGenerator.ORDER_LOGICAL_NOT) || 'true';
    var code = '!' + argument0;
    return [code, arduinoGenerator.ORDER_LOGICAL_NOT];
};

// 9. Logic Null
arduinoGenerator.forBlock['custom_logic_null'] = function (block) {
    return ['NULL', arduinoGenerator.ORDER_ATOMIC];
};

// ============================================
// OPERATOR BLOCKS (Custom)
// ============================================

// 1. Map
arduinoGenerator.forBlock['custom_math_map'] = function (block) {
    let value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    let fromLow = arduinoGenerator.valueToCode(block, 'FROM_LOW', arduinoGenerator.ORDER_ATOMIC) || '0';
    let fromHigh = arduinoGenerator.valueToCode(block, 'FROM_HIGH', arduinoGenerator.ORDER_ATOMIC) || '1023';
    let toLow = arduinoGenerator.valueToCode(block, 'TO_LOW', arduinoGenerator.ORDER_ATOMIC) || '0';
    let toHigh = arduinoGenerator.valueToCode(block, 'TO_HIGH', arduinoGenerator.ORDER_ATOMIC) || '255';
    return ['map(' + value + ', ' + fromLow + ', ' + fromHigh + ', ' + toLow + ', ' + toHigh + ')', arduinoGenerator.ORDER_ATOMIC];
};

// 2. Random Integer
arduinoGenerator.forBlock['custom_math_random_int'] = function (block) {
    let from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.ORDER_ATOMIC) || '0';
    let to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.ORDER_ATOMIC) || '100';
    // Arduino random(min, max) is exclusive of max, so we add 1
    return ['random(' + from + ', ' + to + ' + 1)', arduinoGenerator.ORDER_ATOMIC];
};

// 3. Constrain
arduinoGenerator.forBlock['custom_math_constrain'] = function (block) {
    let value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    let low = arduinoGenerator.valueToCode(block, 'LOW', arduinoGenerator.ORDER_ATOMIC) || '0';
    let high = arduinoGenerator.valueToCode(block, 'HIGH', arduinoGenerator.ORDER_ATOMIC) || '100';
    return ['constrain(' + value + ', ' + low + ', ' + high + ')', arduinoGenerator.ORDER_ATOMIC];
};

// 4. Cast to Byte
arduinoGenerator.forBlock['cast_to_byte'] = function (block) {
    let value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(byte)(' + value + ')', arduinoGenerator.ORDER_ATOMIC];
};

// 5. Cast to Unsigned Int
arduinoGenerator.forBlock['cast_to_unsigned_int'] = function (block) {
    let value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(unsigned int)(' + value + ')', arduinoGenerator.ORDER_ATOMIC];
};

// 6. Cast to Int
arduinoGenerator.forBlock['cast_to_int'] = function (block) {
    let value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(int)(' + value + ')', arduinoGenerator.ORDER_ATOMIC];
};

// 7. Cast to Float
arduinoGenerator.forBlock['cast_to_float'] = function (block) {
    let value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    return ['(float)(' + value + ')', arduinoGenerator.ORDER_ATOMIC];
};

console.log('Arduino generator loaded successfully including CONTROL and OPERATOR blocks');
