'use strict';

/* =======================================================
   ESP32 Structure Block - Exact Screenshot Replica
   ======================================================= */

// Custom Icons removed for standard style

Blockly.Blocks['base_setup_loop'] = {
    init: function () {
        this.setColour('#2d2d64');
        this.appendDummyInput()
            .appendField("Setup");
        this.appendStatementInput("SETUP")
            .setCheck(null);
        this.appendDummyInput()
            .appendField("Loop");
        this.appendStatementInput("LOOP")
            .setCheck(null);
        this.setInputsInline(false);
        this.setDeletable(true);
        this.setMovable(true);
        this.setPreviousStatement(false);
        this.setNextStatement(false);
        this.setTooltip("The main program structure.");
    },

    // Helper for Arduino generator to find this block
    getArduinoLoopsInstance: function () {
        return true;
    }
};

/* =======================================================
   Timing Blocks
   ======================================================= */

// 1. Wait Block
Blockly.Blocks['custom_wait'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("wait")
            .appendField(new Blockly.FieldNumber(1, 0), "DELAY");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["seconds", "SECONDS"], ["milliseconds", "MILLISECONDS"], ["microseconds", "MICROSECONDS"]]), "UNIT");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F"); // Teal color from screenshot
        this.setTooltip("Waits for a specified amount of time.");
        this.setHelpUrl("");
    }
};

// 2. Timer Block (all ... do ...)
Blockly.Blocks['custom_timer'] = {
    init: function () {
        this.appendDummyInput("interval")
            .appendField("all")
            .appendField(new Blockly.FieldNumber(1, 0), "interval");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["seconds", "SECONDS"], ["milliseconds", "MILLISECONDS"]]), "UNIT");
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("do");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F"); // Teal
        this.setTooltip("Executes code every N seconds/milliseconds.");
        this.setHelpUrl("");
    }
};

// 3. Start Timekeeping
Blockly.Blocks['start_timekeeping'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("start a timekeeping in")
            .appendField(new Blockly.FieldDropdown([["seconds", "SECONDS"], ["milliseconds", "MILLISECONDS"]]), "UNIT");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Resets the timer.");
        this.setHelpUrl("");
    }
};

// 4. Duration from beginning
Blockly.Blocks['get_duration'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("duration in")
            .appendField(new Blockly.FieldDropdown([["seconds", "SECONDS"], ["milliseconds", "MILLISECONDS"]]), "UNIT")
            .appendField("from the beginning");
        this.setOutput(true, "Number");
        this.setColour("#00838F");
        this.setTooltip("Returns time since program started.");
        this.setHelpUrl("");
    }
};

// 5. State duration
Blockly.Blocks['state_duration'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("state duration")
            .appendField(new Blockly.FieldDropdown([["UP", "HIGH"], ["DOWN", "LOW"]]), "STATE")
            .appendField("PIN")
            .appendField(new Blockly.FieldNumber(10, 0), "PIN");
        this.setOutput(true, "Number");
        this.setColour("#00838F");
        this.setTooltip("Measures duration of a pulse on a pin.");
        this.setHelpUrl("");
    }
};

/* =======================================================
   Control Blocks – Full implementations from EMMI_BOT_V2_WIRED
   ======================================================= */

var CONTROLS_HUE = "#FFAB19";

