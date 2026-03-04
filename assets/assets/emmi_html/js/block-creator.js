/**
 * Block Creator Tool
 * Loads real blocks from actual source files, lets you edit them,
 * preview with Blockly, and sync changes back to the files.
 */

'use strict';

class BlockCreatorApp {
    constructor() {
        // Source files loaded from disk: { "blocks/esp32_blocks.js": "content", ... }
        this.sourceFiles = {};

        // Parsed blocks: [ { id, boardId, sourceFile, defCode, gen: { arduino:{file,code}, python:{file,code}, java:{file,code}, command:{file,code}, emmiScript:'' } } ]
        this.blocks = [];

        // Tree state
        this.selectedBlockId = null;
        this.selectedBoardId = 'common';
        this.openBoards = {};
        this.openCategories = {};

        // Toolbox model used for board/category structure editing
        this.toolboxModel = { commonCategories: [], boardCategories: {} };

        // Files modified directly in memory and requiring sync
        this.dirtyFiles = new Set();

        // Blockly preview
        this.previewWorkspace = null;
        this._currentPreviewType = null;
        this.activeSideCodeLang = 'arduino';

        // Cloud config
        this.cloudConfig = this.loadCloudConfig();

        // Editor mode: 'code' | 'visual' | 'prompt'
        this.editorMode = 'code';

        // Visual builder state
        this.visualState = {
            blockId: '',
            blockType: 'statement',
            color: '#00838F',
            tooltip: '',
            outputType: 'Number',
            inline: 'true',
            inputs: []
        };

        // Active field modal target
        this._vbFieldTargetInput = -1;

        // Preview source: 'editor' or 'prompt'
        this.previewSource = 'editor';
        this.promptPreviewDebounceId = null;
        this.codePreviewDebounceId = null;
        this.codeSidePreviewDebounceId = null;

        this.init();
    }

    // =========================================================================
    // INIT
    // =========================================================================

    async init() {
        this.bindEvents();
        this.showLoading(true);
        await this.loadSourceFiles();
        this.parseAllBlocks();
        this.buildToolboxModel();
        this.renderTree();
        this.renderCloudSettingsInputs();
        this.showLoading(false);
        console.log(`Block Creator loaded ${this.blocks.length} blocks from ${Object.keys(this.sourceFiles).length} files`);
    }

    showLoading(show) {
        const empty = document.getElementById('empty-state');
        if (!empty) return;
        if (show) {
            empty.querySelector('h2').textContent = 'Loading blocks...';
            empty.querySelector('p').textContent = 'Reading source files from project.';
        } else if (!this.selectedBlockId) {
            empty.querySelector('h2').textContent = 'Block Creator';
            empty.querySelector('p').textContent = 'Select a block from the sidebar, or create a new one.';
        }
    }

    // =========================================================================
    // LOAD SOURCE FILES FROM SERVER
    // =========================================================================

