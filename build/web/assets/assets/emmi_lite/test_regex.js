const fs = require('fs');
const content = fs.readFileSync('d:/EMMI_HTML/js/commands/common_commands.js', 'utf-8');
const results = [];
const regex = /(?:registry|emmiCommandGenerator\.forBlock)\[['"]([^'"]+)['"]\]\s*=\s*/g;
let match;
function findClosingBrace(text, startIndex) {
    let openCount = 0;
    for (let i = startIndex; i < text.length; i++) {
        if (text[i] === '{') openCount++;
        else if (text[i] === '}') {
            openCount--;
            if (openCount === 0) return i;
        }
    }
    return -1;
}

while ((match = regex.exec(content)) !== null) {
    const blockId = match[1];
    const afterEquals = content.substring(match.index + match[0].length).trimStart();
    let braceStart = -1;
    if (afterEquals.startsWith('function')) {
        braceStart = content.indexOf('{', match.index + match[0].length);
    } else if (afterEquals.startsWith('{')) {
        braceStart = match.index + match[0].length + (content.substring(match.index + match[0].length).indexOf('{'));
    } else {
        continue;
    }
    if (braceStart === -1) continue;
    const braceEnd = findClosingBrace(content, braceStart);
    if (braceEnd === -1) continue;
    let end = braceEnd + 1;
    if (content[end] === ';') end += 1;
    const code = content.substring(match.index, end).trim();
    results.push({ blockId, code });
}
console.log(JSON.stringify(results.map(r => r.blockId), null, 2));