Blockly.Blocks['controls_if'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendValueInput("IF0").setCheck("Boolean").appendField("if");
        this.appendStatementInput("DO0").appendField("then");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        // Mutator not available in this Blockly version
        this.setTooltip("If condition is true, execute statements.");
        this.elseifCount_ = 0;
        this.elseCount_ = 0;
    },
    mutationToDom: function () {
        if (!this.elseifCount_ && !this.elseCount_) return null;
        var container = document.createElement("mutation");
        if (this.elseifCount_) container.setAttribute("elseif", this.elseifCount_);
        if (this.elseCount_) container.setAttribute("else", 1);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.elseifCount_ = parseInt(xmlElement.getAttribute("elseif"), 10) || 0;
        this.elseCount_ = parseInt(xmlElement.getAttribute("else"), 10) || 0;
        for (var i = 1; i <= this.elseifCount_; i++) {
            this.appendValueInput("IF" + i).setCheck("Boolean").appendField("else if");
            this.appendStatementInput("DO" + i).appendField("then");
        }
        if (this.elseCount_) this.appendStatementInput("ELSE").appendField("else");
    },
    decompose: function (workspace) {
        var containerBlock = workspace.newBlock("controls_if_if");
        containerBlock.initSvg();
        var connection = containerBlock.getInput("STACK").connection;
        for (var i = 1; i <= this.elseifCount_; i++) {
            var elseifBlock = workspace.newBlock("controls_if_elseif");
            elseifBlock.initSvg();
            connection.connect(elseifBlock.previousConnection);
            connection = elseifBlock.nextConnection;
        }
        if (this.elseCount_) {
            var elseBlock = workspace.newBlock("controls_if_else");
            elseBlock.initSvg();
            connection.connect(elseBlock.previousConnection);
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        if (this.elseCount_) this.removeInput("ELSE");
        this.elseCount_ = 0;
        for (var i = this.elseifCount_; i > 0; i--) {
            this.removeInput("IF" + i);
            this.removeInput("DO" + i);
        }
        this.elseifCount_ = 0;
        var clauseBlock = containerBlock.getInputTargetBlock("STACK");
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case "controls_if_elseif":
                    this.elseifCount_++;
                    var ifInput = this.appendValueInput("IF" + this.elseifCount_).setCheck("Boolean").appendField("else if");
                    var doInput = this.appendStatementInput("DO" + this.elseifCount_).appendField("then");
                    if (clauseBlock.valueConnection_) ifInput.connection.connect(clauseBlock.valueConnection_);
                    if (clauseBlock.statementConnection_) doInput.connection.connect(clauseBlock.statementConnection_);
                    break;
                case "controls_if_else":
                    this.elseCount_++;
                    var elseInput = this.appendStatementInput("ELSE").appendField("else");
                    if (clauseBlock.statementConnection_) elseInput.connection.connect(clauseBlock.statementConnection_);
                    break;
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
    },
    saveConnections: function (containerBlock) {
        var clauseBlock = containerBlock.getInputTargetBlock("STACK");
        var i = 1;
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case "controls_if_elseif":
                    var inputIf = this.getInput("IF" + i);
                    var inputDo = this.getInput("DO" + i);
                    clauseBlock.valueConnection_ = inputIf && inputIf.connection.targetConnection;
                    clauseBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
                    i++;
                    break;
                case "controls_if_else":
                    var inputDo = this.getInput("ELSE");
                    clauseBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
                    break;
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
    }
};

// ── ifelse (pre-built if/else) ──────────
Blockly.Blocks['ifelse'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendValueInput("IF0").setCheck("Boolean").appendField("if");
        this.appendStatementInput("DO0").appendField("then");
        this.appendStatementInput("ELSE").appendField("else");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        // Mutator not available in this Blockly version
        this.setTooltip("If/else control.");
        this.elseifCount_ = 0;
        this.elseCount_ = 1;
    },
    mutationToDom: Blockly.Blocks['controls_if'].mutationToDom,
    domToMutation: function (xmlElement) {
        if (this.getInput("ELSE")) return;
        Blockly.Blocks['controls_if'].domToMutation.call(this, xmlElement);
    },
    decompose: Blockly.Blocks['controls_if'].decompose,
    compose: Blockly.Blocks['controls_if'].compose,
    saveConnections: Blockly.Blocks['controls_if'].saveConnections
};

// ── ifandifnot (if/ifnot) ──────────
Blockly.Blocks['ifandifnot'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendValueInput("IF0").setCheck("Boolean").appendField("if");
        this.appendStatementInput("DO0").appendField("then");
        this.appendStatementInput("ELSE").appendField("ifnot");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        // Mutator not available in this Blockly version
        this.setTooltip("If/ifnot control.");
        this.elseifCount_ = 0;
        this.elseCount_ = 1;
    },
    mutationToDom: Blockly.Blocks['controls_if'].mutationToDom,
    domToMutation: function (xmlElement) {
        if (this.getInput("ELSE")) return;
        Blockly.Blocks['controls_if'].domToMutation.call(this, xmlElement);
    },
    decompose: Blockly.Blocks['controls_if'].decompose,
    compose: Blockly.Blocks['controls_if'].compose,
    saveConnections: Blockly.Blocks['controls_if'].saveConnections
};

// ── Mutator helper blocks ──────────
Blockly.Blocks['controls_if_if'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField("if");
        this.appendStatementInput("STACK");
        this.setTooltip("Add, remove, or reorder sections.");
        this.contextMenu = false;
    }
};
Blockly.Blocks['controls_if_elseif'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField("else if");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("Add else-if condition.");
        this.contextMenu = false;
    }
};
Blockly.Blocks['controls_if_else'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField("else");
        this.setPreviousStatement(true);
        this.setTooltip("Add else section.");
        this.contextMenu = false;
    }
};

