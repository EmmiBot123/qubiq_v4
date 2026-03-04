'use strict';

/* =======================================================
   Variable Generators - Custom Implementation
   ======================================================= */

// Helper: Sanitize variable name locally to avoid Blockly Internal issues
function sanitizeVarName(name) {
    if (!name) return 'myVar';
    // Remove non-alphanumeric, ensure starts with letter/underscore
    var clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!clean.match(/^[a-zA-Z_]/)) {
        clean = 'var_' + clean;
    }
    return clean;
}

// 1. Declare Variable
javaGenerator.forBlock['custom_variable_declare'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var dropdown_type = block.getFieldValue('TYPE');
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        ' + dropdown_type + ' ' + variable_name + ' = ' + value_value + ';\n';
};

// 2. Set Variable
javaGenerator.forBlock['custom_variable_set'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        ' + variable_name + ' = ' + value_value + ';\n';
};

// 3. Change Variable
javaGenerator.forBlock['custom_variable_change'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '1';
    return '        ' + variable_name + ' += ' + value_value + ';\n';
};

// 4. Declare Constant
javaGenerator.forBlock['custom_constant_declare'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var dropdown_type = block.getFieldValue('TYPE');
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarName(text_var);
    return '        final ' + dropdown_type + ' ' + cleanName + ' = ' + value_value + ';\n';
};

// 6. Variable Getter
javaGenerator.forBlock['custom_variable_get'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    return [variable_name, javaGenerator.ORDER_ATOMIC];
};

/* =======================================================
   Python Variable Generators
   ======================================================= */

pythonGenerator.forBlock['custom_variable_declare'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return variable_name + ' = ' + value_value + '\n';
};

pythonGenerator.forBlock['custom_variable_set'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return variable_name + ' = ' + value_value + '\n';
};

pythonGenerator.forBlock['custom_variable_change'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '1';
    return variable_name + ' += ' + value_value + '\n';
};

pythonGenerator.forBlock['custom_constant_declare'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarName(text_var);
    pythonGenerator.definitions_['const_' + cleanName] = cleanName + ' = ' + value_value + '  # constant';
    return '';
};

javaGenerator.forBlock['custom_constant_set'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarName(text_var);
    return '        // #define ' + cleanName + ' ' + value_value + '\n' +
        '        final int ' + cleanName + ' = ' + value_value + ';\n';
};

pythonGenerator.forBlock['custom_variable_get'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    return [variable_name, pythonGenerator.ORDER_ATOMIC];
};

/* =======================================================
   Java Variable Generators
   ======================================================= */

javaGenerator.forBlock['custom_variable_declare'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var dropdown_type = block.getFieldValue('TYPE');
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        ' + dropdown_type + ' ' + variable_name + ' = ' + value_value + ';\n';
};

javaGenerator.forBlock['custom_variable_set'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        ' + variable_name + ' = ' + value_value + ';\n';
};

javaGenerator.forBlock['custom_variable_change'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '1';
    return '        ' + variable_name + ' += ' + value_value + ';\n';
};

javaGenerator.forBlock['custom_constant_declare'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var dropdown_type = block.getFieldValue('TYPE');
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarName(text_var);
    return '        final ' + dropdown_type + ' ' + cleanName + ' = ' + value_value + ';\n';
};

javaGenerator.forBlock['custom_constant_set'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarName(text_var);
    return '        // #define ' + cleanName + ' ' + value_value + '\n' +
        '        final int ' + cleanName + ' = ' + value_value + ';\n';
};

javaGenerator.forBlock['custom_variable_get'] = function (block) {
    var variable_name = sanitizeVarName(block.getField('VAR').getText());
    return [variable_name, javaGenerator.ORDER_ATOMIC];
};