    async loadSourceFiles() {
        try {
            const resp = await fetch('/api/load-source-files');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.success && data.files) {
                this.sourceFiles = data.files;
            }
        } catch (err) {
            console.error('Failed to load source files:', err);
            this.showToast('Failed to load source files: ' + err.message, 'error');
        }
    }

    // =========================================================================
    // PARSE BLOCKS FROM SOURCE FILES
    // =========================================================================

    parseAllBlocks() {
        this.blocks = [];

        // 1. Find all block definitions from blocks/*.js files
        const blockFiles = Object.keys(this.sourceFiles).filter(f => f.startsWith('blocks/'));
        for (const file of blockFiles) {
            const content = this.sourceFiles[file];
            const defs = this.extractBlockDefinitions(content);
            for (const def of defs) {
                this.blocks.push({
                    id: def.id,
                    boardId: this.getBoardIdForFile(file),
                    sourceFile: file,
                    defCode: def.code,
                    gen: { arduino: { file: '', code: '' }, python: { file: '', code: '' }, java: { file: '', code: '' }, command: { file: '', code: '' }, emmiScript: '' }
                });
            }
        }

        // 2. Find all generator code and attach to blocks
        const genFiles = Object.keys(this.sourceFiles).filter(f => f.startsWith('js/generators/'));
        for (const file of genFiles) {
            const content = this.sourceFiles[file];

            // Detect which generator type this file contains
            const generators = this.extractGeneratorFunctions(content);
            for (const gen of generators) {
                const block = this.blocks.find(b => b.id === gen.blockId);
                if (block) {
                    if (gen.genName === 'arduinoGenerator' || gen.genName === 'Blockly.Arduino') {
                        block.gen.arduino = { file, code: gen.code };
                    } else if (gen.genName === 'pythonGenerator' || gen.genName === 'Blockly.Python') {
                        block.gen.python = { file, code: gen.code };
                    } else if (gen.genName === 'javaGenerator' || gen.genName === 'Blockly.Java') {
                        block.gen.java = { file, code: gen.code };
                    }
                }
            }
        }

        // Sort blocks by source file then by order of appearance
        this.blocks.sort((a, b) => {
            if (a.sourceFile !== b.sourceFile) return a.sourceFile.localeCompare(b.sourceFile);
            return 0; // preserve parse order within file
        });

        // 3. Apply persisted command mappings from js/commands/*.js
        this.applyCommandMappingsToBlocks();
        this.refreshRuntimeCommandRegistry();
    }

    /**
     * Extract Blockly.Blocks['id'] = { ... }; definitions from file content.
     * Returns [ { id: 'block_id', code: 'Blockly.Blocks[...] = { ... };' } ]
     */
    extractBlockDefinitions(content) {
        const results = [];
        // Match: Blockly.Blocks['id'] = { ... };
        const regex = /Blockly\.Blocks\[['"]([^'"]+)['"]\]\s*=\s*\{/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const id = match[1];
            const startPos = match.index;
            const endPos = this.findClosingBrace(content, match.index + match[0].length - 1);
            if (endPos === -1) continue;

            // Include the trailing semicolon if present
            let end = endPos + 1;
            if (content[end] === ';') end++;

            const code = content.substring(startPos, end).trim();
            results.push({ id, code });
        }

        return results;
    }

    /**
     * Extract generator functions: generatorName.forBlock['id'] = function(block) { ... };
     * Also handles Blockly.Arduino['id'] = function(block) { ... };
     */
    extractGeneratorFunctions(content) {
        const results = [];
        // Pattern 1: xxxGenerator.forBlock['id'] = function...
        // Pattern 2: Blockly.Arduino['id'] = function...
        const regex = /(arduinoGenerator|pythonGenerator|javaGenerator|Blockly\.Arduino|Blockly\.Python|Blockly\.Java)(?:\.forBlock)?\[['"]([^'"]+)['"]\]\s*=\s*function/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const genName = match[1];
            const blockId = match[2];
            const startPos = match.index;

            // Find the function body - find the opening brace of the function
            const funcStart = content.indexOf('{', match.index + match[0].length - 8);
            if (funcStart === -1) continue;

            const endPos = this.findClosingBrace(content, funcStart);
            if (endPos === -1) continue;

            let end = endPos + 1;
            if (content[end] === ';') end++;

            const code = content.substring(startPos, end).trim();
            results.push({ genName, blockId, code });
        }

        return results;
    }

    /**
     * Extract all command entries (both object-literal and function-based) as raw code strings.
     * Returns [ { blockId, code } ] where code is the full assignment statement.
     */
    extractCommandEntries(content) {
        const results = [];
        const regex = /(?:registry|emmiCommandGenerator\.forBlock)\[['"]([^'"]+)['"]\]\s*=\s*/g;
        let match;

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
            const braceEnd = this.findClosingBrace(content, braceStart);
            if (braceEnd === -1) continue;

            let end = braceEnd + 1;
            if (content[end] === ';') end += 1;

            const code = content.substring(match.index, end).trim();
            results.push({ blockId, code });
        }

        return results;
    }

    applyCommandMappingsToBlocks() {
        const commandFiles = Object.keys(this.sourceFiles)
            .filter(path => path.startsWith('js/commands/') && path.endsWith('_commands.js'))
            .sort((a, b) => {
                if (a.endsWith('common_commands.js') && !b.endsWith('common_commands.js')) return -1;
                if (!a.endsWith('common_commands.js') && b.endsWith('common_commands.js')) return 1;
                return a.localeCompare(b);
            });

        for (const file of commandFiles) {
            const entries = this.extractCommandEntries(this.sourceFiles[file] || '');
            for (const entry of entries) {
                const block = this.blocks.find(b => b.id === entry.blockId);
                if (!block) continue;

                block.gen.command = { file, code: entry.code };
            }
        }
    }

    refreshRuntimeCommandRegistry() {
        if (typeof window === 'undefined') return;

        window.emmiCommandGenerator = window.emmiCommandGenerator || { forBlock: {} };
        const registry = window.emmiCommandGenerator.forBlock;

        // Clear entries previously registered by the block creator
        for (const key of Object.keys(registry)) {
            const entry = registry[key];
            if (entry && entry.__fromBlockCreator === true) {
                delete registry[key];
            }
        }

        for (const block of this.blocks) {
            const code = (block.gen?.command?.code || '').trim();
            if (!code) continue;

            try {
                // Eval the command code with registry in scope
                const fn = new Function('registry', code);
                fn(registry);
                // Mark the entry so we can clean it up on next refresh
                if (registry[block.id] != null) {
                    const entry = registry[block.id];
                    if (typeof entry === 'object' && typeof entry !== 'function') {
                        entry.__fromBlockCreator = true;
                    } else if (typeof entry === 'function') {
                        // Wrap function to carry the marker
                        const original = entry;
                        const wrapper = function (b, e) { return original(b, e); };
                        wrapper.__fromBlockCreator = true;
                        registry[block.id] = wrapper;
                    }
                }
            } catch (err) {
                // Silently skip invalid command code during registry refresh
            }
        }

        window.emmiCommandGenerator.forBlock = registry;
    }

    /**
     * Find the matching closing brace for the brace at position `openPos`.
     */
    findClosingBrace(content, openPos) {
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

    // =========================================================================
    // TREE RENDERING
    // =========================================================================

    deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    markFileDirty(filePath) {
        if (filePath) this.dirtyFiles.add(filePath);
    }

    formatBoardTitle(boardId) {
        return boardId
            .split('-')
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    toFunctionSuffix(boardId) {
        return boardId
            .split(/[^a-zA-Z0-9]+/)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
    }

    getBoardFilePath(boardId) {
        return boardId === 'common' ? 'blocks/esp32_blocks.js' : `blocks/${boardId}_blocks.js`;
    }

    getBoardGeneratorFilePath(boardId) {
        return boardId === 'common' ? '' : `js/generators/${boardId}_generators.js`;
    }

    getBoardCommandFilePath(boardId) {
        return boardId === 'common' ? 'js/commands/common_commands.js' : `js/commands/${boardId}_commands.js`;
    }

    buildBoardBlockFileTemplate(boardId, boardTitle = '') {
        const title = boardTitle || this.formatBoardTitle(boardId);
        return `'use strict';\n\n/**\n * ${title} - Block Definitions\n * Auto-generated by Block Creator Tool\n */\n`;
    }

    buildBoardGeneratorFileTemplate(boardId, boardTitle = '') {
        const title = boardTitle || this.formatBoardTitle(boardId);
        return `'use strict';\n\n/**\n * ${title} - Generators\n * Auto-generated by Block Creator Tool\n */\n`;
    }

    buildBoardCommandFileTemplate(boardId, boardTitle = '') {
        const title = boardTitle || this.formatBoardTitle(boardId);
        const scopeLabel = boardId === 'common' ? 'Common' : title;
        return `'use strict';\n\n/**\n * ${scopeLabel} - EMMI Command Mappings\n * Auto-generated by Block Creator Tool\n */\n(function (globalScope) {\n    globalScope.emmiCommandGenerator = globalScope.emmiCommandGenerator || { forBlock: {} };\n    const registry = globalScope.emmiCommandGenerator.forBlock;\n\n    // Add mappings in Block Creator Command Script panel, then Sync.\n}(typeof window !== 'undefined' ? window : globalThis));\n`;
    }

    getKnownBoardIds() {
        const ids = new Set(['common']);

        if (typeof window.getAvailableBoardTypes === 'function') {
            try {
                const available = window.getAvailableBoardTypes();
                if (Array.isArray(available)) {
                    available.forEach(id => {
                        if (id && id !== 'common') ids.add(id);
                    });
                }
            } catch (_) {
                // Ignore runtime toolbox helper errors.
            }
        }

        Object.keys(this.toolboxModel.boardCategories || {}).forEach(id => ids.add(id));
        this.blocks.forEach(block => ids.add(block.boardId || this.getBoardIdForFile(block.sourceFile)));

        return Array.from(ids);
    }

    buildToolboxModel() {
        const model = { commonCategories: [], boardCategories: {} };

        if (typeof window.getCommonCategories === 'function') {
            model.commonCategories = this.deepClone(window.getCommonCategories() || []);
        }

        const boardIds = this.getKnownBoardIds().filter(id => id !== 'common');
        const commonNames = new Set((model.commonCategories || [])
            .filter(c => c && c.kind === 'category')
            .map(c => c.name));

        for (const boardId of boardIds) {
            let boardCategories = [];
            if (typeof window.getToolboxForBoard === 'function') {
                const toolbox = window.getToolboxForBoard(boardId);
                if (toolbox && Array.isArray(toolbox.contents)) {
                    boardCategories = toolbox.contents.filter(def => def && def.kind === 'category' && !commonNames.has(def.name));
                }
            }
            model.boardCategories[boardId] = this.deepClone(boardCategories);
        }

        this.toolboxModel = model;
    }

    collectCategoryPaths(categories, prefix = '', list = []) {
        for (const category of categories || []) {
            if (!category || category.kind !== 'category') continue;
            const path = prefix ? `${prefix}/${category.name}` : category.name;
            list.push({ path, name: category.name });

            const childCategories = (category.contents || []).filter(item => item && item.kind === 'category');
            this.collectCategoryPaths(childCategories, path, list);
        }
        return list;
    }

    getCategoryPathsForBoard(boardId) {
        const categories = this.getBoardCategoryDefinitions(boardId) || [];
        return this.collectCategoryPaths(categories);
    }

    findCategoryByPath(categories, path) {
        if (!path) return null;
        const parts = path.split('/');
        let current = categories || [];
        let found = null;

        for (const part of parts) {
            found = current.find(item => item && item.kind === 'category' && item.name === part) || null;
            if (!found) return null;
            current = (found.contents || []).filter(item => item && item.kind === 'category');
        }

        return found;
    }

    addCategoryToBoard(boardId, categoryName, colour) {
        const category = { kind: 'category', name: categoryName, colour, contents: [] };

        if (boardId === 'common') {
            this.toolboxModel.commonCategories.push(category);
            return true;
        }

        if (!this.toolboxModel.boardCategories[boardId]) {
            this.toolboxModel.boardCategories[boardId] = [];
        }

        this.toolboxModel.boardCategories[boardId].push(category);
        return true;
    }

    addBlockToCategory(boardId, categoryPath, blockId) {
        const categories = this.getBoardCategoryDefinitions(boardId);
        const category = this.findCategoryByPath(categories, categoryPath);
        if (!category) return false;

        if (!Array.isArray(category.contents)) category.contents = [];
        const exists = category.contents.some(item => item && item.kind === 'block' && item.type === blockId);
        if (!exists) category.contents.push({ kind: 'block', type: blockId });
        return true;
    }

    removeCategoryFromListByPath(categoryList, pathParts, depth = 0) {
        if (!Array.isArray(categoryList) || depth >= pathParts.length) return null;
        const name = pathParts[depth];

        for (let i = 0; i < categoryList.length; i++) {
            const item = categoryList[i];
            if (!item || item.kind !== 'category' || item.name !== name) continue;

            if (depth === pathParts.length - 1) {
                return categoryList.splice(i, 1)[0] || null;
            }

            if (!Array.isArray(item.contents)) return null;
            return this.removeCategoryFromListByPath(item.contents, pathParts, depth + 1);
        }

        return null;
    }

    removeCategoryDefinition(boardId, categoryPath) {
        const pathParts = String(categoryPath || '').split('/').filter(Boolean);
        if (pathParts.length === 0) return null;

        const rootList = boardId === 'common'
            ? this.toolboxModel.commonCategories
            : (this.toolboxModel.boardCategories[boardId] || []);

        return this.removeCategoryFromListByPath(rootList, pathParts, 0);
    }

    collectBlockIdsFromTreeNode(node, setRef = new Set()) {
        if (!node) return setRef;

        for (const block of node.blocks || []) {
            if (block && block.id) setRef.add(block.id);
        }

        for (const child of node.children || []) {
            this.collectBlockIdsFromTreeNode(child, setRef);
        }

        return setRef;
    }

    countCategoriesRecursive(categories) {
        let total = 0;
        for (const category of categories || []) {
            if (!category || category.kind !== 'category') continue;
            total += 1;

            const childCategories = Array.isArray(category.contents)
                ? category.contents.filter(item => item && item.kind === 'category')
                : [];
            total += this.countCategoriesRecursive(childCategories);
        }
        return total;
    }

    removeBlockFromCategoriesList(categories, blockId) {
        for (const category of categories || []) {
            if (!category || category.kind !== 'category') continue;
            if (!Array.isArray(category.contents)) continue;

            category.contents = category.contents.filter(item => !(item && item.kind === 'block' && item.type === blockId));
            const childCategories = category.contents.filter(item => item && item.kind === 'category');
            this.removeBlockFromCategoriesList(childCategories, blockId);
        }
    }

    removeBlockFromAllCategories(blockId) {
        this.removeBlockFromCategoriesList(this.toolboxModel.commonCategories || [], blockId);
        for (const boardId of Object.keys(this.toolboxModel.boardCategories || {})) {
            this.removeBlockFromCategoriesList(this.toolboxModel.boardCategories[boardId] || [], blockId);
        }
    }

    renameBlockInCategoriesList(categories, oldId, newId) {
        for (const category of categories || []) {
            if (!category || category.kind !== 'category') continue;
            if (!Array.isArray(category.contents)) continue;

            for (const item of category.contents) {
                if (item && item.kind === 'block' && item.type === oldId) {
                    item.type = newId;
                }
            }

            const childCategories = category.contents.filter(item => item && item.kind === 'category');
            this.renameBlockInCategoriesList(childCategories, oldId, newId);
        }
    }

    renameBlockInAllCategories(oldId, newId) {
        this.renameBlockInCategoriesList(this.toolboxModel.commonCategories || [], oldId, newId);
        for (const boardId of Object.keys(this.toolboxModel.boardCategories || {})) {
            this.renameBlockInCategoriesList(this.toolboxModel.boardCategories[boardId] || [], oldId, newId);
        }
    }

    collectAssignedBlockIds(categories, setRef = new Set()) {
        for (const category of categories || []) {
            if (!category || category.kind !== 'category') continue;
            if (!Array.isArray(category.contents)) continue;

            for (const item of category.contents) {
                if (!item) continue;
                if (item.kind === 'block' && item.type) {
                    setRef.add(item.type);
                } else if (item.kind === 'category') {
                    this.collectAssignedBlockIds([item], setRef);
                }
            }
        }
        return setRef;
    }

    pruneUnknownBlockRefs(categories, validIds) {
        for (const category of categories || []) {
            if (!category || category.kind !== 'category' || !Array.isArray(category.contents)) continue;

            category.contents = category.contents.filter(item => {
                if (!item) return false;

                if (item.kind === 'block') {
                    return !!item.type && validIds.has(item.type);
                }

                if (item.kind === 'category') {
                    this.pruneUnknownBlockRefs([item], validIds);
                    return true;
                }

                return true;
            });
        }
    }

    getBoardCategoriesForExport(boardId) {
        const categories = this.deepClone(this.toolboxModel.boardCategories[boardId] || []);
        const boardBlocks = this.blocks.filter(block => (block.boardId || this.getBoardIdForFile(block.sourceFile)) === boardId);
        const validIds = new Set(boardBlocks.map(block => block.id));
        this.pruneUnknownBlockRefs(categories, validIds);

        const assigned = this.collectAssignedBlockIds(categories);
        const unassigned = boardBlocks.filter(block => !assigned.has(block.id));

        if (unassigned.length > 0) {
            categories.push({
                kind: 'category',
                name: '🧩 Uncategorized',
                colour: '#616161',
                contents: unassigned.map(block => ({ kind: 'block', type: block.id }))
            });
        }

        return categories;
    }

    toJsLiteral(value) {
        return JSON.stringify(value, null, 4);
    }

    indentText(text, spaces) {
        const pad = ' '.repeat(spaces);
        return String(text).split('\n').map(line => pad + line).join('\n');
    }

    generateToolboxSource() {
        const commonCategories = this.deepClone(this.toolboxModel.commonCategories || []);
        const commonBlocks = this.blocks.filter(block => (block.boardId || this.getBoardIdForFile(block.sourceFile)) === 'common');
        const commonIds = new Set(commonBlocks.map(block => block.id));
        this.pruneUnknownBlockRefs(commonCategories, commonIds);

        const boardIds = Object.keys(this.toolboxModel.boardCategories || {}).sort((a, b) => a.localeCompare(b));
        const defaultBoard = boardIds.includes('emmi-bot-v2') ? 'emmi-bot-v2' : (boardIds[0] || 'common');

        const lines = [];
        lines.push('/**');
        lines.push(' * Blockly Toolbox Configuration');
        lines.push(' * Auto-generated by Block Creator Tool');
        lines.push(' */');
        lines.push('');
        lines.push('function getCommonCategories() {');
        lines.push('    return ' + this.indentText(this.toJsLiteral(commonCategories), 4).trimStart() + ';');
        lines.push('}');
        lines.push('');

        for (const boardId of boardIds) {
            const fnName = `get${this.toFunctionSuffix(boardId)}Categories`;
            const boardCategories = this.getBoardCategoriesForExport(boardId);
            lines.push(`function ${fnName}() {`);
            lines.push('    return ' + this.indentText(this.toJsLiteral(boardCategories), 4).trimStart() + ';');
            lines.push('}');
            lines.push('');
        }

        lines.push(`function getToolbox(boardType = '${defaultBoard}') {`);
        lines.push('    let categories = [];');
        lines.push('');
        lines.push('    categories = categories.concat(getCommonCategories());');
        lines.push('');
        lines.push('    switch (boardType) {');
        for (const boardId of boardIds) {
            const fnName = `get${this.toFunctionSuffix(boardId)}Categories`;
            lines.push(`        case '${boardId}':`);
            lines.push(`            categories = categories.concat(${fnName}());`);
            lines.push('            break;');
        }
        lines.push('    }');
        lines.push('');
        lines.push('    return {');
        lines.push('        kind: \"categoryToolbox\",');
        lines.push('        contents: categories');
        lines.push('    };');
        lines.push('}');
        lines.push('');
        lines.push('function getAvailableBoardTypes() {');
        lines.push('    return ' + this.indentText(this.toJsLiteral(boardIds), 4).trimStart() + ';');
        lines.push('}');
        lines.push('');
        lines.push(`let ESP32Toolbox = getToolbox('${defaultBoard}');`);
        lines.push('');
        lines.push('function getToolboxForBoard(boardType) {');
        lines.push('    return getToolbox(boardType);');
        lines.push('}');

        return lines.join('\n');
    }

    saveToolboxModelToSource() {
        this.sourceFiles['js/toolbox.js'] = this.generateToolboxSource();
        this.markFileDirty('js/toolbox.js');
    }

    getBlocksForBoard(boardId) {
        return this.blocks.filter(block => (block.boardId || this.getBoardIdForFile(block.sourceFile)) === boardId);
    }

    generateCommandSourceForBoard(boardId) {
        const entries = this.getBlocksForBoard(boardId)
            .map(block => {
                const code = (block.gen?.command?.code || '').trim();
                if (!code) return null;
                return { id: block.id, code };
            })
            .filter(Boolean)
            .sort((a, b) => a.id.localeCompare(b.id));

        const title = boardId === 'common' ? 'Common' : this.formatBoardTitle(boardId);
        const lines = [];
        lines.push("'use strict';");
        lines.push('');
        lines.push('/**');
        lines.push(` * ${title} - EMMI Command Mappings`);
        lines.push(' * Auto-generated by Block Creator Tool');
        lines.push(' */');
        lines.push('(function (globalScope) {');
        lines.push('    globalScope.emmiCommandGenerator = globalScope.emmiCommandGenerator || { forBlock: {} };');
        lines.push('    const registry = globalScope.emmiCommandGenerator.forBlock;');
        lines.push('');

        if (entries.length === 0) {
            lines.push('    // No board-specific command mappings yet.');
        } else {
            for (const entry of entries) {
                const indented = String(entry.code).split('\n').map(line => `    ${line}`).join('\n');
                lines.push(indented);
                lines.push('');
            }
        }

        if (lines[lines.length - 1] === '') lines.pop();

        lines.push('}(typeof window !== \"undefined\" ? window : globalThis));');
        lines.push('');
        return lines.join('\n');
    }

    saveCommandMappingsToSource() {
        const boardIds = this.getOrderedBoardIds(this.getKnownBoardIds());
        for (const boardId of boardIds) {
            const filePath = this.getBoardCommandFilePath(boardId);
            this.sourceFiles[filePath] = this.generateCommandSourceForBoard(boardId);
            this.markFileDirty(filePath);
        }
    }

    getBoardBlockFiles(boardId) {
        const allBlockFiles = Object.keys(this.sourceFiles)
            .filter(path => path.startsWith('blocks/') && path.endsWith('.js'))
            .sort((a, b) => a.localeCompare(b));

        if (boardId === 'common') {
            return allBlockFiles.filter(path => this.getBoardIdForFile(path) === 'common');
        }

        return allBlockFiles.filter(path => this.getBoardIdForFile(path) === boardId);
    }

    getDefaultBlockFileForBoard(boardId) {
        const boardFiles = this.getBoardBlockFiles(boardId);
        if (boardFiles.length > 0) {
            if (boardId === 'common' && boardFiles.includes('blocks/esp32_blocks.js')) {
                return 'blocks/esp32_blocks.js';
            }
            return boardFiles[0];
        }

        return this.getBoardFilePath(boardId);
    }

    getBoardIdForFile(filePath) {
        const commonFiles = new Set([
            'blocks/esp32_blocks.js',
            'blocks/variable_blocks.js',
            'blocks/communication_blocks.js'
        ]);
        if (commonFiles.has(filePath)) return 'common';

        const m = filePath.match(/^blocks\/(.+)_blocks\.js$/);
        if (!m) return 'common';
        return m[1];
    }

    getBoardLabel(boardId) {
        if (boardId === 'common') return 'common_blocks';
        return `${boardId}_blocks`;
    }

    getOrderedBoardIds(boardIds) {
        const preferredOrder = ['common', 'emmi-bot-v2', 'explorer-kit', 'emmi-bipedal'];
        const orderedKnown = preferredOrder.filter(id => boardIds.includes(id));
        const extras = boardIds.filter(id => !preferredOrder.includes(id)).sort((a, b) => a.localeCompare(b));
        return orderedKnown.concat(extras);
    }

    getCommonCategoryNames() {
        const defs = this.toolboxModel.commonCategories || [];
        return new Set(defs.filter(d => d && d.kind === 'category').map(d => d.name));
    }

    getBoardCategoryDefinitions(boardId) {
        if (boardId === 'common') {
            return this.toolboxModel.commonCategories || [];
        }

        return this.toolboxModel.boardCategories[boardId] || [];
    }

    buildBoardTreeModel() {
        const grouped = {};
        for (const block of this.blocks) {
            const boardId = block.boardId || this.getBoardIdForFile(block.sourceFile);
            if (!grouped[boardId]) grouped[boardId] = [];
            grouped[boardId].push(block);
        }

        const boardIds = this.getOrderedBoardIds(Array.from(new Set([
            ...Object.keys(grouped),
            ...this.getKnownBoardIds()
        ])));
        return boardIds.map(boardId => {
            const boardBlocks = grouped[boardId] || [];
            return {
                id: boardId,
                label: this.getBoardLabel(boardId),
                blocks: boardBlocks,
                categories: this.buildCategoryTree(boardId, boardBlocks)
            };
        });
    }

    buildCategoryTree(boardId, boardBlocks) {
        const blockById = new Map();
        boardBlocks.forEach(block => {
            if (!blockById.has(block.id)) blockById.set(block.id, block);
        });

        const assignedIds = new Set();
        const categoryDefs = this.getBoardCategoryDefinitions(boardId);
        const categories = [];

        for (const def of categoryDefs) {
            const node = this.buildCategoryNode(def, boardId, blockById, assignedIds, '');
            if (node) categories.push(node);
        }

        const uncategorized = boardBlocks.filter(block => !assignedIds.has(block.id));
        if (uncategorized.length > 0) {
            categories.push({
                key: `${boardId}:Uncategorized`,
                name: 'Uncategorized',
                colour: '#616161',
                blocks: uncategorized,
                children: []
            });
        }

        return categories;
    }

    buildCategoryNode(def, boardId, blockById, assignedIds, parentPath) {
        if (!def || def.kind !== 'category') return null;

        const path = parentPath ? `${parentPath}/${def.name}` : def.name;
        const node = {
            key: `${boardId}:${path}`,
            name: def.name,
            colour: def.colour || '#616161',
            blocks: [],
            children: []
        };

        const contents = Array.isArray(def.contents) ? def.contents : [];
        for (const item of contents) {
            if (!item) continue;

            if (item.kind === 'block' && item.type) {
                const block = blockById.get(item.type);
                if (block && !node.blocks.some(b => b.id === block.id)) {
                    node.blocks.push(block);
                    assignedIds.add(block.id);
                }
                continue;
            }

            if (item.kind === 'category') {
                const child = this.buildCategoryNode(item, boardId, blockById, assignedIds, path);
                if (child) node.children.push(child);
            }
        }

        if (def.custom === 'VARIABLE_DYNAMIC') {
            for (const block of blockById.values()) {
                if (block.sourceFile === 'blocks/variable_blocks.js' && !assignedIds.has(block.id)) {
                    node.blocks.push(block);
                    assignedIds.add(block.id);
                }
            }
        }

        return node;
    }

    getCategoryBlockCount(node) {
        let total = node.blocks.length;
        for (const child of node.children) {
            total += this.getCategoryBlockCount(child);
        }
        return total;
    }

    renderCategoryNode(boardId, node, depth = 0) {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'tree-category';

        const hasChildren = node.children.length > 0 || node.blocks.length > 0;
        const isOpen = this.openCategories[node.key] !== false;

        const header = document.createElement('div');
        header.className = 'tree-category-header';
        header.style.paddingLeft = `${28 + (depth * 20)}px`;

        const arrow = document.createElement('span');
        arrow.className = `tree-arrow ${isOpen ? 'open' : ''}`;
        arrow.innerHTML = hasChildren ? '<i class="fas fa-caret-right"></i>' : '';
        header.appendChild(arrow);

        const color = document.createElement('span');
        color.className = 'tree-cat-colour';
        color.style.background = node.colour || '#616161';
        header.appendChild(color);

        const label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = node.name;
        header.appendChild(label);

        const categoryPath = node.key.split(':').slice(1).join(':');

        const actions = document.createElement('div');
        actions.className = 'tree-category-actions';

        const addBlockBtn = document.createElement('button');
        addBlockBtn.className = 'tree-action-btn';
        addBlockBtn.title = 'Add block to this category';
        addBlockBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addBlockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openAddBlockModal({ boardId, categoryPath });
        });
        actions.appendChild(addBlockBtn);

        const deleteCategoryBtn = document.createElement('button');
        deleteCategoryBtn.className = 'tree-action-btn danger';
        deleteCategoryBtn.title = 'Delete category';
        deleteCategoryBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteCategoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCategory(boardId, categoryPath, node);
        });
        actions.appendChild(deleteCategoryBtn);

        header.appendChild(actions);

        const count = document.createElement('span');
        count.style.color = 'var(--text-dim)';
        count.style.fontSize = '11px';
        count.style.marginLeft = 'auto';
        count.textContent = String(this.getCategoryBlockCount(node));
        header.appendChild(count);

        if (hasChildren) {
            header.addEventListener('click', () => {
                this.selectedBoardId = boardId;
                this.openCategories[node.key] = !isOpen;
                this.renderTree();
            });
        } else {
            header.addEventListener('click', () => {
                this.selectedBoardId = boardId;
            });
        }

        categoryEl.appendChild(header);

        const children = document.createElement('div');
        children.className = 'tree-category-children' + (isOpen ? ' open' : '');

        for (const child of node.children) {
            children.appendChild(this.renderCategoryNode(boardId, child, depth + 1));
        }

        for (const block of node.blocks) {
            const blockEl = document.createElement('div');
            blockEl.className = 'tree-block' + (this.selectedBlockId === block.id ? ' active' : '');
            blockEl.style.paddingLeft = `${52 + (depth * 20)}px`;

            const icon = document.createElement('span');
            icon.className = 'tree-block-icon';
            icon.innerHTML = '<i class="fas fa-cube"></i>';
            blockEl.appendChild(icon);

            const labelEl = document.createElement('span');
            labelEl.className = 'tree-block-label';
            labelEl.textContent = block.id;
            blockEl.appendChild(labelEl);

            const blockActions = document.createElement('div');
            blockActions.className = 'tree-block-actions';
            const deleteBlockBtn = document.createElement('button');
            deleteBlockBtn.className = 'tree-action-btn danger';
            deleteBlockBtn.title = 'Delete block';
            deleteBlockBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBlockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBlockById(block.id, { confirmDelete: true, saveToolbox: true, refreshUI: true, toast: true });
            });
            blockActions.appendChild(deleteBlockBtn);
            blockEl.appendChild(blockActions);

            blockEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedBoardId = boardId;
                this.selectBlock(block.id);
            });

            children.appendChild(blockEl);
        }

        categoryEl.appendChild(children);
        return categoryEl;
    }

    renderTree() {
        const container = document.getElementById('tree-container');
        if (!container) return;
        container.innerHTML = '';

        const boards = this.buildBoardTreeModel();
        if (boards.length === 0) {
            container.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:12px;">No blocks found.</div>';
            return;
        }

        for (const board of boards) {
            const isOpen = this.openBoards[board.id] !== false;
            const boardEl = document.createElement('div');
            boardEl.className = 'tree-board';

            const header = document.createElement('div');
            header.className = 'tree-board-header';
            header.innerHTML = `
                <span class="tree-arrow ${isOpen ? 'open' : ''}"><i class="fas fa-caret-right"></i></span>
                <span class="tree-label">${board.label}</span>
                <div class="tree-board-actions">
                    <button class="tree-action-btn" data-action="add-category" title="Add category"><i class="fas fa-folder-plus"></i></button>
                    <button class="tree-action-btn" data-action="add-block" title="Add block"><i class="fas fa-plus"></i></button>
                    <button class="tree-action-btn danger" data-action="delete-board" title="Delete board"><i class="fas fa-trash"></i></button>
                </div>
                <span style="color:var(--text-dim);font-size:11px;margin-left:auto">${board.blocks.length}</span>
            `;

            const addCategoryBtn = header.querySelector('[data-action="add-category"]');
            addCategoryBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openAddCategoryModal(board.id);
            });

            const addBlockBtn = header.querySelector('[data-action="add-block"]');
            addBlockBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openAddBlockModal({ boardId: board.id });
            });

            const deleteBoardBtn = header.querySelector('[data-action="delete-board"]');
            if (board.id === 'common') {
                deleteBoardBtn?.remove();
            } else {
                deleteBoardBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteBoard(board.id);
                });
            }

            header.addEventListener('click', () => {
                this.selectedBoardId = board.id;
                this.openBoards[board.id] = !isOpen;
                this.renderTree();
            });
            boardEl.appendChild(header);

            const children = document.createElement('div');
            children.className = 'tree-board-children' + (isOpen ? ' open' : '');

            for (const category of board.categories) {
                children.appendChild(this.renderCategoryNode(board.id, category, 0));
            }

            boardEl.appendChild(children);
            container.appendChild(boardEl);
        }
    }

    // =========================================================================
    // BLOCK SELECTION & EDITOR
    // =========================================================================

    selectBlock(blockId) {
        // Save current edits before switching
        this.saveCurrentEdits();

        this.selectedBlockId = blockId;
        const block = this.getSelectedBlock();
        if (block) this.selectedBoardId = block.boardId || this.getBoardIdForFile(block.sourceFile);
        this.renderTree();
        this.showEditor();
    }

    getSelectedBlock() {
        if (!this.selectedBlockId) return null;
        return this.blocks.find(b => b.id === this.selectedBlockId) || null;
    }

    showEditor() {
        const block = this.getSelectedBlock();
        if (!block) {
            document.getElementById('editor-area').classList.add('hidden');
            document.getElementById('empty-state').classList.remove('hidden');
            return;
        }

        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('editor-area').classList.remove('hidden');

        // Ensure current editor mode is applied
        this.switchEditorMode(this.editorMode || 'code');

        // Path bar
        const displayFile = block.sourceFile.replace('blocks/', '').replace('.js', '');
        document.getElementById('block-path').innerHTML =
            `${displayFile} / <b>${block.id}</b>`;

        // Definition editor
        document.getElementById('editor-definition').value = block.defCode || '';

        // Generator editors
        document.getElementById('gen-arduino').value = block.gen.arduino.code || '';
        document.getElementById('gen-python').value = block.gen.python.code || '';
        document.getElementById('gen-java').value = block.gen.java.code || '';

        // Command generator editor
        const commandEditor = document.getElementById('gen-command');
        if (commandEditor) commandEditor.value = block.gen.command?.code || '';

        this.populatePromptFieldsFromCurrentBlock(block);

        // Run preview
        if (this.editorMode === 'prompt') {
            this.schedulePromptPreview();
        } else {
            this.runDefinition();
        }
    }

    populatePromptFieldsFromCurrentBlock(block) {
        const selected = block || this.getSelectedBlock();
        if (!selected) return;

        const setField = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };

        setField('ai-response-definition', selected.defCode || '');
        setField('ai-response-arduino', selected.gen?.arduino?.code || '');
        setField('ai-response-python', selected.gen?.python?.code || '');
        setField('ai-response-java', selected.gen?.java?.code || '');
        setField('ai-block-id', selected.id || '');
        setField('ai-response-command', selected.gen?.command?.code || '');
    }

    saveCurrentEdits() {
        const block = this.getSelectedBlock();
        if (!block) return;

        block.defCode = document.getElementById('editor-definition')?.value || '';
        block.gen.arduino.code = document.getElementById('gen-arduino')?.value || '';
        block.gen.python.code = document.getElementById('gen-python')?.value || '';
        block.gen.java.code = document.getElementById('gen-java')?.value || '';
        block.gen.command.code = document.getElementById('gen-command')?.value || '';
    }

    setCommandPreviewMessage(message) {
        const preview = document.getElementById('command-script-preview');
        if (preview) preview.value = `// ${message}`;
    }

    /**
     * Refresh the command script preview by evaluating the command code
     * against the current preview block using the EMMIScriptExporter.
     */
    refreshCommandScriptFromPreview() {
        const preview = document.getElementById('command-script-preview');
        if (!preview) return;

        const block = this.getSelectedBlock();
        if (!block) {
            preview.value = '// No block selected.';
            return;
        }

        // Re-register command code in runtime
        this.refreshRuntimeCommandRegistry();

        if (!this.previewWorkspace) {
            preview.value = '// Preview workspace not ready.';
            return;
        }

        const topBlocks = this.previewWorkspace.getTopBlocks(true);
        if (!Array.isArray(topBlocks) || topBlocks.length === 0) {
            preview.value = '// No block in preview.';
            return;
        }

        if (typeof EMMIScriptExporter !== 'function') {
            preview.value = '// EMMI exporter not loaded.';
            return;
        }

        const previewBlock = topBlocks[0];
        const exporter = new EMMIScriptExporter();
        try {
            exporter.resetState();

            let loopTokens = [];
            const isValueOnly = !!previewBlock.outputConnection && !previewBlock.previousConnection && !previewBlock.nextConnection;
            if (isValueOnly) {
                const valueToken = exporter.serializeValueBlock(previewBlock, null);
                if (valueToken) loopTokens = [valueToken];
            } else {
                loopTokens = exporter.serializeStatementBlock(previewBlock) || [];
            }

            const initTokens = Array.isArray(exporter.initTokens) ? exporter.initTokens : [];
            const initPart = initTokens.join('|');
            const mainPart = loopTokens.join('|');
            const script = `|I|${initPart}|S|${mainPart}|L|${mainPart}|`;
            preview.value = script;
            block.gen.emmiScript = script;
        } catch (err) {
            preview.value = `// ${err.message}`;
        }
    }

    // =========================================================================
    // SIDE CODE PREVIEW (ARDUINO / PYTHON / JAVA)
    // =========================================================================

    getSideCodeLanguages() {
        return ['arduino', 'python', 'java'];
    }

    getSideCodeCommentPrefix(lang) {
        return lang === 'python' ? '#' : '//';
    }

    switchSideCodeTab(lang) {
        const languages = this.getSideCodeLanguages();
        const active = languages.includes(lang) ? lang : 'arduino';
        this.activeSideCodeLang = active;

        document.querySelectorAll('.side-code-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.previewLang === active);
        });

        document.querySelectorAll('.side-code-editor').forEach(editor => {
            editor.classList.toggle('active', editor.id === `preview-code-${active}`);
        });
    }

    setSideCodeValue(lang, value) {
        const el = document.getElementById(`preview-code-${lang}`);
        if (el) el.value = value || '';
    }

    setAllSideCodeValues(message) {
        const text = message || '';
        for (const lang of this.getSideCodeLanguages()) {
            const prefix = this.getSideCodeCommentPrefix(lang);
            this.setSideCodeValue(lang, `${prefix} ${text}`);
        }
    }

    getPromptCodeSections() {
        return {
            definition: document.getElementById('ai-response-definition')?.value || '',
            arduino: document.getElementById('ai-response-arduino')?.value || '',
            python: document.getElementById('ai-response-python')?.value || '',
            java: document.getElementById('ai-response-java')?.value || ''
        };
    }

    getPromptGeneratorCode(lang) {
        const sections = this.getPromptCodeSections();
        return sections[lang] || '';
    }

    getActiveGeneratorSourceCode(lang) {
        if (this.previewSource === 'prompt') {
            return this.getPromptGeneratorCode(lang);
        }
        return document.getElementById(`gen-${lang}`)?.value || '';
    }

    setPromptCommandScriptPreview(value) {
        // No-op: AI command field is now user-editable, not auto-generated
    }

    getRuntimeGenerator(lang) {
        if (lang === 'arduino' && typeof arduinoGenerator !== 'undefined') return arduinoGenerator;
        if (lang === 'python' && typeof pythonGenerator !== 'undefined') return pythonGenerator;
        if (lang === 'java' && typeof javaGenerator !== 'undefined') return javaGenerator;
        return null;
    }

    clonePreviewBlockIntoWorkspace(sourceBlock, targetWorkspace) {
        if (!sourceBlock || !targetWorkspace) return null;
        const xml = Blockly.Xml.blockToDom(sourceBlock, true);
        return Blockly.Xml.domToBlock(xml, targetWorkspace);
    }

    buildStructuredPreviewWorkspace(sourceBlock) {
        if (!sourceBlock || !sourceBlock.previousConnection) return null;
        if (!Blockly.Blocks['base_setup_loop']) return null;

        const tempWorkspace = new Blockly.Workspace();
        try {
            const cloned = this.clonePreviewBlockIntoWorkspace(sourceBlock, tempWorkspace);
            if (!cloned) {
                tempWorkspace.dispose();
                return null;
            }

            const baseBlock = tempWorkspace.newBlock('base_setup_loop');
            const loopInput = baseBlock.getInput('LOOP');
            if (!loopInput || !loopInput.connection || !cloned.previousConnection) {
                tempWorkspace.dispose();
                return null;
            }

            loopInput.connection.connect(cloned.previousConnection);
            return tempWorkspace;
        } catch (_err) {
            tempWorkspace.dispose();
            return null;
        }
    }

    /**
     * Convert the selected board ID into a Java-friendly class name.
     * e.g. "emmi-bot-v2" → "EmmiBotV2", "common" → "ESP32Program"
     */
    getBoardClassName() {
        const boardId = this.selectedBoardId || 'common';
        if (boardId === 'common') return 'ESP32Program';
        return boardId
            .split(/[^a-zA-Z0-9]+/)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
    }

    wrapValuePreviewCode(lang, expression) {
        const expr = String(expression || '').trim();
        if (!expr) return '';
        const cls = this.getBoardClassName();

        if (lang === 'arduino') {
            return [
                'void setup() {',
                '',
                '}',
                '',
                'void loop() {',
                `  ${expr};  // ← your block code`,
                '}'
            ].join('\n');
        }

        if (lang === 'python') {
            return [
                '# Setup',
                '',
                '# Main loop',
                'while True:',
                `    _value = ${expr}  # ← your block code`
            ].join('\n');
        }

        return [
            `public class ${cls} {`,
            '',
            `    public void setup() {`,
            '    }',
            '',
            '    public void loop() {',
            '        while (true) {',
            `            Object value = ${expr};  // ← your block code`,
            '        }',
            '    }',
            '}'
        ].join('\n');
    }

    /**
     * Wrap raw statement code inside the full program structure
     * when buildStructuredPreviewWorkspace is unavailable.
     */
    wrapStatementPreviewCode(lang, code) {
        const raw = String(code || '').trimEnd();
        if (!raw) return '';
        const cls = this.getBoardClassName();

        if (lang === 'arduino') {
            // Indent block code inside loop()
            const indented = raw.split('\n').map(l => '  ' + l).join('\n');
            return [
                'void setup() {',
                '',
                '}',
                '',
                'void loop() {',
                `${indented}  // ← your block code`,
                '}'
            ].join('\n');
        }

        if (lang === 'python') {
            // Indent block code inside while True
            const indented = raw.split('\n').map(l => '    ' + l).join('\n');
            return [
                '# Setup',
                '',
                '# Main loop',
                'while True:',
                `${indented}  # ← your block code`
            ].join('\n');
        }

        // Java
        const indented = raw.split('\n').map(l => '            ' + l).join('\n');
        return [
            `public class ${cls} {`,
            '',
            '    public void setup() {',
            '    }',
            '',
            '    public void loop() {',
            '        while (true) {',
            `${indented}  // ← your block code`,
            '        }',
            '    }',
            '}'
        ].join('\n');
    }

    /**
     * Post-process structured workspace output:
     * - Replace Java class name with board name
     * - Ensure Python always shows setup section
     * - Add "← your block code" marker to the block's code lines
     */
    postProcessStructuredCode(lang, fullCode) {
        let output = fullCode;

        if (lang === 'java') {
            const cls = this.getBoardClassName();
            output = output.replace(/public class ESP32Program/, `public class ${cls}`);
        }

        if (lang === 'python') {
            // Ensure # Setup section is always present before # Main loop
            if (!output.includes('# Setup')) {
                output = output.replace('# Main loop', '# Setup\n\n# Main loop');
            }
        }

        return output;
    }

    applyCurrentGeneratorEditorToRuntime(lang) {
        const code = this.getActiveGeneratorSourceCode(lang);
        if (!code.trim()) return;

        const fn = new Function('Blockly', 'arduinoGenerator', 'pythonGenerator', 'javaGenerator', code);
        fn(
            Blockly,
            typeof arduinoGenerator !== 'undefined' ? arduinoGenerator : undefined,
            typeof pythonGenerator !== 'undefined' ? pythonGenerator : undefined,
            typeof javaGenerator !== 'undefined' ? javaGenerator : undefined
        );
    }

    generateSideCodeForLanguage(lang, previewBlock) {
        const generator = this.getRuntimeGenerator(lang);
        const prefix = this.getSideCodeCommentPrefix(lang);
        if (!generator) {
            return `${prefix} ${lang} generator is not loaded.`;
        }

        if (this.previewSource === 'prompt') {
            const pastedCode = this.getPromptGeneratorCode(lang);
            if (!pastedCode.trim()) {
                return `${prefix} Paste ${lang} generator to preview this section.`;
            }
        }

        this.applyCurrentGeneratorEditorToRuntime(lang);

        // 1. Try structured workspace (block inside base_setup_loop)
        const structuredWorkspace = this.buildStructuredPreviewWorkspace(previewBlock);
        if (structuredWorkspace && typeof generator.workspaceToCode === 'function') {
            try {
                const full = String(generator.workspaceToCode(structuredWorkspace) || '').trimEnd();
                if (full.trim()) {
                    return this.postProcessStructuredCode(lang, full);
                }
            } finally {
                structuredWorkspace.dispose();
            }
        }

        // 2. Fallback: generate code for the block alone, then wrap in structure
        if (typeof generator.init === 'function') {
            generator.init(this.previewWorkspace);
        }

        let generated = generator.blockToCode(previewBlock);
        const isValue = Array.isArray(generated);
        if (isValue) generated = generated[0];

        let rawCode = String(generated || '').trimEnd();

        if (!rawCode.trim()) {
            return `${prefix} No ${lang} code for this block.`;
        }

        // Value blocks → wrap with variable assignment in full structure
        if (isValue) {
            return this.wrapValuePreviewCode(lang, rawCode);
        }

        // Statement blocks that couldn't attach to base_setup_loop → wrap in full structure
        return this.wrapStatementPreviewCode(lang, rawCode);
    }

    refreshSideCodePreviews() {
        if (!this.previewWorkspace) {
            this.setAllSideCodeValues('Code preview unavailable: preview is not ready.');
            return;
        }

        const topBlocks = this.previewWorkspace.getTopBlocks(true);
        if (!Array.isArray(topBlocks) || topBlocks.length === 0) {
            this.setAllSideCodeValues('Code preview unavailable: no block in preview.');
            return;
        }

        const previewBlock = topBlocks[0];
        for (const lang of this.getSideCodeLanguages()) {
            try {
                const code = this.generateSideCodeForLanguage(lang, previewBlock);
                this.setSideCodeValue(lang, code);
            } catch (err) {
                const prefix = this.getSideCodeCommentPrefix(lang);
                this.setSideCodeValue(lang, `${prefix} Preview error: ${err.message}`);
            }
        }
    }

    // =========================================================================
    // BLOCKLY PREVIEW
    // =========================================================================

    initPreviewWorkspace() {
        // Created on first preview run
    }

    scheduleCodePreview() {
        if (this.editorMode !== 'code') return;

        if (this.codePreviewDebounceId) {
            clearTimeout(this.codePreviewDebounceId);
            this.codePreviewDebounceId = null;
        }

        this.codePreviewDebounceId = setTimeout(() => {
            this.codePreviewDebounceId = null;
            this.runDefinition();
        }, 120);
    }

    scheduleCodeSidePreview() {
        if (this.editorMode !== 'code') return;

        if (this.codeSidePreviewDebounceId) {
            clearTimeout(this.codeSidePreviewDebounceId);
            this.codeSidePreviewDebounceId = null;
        }

        this.codeSidePreviewDebounceId = setTimeout(() => {
            this.codeSidePreviewDebounceId = null;
            this.previewSource = 'editor';

            if (this.previewWorkspace) {
                this.refreshSideCodePreviews();
            } else {
                this.runDefinition();
            }
        }, 100);
    }

    schedulePromptPreview() {
        if (this.editorMode !== 'prompt') return;

        if (this.promptPreviewDebounceId) {
            clearTimeout(this.promptPreviewDebounceId);
            this.promptPreviewDebounceId = null;
        }

        this.promptPreviewDebounceId = setTimeout(() => {
            this.promptPreviewDebounceId = null;
            this.runPromptPreview();
        }, 120);
    }

    runPromptPreview() {
        if (this.editorMode !== 'prompt') return;

        const block = this.getSelectedBlock();
        if (!block) return;

        this.previewSource = 'prompt';
        const sections = this.getPromptCodeSections();
        const definitionCode = sections.definition || '';

        this.clearConsole();

        if (!definitionCode.trim()) {
            this.logConsole('Paste block definition to see preview.', 'info');
            this.setPromptCommandScriptPreview('// Command script will be generated after a valid block definition is pasted.');
            this.setAllSideCodeValues('Paste block definition to preview.');
            this.destroyPreview();
            return;
        }

        this.unregisterPreviewBlock();

        try {
            const fn = new Function('Blockly', definitionCode);
            fn(Blockly);
            this.logConsole('Prompt definition evaluated successfully.', 'success');
        } catch (err) {
            this.logConsole(`Error: ${err.message}`, 'error');
            if (err.stack) {
                err.stack.split('\n').slice(1, 3).forEach(l => this.logConsole(l.trim(), 'error'));
            }
            this.setPromptCommandScriptPreview(`// Command Script unavailable: ${err.message}`);
            this.setAllSideCodeValues(`Code preview unavailable: ${err.message}`);
            this.destroyPreview();
            return;
        }

        const blockType = this.extractBlockType(definitionCode);
        if (!blockType) {
            this.logConsole('Warning: Could not detect block type. Expected Blockly.Blocks[\'...\']', 'warn');
            this.setPromptCommandScriptPreview('// Command Script unavailable: block type could not be detected.');
            this.setAllSideCodeValues('Code preview unavailable: block type could not be detected.');
            this.destroyPreview();
            return;
        }

        if (blockType !== block.id) {
            this.logConsole(`Prompt block ID '${blockType}' differs from selected '${block.id}'. Apply will normalize to '${block.id}'.`, 'warn');
        }

        if (!Blockly.Blocks[blockType]) {
            this.logConsole(`Warning: Block '${blockType}' not registered after evaluation.`, 'warn');
            this.setPromptCommandScriptPreview(`// Command Script unavailable: block '${blockType}' was not registered.`);
            this.setAllSideCodeValues(`Code preview unavailable: block '${blockType}' was not registered.`);
            this.destroyPreview();
            return;
        }

        this._currentPreviewType = blockType;
        this.logConsole(`Prompt block '${blockType}' registered. Rendering...`, 'info');
        this.renderPreview(blockType);
    }

    refreshPromptCommandScriptFromPreview() {
        // No-op: AI command field is now user-editable, not auto-generated
    }

    runDefinition() {
        const block = this.getSelectedBlock();
        if (!block) return;

        this.previewSource = 'editor';

        const code = document.getElementById('editor-definition')?.value || '';
        this.clearConsole();

        if (!code.trim()) {
            this.logConsole('No definition code to evaluate.', 'warn');
            this.setCommandPreviewMessage('Command Script unavailable: block definition is empty.');
            this.setAllSideCodeValues('Code preview unavailable: block definition is empty.');
            this.destroyPreview();
            return;
        }

        // Unregister previous preview block
        this.unregisterPreviewBlock();

        // Evaluate the definition
        try {
            const fn = new Function('Blockly', code);
            fn(Blockly);
            this.logConsole('Definition evaluated successfully.', 'success');
        } catch (err) {
            this.logConsole(`Error: ${err.message}`, 'error');
            if (err.stack) {
                err.stack.split('\n').slice(1, 3).forEach(l => this.logConsole(l.trim(), 'error'));
            }
            this.setCommandPreviewMessage(`Command Script unavailable: ${err.message}`);
            this.setAllSideCodeValues(`Code preview unavailable: ${err.message}`);
            this.destroyPreview();
            return;
        }

        // Extract block type
        const blockType = this.extractBlockType(code);
        if (!blockType) {
            this.logConsole('Warning: Could not detect block type. Expected Blockly.Blocks[\'...\']', 'warn');
            this.setCommandPreviewMessage('Command Script unavailable: block type could not be detected.');
            this.setAllSideCodeValues('Code preview unavailable: block type could not be detected.');
            this.destroyPreview();
            return;
        }

        if (!Blockly.Blocks[blockType]) {
            this.logConsole(`Warning: Block '${blockType}' not registered after evaluation.`, 'warn');
            this.setCommandPreviewMessage(`Command Script unavailable: block '${blockType}' was not registered.`);
            this.setAllSideCodeValues(`Code preview unavailable: block '${blockType}' was not registered.`);
            this.destroyPreview();
            return;
        }

        this._currentPreviewType = blockType;
        this.logConsole(`Block '${blockType}' registered. Rendering...`, 'info');
        this.renderPreview(blockType);
    }

    extractBlockType(code) {
        const m = code.match(/Blockly\.Blocks\[['"]([^'"]+)['"]\]/);
        return m ? m[1] : null;
    }

    normalizeDefinitionBlockId(code, blockId) {
        if (!code || !blockId) return code || '';
        return String(code).replace(
            /Blockly\.Blocks\[['"][^'"]+['"]\]/g,
            `Blockly.Blocks['${blockId}']`
        );
    }

    normalizeGeneratorBlockId(code, blockId) {
        if (!code || !blockId) return code || '';
        const pattern = /((?:arduinoGenerator|pythonGenerator|javaGenerator|Blockly\.Arduino|Blockly\.Python|Blockly\.Java)(?:\.forBlock)?\[['"])[^'"]+(['"]\])/g;
        return String(code).replace(pattern, (_match, prefix, suffix) => `${prefix}${blockId}${suffix}`);
    }

    unregisterPreviewBlock() {
        if (this._currentPreviewType && Blockly.Blocks[this._currentPreviewType]) {
            delete Blockly.Blocks[this._currentPreviewType];
        }
    }

    destroyPreview() {
        if (this.previewWorkspace) {
            this.previewWorkspace.dispose();
            this.previewWorkspace = null;
        }
        const container = document.getElementById('preview-workspace');
        if (container) container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:13px;">No preview</div>';
        this.setAllSideCodeValues('Code preview unavailable: no preview block.');
        if (this.previewSource === 'prompt') {
            const existing = document.getElementById('ai-response-command')?.value || '';
            if (!existing.trim()) {
                this.setPromptCommandScriptPreview('// Command script unavailable: no preview block.');
            }
        }
    }

    renderPreview(blockType) {
        const container = document.getElementById('preview-workspace');
        if (!container) return;

        if (this.previewWorkspace) {
            this.previewWorkspace.dispose();
            this.previewWorkspace = null;
        }
        container.innerHTML = '';

        try {
            this.previewWorkspace = Blockly.inject(container, {
                readOnly: false,
                scrollbars: true,
                media: 'lib/blockly/media/',
                zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
                move: { scrollbars: true, drag: true, wheel: true },
                grid: { spacing: 20, length: 3, colour: '#8a9aaa', snap: true },
                trashcan: false,
                toolbox: null,
                sounds: false,
                renderer: 'geras',
                theme: Blockly.Themes.Classic
            });

            const blockSvg = this.previewWorkspace.newBlock(blockType);
            blockSvg.initSvg();
            blockSvg.render();
            blockSvg.moveBy(30, 30);

            this.previewWorkspace.addChangeListener(() => {
                if (this.previewSource === 'prompt') {
                    this.refreshPromptCommandScriptFromPreview();
                } else {
                    this.refreshCommandScriptFromPreview();
                }
                this.refreshSideCodePreviews();
            });

            this.logConsole('Preview rendered.', 'success');
            if (this.previewSource === 'prompt') {
                this.refreshPromptCommandScriptFromPreview();
            } else {
                this.refreshCommandScriptFromPreview();
            }
            this.refreshSideCodePreviews();

            // Re-build state mapping UI if we are in the emmiScript tab
            const emmiScriptTab = document.querySelector('.gen-tab[data-gen="emmiScript"]');
            if (emmiScriptTab && emmiScriptTab.classList.contains('active')) {
                this.buildStateMappingUI();
            }
        } catch (err) {
            this.logConsole(`Preview Error: ${err.message}`, 'error');
            const cmdPreview = document.getElementById('command-script-preview');
            if (cmdPreview) cmdPreview.value = `// Preview failed: ${err.message}`;
            this.setAllSideCodeValues(`Code preview failed: ${err.message}`);
            container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ff6b6b;font-size:13px;padding:10px;text-align:center;">Preview failed: ${err.message}</div>`;
        }
    }

    // =========================================================================
    // CONSOLE
    // =========================================================================

    clearConsole() {
        const el = document.getElementById('error-console');
        if (el) el.innerHTML = '';
    }

    logConsole(msg, type = 'info') {
        const el = document.getElementById('error-console');
        if (!el) return;
        const line = document.createElement('div');
        line.className = `console-line console-${type}`;
        const prefix = type === 'error' ? 'ERROR: ' : type === 'warn' ? 'WARN: ' : type === 'success' ? 'OK: ' : '';
        line.textContent = prefix + msg;
        el.appendChild(line);
        el.scrollTop = el.scrollHeight;
    }

    // =========================================================================
    // GENERATOR TABS
    // =========================================================================

    getGenTabOrder() {
        return ['definition', 'arduino', 'python', 'java', 'emmiScript'];
    }

    switchGenTab(gen) {
        const order = this.getGenTabOrder();
        const activeGen = order.includes(gen) ? gen : 'definition';
        const activeEditorId = activeGen === 'definition' ? 'editor-definition' : `gen-${activeGen}`;

        document.querySelectorAll('.gen-tab').forEach(t => t.classList.toggle('active', t.dataset.gen === activeGen));
        document.querySelectorAll('.gen-editor').forEach(e => e.classList.toggle('active', e.id === activeEditorId));

        // Auto-detect states when switching to Command Script tab
        if (activeGen === 'emmiScript') {
            this.buildStateMappingUI();
        }
    }

    // =========================================================================
    // SYNC - WRITE EDITS BACK TO ACTUAL SOURCE FILES
    // =========================================================================

    validateBlocksBeforeSync() {
        const errors = [];

        for (const block of this.blocks) {
            const blockLabel = block.id || '(unknown-block)';
            const defCode = String(block.defCode || '').trim();

            if (!defCode) {
                errors.push(`${blockLabel}: block definition is empty.`);
                continue;
            }

            const defId = this.extractBlockType(defCode);
            if (!defId) {
                errors.push(`${blockLabel}: definition must include Blockly.Blocks['${blockLabel}'].`);
            } else if (defId !== block.id) {
                // Auto-normalize to keep toolbox/category references stable.
                block.defCode = this.normalizeDefinitionBlockId(block.defCode, block.id);
                block.gen.arduino.code = this.normalizeGeneratorBlockId(block.gen.arduino.code || '', block.id);
                block.gen.python.code = this.normalizeGeneratorBlockId(block.gen.python.code || '', block.id);
                block.gen.java.code = this.normalizeGeneratorBlockId(block.gen.java.code || '', block.id);
                if (block.gen.command?.code) {
                    block.gen.command.code = block.gen.command.code.replace(
                        /(?:registry|emmiCommandGenerator\.forBlock)\[['"][^'"]+['"]\]/,
                        `registry['${block.id}']`
                    );
                }
            }

            try {
                const fn = new Function('Blockly', block.defCode);
                if (typeof fn !== 'function') {
                    errors.push(`${blockLabel}: invalid definition code.`);
                }
            } catch (err) {
                errors.push(`${blockLabel}: definition syntax error: ${err.message}`);
            }

            for (const lang of ['arduino', 'python', 'java']) {
                const code = String(block.gen?.[lang]?.code || '').trim();
                if (!code) continue;

                try {
                    const fn = new Function('Blockly', 'arduinoGenerator', 'pythonGenerator', 'javaGenerator', code);
                    if (typeof fn !== 'function') {
                        errors.push(`${blockLabel}: invalid ${lang} generator code.`);
                    }
                } catch (err) {
                    errors.push(`${blockLabel}: ${lang} generator syntax error: ${err.message}`);
                }
            }

            // Validate command code syntax
            const cmdCode = String(block.gen?.command?.code || '').trim();
            if (cmdCode) {
                try {
                    new Function('registry', cmdCode);
                } catch (err) {
                    errors.push(`${blockLabel}: command generator syntax error: ${err.message}`);
                }
            }
        }

        return errors;
    }

    stripBlockDefinitionsFromGeneratorFile(content) {
        let next = String(content || '');
        const defs = this.extractBlockDefinitions(next);
        for (const def of defs) {
            next = next.replace(def.code, '');
        }
        return next;
    }

    async syncToServer() {
        try {
            // Save current editor state
            this.saveCurrentEdits();
            const validationErrors = this.validateBlocksBeforeSync();
            if (validationErrors.length > 0) {
                validationErrors.slice(0, 6).forEach(msg => this.logConsole(msg, 'error'));
                if (validationErrors.length > 6) {
                    this.logConsole(`...and ${validationErrors.length - 6} more issues`, 'error');
                }
                this.showToast('Sync blocked: fix code errors shown in console', 'error');
                return;
            }

            this.saveToolboxModelToSource();
            this.saveCommandMappingsToSource();
            this.showToast('Syncing to source files...', 'info');

            // Rebuild source files with edits applied
            const modifiedFiles = this.rebuildSourceFiles();

            const files = Object.entries(modifiedFiles).map(([p, content]) => ({ path: p, content }));

            if (files.length === 0) {
                this.showToast('No files to sync.', 'warn');
                return;
            }

            const resp = await fetch('/api/sync-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files })
            });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const result = await resp.json();

            if (result.success) {
                // Update local sourceFiles cache
                for (const [p, content] of Object.entries(modifiedFiles)) {
                    this.sourceFiles[p] = content;
                }
                this.dirtyFiles.clear();
                this.showToast(`Synced ${result.written} files to project!`, 'success');
            } else {
                this.showToast('Sync failed: ' + (result.error || 'Unknown'), 'error');
            }
        } catch (err) {
            console.error('Sync error:', err);
            this.showToast('Sync failed: ' + err.message, 'error');
        }
    }

    /**
     * Rebuild modified source files by replacing block definitions and generators
     * in the original file content with the edited versions.
     */
    rebuildSourceFiles() {
        const modified = {};

        // --- Rebuild block definition files ---
        const blocksByFile = {};
        for (const block of this.blocks) {
            if (!blocksByFile[block.sourceFile]) blocksByFile[block.sourceFile] = [];
            blocksByFile[block.sourceFile].push(block);
        }

        for (const [file, blocks] of Object.entries(blocksByFile)) {
            let content = this.sourceFiles[file] || '';

            for (const block of blocks) {
                // Find and replace the block definition in the file
                const origDefs = this.extractBlockDefinitions(content);
                const origDef = origDefs.find(d => d.id === block.id);
                if (origDef) {
                    content = content.replace(origDef.code, block.defCode);
                }
            }

            modified[file] = content;
        }

        // --- Rebuild generator files ---
        // Group generator edits by file
        const genEditsByFile = {};
        const langToGenName = {
            arduino: 'arduinoGenerator',
            python: 'pythonGenerator',
            java: 'javaGenerator'
        };
        const langToLegacyName = {
            arduino: 'Blockly.Arduino',
            python: 'Blockly.Python',
            java: 'Blockly.Java'
        };

        for (const block of this.blocks) {
            for (const lang of ['arduino', 'python', 'java']) {
                const g = block.gen[lang];
                if (g.file && g.code) {
                    if (!genEditsByFile[g.file]) genEditsByFile[g.file] = [];
                    genEditsByFile[g.file].push({
                        blockId: block.id,
                        lang,
                        genName: langToGenName[lang],
                        legacyName: langToLegacyName[lang],
                        code: g.code
                    });
                }
            }
        }

        for (const [file, edits] of Object.entries(genEditsByFile)) {
            let content = modified[file] || this.sourceFiles[file] || '';

            for (const edit of edits) {
                // Find original generator in content
                const origGens = this.extractGeneratorFunctions(content);
                const origGen = origGens.find(g =>
                    g.blockId === edit.blockId &&
                    (g.genName === edit.genName || g.genName === edit.legacyName)
                );
                if (origGen) {
                    content = content.replace(origGen.code, edit.code);
                } else {
                    content += `\n\n${edit.code}`;
                }
            }

            modified[file] = this.stripBlockDefinitionsFromGeneratorFile(content);
        }

        // Include files changed directly (toolbox updates, new board files, deletions in emptied files)
        for (const file of this.dirtyFiles) {
            if (
                Object.prototype.hasOwnProperty.call(this.sourceFiles, file)
                && !Object.prototype.hasOwnProperty.call(modified, file)
            ) {
                const source = this.sourceFiles[file];
                modified[file] = file.startsWith('js/generators/')
                    ? this.stripBlockDefinitionsFromGeneratorFile(source)
                    : source;
            }
        }

        return modified;
    }

    // =========================================================================
    // ADD BOARD / CATEGORY / BLOCK
    // =========================================================================

    populateBoardSelect(selectEl, selectedBoardId = 'common', includeCommon = true) {
        if (!selectEl) return;
        const boardIds = this.getOrderedBoardIds(this.getKnownBoardIds()).filter(id => includeCommon || id !== 'common');
        selectEl.innerHTML = '';

        boardIds.forEach(boardId => {
            const opt = document.createElement('option');
            opt.value = boardId;
            opt.textContent = this.getBoardLabel(boardId);
            selectEl.appendChild(opt);
        });

        if (boardIds.includes(selectedBoardId)) selectEl.value = selectedBoardId;
        else if (boardIds.length > 0) selectEl.value = boardIds[0];
    }

    populateCategorySelect(selectEl, boardId, selectedPath = '') {
        if (!selectEl) return;

        const paths = this.getCategoryPathsForBoard(boardId);
        selectEl.innerHTML = '';

        if (paths.length === 0) {
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = 'No categories (create one first)';
            selectEl.appendChild(empty);
            return;
        }

        paths.forEach(({ path }) => {
            const opt = document.createElement('option');
            opt.value = path;
            opt.textContent = path;
            selectEl.appendChild(opt);
        });

        if (selectedPath && paths.some(item => item.path === selectedPath)) {
            selectEl.value = selectedPath;
        } else {
            selectEl.value = paths[0].path;
        }
    }

    populateBlockFileSelect(selectEl, boardId, selectedFile = '', selectedCategoryPath = '') {
        if (!selectEl) return;

        const files = this.getBoardBlockFiles(boardId);
        const fallbackFile = this.getDefaultBlockFileForBoard(boardId);
        const options = files.length > 0 ? files : [fallbackFile];

        selectEl.innerHTML = '';
        options.forEach(file => {
            const opt = document.createElement('option');
            opt.value = file;
            opt.textContent = file.replace('blocks/', '').replace('.js', '');
            selectEl.appendChild(opt);
        });

        const lowerCat = (selectedCategoryPath || '').toLowerCase();
        let guessedFile = fallbackFile;
        if (boardId === 'common' && lowerCat.includes('variable') && options.includes('blocks/variable_blocks.js')) {
            guessedFile = 'blocks/variable_blocks.js';
        } else if (boardId === 'common' && (lowerCat.includes('communicate') || lowerCat.includes('serial') || lowerCat.includes('bluetooth')) && options.includes('blocks/communication_blocks.js')) {
            guessedFile = 'blocks/communication_blocks.js';
        }

        if (selectedFile && options.includes(selectedFile)) {
            selectEl.value = selectedFile;
        } else if (options.includes(guessedFile)) {
            selectEl.value = guessedFile;
        } else {
            selectEl.value = options[0];
        }
    }

    refreshBlockModalSelectors(preferredCategoryPath = '', preferredFile = '') {
        const boardSelect = document.getElementById('input-block-board');
        const categorySelect = document.getElementById('input-block-category');
        const fileSelect = document.getElementById('input-block-file');
        const boardId = boardSelect?.value || 'common';

        this.populateCategorySelect(categorySelect, boardId, preferredCategoryPath);
        const selectedCategory = categorySelect?.value || '';
        this.populateBlockFileSelect(fileSelect, boardId, preferredFile, selectedCategory);
    }

    populateBlockTemplateSelect(selectEl, selectedTemplate = 'blank') {
        if (!selectEl) return;

        const templates = [
            { key: 'blank', label: 'Blank Statement Block' },
            { key: 'digital_write', label: 'Digital Write Template' },
            { key: 'digital_read', label: 'Digital Read Template' },
            { key: 'analog_read', label: 'Analog Read Template' }
        ];

        selectEl.innerHTML = '';
        templates.forEach(template => {
            const opt = document.createElement('option');
            opt.value = template.key;
            opt.textContent = template.label;
            selectEl.appendChild(opt);
        });

        const exists = templates.some(t => t.key === selectedTemplate);
        selectEl.value = exists ? selectedTemplate : 'blank';
    }

    getTemplateSuggestedId(templateKey) {
        const suggestions = {
            blank: 'new_block',
            digital_write: 'new_digital_write',
            digital_read: 'new_digital_read',
            analog_read: 'new_analog_read'
        };
        return suggestions[templateKey] || 'new_block';
    }

    buildTemplateCodes(templateKey, id) {
        const safeTemplate = templateKey || 'blank';

        if (safeTemplate === 'digital_write') {
            return {
                defCode: `Blockly.Blocks['${id}'] = {\n    init: function() {\n        this.appendDummyInput()\n            .appendField(\"digital write pin\")\n            .appendField(new Blockly.FieldNumber(2, 0, 39, 1), \"PIN\")\n            .appendField(\"state\")\n            .appendField(new Blockly.FieldDropdown([[\"HIGH\", \"HIGH\"], [\"LOW\", \"LOW\"]]), \"STATE\");\n        this.setPreviousStatement(true, null);\n        this.setNextStatement(true, null);\n        this.setColour(\"#00838F\");\n        this.setTooltip(\"Write HIGH or LOW to a digital pin.\");\n        this.setHelpUrl(\"\");\n    }\n};`,
                arduinoCode: `arduinoGenerator.forBlock['${id}'] = function(block) {\n    var pin = block.getFieldValue('PIN');\n    var state = block.getFieldValue('STATE');\n    if (!Array.isArray(arduinoGenerator.setupCode_)) {\n        arduinoGenerator.setupCode_ = [];\n    }\n    var setupLine = 'pinMode(' + pin + ', OUTPUT);';\n    if (!arduinoGenerator.setupCode_.includes(setupLine)) {\n        arduinoGenerator.setupCode_.push(setupLine);\n    }\n    return '  digitalWrite(' + pin + ', ' + state + ');\\n';\n};`,
                pythonCode: `pythonGenerator.forBlock['${id}'] = function(block) {\n    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';\n    var pin = block.getFieldValue('PIN');\n    var state = block.getFieldValue('STATE') === 'HIGH' ? '1' : '0';\n    return 'Pin(' + pin + ', Pin.OUT).value(' + state + ')\\n';\n};`,
                javaCode: `javaGenerator.forBlock['${id}'] = function(block) {\n    var pin = block.getFieldValue('PIN');\n    var state = block.getFieldValue('STATE');\n    return '        gpio.digitalWrite(' + pin + ', GPIO.' + state + ');\\n';\n};`,
                commandCode: `registry['${id}'] = {\n    init: '',\n    main: ''\n};`
            };
        }

        if (safeTemplate === 'digital_read') {
            return {
                defCode: `Blockly.Blocks['${id}'] = {\n    init: function() {\n        this.appendDummyInput()\n            .appendField(\"digital read pin\")\n            .appendField(new Blockly.FieldNumber(2, 0, 39, 1), \"PIN\")\n            .appendField(\"pullup\")\n            .appendField(new Blockly.FieldCheckbox(\"FALSE\"), \"PULLUP\");\n        this.setOutput(true, \"Number\");\n        this.setColour(\"#00838F\");\n        this.setTooltip(\"Read digital state from a pin.\");\n        this.setHelpUrl(\"\");\n    }\n};`,
                arduinoCode: `arduinoGenerator.forBlock['${id}'] = function(block) {\n    var pin = block.getFieldValue('PIN');\n    var pullup = block.getFieldValue('PULLUP') === 'TRUE';\n    if (!Array.isArray(arduinoGenerator.setupCode_)) {\n        arduinoGenerator.setupCode_ = [];\n    }\n    var modeLine = pullup ? ('pinMode(' + pin + ', INPUT_PULLUP);') : ('pinMode(' + pin + ', INPUT);');\n    if (!arduinoGenerator.setupCode_.includes(modeLine)) {\n        arduinoGenerator.setupCode_.push(modeLine);\n    }\n    return ['digitalRead(' + pin + ')', arduinoGenerator.ORDER_ATOMIC];\n};`,
                pythonCode: `pythonGenerator.forBlock['${id}'] = function(block) {\n    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';\n    var pin = block.getFieldValue('PIN');\n    var pullup = block.getFieldValue('PULLUP') === 'TRUE';\n    if (pullup) {\n        return ['Pin(' + pin + ', Pin.IN, Pin.PULL_UP).value()', pythonGenerator.ORDER_ATOMIC];\n    }\n    return ['Pin(' + pin + ', Pin.IN).value()', pythonGenerator.ORDER_ATOMIC];\n};`,
                javaCode: `javaGenerator.forBlock['${id}'] = function(block) {\n    var pin = block.getFieldValue('PIN');\n    var pullup = block.getFieldValue('PULLUP') === 'TRUE';\n    if (pullup) {\n        return ['gpio.digitalRead(' + pin + ', GPIO.INPUT_PULLUP)', javaGenerator.ORDER_ATOMIC];\n    }\n    return ['gpio.digitalRead(' + pin + ')', javaGenerator.ORDER_ATOMIC];\n};`,
                commandCode: `registry['${id}'] = {\n    init: '',\n    main: ''\n};`
            };
        }

        if (safeTemplate === 'analog_read') {
            return {
                defCode: `Blockly.Blocks['${id}'] = {\n    init: function() {\n        this.appendDummyInput()\n            .appendField(\"analog read pin\")\n            .appendField(new Blockly.FieldNumber(34, 0, 39, 1), \"PIN\");\n        this.setOutput(true, \"Number\");\n        this.setColour(\"#00838F\");\n        this.setTooltip(\"Read analog value from a pin.\");\n        this.setHelpUrl(\"\");\n    }\n};`,
                arduinoCode: `arduinoGenerator.forBlock['${id}'] = function(block) {\n    var pin = block.getFieldValue('PIN');\n    if (!Array.isArray(arduinoGenerator.setupCode_)) {\n        arduinoGenerator.setupCode_ = [];\n    }\n    var modeLine = 'pinMode(' + pin + ', INPUT);';\n    if (!arduinoGenerator.setupCode_.includes(modeLine)) {\n        arduinoGenerator.setupCode_.push(modeLine);\n    }\n    return ['analogRead(' + pin + ')', arduinoGenerator.ORDER_ATOMIC];\n};`,
                pythonCode: `pythonGenerator.forBlock['${id}'] = function(block) {\n    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';\n    var pin = block.getFieldValue('PIN');\n    return ['ADC(Pin(' + pin + ')).read()', pythonGenerator.ORDER_ATOMIC];\n};`,
                javaCode: `javaGenerator.forBlock['${id}'] = function(block) {\n    var pin = block.getFieldValue('PIN');\n    return ['adc.read(' + pin + ')', javaGenerator.ORDER_ATOMIC];\n};`,
                commandCode: `registry['${id}'] = {\n    init: '',\n    main: ''\n};`
            };
        }

        return {
            defCode: `Blockly.Blocks['${id}'] = {\n    init: function() {\n        this.appendDummyInput()\n            .appendField("${id.replace(/_/g, ' ')}");\n        this.setPreviousStatement(true, null);\n        this.setNextStatement(true, null);\n        this.setColour("#00838F");\n        this.setTooltip("");\n        this.setHelpUrl("");\n    }\n};`,
            arduinoCode: `arduinoGenerator.forBlock['${id}'] = function(block) {\n    return '// ${id}\\n';\n};`,
            pythonCode: `pythonGenerator.forBlock['${id}'] = function(block) {\n    return '# ${id}\\n';\n};`,
            javaCode: `javaGenerator.forBlock['${id}'] = function(block) {\n    return '// ${id}\\n';\n};`,
            commandCode: `registry['${id}'] = {\n    init: '',\n    main: ''\n};`
        };
    }

    openAddBoardModal() {
        document.getElementById('input-board-id').value = '';
        document.getElementById('input-board-name').value = '';
        this.openModal('modal-board');
    }

    createBoard() {
        const rawId = (document.getElementById('input-board-id')?.value || '').trim().toLowerCase();
        const boardName = (document.getElementById('input-board-name')?.value || '').trim();

        if (!rawId) { this.showToast('Enter a board ID', 'error'); return; }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawId)) {
            this.showToast('Board ID must use lowercase letters, numbers, and hyphens only', 'error');
            return;
        }
        if (rawId === 'common') { this.showToast('common is reserved', 'error'); return; }

        const boardFile = this.getBoardFilePath(rawId);
        const boardGenFile = this.getBoardGeneratorFilePath(rawId);
        const boardCommandFile = this.getBoardCommandFilePath(rawId);
        if (this.sourceFiles[boardFile] || this.toolboxModel.boardCategories[rawId]) {
            this.showToast('Board already exists', 'error');
            return;
        }

        const title = boardName || this.formatBoardTitle(rawId);
        this.sourceFiles[boardFile] = this.buildBoardBlockFileTemplate(rawId, title);
        this.sourceFiles[boardGenFile] = this.buildBoardGeneratorFileTemplate(rawId, title);
        this.sourceFiles[boardCommandFile] = this.buildBoardCommandFileTemplate(rawId, title);
        this.markFileDirty(boardFile);
        this.markFileDirty(boardGenFile);
        this.markFileDirty(boardCommandFile);

        this.toolboxModel.boardCategories[rawId] = [];
        this.saveToolboxModelToSource();

        this.selectedBoardId = rawId;
        this.openBoards[rawId] = true;
        this.closeModal('modal-board');
        this.renderTree();
        this.showToast(`Board ${rawId} created`, 'success');
    }

    openAddCategoryModal(defaultBoardId = 'common') {
        const boardSelect = document.getElementById('input-category-board');
        this.populateBoardSelect(boardSelect, defaultBoardId, true);
        document.getElementById('input-category-name').value = '';
        document.getElementById('input-category-colour').value = '#424242';
        this.openModal('modal-category');
    }

    createCategory() {
        const boardId = document.getElementById('input-category-board')?.value || 'common';
        const categoryName = (document.getElementById('input-category-name')?.value || '').trim();
        const colour = document.getElementById('input-category-colour')?.value || '#424242';

        if (!categoryName) { this.showToast('Enter a category name', 'error'); return; }
        if (categoryName.includes('/')) { this.showToast('Category name cannot contain /', 'error'); return; }

        const existingNames = (this.getBoardCategoryDefinitions(boardId) || [])
            .filter(c => c && c.kind === 'category')
            .map(c => c.name.toLowerCase());
        if (existingNames.includes(categoryName.toLowerCase())) {
            this.showToast('Category already exists in this board', 'error');
            return;
        }

        this.addCategoryToBoard(boardId, categoryName, colour);
        this.saveToolboxModelToSource();

        const categoryKey = `${boardId}:${categoryName}`;
        this.selectedBoardId = boardId;
        this.openBoards[boardId] = true;
        this.openCategories[categoryKey] = true;

        this.closeModal('modal-category');
        this.renderTree();
        this.showToast(`Category ${categoryName} created`, 'success');
    }

    openAddBlockModal(options = {}) {
        const boardId = options.boardId || this.selectedBoardId || 'common';
        const boardSelect = document.getElementById('input-block-board');
        this.populateBoardSelect(boardSelect, boardId, true);

        this.refreshBlockModalSelectors(options.categoryPath || '', options.file || '');
        this.populateBlockTemplateSelect(document.getElementById('input-block-template'), options.template || 'blank');
        document.getElementById('input-block-id').value = '';
        this.openModal('modal-block');
    }

    createBlock() {
        const id = (document.getElementById('input-block-id')?.value || '').trim();
        const boardId = document.getElementById('input-block-board')?.value || 'common';
        const categoryPath = document.getElementById('input-block-category')?.value || '';
        const file = document.getElementById('input-block-file')?.value || this.getDefaultBlockFileForBoard(boardId);
        const templateKey = document.getElementById('input-block-template')?.value || 'blank';

        if (!id) { this.showToast('Enter a block ID', 'error'); return; }
        if (this.blocks.find(b => b.id === id)) { this.showToast('Block ID already exists', 'error'); return; }
        if (!categoryPath) { this.showToast('Select a category first', 'error'); return; }
        if (!file) { this.showToast('Select a file', 'error'); return; }

        const templateCodes = this.buildTemplateCodes(templateKey, id);
        const defCode = templateCodes.defCode;

        let arduinoFile = '';
        let pythonFile = '';
        let javaFile = '';

        for (const b of this.blocks) {
            if (b.sourceFile === file) {
                if (b.gen.arduino.file) arduinoFile = b.gen.arduino.file;
                if (b.gen.python.file) pythonFile = b.gen.python.file;
                if (b.gen.java.file) javaFile = b.gen.java.file;
                if (arduinoFile && pythonFile && javaFile) break;
            }
        }

        if (!arduinoFile || !pythonFile || !javaFile) {
            if (boardId === 'common') {
                arduinoFile = arduinoFile || 'js/generators/arduino.js';
                pythonFile = pythonFile || 'js/generators/python.js';
                javaFile = javaFile || 'js/generators/java.js';
            } else {
                const boardGenFile = this.getBoardGeneratorFilePath(boardId);
                arduinoFile = arduinoFile || boardGenFile;
                pythonFile = pythonFile || boardGenFile;
                javaFile = javaFile || boardGenFile;
            }
        }

        const arduinoCode = templateCodes.arduinoCode;
        const pythonCode = templateCodes.pythonCode;
        const javaCode = templateCodes.javaCode;
        const commandCode = templateCodes.commandCode || '';
        const commandFile = this.getBoardCommandFilePath(boardId);

        const newBlock = {
            id,
            boardId,
            sourceFile: file,
            defCode,
            gen: {
                arduino: { file: arduinoFile, code: arduinoCode },
                python: { file: pythonFile, code: pythonCode },
                java: { file: javaFile, code: javaCode },
                command: { file: commandFile, code: commandCode },
                emmiScript: ''
            }
        };

        this.blocks.push(newBlock);

        if (!this.sourceFiles[file]) this.sourceFiles[file] = '';
        this.sourceFiles[file] += `\n\n${defCode}`;
        this.markFileDirty(file);

        if (arduinoFile) {
            if (!this.sourceFiles[arduinoFile]) this.sourceFiles[arduinoFile] = '';
            this.sourceFiles[arduinoFile] += `\n\n${arduinoCode}`;
            this.markFileDirty(arduinoFile);
        }
        if (pythonFile) {
            if (!this.sourceFiles[pythonFile]) this.sourceFiles[pythonFile] = '';
            this.sourceFiles[pythonFile] += `\n\n${pythonCode}`;
            this.markFileDirty(pythonFile);
        }
        if (javaFile) {
            if (!this.sourceFiles[javaFile]) this.sourceFiles[javaFile] = '';
            this.sourceFiles[javaFile] += `\n\n${javaCode}`;
            this.markFileDirty(javaFile);
        }

        const linked = this.addBlockToCategory(boardId, categoryPath, id);
        if (!linked) {
            this.showToast('Block created but category link failed', 'warn');
        }
        this.saveToolboxModelToSource();

        this.closeModal('modal-block');
        this.selectedBoardId = boardId;
        this.openBoards[boardId] = true;
        this.openCategories[`${boardId}:${categoryPath}`] = true;
        this.renderTree();
        this.selectBlock(id);
        this.showToast('Block created. Press Sync to save to files.', 'success');
    }

    // =========================================================================
    // DELETE & RENAME
    // =========================================================================

    removeBlockDefinitionByIdFromFile(filePath, blockId) {
        if (!filePath || !blockId || !this.sourceFiles[filePath]) return false;

        let content = this.sourceFiles[filePath];
        let changed = false;
        const defs = this.extractBlockDefinitions(content);

        for (const def of defs) {
            if (def.id !== blockId) continue;
            content = content.replace(def.code, '');
            changed = true;
        }

        if (changed) {
            this.sourceFiles[filePath] = content;
            this.markFileDirty(filePath);
        }

        return changed;
    }

    removeGeneratorByBlockIdFromFile(filePath, blockId) {
        if (!filePath || !blockId || !this.sourceFiles[filePath]) return false;

        let content = this.sourceFiles[filePath];
        let changed = false;
        const gens = this.extractGeneratorFunctions(content);

        for (const gen of gens) {
            if (gen.blockId !== blockId) continue;
            content = content.replace(gen.code, '');
            changed = true;
        }

        if (changed) {
            this.sourceFiles[filePath] = content;
            this.markFileDirty(filePath);
        }

        return changed;
    }

    removeBlockCodeFromSources(block) {
        if (!block) return;

        // Remove definition by block ID (more robust than exact string replacement)
        const removedDef = this.removeBlockDefinitionByIdFromFile(block.sourceFile, block.id);
        if (!removedDef && this.sourceFiles[block.sourceFile] && block.defCode) {
            // Fallback to exact replacement for malformed files that cannot be parsed
            const fallback = this.sourceFiles[block.sourceFile].replace(block.defCode, '');
            if (fallback !== this.sourceFiles[block.sourceFile]) {
                this.sourceFiles[block.sourceFile] = fallback;
                this.markFileDirty(block.sourceFile);
            }
        }

        // Remove all matching generators by block ID from each generator file
        const genFiles = new Set();
        for (const lang of ['arduino', 'python', 'java']) {
            const g = block.gen[lang];
            if (g && g.file) genFiles.add(g.file);
        }

        for (const file of genFiles) {
            const removedGen = this.removeGeneratorByBlockIdFromFile(file, block.id);
            if (!removedGen) {
                for (const lang of ['arduino', 'python', 'java']) {
                    const g = block.gen[lang];
                    if (g && g.file === file && g.code && this.sourceFiles[file]) {
                        const fallback = this.sourceFiles[file].replace(g.code, '');
                        if (fallback !== this.sourceFiles[file]) {
                            this.sourceFiles[file] = fallback;
                            this.markFileDirty(file);
                        }
                    }
                }
            }
        }
    }

    deleteBlockById(blockId, options = {}) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return false;

        const confirmDelete = options.confirmDelete === true;
        const saveToolbox = options.saveToolbox !== false;
        const refreshUI = options.refreshUI !== false;
        const toast = options.toast === true;

        if (confirmDelete && !confirm(`Delete block "${block.id}"?`)) {
            return false;
        }

        this.removeBlockCodeFromSources(block);
        this.blocks = this.blocks.filter(b => b.id !== block.id);
        this.removeBlockFromAllCategories(block.id);

        if (this.selectedBlockId === block.id) {
            this.selectedBlockId = null;
        }

        if (saveToolbox) {
            this.saveToolboxModelToSource();
        }

        if (refreshUI) {
            this.renderTree();
            this.showEditor();
        }

        if (toast) {
            this.showToast('Block deleted. Press Sync to save.', 'info');
        }

        return true;
    }

    deleteCategory(boardId, categoryPath, node) {
        if (!categoryPath) return;

        const blockIds = Array.from(this.collectBlockIdsFromTreeNode(node));
        const categoryName = categoryPath.split('/').pop() || categoryPath;
        const blockPart = blockIds.length > 0 ? ` and ${blockIds.length} block(s)` : '';
        if (!confirm(`Delete category "${categoryName}"${blockPart}?`)) return;

        for (const blockId of blockIds) {
            this.deleteBlockById(blockId, {
                confirmDelete: false,
                saveToolbox: false,
                refreshUI: false,
                toast: false
            });
        }

        if (categoryPath !== 'Uncategorized') {
            this.removeCategoryDefinition(boardId, categoryPath);
        }

        const prefix = `${boardId}:${categoryPath}`;
        Object.keys(this.openCategories).forEach(key => {
            if (key === prefix || key.startsWith(prefix + '/')) {
                delete this.openCategories[key];
            }
        });

        this.saveToolboxModelToSource();
        this.renderTree();
        this.showEditor();
        this.showToast('Category deleted. Press Sync to save.', 'info');
    }

    deleteBoard(boardId) {
        if (!boardId || boardId === 'common') {
            this.showToast('Common board cannot be deleted.', 'warn');
            return;
        }

        const boardBlocks = this.blocks.filter(block => (block.boardId || this.getBoardIdForFile(block.sourceFile)) === boardId);
        const categoryCount = this.countCategoriesRecursive(this.getBoardCategoryDefinitions(boardId));
        const msg = `Delete board "${boardId}" with ${categoryCount} category(s) and ${boardBlocks.length} block(s)?`;
        if (!confirm(msg)) return;

        const blockIds = boardBlocks.map(block => block.id);
        for (const blockId of blockIds) {
            this.deleteBlockById(blockId, {
                confirmDelete: false,
                saveToolbox: false,
                refreshUI: false,
                toast: false
            });
        }

        delete this.toolboxModel.boardCategories[boardId];

        const boardFiles = this.getBoardBlockFiles(boardId);
        for (const file of boardFiles) {
            this.sourceFiles[file] = this.buildBoardBlockFileTemplate(boardId);
            this.markFileDirty(file);
        }

        const boardGeneratorFile = this.getBoardGeneratorFilePath(boardId);
        if (boardGeneratorFile && Object.prototype.hasOwnProperty.call(this.sourceFiles, boardGeneratorFile)) {
            this.sourceFiles[boardGeneratorFile] = this.buildBoardGeneratorFileTemplate(boardId);
            this.markFileDirty(boardGeneratorFile);
        }

        const boardCommandFile = this.getBoardCommandFilePath(boardId);
        if (boardCommandFile && Object.prototype.hasOwnProperty.call(this.sourceFiles, boardCommandFile)) {
            this.sourceFiles[boardCommandFile] = this.buildBoardCommandFileTemplate(boardId);
            this.markFileDirty(boardCommandFile);
        }

        delete this.openBoards[boardId];
        Object.keys(this.openCategories).forEach(key => {
            if (key.startsWith(boardId + ':')) {
                delete this.openCategories[key];
            }
        });

        if (this.selectedBoardId === boardId) {
            this.selectedBoardId = 'common';
        }

        this.saveToolboxModelToSource();
        this.renderTree();
        this.showEditor();
        this.showToast('Board deleted. Press Sync to save.', 'info');
    }

    deleteSelectedBlock() {
        const block = this.getSelectedBlock();
        if (!block) return;
        this.deleteBlockById(block.id, {
            confirmDelete: true,
            saveToolbox: true,
            refreshUI: true,
            toast: true
        });
    }

    openRenameModal() {
        const block = this.getSelectedBlock();
        if (!block) return;
        document.getElementById('input-rename-id').value = block.id;
        this.openModal('modal-rename');
    }

    confirmRename() {
        const newId = document.getElementById('input-rename-id')?.value.trim();
        if (!newId) { this.showToast('Enter a block ID', 'error'); return; }

        const block = this.getSelectedBlock();
        if (!block) return;

        const oldId = block.id;

        // Replace ID in definition code
        block.defCode = block.defCode.replace(
            new RegExp(`Blockly\\.Blocks\\[['"]${this.escapeRegex(oldId)}['"]\\]`),
            `Blockly.Blocks['${newId}']`
        );

        // Replace ID in generator code
        for (const lang of ['arduino', 'python', 'java']) {
            if (block.gen[lang].code) {
                block.gen[lang].code = block.gen[lang].code.replace(
                    new RegExp(`\\['${this.escapeRegex(oldId)}'\\]`, 'g'),
                    `['${newId}']`
                );
            }
        }

        block.id = newId;
        this.renameBlockInAllCategories(oldId, newId);
        this.saveToolboxModelToSource();
        this.selectedBlockId = newId;
        this.closeModal('modal-rename');
        this.renderTree();
        this.showEditor();
        this.showToast('Block renamed. Press Sync to save.', 'info');
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // =========================================================================
    // CLOUD CONFIG
    // =========================================================================

    loadCloudConfig() {
        try {
            const raw = localStorage.getItem('emmiCloudConfig');
            if (raw) return JSON.parse(raw);
        } catch (_) { }
        return { accessKeyId: '', secretAccessKey: '', region: '', bucketName: '' };
    }

    renderCloudSettingsInputs() {
        const c = this.cloudConfig || {};
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('cloud-access-key', c.accessKeyId);
        set('cloud-secret-key', c.secretAccessKey);
        set('cloud-region', c.region);
        set('cloud-bucket', c.bucketName);
    }

    async saveCloudSettings() {
        const cc = {
            accessKeyId: (document.getElementById('cloud-access-key')?.value || '').trim(),
            secretAccessKey: (document.getElementById('cloud-secret-key')?.value || '').trim(),
            region: (document.getElementById('cloud-region')?.value || '').trim(),
            bucketName: (document.getElementById('cloud-bucket')?.value || '').trim()
        };

        this.cloudConfig = cc;
        localStorage.setItem('emmiCloudConfig', JSON.stringify(cc));

        let saved = false;
        try {
            const r = await fetch('/api/cloud-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cloudConfig: cc })
            });
            if (r.ok) saved = true;
        } catch (_) { }

        this.closeModal('modal-cloud');
        this.showToast(saved ? 'Cloud settings saved!' : 'Saved locally (server unavailable)', saved ? 'success' : 'info');
    }

    exportApp() {
        this.showToast('Preparing app export...', 'info');
        const link = document.createElement('a');
        link.href = '/api/export-app';
        link.download = 'emmi-bot-lite.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => this.showToast('App export download started!', 'success'), 500);
    }

    // =========================================================================
    // EVENT BINDING
    // =========================================================================

    bindEvents() {
        // Header
        document.getElementById('btn-cloud-settings')?.addEventListener('click', () => this.openModal('modal-cloud'));
        document.getElementById('btn-save-cloud')?.addEventListener('click', () => this.saveCloudSettings());
        document.getElementById('btn-sync-server')?.addEventListener('click', () => this.syncToServer());
        document.getElementById('btn-export-app')?.addEventListener('click', () => this.exportApp());

        // Sidebar
        document.getElementById('btn-add-board')?.addEventListener('click', () => this.openAddBoardModal());
        document.getElementById('btn-add-category')?.addEventListener('click', () => this.openAddCategoryModal(this.selectedBoardId || 'common'));
        document.getElementById('btn-add-block')?.addEventListener('click', () => this.openAddBlockModal({ boardId: this.selectedBoardId || 'common' }));

        // Board modal
        document.getElementById('btn-save-board')?.addEventListener('click', () => this.createBoard());

        // Category modal
        document.getElementById('btn-save-category')?.addEventListener('click', () => this.createCategory());

        // Block modal
        document.getElementById('btn-create-block')?.addEventListener('click', () => this.createBlock());
        document.getElementById('input-block-board')?.addEventListener('change', () => this.refreshBlockModalSelectors());
        document.getElementById('input-block-category')?.addEventListener('change', () => {
            const boardId = document.getElementById('input-block-board')?.value || 'common';
            const categoryPath = document.getElementById('input-block-category')?.value || '';
            this.populateBlockFileSelect(document.getElementById('input-block-file'), boardId, '', categoryPath);
        });
        document.getElementById('input-block-template')?.addEventListener('change', () => {
            const idInput = document.getElementById('input-block-id');
            const selectedTemplate = document.getElementById('input-block-template')?.value || 'blank';
            if (idInput && !idInput.value.trim()) {
                idInput.value = this.getTemplateSuggestedId(selectedTemplate);
            }
        });

        // Rename modal
        document.getElementById('btn-confirm-rename')?.addEventListener('click', () => this.confirmRename());

        // Editor buttons
        document.getElementById('btn-refresh-preview')?.addEventListener('click', () => {
            if (this.editorMode === 'prompt') this.runPromptPreview();
            else this.runDefinition();
        });
        document.getElementById('btn-clear-console')?.addEventListener('click', () => this.clearConsole());
        document.getElementById('btn-rename-block')?.addEventListener('click', () => this.openRenameModal());
        document.getElementById('btn-delete-block')?.addEventListener('click', () => this.deleteSelectedBlock());

        // Modal close buttons
        document.querySelectorAll('.btn-close, .modal-footer .btn-secondary[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-modal');
                if (modalId) this.closeModal(modalId);
            });
        });

        // Generator tabs
        document.querySelectorAll('.gen-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchGenTab(tab.dataset.gen));
        });

        // Side code preview tabs
        document.querySelectorAll('.side-code-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchSideCodeTab(tab.dataset.previewLang));
        });

        // Command generator code editor
        document.getElementById('gen-command')?.addEventListener('input', () => {
            this.saveCurrentEdits();
            this.refreshRuntimeCommandRegistry();
            this.refreshCommandScriptFromPreview();
        });

        // State mapping buttons
        document.getElementById('btn-detect-states')?.addEventListener('click', () => this.buildStateMappingUI());
        document.getElementById('btn-apply-state-mapping')?.addEventListener('click', () => this.applyStateMappingToCode());

        // Code mode live preview listeners
        document.getElementById('editor-definition')?.addEventListener('input', () => {
            this.saveCurrentEdits();
            this.scheduleCodePreview();
        });

        ['gen-arduino', 'gen-python', 'gen-java'].forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('input', () => {
                this.saveCurrentEdits();
                this.scheduleCodeSidePreview();
            });
        });

        // Definition editor: Ctrl+Enter to run, Tab to indent
        const defEditor = document.getElementById('editor-definition');
        defEditor?.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.runDefinition();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = defEditor.selectionStart, end = defEditor.selectionEnd;
                defEditor.value = defEditor.value.substring(0, s) + '    ' + defEditor.value.substring(end);
                defEditor.selectionStart = defEditor.selectionEnd = s + 4;
                this.saveCurrentEdits();
                this.scheduleCodePreview();
            }
        });

        // Tab key for code editors
        ['gen-arduino', 'gen-python', 'gen-java', 'gen-command'].forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const s = el.selectionStart, end = el.selectionEnd;
                    el.value = el.value.substring(0, s) + '    ' + el.value.substring(end);
                    el.selectionStart = el.selectionEnd = s + 4;

                    this.saveCurrentEdits();
                    if (id === 'gen-command') {
                        this.refreshRuntimeCommandRegistry();
                        this.refreshCommandScriptFromPreview();
                    } else {
                        this.scheduleCodeSidePreview();
                    }
                }
            });
        });

        // Mode tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchEditorMode(tab.dataset.mode));
        });

        // Visual Builder
        document.getElementById('btn-vb-add-input')?.addEventListener('click', () => this.addVisualInput());
        document.getElementById('btn-visual-generate')?.addEventListener('click', () => this.generateFromVisual());
        document.getElementById('vb-block-type')?.addEventListener('change', () => this.renderVisualInputs());

        // Visual builder field modal
        document.getElementById('vb-field-type')?.addEventListener('change', () => this.updateFieldModalVisibility());
        document.getElementById('btn-vb-add-field-confirm')?.addEventListener('click', () => this.confirmAddField());

        // AI Prompt
        document.getElementById('btn-copy-prompt')?.addEventListener('click', () => this.copyPromptToClipboard());
        document.getElementById('btn-apply-ai-response')?.addEventListener('click', () => this.applyAIResponse());
        ['ai-response-definition', 'ai-response-arduino', 'ai-response-python', 'ai-response-java'].forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('input', () => this.schedulePromptPreview());
        });

        // Default editor tab
        this.switchGenTab('definition');
        this.switchSideCodeTab('arduino');
        this.setAllSideCodeValues('Code preview unavailable: select a block.');
    }

    // =========================================================================
    // MODAL & TOAST HELPERS
    // =========================================================================

    openModal(id) {
        document.getElementById(id)?.classList.remove('hidden');
    }

    closeModal(id) {
        document.getElementById(id)?.classList.add('hidden');
    }

    // =========================================================================
    // MODE SWITCHING
    // =========================================================================

    switchEditorMode(mode) {
        const modes = ['code', 'visual', 'prompt'];
        if (!modes.includes(mode)) mode = 'code';
        if (mode === this.editorMode) return;
        const previousMode = this.editorMode;

        if (previousMode === 'code') {
            this.saveCurrentEdits();
        } else if (previousMode === 'prompt') {
            const sections = this.getPromptCodeSections();
            const block = this.getSelectedBlock();
            let defCode = sections.definition.trim();
            if (block && defCode) {
                const detectedId = this.extractBlockType(defCode);
                let cmdCode = (document.getElementById('ai-response-command')?.value || '').trim();

                if (detectedId && detectedId !== block.id) {
                    defCode = this.normalizeDefinitionBlockId(defCode, block.id);
                    sections.arduino = this.normalizeGeneratorBlockId(sections.arduino, block.id);
                    sections.python = this.normalizeGeneratorBlockId(sections.python, block.id);
                    sections.java = this.normalizeGeneratorBlockId(sections.java, block.id);
                    if (cmdCode) {
                        cmdCode = cmdCode.replace(
                            /(?:registry|emmiCommandGenerator\.forBlock)\[['"][^'"]+['"]\]/,
                            `registry['${block.id}']`
                        );
                    }
                }

                block.defCode = defCode;
                block.gen.arduino.code = sections.arduino;
                block.gen.python.code = sections.python;
                block.gen.java.code = sections.java;
                block.gen.command.code = cmdCode;

                // Keep UI textareas in sync
                const defEditor = document.getElementById('editor-definition');
                if (defEditor) defEditor.value = block.defCode;

                const ardEditor = document.getElementById('gen-arduino');
                if (ardEditor) ardEditor.value = block.gen.arduino.code;

                const pyEditor = document.getElementById('gen-python');
                if (pyEditor) pyEditor.value = block.gen.python.code;

                const javaEditor = document.getElementById('gen-java');
                if (javaEditor) javaEditor.value = block.gen.java.code;

                const dbCmdEditor = document.getElementById('gen-command');
                if (dbCmdEditor) dbCmdEditor.value = block.gen.command.code;
            }
        }

        this.editorMode = mode;

        // Update mode tab buttons
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Toggle panels
        document.getElementById('mode-code')?.classList.toggle('hidden', mode !== 'code');
        document.getElementById('mode-visual')?.classList.toggle('hidden', mode !== 'visual');
        document.getElementById('mode-prompt')?.classList.toggle('hidden', mode !== 'prompt');

        // If switching to visual, sync from code editors
        if (mode === 'visual') {
            this.syncVisualFromBlock();
        }

        if (mode === 'prompt') {
            this.previewSource = 'prompt';
            const block = this.getSelectedBlock();
            if (block) this.populatePromptFieldsFromCurrentBlock(block);
            this.schedulePromptPreview();
            return;
        }

        this.previewSource = 'editor';
        if (this.getSelectedBlock()) {
            this.runDefinition();
        }
    }

    // =========================================================================
    // VISUAL BUILDER - STATE MANAGEMENT
    // =========================================================================

    syncVisualFromBlock() {
        const block = this.getSelectedBlock();
        if (block) {
            document.getElementById('vb-block-id').value = block.id || '';
        }
        this.renderVisualInputs();
    }

    getVisualState() {
        return {
            blockId: (document.getElementById('vb-block-id')?.value || '').trim(),
            blockType: document.getElementById('vb-block-type')?.value || 'statement',
            color: document.getElementById('vb-color')?.value || '#00838F',
            tooltip: (document.getElementById('vb-tooltip')?.value || '').trim(),
            outputType: document.getElementById('vb-output-type')?.value || 'Number',
            inline: document.getElementById('vb-inline')?.value || 'auto',
            inputs: this.visualState.inputs
        };
    }

    addVisualInput() {
        this.visualState.inputs.push({
            type: 'dummy',
            name: '',
            check: '',
            fields: []
        });
        this.renderVisualInputs();
    }

    removeVisualInput(index) {
        this.visualState.inputs.splice(index, 1);
        this.renderVisualInputs();
    }

    moveVisualInput(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.visualState.inputs.length) return;
        const temp = this.visualState.inputs[index];
        this.visualState.inputs[index] = this.visualState.inputs[newIndex];
        this.visualState.inputs[newIndex] = temp;
        this.renderVisualInputs();
    }

    openAddFieldModal(inputIndex) {
        this._vbFieldTargetInput = inputIndex;
        document.getElementById('vb-field-type').value = 'label';
        document.getElementById('vb-field-name').value = '';
        document.getElementById('vb-field-label').value = '';
        document.getElementById('vb-field-options').value = '';
        document.getElementById('vb-field-num-default').value = '';
        document.getElementById('vb-field-num-min').value = '';
        document.getElementById('vb-field-num-max').value = '';
        this.updateFieldModalVisibility();
        this.openModal('modal-vb-field');
    }

    updateFieldModalVisibility() {
        const fieldType = document.getElementById('vb-field-type')?.value;
        document.getElementById('vb-field-name-group')?.classList.toggle('hidden', fieldType === 'label');
        document.getElementById('vb-field-options-group')?.classList.toggle('hidden', fieldType !== 'dropdown');
        document.getElementById('vb-field-number-group')?.classList.toggle('hidden', fieldType !== 'number');
    }

    confirmAddField() {
        const inputIndex = this._vbFieldTargetInput;
        if (inputIndex < 0 || inputIndex >= this.visualState.inputs.length) return;

        const fieldType = document.getElementById('vb-field-type')?.value || 'label';
        const name = (document.getElementById('vb-field-name')?.value || '').trim();
        const label = (document.getElementById('vb-field-label')?.value || '').trim();

        if (fieldType !== 'label' && !name) {
            this.showToast('Field name is required', 'error');
            return;
        }

        const field = { type: fieldType, name, label };

        if (fieldType === 'dropdown') {
            const optionsText = document.getElementById('vb-field-options')?.value || '';
            field.options = optionsText.split('\n').filter(l => l.trim()).map(line => {
                const parts = line.split('=');
                const lbl = parts[0].trim();
                const val = (parts[1] || parts[0]).trim();
                return [lbl, val];
            });
            if (field.options.length === 0) {
                this.showToast('Add at least one dropdown option', 'error');
                return;
            }
        }

        if (fieldType === 'number') {
            field.numDefault = parseFloat(document.getElementById('vb-field-num-default')?.value) || 0;
            field.numMin = parseFloat(document.getElementById('vb-field-num-min')?.value) || 0;
            field.numMax = parseFloat(document.getElementById('vb-field-num-max')?.value) || 39;
        }

        this.visualState.inputs[inputIndex].fields.push(field);
        this.closeModal('modal-vb-field');
        this.renderVisualInputs();
    }

    removeVisualField(inputIndex, fieldIndex) {
        if (this.visualState.inputs[inputIndex]) {
            this.visualState.inputs[inputIndex].fields.splice(fieldIndex, 1);
            this.renderVisualInputs();
        }
    }

    renderVisualInputs() {
        const container = document.getElementById('vb-inputs-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.visualState.inputs.length === 0) {
            container.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:12px;text-align:center;">No inputs yet. Click "Add Input" to start building.</div>';
            return;
        }

        this.visualState.inputs.forEach((input, i) => {
            const row = document.createElement('div');
            row.className = 'vb-input-row';

            // Header
            const header = document.createElement('div');
            header.className = 'vb-input-header';

            const typeSelect = document.createElement('select');
            typeSelect.innerHTML = '<option value="dummy">Dummy Input</option><option value="value">Value Input</option><option value="statement">Statement Input</option>';
            typeSelect.value = input.type;
            typeSelect.addEventListener('change', () => {
                this.visualState.inputs[i].type = typeSelect.value;
                this.renderVisualInputs();
            });
            header.appendChild(typeSelect);

            if (input.type !== 'dummy') {
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.placeholder = 'Input name (e.g., VALUE)';
                nameInput.value = input.name || '';
                nameInput.style.flex = '1';
                nameInput.addEventListener('change', () => {
                    this.visualState.inputs[i].name = nameInput.value.trim();
                });
                header.appendChild(nameInput);
            }

            if (input.type === 'value') {
                const checkSelect = document.createElement('select');
                checkSelect.innerHTML = '<option value="">Any</option><option value="Number">Number</option><option value="String">String</option><option value="Boolean">Boolean</option>';
                checkSelect.value = input.check || '';
                checkSelect.addEventListener('change', () => {
                    this.visualState.inputs[i].check = checkSelect.value;
                });
                header.appendChild(checkSelect);
            }

            const actions = document.createElement('div');
            actions.className = 'vb-input-actions';
            actions.innerHTML = `
                <button title="Move up" data-action="up"><i class="fas fa-arrow-up"></i></button>
                <button title="Move down" data-action="down"><i class="fas fa-arrow-down"></i></button>
                <button title="Remove" class="danger" data-action="remove"><i class="fas fa-trash"></i></button>
            `;
            actions.querySelector('[data-action="up"]').addEventListener('click', () => this.moveVisualInput(i, -1));
            actions.querySelector('[data-action="down"]').addEventListener('click', () => this.moveVisualInput(i, 1));
            actions.querySelector('[data-action="remove"]').addEventListener('click', () => this.removeVisualInput(i));
            header.appendChild(actions);

            row.appendChild(header);

            // Fields
            const fieldsList = document.createElement('div');
            fieldsList.className = 'vb-fields-list';

            (input.fields || []).forEach((field, fi) => {
                const chip = document.createElement('span');
                chip.className = 'vb-field-chip';

                let chipText = '';
                if (field.type === 'label') chipText = `"${field.label}"`;
                else if (field.type === 'dropdown') chipText = `${field.name} [${(field.options || []).length} opts]`;
                else if (field.type === 'number') chipText = `${field.name} #`;
                else if (field.type === 'checkbox') chipText = `${field.name} ☑`;
                else if (field.type === 'textinput') chipText = `${field.name} ✎`;
                else if (field.type === 'variable') chipText = `${field.name} var`;

                chip.innerHTML = `<span class="chip-type">${field.type}</span> ${this.escapeHtml(chipText)} <span class="chip-remove" title="Remove field">&times;</span>`;
                chip.querySelector('.chip-remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeVisualField(i, fi);
                });
                fieldsList.appendChild(chip);
            });

            const addBtn = document.createElement('button');
            addBtn.className = 'vb-add-field-btn';
            addBtn.innerHTML = '<i class="fas fa-plus"></i> Field';
            addBtn.addEventListener('click', () => this.openAddFieldModal(i));
            fieldsList.appendChild(addBtn);

            row.appendChild(fieldsList);
            container.appendChild(row);
        });

        // Toggle output type visibility
        const blockType = document.getElementById('vb-block-type')?.value;
        document.getElementById('vb-output-type-wrap')?.classList.toggle('hidden', blockType !== 'value');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================================================================
    // VISUAL BUILDER - CODE GENERATION
    // =========================================================================

    generateFromVisual() {
        const state = this.getVisualState();
        if (!state.blockId) {
            this.showToast('Enter a Block ID', 'error');
            return;
        }

        const defCode = this.generateBlockDefFromVisual(state);
        const arduinoCode = this.generateArduinoFromVisual(state);
        const pythonCode = this.generatePythonFromVisual(state);
        const javaCode = this.generateJavaFromVisual(state);

        // Apply to code editors
        document.getElementById('editor-definition').value = defCode;
        document.getElementById('gen-arduino').value = arduinoCode;
        document.getElementById('gen-python').value = pythonCode;
        document.getElementById('gen-java').value = javaCode;

        // Update block object
        const block = this.getSelectedBlock();
        if (block) {
            block.defCode = defCode;
            block.gen.arduino.code = arduinoCode;
            block.gen.python.code = pythonCode;
            block.gen.java.code = javaCode;
        }

        // Switch to code mode and run preview
        this.switchEditorMode('code');
        this.runDefinition();
        this.showToast('Code generated from visual builder!', 'success');
    }

    generateBlockDefFromVisual(state) {
        const id = state.blockId;
        let lines = [];
        lines.push(`Blockly.Blocks['${id}'] = {`);
        lines.push('    init: function() {');

        for (const input of state.inputs) {
            let appendCall = '';
            if (input.type === 'dummy') {
                appendCall = '        this.appendDummyInput()';
            } else if (input.type === 'value') {
                appendCall = `        this.appendValueInput("${input.name || 'INPUT'}")`;
                if (input.check) appendCall = appendCall.replace(')', ')\n            .setCheck("' + input.check + '")');
            } else if (input.type === 'statement') {
                appendCall = `        this.appendStatementInput("${input.name || 'DO'}")`;
            }

            const fieldLines = [];
            for (const field of input.fields || []) {
                if (field.type === 'label') {
                    fieldLines.push(`            .appendField("${field.label}")`);
                } else if (field.type === 'dropdown') {
                    const opts = (field.options || []).map(o => `["${o[0]}", "${o[1]}"]`).join(', ');
                    fieldLines.push(`            .appendField(new Blockly.FieldDropdown([${opts}]), "${field.name}")`);
                } else if (field.type === 'number') {
                    fieldLines.push(`            .appendField(new Blockly.FieldNumber(${field.numDefault || 0}, ${field.numMin || 0}, ${field.numMax || 39}, 1), "${field.name}")`);
                } else if (field.type === 'checkbox') {
                    fieldLines.push(`            .appendField(new Blockly.FieldCheckbox("FALSE"), "${field.name}")`);
                } else if (field.type === 'textinput') {
                    fieldLines.push(`            .appendField(new Blockly.FieldTextInput("${field.label || ''}"), "${field.name}")`);
                } else if (field.type === 'variable') {
                    fieldLines.push(`            .appendField(new Blockly.FieldVariable("${field.label || 'item'}"), "${field.name}")`);
                }
            }

            if (fieldLines.length > 0) {
                lines.push(appendCall);
                lines.push(fieldLines.join('\n') + ';');
            } else {
                lines.push(appendCall + ';');
            }
        }

        if (state.inline !== 'auto') {
            lines.push(`        this.setInputsInline(${state.inline});`);
        }

        if (state.blockType === 'statement') {
            lines.push('        this.setPreviousStatement(true, null);');
            lines.push('        this.setNextStatement(true, null);');
        } else if (state.blockType === 'value') {
            const outType = state.outputType ? `"${state.outputType}"` : 'null';
            lines.push(`        this.setOutput(true, ${outType});`);
        }

        lines.push(`        this.setColour("${state.color}");`);
        lines.push(`        this.setTooltip("${state.tooltip.replace(/"/g, '\\"')}");`);
        lines.push('        this.setHelpUrl("");');
        lines.push('    }');
        lines.push('};');

        return lines.join('\n');
    }

    _collectFieldNames(state) {
        const fields = [];
        for (const input of state.inputs) {
            for (const field of input.fields || []) {
                if (field.type !== 'label' && field.name) {
                    fields.push({ name: field.name, type: field.type });
                }
            }
            if (input.type === 'value' && input.name) {
                fields.push({ name: input.name, type: 'valueInput' });
            }
            if (input.type === 'statement' && input.name) {
                fields.push({ name: input.name, type: 'statementInput' });
            }
        }
        return fields;
    }

    _applyTemplateWithFields(template, fields, lang) {
        if (!template.trim()) return '';
        let code = template;
        for (const f of fields) {
            const placeholder = `{${f.name}}`;
            if (f.type === 'valueInput') {
                const genName = lang === 'arduino' ? 'arduinoGenerator' : lang === 'python' ? 'pythonGenerator' : 'javaGenerator';
                code = code.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
                    `' + ${genName}.valueToCode(block, '${f.name}', ${genName}.ORDER_ATOMIC) + '`);
            } else {
                code = code.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
                    `' + ${f.name.toLowerCase()} + '`);
            }
        }
        return code;
    }

    generateArduinoFromVisual(state) {
        const id = state.blockId;
        const fields = this._collectFieldNames(state);
        const template = (document.getElementById('vb-arduino-template')?.value || '').trim();
        const isValue = state.blockType === 'value';

        let lines = [];
        lines.push(`arduinoGenerator.forBlock['${id}'] = function(block) {`);

        for (const f of fields) {
            if (f.type === 'valueInput') {
                lines.push(`    var ${f.name.toLowerCase()} = arduinoGenerator.valueToCode(block, '${f.name}', arduinoGenerator.ORDER_ATOMIC) || '0';`);
            } else if (f.type === 'statementInput') {
                lines.push(`    var ${f.name.toLowerCase()} = arduinoGenerator.statementToCode(block, '${f.name}');`);
            } else {
                lines.push(`    var ${f.name.toLowerCase()} = block.getFieldValue('${f.name}');`);
            }
        }

        if (template) {
            const processed = this._applyTemplateWithFields(template, fields, 'arduino');
            if (isValue) {
                lines.push(`    return ['${processed}', arduinoGenerator.ORDER_ATOMIC];`);
            } else {
                lines.push(`    return '  ${processed}\\n';`);
            }
        } else {
            if (isValue) {
                lines.push(`    return ['/* ${id} */', arduinoGenerator.ORDER_ATOMIC];`);
            } else {
                lines.push(`    return '  // ${id}\\n';`);
            }
        }

        lines.push('};');
        return lines.join('\n');
    }

    generatePythonFromVisual(state) {
        const id = state.blockId;
        const fields = this._collectFieldNames(state);
        const template = (document.getElementById('vb-python-template')?.value || '').trim();
        const isValue = state.blockType === 'value';

        let lines = [];
        lines.push(`pythonGenerator.forBlock['${id}'] = function(block) {`);
        lines.push(`    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';`);

        for (const f of fields) {
            if (f.type === 'valueInput') {
                lines.push(`    var ${f.name.toLowerCase()} = pythonGenerator.valueToCode(block, '${f.name}', pythonGenerator.ORDER_ATOMIC) || '0';`);
            } else if (f.type === 'statementInput') {
                lines.push(`    var ${f.name.toLowerCase()} = pythonGenerator.statementToCode(block, '${f.name}') || '    pass\\n';`);
            } else {
                lines.push(`    var ${f.name.toLowerCase()} = block.getFieldValue('${f.name}');`);
            }
        }

        if (template) {
            const processed = this._applyTemplateWithFields(template, fields, 'python');
            if (isValue) {
                lines.push(`    return ['${processed}', pythonGenerator.ORDER_ATOMIC];`);
            } else {
                lines.push(`    return '${processed}\\n';`);
            }
        } else {
            if (isValue) {
                lines.push(`    return ['# ${id}', pythonGenerator.ORDER_ATOMIC];`);
            } else {
                lines.push(`    return '# ${id}\\n';`);
            }
        }

        lines.push('};');
        return lines.join('\n');
    }

    generateJavaFromVisual(state) {
        const id = state.blockId;
        const fields = this._collectFieldNames(state);
        const template = (document.getElementById('vb-java-template')?.value || '').trim();
        const isValue = state.blockType === 'value';

        let lines = [];
        lines.push(`javaGenerator.forBlock['${id}'] = function(block) {`);

        for (const f of fields) {
            if (f.type === 'valueInput') {
                lines.push(`    var ${f.name.toLowerCase()} = javaGenerator.valueToCode(block, '${f.name}', javaGenerator.ORDER_ATOMIC) || '0';`);
            } else if (f.type === 'statementInput') {
                lines.push(`    var ${f.name.toLowerCase()} = javaGenerator.statementToCode(block, '${f.name}');`);
            } else {
                lines.push(`    var ${f.name.toLowerCase()} = block.getFieldValue('${f.name}');`);
            }
        }

        if (template) {
            const processed = this._applyTemplateWithFields(template, fields, 'java');
            if (isValue) {
                lines.push(`    return ['${processed}', javaGenerator.ORDER_ATOMIC];`);
            } else {
                lines.push(`    return '        ${processed}\\n';`);
            }
        } else {
            if (isValue) {
                lines.push(`    return ['/* ${id} */', javaGenerator.ORDER_ATOMIC];`);
            } else {
                lines.push(`    return '        // ${id}\\n';`);
            }
        }

        lines.push('};');
        return lines.join('\n');
    }

    // =========================================================================
    // AI PROMPT BUILDER
    // =========================================================================

    buildAIPrompt() {
        const description = (document.getElementById('ai-block-description')?.value || '').trim();
        const blockType = document.getElementById('ai-block-type')?.value || 'statement';
        const selectedBlockId = this.getSelectedBlock()?.id || '';
        const blockId = (document.getElementById('ai-block-id')?.value || '').trim() || selectedBlockId || 'my_custom_block';

        const typeDesc = blockType === 'statement'
            ? 'Statement block (connects above and below, performs an action)'
            : 'Value block (has output connector, returns a value)';

        const returnHint = blockType === 'statement'
            ? "Statement blocks: return a code string like '  digitalWrite(pin, state);\\n';"
            : "Value blocks: return an array like ['digitalRead(pin)', generatorName.ORDER_ATOMIC];";

        const prompt = `I need you to create a custom Blockly block for the EMMI BOT platform (ESP32-based).

**What the block should do:**
${description || '[DESCRIBE YOUR BLOCK HERE]'}

**Block ID:** ${blockId}
**Block Type:** ${typeDesc}

**Please generate ALL 4 code sections below. Each section should be complete, standalone JavaScript code:**

---

**1. BLOCK DEFINITION (Blockly.Blocks):**

\`\`\`javascript
Blockly.Blocks['${blockId}'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("label text")
            .appendField(new Blockly.FieldDropdown([["Option1", "VAL1"], ["Option2", "VAL2"]]), "FIELD_NAME");
        // Add more inputs/fields as needed:
        // this.appendValueInput("VALUE").setCheck("Number");
        // this.appendStatementInput("DO");
        ${blockType === 'statement' ? 'this.setPreviousStatement(true, null);\n        this.setNextStatement(true, null);' : 'this.setOutput(true, "Number"); // or "String", "Boolean", null'}
        this.setColour("#00838F");
        this.setTooltip("Description");
        this.setHelpUrl("");
    }
};
\`\`\`

---

**2. ARDUINO C++ GENERATOR:**

\`\`\`javascript
arduinoGenerator.forBlock['${blockId}'] = function(block) {
    var fieldName = block.getFieldValue('FIELD_NAME');
    // For value inputs: var value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ATOMIC) || '0';
    // For pin operations, add to setup:
    // arduinoGenerator.setupCode_.push('pinMode(' + pin + ', OUTPUT);');
    ${returnHint.replace('generatorName', 'arduinoGenerator')}
};
\`\`\`

---

**3. MICROPYTHON GENERATOR:**

\`\`\`javascript
pythonGenerator.forBlock['${blockId}'] = function(block) {
    pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';
    var fieldName = block.getFieldValue('FIELD_NAME');
    // For value inputs: var value = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_ATOMIC) || '0';
    ${returnHint.replace('generatorName', 'pythonGenerator')}
};
\`\`\`

---

**4. JAVA GENERATOR (pseudocode):**

\`\`\`javascript
javaGenerator.forBlock['${blockId}'] = function(block) {
    var fieldName = block.getFieldValue('FIELD_NAME');
    // For value inputs: var value = javaGenerator.valueToCode(block, 'VALUE', javaGenerator.ORDER_ATOMIC) || '0';
    ${returnHint.replace('generatorName', 'javaGenerator')}
};
\`\`\`

---

**IMPORTANT RULES:**
- Use THIS exact block ID everywhere: \`${blockId}\`
- Arduino: Add \`pinMode()\` to \`arduinoGenerator.setupCode_\` array for any pin I/O operations
- Python: Add imports to \`pythonGenerator.imports_\` object (e.g., \`pythonGenerator.imports_['machine'] = 'from machine import Pin, ADC, PWM';\`)
- Java: Use 8-space indentation for generated code lines (it's pseudocode for education)
- ${returnHint}
- Use \`block.getFieldValue('NAME')\` for dropdown, number, text, and checkbox fields
- Use \`xxxGenerator.valueToCode(block, 'NAME', xxxGenerator.ORDER_ATOMIC)\` for value inputs
- Use \`xxxGenerator.statementToCode(block, 'NAME')\` for statement inputs
- In generator sections, output ONLY the \`xxxGenerator.forBlock['${blockId}'] = function(block) { ... };\` function (no full \`void setup\`, \`while True\`, or \`public class\` wrappers)
- Do NOT include Command Script output; Block Creator generates that automatically

Please output all 4 code sections clearly labeled with javascript code blocks.`;

        return prompt;
    }

    async copyPromptToClipboard() {
        const prompt = this.buildAIPrompt();
        try {
            await navigator.clipboard.writeText(prompt);
            this.showToast('Prompt copied to clipboard!', 'success');
        } catch (err) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('Prompt copied to clipboard!', 'success');
        }
    }

    applyAIResponse() {
        const sections = this.getPromptCodeSections();
        let defCode = sections.definition.trim();
        let arduinoCode = sections.arduino.trim();
        let pythonCode = sections.python.trim();
        let javaCode = sections.java.trim();
        let commandCode = (document.getElementById('ai-response-command')?.value || '').trim();

        if (!defCode) {
            this.showToast('Paste block definition first', 'error');
            return;
        }

        const block = this.getSelectedBlock();
        if (!block) {
            this.showToast('Select a block first', 'error');
            return;
        }

        const detectedId = this.extractBlockType(defCode);
        if (detectedId && detectedId !== block.id) {
            defCode = this.normalizeDefinitionBlockId(defCode, block.id);
            arduinoCode = this.normalizeGeneratorBlockId(arduinoCode, block.id);
            pythonCode = this.normalizeGeneratorBlockId(pythonCode, block.id);
            javaCode = this.normalizeGeneratorBlockId(javaCode, block.id);
            // Normalize command code block ID too
            if (commandCode) {
                commandCode = commandCode.replace(
                    /(?:registry|emmiCommandGenerator\.forBlock)\[['"][^'"]+['"]\]/,
                    `registry['${block.id}']`
                );
            }
            this.logConsole(`Prompt block ID '${detectedId}' normalized to selected block ID '${block.id}'.`, 'warn');
        }

        // Apply to code editors
        document.getElementById('editor-definition').value = defCode;
        document.getElementById('gen-arduino').value = arduinoCode;
        document.getElementById('gen-python').value = pythonCode;
        document.getElementById('gen-java').value = javaCode;
        const commandEditor = document.getElementById('gen-command');
        if (commandEditor) commandEditor.value = commandCode;

        // Update block object
        block.defCode = defCode;
        block.gen.arduino.code = arduinoCode;
        block.gen.python.code = pythonCode;
        block.gen.java.code = javaCode;
        block.gen.command.code = commandCode;

        // Switch to code mode and run preview
        this.switchEditorMode('code');
        this.runDefinition();

        const missing = [];
        if (!arduinoCode) missing.push('Arduino');
        if (!pythonCode) missing.push('Python');
        if (!javaCode) missing.push('Java');

        if (missing.length > 0) {
            this.showToast(`Applied with missing sections: ${missing.join(', ')}`, 'warn');
        } else {
            this.showToast('Applied all pasted sections to editors', 'success');
        }
    }

    // =========================================================================
    // STATE MAPPING (No-Code Command Script)
    // =========================================================================

    /**
     * Extract all FieldDropdown fields from the live preview block.
     * Returns [ { name: 'PIN', options: [ ['Red','13'], ['Blue','14'] ] }, ... ]
     */
    extractDropdownFieldsFromPreviewBlock() {
        if (!this.previewWorkspace) return [];
        const topBlocks = this.previewWorkspace.getTopBlocks(true);
        if (!topBlocks || topBlocks.length === 0) return [];

        const block = topBlocks[0];
        const fields = [];

        for (const input of block.inputList || []) {
            for (const field of input.fieldRow || []) {
                if (field instanceof Blockly.FieldDropdown) {
                    const name = field.name;
                    if (!name) continue;
                    // getOptions returns [ [label, value], ... ]
                    const options = field.getOptions(true) || [];
                    fields.push({ name, options: options.map(o => [String(o[0]), String(o[1])]) });
                }
            }
        }

        return fields;
    }

    /**
     * Cartesian product of all dropdown options.
     * Returns [ { PIN: '13', STATE: 'HIGH', _labels: { PIN: 'Red', STATE: 'ON' } }, ... ]
     */
    generateStateCombinations(fields) {
        if (!fields || fields.length === 0) return [];

        let combos = [{ _labels: {} }];

        for (const field of fields) {
            const newCombos = [];
            for (const combo of combos) {
                for (const [label, value] of field.options) {
                    const newCombo = { ...combo, [field.name]: value, _labels: { ...combo._labels, [field.name]: label } };
                    newCombos.push(newCombo);
                }
            }
            combos = newCombos;
        }

        return combos;
    }

    /**
     * Parse existing command code to extract init token and per-state tokens.
     * Returns { initToken: 'E', stateMap: { 'PIN=13,STATE=HIGH': 'ERN', ... } } or null.
     */
    parseExistingCommandCodeForStates(code, fields) {
        if (!code || !code.trim()) return null;

        const result = { initToken: '', stateMap: {} };

        // Try to detect init token from addInitToken('X') or init: 'X'
        const initMatch = code.match(/addInitToken\s*\(\s*['"]([^'"]*)['"]\s*\)/) ||
            code.match(/init\s*:\s*['"]([^'"]*)['"]/);
        if (initMatch) result.initToken = initMatch[1];

        // Try to detect object-form: registry['id'] = { init: 'E', main: 'ERN' }
        const objMatch = code.match(/=\s*\{[^}]*main\s*:\s*['"]([^'"]*)['"]/);
        if (objMatch && fields.length === 0) {
            result.stateMap['__default__'] = objMatch[1];
            return result;
        }

        // For function-form, simulate execution with each state combination
        if (!this.previewWorkspace) return result;
        const topBlocks = this.previewWorkspace.getTopBlocks(true);
        if (!topBlocks || topBlocks.length === 0) return result;

        const previewBlock = topBlocks[0];
        const combos = this.generateStateCombinations(fields);

        // Save original field values
        const originals = {};
        for (const field of fields) {
            try {
                originals[field.name] = previewBlock.getFieldValue(field.name);
            } catch (_) { /* ignore */ }
        }

        // Re-register command code
        this.refreshRuntimeCommandRegistry();
        const registry = (window.emmiCommandGenerator || {}).forBlock || {};
        const block = this.getSelectedBlock();
        if (!block) return result;

        const handler = registry[block.id];
        if (!handler) return result;

        for (const combo of combos) {
            // Set field values on preview block
            for (const field of fields) {
                try {
                    previewBlock.setFieldValue(combo[field.name], field.name);
                } catch (_) { /* ignore */ }
            }

            // Execute the handler
            try {
                let tokens;
                if (typeof handler === 'function') {
                    const mockExporter = {
                        initTokens: [],
                        addInitToken(t) { this.initTokens.push(t); }
                    };
                    tokens = handler(previewBlock, mockExporter);
                    if (mockExporter.initTokens.length > 0 && !result.initToken) {
                        result.initToken = mockExporter.initTokens[0];
                    }
                } else if (typeof handler === 'object') {
                    tokens = handler.main ? [handler.main] : [];
                    if (handler.init && !result.initToken) result.initToken = handler.init;
                }

                if (Array.isArray(tokens) && tokens.length > 0) {
                    const key = fields.map(f => `${f.name}=${combo[f.name]}`).join(',');
                    result.stateMap[key] = tokens.join('|');
                }
            } catch (_) { /* ignore execution errors */ }
        }

        // Restore original field values
        for (const field of fields) {
            try {
                if (originals[field.name] !== undefined) {
                    previewBlock.setFieldValue(originals[field.name], field.name);
                }
            } catch (_) { /* ignore */ }
        }

        return result;
    }

    /**
     * Build the state mapping UI table dynamically.
     */
    buildStateMappingUI() {
        const container = document.getElementById('state-mapping-container');
        const initInput = document.getElementById('state-init-token');
        if (!container) return;

        const fields = this.extractDropdownFieldsFromPreviewBlock();

        if (fields.length === 0) {
            container.innerHTML = '<div class="state-mapping-no-fields"><i class="fas fa-exclamation-triangle"></i> No dropdown fields detected. Preview a block with dropdown fields first.</div>';
            if (initInput) initInput.value = '';
            return;
        }

        const block = this.getSelectedBlock();
        const existingCode = block?.gen?.command?.code || '';
        const parsed = this.parseExistingCommandCodeForStates(existingCode, fields);

        if (initInput && parsed) {
            initInput.value = parsed.initToken || '';
        }

        const combos = this.generateStateCombinations(fields);

        // Build table
        const headerCells = fields.map(f => `<th>${f.name}</th>`).join('');
        let rows = '';

        for (let i = 0; i < combos.length; i++) {
            const combo = combos[i];
            const key = fields.map(f => `${f.name}=${combo[f.name]}`).join(',');
            const existingToken = (parsed && parsed.stateMap[key]) || '';

            const fieldCells = fields.map(f => {
                const label = combo._labels[f.name] || combo[f.name];
                return `<td title="${f.name}=${combo[f.name]}">${label}</td>`;
            }).join('');

            rows += `<tr>
                ${fieldCells}
                <td><input type="text" class="state-mapping-input" 
                    data-combo-key="${key}" 
                    value="${existingToken}" 
                    placeholder="token" 
                    spellcheck="false" /></td>
            </tr>`;
        }

        container.innerHTML = `<table class="state-mapping-table">
            <thead><tr>${headerCells}<th>Command Token</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    /**
     * Generate command registry code from the state mapping UI and apply it
     * to the gen-command textarea.
     */
    applyStateMappingToCode() {
        const block = this.getSelectedBlock();
        if (!block) {
            this.showToast('No block selected', 'warn');
            return;
        }

        const fields = this.extractDropdownFieldsFromPreviewBlock();
        const initToken = (document.getElementById('state-init-token')?.value || '').trim();
        const inputs = document.querySelectorAll('#state-mapping-container .state-mapping-input');

        if (inputs.length === 0) {
            this.showToast('No state mappings to apply. Click Detect States first.', 'warn');
            return;
        }

        // Collect non-empty mappings
        const mappings = [];
        inputs.forEach(input => {
            const token = input.value.trim();
            if (!token) return;
            const key = input.dataset.comboKey;
            // Parse key back: "PIN=13,STATE=HIGH" -> { PIN: '13', STATE: 'HIGH' }
            const pairs = {};
            key.split(',').forEach(pair => {
                const [name, value] = pair.split('=');
                pairs[name] = value;
            });
            mappings.push({ pairs, token });
        });

        if (mappings.length === 0 && !initToken) {
            this.showToast('All command tokens are empty. Fill in at least one.', 'warn');
            return;
        }

        // Generate the code
        let code;
        if (fields.length === 0) {
            // Simple object form
            const parts = [];
            if (initToken) parts.push(`init: '${initToken}'`);
            if (mappings.length > 0) parts.push(`main: '${mappings[0].token}'`);
            code = `registry['${block.id}'] = { ${parts.join(', ')} };`;
        } else {
            // Function form with switch/if logic
            const lines = [];
            lines.push(`registry['${block.id}'] = function(block, exporter) {`);

            if (initToken) {
                lines.push(`    if (exporter && typeof exporter.addInitToken === 'function') {`);
                lines.push(`        exporter.addInitToken('${initToken}');`);
                lines.push(`    }`);
                lines.push('');
            }

            // Declare field value variables
            for (const field of fields) {
                lines.push(`    const ${field.name.toLowerCase()} = String(block.getFieldValue('${field.name}') || '');`);
            }
            lines.push('');

            // Build conditions
            if (fields.length === 1) {
                // Simple switch on single field
                const f = fields[0];
                const varName = f.name.toLowerCase();

                // Group mappings by this field's value
                const groups = {};
                for (const m of mappings) {
                    const val = m.pairs[f.name];
                    groups[val] = m.token;
                }

                if (Object.keys(groups).length > 0) {
                    // Use a lookup map for cleaner code
                    const mapEntries = Object.entries(groups).map(([val, tok]) => `'${val}': '${tok}'`).join(', ');
                    lines.push(`    const tokenMap = { ${mapEntries} };`);
                    lines.push(`    return [tokenMap[${varName}] || ''];`);
                } else {
                    lines.push(`    return [''];`);
                }
            } else {
                // Multi-field: use if/else chain
                let first = true;
                for (const m of mappings) {
                    const conditions = fields.map(f => {
                        const varName = f.name.toLowerCase();
                        return `${varName} === '${m.pairs[f.name]}'`;
                    }).join(' && ');

                    const prefix = first ? 'if' : '} else if';
                    lines.push(`    ${prefix} (${conditions}) {`);
                    lines.push(`        return ['${m.token}'];`);
                    first = false;
                }

                if (mappings.length > 0) {
                    lines.push(`    }`);
                }

                lines.push('');
                lines.push(`    return [''];`);
            }

            lines.push('};');
            code = lines.join('\n');
        }

        // Apply to the gen-command textarea
        const commandEditor = document.getElementById('gen-command');
        if (commandEditor) commandEditor.value = code;

        // Update block data and refresh
        block.gen.command.code = code;
        this.refreshRuntimeCommandRegistry();
        this.refreshCommandScriptFromPreview();

        this.showToast('Command code generated from state mapping', 'success');
    }

    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db', warn: '#f39c12' };
        toast.style.background = colors[type] || colors.info;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.style.opacity = '1');
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BlockCreatorApp();
});
