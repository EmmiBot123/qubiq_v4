'use strict';

// ===========================================
// EMMI BOT V2 Generators - Java
// ===========================================

// Pin Definitions (same as Arduino version)
const JAVA_PIN_EYE_RED = 13;
const JAVA_PIN_EYE_GREEN = 12;
const JAVA_PIN_EYE_BLUE = 14;
const JAVA_PIN_MOTOR_L_A = 16;
const JAVA_PIN_MOTOR_L_B = 17;
const JAVA_PIN_MOTOR_R_A = 18;
const JAVA_PIN_MOTOR_R_B = 19;
const JAVA_PIN_BUZZER = 25;
const JAVA_PIN_TOUCH = 32;
const JAVA_PIN_MIC = 33;
const JAVA_PIN_LIGHT = 34;

// ===========================================
// Eyes
// ===========================================

javaGenerator.forBlock['emmi_eyes_digital'] = function (block) {
    var pinKey = block.getFieldValue('PIN');
    var state = block.getFieldValue('STATE');
    var pinNum;

    if (pinKey === 'PIN_EYE_RED') pinNum = JAVA_PIN_EYE_RED;
    else if (pinKey === 'PIN_EYE_GREEN') pinNum = JAVA_PIN_EYE_GREEN;
    else if (pinKey === 'PIN_EYE_BLUE') pinNum = JAVA_PIN_EYE_BLUE;

    return '        gpio.digitalWrite(' + pinNum + ', GPIO.' + state + ');\n';
};

// ===========================================
// Wheels
// ===========================================

javaGenerator.forBlock['emmi_wheels_init'] = function (block) {
    return '        // Wheels initialized\n';
};

javaGenerator.forBlock['emmi_wheels_simple'] = function (block) {
    var direction = block.getFieldValue('DIRECTION');
    var speed = block.getFieldValue('SPEED');
    var step = block.getFieldValue('STEP');

    var code = '        // Wheels: ' + direction + ' at ' + speed + ' for ' + step + '\n';

    var l_a = 'LOW', l_b = 'LOW', r_a = 'LOW', r_b = 'LOW';

    if (direction === 'FORWARD') { l_a = 'HIGH'; r_a = 'HIGH'; }
    else if (direction === 'BACKWARD') { l_b = 'HIGH'; r_b = 'HIGH'; }
    else if (direction === 'LEFT') { l_b = 'HIGH'; r_a = 'HIGH'; }
    else if (direction === 'RIGHT') { l_a = 'HIGH'; r_b = 'HIGH'; }

    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_L_A + ', GPIO.' + l_a + ');\n';
    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_L_B + ', GPIO.' + l_b + ');\n';
    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_R_A + ', GPIO.' + r_a + ');\n';
    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_R_B + ', GPIO.' + r_b + ');\n';
    code += '        Thread.sleep(' + step + ' * 1000);\n';
    code += '        // Stop after step\n';
    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_L_A + ', GPIO.LOW);\n';
    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_L_B + ', GPIO.LOW);\n';
    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_R_A + ', GPIO.LOW);\n';
    code += '        gpio.digitalWrite(' + JAVA_PIN_MOTOR_R_B + ', GPIO.LOW);\n';

    return code;
};

// ===========================================
// Buzzer
// ===========================================

javaGenerator.forBlock['emmi_buzzer_music'] = function (block) {
    var ringtone = block.getFieldValue('MELODY');
    return '        buzzer.playMelody("' + ringtone + '");\n';
};

javaGenerator.forBlock['emmi_buzzer_music_custom'] = function (block) {
    var rtttl_melody = javaGenerator.valueToCode(block, 'MELODY', javaGenerator.ORDER_ATOMIC) || '""';
    return '        buzzer.playRTTTL(' + rtttl_melody + ');\n';
};

javaGenerator.forBlock['emmi_buzzer_note'] = function (block) {
    var note = block.getFieldValue('NOTE');
    return '        buzzer.playTone(' + note + ', 500);\n';
};