// ── controls_switch (mutator: multiple case/default) ──────────
Blockly.Blocks['controls_switch'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField("switch").appendField(new Blockly.FieldVariable("i"), "SWVAR");
        this.appendValueInput("CASE0").setAlign(Blockly.ALIGN_RIGHT).appendField("case");
        this.appendStatementInput("DO0").setAlign(Blockly.ALIGN_RIGHT).appendField("then");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        // Mutator not available in this Blockly version
        this.setTooltip("Switch/case control.");
        this.casebreakCount_ = 0;
        this.defaultCount_ = 0;
    },
    mutationToDom: function () {
        if (!this.casebreakCount_ && !this.defaultCount_) return null;
        var container = document.createElement("mutation");
        if (this.casebreakCount_) container.setAttribute("casebreak", this.casebreakCount_);
        if (this.defaultCount_) container.setAttribute("default", 1);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.casebreakCount_ = parseInt(xmlElement.getAttribute("casebreak"), 10) || 0;
        this.defaultCount_ = parseInt(xmlElement.getAttribute("default"), 10) || 0;
        for (var i = 1; i <= this.casebreakCount_; i++) {
            this.appendValueInput("CASE" + i).setAlign(Blockly.ALIGN_RIGHT).appendField("case");
            this.appendStatementInput("DO" + i).setAlign(Blockly.ALIGN_RIGHT).appendField("then");
        }
        if (this.defaultCount_) this.appendStatementInput("DEFAULT");
    },
    decompose: function (workspace) {
        var containerBlock = workspace.newBlock("controls_switch_var");
        containerBlock.initSvg();
        var connection = containerBlock.getInput("STACK").connection;
        for (var i = 1; i <= this.casebreakCount_; i++) {
            var caseBlock = workspace.newBlock("controls_case_break");
            caseBlock.initSvg();
            connection.connect(caseBlock.previousConnection);
            connection = caseBlock.nextConnection;
        }
        if (this.defaultCount_) {
            var defaultBlock = workspace.newBlock("controls_case_default");
            defaultBlock.initSvg();
            connection.connect(defaultBlock.previousConnection);
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        if (this.defaultCount_) this.removeInput("DEFAULT");
        this.defaultCount_ = 0;
        for (var i = this.casebreakCount_; i > 0; i--) {
            this.removeInput("CASE" + i);
            this.removeInput("DO" + i);
        }
        this.casebreakCount_ = 0;
        var clauseBlock = containerBlock.getInputTargetBlock("STACK");
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case "controls_case_break":
                    this.casebreakCount_++;
                    var cInput = this.appendValueInput("CASE" + this.casebreakCount_).setAlign(Blockly.ALIGN_RIGHT).appendField("case");
                    var dInput = this.appendStatementInput("DO" + this.casebreakCount_).setAlign(Blockly.ALIGN_RIGHT).appendField("then");
                    if (clauseBlock.valueConnection_) cInput.connection.connect(clauseBlock.valueConnection_);
                    if (clauseBlock.statementConnection_) dInput.connection.connect(clauseBlock.statementConnection_);
                    break;
                case "controls_case_default":
                    this.defaultCount_++;
                    var defInput = this.appendStatementInput("DEFAULT").setAlign(Blockly.ALIGN_RIGHT).appendField("else");
                    if (clauseBlock.statementConnection_) defInput.connection.connect(clauseBlock.statementConnection_);
                    break;
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
    },
    saveConnections: function (containerBlock) {
        var clauseBlock = containerBlock.getInputTargetBlock("STACK");
        var i = 1;
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case "controls_case_break":
                    var inputCase = this.getInput("CASE" + i);
                    var inputDo = this.getInput("DO" + i);
                    clauseBlock.valueConnection_ = inputCase && inputCase.connection.targetConnection;
                    clauseBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
                    i++;
                    break;
                case "controls_case_default":
                    var inputDo = this.getInput("DEFAULT");
                    clauseBlock.statementConnection_ = inputDo && inputDo.connection.targetConnection;
                    break;
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
    }
};
Blockly.Blocks['controls_switch_var'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField("switch");
        this.appendStatementInput("STACK");
        this.contextMenu = false;
    }
};
Blockly.Blocks['controls_case_break'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField("case");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};
Blockly.Blocks['controls_case_default'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField("default");
        this.setPreviousStatement(true);
        this.contextMenu = false;
    }
};

// ── controls_repeat_ext (repeat N times) ──────────
Blockly.Blocks['controls_repeat_ext'] = {
    init: function () {
        this.jsonInit({
            message0: "repeat %1 times",
            args0: [{ type: "input_value", name: "TIMES", check: "Number" }],
            previousStatement: null,
            nextStatement: null,
            colour: CONTROLS_HUE,
            tooltip: "Repeat enclosed blocks N times."
        });
        this.appendStatementInput("DO");
    }
};

// ── controls_whileUntil ──────────
Blockly.Blocks['controls_whileUntil'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendValueInput("BOOL").setCheck("Boolean")
            .appendField(new Blockly.FieldDropdown([["repeat as long as", "WHILE"], ["repeat until", "UNTIL"]]), "MODE");
        this.appendStatementInput("DO");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setInputsInline(true);
        this.setTooltip("Repeat while or until condition is met.");
    }
};

// ── controls_for (counted loop) ──────────
Blockly.Blocks['controls_for'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput()
            .appendField("for")
            .appendField(new Blockly.FieldVariable("i"), "VAR")
            .appendField("ranging from");
        this.appendValueInput("FROM").setCheck("Number");
        this.appendDummyInput().appendField("to");
        this.appendValueInput("TO").setCheck("Number");
        this.appendDummyInput().appendField("in steps of");
        this.appendValueInput("BY").setCheck("Number");
        this.appendStatementInput("DO");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("Loop with counter variable.");
    }
};

