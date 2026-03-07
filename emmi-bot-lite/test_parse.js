const fs = require('fs');
const code = fs.readFileSync('c:/EMMI_HTML/EMMI_HTML/blocks/emmi-bot-v2_blocks.js', 'utf8');

function extractBlockDefinitions(content) {
    const results = [];
    const regex = /Blockly\.Blocks\[['"]([^'"]+)['"]\]\s*=\s*\{/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const id = match[1];
        const startPos = match.index;
        const endPos = findClosingBrace(content, match.index + match[0].length - 1);
        if (endPos === -1) {
            console.log("FAILED to find closing brace for: " + id);
            continue;
        }
        results.push(id);
    }
    return results;
}

function findClosingBrace(content, openPos) {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let escaped = false;

    for (let i = openPos; i < content.length; i++) {
        const ch = content[i];
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }

        if (inString) {
            if (ch === stringChar) inString = false;
            continue;
        }

        if (ch === '"' || ch === "'" || ch === '`') {
            inString = true;
            stringChar = ch;
            continue;
        }

        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

const blocks = extractBlockDefinitions(code);
console.log("Found blocks:", blocks);
