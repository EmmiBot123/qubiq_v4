function execCmd(command, value = null) {
    document.execCommand(command, false, value);

    // Update UI bars if color changed
    if (command === 'foreColor') {
        document.getElementById('fontColorBar').style.backgroundColor = value;
    }
    if (command === 'hiliteColor') {
        document.getElementById('highlightColorBar').style.backgroundColor = value;
    }

    const editor = document.getElementById('editor');
    editor.focus();
}

// Handle Custom Tab Switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.ribbon-pane').forEach(pane => pane.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Show corresponding pane
        const tabName = button.getAttribute('data-tab');
        const pane = document.getElementById(`pane-${tabName}`);
        if (pane) {
            pane.classList.add('active');
        }
    });
});

// Update word count and basic status
const editor = document.getElementById('editor');
const statusLeft = document.querySelector('.status-left');

editor.addEventListener('input', () => {
    const text = editor.innerText || "";
    const words = text.split(/\s+/).filter(word => word.length > 0).length;

    // Update word count display
    if (statusLeft.children.length > 1) {
        statusLeft.children[1].innerText = `${words} words`;
    }
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                execCmd('bold');
                break;
            case 'i':
                e.preventDefault();
                execCmd('italic');
                break;
            case 'u':
                e.preventDefault();
                execCmd('underline');
                break;
            case 's':
                e.preventDefault();
                saveDocument();
                break;
            case 'z':
                e.preventDefault();
                execCmd('undo');
                break;
            case 'y':
                e.preventDefault();
                execCmd('redo');
                break;
        }
    }
});

// Image Upload Logic
function uploadImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            execCmd('insertImage', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Auto-save Logic
function autoSave() {
    const content = document.getElementById('editor').innerHTML;
    const title = document.querySelector('.doc-title').innerText;
    localStorage.setItem('word_content', content);
    localStorage.setItem('word_title', title);
    console.log('Document auto-saved');
}

let autoSaveTimeout;
editor.addEventListener('input', () => {
    // Word Count
    const text = editor.innerText || "";
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    if (statusLeft.children.length > 1) {
        statusLeft.children[1].innerText = `${words} words`;
    }

    // Debounced Auto-save
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(autoSave, 2000);
});

// Style Box Logic
document.querySelectorAll('.style-box').forEach(box => {
    box.addEventListener('click', () => {
        const style = box.getAttribute('data-style');
        execCmd('formatBlock', style);
        document.querySelectorAll('.style-box').forEach(b => b.classList.remove('active'));
        box.classList.add('active');
    });
});

// Save functionality (Download as HTML)
function saveDocument() {
    const editorContent = document.getElementById('editor').innerHTML;
    const title = document.querySelector('.doc-title').innerText || 'Document';

    // Create a full HTML document blob
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
        .paper { width: 210mm; margin: auto; }
    </style>
</head>
<body>
    <div class="paper">${editorContent}</div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// Page Setup Logic
function setMargins(type) {
    const editor = document.getElementById('editor');
    const marginMap = {
        'narrow': '12.7mm',
        'normal': '25.4mm',
        'wide': '50.8mm'
    };
    editor.style.padding = marginMap[type] || marginMap['normal'];
}

function toggleOrientation() {
    const editor = document.getElementById('editor');
    editor.classList.toggle('landscape');
}

// Find & Replace Logic
function openFindModal() {
    document.getElementById('findModal').style.display = 'flex';
}

function closeFindModal() {
    document.getElementById('findModal').style.display = 'none';
}

function findText() {
    const searchTerm = document.getElementById('findInput').value;
    if (searchTerm) {
        window.find(searchTerm);
    }
}

function replaceText() {
    const findTerm = document.getElementById('findInput').value;
    const replaceTerm = document.getElementById('replaceInput').value;
    const editor = document.getElementById('editor');
    if (findTerm && editor.innerHTML.includes(findTerm)) {
        editor.innerHTML = editor.innerHTML.replace(findTerm, replaceTerm);
    }
}

// Zoom Functionality
const zoomSlider = document.getElementById('zoomSlider');
const zoomPercent = document.getElementById('zoomPercent');
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');

function updateZoom(value) {
    const paper = document.querySelector('.paper');
    paper.style.transform = `scale(${value / 100})`;
    paper.style.transformOrigin = 'top center';
    zoomPercent.innerText = `${value}%`;
    zoomSlider.value = value;
}

zoomSlider.addEventListener('input', (e) => {
    updateZoom(e.target.value);
});

zoomIn.addEventListener('click', () => {
    let val = parseInt(zoomSlider.value) + 10;
    if (val > 200) val = 200;
    updateZoom(val);
});

zoomOut.addEventListener('click', () => {
    let val = parseInt(zoomSlider.value) - 10;
    if (val < 50) val = 50;
    updateZoom(val);
});

// Phase 3 Features

// Focus Mode
function toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
}

// Navigation Pane
function toggleNavPane() {
    const navPane = document.getElementById('navPane');
    navPane.classList.toggle('active');
    if (navPane.classList.contains('active')) {
        updateNavPane();
    }
}

function updateNavPane() {
    const navContent = document.getElementById('navContent');
    const headings = document.getElementById('editor').querySelectorAll('h1, h2');
    navContent.innerHTML = '';

    if (headings.length === 0) {
        navContent.innerHTML = '<p class="nav-placeholder">No headings found.</p>';
        return;
    }

    headings.forEach((h, index) => {
        const item = document.createElement('div');
        item.className = `nav-item ${h.tagName.toLowerCase()}`;
        item.innerText = h.innerText || 'Untitled Heading';
        item.onclick = () => h.scrollIntoView({ behavior: 'smooth', block: 'center' });
        navContent.appendChild(item);
    });
}

// Line Spacing
function setLineSpacing(value) {
    document.getElementById('editor').style.lineHeight = value;
}

// Word Count Modal
function showWordCount() {
    const text = document.getElementById('editor').innerText;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0).length;

    alert(`Word Count Statistics:\n\nWords: ${words}\nCharacters: ${chars}\nParagraphs: ${paragraphs}`);
}

