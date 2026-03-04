'use strict';

// ===========================================
// EMMI BOT V2 Generators - Python (MicroPython)
// ===========================================

// Pin Definitions (same as Arduino version)
const PY_PIN_EYE_RED = 13;
const PY_PIN_EYE_GREEN = 12;
const PY_PIN_EYE_BLUE = 14;
const PY_PIN_MOTOR_L_A = 16;
const PY_PIN_MOTOR_L_B = 17;
const PY_PIN_MOTOR_R_A = 18;
const PY_PIN_MOTOR_R_B = 19;
const PY_PIN_BUZZER = 25;
const PY_PIN_TOUCH = 32;
const PY_PIN_MIC = 33;
const PY_PIN_LIGHT = 34;

// ===========================================
// Eyes
// ===========================================

pythonGenerator.forBlock['emmi_eyes_digital'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var pinKey = block.getFieldValue('PIN');
    var state = block.getFieldValue('STATE');
    var pinNum;

    if (pinKey === 'PIN_EYE_RED') pinNum = PY_PIN_EYE_RED;
    else if (pinKey === 'PIN_EYE_GREEN') pinNum = PY_PIN_EYE_GREEN;
    else if (pinKey === 'PIN_EYE_BLUE') pinNum = PY_PIN_EYE_BLUE;

    return 'Pin(' + pinNum + ', Pin.OUT).value(' + (state === 'HIGH' ? '1' : '0') + ')\n';
};

// ===========================================
// Wheels
// ===========================================

pythonGenerator.forBlock['emmi_wheels_init'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return '# Wheels initialized\n';
};

pythonGenerator.forBlock['emmi_wheels_simple'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    var direction = block.getFieldValue('DIRECTION');
    var speed = block.getFieldValue('SPEED');
    var step = block.getFieldValue('STEP');

    var code = '# Wheels: ' + direction + ' at ' + speed + ' for ' + step + '\n';

    var l_a = '0', l_b = '0', r_a = '0', r_b = '0';

    if (direction === 'FORWARD') { l_a = '1'; r_a = '1'; }
    else if (direction === 'BACKWARD') { l_b = '1'; r_b = '1'; }
    else if (direction === 'LEFT') { l_b = '1'; r_a = '1'; }
    else if (direction === 'RIGHT') { l_a = '1'; r_b = '1'; }

    code += 'Pin(' + PY_PIN_MOTOR_L_A + ', Pin.OUT).value(' + l_a + ')\n';
    code += 'Pin(' + PY_PIN_MOTOR_L_B + ', Pin.OUT).value(' + l_b + ')\n';
    code += 'Pin(' + PY_PIN_MOTOR_R_A + ', Pin.OUT).value(' + r_a + ')\n';
    code += 'Pin(' + PY_PIN_MOTOR_R_B + ', Pin.OUT).value(' + r_b + ')\n';
    code += 'time.sleep(' + step + ')\n';
    code += '# Stop after step\n';
    code += 'Pin(' + PY_PIN_MOTOR_L_A + ', Pin.OUT).value(0)\n';
    code += 'Pin(' + PY_PIN_MOTOR_L_B + ', Pin.OUT).value(0)\n';
    code += 'Pin(' + PY_PIN_MOTOR_R_A + ', Pin.OUT).value(0)\n';
    code += 'Pin(' + PY_PIN_MOTOR_R_B + ', Pin.OUT).value(0)\n';

    return code;
};

// ===========================================
// Buzzer
// ===========================================

pythonGenerator.forBlock['emmi_buzzer_music'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var ringtone = block.getFieldValue('MELODY');
    return '# Play melody: ' + ringtone + '\nbuzzer_play_melody("' + ringtone + '")\n';
};

