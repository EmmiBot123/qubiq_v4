// EMMI BOT V2 Block Definitions

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
    init: function () {
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

var EMMI_BUZZER_HUE = "#E91E63";

var EMMI_BUZZER_PINS = [
    ["BUZZER", "BUZZER"],
    ["25", "25"],
    ["26", "26"],
    ["27", "27"]
];

var EMMI_BUZZER_NOTES = [
    ["C4 (262Hz)", "262"],
    ["D4 (294Hz)", "294"],
    ["E4 (330Hz)", "330"],
    ["F4 (349Hz)", "349"],
    ["G4 (392Hz)", "392"],
    ["A4 (440Hz)", "440"],
    ["B4 (494Hz)", "494"],
    ["C5 (523Hz)", "523"],
    ["D5 (587Hz)", "587"],
    ["E5 (659Hz)", "659"],
    ["F5 (698Hz)", "698"],
    ["G5 (784Hz)", "784"],
    ["A5 (880Hz)", "880"],
    ["B5 (988Hz)", "988"]
];

var EMMI_BUZZER_TEMPOS = [
    ["Eighth (125ms)", "125"],
    ["Quarter (250ms)", "250"],
    ["Half (500ms)", "500"],
    ["Whole (1000ms)", "1000"]
];












// ===========================================
// Touch
// ===========================================

Blockly.Blocks['emmi_touch_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("digital state PIN")
            .appendField(new Blockly.FieldDropdown([["TOUCH", "PIN_TOUCH"]]), "PIN")

        this.setOutput(true, "Boolean"); // Returns true/false for if-block compatibility
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

























Blockly.Blocks['buzzer_play_rtttl'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(EMMI_BUZZER_PINS), "PIN")
            .appendField("play ring tone")
            .appendField(new Blockly.FieldDropdown([
                ["StarWars", "StarWars"],
                ["MahnaMahna", "MahnaMahna"],
                ["MissionImp", "MissionImp"],
                ["Entertainer", "Entertainer"],
                ["Muppets", "Muppets"],
                ["Flinstones", "Flinstones"],
                ["YMCA", "YMCA"],
                ["Simpsons", "Simpsons"],
                ["Indiana", "Indiana"],
                ["JingleBell", "JingleBell"],
                ["SilentNight", "SilentNight"],
                ["AmazingGrace", "AmazingGrace"]
            ]), "MELODY");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(EMMI_BUZZER_HUE);
        this.setTooltip("Play a preset RTTTL ringtone melody on the buzzer.");
    }
};

Blockly.Blocks['buzzer_play_rtttl_custom'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(EMMI_BUZZER_PINS), "PIN")
            .appendField("play ring tone");
        this.appendValueInput("MELODY").setCheck("String");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(EMMI_BUZZER_HUE);
        this.setTooltip("Play a custom RTTTL string on the buzzer.");
    }
};

Blockly.Blocks['buzzer_play_note'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(EMMI_BUZZER_PINS), "PIN")
            .appendField("play")
            .appendField(new Blockly.FieldDropdown(EMMI_BUZZER_NOTES), "NOTE")
            .appendField(new Blockly.FieldDropdown(EMMI_BUZZER_TEMPOS), "TEMPO");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(EMMI_BUZZER_HUE);
        this.setTooltip("Play a musical note for a given duration.");
    }
};

Blockly.Blocks['buzzer_play_tone'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(EMMI_BUZZER_PINS), "PIN");
        this.appendValueInput("FREQ").setCheck("Number").appendField("♪ frequency (Hz)");
        this.appendValueInput("DURATION").setCheck("Number").appendField("⊙ duration (ms)");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(EMMI_BUZZER_HUE);
        this.setTooltip("Play a tone at a specific frequency for a given duration.");
    }
};

Blockly.Blocks['buzzer_stop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("stop sound on")
            .appendField(new Blockly.FieldDropdown(EMMI_BUZZER_PINS), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(EMMI_BUZZER_HUE);
        this.setTooltip("Stop the buzzer / turn off tone.");
    }
};