// ── controls_forEach ──────────
Blockly.Blocks['controls_forEach'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput()
            .appendField("for each item")
            .appendField(new Blockly.FieldVariable("item"), "VAR")
            .appendField("in list");
        this.appendValueInput("LIST").setCheck("Array");
        this.appendStatementInput("DO");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip("For each item in a list.");
    }
};

// ── controls_flow_statements (break / continue) ──────────
Blockly.Blocks['controls_flow_statements'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["exit the loop", "BREAK"], ["continue with next iteration", "CONTINUE"]]), "FLOW");
        this.setPreviousStatement(true);
        this.setTooltip("Exit or continue loop.");
    },
    onchange: function () {
        var legal = false;
        var block = this;
        do {
            if (["controls_repeat", "controls_repeat_ext", "controls_forEach",
                "controls_for", "controls_whileUntil", "base_loop"].indexOf(block.type) >= 0) {
                legal = true; break;
            }
            block = block.getSurroundParent();
        } while (block);
        this.setWarningText(legal ? null : "This block may only be used within a loop.");
    }
};

// ── Logic blocks ──────────
Blockly.Blocks['inout_onoff'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "BOOL");
        this.setOutput(true, "Boolean");
        this.setTooltip("High or Low value.");
    }
};
Blockly.Blocks['inout_onoff2'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.appendDummyInput().appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "BOOL");
        this.setOutput(true, "Boolean");
        this.setTooltip("High or Low value.");
    }
};
Blockly.Blocks['logic_operation'] = {
    init: function () {
        this.setColour(CONTROLS_HUE);
        this.setOutput(true, "Boolean");
        this.appendValueInput("A");
        this.appendValueInput("B").appendField(new Blockly.FieldDropdown([["and", "and"], ["or", "or"]]), "OP");
        this.setInputsInline(true);
        this.setTooltip("Logical AND / OR.");
    }
};
Blockly.Blocks['logic_negate'] = {
    init: function () {
        this.jsonInit({
            message0: "not %1",
            args0: [{ type: "input_value", name: "BOOL", check: "Boolean" }],
            output: "Boolean",
            colour: CONTROLS_HUE,
            tooltip: "Logical NOT."
        });
    }
};
Blockly.Blocks['logic_null'] = {
    init: function () {
        this.jsonInit({
            message0: "null",
            output: null,
            colour: CONTROLS_HUE,
            tooltip: "Returns null."
        });
    }
};

/* =======================================================
   Arduino / ESP32 Blocks (Screenshot Implementation)
   ======================================================= */
// 1. Digital Write
Blockly.Blocks['esp32_digital_write'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("digital write PIN")
            .appendField(new Blockly.FieldDropdown([
                ["23", "23"], ["2", "2"], ["4", "4"], ["5", "5"], ["12", "12"], ["13", "13"], ["14", "14"], ["15", "15"], ["18", "18"], ["19", "19"]
            ]), "PIN")
            .appendField("to")
            .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "STATE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Write to a digital pin.");
    }
};

// 2. Digital Read (State) with Pull-up
Blockly.Blocks['esp32_digital_state'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("digital state PIN")
            .appendField(new Blockly.FieldDropdown([
                ["Green", "GREEN"],
                ["Blue", "BLUE"],
                ["Red", "RED"],
                ["MIC", "MIC"],
                ["BUZZER", "BUZZER"],
                ["TOUCH", "TOUCH"],
                ["MOTOR1", "MOTOR1"],
                ["MOTOR2", "MOTOR2"],
                ["MOTOR3", "MOTOR3"],
                ["MOTOR4", "MOTOR4"]
            ]), "PIN")
            .appendField("pull-up")
            .appendField(new Blockly.FieldCheckbox("FALSE"), "PULLUP");
        this.setOutput(true, "Boolean");
        this.setColour("#00838F");
        this.setTooltip("Read digital pin state.");
    }
};

// 3. Analog Write
Blockly.Blocks['esp32_analog_write'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("analog write PIN")
            .appendField(new Blockly.FieldDropdown([
                ["OUT1", "OUT1"], ["25", "25"], ["26", "26"]
            ]), "PIN")
            .appendField("to");
        this.appendValueInput("VALUE")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Write analog value (PWM).");
    }
};

// 4. Analog Read
Blockly.Blocks['esp32_analog_read'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("analog read PIN")
            .appendField(new Blockly.FieldDropdown([
                ["IN1", "IN1"], ["32", "32"], ["33", "33"], ["34", "34"], ["35", "35"]
            ]), "PIN");
        this.setOutput(true, "Number");
        this.setColour("#00838F");
        this.setTooltip("Read analog value.");
    }
};

// 5. Toggle State
Blockly.Blocks['esp32_toggle_pin'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("toggle state of PIN")
            .appendField(new Blockly.FieldDropdown([
                ["23", "23"], ["2", "2"]
            ]), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Toggle the state of a digital pin.");
    }
};

