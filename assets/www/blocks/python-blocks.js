/**
 * PyBlocks - Custom Python Block Definitions
 * Additional blocks for Python-specific functionality
 */

(function () {
    // Define custom blocks for Python
    Blockly.defineBlocksWithJsonArray([
        // Comment block
        {
            "type": "python_comment",
            "message0": "# %1",
            "args0": [
                {
                    "type": "field_input",
                    "name": "COMMENT",
                    "text": "This is a comment"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#888888",
            "tooltip": "Add a comment to your code",
            "helpUrl": ""
        },

        // Type conversion - int()
        {
            "type": "python_int",
            "message0": "int ( %1 )",
            "args0": [
                {
                    "type": "input_value",
                    "name": "VALUE"
                }
            ],
            "output": "Number",
            "colour": "#5C68A6",
            "tooltip": "Convert to integer",
            "helpUrl": ""
        },

        // Type conversion - str()
        {
            "type": "python_str",
            "message0": "str ( %1 )",
            "args0": [
                {
                    "type": "input_value",
                    "name": "VALUE"
                }
            ],
            "output": "String",
            "colour": "#5BA58C",
            "tooltip": "Convert to string",
            "helpUrl": ""
        },

        // Type conversion - float()
        {
            "type": "python_float",
            "message0": "float ( %1 )",
            "args0": [
                {
                    "type": "input_value",
                    "name": "VALUE"
                }
            ],
            "output": "Number",
            "colour": "#5C68A6",
            "tooltip": "Convert to float",
            "helpUrl": ""
        },

        // --- Category 1: Variables & Core Tokens ---
        {
            "type": "python_boolean",
            "message0": "%1",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BOOL",
                    "options": [
                        ["True", "True"],
                        ["False", "False"]
                    ]
                }
            ],
            "output": "Boolean",
            "colour": "#4C97FF",
            "tooltip": "Python Boolean value",
            "helpUrl": ""
        },
        {
            "type": "python_string_multi",
            "message0": "multi-line string %1",
            "args0": [
                {
                    "type": "field_multilinetext",
                    "name": "TEXT",
                    "text": "line 1\nline 2"
                }
            ],
            "output": "String",
            "colour": "#5BA58C",
            "tooltip": "Multi-line string ('''...''')",
            "helpUrl": ""
        },
        {
            "type": "python_assign_aug",
            "message0": "%1 %2 %3",
            "args0": [
                { "type": "input_value", "name": "VAR" },
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["+=", "+="],
                        ["-=", "-="],
                        ["*=", "*="],
                        ["/=", "/="],
                        ["//=", "//="],
                        ["%=", "%="]
                    ]
                },
                { "type": "input_value", "name": "VALUE" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#FF8C1A",
            "tooltip": "Augmented assignment",
            "helpUrl": ""
        },
        {
            "type": "python_type",
            "message0": "type ( %1 )",
            "args0": [{ "type": "input_value", "name": "VALUE" }],
            "output": null,
            "colour": "#4C97FF",
            "tooltip": "Get the type of an object",
            "helpUrl": ""
        },

        // --- Category 2: Operators & Logic ---
        {
            "type": "python_arithmetic_adv",
            "message0": "%1 %2 %3",
            "args0": [
                { "type": "input_value", "name": "A" },
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["// (floor div)", "//"],
                        ["% (modulo)", "%"],
                        ["** (power)", "**"]
                    ]
                },
                { "type": "input_value", "name": "B" }
            ],
            "output": "Number",
            "colour": "#5C68A6",
            "tooltip": "Advanced arithmetic operators",
            "helpUrl": ""
        },
        {
            "type": "python_logic_membership",
            "message0": "%1 %2 %3",
            "args0": [
                { "type": "input_value", "name": "A" },
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["in", "in"],
                        ["not in", "not in"],
                        ["is", "is"],
                        ["is not", "is not"]
                    ]
                },
                { "type": "input_value", "name": "B" }
            ],
            "output": "Boolean",
            "colour": "#5B80A5",
            "tooltip": "Membership and Identity operators",
            "helpUrl": ""
        },

        // --- Category 3: Control Flow ---
        {
            "type": "python_jump_break",
            "message0": "break",
            "previousStatement": null,
            "colour": "#5CA65C",
            "tooltip": "Break out of the inner-most loop",
            "helpUrl": ""
        },
        {
            "type": "python_jump_continue",
            "message0": "continue",
            "previousStatement": null,
            "colour": "#5CA65C",
            "tooltip": "Continue with the next iteration of the loop",
            "helpUrl": ""
        },
        {
            "type": "python_jump_pass",
            "message0": "pass",
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#5CA65C",
            "tooltip": "Pass statement (does nothing)",
            "helpUrl": ""
        },
        {
            "type": "python_for_range",
            "message0": "for %1 in range( %2 , %3 , %4 )",
            "args0": [
                { "type": "input_value", "name": "VAR" },
                { "type": "input_value", "name": "START" },
                { "type": "input_value", "name": "STOP" },
                { "type": "input_value", "name": "STEP" }
            ],
            "message1": "do %1",
            "args1": [{ "type": "input_statement", "name": "DO" }],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#5CA65C",
            "tooltip": "For loop using range(start, stop, step)",
            "helpUrl": ""
        },

        // --- Category 4: Built-in Data Structures ---
        {
            "type": "python_string_method",
            "message0": "string %1 . %2 ( )",
            "args0": [
                { "type": "input_value", "name": "STR" },
                {
                    "type": "field_dropdown",
                    "name": "METHOD",
                    "options": [
                        ["upper", "upper"],
                        ["lower", "lower"],
                        ["capitalize", "capitalize"],
                        ["title", "title"],
                        ["strip", "strip"]
                    ]
                }
            ],
            "output": "String",
            "colour": "#5BA58C",
            "tooltip": "Common string methods",
            "helpUrl": ""
        },
        {
            "type": "python_list_method",
            "message0": "list %1 . %2 ( %3 )",
            "args0": [
                { "type": "input_value", "name": "LIST" },
                {
                    "type": "field_dropdown",
                    "name": "METHOD",
                    "options": [
                        ["append", "append"],
                        ["extend", "extend"],
                        ["insert", "insert"],
                        ["remove", "remove"],
                        ["pop", "pop"],
                        ["sort", "sort"],
                        ["reverse", "reverse"]
                    ]
                },
                { "type": "input_value", "name": "VAL" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#745CA6",
            "tooltip": "Common list methods",
            "helpUrl": ""
        },
        {
            "type": "python_tuple_create",
            "message0": "create tuple with %1",
            "args0": [{ "type": "input_value", "name": "ITEMS" }],
            "output": "Tuple",
            "colour": "#745CA6",
            "tooltip": "Create an immutable Python tuple",
            "helpUrl": ""
        },
        {
            "type": "dict_create",
            "message0": "create empty dictionary",
            "output": "Dict",
            "colour": "#FF8C1A",
            "tooltip": "Create an empty Python dictionary {}",
            "helpUrl": ""
        },
        {
            "type": "dict_set",
            "message0": "in dict %1 set key %2 to %3",
            "args0": [
                { "type": "input_value", "name": "DICT" },
                { "type": "input_value", "name": "KEY" },
                { "type": "input_value", "name": "VALUE" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#FF8C1A",
            "tooltip": "Set a value for a specific key in a dictionary",
            "helpUrl": ""
        },
        {
            "type": "dict_get",
            "message0": "in dict %1 get key %2",
            "args0": [
                { "type": "input_value", "name": "DICT" },
                { "type": "input_value", "name": "KEY" }
            ],
            "output": null,
            "colour": "#FF8C1A",
            "tooltip": "Get the value of a key from a dictionary",
            "helpUrl": ""
        },

        // --- Category 5: Modular Programming ---
        {
            "type": "python_module_import",
            "message0": "import %1 as %2",
            "args0": [
                { "type": "field_input", "name": "MODULE", "text": "math" },
                { "type": "field_input", "name": "ALIAS", "text": "m" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#9A5CA6",
            "tooltip": "Import a Python module with an optional alias",
            "helpUrl": ""
        },
        {
            "type": "python_math_random",
            "message0": "%1 . %2 ( %3 )",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "MODULE",
                    "options": [
                        ["math", "math"],
                        ["random", "random"]
                    ]
                },
                {
                    "type": "field_dropdown",
                    "name": "FUNC",
                    "options": [
                        ["sqrt", "sqrt"],
                        ["ceil", "ceil"],
                        ["floor", "floor"],
                        ["randint", "randint"],
                        ["random", "random"]
                    ]
                },
                { "type": "input_value", "name": "VAL" }
            ],
            "output": "Number",
            "colour": "#9A5CA6",
            "tooltip": "Common math and random functions",
            "helpUrl": ""
        },

        // --- Category 6: Data Management ---
        {
            "type": "file_open",
            "message0": "open file %1 in mode %2",
            "args0": [
                { "type": "input_value", "name": "FILENAME" },
                {
                    "type": "field_dropdown",
                    "name": "MODE",
                    "options": [
                        ["read (r)", "r"],
                        ["write (w)", "w"],
                        ["append (a)", "a"],
                        ["read binary (rb)", "rb"],
                        ["write binary (wb)", "wb"]
                    ]
                }
            ],
            "output": "File",
            "colour": "#9A5CA6",
            "tooltip": "Open a file (text or binary)",
            "helpUrl": ""
        },
        {
            "type": "file_read",
            "message0": "read from file %1",
            "args0": [{ "type": "input_value", "name": "FILE" }],
            "output": "String",
            "colour": "#9A5CA6",
            "tooltip": "Read content from a file",
            "helpUrl": ""
        },
        {
            "type": "file_write",
            "message0": "write %1 to file %2",
            "args0": [
                { "type": "input_value", "name": "TEXT" },
                { "type": "input_value", "name": "FILE" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#9A5CA6",
            "tooltip": "Write text to a file",
            "helpUrl": ""
        },
        {
            "type": "file_close",
            "message0": "close file %1",
            "args0": [{ "type": "input_value", "name": "FILE" }],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#9A5CA6",
            "tooltip": "Close a file",
            "helpUrl": ""
        },
        {
            "type": "python_file_readlines",
            "message0": "read all lines from file %1",
            "args0": [{ "type": "input_value", "name": "FILE" }],
            "output": "Array",
            "colour": "#9A5CA6",
            "tooltip": "Read all lines into a list",
            "helpUrl": ""
        },
        {
            "type": "python_pickle",
            "message0": "pickle %1 %2 to file %3",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["dump", "dump"],
                        ["load", "load"]
                    ]
                },
                { "type": "input_value", "name": "OBJ" },
                { "type": "input_value", "name": "FILE" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#9A5CA6",
            "tooltip": "Python Pickle operations for binary files",
            "helpUrl": ""
        },
        {
            "type": "python_csv_op",
            "message0": "CSV %1 file %2",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["reader", "reader"],
                        ["writer", "writer"]
                    ]
                },
                { "type": "input_value", "name": "FILE" }
            ],
            "output": null,
            "colour": "#9A5CA6",
            "tooltip": "CSV reader/writer operations",
            "helpUrl": ""
        },

        // --- Category 7: Advanced Data & DB ---
        {
            "type": "python_stack_pushpop",
            "message0": "Stack %1 item %2 to/from %3",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["Push", "append"],
                        ["Pop", "pop"]
                    ]
                },
                { "type": "input_value", "name": "ITEM" },
                { "type": "input_value", "name": "STACK" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#58A6FF",
            "tooltip": "Linear Stack Push and Pop operations",
            "helpUrl": ""
        },
        {
            "type": "python_stack_empty",
            "message0": "is stack %1 empty?",
            "args0": [{ "type": "input_value", "name": "STACK" }],
            "output": "Boolean",
            "colour": "#58A6FF",
            "tooltip": "Check if stack is empty (len == 0)",
            "helpUrl": ""
        },
        {
            "type": "mysql_connect",
            "message0": "connect to MySQL host %1 user %2 password %3 database %4",
            "args0": [
                { "type": "input_value", "name": "HOST" },
                { "type": "input_value", "name": "USER" },
                { "type": "input_value", "name": "PASS" },
                { "type": "input_value", "name": "DB" }
            ],
            "output": "DBConnection",
            "colour": "#58A6FF",
            "tooltip": "Create a MySQL database connection",
            "helpUrl": ""
        },
        {
            "type": "mysql_execute",
            "message0": "execute query %1 using connection %2",
            "args0": [
                { "type": "input_value", "name": "QUERY" },
                { "type": "input_value", "name": "CONN" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#58A6FF",
            "tooltip": "Execute a SQL query",
            "helpUrl": ""
        },
        {
            "type": "plt_plot",
            "message0": "plt.plot( x: %1 , y: %2 )",
            "args0": [
                { "type": "input_value", "name": "X" },
                { "type": "input_value", "name": "Y" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "Line plot using Matplotlib",
            "helpUrl": ""
        },
        {
            "type": "plt_bar",
            "message0": "plt.bar( x: %1 , height: %2 )",
            "args0": [
                { "type": "input_value", "name": "X" },
                { "type": "input_value", "name": "Y" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "Bar chart using Matplotlib",
            "helpUrl": ""
        },
        {
            "type": "plt_pie",
            "message0": "plt.pie( %1 , labels: %2 )",
            "args0": [
                { "type": "input_value", "name": "DATA" },
                { "type": "input_value", "name": "LABELS" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "Pie chart using Matplotlib",
            "helpUrl": ""
        },
        {
            "type": "plt_legend",
            "message0": "plt.legend()",
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "Show plot legend",
            "helpUrl": ""
        },
        {
            "type": "plt_show",
            "message0": "plt.show()",
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#DB61A2",
            "tooltip": "Display the plot",
            "helpUrl": ""
        },

        // --- Additional File Ops ---
        {
            "type": "python_file_readline",
            "message0": "read one line from file %1",
            "args0": [{ "type": "input_value", "name": "FILE" }],
            "output": "String",
            "colour": "#A65C81",
            "tooltip": "Read a single line from a file",
            "helpUrl": ""
        },
        {
            "type": "python_file_writelines",
            "message0": "write lines %1 to file %2",
            "args0": [
                { "type": "input_value", "name": "LINES" },
                { "type": "input_value", "name": "FILE" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": "#A65C81",
            "tooltip": "Write a list of strings to a file",
            "helpUrl": ""
        }
    ]);

    // Register Python generators for custom blocks
    if (typeof Blockly.Python !== 'undefined') {
        const pythonGenerator = Blockly.Python;

        // Helper to register generator correctly for both old and new Blockly versions
        function registerGenerator(blockName, generatorFunc) {
            if (pythonGenerator.forBlock) {
                pythonGenerator.forBlock[blockName] = generatorFunc;
            } else {
                pythonGenerator[blockName] = generatorFunc;
            }
        }

        // --- Custom Generators ---
        registerGenerator('python_comment', function (block) {
            var comment = block.getFieldValue('COMMENT');
            return '# ' + comment + '\n';
        });

        registerGenerator('python_int', function (block) {
            var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0';
            return ['int(' + value + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('python_str', function (block) {
            var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || "''";
            return ['str(' + value + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('python_float', function (block) {
            var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_FUNCTION_CALL) || '0';
            return ['float(' + value + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        // --- Category 1 Generators ---
        registerGenerator('python_boolean', function (block) {
            return [block.getFieldValue('BOOL'), pythonGenerator.ORDER_ATOMIC];
        });

        registerGenerator('python_string_multi', function (block) {
            var text = block.getFieldValue('TEXT');
            return ["'''" + text + "'''", pythonGenerator.ORDER_ATOMIC];
        });

        registerGenerator('python_assign_aug', function (block) {
            var varName = pythonGenerator.valueToCode(block, 'VAR', pythonGenerator.ORDER_ATOMIC) || 'x';
            var op = block.getFieldValue('OP');
            var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0';
            return varName + ' ' + op + ' ' + value + '\n';
        });

        registerGenerator('python_type', function (block) {
            var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || 'None';
            return ['type(' + value + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        // --- Category 2 Generators ---
        registerGenerator('python_arithmetic_adv', function (block) {
            var a = pythonGenerator.valueToCode(block, 'A', pythonGenerator.ORDER_NONE) || '0';
            var op = block.getFieldValue('OP');
            var b = pythonGenerator.valueToCode(block, 'B', pythonGenerator.ORDER_NONE) || '0';
            var order = (op === '**') ? pythonGenerator.ORDER_EXPONENTIATION : pythonGenerator.ORDER_MULTIPLICATIVE;
            return [a + ' ' + op + ' ' + b, order];
        });

        registerGenerator('python_logic_membership', function (block) {
            var a = pythonGenerator.valueToCode(block, 'A', pythonGenerator.ORDER_NONE) || 'None';
            var op = block.getFieldValue('OP');
            var b = pythonGenerator.valueToCode(block, 'B', pythonGenerator.ORDER_NONE) || 'None';
            return [a + ' ' + op + ' ' + b, pythonGenerator.ORDER_RELATIONAL];
        });

        // --- Category 3 Generators ---
        registerGenerator('python_jump_break', function (block) { return 'break\n'; });
        registerGenerator('python_jump_continue', function (block) { return 'continue\n'; });
        registerGenerator('python_jump_pass', function (block) { return 'pass\n'; });

        registerGenerator('python_for_range', function (block) {
            var varName = pythonGenerator.valueToCode(block, 'VAR', pythonGenerator.ORDER_ATOMIC) || 'i';
            var start = pythonGenerator.valueToCode(block, 'START', pythonGenerator.ORDER_NONE) || '0';
            var stop = pythonGenerator.valueToCode(block, 'STOP', pythonGenerator.ORDER_NONE) || '10';
            var step = pythonGenerator.valueToCode(block, 'STEP', pythonGenerator.ORDER_NONE) || '1';
            var branch = pythonGenerator.statementToCode(block, 'DO') || '    pass\n';
            return 'for ' + varName + ' in range(' + start + ', ' + stop + ', ' + step + '):\n' + branch;
        });

        // --- Category 4 Generators ---
        registerGenerator('python_string_method', function (block) {
            var str = pythonGenerator.valueToCode(block, 'STR', pythonGenerator.ORDER_MEMBER) || "''";
            var method = block.getFieldValue('METHOD');
            return [str + '.' + method + '()', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('python_list_method', function (block) {
            var list = pythonGenerator.valueToCode(block, 'LIST', pythonGenerator.ORDER_MEMBER) || '[]';
            var method = block.getFieldValue('METHOD');
            var val = pythonGenerator.valueToCode(block, 'VAL', pythonGenerator.ORDER_NONE) || '';
            return list + '.' + method + '(' + val + ')\n';
        });

        registerGenerator('python_tuple_create', function (block) {
            var items = pythonGenerator.valueToCode(block, 'ITEMS', pythonGenerator.ORDER_NONE) || '';
            // If items starts with [ and ends with ], convert to ( )
            if (items.startsWith('[') && items.endsWith(']')) {
                items = items.substring(1, items.length - 1);
            }
            return ['(' + items + ')', pythonGenerator.ORDER_ATOMIC];
        });

        registerGenerator('dict_create', function (block) {
            return ['{}', pythonGenerator.ORDER_ATOMIC];
        });

        registerGenerator('dict_set', function (block) {
            var dict = pythonGenerator.valueToCode(block, 'DICT', pythonGenerator.ORDER_MEMBER) || '{}';
            var key = pythonGenerator.valueToCode(block, 'KEY', pythonGenerator.ORDER_NONE) || "''";
            var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || 'None';
            return dict + '[' + key + '] = ' + value + '\n';
        });

        registerGenerator('dict_get', function (block) {
            var dict = pythonGenerator.valueToCode(block, 'DICT', pythonGenerator.ORDER_MEMBER) || '{}';
            var key = pythonGenerator.valueToCode(block, 'KEY', pythonGenerator.ORDER_NONE) || "''";
            var code = dict + '[' + key + ']';
            return [code, pythonGenerator.ORDER_MEMBER];
        });

        // --- Category 5 Generators ---
        registerGenerator('python_module_import', function (block) {
            var module = block.getFieldValue('MODULE');
            var alias = block.getFieldValue('ALIAS');
            return 'import ' + module + (alias ? ' as ' + alias : '') + '\n';
        });

        registerGenerator('python_math_random', function (block) {
            var module = block.getFieldValue('MODULE');
            var func = block.getFieldValue('FUNC');
            var val = pythonGenerator.valueToCode(block, 'VAL', pythonGenerator.ORDER_NONE) || '';
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_' + module] = 'import ' + module;
            return [module + '.' + func + '(' + val + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        // --- Category 6 Generators ---
        registerGenerator('file_open', function (block) {
            var filename = pythonGenerator.valueToCode(block, 'FILENAME', pythonGenerator.ORDER_NONE) || "'file.txt'";
            var mode = block.getFieldValue('MODE');
            return ['open(' + filename + ", '" + mode + "')", pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('file_read', function (block) {
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_MEMBER) || 'f';
            return [file + '.read()', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('file_write', function (block) {
            var text = pythonGenerator.valueToCode(block, 'TEXT', pythonGenerator.ORDER_NONE) || "''";
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_MEMBER) || 'f';
            return file + '.write(' + text + ')\n';
        });

        registerGenerator('file_close', function (block) {
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_MEMBER) || 'f';
            return file + '.close()\n';
        });

        registerGenerator('python_file_readlines', function (block) {
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_MEMBER) || 'f';
            return [file + '.readlines()', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('python_pickle', function (block) {
            var op = block.getFieldValue('OP');
            var obj = pythonGenerator.valueToCode(block, 'OBJ', pythonGenerator.ORDER_NONE) || 'data';
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_NONE) || 'f';
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_pickle'] = 'import pickle';
            if (op === 'dump') {
                return 'pickle.dump(' + obj + ', ' + file + ')\n';
            } else {
                return ['pickle.load(' + file + ')', pythonGenerator.ORDER_FUNCTION_CALL];
            }
        });

        registerGenerator('python_csv_op', function (block) {
            var op = block.getFieldValue('OP');
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_NONE) || 'f';
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_csv'] = 'import csv';
            return ['csv.' + op + '(' + file + ')', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        // --- Category 7 Generators ---
        registerGenerator('python_stack_pushpop', function (block) {
            var op = block.getFieldValue('OP');
            var item = pythonGenerator.valueToCode(block, 'ITEM', pythonGenerator.ORDER_NONE) || '';
            var stack = pythonGenerator.valueToCode(block, 'STACK', pythonGenerator.ORDER_MEMBER) || 'stack';
            if (op === 'append') {
                return stack + '.append(' + item + ')\n';
            } else {
                // Pop is also a statement - assign to variable if item provided, otherwise just pop
                if (item && item !== '') {
                    return item + ' = ' + stack + '.pop()\n';
                } else {
                    return stack + '.pop()\n';
                }
            }
        });


        registerGenerator('python_stack_empty', function (block) {
            var stack = pythonGenerator.valueToCode(block, 'STACK', pythonGenerator.ORDER_MEMBER) || 'stack';
            return ['len(' + stack + ') == 0', pythonGenerator.ORDER_RELATIONAL];
        });

        registerGenerator('mysql_connect', function (block) {
            var host = pythonGenerator.valueToCode(block, 'HOST', pythonGenerator.ORDER_NONE) || "'localhost'";
            var user = pythonGenerator.valueToCode(block, 'USER', pythonGenerator.ORDER_NONE) || "'root'";
            var pass = pythonGenerator.valueToCode(block, 'PASS', pythonGenerator.ORDER_NONE) || "''";
            var db = pythonGenerator.valueToCode(block, 'DB', pythonGenerator.ORDER_NONE) || "''";
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_mysql'] = 'import mysql.connector';
            var code = "mysql.connector.connect(host=" + host + ", user=" + user + ", password=" + pass + ", database=" + db + ")";
            return [code, pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('mysql_execute', function (block) {
            var query = pythonGenerator.valueToCode(block, 'QUERY', pythonGenerator.ORDER_NONE) || "''";
            var conn = pythonGenerator.valueToCode(block, 'CONN', pythonGenerator.ORDER_MEMBER) || 'mydb';
            var code = "cursor = " + conn + ".cursor()\n" +
                "cursor.execute(" + query + ")\n";
            return code;
        });

        registerGenerator('plt_plot', function (block) {
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || '[]';
            var y = pythonGenerator.valueToCode(block, 'Y', pythonGenerator.ORDER_NONE) || '[]';
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.plot(' + x + ', ' + y + ')\n';
        });

        registerGenerator('plt_bar', function (block) {
            var x = pythonGenerator.valueToCode(block, 'X', pythonGenerator.ORDER_NONE) || '[]';
            var y = pythonGenerator.valueToCode(block, 'Y', pythonGenerator.ORDER_NONE) || '[]';
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.bar(' + x + ', ' + y + ')\n';
        });

        registerGenerator('plt_pie', function (block) {
            var data = pythonGenerator.valueToCode(block, 'DATA', pythonGenerator.ORDER_NONE) || '[]';
            var labels = pythonGenerator.valueToCode(block, 'LABELS', pythonGenerator.ORDER_NONE) || '[]';
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.pie(' + data + ', labels=' + labels + ')\n';
        });

        registerGenerator('plt_legend', function (block) {
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.legend()\n';
        });

        registerGenerator('plt_show', function (block) {
            pythonGenerator.definitions_ = pythonGenerator.definitions_ || {};
            pythonGenerator.definitions_['import_plt'] = 'import matplotlib.pyplot as plt';
            return 'plt.show()\n';
        });

        registerGenerator('python_file_readline', function (block) {
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_MEMBER) || 'f';
            return [file + '.readline()', pythonGenerator.ORDER_FUNCTION_CALL];
        });

        registerGenerator('python_file_writelines', function (block) {
            var lines = pythonGenerator.valueToCode(block, 'LINES', pythonGenerator.ORDER_NONE) || '[]';
            var file = pythonGenerator.valueToCode(block, 'FILE', pythonGenerator.ORDER_MEMBER) || 'f';
            return file + '.writelines(' + lines + ')\n';
        });
    }
})();

console.log('PyBlocks custom blocks loaded');
