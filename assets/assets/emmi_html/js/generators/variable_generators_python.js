'use strict';

/* =======================================================
   Variable Generators - Python Implementation
   ======================================================= */

// Helper: Sanitize variable name (same logic as Arduino version)
function sanitizeVarNamePython(name) {
    if (!name) return 'my_var';
    var clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!clean.match(/^[a-zA-Z_]/)) {
        clean = 'var_' + clean;
    }
    return clean;
}

// 1. Declare Variable
pythonGenerator.forBlock['custom_variable_declare'] = function (block) {
    var variable_name = sanitizeVarNamePython(block.getField('VAR').getText());
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    // Python doesn't need type declarations
    return variable_name + ' = ' + value_value + '\n';
};

// 2. Set Variable
pythonGenerator.forBlock['custom_variable_set'] = function (block) {
    var variable_name = sanitizeVarNamePython(block.getField('VAR').getText());
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    return variable_name + ' = ' + value_value + '\n';
};

// 3. Change Variable
pythonGenerator.forBlock['custom_variable_change'] = function (block) {
    var variable_name = sanitizeVarNamePython(block.getField('VAR').getText());
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '1';
    return variable_name + ' += ' + value_value + '\n';
};

// 4. Declare Constant (Python convention: uppercase name)
pythonGenerator.forBlock['custom_constant_declare'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarNamePython(text_var);

    pythonGenerator.variables_[cleanName] = cleanName + ' = ' + value_value + '  # constant';

    return '';
};

// 5. Set Constant (Define)
pythonGenerator.forBlock['custom_constant_set'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var value_value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarNamePython(text_var);

    pythonGenerator.variables_[cleanName] = cleanName + ' = ' + value_value + '  # constant';

    return '';
};

// 6. Variable Getter
pythonGenerator.forBlock['custom_variable_get'] = function (block) {
    var variable_name = sanitizeVarNamePython(block.getField('VAR').getText());
    return [variable_name, pythonGenerator.ORDER_ATOMIC];
};

console.log('Python variable generators loaded');