// 6. Interrupt
Blockly.Blocks['esp32_interrupt'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("interrupt: when a")
            .appendField(new Blockly.FieldDropdown([
                ["rising edge", "RISING"], ["falling edge", "FALLING"], ["change", "CHANGE"]
            ]), "MODE")
            .appendField("detected on PIN")
            .appendField(new Blockly.FieldDropdown([
                ["IN1", "IN1"], ["2", "2"], ["23", "23"]
            ]), "PIN");
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("then");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Attach an interrupt.");
    }
};

// 7. Disable (Detach) Interrupt
Blockly.Blocks['esp32_detach_interrupt'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("disable interrupt on PIN")
            .appendField(new Blockly.FieldDropdown([
                ["IN1", "IN1"], ["2", "2"], ["23", "23"]
            ]), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Detach an interrupt.");
    }
};

// 8. Restart ESP
Blockly.Blocks['esp32_restart'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Restart ESP8266/ESP32");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Restart the microcontroller.");
    }
};

// 9. Deep Sleep
Blockly.Blocks['esp32_deep_sleep'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("DeepSleep")
            .appendField(new Blockly.FieldNumber(1, 0), "TIME")
            .appendField("Seconds");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#00838F");
        this.setTooltip("Enter deep sleep for N seconds.");
    }
};


/* =======================================================
   Buzzer / Audio Blocks – from EMMI_BOT_V2_WIRED reference
   ======================================================= */
var BUZZER_HUE = "#FF63BB";

// Buzzer pin options matching the EMMI wired board
var BUZZER_PINS = [["BUZZER", "BUZZER"], ["25", "25"], ["26", "26"], ["27", "27"]];

// Musical note options (frequency values)
var BUZZER_NOTES = [
    ["C4 | Do", "262"], ["D4 | Re", "294"], ["E4 | Mi", "330"],
    ["F4 | Fa", "349"], ["G4 | Sol", "392"], ["A4 | La", "440"],
    ["B4 | Si", "494"], ["C5 | Do", "523"], ["D5 | Re", "587"],
    ["E5 | Mi", "659"], ["F5 | Fa", "698"], ["G5 | Sol", "784"],
    ["A5 | La", "880"], ["B5 | Si", "988"]
];

// Note duration options
var BUZZER_TEMPOS = [
    ["♪ beamed notes", "125"], ["♩ quarter note", "250"],
    ["𝅗𝅥 half note", "500"], ["𝅝 whole note", "1000"]
];

// 1. Play RTTTL ringtone (preset songs)
Blockly.Blocks['buzzer_play_rtttl'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(BUZZER_PINS), "PIN")
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
        this.setColour(BUZZER_HUE);
        this.setTooltip("Play a preset RTTTL ringtone melody on the buzzer.");
    }
};

// 2. Play RTTTL ringtone (custom text input)
Blockly.Blocks['buzzer_play_rtttl_custom'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(BUZZER_PINS), "PIN")
            .appendField("play ring tone");
        this.appendValueInput("MELODY").setCheck("String");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BUZZER_HUE);
        this.setTooltip("Play a custom RTTTL string on the buzzer.");
    }
};

// 3. Play musical note with duration
Blockly.Blocks['buzzer_play_note'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(BUZZER_PINS), "PIN")
            .appendField("play")
            .appendField(new Blockly.FieldDropdown(BUZZER_NOTES), "NOTE")
            .appendField(new Blockly.FieldDropdown(BUZZER_TEMPOS), "TEMPO");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BUZZER_HUE);
        this.setTooltip("Play a musical note for a given duration.");
    }
};

// 4. Play frequency (Hz) for duration (ms)
Blockly.Blocks['buzzer_play_tone'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("buzzer")
            .appendField(new Blockly.FieldDropdown(BUZZER_PINS), "PIN");
        this.appendValueInput("FREQ").setCheck("Number").appendField("♪ frequency (Hz)");
        this.appendValueInput("DURATION").setCheck("Number").appendField("⊙ duration (ms)");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BUZZER_HUE);
        this.setTooltip("Play a tone at a specific frequency for a given duration.");
    }
};

// 5. Stop sound
Blockly.Blocks['buzzer_stop'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("stop sound on")
            .appendField(new Blockly.FieldDropdown(BUZZER_PINS), "PIN");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(BUZZER_HUE);
        this.setTooltip("Stop the buzzer / turn off tone.");
    }
};

/* =======================================================
   Extended Arduino Hardware Blocks – from EMMI_BOT_V2_WIRED
   ======================================================= */
var ARDUINO_HUE = "#00838F";


// 10. Pulse In – measure pulse duration
Blockly.Blocks['esp32_pulse_in'] = {
    init: function () {
        this.appendValueInput("PIN").setCheck("Number").appendField("pulse duration");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "STATE");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Measure the duration of a pulse on a pin (pulseIn).");
    }
};

