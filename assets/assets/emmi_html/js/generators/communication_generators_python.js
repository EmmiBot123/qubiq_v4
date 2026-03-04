'use strict';

// ===========================================
// USB Serial Generators - Python
// ===========================================

pythonGenerator.forBlock['usb_serial_init'] = function (block) {
    var baud = block.getFieldValue('BAUD');
    pythonGenerator.imports_['uart'] = 'from machine import UART';
    return 'uart = UART(0, baudrate=' + baud + ')\n';
};

pythonGenerator.forBlock['usb_serial_available'] = function (block) {
    return ['uart.any()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['usb_serial_read_byte'] = function (block) {
    return ['uart.read(1)', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['usb_serial_read_string_until'] = function (block) {
    var untilNewline = block.getFieldValue('UNTIL_NEWLINE') === 'TRUE';
    if (untilNewline) {
        return ['uart.readline()', pythonGenerator.ORDER_ATOMIC];
    } else {
        return ['uart.read().decode()', pythonGenerator.ORDER_ATOMIC];
    }
};

pythonGenerator.forBlock['usb_serial_read_number_until'] = function (block) {
    return ['int(uart.readline())', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['usb_serial_print_format'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'print(' + value + ')\n';
};

pythonGenerator.forBlock['usb_serial_print_same_line'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'print(' + value + ', end="")\n';
};

pythonGenerator.forBlock['usb_serial_print_new_line'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'print(' + value + ')\n';
};

pythonGenerator.forBlock['usb_serial_write'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'uart.write(bytes([' + value + ']))\n';
};

// ===========================================
// Bluetooth Serial Generators - Python
// ===========================================

pythonGenerator.forBlock['bluetooth_serial_init'] = function (block) {
    pythonGenerator.imports_['bluetooth'] = 'import bluetooth';
    var name = block.getFieldValue('NAME');
    return 'bt = bluetooth.BLE()\nbt.active(True)\n# BLE advertise as "' + name + '"\n';
};

pythonGenerator.forBlock['bluetooth_serial_available'] = function (block) {
    return ['bt.available()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['bluetooth_serial_read_byte'] = function (block) {
    return ['bt.read(1)', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['bluetooth_serial_read_string_until'] = function (block) {
    var untilNewline = block.getFieldValue('UNTIL_NEWLINE') === 'TRUE';
    if (untilNewline) {
        return ['bt.readline()', pythonGenerator.ORDER_ATOMIC];
    } else {
        return ['bt.read().decode()', pythonGenerator.ORDER_ATOMIC];
    }
};

pythonGenerator.forBlock['bluetooth_serial_read_number_until'] = function (block) {
    return ['int(bt.readline())', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['bluetooth_serial_print_format'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'bt.write(str(' + value + '))\n';
};

pythonGenerator.forBlock['bluetooth_serial_print_same_line'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'bt.write(str(' + value + '))\n';
};

pythonGenerator.forBlock['bluetooth_serial_print_new_line'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'bt.write(str(' + value + ') + "\\n")\n';
};

pythonGenerator.forBlock['bluetooth_serial_write'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'bt.write(bytes([' + value + ']))\n';
};

console.log('Python communication generators loaded');
