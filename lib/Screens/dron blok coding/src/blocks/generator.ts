import { javascriptGenerator } from 'blockly/javascript';

export const initGenerator = () => {
    javascriptGenerator.forBlock['takeoff'] = function () {
        return 'await takeoff();\n';
    };

    javascriptGenerator.forBlock['land'] = function () {
        return 'await land();\n';
    };

    javascriptGenerator.forBlock['move_forward'] = function (block) {
        const distance = block.getFieldValue('DISTANCE');
        return `await moveForward(${distance});\n`;
    };

    javascriptGenerator.forBlock['move_backward'] = function (block) {
        const distance = block.getFieldValue('DISTANCE');
        return `await moveBackward(${distance});\n`;
    };

    javascriptGenerator.forBlock['move_left'] = function (block) {
        const distance = block.getFieldValue('DISTANCE');
        return `await moveLeft(${distance});\n`;
    };

    javascriptGenerator.forBlock['move_right'] = function (block) {
        const distance = block.getFieldValue('DISTANCE');
        return `await moveRight(${distance});\n`;
    };

    javascriptGenerator.forBlock['rotate_left'] = function (block) {
        const degrees = block.getFieldValue('DEGREES');
        return `await rotateLeft(${degrees});\n`;
    };

    javascriptGenerator.forBlock['rotate_right'] = function (block) {
        const degrees = block.getFieldValue('DEGREES');
        return `await rotateRight(${degrees});\n`;
    };

    javascriptGenerator.forBlock['set_speed'] = function (block) {
        const speed = block.getFieldValue('SPEED');
        return `await setSpeed(${speed});\n`;
    };

    javascriptGenerator.forBlock['set_altitude'] = function (block) {
        const altitude = block.getFieldValue('ALTITUDE');
        return `await setAltitude(${altitude});\n`;
    };

    javascriptGenerator.forBlock['delay'] = function (block) {
        const seconds = block.getFieldValue('SECONDS');
        return `await delay(${seconds});\n`;
    };

    javascriptGenerator.forBlock['flip_forward'] = function () {
        return 'await flipForward();\n';
    };

    javascriptGenerator.forBlock['flip_backward'] = function () {
        return 'await flipBackward();\n';
    };

    javascriptGenerator.forBlock['flip_left'] = function () {
        return 'await flipLeft();\n';
    };

    javascriptGenerator.forBlock['flip_right'] = function () {
        return 'await flipRight();\n';
    };

    javascriptGenerator.forBlock['circle_left'] = function (block) {
        const radius = block.getFieldValue('RADIUS');
        const angle = block.getFieldValue('ANGLE');
        return `await circleLeft(${radius}, ${angle});\n`;
    };

    javascriptGenerator.forBlock['circle_right'] = function (block) {
        const radius = block.getFieldValue('RADIUS');
        const angle = block.getFieldValue('ANGLE');
        return `await circleRight(${radius}, ${angle});\n`;
    };

    javascriptGenerator.forBlock['go_to'] = function (block) {
        const x = block.getFieldValue('X');
        const y = block.getFieldValue('Y');
        const z = block.getFieldValue('Z');
        return `await goTo(${x}, ${y}, ${z});\n`;
    };

    javascriptGenerator.forBlock['set_led_color'] = function (block) {
        const color = block.getFieldValue('COLOR') || '#ffffff';
        return `await setLedColor('${color}');\n`;
    };

    javascriptGenerator.forBlock['spiral_up'] = function (block) {
        const radius = block.getFieldValue('RADIUS');
        const height = block.getFieldValue('HEIGHT');
        return `await spiralUp(${radius}, ${height});\n`;
    };

    javascriptGenerator.forBlock['emergency_stop'] = function () {
        return 'await emergencyStop();\n';
    };

    javascriptGenerator.forBlock['hover'] = function (block) {
        const duration = block.getFieldValue('DURATION');
        return `await wait(${duration * 1000});\n`;
    };
};