// 11. Elapsed time (millis / micros)
Blockly.Blocks['esp32_millis'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("elapsed time in")
            .appendField(new Blockly.FieldDropdown([
                ["milliseconds", "m"], ["microseconds", "u"], ["seconds", "s"]
            ]), "UNIT");
        this.setOutput(true, "Number");
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Returns elapsed time since program start.");
    }
};

// 12. Start / Reset elapsed-time counter
Blockly.Blocks['esp32_millis_start'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("reset elapsed time in")
            .appendField(new Blockly.FieldDropdown([
                ["milliseconds", "m"], ["microseconds", "u"], ["seconds", "s"]
            ]), "UNIT");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Reset the elapsed-time counter.");
    }
};

// 13. Non-blocking timer
Blockly.Blocks['esp32_timer_noblocking'] = {
    init: function () {
        this.appendValueInput("INTERVAL").setCheck("Number").appendField("every");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["milliseconds", "m"], ["seconds", "s"]
            ]), "UNIT");
        this.appendStatementInput("DO").setCheck(null).appendField("do");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Execute code every N ms/s without blocking.");
    }
};

// 14. Raw code injection – statement
Blockly.Blocks['esp32_raw_code'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput("// your code"), "CODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Insert raw code into the generated program.");
    }
};

// 15. Raw code injection – value/expression
Blockly.Blocks['esp32_raw_value'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldTextInput("0"), "CODE");
        this.setOutput(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Insert a raw expression into the generated program.");
    }
};

// 16. EEPROM Write
Blockly.Blocks['esp32_eeprom_write'] = {
    init: function () {
        this.appendValueInput("VALUE").setCheck(null).appendField("EEPROM write value");
        this.appendValueInput("ADDRESS").setCheck("Number").appendField("at address");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Write a value to EEPROM at the given address.");
    }
};

// 17. EEPROM Read
Blockly.Blocks['esp32_eeprom_read'] = {
    init: function () {
        this.appendValueInput("ADDRESS").setCheck("Number").appendField("EEPROM read address");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Read a value from EEPROM at the given address.");
    }
};

// 18. Digital Write – variable pin (accepts value input)
Blockly.Blocks['esp32_digital_write_var'] = {
    init: function () {
        this.appendValueInput("PIN").setCheck("Number").appendField("digital write PIN");
        this.appendDummyInput()
            .appendField("to")
            .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "STATE");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Write HIGH or LOW to a variable pin number.");
    }
};

// 19. Digital Read – variable pin
Blockly.Blocks['esp32_digital_read_var'] = {
    init: function () {
        this.appendValueInput("PIN").setCheck("Number").appendField("digital read PIN");
        this.appendDummyInput()
            .appendField("pull-up")
            .appendField(new Blockly.FieldCheckbox("FALSE"), "PULLUP");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Read digital state of a variable pin number.");
    }
};

// 20. NTC Thermistor Temperature
Blockly.Blocks['esp32_analog_read_temp'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("NTC temperature PIN")
            .appendField(new Blockly.FieldDropdown([
                ["32", "32"], ["33", "33"], ["34", "34"], ["35", "35"], ["36", "36"], ["39", "39"]
            ]), "PIN");
        this.setOutput(true, "Number");
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Read temperature (°C) from an NTC thermistor.");
    }
};

// 21. DS18B20 One-Wire Temperature
Blockly.Blocks['esp32_analog_read_ds18b20'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("DS18B20 temperature PIN")
            .appendField(new Blockly.FieldDropdown([
                ["4", "4"], ["13", "13"], ["14", "14"], ["16", "16"], ["17", "17"], ["18", "18"]
            ]), "PIN");
        this.setOutput(true, "Number");
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Read temperature (°C) from a DS18B20 one-wire sensor.");
    }
};

// 22. Capacitive Touch Read
Blockly.Blocks['esp32_capacitive_touch'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("capacitive touch PIN")
            .appendField(new Blockly.FieldDropdown([
                ["T0/4", "4"], ["T1/0", "0"], ["T2/2", "2"], ["T3/15", "15"],
                ["T4/13", "13"], ["T5/12", "12"], ["T6/14", "14"], ["T7/27", "27"],
                ["T8/33", "33"], ["T9/32", "32"]
            ]), "PIN");
        this.setOutput(true, "Number");
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Read raw capacitive touch value from a touch-capable pin.");
    }
};

// 23. Voice Play (EMMI speaker)
Blockly.Blocks['esp32_voice_play'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("play voice")
            .appendField(new Blockly.FieldDropdown([
                ["Hi I am Emmi", "HI_I_AM_EMMI"],
                ["Obstacle detected", "OBSTACLE"],
                ["Hello", "HELLO"],
                ["Goodbye", "GOODBYE"]
            ]), "VOICE_ID");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Play a prerecorded voice message through the EMMI speaker.");
    }
};

// 24. Voice Stop
Blockly.Blocks['esp32_voice_stop'] = {
    init: function () {
        this.appendDummyInput().appendField("stop sound");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(ARDUINO_HUE);
        this.setTooltip("Stop any currently playing sound.");
    }
};


