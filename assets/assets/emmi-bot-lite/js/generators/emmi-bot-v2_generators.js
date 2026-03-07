'use strict';

// ===========================================
// EMMI BOT V2 Generators
// ===========================================

// Pins - NEED VERIFICATION
// Assuming:
// Eyes: RGB LED (likely PWM or Neopixel, but "digital write" implies simple GPIOs for R/G/B?)
// Wheels: Motor driver pins
// Buzzer: Passive/Active buzzer pin
// Touch: Capacitive touch pin or button? "digital state" implies button.
// Mic: Digital output sound sensor?
// Light: LDR (Analog)

// Variables to store user setup
arduinoGenerator.emmi_setup = {
    eyes: false,
    wheels: false,
    buzzer: false,
    touch: false,
    mic: false,
    light: false
};

// Helper: Add setup code only once
function ensureSetup(type) {
    if (arduinoGenerator.emmi_setup[type]) return;
    arduinoGenerator.emmi_setup[type] = true;

    if (!Array.isArray(arduinoGenerator.setupCode_)) {
        arduinoGenerator.setupCode_ = [];
    }

    var addSetupLine = function (line) {
        if (!arduinoGenerator.setupCode_.includes(line)) {
            arduinoGenerator.setupCode_.push(line);
        }
    };

    switch (type) {
        case 'eyes':
            addSetupLine('pinMode(13, OUTPUT);');
            addSetupLine('pinMode(12, OUTPUT);');
            addSetupLine('pinMode(14, OUTPUT);');
            break;
        case 'wheels':
            addSetupLine('pinMode(16, OUTPUT);');
            addSetupLine('pinMode(17, OUTPUT);');
            addSetupLine('pinMode(18, OUTPUT);');
            addSetupLine('pinMode(19, OUTPUT);');
            break;
        case 'buzzer':
            addSetupLine('pinMode(25, OUTPUT);');
            break;
        case 'touch':
            // Handled in block because mode can change (pullup)
            break;
        case 'mic':
            // Handled in block
            break;
        case 'light':
            addSetupLine('pinMode(34, INPUT);');
            break;
    }
}


// ===========================================
// ARDUINO GENERATORS - EMMI BOT V2
// ===========================================

// --- Eyes ---

arduinoGenerator.forBlock['emmi_eyes_digital'] = function (block) {
    ensureSetup('eyes');
    var pinKey = block.getFieldValue('PIN');
    var state = block.getFieldValue('STATE');
    var pinNum = 33;

    if (pinKey === 'PIN_EYE_GREEN') pinNum = 25;
    else if (pinKey === 'PIN_EYE_BLUE') pinNum = 32;

    return '  digitalWrite(' + pinNum + ', ' + state + ');\n';
};

// --- Wheels ---

arduinoGenerator.forBlock['emmi_wheels_init'] = function (block) {
    ensureSetup('wheels');
    return '';
};

