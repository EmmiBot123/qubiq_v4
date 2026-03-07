const fs = require('fs');
const content = fs.readFileSync('d:/EMMI_HTML/blocks/esp32_blocks.js', 'utf-8');
const regex = /Blockly\.Blocks\[['"]([^'"]+)['"]\]\s*=\s*/g;
let match;
const blocks = [];
while ((match = regex.exec(content))) {
    blocks.push(match[1]);
}
console.log(blocks.join(', '));
