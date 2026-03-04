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

arduinoGenerator.forBlock['emmi_wheels_simple'] = function (block) {
    ensureSetup('wheels');
    var direction = block.getFieldValue('DIRECTION');
    var speed = block.getFieldValue('SPEED');
    var step = Number(block.getFieldValue('STEP') || 1);
    var stepMs = Math.max(0, Math.round(step * 1000));

    var la = 'LOW', lb = 'LOW', ra = 'LOW', rb = 'LOW';
    if (direction === 'FORWARD') { la = 'HIGH'; ra = 'HIGH'; }
    else if (direction === 'BACKWARD') { lb = 'HIGH'; rb = 'HIGH'; }
    else if (direction === 'LEFT') { lb = 'HIGH'; ra = 'HIGH'; }
    else if (direction === 'RIGHT') { la = 'HIGH'; rb = 'HIGH'; }

    var code = '  // Wheels: ' + direction + ' speed ' + speed + '\n';
    code += '  digitalWrite(16, ' + la + ');\n';
    code += '  digitalWrite(17, ' + lb + ');\n';
    code += '  digitalWrite(18, ' + ra + ');\n';
    code += '  digitalWrite(19, ' + rb + ');\n';
    code += '  delay(' + stepMs + ');\n';
    code += '  digitalWrite(16, LOW);\n';
    code += '  digitalWrite(17, LOW);\n';
    code += '  digitalWrite(18, LOW);\n';
    code += '  digitalWrite(19, LOW);\n';
    return code;
};

// --- Buzzer ---

arduinoGenerator.forBlock['emmi_buzzer_music'] = function (block) {
    ensureSetup('buzzer');
    var ringtone = block.getFieldValue('MELODY');
    return '  // RTTTL melody preset: ' + ringtone + '\n';
};

arduinoGenerator.forBlock['emmi_buzzer_music_custom'] = function (block) {
    ensureSetup('buzzer');
    var melody = arduinoGenerator.valueToCode(block, 'MELODY', arduinoGenerator.ORDER_ATOMIC) || '""';
    return '  // RTTTL melody: ' + melody + '\n';
};

arduinoGenerator.forBlock['emmi_buzzer_note'] = function (block) {
    ensureSetup('buzzer');
    var note = block.getFieldValue('NOTE');
    return '  tone(25, ' + note + ', 500);\n' +
        '  delay(500);\n' +
        '  noTone(25);\n';
};

arduinoGenerator.forBlock['emmi_buzzer_frequency'] = function (block) {
    ensureSetup('buzzer');
    var freq = arduinoGenerator.valueToCode(block, 'FREQUENCY', arduinoGenerator.ORDER_ATOMIC) || '1000';
    var duration = arduinoGenerator.valueToCode(block, 'DURATION', arduinoGenerator.ORDER_ATOMIC) || '500';
    return '  tone(25, ' + freq + ', ' + duration + ');\n' +
        '  delay(' + duration + ');\n' +
        '  noTone(25);\n';
};

arduinoGenerator.forBlock['emmi_buzzer_stop'] = function (block) {
    ensureSetup('buzzer');
    return '  noTone(25);\n';
};





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

pythonGenerator.forBlock['emmi_wheels_simple'] = function (block) {
    ensurePythonSetup('wheels');
    pythonGenerator.imports_['time'] = 'import time';
    var direction = block.getFieldValue('DIRECTION');
    var speed = block.getFieldValue('SPEED');
    var step = block.getFieldValue('STEP');

    var la = '0', lb = '0', ra = '0', rb = '0';
    if (direction === 'FORWARD') { la = '1'; ra = '1'; }
    else if (direction === 'BACKWARD') { lb = '1'; rb = '1'; }
    else if (direction === 'LEFT') { lb = '1'; ra = '1'; }
    else if (direction === 'RIGHT') { la = '1'; rb = '1'; }

    var code = '# Wheels: ' + direction + ' at ' + speed + ' for ' + step + '\n';
    code += 'motor_la.value(' + la + ')\n';
    code += 'motor_lb.value(' + lb + ')\n';
    code += 'motor_ra.value(' + ra + ')\n';
    code += 'motor_rb.value(' + rb + ')\n';
    code += 'time.sleep(' + step + ')\n';
    code += '# Stop\n';
    code += 'motor_la.value(0)\nmotor_lb.value(0)\nmotor_ra.value(0)\nmotor_rb.value(0)\n';
    return code;
};

// --- Buzzer ---

pythonGenerator.forBlock['emmi_buzzer_music'] = function (block) {
    ensurePythonSetup('buzzer');
    var ringtone = block.getFieldValue('MELODY');
    return '# Play melody: ' + ringtone + '\n# RTTTL playback requires rtttl library\n';
};

