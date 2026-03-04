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
    init: function () {
        this.appendDummyInput()
            .appendField("🛞")
            .appendField("wheels")
            .appendField(new Blockly.FieldDropdown([
                ["forward", "FORWARD"],
                ["backward", "BACKWARD"],
                ["left", "LEFT"],
                ["right", "RIGHT"]
            ]), "DIRECTION")
            .appendField("speed")
            .appendField(new Blockly.FieldDropdown([
                ["slow", "100"],
                ["normal", "180"],
                ["fast", "255"]
            ]), "SPEED")
            .appendField("step")
            .appendField(new Blockly.FieldNumber(1), "STEP");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3F51B5");
        this.setTooltip("Move the robot.");
        this.setHelpUrl("");
    }
};

// ===========================================
// Buzzer
// ===========================================

Blockly.Blocks['emmi_buzzer_music'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown([["BUZZER", "PIN_BUZZER"]]), "PIN")
            .appendField("Play RTTTL melody")
            .appendField(new Blockly.FieldDropdown([
                ['StarWars', 'StarWars'], ['MahnaMahna', 'MahnaMahna'], ['LeisureSuit', 'LeisureSuit'], ['MissionImp', 'MissionImp'], ['Entertainer', 'Entertainer'], ['Muppets', 'Muppets'], ['Flinstones', 'Flinstones'], ['YMCA', 'YMCA'], ['Simpsons', 'Simpsons'], ['Indiana', 'Indiana'], ['TakeOnMe', 'TakeOnMe'], ['Looney', 'Looney'], ['20thCenFox', '_20thCenFox'], ['Bond', 'Bond'], ['GoodBad', 'GoodBad'], ['PinkPanther', 'PinkPanther'], ['A_Team', 'A_Team'], ['Jeopardy', 'Jeopardy'], ['Gadget', 'Gadget'], ['Smurfs', 'Smurfs'], ['Toccata', 'Toccata'], ['Short', 'Short'], ['JingleBell', 'JingleBell'], ['Rudolph', 'Rudolph'], ['WeWishYou', 'WeWishYou'], ['WinterWonderland', 'WinterWonderland'], ['OhDennenboom', 'OhDennenboom'], ['LetItSnow', 'LetItSnow'], ['Frosty', 'Frosty'], ['SilentNight', 'SilentNight'], ['LastChristmas', 'LastChristmas'], ['AllIWant', 'AllIWant'], ['AmazingGrace', 'AmazingGrace']
            ]), "MELODY");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#E91E63");
        this.setTooltip("Play RTTTL melody");
        this.setHelpUrl('');
    }
};

Blockly.Blocks['emmi_buzzer_music_custom'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown([["BUZZER", "PIN_BUZZER"]]), "PIN")
            .appendField("Play custom RTTTL");
        this.appendValueInput("MELODY")
            .setCheck("String");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#E91E63");
        this.setTooltip("Play a custom RTTTL melody string.");
        this.setHelpUrl('');
    }
};

Blockly.Blocks['emmi_buzzer_note'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown([["BUZZER", "PIN_BUZZER"]]), "PIN")
            .appendField("play")
            .appendField(new Blockly.FieldDropdown([
                ["C4", "261"], ["D4", "294"], ["E4", "329"], ["F4", "349"], ["G4", "392"], ["A4", "440"], ["B4", "493"], ["C5", "523"]
            ]), "NOTE")
            .appendField("|")
            .appendField(new Blockly.FieldDropdown([
                ["Do", "Do"], ["Re", "Re"], ["Mi", "Mi"], ["Fa", "Fa"], ["So", "So"], ["La", "La"], ["Ti", "Ti"], ["Do", "Do"]
            ]), "SOLFA") // Solfege mostly for display or alternative selection
            .appendField("beamed notes");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#E91E63");
        this.setTooltip("Play a musical note.");
        this.setHelpUrl("");
    }
};


Blockly.Blocks['emmi_buzzer_frequency'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown([["BUZZER", "PIN_BUZZER"]]), "PIN");
        this.appendValueInput("FREQUENCY")
            .setCheck("Number")
            .appendField("frequency (Hz)");
        this.appendValueInput("DURATION")
            .setCheck("Number")
            .appendField("duration (ms)");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#E91E63");
        this.setTooltip("Play a frequency.");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['emmi_buzzer_stop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("stop sound on")
            .appendField(new Blockly.FieldDropdown([["BUZZER", "PIN_BUZZER"]]), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#E91E63");
        this.setTooltip("Stop the buzzer.");
        this.setHelpUrl("");
    }
};

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