arduinoGenerator.forBlock['emmi_wheels_simple'] = function(block) {

    var direction = block.getFieldValue('DIRECTION');

    var IN1 = 16;
    var IN2 = 17;
    var IN3 = 18;
    var IN4 = 19;

    arduinoGenerator.setupCode_.push('pinMode(' + IN1 + ', OUTPUT);');
    arduinoGenerator.setupCode_.push('pinMode(' + IN2 + ', OUTPUT);');
    arduinoGenerator.setupCode_.push('pinMode(' + IN3 + ', OUTPUT);');
    arduinoGenerator.setupCode_.push('pinMode(' + IN4 + ', OUTPUT);');

    var code = '';

    if (direction === "FORWARD") {
        code += '  digitalWrite(' + IN1 + ', HIGH);\n';
        code += '  digitalWrite(' + IN2 + ', LOW);\n';
        code += '  digitalWrite(' + IN3 + ', HIGH);\n';
        code += '  digitalWrite(' + IN4 + ', LOW);\n';
    } 
    else if (direction === "BACKWARD") {
        code += '  digitalWrite(' + IN1 + ', LOW);\n';
        code += '  digitalWrite(' + IN2 + ', HIGH);\n';
        code += '  digitalWrite(' + IN3 + ', LOW);\n';
        code += '  digitalWrite(' + IN4 + ', HIGH);\n';
    } 
    else if (direction === "LEFT") {
        code += '  digitalWrite(' + IN1 + ', LOW);\n';
        code += '  digitalWrite(' + IN2 + ', HIGH);\n';
        code += '  digitalWrite(' + IN3 + ', HIGH);\n';
        code += '  digitalWrite(' + IN4 + ', LOW);\n';
    } 
    else if (direction === "RIGHT") {
        code += '  digitalWrite(' + IN1 + ', HIGH);\n';
        code += '  digitalWrite(' + IN2 + ', LOW);\n';
        code += '  digitalWrite(' + IN3 + ', LOW);\n';
        code += '  digitalWrite(' + IN4 + ', HIGH);\n';
    } 
    else if (direction === "STOP") {
        code += '  digitalWrite(' + IN1 + ', LOW);\n';
        code += '  digitalWrite(' + IN2 + ', LOW);\n';
        code += '  digitalWrite(' + IN3 + ', LOW);\n';
        code += '  digitalWrite(' + IN4 + ', LOW);\n';
    }

    return code;
};

// --- Buzzer ---















// --- Touch / Mic / Light ---