javaGenerator.forBlock['emmi_buzzer_frequency'] = function (block) {
    var freq = javaGenerator.valueToCode(block, 'FREQUENCY', javaGenerator.ORDER_ATOMIC) || '1000';
    var duration = javaGenerator.valueToCode(block, 'DURATION', javaGenerator.ORDER_ATOMIC) || '500';
    return '        buzzer.playTone(' + freq + ', ' + duration + ');\n';
};

javaGenerator.forBlock['emmi_buzzer_stop'] = function (block) {
    return '        buzzer.stop();\n';
};

javaGenerator.forBlock['emmi_buzzer_cute'] = function (block) {
    javaGenerator.imports_['cute_sounds'] = 'import esp32.CuteBuzzerSounds;';
    var sound = block.getFieldValue('SOUND');
    return '        CuteBuzzerSounds.play(' + sound + ');\n';
};

javaGenerator.forBlock['emmi_buzzer_play_tempo'] = function (block) {
    var note = block.getFieldValue('NOTE');
    var tempo = block.getFieldValue('TEMPO');
    return '        buzzer.playTone(' + note + ');\n';
};

// ===========================================
// Touch
// ===========================================

javaGenerator.forBlock['emmi_touch_read'] = function (block) {
    var mode = block.getFieldValue('MODE');
    return ['gpio.digitalRead(' + JAVA_PIN_TOUCH + ')', javaGenerator.ORDER_ATOMIC];
};

// ===========================================
// Mic
// ===========================================

javaGenerator.forBlock['emmi_mic_read'] = function (block) {
    var mode = block.getFieldValue('MODE');
    return ['gpio.digitalRead(' + JAVA_PIN_MIC + ')', javaGenerator.ORDER_ATOMIC];
};

// ===========================================
// Light
// ===========================================

javaGenerator.forBlock['emmi_light_read'] = function (block) {
    return ['adc.read(' + JAVA_PIN_LIGHT + ')', javaGenerator.ORDER_ATOMIC];
};

// ===========================================
// MP3 / DFPlayer Mini
// ===========================================

javaGenerator.forBlock['emmi_mp3_init'] = function (block) {
    javaGenerator.imports_['dfplayer'] = 'import esp32.DFPlayer;';
    var rx = block.getFieldValue('PIN_RX');
    var tx = block.getFieldValue('PIN_TX');
    var vol = javaGenerator.valueToCode(block, 'Volume', javaGenerator.ORDER_ATOMIC) || '20';
    var play = block.getFieldValue('PLAY') === 'TRUE';

    var code = '        DFPlayer mp3 = new DFPlayer(' + rx + ', ' + tx + ');\n';
    code += '        mp3.setVolume(' + vol + ');\n';
    if (play) {
        code += '        mp3.play(1);\n';
    }
    return code;
};

javaGenerator.forBlock['emmi_mp3_play_track'] = function (block) {
    var track = javaGenerator.valueToCode(block, 'NUM', javaGenerator.ORDER_ATOMIC) || '1';
    return '        mp3.play(' + track + ');\n';
};

javaGenerator.forBlock['emmi_mp3_commands'] = function (block) {
    var cmd = block.getFieldValue('CMD');
    if (cmd === 'PLAY') return '        mp3.resume();\n';
    else if (cmd === 'PAUSE') return '        mp3.pause();\n';
    else if (cmd === 'NEXT') return '        mp3.next();\n';
    else if (cmd === 'PREVIOUS') return '        mp3.previous();\n';
    return '';
};

javaGenerator.forBlock['emmi_mp3_volume'] = function (block) {
    var vol = javaGenerator.valueToCode(block, 'VOLUME', javaGenerator.ORDER_ATOMIC) || '20';
    return '        mp3.setVolume(' + vol + ');\n';
};

console.log('Java EMMI bot v2 generators loaded');
