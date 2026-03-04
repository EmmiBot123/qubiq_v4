const topicTitle = document.getElementById('current-topic-title');
const codeEditor = document.getElementById('code-editor');
const livePreview = document.getElementById('live-preview');
const runBtn = document.getElementById('run-btn');
const autocompleteList = document.getElementById('autocomplete-list');

let currentTopic = null;

// --- Core HTML/CSS Tags & Properties ---
const htmlTags = [
    'html', 'head', 'title', 'body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'img', 'a',
    'audio', 'video', 'embed', 'table', 'tr', 'td', 'th', 'form',
    'input', 'label', 'button', 'div', 'span', 'style', 'script'
];

const cssProperties = [
    'color', 'background-color', 'background-image', 'font-family',
    'font-size', 'font-style', 'text-align', 'margin', 'padding',
    'border', 'width', 'height', 'float', 'position', 'display'
];

// --- Initialization ---
// Since sidebar is removed, load the first topic by default
loadTopic(syllabus.html[0]);

function loadTopic(topic) {
    currentTopic = topic;
    topicTitle.textContent = topic.title;
    codeEditor.value = ''; // Don't load example in left corner
    updatePreview();
}

// --- Editor Functions ---
function updatePreview() {
    const content = codeEditor.value;
    const frame = livePreview.contentWindow.document;
    frame.open();
    frame.write(content);
    frame.close();
}

runBtn.addEventListener('click', updatePreview);

// --- Auto-complete Logic ---
codeEditor.addEventListener('input', (e) => {
    const cursorPosition = codeEditor.selectionStart;
    const text = codeEditor.value;
    const lastChar = text[cursorPosition - 1];

    // Trigger on '<' for HTML tags
    if (lastChar === '<') {
        showSuggestions(htmlTags, '<');
    } else {
        hideSuggestions();
    }
});

function showSuggestions(list, trigger) {
    autocompleteList.innerHTML = '';

    list.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = tag;
        div.addEventListener('click', () => {
            insertSuggestion(tag, trigger);
        });
        autocompleteList.appendChild(div);
    });

    autocompleteList.style.display = 'block';

    // Position it roughly where the cursor is (simplified)
    const lines = codeEditor.value.substr(0, codeEditor.selectionStart).split("\n");
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length;

    autocompleteList.style.left = (20 + colNum * 8) + 'px';
    autocompleteList.style.top = (20 + lineNum * 24) + 'px';
}

function hideSuggestions() {
    autocompleteList.style.display = 'none';
}

function insertSuggestion(tag, trigger) {
    const pos = codeEditor.selectionStart;
    const text = codeEditor.value;
    const before = text.substring(0, pos);
    const after = text.substring(pos);

    let replacement = '';
    if (trigger === '<') {
        replacement = tag + '></' + tag + '>';
    } else {
        replacement = tag;
    }

    codeEditor.value = before + replacement + after;
    const newPos = pos + tag.length + 1;
    codeEditor.setSelectionRange(newPos, newPos);
    hideSuggestions();
    codeEditor.focus();
}

// Close suggestions on outside click
document.addEventListener('click', (e) => {
    if (e.target !== codeEditor && !autocompleteList.contains(e.target)) {
        hideSuggestions();
    }
});
