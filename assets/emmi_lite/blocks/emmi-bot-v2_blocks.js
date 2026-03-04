'use strict';

// ===========================================
// EMMI BOT V2 Blocks
// ===========================================

// ===========================================
// Eyes
// ===========================================

Blockly.Blocks['emmi_eyes_digital'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("digital write PIN")
            .appendField(new Blockly.FieldDropdown([
                ["Red", "PIN_EYE_RED"],
                ["Green", "PIN_EYE_GREEN"],
                ["Blue", "PIN_EYE_BLUE"]
            ]), "PIN")
            .appendField("to")
            .appendField(new Blockly.FieldDropdown([
                ["ON", "HIGH"],
                ["OFF", "LOW"]
            ]), "STATE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Control the digital state of the eye LEDs.");
        this.setHelpUrl("");
    }
};

// ===========================================
// Wheels
// ===========================================

Blockly.Blocks['emmi_wheels_init'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("🛞")
            .appendField("wheels");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3F51B5");
        this.setTooltip("Initialize wheels.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['emmi_wheels_simple'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("🛞")
            .appendField("wheels")
            .appendField(new Blockly.FieldDropdown([
                ["forward", "FORWARD"],
                ["backward", "BACKWARD"],
                ["left", "LEFT"],
                ["right", "RIGHT"],
                ["stop", "STOP"]
            ]), "DIRECTION");

        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3F51B5");
        this.setTooltip("Move the robot wheels in a selected direction.");
        this.setHelpUrl("");
    }
};

// ===========================================
// Buzzer
// ===========================================












// ===========================================
// Touch
// ===========================================

Blockly.Blocks['emmi_touch_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Analog read PIN")
            .appendField(new Blockly.FieldDropdown([["TOUCH", "PIN_TOUCH"]]), "PIN")
          
        this.setOutput(true, "Number"); // Digital Read returns 0 or 1
        this.setColour("#3F51B5");
        this.setTooltip("Read digital state of touch sensor.");
        this.setHelpUrl("");
    }
};

// ===========================================
// Mic
// ===========================================

Blockly.Blocks['emmi_mic_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("digital state PIN")
            .appendField(new Blockly.FieldDropdown([["MIC", "PIN_MIC"]]), "PIN")
            .appendField(new Blockly.FieldDropdown([
                ["pull-up", "INPUT_PULLUP"],
                ["pull-down", "INPUT_PULLDOWN"],
                ["input", "INPUT"]
            ]), "MODE");
        this.setOutput(true, "Number");
        this.setColour("#000000");
        this.setTooltip("Read digital state of microphone.");
        this.setHelpUrl("");
    }
};

// ===========================================
// Light
// ===========================================

Blockly.Blocks['emmi_light_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("analog read PIN")
            .appendField(new Blockly.FieldDropdown([["LIGHT", "PIN_LIGHT"]]), "PIN");
        this.setOutput(true, "Number");
        this.setColour("#FFA726");
        this.setTooltip("Read analog value from light sensor.");
        this.setHelpUrl("");
    }
};

// ===========================================
// Cute Sounds
// ===========================================



// ===========================================
// Improved Tone / Play
// ===========================================



// ===========================================
// MP3 / DFPlayer Mini
// ===========================================