pythonGenerator.forBlock['emmi_buzzer_music_custom'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var rtttl_melody = pythonGenerator.valueToCode(block, 'MELODY', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'buzzer_play_rtttl(' + rtttl_melody + ')\n';
};

pythonGenerator.forBlock['emmi_buzzer_note'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    var note = block.getFieldValue('NOTE');
    return 'buzzer = PWM(Pin(' + PY_PIN_BUZZER + '), freq=' + note + ', duty=512)\ntime.sleep_ms(500)\nbuzzer.deinit()\n';
};

pythonGenerator.forBlock['emmi_buzzer_frequency'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['time'] = 'import time';
    var freq = pythonGenerator.valueToCode(block, 'FREQUENCY', pythonGenerator.ORDER_ATOMIC) || '1000';
    var duration = pythonGenerator.valueToCode(block, 'DURATION', pythonGenerator.ORDER_ATOMIC) || '500';
    return 'buzzer = PWM(Pin(' + PY_PIN_BUZZER + '), freq=' + freq + ', duty=512)\ntime.sleep_ms(' + duration + ')\nbuzzer.deinit()\n';
};

pythonGenerator.forBlock['emmi_buzzer_stop'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return 'PWM(Pin(' + PY_PIN_BUZZER + ')).deinit()\n';
};

pythonGenerator.forBlock['emmi_buzzer_cute'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var sound = block.getFieldValue('SOUND');
    return '# Play cute sound: ' + sound + '\ncute_play(' + sound + ')\n';
};

pythonGenerator.forBlock['emmi_buzzer_play_tempo'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    return 'buzzer = PWM(Pin(' + PY_PIN_BUZZER + '), freq=' + note + ', duty=512)\n';
};

// ===========================================
// Touch
// ===========================================

pythonGenerator.forBlock['emmi_touch_read'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var mode = block.getFieldValue('MODE');
    return ['Pin(' + PY_PIN_TOUCH + ', Pin.IN).value()', pythonGenerator.ORDER_ATOMIC];
};

// ===========================================
// Mic
// ===========================================

pythonGenerator.forBlock['emmi_mic_read'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var mode = block.getFieldValue('MODE');
    return ['Pin(' + PY_PIN_MIC + ', Pin.IN).value()', pythonGenerator.ORDER_ATOMIC];
};

// ===========================================
// Light
// ===========================================

pythonGenerator.forBlock['emmi_light_read'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    return ['ADC(Pin(' + PY_PIN_LIGHT + ')).read()', pythonGenerator.ORDER_ATOMIC];
};

// ===========================================
// MP3 / DFPlayer Mini
// ===========================================

pythonGenerator.forBlock['emmi_mp3_init'] = function (block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    pythonGenerator.imports_['uart_mp3'] = 'from machine import UART';
    pythonGenerator.imports_['time'] = 'import time';

    var rx = block.getFieldValue('PIN_RX');
    var tx = block.getFieldValue('PIN_TX');
    var vol = pythonGenerator.valueToCode(block, 'Volume', pythonGenerator.ORDER_ATOMIC) || '20';
    var play = block.getFieldValue('PLAY') === 'TRUE';

    pythonGenerator.definitions_['mp3_helper'] =
        'mp3_uart = UART(1, baudrate=9600, tx=Pin(' + tx + '), rx=Pin(' + rx + '))\n' +
        'def mp3_cmd(cmd, par1=0, par2=0):\n' +
        '    chk = -(0xFF + 0x06 + cmd + 0x00 + par1 + par2)\n' +
        '    data = bytes([0x7E, 0xFF, 0x06, cmd, 0x00, par1, par2, (chk >> 8) & 0xFF, chk & 0xFF, 0xEF])\n' +
        '    mp3_uart.write(data)';

    var code = 'time.sleep(1)\nmp3_cmd(0x3F)\nmp3_cmd(0x06, 0, ' + vol + ')\n';
    if (play) {
        code += 'mp3_cmd(0x11, 0, 1)\n';
    }
    return code;
};

pythonGenerator.forBlock['emmi_mp3_play_track'] = function (block) {
    var track = pythonGenerator.valueToCode(block, 'NUM', pythonGenerator.ORDER_ATOMIC) || '1';
    return 'mp3_cmd(0x03, 0, ' + track + ')\n';
};

pythonGenerator.forBlock['emmi_mp3_commands'] = function (block) {
    var cmd = block.getFieldValue('CMD');
    if (cmd === 'PLAY') return 'mp3_cmd(0x0D, 0, 1)\n';
    else if (cmd === 'PAUSE') return 'mp3_cmd(0x0E, 0, 0)\n';
    else if (cmd === 'NEXT') return 'mp3_cmd(0x01, 0, 1)\n';
    else if (cmd === 'PREVIOUS') return 'mp3_cmd(0x02, 0, 1)\n';
    return '';
};

pythonGenerator.forBlock['emmi_mp3_volume'] = function (block) {
    var vol = pythonGenerator.valueToCode(block, 'VOLUME', pythonGenerator.ORDER_ATOMIC) || '20';
    return 'mp3_cmd(0x06, 0, ' + vol + ')\n';
};

console.log('Python EMMI bot v2 generators loaded');