Blockly.Blocks['custom_math_map'] = {
    init: function () {
        this.appendValueInput("VALUE").setCheck("Number").appendField("map");
        this.appendValueInput("FROM_LOW").setCheck("Number").appendField("from");
        this.appendValueInput("FROM_HIGH").setCheck("Number").appendField("-");
        this.appendValueInput("TO_LOW").setCheck("Number").appendField("to");
        this.appendValueInput("TO_HIGH").setCheck("Number").appendField("-");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour("#388E3C");
        this.setTooltip("Map a value from one range to another.");
    }
};
Blockly.Blocks['custom_math_random_int'] = {
    init: function () {
        this.appendValueInput("FROM").setCheck("Number").appendField("random");
        this.appendValueInput("TO").setCheck("Number").appendField("&");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour("#388E3C");
        this.setTooltip("Return a random integer between the two values.");
    }
};
Blockly.Blocks['custom_math_constrain'] = {
    init: function () {
        this.appendValueInput("VALUE").setCheck("Number").appendField("constrain #");
        this.appendValueInput("LOW").setCheck("Number").appendField("between");
        this.appendValueInput("HIGH").setCheck("Number").appendField("&");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour("#388E3C");
        this.setTooltip("Constrain a number to be between the specified limits.");
    }
};
Blockly.Blocks['cast_to_byte'] = {
    init: function () {
        this.appendValueInput("VALUE").setCheck(null).appendField("Casting to Byte");
        this.setOutput(true, "Number");
        this.setColour("#388E3C");
    }
};
Blockly.Blocks['cast_to_unsigned_int'] = {
    init: function () {
        this.appendValueInput("VALUE").setCheck(null).appendField("Casting to unsigned Int");
        this.setOutput(true, "Number");
        this.setColour("#388E3C");
    }
};
Blockly.Blocks['cast_to_int'] = {
    init: function () {
        this.appendValueInput("VALUE").setCheck(null).appendField("Casting to Int");
        this.setOutput(true, "Number");
        this.setColour("#388E3C");
    }
};
Blockly.Blocks['cast_to_float'] = {
    init: function () {
        this.appendValueInput("VALUE").setCheck(null).appendField("Casting to Float");
        this.setOutput(true, "Number");
        this.setColour("#388E3C");
    }
};

/* =======================================================
   Extended Operator Blocks – from EMMI_BOT_V2_WIRED reference
   ======================================================= */

var OPERATORS_HUE = "#388E3C";

// ── logic_boolean (true / false) ──────────
Blockly.Blocks['logic_boolean'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["true", "TRUE"], ["false", "FALSE"]]), "BOOL");
        this.setOutput(true, "Boolean");
        this.setTooltip("Returns boolean true or false.");
    }
};

// ── math_number (number literal) ──────────
Blockly.Blocks['math_number'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.appendDummyInput()
            .appendField(new Blockly.FieldNumber(0), "NUM");
        this.setOutput(true, "Number");
        this.setTooltip("A number value.");
    }
};

// ── math_arithmetic (+, -, *, /, ^) ──────────
Blockly.Blocks['math_arithmetic'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.setOutput(true, "Number");
        this.appendValueInput("A").setCheck("Number");
        this.appendValueInput("B").setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["+", "ADD"], ["-", "MINUS"], ["×", "MULTIPLY"], ["÷", "DIVIDE"], ["^", "POWER"]
            ]), "OP");
        this.setInputsInline(true);
        this.setTooltip("Arithmetic operation.");
    }
};

// ── logic_compare (=, ≠, <, ≤, >, ≥) ──────────
Blockly.Blocks['logic_compare'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.setOutput(true, "Boolean");
        this.appendValueInput("A");
        this.appendValueInput("B")
            .appendField(new Blockly.FieldDropdown([
                ["=", "EQ"], ["≠", "NEQ"], ["<", "LT"], ["≤", "LTE"], [">", "GT"], ["≥", "GTE"]
            ]), "OP");
        this.setInputsInline(true);
        this.setTooltip("Compare two values.");
    }
};

// ── math_single (sqrt, abs, neg) ──────────
Blockly.Blocks['math_single'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.setOutput(true, "Number");
        this.appendValueInput("NUM").setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["√", "ROOT"], ["|x|", "ABS"], ["-", "NEG"]
            ]), "OP");
        this.setTooltip("Math single operation (sqrt, abs, negate).");
    }
};

// ── math_trig (sin, cos, tan) ──────────
Blockly.Blocks['math_trig'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.setOutput(true, "Number");
        this.appendValueInput("NUM").setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["sin", "SIN"], ["cos", "COS"], ["tan", "TAN"]
            ]), "OP");
        this.setTooltip("Trigonometric function.");
    }
};

