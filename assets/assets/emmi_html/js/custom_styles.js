/**
 * Custom Block Styles
 * Applies specific styles to standard Blockly blocks
 */

document.addEventListener('DOMContentLoaded', function () {
    // Wait a brief moment to ensure Blockly definitions are loaded if they are async
    // Though usually they are loaded by script tags before this runs.

    if (typeof Blockly === 'undefined') {
        console.error('Blockly not loaded, cannot apply custom styles');
        return;
    }

    const CONTROL_STYLE = {
        "colour": "#FFAB19",
        "hat": "cap",
        "tooltip": "Control flow and logic",
        "helpUrl": ""
    };

    // Standard Control/Logic blocks to style
    const controlBlocks = [
        'controls_if',
        'controls_ifelse',
        'controls_repeat_ext',
        'controls_whileUntil',
        'controls_for',
        'controls_forEach',
        'controls_flow_statements'
    ];

    console.log('Applying custom styles to Control blocks...');

    controlBlocks.forEach(function (type) {
        if (Blockly.Blocks[type]) {
            const originalInit = Blockly.Blocks[type].init;

            // Override init
            Blockly.Blocks[type].init = function () {
                // Run original init to setup structure
                if (originalInit) {
                    originalInit.call(this);
                }

                // Apply overrides
                this.setColour(CONTROL_STYLE.colour);
                this.hat = CONTROL_STYLE.hat;

                // Optional: valid for some blocks
                if (CONTROL_STYLE.tooltip) {
                    this.setTooltip(CONTROL_STYLE.tooltip);
                }
                if (CONTROL_STYLE.helpUrl !== undefined) {
                    this.setHelpUrl(CONTROL_STYLE.helpUrl);
                }
            };
        } else {
            console.warn('Block type not found for styling:', type);
        }
    });

    console.log('Custom styles applied.');
});