// Read Aloud
let synth = window.speechSynthesis;
function toggleReadAloud() {
    if (synth.speaking) {
        synth.cancel();
        return;
    }
    const text = document.getElementById('editor').innerText;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
}

// Update Nav Pane on input
editor.addEventListener('input', () => {
    if (document.getElementById('navPane').classList.contains('active')) {
        updateNavPane();
    }
});

// Phase 4 Features

// Table of Contents
function generateTOC() {
    const editor = document.getElementById('editor');
    const headings = editor.querySelectorAll('h1, h2');

    let tocHtml = '<div class="toc-container" contenteditable="false">';
    tocHtml += '<h3>Table of Contents</h3><ul>';

    headings.forEach((h, index) => {
        const id = `heading-${index}`;
        h.id = id;
        tocHtml += `<li class="toc-${h.tagName.toLowerCase()}"><a href="#${id}">${h.innerText}</a></li>`;
    });

    tocHtml += '</ul></div><p><br></p>';

    // Insert at the beginning
    editor.innerHTML = tocHtml + editor.innerHTML;
}

// Footnotes
function insertFootnote() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const footnoteNum = document.querySelectorAll('.footnote-ref').length + 1;

    // Create reference
    const ref = document.createElement('sup');
    ref.className = 'footnote-ref';
    ref.innerText = footnoteNum;
    range.insertNode(ref);

    // Add to footer area
    const footer = document.querySelector('.footer-area');
    const note = document.createElement('div');
    note.className = 'footnote-item';
    note.innerHTML = `<sup>${footnoteNum}</sup> <span contenteditable="true">Footnote text here...</span>`;
    footer.appendChild(note);
}

// Shortcuts Modal
function openShortcutsModal() {
    document.getElementById('shortcutsModal').style.display = 'flex';
}

function closeShortcutsModal() {
    document.getElementById('shortcutsModal').style.display = 'none';
}

// Custom Context Menu
const contextMenu = document.getElementById('customContextMenu');
document.addEventListener('contextmenu', (e) => {
    if (editor.contains(e.target)) {
        e.preventDefault();
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
    } else {
        contextMenu.style.display = 'none';
    }
});

document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