// ── math_constant (π, e, φ, √2, √½, ∞) ──────────
Blockly.Blocks['math_constant'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.setOutput(true, "Number");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
                ["π", "PI"], ["e", "E"], ["φ", "GOLDEN_RATIO"],
                ["√2", "SQRT2"], ["√½", "SQRT1_2"], ["∞", "INFINITY"]
            ]), "CONSTANT");
        this.setTooltip("Mathematical constant.");
    }
};

// ── math_modulo (remainder) ──────────
Blockly.Blocks['math_modulo'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.appendValueInput("DIVIDEND").setCheck("Number").appendField("remainder of");
        this.appendValueInput("DIVISOR").setCheck("Number").appendField("÷");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip("Remainder from division.");
    }
};

// ── math_round (round / ceil / floor) ──────────
Blockly.Blocks['math_round'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.setOutput(true, "Number");
        this.appendValueInput("NUM").setCheck("Number")
            .appendField(new Blockly.FieldDropdown([
                ["round", "ROUND"], ["round up", "ROUNDUP"], ["round down", "ROUNDDOWN"]
            ]), "OP");
        this.setTooltip("Round a number.");
    }
};

// ── math_random_int (random integer) ──────────
Blockly.Blocks['math_random_int'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.appendValueInput("FROM").setCheck("Number").appendField("random integer from");
        this.appendValueInput("TO").setCheck("Number").appendField("to");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip("Random integer in a range.");
    }
};

// ── math_number_property (even, odd, prime, etc.) ──────────
Blockly.Blocks['math_number_property'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        var dropdown = new Blockly.FieldDropdown([
            ["is even", "EVEN"], ["is odd", "ODD"], ["is prime", "PRIME"],
            ["is whole", "WHOLE"], ["is positive", "POSITIVE"], ["is negative", "NEGATIVE"],
            ["is divisible by", "DIVISIBLE_BY"]
        ], function (option) {
            var divisorInput = (option === "DIVISIBLE_BY");
            this.sourceBlock_.updateShape_(divisorInput);
        });
        this.appendValueInput("NUMBER_TO_CHECK").setCheck("Number");
        this.appendDummyInput().appendField(dropdown, "PROPERTY");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setTooltip("Check a property of a number.");
    },
    mutationToDom: function () {
        var container = document.createElement("mutation");
        container.setAttribute("divisor_input", this.getFieldValue("PROPERTY") === "DIVISIBLE_BY");
        return container;
    },
    domToMutation: function (xmlElement) {
        this.updateShape_(xmlElement.getAttribute("divisor_input") === "true");
    },
    updateShape_: function (divisorInput) {
        var inputExists = this.getInput("DIVISOR");
        if (divisorInput) {
            if (!inputExists) this.appendValueInput("DIVISOR").setCheck("Number");
        } else if (inputExists) {
            this.removeInput("DIVISOR");
        }
    }
};

// ── intervalle (range comparison: A < x < B) ──────────
Blockly.Blocks['intervalle'] = {
    init: function () {
        var OPERATORS = [["<", "LT"], ["≤", "LTE"], [">", "GT"], ["≥", "GTE"]];
        this.setColour(OPERATORS_HUE);
        this.appendValueInput("inf").setCheck("Number");
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(OPERATORS), "comp_inf");
        this.appendValueInput("valeur").setCheck(null);
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(OPERATORS), "comp_sup");
        this.appendValueInput("sup").setCheck("Number");
        this.setOutput(true, "Boolean");
        this.setInputsInline(true);
        this.setTooltip("Check if value is within a range.");
    }
};

// ── text_join (join strings) ──────────
Blockly.Blocks['text_join'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.itemCount_ = 2;
        this.updateShape_();
        this.setOutput(true, "String");
        this.setTooltip("Join multiple text items together.");
    },
    mutationToDom: function () {
        var container = document.createElement("mutation");
        container.setAttribute("items", this.itemCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute("items"), 10) || 2;
        this.updateShape_();
    },
    updateShape_: function () {
        // Remove old inputs
        var i = 0;
        while (this.getInput("ADD" + i)) { this.removeInput("ADD" + i); i++; }
        if (this.getInput("EMPTY")) this.removeInput("EMPTY");
        // Build inputs
        if (this.itemCount_ === 0) {
            this.appendDummyInput("EMPTY").appendField("join");
        } else {
            for (var j = 0; j < this.itemCount_; j++) {
                var inp = this.appendValueInput("ADD" + j);
                if (j === 0) inp.appendField("join");
            }
        }
    }
};

// ── text_length (length of string) ──────────
Blockly.Blocks['text_length'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.appendValueInput("VALUE").setCheck(["String", "Array"]).appendField("length of");
        this.setOutput(true, "Number");
        this.setTooltip("Returns the length of a string or list.");
    }
};

// ── text_isEmpty (is string/list empty?) ──────────
Blockly.Blocks['text_isEmpty'] = {
    init: function () {
        this.setColour(OPERATORS_HUE);
        this.appendValueInput("VALUE").setCheck(["String", "Array"]).appendField("is empty");
        this.setOutput(true, "Boolean");
        this.setTooltip("Returns true if the text is empty.");
    }
};