pythonGenerator.forBlock['emmi_buzzer_music_custom'] = function (block) {
    ensurePythonSetup('buzzer');
    var rtttl_melody = pythonGenerator.valueToCode(block, 'MELODY', pythonGenerator.ORDER_ATOMIC) || '""';
    return '# Play custom RTTTL: ' + rtttl_melody + '\n';
};

pythonGenerator.forBlock['emmi_buzzer_note'] = function (block) {
    ensurePythonSetup('buzzer');
    pythonGenerator.imports_['time'] = 'import time';
    var note = block.getFieldValue('NOTE');
    return 'buzzer.freq(' + note + ')\nbuzzer.duty(512)\ntime.sleep_ms(500)\nbuzzer.duty(0)\n';
};

pythonGenerator.forBlock['emmi_buzzer_frequency'] = function (block) {
    ensurePythonSetup('buzzer');
    pythonGenerator.imports_['time'] = 'import time';
    var freq = pythonGenerator.valueToCode(block, 'FREQUENCY', pythonGenerator.ORDER_ATOMIC) || '1000';
    var duration = pythonGenerator.valueToCode(block, 'DURATION', pythonGenerator.ORDER_ATOMIC) || '500';
    return 'buzzer.freq(' + freq + ')\nbuzzer.duty(512)\ntime.sleep_ms(' + duration + ')\nbuzzer.duty(0)\n';
};

pythonGenerator.forBlock['emmi_buzzer_stop'] = function (block) {
    ensurePythonSetup('buzzer');
    return 'buzzer.duty(0)\n';
};





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

javaGenerator.forBlock['emmi_wheels_simple'] = function (block) {
    var direction = block.getFieldValue('DIRECTION');
    var speed = block.getFieldValue('SPEED');
    var step = block.getFieldValue('STEP');

    var la = 'LOW', lb = 'LOW', ra = 'LOW', rb = 'LOW';
    if (direction === 'FORWARD') { la = 'HIGH'; ra = 'HIGH'; }
    else if (direction === 'BACKWARD') { lb = 'HIGH'; rb = 'HIGH'; }
    else if (direction === 'LEFT') { lb = 'HIGH'; ra = 'HIGH'; }
    else if (direction === 'RIGHT') { la = 'HIGH'; rb = 'HIGH'; }

    var code = '        // Wheels: ' + direction + ' at ' + speed + ' for ' + step + '\n';
    code += '        gpio.digitalWrite(' + 16 + ', GPIO.' + la + ');\n';
    code += '        gpio.digitalWrite(' + 17 + ', GPIO.' + lb + ');\n';
    code += '        gpio.digitalWrite(' + 18 + ', GPIO.' + ra + ');\n';
    code += '        gpio.digitalWrite(' + 19 + ', GPIO.' + rb + ');\n';
    code += '        Thread.sleep(' + step + ' * 1000);\n';
    code += '        // Stop\n';
    code += '        gpio.digitalWrite(' + 16 + ', GPIO.LOW);\n';
    code += '        gpio.digitalWrite(' + 17 + ', GPIO.LOW);\n';
    code += '        gpio.digitalWrite(' + 18 + ', GPIO.LOW);\n';
    code += '        gpio.digitalWrite(' + 19 + ', GPIO.LOW);\n';
    return code;
};

// --- Buzzer ---

javaGenerator.forBlock['emmi_buzzer_music'] = function (block) {
    var ringtone = block.getFieldValue('MELODY');
    return '        buzzer.playRtttl(' + ringtone + ');\n';
};

javaGenerator.forBlock['emmi_buzzer_music_custom'] = function (block) {
    var rtttl_melody = javaGenerator.valueToCode(block, 'MELODY', javaGenerator.ORDER_ATOMIC) || '""';
    return '        buzzer.playRtttl(' + rtttl_melody + ');\n';
};

javaGenerator.forBlock['emmi_buzzer_note'] = function (block) {
    var note = block.getFieldValue('NOTE');
    return '        buzzer.tone(' + note + ', 500);\n';
};

javaGenerator.forBlock['emmi_buzzer_frequency'] = function (block) {
    var freq = javaGenerator.valueToCode(block, 'FREQUENCY', javaGenerator.ORDER_ATOMIC) || '1000';
    var duration = javaGenerator.valueToCode(block, 'DURATION', javaGenerator.ORDER_ATOMIC) || '500';
    return '        buzzer.tone(' + freq + ', ' + duration + ');\n';
};

javaGenerator.forBlock['emmi_buzzer_stop'] = function (block) {
    return '        buzzer.noTone();\n';
};

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
































