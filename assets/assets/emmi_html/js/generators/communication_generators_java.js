'use strict';

// ===========================================
// USB Serial Generators - Java
// ===========================================

javaGenerator.forBlock['usb_serial_init'] = function (block) {
    var baud = block.getFieldValue('BAUD');
    return '        serial = new Serial(' + baud + ');\n';
};

javaGenerator.forBlock['usb_serial_available'] = function (block) {
    return ['serial.available()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['usb_serial_read_byte'] = function (block) {
    return ['serial.read()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['usb_serial_read_string_until'] = function (block) {
    var untilNewline = block.getFieldValue('UNTIL_NEWLINE') === 'TRUE';
    if (untilNewline) {
        return ['serial.readStringUntil("\\n")', javaGenerator.ORDER_ATOMIC];
    } else {
        return ['serial.readString()', javaGenerator.ORDER_ATOMIC];
    }
};

javaGenerator.forBlock['usb_serial_read_number_until'] = function (block) {
    return ['Integer.parseInt(serial.readString().trim())', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['usb_serial_print_format'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    return '        System.out.printf("%" + "' + format + '", ' + value + ');\n';
};

javaGenerator.forBlock['usb_serial_print_same_line'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '""';
    return '        System.out.print(' + value + ');\n';
};

javaGenerator.forBlock['usb_serial_print_new_line'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '""';
    return '        System.out.println(' + value + ');\n';
};

javaGenerator.forBlock['usb_serial_write'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        serial.write(' + value + ');\n';
};

// ===========================================
// Bluetooth Serial Generators - Java
// ===========================================

javaGenerator.forBlock['bluetooth_serial_init'] = function (block) {
    javaGenerator.imports_['bluetooth'] = 'import esp32.BluetoothSerial;';
    var name = block.getFieldValue('NAME');
    return '        BluetoothSerial serialBT = new BluetoothSerial();\n        serialBT.begin("' + name + '");\n';
};

javaGenerator.forBlock['bluetooth_serial_available'] = function (block) {
    return ['serialBT.available()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['bluetooth_serial_read_byte'] = function (block) {
    return ['serialBT.read()', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['bluetooth_serial_read_string_until'] = function (block) {
    var untilNewline = block.getFieldValue('UNTIL_NEWLINE') === 'TRUE';
    if (untilNewline) {
        return ['serialBT.readStringUntil("\\n")', javaGenerator.ORDER_ATOMIC];
    } else {
        return ['serialBT.readString()', javaGenerator.ORDER_ATOMIC];
    }
};

javaGenerator.forBlock['bluetooth_serial_read_number_until'] = function (block) {
    return ['Integer.parseInt(serialBT.readString().trim())', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['bluetooth_serial_print_format'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    return '        serialBT.printf("%" + "' + format + '", ' + value + ');\n';
};

javaGenerator.forBlock['bluetooth_serial_print_same_line'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '""';
    return '        serialBT.print(' + value + ');\n';
};

javaGenerator.forBlock['bluetooth_serial_print_new_line'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '""';
    return '        serialBT.println(' + value + ');\n';
};

javaGenerator.forBlock['bluetooth_serial_write'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        serialBT.write(' + value + ');\n';
};

console.log('Java communication generators loaded');