// Mini Toolbar Logic
const miniToolbar = document.getElementById('miniToolbar');
document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        miniToolbar.style.display = 'flex';
        miniToolbar.style.left = `${rect.left + (rect.width / 2) - 100}px`;
        miniToolbar.style.top = `${rect.top - 50}px`;
    } else {
        miniToolbar.style.display = 'none';
    }
});

// Thesaurus
async function lookupThesaurus() {
    const selection = window.getSelection().toString().trim();
    if (!selection) {
        alert('Please select a word first.');
        return;
    }

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selection}`);
        const data = await response.json();

        if (data && data[0] && data[0].meanings) {
            const synonyms = data[0].meanings[0].synonyms.slice(0, 5).join(', ');
            alert(`Synonyms for "${selection}":\n\n${synonyms || "No synonyms found."}`);
        } else {
            alert(`No data found for "${selection}".`);
        }
    } catch (e) {
        alert('Error fetching synonyms. Please check your connection.');
    }
}

// Phase 5 Features

// Pages
function insertPageBreak() {
    execCmd('insertHTML', '<hr class="page-break" contenteditable="false"><p><br></p>');
}

function insertBlankPage() {
    execCmd('insertHTML', '<p><br></p><hr class="page-break" contenteditable="false"><p><br></p>');
}

// Illustrations Stubs (can be expanded with modals)
function insertIcon() {
    const iconClass = prompt("Enter FontAwesome icon class (e.g., fa-star, fa-heart):", "fa-star");
    if (iconClass) {
        execCmd('insertHTML', `<i class="fas ${iconClass}" style="font-size: 2em; color: var(--primary-blue);"></i> `);
    }
}

function insertShape() {
    const shape = prompt("Enter shape (square, circle):", "square");
    const style = shape === 'circle' ? 'border-radius: 50%;' : '';
    execCmd('insertHTML', `<div style="width: 100px; height: 100px; background: var(--primary-blue); display: inline-block; ${style}"></div> `);
}

// Header & Footer
function openHeader() {
    document.body.classList.add('editing-header');
    document.querySelector('.header-area').focus();
    alert("Header editing active. Click outside to finish.");
}

function openFooter() {
    document.body.classList.add('editing-footer');
    document.querySelector('.footer-area').focus();
    alert("Footer editing active. Click outside to finish.");
}

// Finish Header/Footer editing on blur or click away
document.addEventListener('mousedown', (e) => {
    const header = document.querySelector('.header-area');
    const footer = document.querySelector('.footer-area');
    if (!header.contains(e.target) && !footer.contains(e.target)) {
        document.body.classList.remove('editing-header', 'editing-footer');
    }
});

// Text
// Text
function insertTextBox() {
    const editor = document.getElementById('editor');
    saveSelection();

    const box = document.createElement('div');
    box.className = 'text-box-element';
    box.contentEditable = 'true';
    box.innerHTML = 'New Text Box';

    // Position it relatively within the editor
    box.style.position = 'absolute';
    box.style.left = '50px';
    box.style.top = '50px';

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    box.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Avoid triggering editor click logic while dragging
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = box.offsetLeft;
        initialTop = box.offsetTop;
        box.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            box.style.left = `${initialLeft + dx}px`;
            box.style.top = `${initialTop + dy}px`;
        }
    });

    document.addEventListener('mouseup', () => isDragging = false);

    if (lastRange) {
        lastRange.insertNode(box);
    } else {
        editor.appendChild(box);
    }
}

function insertWordArt() {
    const text = prompt("Enter text for WordArt:", "WordArt");
    if (text) {
        execCmd('insertHTML', `<span style="font-size: 36px; font-weight: bold; background: linear-gradient(45deg, #2b579a, #4f81bd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-family: 'Segoe UI Black';">${text}</span> `);
    }
}

function insertDateTime() {
    const now = new Date();
    execCmd('insertHTML', now.toLocaleString() + " ");
}

// Symbols & Equations
function insertEquation() {
    const eq = prompt("Enter simple equation (e.g., E = mc²):", "a² + b² = c²");
    if (eq) {
        execCmd('insertHTML', `<span style="font-family: 'Cambria Math', serif; font-style: italic; background: #f9f9f9; padding: 2px 5px; border-radius: 3px;">${eq}</span> `);
    }
}

// Symbol Picker
function toggleSymbolPicker() {
    let picker = document.getElementById('symbolPicker');
    if (!picker) {
        picker = document.createElement('div');
        picker.id = 'symbolPicker';
        picker.className = 'insert-dropdown symbol-grid';
        const symbols = ['©', '®', '™', '€', '£', '¥', '±', '≠', '≈', '∞', 'α', 'β', 'γ', 'Δ', 'π', 'Σ', 'Ω', '√'];
        symbols.forEach(s => {
            const item = document.createElement('div');
            item.className = 'symbol-item';
            item.innerText = s;
            item.onclick = () => {
                execCmd('insertHTML', s);
                picker.style.display = 'none';
            };
            picker.appendChild(item);
        });
        document.body.appendChild(picker);
    }

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
    picker.style.top = `${rect.bottom + window.scrollY}px`;
    picker.style.left = `${rect.left + window.scrollX}px`;
}

let lastRange = null;

function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        lastRange = selection.getRangeAt(0).cloneRange();
    }
}

// Table Picker
function toggleTablePicker(e) {
    if (e) e.stopPropagation();
    const btn = e ? e.currentTarget : event.currentTarget;
    saveSelection(); // Save range immediately when button is clicked

    let picker = document.getElementById('tablePicker');
    if (!picker) {
        picker = document.createElement('div');
        picker.id = 'tablePicker';
        picker.className = 'insert-dropdown';

        const grid = document.createElement('div');
        grid.className = 'table-picker-grid';

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const cell = document.createElement('div');
                cell.className = 'table-cell-hint';
                cell.onmouseover = () => highlightGrid(r, c);
                cell.onclick = () => createTable(r + 1, c + 1);
                grid.appendChild(cell);
            }
        }

        picker.appendChild(grid);
        document.body.appendChild(picker);
    }

    const rect = btn.getBoundingClientRect();
    picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
    picker.style.top = `${rect.bottom + window.scrollY}px`;
    picker.style.left = `${rect.left + window.scrollX}px`;
}

function highlightGrid(rows, cols) {
    const cells = document.querySelectorAll('.table-cell-hint');
    cells.forEach((cell, idx) => {
        const r = Math.floor(idx / 10);
        const c = idx % 10;
        if (r <= rows && c <= cols) {
            cell.classList.add('active');
        } else {
            cell.classList.remove('active');
        }
    });
}

function createTable(rows, cols) {
    const editor = document.getElementById('editor');
    if (!lastRange) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false); // End of doc
        lastRange = range;
    }

    let html = '<table class="doc-table" style="width: 100%; border-collapse: collapse; margin: 10px 0;">';
    for (let r = 0; r < rows; r++) {
        html += '<tr>';
        for (let c = 0; c < cols; c++) {
            html += '<td contenteditable="true" style="border: 1px solid #ccc; padding: 8px; min-width: 50px; min-height: 25px;">&nbsp;</td>';
        }
        html += '</tr>';
    }
    html += '</table><p><br></p>';

    const fragment = lastRange.createContextualFragment(html);
    lastRange.insertNode(fragment);

    document.getElementById('tablePicker').style.display = 'none';
}

// Image Resizing Logic
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && editor.contains(e.target)) {
        // Many browsers support resizing contenteditable images with handles.
        // We'll ensure it has focus to trigger handles.
        e.target.focus();
        console.log('Image selected for resizing');
    }
});

// Close dropdowns on click outside
window.onclick = function (event) {
    if (!event.target.closest('.tool-btn') && !event.target.closest('.insert-dropdown')) {
        document.querySelectorAll('.insert-dropdown').forEach(d => d.style.display = 'none');
    }
};

// Initialization
function initializeApp() {
    // Load from LocalStorage
    const savedContent = localStorage.getItem('word_content');
    const savedTitle = localStorage.getItem('word_title');

    if (savedContent) {
        editor.innerHTML = savedContent;
    }
    if (savedTitle) {
        document.querySelector('.doc-title').innerText = savedTitle;
    }

    editor.focus();
}

// Start the app
window.onload = initializeApp;
initializeApp();


