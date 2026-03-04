'use strict';

// ===========================================
// USB Serial Generators
// ===========================================

javaGenerator.forBlock['usb_serial_init'] = function (block) {
    var baud = block.getFieldValue('BAUD');
    return '        Serial serial = new Serial(' + baud + ');\n';
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
        return ['serial.readStringUntil(\'\\n\')', javaGenerator.ORDER_ATOMIC];
    } else {
        return ['serial.readString()', javaGenerator.ORDER_ATOMIC];
    }
};

javaGenerator.forBlock['usb_serial_read_number_until'] = function (block) {
    return ['Integer.parseInt(serial.readString())', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['usb_serial_print_format'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    if (format === 'HEX') {
        return '        serial.print(Integer.toHexString(' + value + '));\n';
    } else if (format === 'BIN') {
        return '        serial.print(Integer.toBinaryString(' + value + '));\n';
    }
    return '        serial.print(' + value + ');\n';
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
// Bluetooth Serial Generators
// ===========================================

function addBluetoothSetup() {
    arduinoGenerator.includes_['include_bluetooth'] = '#include "BluetoothSerial.h"';
    arduinoGenerator.variables_['define_bluetooth'] = 'BluetoothSerial SerialBT;';
}

javaGenerator.forBlock['bluetooth_serial_init'] = function (block) {
    javaGenerator.imports_['bluetooth'] = 'import esp32.BluetoothSerial;';
    var name = block.getFieldValue('NAME');
    return '        BluetoothSerial serialBT = new BluetoothSerial();\n' +
        '        serialBT.begin("' + name + '");\n';
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
        return ['serialBT.readStringUntil(\'\\n\')', javaGenerator.ORDER_ATOMIC];
    } else {
        return ['serialBT.readString()', javaGenerator.ORDER_ATOMIC];
    }
};

javaGenerator.forBlock['bluetooth_serial_read_number_until'] = function (block) {
    return ['Integer.parseInt(serialBT.readString())', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['bluetooth_serial_print_format'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    if (format === 'HEX') {
        return '        serialBT.print(Integer.toHexString(' + value + '));\n';
    } else if (format === 'BIN') {
        return '        serialBT.print(Integer.toBinaryString(' + value + '));\n';
    }
    return '        serialBT.print(' + value + ');\n';
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

// ===========================================
// Python USB Serial Generators
// ===========================================

pythonGenerator.forBlock['usb_serial_init'] = function (block) {
    // MicroPython UART is typically preconfigured; USB serial uses print/input
    return '# Serial initialized (USB uses print/input in MicroPython)\n';
};

pythonGenerator.forBlock['usb_serial_available'] = function (block) {
    pythonGenerator.imports_['sys'] = 'import sys';
    return ['sys.stdin.readable()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['usb_serial_read_byte'] = function (block) {
    pythonGenerator.imports_['sys'] = 'import sys';
    return ['sys.stdin.read(1)', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['usb_serial_read_string_until'] = function (block) {
    var untilNewline = block.getFieldValue('UNTIL_NEWLINE') === 'TRUE';
    if (untilNewline) {
        return ['input()', pythonGenerator.ORDER_ATOMIC];
    } else {
        return ['input()', pythonGenerator.ORDER_ATOMIC];
    }
};

pythonGenerator.forBlock['usb_serial_read_number_until'] = function (block) {
    return ['int(input())', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['usb_serial_print_format'] = function (block) {
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    if (format === 'HEX') {
        return 'print(hex(' + value + '))\n';
    } else if (format === 'BIN') {
        return 'print(bin(' + value + '))\n';
    } else if (format === 'OCT') {
        return 'print(oct(' + value + '))\n';
    }
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
    pythonGenerator.imports_['sys'] = 'import sys';
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'sys.stdout.write(chr(' + value + '))\n';
};

// ===========================================
// Python Bluetooth Serial Generators
// ===========================================

function addPythonBluetoothSetup() {
    pythonGenerator.imports_['bluetooth'] = 'import bluetooth';
    pythonGenerator.definitions_['bt_ble'] = 'ble = bluetooth.BLE()';
}

pythonGenerator.forBlock['bluetooth_serial_init'] = function (block) {
    addPythonBluetoothSetup();
    var name = block.getFieldValue('NAME');
    return 'ble.active(True)\nble.config(gap_name="' + name + '")\n';
};

pythonGenerator.forBlock['bluetooth_serial_available'] = function (block) {
    addPythonBluetoothSetup();
    return ['ble.available()', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['bluetooth_serial_read_byte'] = function (block) {
    addPythonBluetoothSetup();
    return ['ble.read(1)', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['bluetooth_serial_read_string_until'] = function (block) {
    addPythonBluetoothSetup();
    var untilNewline = block.getFieldValue('UNTIL_NEWLINE') === 'TRUE';
    if (untilNewline) {
        return ['ble.readline()', pythonGenerator.ORDER_ATOMIC];
    } else {
        return ['ble.read()', pythonGenerator.ORDER_ATOMIC];
    }
};

pythonGenerator.forBlock['bluetooth_serial_read_number_until'] = function (block) {
    addPythonBluetoothSetup();
    return ['int(ble.readline())', pythonGenerator.ORDER_ATOMIC];
};

pythonGenerator.forBlock['bluetooth_serial_print_format'] = function (block) {
    addPythonBluetoothSetup();
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    if (format === 'HEX') {
        return 'ble.write(hex(' + value + '))\n';
    } else if (format === 'BIN') {
        return 'ble.write(bin(' + value + '))\n';
    }
    return 'ble.write(str(' + value + '))\n';
};

pythonGenerator.forBlock['bluetooth_serial_print_same_line'] = function (block) {
    addPythonBluetoothSetup();
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'ble.write(' + value + ')\n';
};

pythonGenerator.forBlock['bluetooth_serial_print_new_line'] = function (block) {
    addPythonBluetoothSetup();
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '""';
    return 'ble.write(' + value + ' + "\\n")\n';
};

pythonGenerator.forBlock['bluetooth_serial_write'] = function (block) {
    addPythonBluetoothSetup();
    var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return 'ble.write(bytes([' + value + ']))\n';
};

// ===========================================
// Java USB Serial Generators
// ===========================================

javaGenerator.forBlock['usb_serial_init'] = function (block) {
    var baud = block.getFieldValue('BAUD');
    return '        Serial serial = new Serial(' + baud + ');\n';
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
        return ['serial.readStringUntil(\'\\n\')', javaGenerator.ORDER_ATOMIC];
    } else {
        return ['serial.readString()', javaGenerator.ORDER_ATOMIC];
    }
};

javaGenerator.forBlock['usb_serial_read_number_until'] = function (block) {
    return ['Integer.parseInt(serial.readString())', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['usb_serial_print_format'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    if (format === 'HEX') {
        return '        serial.print(Integer.toHexString(' + value + '));\n';
    } else if (format === 'BIN') {
        return '        serial.print(Integer.toBinaryString(' + value + '));\n';
    }
    return '        serial.print(' + value + ');\n';
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
// Java Bluetooth Serial Generators
// ===========================================

javaGenerator.forBlock['bluetooth_serial_init'] = function (block) {
    javaGenerator.imports_['bluetooth'] = 'import esp32.BluetoothSerial;';
    var name = block.getFieldValue('NAME');
    return '        BluetoothSerial serialBT = new BluetoothSerial();\n' +
        '        serialBT.begin("' + name + '");\n';
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
        return ['serialBT.readStringUntil(\'\\n\')', javaGenerator.ORDER_ATOMIC];
    } else {
        return ['serialBT.readString()', javaGenerator.ORDER_ATOMIC];
    }
};

javaGenerator.forBlock['bluetooth_serial_read_number_until'] = function (block) {
    return ['Integer.parseInt(serialBT.readString())', javaGenerator.ORDER_ATOMIC];
};

javaGenerator.forBlock['bluetooth_serial_print_format'] = function (block) {
    var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var format = block.getFieldValue('FORMAT');
    if (format === 'HEX') {
        return '        serialBT.print(Integer.toHexString(' + value + '));\n';
    } else if (format === 'BIN') {
        return '        serialBT.print(Integer.toBinaryString(' + value + '));\n';
    }
    return '        serialBT.print(' + value + ');\n';
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