arduinoGenerator.forBlock['emmi_touch_read'] = function (block) {
    var mode = block.getFieldValue('MODE') || 'INPUT';
    arduinoGenerator.setupCode_.push('pinMode(32, ' + mode + ');');
    return ['analogRead(32)', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['emmi_mic_read'] = function (block) {
    var mode = block.getFieldValue('MODE') || 'INPUT';
    arduinoGenerator.setupCode_.push('pinMode(33, ' + mode + ');');
    return ['digitalRead(33)', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['emmi_light_read'] = function (block) {
    ensureSetup('light');
    return ['analogRead(34)', arduinoGenerator.ORDER_ATOMIC];
};

// --- MP3 / DFPlayer ---









// ===========================================
// PYTHON GENERATORS - EMMI BOT V2
// ===========================================

// Python setup tracking
pythonGenerator.emmi_setup = {};

function ensurePythonSetup(type) {
    if (pythonGenerator.emmi_setup[type]) return;
    pythonGenerator.emmi_setup[type] = true;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';

    switch (type) {
        case 'eyes':
            pythonGenerator.definitions_['setup_eye_r'] = 'eye_red = Pin(' + 13 + ', Pin.OUT)';
            pythonGenerator.definitions_['setup_eye_g'] = 'eye_green = Pin(' + 12 + ', Pin.OUT)';
            pythonGenerator.definitions_['setup_eye_b'] = 'eye_blue = Pin(' + 14 + ', Pin.OUT)';
            break;
        case 'wheels':
            pythonGenerator.definitions_['setup_motor_la'] = 'motor_la = Pin(' + 16 + ', Pin.OUT)';
            pythonGenerator.definitions_['setup_motor_lb'] = 'motor_lb = Pin(' + 17 + ', Pin.OUT)';
            pythonGenerator.definitions_['setup_motor_ra'] = 'motor_ra = Pin(' + 18 + ', Pin.OUT)';
            pythonGenerator.definitions_['setup_motor_rb'] = 'motor_rb = Pin(' + 19 + ', Pin.OUT)';
            break;
        case 'buzzer':
            pythonGenerator.definitions_['setup_buzzer'] = 'buzzer = PWM(Pin(' + 25 + '), freq=5000, duty=0)';
            break;
        case 'light':
            pythonGenerator.definitions_['setup_light'] = 'light_sensor = ADC(Pin(' + 34 + '))';
            break;
    }
}

// --- Eyes ---

pythonGenerator.forBlock['emmi_eyes_digital'] = function (block) {
    ensurePythonSetup('eyes');
    var pinKey = block.getFieldValue('PIN');
    var state = block.getFieldValue('STATE');
    var pyVal = (state === 'HIGH') ? '1' : '0';
    var pinVar;

    if (pinKey === 'PIN_EYE_RED') pinVar = 'eye_red';
    else if (pinKey === 'PIN_EYE_GREEN') pinVar = 'eye_green';
    else if (pinKey === 'PIN_EYE_BLUE') pinVar = 'eye_blue';

    return pinVar + '.value(' + pyVal + ')\n';
};

// --- Wheels ---

pythonGenerator.forBlock['emmi_wheels_init'] = function (block) {
    ensurePythonSetup('wheels');
    return '';
};

pythonGenerator.forBlock['emmi_wheels_simple'] = function(block) {

    pythonGenerator.imports_['machine'] = 'from machine import Pin';

    var direction = block.getFieldValue('DIRECTION');

    var code = '';

    code += '    in1 = Pin(16, Pin.OUT)\n';
    code += '    in2 = Pin(17, Pin.OUT)\n';
    code += '    in3 = Pin(18, Pin.OUT)\n';
    code += '    in4 = Pin(19, Pin.OUT)\n';

    if (direction === "FORWARD") {
        code += '    in1.value(1)\n';
        code += '    in2.value(0)\n';
        code += '    in3.value(1)\n';
        code += '    in4.value(0)\n';
    } 
    else if (direction === "BACKWARD") {
        code += '    in1.value(0)\n';
        code += '    in2.value(1)\n';
        code += '    in3.value(0)\n';
        code += '    in4.value(1)\n';
    } 
    else if (direction === "LEFT") {
        code += '    in1.value(0)\n';
        code += '    in2.value(1)\n';
        code += '    in3.value(1)\n';
        code += '    in4.value(0)\n';
    } 
    else if (direction === "RIGHT") {
        code += '    in1.value(1)\n';
        code += '    in2.value(0)\n';
        code += '    in3.value(0)\n';
        code += '    in4.value(1)\n';
    } 
    else if (direction === "STOP") {
        code += '    in1.value(0)\n';
        code += '    in2.value(0)\n';
        code += '    in3.value(0)\n';
        code += '    in4.value(0)\n';
    }

    return code;
};

// --- Buzzer ---















// --- Touch ---

pythonGenerator.forBlock['emmi_touch_read'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var mode = block.getFieldValue('MODE');
    var pull = '';
    if (mode === 'INPUT_PULLUP') pull = ', Pin.PULL_UP';
    else if (mode === 'INPUT_PULLDOWN') pull = ', Pin.PULL_DOWN';
    return ['Pin(' + 32 + ', Pin.IN' + pull + ').value()', pythonGenerator.ORDER_ATOMIC];
};

// --- Mic ---

pythonGenerator.forBlock['emmi_mic_read'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var mode = block.getFieldValue('MODE');
    var pull = (mode === 'INPUT_PULLUP') ? ', Pin.PULL_UP' : '';
    return ['Pin(' + 33 + ', Pin.IN' + pull + ').value()', pythonGenerator.ORDER_ATOMIC];
};

// --- Light ---

pythonGenerator.forBlock['emmi_light_read'] = function (block) {
    ensurePythonSetup('light');
    return ['light_sensor.read()', pythonGenerator.ORDER_ATOMIC];
};

// --- MP3 / DFPlayer ---










// ===========================================
// JAVA GENERATORS - EMMI BOT V2
// ===========================================

// --- Eyes ---

javaGenerator.forBlock['emmi_eyes_digital'] = function (block) {
    var pinKey = block.getFieldValue('PIN');
    var state = block.getFieldValue('STATE');
    var pinNum;

    if (pinKey === 'PIN_EYE_RED') pinNum = 13;
    else if (pinKey === 'PIN_EYE_GREEN') pinNum = 12;
    else if (pinKey === 'PIN_EYE_BLUE') pinNum = 14;

    return '        gpio.digitalWrite(' + pinNum + ', GPIO.' + state + ');\n';
};

// --- Wheels ---

javaGenerator.forBlock['emmi_wheels_init'] = function (block) {
    return '        // Initialize wheel motors\n' +
        '        gpio.pinMode(' + 16 + ', GPIO.OUTPUT);\n' +
        '        gpio.pinMode(' + 17 + ', GPIO.OUTPUT);\n' +
        '        gpio.pinMode(' + 18 + ', GPIO.OUTPUT);\n' +
        '        gpio.pinMode(' + 19 + ', GPIO.OUTPUT);\n';
};

javaGenerator.forBlock['emmi_wheels_simple'] = function(block) {

    var direction = block.getFieldValue('DIRECTION');

    var code = '';

    if (direction === "FORWARD") {
        code += '        digitalWrite(16, HIGH);\n';
        code += '        digitalWrite(17, LOW);\n';
        code += '        digitalWrite(18, HIGH);\n';
        code += '        digitalWrite(19, LOW);\n';
    } 
    else if (direction === "BACKWARD") {
        code += '        digitalWrite(16, LOW);\n';
        code += '        digitalWrite(17, HIGH);\n';
        code += '        digitalWrite(18, LOW);\n';
        code += '        digitalWrite(19, HIGH);\n';
    } 
    else if (direction === "LEFT") {
        code += '        digitalWrite(16, LOW);\n';
        code += '        digitalWrite(17, HIGH);\n';
        code += '        digitalWrite(18, HIGH);\n';
        code += '        digitalWrite(19, LOW);\n';
    } 
    else if (direction === "RIGHT") {
        code += '        digitalWrite(16, HIGH);\n';
        code += '        digitalWrite(17, LOW);\n';
        code += '        digitalWrite(18, LOW);\n';
        code += '        digitalWrite(19, HIGH);\n';
    } 
    else if (direction === "STOP") {
        code += '        digitalWrite(16, LOW);\n';
        code += '        digitalWrite(17, LOW);\n';
        code += '        digitalWrite(18, LOW);\n';
        code += '        digitalWrite(19, LOW);\n';
    }

    return code;
};

// --- Buzzer ---











javaGenerator.forBlock['emmi_buzzer_cute'] = function (block) {
    var sound = block.getFieldValue('SOUND');
    return '        buzzer.playCuteSound(' + sound + ');\n';
};

javaGenerator.forBlock['emmi_buzzer_play_tempo'] = function (block) {
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    return '        buzzer.tone(' + note + ', ' + tempo + ');\n';
};

// --- Touch ---

javaGenerator.forBlock['emmi_touch_read'] = function (block) {
    return ['gpio.digitalRead(' + 32 + ')', javaGenerator.ORDER_ATOMIC];
};

// --- Mic ---

javaGenerator.forBlock['emmi_mic_read'] = function (block) {
    return ['gpio.digitalRead(' + 33 + ')', javaGenerator.ORDER_ATOMIC];
};

// --- Light ---

javaGenerator.forBlock['emmi_light_read'] = function (block) {
    return ['adc.read(' + 34 + ')', javaGenerator.ORDER_ATOMIC];
};

// --- MP3 / DFPlayer ---

javaGenerator.forBlock['emmi_mp3_init'] = function (block) {
    javaGenerator.imports_['dfplayer'] = 'import esp32.DFPlayer;';
    var rx = block.getFieldValue('PIN_RX');
    var tx = block.getFieldValue('PIN_TX');
    var vol = javaGenerator.valueToCode(block, 'Volume', javaGenerator.ORDER_ATOMIC) || '20';
    return '        DFPlayer mp3 = new DFPlayer(' + rx + ', ' + tx + ');\n' +
        '        mp3.setVolume(' + vol + ');\n';
};

javaGenerator.forBlock['emmi_mp3_play_track'] = function (block) {
    var track = javaGenerator.valueToCode(block, 'NUM', javaGenerator.ORDER_ATOMIC) || '1';
    return '        mp3.playTrack(' + track + ');\n';
};

javaGenerator.forBlock['emmi_mp3_commands'] = function (block) {
    var cmd = block.getFieldValue('CMD');
    if (cmd === 'PLAY') return '        mp3.play();\n';
    else if (cmd === 'PAUSE') return '        mp3.pause();\n';
    else if (cmd === 'NEXT') return '        mp3.next();\n';
    else if (cmd === 'PREVIOUS') return '        mp3.previous();\n';
    return '';
};

javaGenerator.forBlock['emmi_mp3_volume'] = function (block) {
    var vol = javaGenerator.valueToCode(block, 'VOLUME', javaGenerator.ORDER_ATOMIC) || '20';
    return '        mp3.setVolume(' + vol + ');\n';
};


































arduinoGenerator.forBlock['buzzer_play_rtttls'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = block.getFieldValue('MELODY');
    // Resolve BUZZER label to an actual pin number (default 25)
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    arduinoGenerator.includes_['rtttl'] = '#include <PlayRtttl.hpp>';
    arduinoGenerator.definitions_['buzzer_pin'] = 'const int BUZZER_PIN = ' + pinNum + ';';
    arduinoGenerator.setupCode_['buzzer_setup'] = 'pinMode(BUZZER_PIN, OUTPUT);';
    return 'playRtttlBlockingPGM(BUZZER_PIN, (char*)' + melody + ');\n';
};

pythonGenerator.forBlock['buzzer_play_rtttls'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = block.getFieldValue('MELODY');
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    // MicroPython: no PlayRtttl lib, output a comment + simple beep
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '# Play RTTTL melody: ' + melody + '\n_buz' + pinNum + '.freq(440)\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(200)\n_buz' + pinNum + '.duty(0)\n';
};

javaGenerator.forBlock['buzzer_play_rtttls'] = function (block) {
    var melody = block.getFieldValue('MELODY');
    return '        Buzzer.playRTTTL("' + melody + '");\n';
};

arduinoGenerator.forBlock['buzzer_play_rtttl_customs'] = function (block) {
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

pythonGenerator.forBlock['buzzer_play_rtttl_customs'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = pythonGenerator.valueToCode(block, 'MELODY', pythonGenerator.ORDER_ATOMIC) || '"custom"';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '# Play custom RTTTL: ' + melody + '\n_buz' + pinNum + '.freq(440)\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(200)\n_buz' + pinNum + '.duty(0)\n';
};

javaGenerator.forBlock['buzzer_play_rtttl_customs'] = function (block) {
    var melody = javaGenerator.valueToCode(block, 'MELODY', javaGenerator.ORDER_ATOMIC) || '"StarWars:d=4,o=5,b=45:32p"';
    return '        Buzzer.playRTTTL(' + melody + ');\n';
};

arduinoGenerator.forBlock['buzzer_play_notes'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    arduinoGenerator.definitions_['buzzer_pin'] = 'const int BUZZER_PIN = ' + pinNum + ';';
    arduinoGenerator.setupCode_['buzzer_esp32'] = 'ledcSetup(4, 5000, 8);\nledcAttachPin(BUZZER_PIN, 4);';
    return 'ledcWriteTone(4, ' + note + ');\ndelay(' + tempo + ');\n';
};

pythonGenerator.forBlock['buzzer_play_notes'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var note = block.getFieldValue('NOTE');    // frequency value e.g. "440"
    var tempo = block.getFieldValue('TEMPO');   // duration in ms e.g. "250"
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '_buz' + pinNum + '.freq(' + note + ')\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(' + tempo + ')\n_buz' + pinNum + '.duty(0)\n';
};

javaGenerator.forBlock['buzzer_play_notes'] = function (block) {
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    return '        Buzzer.tone(' + note + ', ' + tempo + ');\n';
};

arduinoGenerator.forBlock['buzzer_play_tones'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var freq = arduinoGenerator.valueToCode(block, 'FREQ', arduinoGenerator.ORDER_ATOMIC) || '880';
    var duration = arduinoGenerator.valueToCode(block, 'DURATION', arduinoGenerator.ORDER_ATOMIC) || '100';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    arduinoGenerator.definitions_['buzzer_pin'] = 'const int BUZZER_PIN = ' + pinNum + ';';
    arduinoGenerator.setupCode_['buzzer_esp32'] = 'ledcSetup(4, 5000, 8);\nledcAttachPin(BUZZER_PIN, 4);';
    return 'ledcWriteTone(4, ' + freq + ');\ndelay(' + duration + ');\nledcWriteTone(4, 0);\n';
};

pythonGenerator.forBlock['buzzer_play_tones'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var freq = pythonGenerator.valueToCode(block, 'FREQ', pythonGenerator.ORDER_ATOMIC) || '880';
    var duration = pythonGenerator.valueToCode(block, 'DURATION', pythonGenerator.ORDER_ATOMIC) || '100';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '_buz' + pinNum + '.freq(' + freq + ')\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(' + duration + ')\n_buz' + pinNum + '.duty(0)\n';
};

javaGenerator.forBlock['buzzer_play_tones'] = function (block) {
    var freq = javaGenerator.valueToCode(block, 'FREQ', javaGenerator.ORDER_ATOMIC) || '880';
    var duration = javaGenerator.valueToCode(block, 'DURATION', javaGenerator.ORDER_ATOMIC) || '100';
    return '        Buzzer.tone(' + freq + ', ' + duration + ');\n';
};

arduinoGenerator.forBlock['buzzer_stops'] = function (block) {
    arduinoGenerator.setupCode_['buzzer_esp32'] = 'ledcSetup(4, 5000, 8);\nledcAttachPin(BUZZER_PIN, 4);';
    return 'ledcWriteTone(4, 0);\n';
};

pythonGenerator.forBlock['buzzer_stops'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return '_buz' + pinNum + '.duty(0)\n';
};

javaGenerator.forBlock['buzzer_stops'] = function (block) {
    return '        Buzzer.noTone();\n';
};

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

javaGenerator.forBlock['buzzer_play_rtttl'] = function (block) {
    var melody = block.getFieldValue('MELODY');
    return '        Buzzer.playRTTTL("' + melody + '");\n';
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

pythonGenerator.forBlock['buzzer_play_rtttl_custom'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var melody = pythonGenerator.valueToCode(block, 'MELODY', pythonGenerator.ORDER_ATOMIC) || '"custom"';
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    pythonGenerator.definitions_['buzzer_' + pinNum] = '_buz' + pinNum + ' = PWM(Pin(' + pinNum + '), freq=440)';
    return '# Play custom RTTTL: ' + melody + '\n_buz' + pinNum + '.freq(440)\n_buz' + pinNum + '.duty(512)\ntime.sleep_ms(200)\n_buz' + pinNum + '.duty(0)\n';
};

javaGenerator.forBlock['buzzer_play_rtttl_custom'] = function (block) {
    var melody = javaGenerator.valueToCode(block, 'MELODY', javaGenerator.ORDER_ATOMIC) || '"StarWars:d=4,o=5,b=45:32p"';
    return '        Buzzer.playRTTTL(' + melody + ');\n';
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

javaGenerator.forBlock['buzzer_play_note'] = function (block) {
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    return '        Buzzer.tone(' + note + ', ' + tempo + ');\n';
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

javaGenerator.forBlock['buzzer_play_tone'] = function (block) {
    var freq = javaGenerator.valueToCode(block, 'FREQ', javaGenerator.ORDER_ATOMIC) || '880';
    var duration = javaGenerator.valueToCode(block, 'DURATION', javaGenerator.ORDER_ATOMIC) || '100';
    return '        Buzzer.tone(' + freq + ', ' + duration + ');\n';
};

arduinoGenerator.forBlock['buzzer_stop'] = function (block) {
    arduinoGenerator.setupCode_['buzzer_esp32'] = 'ledcSetup(4, 5000, 8);\nledcAttachPin(BUZZER_PIN, 4);';
    return 'ledcWriteTone(4, 0);\n';
};

pythonGenerator.forBlock['buzzer_stop'] = function (block) {
    var pin = block.getFieldValue('PIN');
    var pinNum = (pin === 'BUZZER') ? '25' : pin;
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return '_buz' + pinNum + '.duty(0)\n';
};

javaGenerator.forBlock['buzzer_stop'] = function (block) {
    return '        Buzzer.noTone();\n';
};