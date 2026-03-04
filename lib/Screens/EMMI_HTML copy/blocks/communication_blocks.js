'use strict';

// Communication block color is defined inline in each block.

// ===========================================
// USB Serial Blocks
// ===========================================

Blockly.Blocks['custom_text_value'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("📝")
            .appendField("text")
            .appendField(new Blockly.FieldTextInput("message"), "TEXT");
        this.setOutput(true, "String");
        this.setColour("#1976D2");
        this.setTooltip("Type custom text.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_init'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("🔌")
            .appendField("USB serial")
            .appendField(new Blockly.FieldDropdown([
                ["9600", "9600"],
                ["115200", "115200"],
                ["1200", "1200"],
                ["2400", "2400"],
                ["4800", "4800"],
                ["19200", "19200"],
                ["38400", "38400"],
                ["57600", "57600"]
            ]), "BAUD");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Initialize USB Serial communication.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_available'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("🔌")
            .appendField("serial available?");
        this.setOutput(true, "Boolean");
        this.setColour("#1976D2");
        this.setTooltip("Check if data is available on USB Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_read_byte'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("🔌")
            .appendField("serial read byte");
        this.setOutput(true, "Number");
        this.setColour("#1976D2");
        this.setTooltip("Read a byte from USB Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_read_string_until'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("🔌")
            .appendField("serial read string")
            .appendField(new Blockly.FieldCheckbox("TRUE"), "UNTIL_NEWLINE")
            .appendField("until line feed");
        this.setOutput(true, "String");
        this.setColour("#1976D2");
        this.setTooltip("Read a string from USB Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_read_number_until'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("🔌")
            .appendField("serial read as number")
            .appendField(new Blockly.FieldCheckbox("TRUE"), "UNTIL_NEWLINE")
            .appendField("until line feed");
        this.setOutput(true, "Number");
        this.setColour("#1976D2");
        this.setTooltip("Read a number from USB Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_print_format'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck("Number")
            .appendField("🔌")
            .appendField("serial print format")
            .appendField(new Blockly.FieldDropdown([
                ["DEC", "DEC"],
                ["HEX", "HEX"],
                ["OCT", "OCT"],
                ["BIN", "BIN"]
            ]), "FORMAT");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Print a number in a specific format.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_print_same_line'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("🔌")
            .appendField("serial print on same line");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Print to USB Serial without new line.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_print_new_line'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("🔌")
            .appendField("serial print on new line");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Print to USB Serial with new line.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['usb_serial_write'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("🔌")
            .appendField("serial write");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Write raw data to USB Serial.");
        this.setHelpUrl("");
    }
};

// ===========================================
// Bluetooth Serial Blocks
// ===========================================

Blockly.Blocks['bluetooth_serial_init'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("ᛒ")
            .appendField("init Bluetooth - ESP32 Bluetooth Serial name")
            .appendField(new Blockly.FieldTextInput("ESP32 MRTX NODE"), "NAME");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Initialize Bluetooth Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_available'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("ᛒ")
            .appendField("serial BT available?");
        this.setOutput(true, "Boolean");
        this.setColour("#1976D2");
        this.setTooltip("Check if data is available on Bluetooth Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_read_byte'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("ᛒ")
            .appendField("serial BT read byte");
        this.setOutput(true, "Number");
        this.setColour("#1976D2");
        this.setTooltip("Read a byte from Bluetooth Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_read_string_until'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("ᛒ")
            .appendField("serial BT read string")
            .appendField(new Blockly.FieldCheckbox("TRUE"), "UNTIL_NEWLINE")
            .appendField("until line feed");
        this.setOutput(true, "String");
        this.setColour("#1976D2");
        this.setTooltip("Read a string from Bluetooth Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_read_number_until'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("ᛒ")
            .appendField("serial BT read as number")
            .appendField(new Blockly.FieldCheckbox("TRUE"), "UNTIL_NEWLINE")
            .appendField("until line feed");
        this.setOutput(true, "Number");
        this.setColour("#1976D2");
        this.setTooltip("Read a number from Bluetooth Serial.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_print_format'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck("Number")
            .appendField("ᛒ")
            .appendField("serial BT print format")
            .appendField(new Blockly.FieldDropdown([
                ["DEC", "DEC"],
                ["HEX", "HEX"],
                ["OCT", "OCT"],
                ["BIN", "BIN"]
            ]), "FORMAT");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Print a number in a specific format to Bluetooth.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_print_same_line'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("ᛒ")
            .appendField("serial BT Print on same line");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Print to Bluetooth Serial without new line.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_print_new_line'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("ᛒ")
            .appendField("serial BT print on new line");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Print to Bluetooth Serial with new line.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['bluetooth_serial_write'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("ᛒ")
            .appendField("serial BT write");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#1976D2");
        this.setTooltip("Write raw data to Bluetooth Serial.");
        this.setHelpUrl("");
    }
};
