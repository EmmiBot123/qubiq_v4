'use strict';

/* =======================================================
   Variable Generators - Java Implementation
   ======================================================= */

// Helper: Sanitize variable name (same as Arduino version)
function sanitizeVarNameJava(name) {
    if (!name) return 'myVar';
    var clean = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!clean.match(/^[a-zA-Z_]/)) {
        clean = 'var_' + clean;
    }
    return clean;
}

// Map Arduino types to Java types
function mapTypeToJava(type) {
    var typeMap = {
        'int': 'int',
        'long': 'long',
        'float': 'float',
        'char': 'char',
        'String': 'String',
        'boolean': 'boolean',
        'byte': 'byte'
    };
    return typeMap[type] || 'int';
}

// 1. Declare Variable
javaGenerator.forBlock['custom_variable_declare'] = function (block) {
    var variable_name = sanitizeVarNameJava(block.getField('VAR').getText());
    var dropdown_type = block.getFieldValue('TYPE');
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var javaType = mapTypeToJava(dropdown_type);

    javaGenerator.variables_[variable_name] = javaType + ' ' + variable_name + ';';

    return '        ' + variable_name + ' = ' + value_value + ';\n';
};

// 2. Set Variable
javaGenerator.forBlock['custom_variable_set'] = function (block) {
    var variable_name = sanitizeVarNameJava(block.getField('VAR').getText());
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    return '        ' + variable_name + ' = ' + value_value + ';\n';
};

// 3. Change Variable
javaGenerator.forBlock['custom_variable_change'] = function (block) {
    var variable_name = sanitizeVarNameJava(block.getField('VAR').getText());
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '1';
    return '        ' + variable_name + ' += ' + value_value + ';\n';
};

// 4. Declare Constant
javaGenerator.forBlock['custom_constant_declare'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var dropdown_type = block.getFieldValue('TYPE');
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarNameJava(text_var);
    var javaType = mapTypeToJava(dropdown_type);

    javaGenerator.variables_[cleanName] = 'static final ' + javaType + ' ' + cleanName + ' = ' + value_value + ';';

    return '';
};

// 5. Set Constant (Define)
javaGenerator.forBlock['custom_constant_set'] = function (block) {
    var text_var = block.getField('VAR').getText();
    var value_value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    var cleanName = sanitizeVarNameJava(text_var);

    javaGenerator.variables_['final_' + cleanName] = 'static final int ' + cleanName + ' = ' + value_value + ';';

    return '';
};

// 6. Variable Getter
javaGenerator.forBlock['custom_variable_get'] = function (block) {
    var variable_name = sanitizeVarNameJava(block.getField('VAR').getText());
    return [variable_name, javaGenerator.ORDER_ATOMIC];
};

console.log('Java variable generators loaded');
