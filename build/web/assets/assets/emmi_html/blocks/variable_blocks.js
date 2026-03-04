'use strict';

/* =======================================================
   Variable Blocks - Custom Implementation
   ======================================================= */

// 1. Declare Variable
Blockly.Blocks['custom_variable_declare'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("declare")
            .appendField(new Blockly.FieldVariable("item"), "VAR")
            .appendField("type")
            .appendField(new Blockly.FieldDropdown([
                ["character", "char"],
                ["integer", "int"],
                ["long", "long"],
                ["float", "float"],
                ["boolean", "boolean"],
                ["string", "String"]
            ]), "TYPE")
            .appendField("to");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF6D00");
        this.setTooltip("Declare a variable with a specific type and initial value.");
        this.setHelpUrl("");
    }
};

// 2. Set Variable
Blockly.Blocks['custom_variable_set'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("set")
            .appendField(new Blockly.FieldVariable("item"), "VAR")
            .appendField("to");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF6D00");
        this.setTooltip("Set a variable to a value.");
        this.setHelpUrl("");
    }
};

// 3. Change Variable
Blockly.Blocks['custom_variable_change'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck("Number")
            .appendField("change")
            .appendField(new Blockly.FieldVariable("item"), "VAR")
            .appendField("by");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF6D00");
        this.setTooltip("Change a variable by a certain amount (e.g. increment).");
        this.setHelpUrl("");
    }
};

// 4. Declare Constant
Blockly.Blocks['custom_constant_declare'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("declare constant")
            .appendField(new Blockly.FieldVariable("item"), "VAR") // Constants might not be standard variables
            .appendField("type")
            .appendField(new Blockly.FieldDropdown([
                ["character", "char"],
                ["integer", "int"],
                ["long", "long"],
                ["float", "float"],
                ["boolean", "boolean"],
                ["string", "String"]
            ]), "TYPE")
            .appendField("to");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF6D00");
        this.setTooltip("Declare a constant value.");
        this.setHelpUrl("");
    }
};

// 5. Set Constant (Define/Equivalence)
Blockly.Blocks['custom_constant_set'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .setCheck(null)
            .appendField("set constant")
            .appendField(new Blockly.FieldVariable("item"), "VAR")
            .appendField("which is equivalent to");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#FF6D00");
        this.setTooltip("Define a constant equivalent.");
        this.setHelpUrl("");
    }
};

// 6. Variable Getter (Reporter)
Blockly.Blocks['custom_variable_get'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldVariable("item"), "VAR");
        this.setOutput(true, null);
        this.setColour("#FF6D00");
        this.setTooltip("Get the value of a variable.");
        this.setHelpUrl("");
    }
};
