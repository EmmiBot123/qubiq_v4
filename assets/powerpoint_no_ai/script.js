/**
 * PowerPoint Clone logic - High Fidelity Content Placeholders & UI
 */

class PowerPointApp {
  constructor() {
    this.slides = [];
    this.currentSlideIndex = 0;
    this.selectedElement = null;
    this.clipboard = null;

    // --- New tab state ---
    this.undoStack = [];
    this.redoStack = [];
    this.elementCounter = 0; // For unique IDs
    this.drawMode = false;
    this.drawColor = '#000000';
    this.drawSize = 3;
    this.currentTool = 'pointer';
    this.slideTransitions = {};
    this.slideAnimations = {};
    this.sections = []; // Array of section objects: { id, name, slideIds, collapsed }
    this.autosaveEnabled = localStorage.getItem('ppt_autosave_enabled') === 'true';
    this.recentFiles = JSON.parse(localStorage.getItem('ppt_recent_files') || '[]');
    this.activeBsTab = 'recent';

    this.initElements();
    if (!this.loadFromAutosave()) {
      this.addDefaultSlides();
    }
    if (this.slides.length > 0) {
      // Create a default section initially when no sections exist yet but slides do
      // This is a UI convention but we'll leave it empty initially until user adds a section
    }
    this.render();
    this.setupInsertTab();
    this.setupDrawTab();
    this.setupDesignTab();
    this.setupTransitionsTab();
    this.setupAnimationsTab();
    this.setupSlideshowTab();
    this.setupViewTab();
    this.setupEditingGroup();
    this.setupWindowControls();
  }

  initElements() {
    this.slideList = document.getElementById('slide-list');
    this.canvas = document.getElementById('canvas');
    this.tabs = document.querySelectorAll('.tab-btn');

    this.qaUndoBtn = document.getElementById('qa-undo-btn');
    this.qaRedoBtn = document.getElementById('qa-redo-btn');
    this.qaSaveBtn = document.getElementById('qa-save-btn');
    this.qaAutosaveBtn = document.getElementById('qa-autosave-btn');
    this.qaSlideshowBtn = document.getElementById('qa-slideshow-btn');
    this.drawUndoBtn = document.getElementById('draw-undo-btn');
    this.drawRedoBtn = document.getElementById('draw-redo-btn');

    this.pasteBtn = document.getElementById('paste-btn');
    this.pasteArrowBtn = document.getElementById('paste-arrow-btn');
    this.pasteDropdown = document.getElementById('paste-dropdown');
    this.pasteKeepSourceBtn = document.getElementById('paste-keep-source');
    this.pasteUseDestBtn = document.getElementById('paste-use-destination');
    this.pasteSpecialBtn = document.getElementById('paste-special-btn');
    this.cutBtn = document.getElementById('cut-btn');
    this.copyBtn = document.getElementById('copy-btn');
    this.formatPainterBtn = document.getElementById('format-painter-btn');
    this.formatPainterActive = false;
    this.formatPainterStyles = null;

    this.newSlideBtn = document.getElementById('new-slide-btn');

    this.newSlideDefault = document.getElementById('new-slide-default');
    this.newSlideArrow = document.getElementById('new-slide-arrow');
    this.layoutDropdown = document.getElementById('layout-dropdown');
    this.layoutOptions = document.querySelectorAll('.layout-option');
    this.layoutChangeBtn = document.getElementById('layout-change-btn');
    this.layoutChangeDropdown = document.getElementById('layout-change-dropdown');
    this.layoutChangeOptions = document.querySelectorAll('.layout-change-option');
    this.resetSlideBtn = document.getElementById('reset-slide-btn');

    this.sectionBtn = document.getElementById('section-btn');
    this.sectionDropdown = document.getElementById('section-dropdown');

    // Section actions
    this.btnAddSection = document.getElementById('btn-add-section');
    this.btnRenameSection = document.getElementById('btn-rename-section');
    this.btnRemoveSection = document.getElementById('btn-remove-section');
    this.btnRemoveAllSections = document.getElementById('btn-remove-all-sections');
    this.btnCollapseAllSections = document.getElementById('btn-collapse-all-sections');
    this.btnExpandAllSections = document.getElementById('btn-expand-all-sections');

    this.boldBtn = document.getElementById('bold-btn');
    this.italicBtn = document.getElementById('italic-btn');
    this.underlineBtn = document.getElementById('underline-btn');
    this.strikethroughBtn = document.getElementById('strikethrough-btn');
    this.shadowBtn = document.getElementById('shadow-btn');
    this.growFontBtn = document.getElementById('grow-font-btn');
    this.shrinkFontBtn = document.getElementById('shrink-font-btn');
    this.clearFormattingBtn = document.getElementById('clear-formatting-btn');
    this.changeCaseBtn = document.getElementById('change-case-btn');
    this.spacingBtn = document.getElementById('spacing-btn');
    this.fontColorBtn = document.getElementById('font-color-btn');
    this.fontColorArrowBtn = document.getElementById('font-color-arrow-btn');
    this.fontColorDropdown = document.getElementById('font-color-dropdown');
    this.fontColorBar = document.getElementById('font-color-bar');
    this.fontColorNoneBtn = document.getElementById('font-color-none-btn');
    this.fontColorCustomInput = document.getElementById('font-color-custom');
    this.fontColorSwatches = document.querySelectorAll('#font-color-theme-grid .color-swatch, #font-color-standard-grid .color-swatch');
    this.lastFontColor = '#c43e1c'; // default red
    this.highlightColorBtn = document.getElementById('highlight-color-btn');
    this.highlightArrowBtn = document.getElementById('highlight-arrow-btn');
    this.highlightDropdown = document.getElementById('highlight-dropdown');
    this.highlightColorBar = document.getElementById('highlight-color-bar');
    this.highlightNoneBtn = document.getElementById('highlight-none-btn');
    this.highlightSwatches = document.querySelectorAll('#highlight-grid .color-swatch');
    this.lastHighlightColor = '#ffff00'; // default yellow

    this.bulletBtn = document.getElementById('bullet-btn');
    this.numberBtn = document.getElementById('number-btn');
    this.outdentBtn = document.getElementById('outdent-btn');
    this.indentBtn = document.getElementById('indent-btn');
    this.justifyBtn = document.getElementById('justify-btn');
    this.alignLeftBtn = document.getElementById('align-left-btn');
    this.alignCenterBtn = document.getElementById('align-center-btn');
    this.alignRightBtn = document.getElementById('align-right-btn');
    this.alignJustifyBtn = document.getElementById('align-justify-btn');
    this.lineSpacingBtn = document.getElementById('line-spacing-btn');
    this.spacingDropdown = document.getElementById('spacing-dropdown');
    this.spacingOptions = document.querySelectorAll('.spacing-option');
    this.columnsBtn = document.getElementById('columns-btn');
    this.textDirectionBtn = document.getElementById('text-direction-btn');
    this.alignTextVBtn = document.getElementById('align-text-v-btn');
    this.smartArtBtn = document.getElementById('smartart-btn');

    this.fontSelect = document.querySelector('.font-select');
    this.sizeSelect = document.querySelector('.size-select');
    this.sizeDropdownBtn = document.getElementById('size-dropdown-btn');
    this.sizeDropdown = document.getElementById('size-dropdown');
    this.sizeOptions = document.querySelectorAll('.combo-option');

    // Mini Toolbar
    this.miniToolbar = document.getElementById('mini-toolbar');
    this.miniFontSize = document.getElementById('mini-font-size');
    this.miniToolBtns = document.querySelectorAll('.mini-tool-btn');

    // Editing Group Elements
    this.findBtn = document.getElementById('editing-find-btn');
    this.replaceBtn = document.getElementById('editing-replace-btn');
    this.selectBtn = document.getElementById('editing-select-btn');
    this.selectDropdown = document.getElementById('select-dropdown');
    this.selectAllBtn = document.getElementById('select-all-btn');
    this.selectObjectsBtn = document.getElementById('select-objects-btn');
    this.toggleSelectionPaneBtn = document.getElementById('toggle-selection-pane-btn');

    // Find/Replace Dialogs
    this.findDialog = document.getElementById('find-dialog');
    this.replaceDialog = document.getElementById('replace-dialog');
    this.findWhatInput = document.getElementById('find-what');
    this.replaceFindWhatInput = document.getElementById('replace-find-what');
    this.replaceWithInput = document.getElementById('replace-with');

    // Selection Pane
    this.selectionPane = document.getElementById('selection-pane');
    this.selectionList = document.getElementById('selection-list');
    this.closeSelectionPaneBtn = document.getElementById('close-selection-pane-btn');

    this.setupEvents();
  }

  setupEvents() {
    // Quick access bar (Prevent focus loss for text editing)
    const qsBar = document.querySelector('.quick-access');
    if (qsBar) {
      qsBar.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          e.preventDefault();
        }
      });
    }

    this.tabs.forEach(tab => {
      tab.onclick = (e) => {
        this.tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const panelName = e.currentTarget.getAttribute('data-tab');
        document.querySelectorAll('.ribbon-panel').forEach(p => {
          p.style.display = p.getAttribute('data-panel') === panelName ? 'flex' : 'none';
        });
        if (window.lucide) window.lucide.createIcons();
      };
    });

    if (this.pasteBtn) this.pasteBtn.onclick = (e) => { e.stopPropagation(); this.closePasteDropdown(); this.handlePaste('keep'); };
    if (this.pasteArrowBtn) this.pasteArrowBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = this.pasteDropdown && this.pasteDropdown.classList.contains('show');
      this.closePasteDropdown();
      if (!isOpen && this.pasteDropdown) this.pasteDropdown.classList.add('show');
    };
    if (this.pasteKeepSourceBtn) this.pasteKeepSourceBtn.onclick = (e) => { e.stopPropagation(); this.closePasteDropdown(); this.handlePaste('keep'); };
    if (this.pasteUseDestBtn) this.pasteUseDestBtn.onclick = (e) => { e.stopPropagation(); this.closePasteDropdown(); this.handlePaste('destination'); };
    if (this.pasteSpecialBtn) this.pasteSpecialBtn.onclick = (e) => { e.stopPropagation(); this.closePasteDropdown(); this.showPasteSpecialDialog(); };
    if (this.cutBtn) this.cutBtn.onclick = () => this.handleCut();
    if (this.copyBtn) this.copyBtn.onclick = () => this.handleCopy();
    if (this.formatPainterBtn) this.formatPainterBtn.onclick = () => this.toggleFormatPainter();

    if (this.qaUndoBtn) this.qaUndoBtn.onclick = () => this.undo();
    if (this.qaRedoBtn) this.qaRedoBtn.onclick = () => this.redo();
    if (this.qaSaveBtn) this.qaSaveBtn.onclick = () => this.saveToFile();
    if (this.qaAutosaveBtn) {
      this.qaAutosaveBtn.onclick = () => this.toggleAutosave();
      this.updateAutosaveUI();
    }
    if (this.qaSlideshowBtn) this.qaSlideshowBtn.onclick = () => this.startSlideshow(0);
    if (this.drawUndoBtn) this.drawUndoBtn.onclick = () => this.undo();
    if (this.drawRedoBtn) this.drawRedoBtn.onclick = () => this.redo();

    document.addEventListener('keydown', (e) => {
      if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedElement) {
          this.deleteSelectedElement();
        } else {
          this.deleteCurrentSlide();
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (e.shiftKey) {
          this.startSlideshow(this.currentSlideIndex);
        } else {
          this.startSlideshow(0);
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          this.redo();
        } else if (e.key === 'c' || e.key === 'C') {
          this.handleCopy();
        } else if (e.key === 'x' || e.key === 'X') {
          this.handleCut();
        } else if (e.key === 'v' || e.key === 'V') {
          this.handlePaste();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          this.saveToFile();
        }
      }
    });

    if (this.newSlideDefault) this.newSlideDefault.onclick = () => this.addSlide('content');





    // Toggle Dropdown
    if (this.newSlideArrow) {
      this.newSlideArrow.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.layoutDropdown.classList.contains('show');
        document.querySelectorAll('.dropdown-options, .layout-dropdown').forEach(d => d.classList.remove('show'));
        if (!isOpen) this.layoutDropdown.classList.add('show');
      };
    }

    if (this.layoutChangeBtn) {
      this.layoutChangeBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.layoutChangeDropdown && this.layoutChangeDropdown.classList.contains('show');
        document.querySelectorAll('.dropdown-options, .layout-dropdown, .section-dropdown').forEach(d => d.classList.remove('show'));
        if (!isOpen && this.layoutChangeDropdown) {
          this.layoutChangeDropdown.classList.add('show');
        }
      };
    }

    if (this.sectionBtn) {
      this.sectionBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.sectionDropdown && this.sectionDropdown.classList.contains('show');
        document.querySelectorAll('.dropdown-options, .layout-dropdown, .section-dropdown').forEach(d => d.classList.remove('show'));
        if (!isOpen && this.sectionDropdown) {
          this.updateSectionDropdownState();
          this.sectionDropdown.classList.add('show');
        }
      };
    }

    if (this.btnAddSection) this.btnAddSection.onclick = () => { if (!this.btnAddSection.classList.contains('disabled')) this.addSection(); };
    if (this.btnRenameSection) this.btnRenameSection.onclick = () => { if (!this.btnRenameSection.classList.contains('disabled')) this.renameSection(); };
    if (this.btnRemoveSection) this.btnRemoveSection.onclick = () => { if (!this.btnRemoveSection.classList.contains('disabled')) this.removeSection(); };
    if (this.btnRemoveAllSections) this.btnRemoveAllSections.onclick = () => { if (!this.btnRemoveAllSections.classList.contains('disabled')) this.removeAllSections(); };
    if (this.btnCollapseAllSections) this.btnCollapseAllSections.onclick = () => { if (!this.btnCollapseAllSections.classList.contains('disabled')) this.collapseAllSections(true); };
    if (this.btnExpandAllSections) this.btnExpandAllSections.onclick = () => { if (!this.btnExpandAllSections.classList.contains('disabled')) this.collapseAllSections(false); };

    // Layout Options
    this.layoutOptions.forEach(opt => {
      opt.onmousedown = (e) => {
        e.preventDefault(); // Keep focus
        const layout = opt.getAttribute('data-layout');
        this.addSlide(layout);
        this.layoutDropdown.classList.remove('show');
      };
    });

    if (this.layoutChangeOptions) {
      this.layoutChangeOptions.forEach(opt => {
        opt.onmousedown = (e) => {
          e.preventDefault(); // Keep focus
          const layout = opt.getAttribute('data-layout');
          this.changeSlideLayout(layout);
          if (this.layoutChangeDropdown) this.layoutChangeDropdown.classList.remove('show');
        };
      });
    }

    if (this.resetSlideBtn) this.resetSlideBtn.onclick = () => this.resetCurrentSlide();

    if (this.boldBtn) this.boldBtn.onclick = () => this.toggleSimpleStyle('fontWeight', 'bold', 'normal');
    if (this.italicBtn) this.italicBtn.onclick = () => this.toggleSimpleStyle('fontStyle', 'italic', 'normal');
    if (this.underlineBtn) this.underlineBtn.onclick = () => this.toggleSimpleStyle('textDecoration', 'underline', 'none');
    if (this.strikethroughBtn) this.strikethroughBtn.onclick = () => this.toggleSimpleStyle('textDecoration', 'line-through', 'none');

    if (this.shadowBtn) this.shadowBtn.onclick = () => this.toggleShadow();
    if (this.growFontBtn) this.growFontBtn.onclick = () => this.changeFontSize(1.2);
    if (this.shrinkFontBtn) this.shrinkFontBtn.onclick = () => this.changeFontSize(0.8);
    if (this.clearFormattingBtn) this.clearFormattingBtn.onclick = () => this.clearFormatting();
    // Change Case Dropdown
    const changeCaseBtn = document.getElementById('change-case-btn');
    const changeCaseDropdown = document.getElementById('change-case-dropdown');
    if (changeCaseBtn && changeCaseDropdown) {
      changeCaseBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = changeCaseDropdown.classList.contains('show');
        document.querySelectorAll('.layout-dropdown, .dropdown-options, .color-picker-dropdown').forEach(d => d.classList.remove('show'));
        if (!isOpen) changeCaseDropdown.classList.add('show');
      };
      changeCaseDropdown.querySelectorAll('.case-option').forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          const mode = opt.getAttribute('data-case');
          changeCaseDropdown.classList.remove('show');
          this.applyCase(mode);
        };
      });
    }

    // Change Case Dropdown (Paragraph group)
    const changeCaseParaBtn = document.getElementById('change-case-para-btn');
    const changeCaseParaDropdown = document.getElementById('change-case-para-dropdown');
    if (changeCaseParaBtn && changeCaseParaDropdown) {
      changeCaseParaBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = changeCaseParaDropdown.classList.contains('show');
        document.querySelectorAll('.layout-dropdown, .dropdown-options, .color-picker-dropdown').forEach(d => d.classList.remove('show'));
        if (!isOpen) changeCaseParaDropdown.classList.add('show');
      };
      changeCaseParaDropdown.querySelectorAll('.case-option').forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          const mode = opt.getAttribute('data-case');
          changeCaseParaDropdown.classList.remove('show');
          this.applyCase(mode);
        };
      });
    }
    if (this.spacingBtn) this.spacingBtn.onclick = () => this.toggleSpacing();

    if (this.fontSelect) {
      this.fontSelect.onchange = (e) => this.applyStyle('fontFamily', e.target.value);
    }
    if (this.sizeSelect) {
      this.sizeSelect.onchange = (e) => this.applyStyle('fontSize', e.target.value + 'pt');
      this.sizeSelect.onkeydown = (e) => {
        if (e.key === 'Enter') {
          this.applyStyle('fontSize', e.target.value + 'pt');
          this.sizeSelect.blur();
        }
      };
    }

    if (this.sizeDropdownBtn && this.sizeDropdown) {
      this.sizeDropdownBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.sizeDropdown.classList.contains('show');
        document.querySelectorAll('.layout-dropdown, .dropdown-options, .section-dropdown, .combo-dropdown').forEach(d => d.classList.remove('show'));
        if (!isOpen) {
          this.sizeDropdown.classList.add('show');
          // Highlight current
          this.sizeOptions.forEach(opt => opt.classList.remove('selected'));
          const currentSize = this.sizeSelect.value;
          const currentOpt = Array.from(this.sizeOptions).find(o => o.innerText === currentSize);
          if (currentOpt) {
            currentOpt.classList.add('selected');
            // scroll into view
            this.sizeDropdown.scrollTop = currentOpt.offsetTop - 50;
          }
        }
      };
    }

    if (this.sizeOptions) {
      this.sizeOptions.forEach(opt => {
        opt.onmousedown = (e) => {
          e.preventDefault(); // keep focus
          const size = opt.innerText;
          this.sizeSelect.value = size;
          this.applyStyle('fontSize', size + 'pt');
          this.sizeDropdown.classList.remove('show');
        };
      });
    }

    // Font color main button: re-applies last used color
    if (this.fontColorBtn) {
      this.fontColorBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.lastFontColor) this.applyFontColor(this.lastFontColor);
      };
    }

    // Font color arrow: opens dropdown
    if (this.fontColorArrowBtn && this.fontColorDropdown) {
      this.fontColorArrowBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.fontColorDropdown.classList.contains('show');
        document.querySelectorAll('.color-picker-dropdown, .combo-dropdown, .dropdown-options').forEach(d => d.classList.remove('show'));
        if (!isOpen) this.fontColorDropdown.classList.add('show');
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Font color swatches
    if (this.fontColorSwatches) {
      this.fontColorSwatches.forEach(swatch => {
        swatch.onmousedown = (e) => {
          e.preventDefault();
          const color = swatch.getAttribute('data-color');
          this.lastFontColor = color;
          if (this.fontColorBar) this.fontColorBar.style.background = color;
          this.applyFontColor(color);
          this.fontColorDropdown.classList.remove('show');
        };
      });
    }

    // No color
    if (this.fontColorNoneBtn) {
      this.fontColorNoneBtn.onmousedown = (e) => {
        e.preventDefault();
        this.applyFontColor('#000000');
        if (this.fontColorBar) this.fontColorBar.style.background = '#000000';
        this.fontColorDropdown.classList.remove('show');
      };
    }

    // More Colors (native color input)
    if (this.fontColorCustomInput) {
      this.fontColorCustomInput.oninput = (e) => {
        const color = e.target.value;
        this.lastFontColor = color;
        if (this.fontColorBar) this.fontColorBar.style.background = color;
        this.applyFontColor(color);
        this.fontColorDropdown.classList.remove('show');
      };
    }
    // Highlight main button: re-applies last-used color
    if (this.highlightColorBtn) {
      this.highlightColorBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.lastHighlightColor) {
          this.applyHighlight(this.lastHighlightColor);
        }
      };
    }

    // Highlight arrow: opens color picker
    if (this.highlightArrowBtn && this.highlightDropdown) {
      this.highlightArrowBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.highlightDropdown.classList.contains('show');
        document.querySelectorAll('.color-picker-dropdown, .combo-dropdown, .dropdown-options').forEach(d => d.classList.remove('show'));
        if (!isOpen) this.highlightDropdown.classList.add('show');
        if (window.lucide) window.lucide.createIcons();
      };
    }

    // Color swatches
    if (this.highlightSwatches) {
      this.highlightSwatches.forEach(swatch => {
        swatch.onmousedown = (e) => {
          e.preventDefault();
          const color = swatch.getAttribute('data-color');
          this.lastHighlightColor = color;
          if (this.highlightColorBar) this.highlightColorBar.style.background = color;
          this.applyHighlight(color);
          this.highlightDropdown.classList.remove('show');
        };
      });
    }

    // No color button
    if (this.highlightNoneBtn) {
      this.highlightNoneBtn.onmousedown = (e) => {
        e.preventDefault();
        this.applyHighlight('transparent');
        this.highlightDropdown.classList.remove('show');
      };
    }

    if (this.bulletBtn) this.bulletBtn.onclick = () => this.execCommand('insertUnorderedList');
    if (this.numberBtn) this.numberBtn.onclick = () => this.execCommand('insertOrderedList');
    if (this.outdentBtn) this.outdentBtn.onclick = () => this.execCommand('outdent');
    if (this.indentBtn) this.indentBtn.onclick = () => this.execCommand('indent');

    if (this.justifyBtn || this.alignJustifyBtn) {
      const jBtn = this.justifyBtn || this.alignJustifyBtn;
      jBtn.onclick = () => this.applyStyle('textAlign', 'justify');
    }
    if (this.changeCaseParaBtn) this.changeCaseParaBtn.onclick = () => this.cycleCase();

    if (this.alignLeftBtn) this.alignLeftBtn.onclick = () => this.applyStyle('textAlign', 'left');
    if (this.alignCenterBtn) this.alignCenterBtn.onclick = () => this.applyStyle('textAlign', 'center');
    if (this.alignRightBtn) this.alignRightBtn.onclick = () => this.applyStyle('textAlign', 'right');

    if (this.lineSpacingBtn) {
      this.lineSpacingBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.spacingDropdown.classList.contains('show');
        document.querySelectorAll('.layout-dropdown, .dropdown-options').forEach(d => d.classList.remove('show'));
        if (!isOpen) this.spacingDropdown.classList.add('show');
      };
    }

    if (this.spacingOptions) {
      this.spacingOptions.forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          if (opt.classList.contains('link-option')) {
            this.spacingDropdown.classList.remove('show');
            this.showLineSpacingOptionsDialog();
            return;
          }
          const lh = opt.getAttribute('data-line-height');
          if (this.selectedElement) {
            this.saveState();
            this.selectedElement.style.lineHeight = lh;
            this.syncDataWithSelection();
            this.syncRibbonToSelection();
          }
          this.spacingOptions.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          this.spacingDropdown.classList.remove('show');
        };
      });
    }

    if (this.columnsBtn) this.columnsBtn.onclick = () => this.cycleColumns();

    // Combined Align Text + Text Direction Dropdown
    const alignTextVBtn = document.getElementById('align-text-v-btn');
    const alignTextVDropdown = document.getElementById('align-text-v-dropdown');
    if (alignTextVBtn && alignTextVDropdown) {
      alignTextVBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = alignTextVDropdown.classList.contains('show');
        document.querySelectorAll('.layout-dropdown, .dropdown-options, .color-picker-dropdown').forEach(d => d.classList.remove('show'));
        if (!isOpen) {
          alignTextVDropdown.classList.add('show');
          if (window.lucide) window.lucide.createIcons();
        }
      };

      // Vertical alignment options
      alignTextVDropdown.querySelectorAll('[data-valign]').forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          const va = opt.getAttribute('data-valign');
          alignTextVDropdown.querySelectorAll('[data-valign]').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          alignTextVDropdown.classList.remove('show');
          if (this.selectedElement) {
            this.saveState();
            this.selectedElement.setAttribute('data-valign', va);
            this.syncDataWithSelection();
          }
        };
      });

      // Text Direction options
      alignTextVDropdown.querySelectorAll('[data-dir]').forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          const dir = opt.getAttribute('data-dir');
          alignTextVDropdown.querySelectorAll('[data-dir]').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          alignTextVDropdown.classList.remove('show');
          this.applyTextDirection(dir);
        };
      });

      // More Options link
      const tdMoreOptions = document.getElementById('td-more-options');
      if (tdMoreOptions) {
        tdMoreOptions.onclick = (e) => {
          e.stopPropagation();
          alignTextVDropdown.classList.remove('show');
          this.showTextDirectionOptionsDialog();
        };
      }
    }
    if (this.smartArtBtn) this.smartArtBtn.onclick = () => alert('Convert to SmartArt is a premium feature!');



    const shapesMoreBtn = document.getElementById('shapes-more-btn');
    const shapesDropdown = document.getElementById('shapes-dropdown');
    if (shapesMoreBtn && shapesDropdown) {
      shapesMoreBtn.onclick = (e) => {
        e.stopPropagation();
        shapesDropdown.classList.toggle('show');
        if (shapesDropdown.classList.contains('show')) {
          // Re-initialize icons in the dropdown
          if (window.lucide) window.lucide.createIcons();
        }
      };
    }

    // Close shapes dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (shapesDropdown && !shapesDropdown.contains(e.target) && e.target !== shapesMoreBtn) {
        shapesDropdown.classList.remove('show');
      }
    });

    const shapesContainer = document.querySelector('.shapes-container');
    const registerShapeClick = (container) => {
      if (!container) return;
      container.addEventListener('click', (e) => {
        const shapeItem = e.target.closest('[data-lucide]');
        if (shapeItem) {
          e.stopPropagation();
          const shapeType = shapeItem.getAttribute('data-shape') || shapeItem.getAttribute('data-lucide');
          if (shapeType === 'type') this.addText();
          else if (shapeType) {
            this.addShape(shapeType);
            if (shapesDropdown) shapesDropdown.classList.remove('show');
          }
        }
      });
    };

    registerShapeClick(shapesContainer);
    registerShapeClick(shapesDropdown);

    // --- Shape gallery up/down row scrolling ---
    const ROW_HEIGHT = 21; // 20px cell + 1px gap
    let shapesRowOffset = 0;
    const getMaxRows = () => {
      const c = document.getElementById('shapes-container');
      if (!c) return 1;
      return Math.ceil(c.querySelectorAll('.mini-shape').length / 10);
    };

    const galleryControls = document.querySelector('.gallery-controls');
    if (galleryControls) {
      const [upBtn, downBtn] = galleryControls.querySelectorAll('.tiny-icon');
      if (upBtn) upBtn.onclick = () => {
        if (shapesRowOffset > 0) {
          shapesRowOffset--;
          const c = document.getElementById('shapes-container');
          if (c) c.style.transform = `translateY(-${shapesRowOffset * ROW_HEIGHT}px)`;
        }
      };
      if (downBtn) downBtn.onclick = () => {
        if (shapesRowOffset < getMaxRows() - 3) {
          shapesRowOffset++;
          const c = document.getElementById('shapes-container');
          if (c) c.style.transform = `translateY(-${shapesRowOffset * ROW_HEIGHT}px)`;
        }
      };
    }

    this.canvas.onclick = (e) => {
      if (e.target === this.canvas) this.deselectElement();
    };

    // Prevent focus loss when clicking ANY ribbon button/div (including div-based split buttons)
    const ribbonContent = document.querySelector('.ribbon-content');
    if (ribbonContent) {
      ribbonContent.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          e.preventDefault();
        }
      });
    }

    // Close Dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-container')) {
        if (this.layoutDropdown) this.layoutDropdown.classList.remove('show');
        if (this.layoutChangeDropdown) this.layoutChangeDropdown.classList.remove('show');
        if (this.sectionDropdown) this.sectionDropdown.classList.remove('show');
        if (this.spacingDropdown) this.spacingDropdown.classList.remove('show');

        // Hide global action dropdowns
        const globalRecordDropdown = document.getElementById('global-record-dropdown');
        const globalShareDropdown = document.getElementById('global-share-dropdown');
        if (globalRecordDropdown) globalRecordDropdown.classList.remove('show');
        if (globalShareDropdown) globalShareDropdown.classList.remove('show');

        this.closePasteDropdown();
      }
      if (!e.target.closest('.combo-box-container')) {
        if (this.sizeDropdown) this.sizeDropdown.classList.remove('show');
      }
      if (!e.target.closest('#highlight-container')) {
        if (this.highlightDropdown) this.highlightDropdown.classList.remove('show');
      }
    });

    // Selection Change Logic for Mini-Toolbar
    document.addEventListener('selectionchange', () => this.handleTextSelection());

    // Mini Toolbar Buttons
    if (this.miniToolBtns) {
      this.miniToolBtns.forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const cmd = btn.getAttribute('data-command');
          if (cmd) {
            document.execCommand(cmd, false, null);
            this.syncDataWithSelection();
            this.syncMiniToolbarActiveState();
          }
        };
      });
    }

    if (this.miniFontSize) {
      this.miniFontSize.onchange = (e) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed && this.selectedElement.contains(selection.anchorNode)) {
          // Robust font size application for selection
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('fontSize', false, '7'); // Max size as a base

          // Since execCommand fontSize 1-7 is limited, we fix the resulting tag
          const spans = this.selectedElement.querySelectorAll('font[size="7"]');
          spans.forEach(s => {
            s.removeAttribute('size');
            s.style.fontSize = e.target.value + 'pt';
            // Change font tag to span
            const span = document.createElement('span');
            span.style.fontSize = e.target.value + 'pt';
            span.innerHTML = s.innerHTML;
            s.parentNode.replaceChild(span, s);
          });
        } else {
          this.applyStyle('fontSize', e.target.value + 'pt');
        }
        this.syncDataWithSelection();
      };
    }

  }

  addDefaultSlides() {
    this.updateUndoRedoButtons();
    // Reference shows Slide 2 active with a bulleted content placeholder
    this.addSlide(); // Slide 1
    this.addSlide('content'); // Slide 2
    this.currentSlideIndex = 1;

    // Clear the stack so default slides are the baseline
    this.undoStack = [];
    this.redoStack = [];
    this.updateUndoRedoButtons();
  }

  saveState() {
    const state = {
      slides: JSON.parse(JSON.stringify(this.slides)),
      currentSlideIndex: this.currentSlideIndex,
      sections: JSON.parse(JSON.stringify(this.sections))
    };

    if (this.undoStack.length > 0) {
      const topState = this.undoStack[this.undoStack.length - 1];
      if (JSON.stringify(topState) === JSON.stringify(state)) {
        return; // Skip saving identical state
      }
    }

    this.undoStack.push(state);
    // Limit history stack size if needed, e.g., to 50
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    if (this.autosaveEnabled) {
      this.performAutosave();
    }
    this.updateUndoRedoButtons();
  }

  saveToFile() {
    if (typeof PptxGenJS === 'undefined') {
      alert('PptxGenJS library not loaded. Please check your internet connection.');
      return;
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Slide size in inches (standard for 16:9)
    const SLIDE_WIDTH = 10;
    const SLIDE_HEIGHT = 5.625;
    const CANVAS_WIDTH_PX = 800; // Expected canvas width in pixels
    const CANVAS_HEIGHT_PX = 450; // Expected canvas height in pixels

    const pxToInX = (px) => (parseFloat(px) / CANVAS_WIDTH_PX) * SLIDE_WIDTH;
    const pxToInY = (px) => (parseFloat(px) / CANVAS_HEIGHT_PX) * SLIDE_HEIGHT;

    this.slides.forEach((slideData) => {
      const slide = pptx.addSlide();

      // Background
      if (slideData.background) {
        slide.background = { color: slideData.background.replace('#', '') };
      } else if (slideData.theme && slideData.theme.bg) {
        slide.background = { color: slideData.theme.bg.replace('#', '') };
      }

      slideData.elements.forEach((el) => {
        const x = pxToInX(el.styles.left);
        const y = pxToInY(el.styles.top);
        const w = pxToInX(el.styles.width);
        const h = pxToInY(el.styles.height);

        const options = {
          x: x,
          y: y,
          w: w,
          h: h,
          fontSize: el.styles.fontSize ? parseInt(el.styles.fontSize) : 18,
          color: el.styles.color ? el.styles.color.replace('#', '') : '323130',
          align: el.styles.textAlign || 'left',
          bold: el.styles.fontWeight === 'bold',
          italic: el.styles.fontStyle === 'italic',
          underline: el.styles.textDecoration === 'underline',
          valign: el.styles['data-valign'] || 'top',
        };

        if (el.type === 'text') {
          // Basic HTML to text conversion for now
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = el.content || el.placeholderText || '';
          const text = tempDiv.innerText || tempDiv.textContent;
          slide.addText(text, options);
        } else if (el.type === 'shape') {
          const shapeMap = {
            'rect': pptx.ShapeType.rect,
            'circle': pptx.ShapeType.ellipse,
            'triangle': pptx.ShapeType.triangle,
            'star': pptx.ShapeType.star5,
            'arrow-right': pptx.ShapeType.rightArrow,
            'minus': pptx.ShapeType.line,
            // Add more mappings as needed
          };

          const pptxShape = shapeMap[el.shapeType] || pptx.ShapeType.rect;
          slide.addShape(pptxShape, {
            ...options,
            fill: { color: (el.styles.backgroundColor || '#d83b01').replace('#', '') }
          });
        } else if (el.type === 'image') {
          slide.addImage({
            data: el.src,
            x: x,
            y: y,
            w: w,
            h: h
          });
        }
      });
    });

    pptx.writeFile({ fileName: 'presentation.pptx' });
    this.addToRecentFiles('presentation.pptx', 'Downloads');
  }

  addToRecentFiles(name, path) {
    const fresh = { name, path, dateModified: new Date().toISOString() };
    // Remove if already exists with same name/path
    this.recentFiles = this.recentFiles.filter(f => !(f.name === name && f.path === path));
    // Prepend
    this.recentFiles.unshift(fresh);
    // Limit to 10 items
    if (this.recentFiles.length > 10) this.recentFiles.pop();
    // Persist
    localStorage.setItem('ppt_recent_files', JSON.stringify(this.recentFiles));
    // Update UI if it's visible or next time it's shown
    this.renderRecentFiles();
  }

  renderRecentFiles() {
    const container = document.getElementById('bs-recent-list-container');
    if (!container) return;

    let itemsToRender = [];
    let emptyMsg = "No recent presentations.";

    if (this.activeBsTab === 'recent') {
      itemsToRender = this.recentFiles;
      emptyMsg = "No recent presentations.";
    } else if (this.activeBsTab === 'favorites') {
      itemsToRender = []; // Could be extended later
      emptyMsg = "No favorites yet. Add items to favorites to see them here.";
    } else if (this.activeBsTab === 'shared') {
      itemsToRender = []; // Could be extended later
      emptyMsg = "No one has shared anything with you yet.";
    }

    if (itemsToRender.length === 0) {
      container.innerHTML = `<div style="padding: 24px; color: #605e5c; font-size: 13px; text-align: center;">${emptyMsg}</div>`;
      return;
    }

    container.innerHTML = itemsToRender.map(file => {
      const date = new Date(file.dateModified);
      const isToday = date.toDateString() === new Date().toDateString();
      const dateStr = isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();

      return `
        <div class="bs-file-item" data-name="${file.name}">
          <div class="col-name">
            <div class="pptx-icon-sm">P</div>
            <div class="file-info">
              <div class="file-name">${file.name}</div>
              <div class="file-path">${file.path}</div>
            </div>
          </div>
          <div class="col-date">${dateStr}</div>
        </div>
      `;
    }).join('');

    // Re-bind click events
    container.querySelectorAll('.bs-file-item').forEach(item => {
      item.onclick = () => {
        const fileName = item.dataset.name;
        alert(`Opening ${fileName}... (Demonstration)`);
        // Mock load
        this.slides = [{
          id: 'slide-1',
          elements: [{
            id: 'el-mock',
            type: 'text',
            content: fileName,
            styles: { top: '200px', left: '50px', width: '860px', height: '100px', fontSize: '32pt', fontWeight: 'bold', textAlign: 'center' }
          }],
          background: '#ffffff',
          layout: 'title'
        }];
        this.currentSlideIndex = 0;
        this.render();
        const overlay = document.getElementById('backstage-overlay');
        if (overlay) overlay.style.display = 'none';
      };
    });
  }

  toggleAutosave() {
    this.autosaveEnabled = !this.autosaveEnabled;
    localStorage.setItem('ppt_autosave_enabled', this.autosaveEnabled);
    this.updateAutosaveUI();
    if (this.autosaveEnabled) {
      this.performAutosave();
    }
  }

  updateAutosaveUI() {
    if (this.qaAutosaveBtn) {
      if (this.autosaveEnabled) {
        this.qaAutosaveBtn.classList.add('active');
        this.qaAutosaveBtn.title = "AutoSave: On";
      } else {
        this.qaAutosaveBtn.classList.remove('active');
        this.qaAutosaveBtn.title = "AutoSave: Off";
      }
    }
  }

  performAutosave() {
    localStorage.setItem('ppt_autosave_data', JSON.stringify({ slides: this.slides }));
    console.log("Autosaved to localStorage at " + new Date().toLocaleTimeString());
  }

  loadFromAutosave() {
    const data = localStorage.getItem('ppt_autosave_data');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && parsed.slides && parsed.slides.length > 0) {
          this.slides = parsed.slides;
          return true;
        }
      } catch (e) {
        console.error("Failed to load autosave data", e);
      }
    }
    return false;
  }

  undo() {
    if (document.activeElement && document.activeElement.isContentEditable) {
      if (document.execCommand('undo')) return;
    }
    if (this.undoStack.length === 0) return;
    const currentState = {
      slides: JSON.parse(JSON.stringify(this.slides)),
      currentSlideIndex: this.currentSlideIndex,
      sections: JSON.parse(JSON.stringify(this.sections))
    };

    let previousState = this.undoStack.pop();
    // Skip identical states that crept into the stack (e.g., from clicking without moving)
    while (JSON.stringify(previousState) === JSON.stringify(currentState) && this.undoStack.length > 0) {
      previousState = this.undoStack.pop();
    }

    // If the only state we found is identical to current, don't change anything
    if (JSON.stringify(previousState) === JSON.stringify(currentState)) {
      this.updateUndoRedoButtons();
      return;
    }

    this.redoStack.push(currentState);

    this.slides = previousState.slides;
    this.currentSlideIndex = previousState.currentSlideIndex;
    this.sections = previousState.sections;

    this.deselectElement();
    this.render();
    this.updateUndoRedoButtons();
  }

  redo() {
    if (document.activeElement && document.activeElement.isContentEditable) {
      if (document.execCommand('redo')) return;
    }
    if (this.redoStack.length === 0) return;
    const currentState = {
      slides: JSON.parse(JSON.stringify(this.slides)),
      currentSlideIndex: this.currentSlideIndex,
      sections: JSON.parse(JSON.stringify(this.sections))
    };

    let nextState = this.redoStack.pop();
    // Skip identical states in redo stack
    while (JSON.stringify(nextState) === JSON.stringify(currentState) && this.redoStack.length > 0) {
      nextState = this.redoStack.pop();
    }

    if (JSON.stringify(nextState) === JSON.stringify(currentState)) {
      this.updateUndoRedoButtons();
      return;
    }

    this.undoStack.push(currentState);

    this.slides = nextState.slides;
    this.currentSlideIndex = nextState.currentSlideIndex;
    this.sections = nextState.sections;

    this.deselectElement();
    this.render();
    this.updateUndoRedoButtons();
  }

  updateUndoRedoButtons() {
    const canUndo = this.undoStack.length > 0;
    const canRedo = this.redoStack.length > 0;

    const updateBtn = (btn, isEnabled) => {
      if (!btn) return;
      if (!isEnabled) {
        btn.classList.add('disabled');
        const svg = btn.querySelector('svg');
        if (svg) svg.querySelectorAll('path').forEach(p => p.setAttribute('stroke', '#a19f9d'));
      } else {
        btn.classList.remove('disabled');
        const svg = btn.querySelector('svg');
        if (svg) svg.querySelectorAll('path').forEach(p => p.setAttribute('stroke', '#222'));
      }
      if (btn.tagName === 'BUTTON' && !btn.querySelector('svg')) {
        btn.style.opacity = isEnabled ? '1' : '0.5';
        btn.style.cursor = isEnabled ? 'pointer' : 'default';
      }
    };

    updateBtn(this.qaUndoBtn, canUndo);
    updateBtn(this.qaRedoBtn, canRedo);
    updateBtn(this.drawUndoBtn, canUndo);
    updateBtn(this.drawRedoBtn, canRedo);
  }

  getNextId(prefix = 'el') {
    this.elementCounter++;
    return `${prefix}-${Date.now()}-${this.elementCounter}`;
  }

  addSlide(layout = 'title') {
    this.saveState();
    const slide = { id: Date.now(), elements: [], layout: layout };

    if (layout === 'title') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '160px', left: '50px', width: '860px', height: '120px', fontSize: '40pt', fontWeight: 'bold', textAlign: 'center' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add subtitle', styles: { top: '300px', left: '50px', width: '860px', height: '60px', fontSize: '20pt', textAlign: 'center', color: '#666' } }
      ];
    } else if (layout === 'content') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '40px', width: '720px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'section') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '250px', left: '50px', width: '700px', height: '80px', fontSize: '36pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '340px', left: '50px', width: '700px', height: '60px', fontSize: '18pt', textAlign: 'left', color: '#666', borderTop: '2px solid #666', paddingTop: '10px' } }
      ];
    } else if (layout === 'two-content') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '40px', width: '350px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '410px', width: '350px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'comparison') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '110px', left: '40px', width: '350px', height: '40px', fontSize: '18pt', textAlign: 'center', fontWeight: 'bold' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '110px', left: '410px', width: '350px', height: '40px', fontSize: '18pt', textAlign: 'center', fontWeight: 'bold' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '160px', left: '40px', width: '350px', height: '350px', fontSize: '16pt', textAlign: 'left', padding: '10px' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '160px', left: '410px', width: '350px', height: '350px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'title-only') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } }
      ];
    } else if (layout === 'caption-content') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '110px', left: '40px', width: '250px', height: '70px', fontSize: '24pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '190px', left: '40px', width: '250px', height: '320px', fontSize: '14pt', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '310px', width: '450px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'caption-picture') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '110px', left: '40px', width: '250px', height: '70px', fontSize: '24pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '190px', left: '40px', width: '250px', height: '320px', fontSize: '14pt', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click icon to add picture', isContent: true, styles: { top: '110px', left: '310px', width: '450px', height: '400px', fontSize: '16pt', textAlign: 'center', border: '1px solid #666', borderStyle: 'solid' } }
      ];
    }
    else if (layout === 'blank') {
      slide.elements = [];
    }

    this.slides.push(slide);
    this.render();
  }

  changeSlideLayout(layout = 'title') {
    this.saveState();
    if (this.currentSlideIndex < 0 || this.currentSlideIndex >= this.slides.length) return;
    const slide = this.slides[this.currentSlideIndex];
    slide.layout = layout;

    // Preserve existing placeholders to copy content across if applicable
    const oldElements = [...slide.elements];

    // Clear existing elements and set new ones based on layout
    slide.elements = [];

    if (layout === 'title') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '160px', left: '50px', width: '860px', height: '120px', fontSize: '40pt', fontWeight: 'bold', textAlign: 'center' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add subtitle', styles: { top: '300px', left: '50px', width: '860px', height: '60px', fontSize: '20pt', textAlign: 'center', color: '#666' } }
      ];
    } else if (layout === 'content') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '40px', width: '720px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'section') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '250px', left: '50px', width: '700px', height: '80px', fontSize: '36pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '340px', left: '50px', width: '700px', height: '60px', fontSize: '18pt', textAlign: 'left', color: '#666', borderTop: '2px solid #666', paddingTop: '10px' } }
      ];
    } else if (layout === 'two-content') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '40px', width: '350px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '410px', width: '350px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'comparison') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '110px', left: '40px', width: '350px', height: '40px', fontSize: '18pt', textAlign: 'center', fontWeight: 'bold' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '110px', left: '410px', width: '350px', height: '40px', fontSize: '18pt', textAlign: 'center', fontWeight: 'bold' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '160px', left: '40px', width: '350px', height: '350px', fontSize: '16pt', textAlign: 'left', padding: '10px' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '160px', left: '410px', width: '350px', height: '350px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'title-only') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } }
      ];
    } else if (layout === 'caption-content') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '110px', left: '40px', width: '250px', height: '70px', fontSize: '24pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '190px', left: '40px', width: '250px', height: '320px', fontSize: '14pt', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '310px', width: '450px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'caption-picture') {
      slide.elements = [
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '110px', left: '40px', width: '250px', height: '70px', fontSize: '24pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '190px', left: '40px', width: '250px', height: '320px', fontSize: '14pt', textAlign: 'left' } },
        { id: this.getNextId(), type: 'text', content: '', placeholderText: 'Click icon to add picture', isContent: true, styles: { top: '110px', left: '310px', width: '450px', height: '400px', fontSize: '16pt', textAlign: 'center', border: '1px solid #666', borderStyle: 'solid' } }
      ];
    } else if (layout === 'blank') {
      slide.elements = [];
    }

    // Restore text content from previous layout to new layout placeholders
    slide.elements.forEach((el, index) => {
      if (oldElements[index]) {
        if (oldElements[index].content && oldElements[index].content !== '<br>') {
          el.content = oldElements[index].content;
        }
      }
    });

    this.deselectElement();
    this.render();
  }

  // --- Section Logic ---
  addSection() {
    this.saveState();
    if (this.slides.length === 0) return;

    // If no sections exist yet, we create a default section for the slides before the current one
    if (this.sections.length === 0 && this.currentSlideIndex > 0) {
      this.sections.push({
        id: `sec-default-${Date.now()}`,
        name: 'Default Section',
        collapsed: false
      });
      // Assign all slides before current to Default Section
      for (let i = 0; i < this.currentSlideIndex; i++) {
        this.slides[i].sectionId = this.sections[0].id;
      }
    }

    const newSectionId = `sec-${Date.now()}`;
    const newSection = {
      id: newSectionId,
      name: 'Untitled Section',
      collapsed: false
    };

    // Find the current section index to insert after
    const currentSlide = this.slides[this.currentSlideIndex];
    let insertIndex = this.sections.findIndex(s => s.id === currentSlide.sectionId);
    if (insertIndex === -1) insertIndex = this.sections.length; else insertIndex++;

    this.sections.splice(insertIndex, 0, newSection);

    // Assign current slide and all subsequent slides in the same previous section to the new section
    const prevSectionId = currentSlide.sectionId;
    for (let i = this.currentSlideIndex; i < this.slides.length; i++) {
      if (this.slides[i].sectionId === prevSectionId || !this.slides[i].sectionId) {
        this.slides[i].sectionId = newSectionId;
      } else {
        break; // Reached next section
      }
    }

    if (this.sectionDropdown) this.sectionDropdown.classList.remove('show');
    this.render();
  }

  renameSection() {
    this.saveState();
    const currentSlide = this.slides[this.currentSlideIndex];
    if (!currentSlide || !currentSlide.sectionId) return;

    const section = this.sections.find(s => s.id === currentSlide.sectionId);
    if (section) {
      const newName = prompt('Rename Section', section.name);
      if (newName !== null && newName.trim() !== '') {
        section.name = newName.trim();
        this.render();
      }
    }
    if (this.sectionDropdown) this.sectionDropdown.classList.remove('show');
  }

  removeSection() {
    this.saveState();
    const currentSlide = this.slides[this.currentSlideIndex];
    if (!currentSlide || !currentSlide.sectionId) return;

    const sectionIndex = this.sections.findIndex(s => s.id === currentSlide.sectionId);
    if (sectionIndex > -1) {
      const sectionId = this.sections[sectionIndex].id;
      // Reassign slides to the previous section, or clear sectionId if it was the first
      const prevSectionId = sectionIndex > 0 ? this.sections[sectionIndex - 1].id : null;

      this.slides.forEach(slide => {
        if (slide.sectionId === sectionId) {
          slide.sectionId = prevSectionId;
        }
      });

      this.sections.splice(sectionIndex, 1);

      // If only one section remains and it's 'Default Section', we can clear all sections
      if (this.sections.length === 1 && this.sections[0].name === 'Default Section') {
        this.removeAllSections();
      } else {
        this.render();
      }
    }
    if (this.sectionDropdown) this.sectionDropdown.classList.remove('show');
  }

  removeAllSections() {
    this.saveState();
    this.sections = [];
    this.slides.forEach(slide => delete slide.sectionId);
    if (this.sectionDropdown) this.sectionDropdown.classList.remove('show');
    this.render();
  }

  collapseAllSections(collapse) {
    this.sections.forEach(s => s.collapsed = collapse);
    if (this.sectionDropdown) this.sectionDropdown.classList.remove('show');
    this.renderSlideList();
    if (window.lucide) window.lucide.createIcons();
  }

  updateSectionDropdownState() {
    const hasSections = this.sections.length > 0;
    const currentSlide = this.slides[this.currentSlideIndex];
    const inSection = hasSections && currentSlide && currentSlide.sectionId;

    if (this.btnRenameSection) {
      if (inSection) this.btnRenameSection.classList.remove('disabled');
      else this.btnRenameSection.classList.add('disabled');
    }
    if (this.btnRemoveSection) {
      if (inSection) this.btnRemoveSection.classList.remove('disabled');
      else this.btnRemoveSection.classList.add('disabled');
    }
    if (this.btnRemoveAllSections) {
      if (hasSections) this.btnRemoveAllSections.classList.remove('disabled');
      else this.btnRemoveAllSections.classList.add('disabled');
    }
    if (this.btnCollapseAllSections) {
      if (hasSections) this.btnCollapseAllSections.classList.remove('disabled');
      else this.btnCollapseAllSections.classList.add('disabled');
    }
    if (this.btnExpandAllSections) {
      if (hasSections) this.btnExpandAllSections.classList.remove('disabled');
      else this.btnExpandAllSections.classList.add('disabled');
    }
  }


  execCommand(cmd) {
    if (this.selectedElement) {
      document.execCommand(cmd, false, null);
      this.syncDataWithSelection();
    }
  }

  resetCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex];
    if (slide) {
      const layout = slide.layout || 'title';
      this.changeSlideLayout(layout);
    }
  }

  cycleColumns() {
    if (!this.selectedElement) return;
    const current = this.selectedElement.getAttribute('data-columns') || '1';
    const next = current === '1' ? '2' : (current === '2' ? '3' : '1');
    this.selectedElement.setAttribute('data-columns', next);
    this.syncDataWithSelection();
  }

  applyTextDirection(dir) {
    if (!this.selectedElement) return;
    this.saveState();
    const el = this.selectedElement;

    // Reset any previous text direction transforms
    el.style.writingMode = '';
    el.style.transform = '';
    el.style.letterSpacing = '';
    el.style.textOrientation = '';
    el.style.direction = '';
    el.dataset.textDirection = dir;

    switch (dir) {
      case 'horizontal':
        // Default — nothing extra to apply
        break;
      case 'rotate90':
        // Rotate text 90° clockwise — writing-mode: vertical-rl
        el.style.writingMode = 'vertical-rl';
        el.style.textOrientation = 'mixed';
        break;
      case 'rotate270':
        // Rotate text 270° (same as 90° counter-clockwise)
        el.style.writingMode = 'vertical-lr';
        el.style.textOrientation = 'mixed';
        el.style.transform = 'rotate(180deg)';
        break;
      case 'stacked':
        // Stacked: each letter on its own line using vertical writing mode with upright orientation
        el.style.writingMode = 'vertical-rl';
        el.style.textOrientation = 'upright';
        break;
    }

    this.syncDataWithSelection();
  }

  showTextDirectionOptionsDialog() {
    const existing = document.getElementById('text-dir-modal');
    if (existing) existing.remove();

    const currentDir = (this.selectedElement && this.selectedElement.dataset.textDirection) || 'horizontal';
    const options = [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'rotate90', label: 'Rotate all text 90°' },
      { value: 'rotate270', label: 'Rotate all text 270°' },
      { value: 'stacked', label: 'Stacked' },
    ];

    const modal = document.createElement('div');
    modal.id = 'text-dir-modal';
    modal.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif;`;
    modal.innerHTML = `
      <div style="background:#fff;border:1px solid #c8c6c4;box-shadow:0 8px 24px rgba(0,0,0,0.2);border-radius:4px;min-width:320px;">
        <div style="background:#f3f2f1;padding:10px 16px;border-bottom:1px solid #edebe9;font-size:14px;font-weight:600;">Text Direction</div>
        <div style="padding:16px 20px;">
          <div style="font-size:13px;color:#323130;margin-bottom:12px;">Select text direction:</div>
          ${options.map(o => `
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;padding:6px 0;">
              <input type="radio" name="tdir" value="${o.value}" ${currentDir === o.value ? 'checked' : ''} style="accent-color:#0078d4;">
              ${o.label}
            </label>`).join('')}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;border-top:1px solid #edebe9;">
          <button id="td-ok" style="background:#0078d4;color:#fff;border:none;padding:6px 20px;border-radius:2px;font-size:13px;cursor:pointer;">OK</button>
          <button id="td-cancel" style="background:#fff;color:#323130;border:1px solid #c8c6c4;padding:6px 20px;border-radius:2px;font-size:13px;cursor:pointer;">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('td-ok').onclick = () => {
      const chosen = modal.querySelector('input[name="tdir"]:checked');
      if (chosen) {
        this.applyTextDirection(chosen.value);
        // Sync checkmark in dropdown
        const textDirDropdown = document.getElementById('text-dir-dropdown');
        if (textDirDropdown) {
          textDirDropdown.querySelectorAll('.text-dir-option').forEach(o => {
            o.classList.toggle('selected', o.getAttribute('data-dir') === chosen.value);
          });
        }
      }
      modal.remove();
    };
    document.getElementById('td-cancel').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }


  cycleVerticalAlign() {
    if (!this.selectedElement) return;
    const current = this.selectedElement.getAttribute('data-valign') || 'top';
    const next = current === 'top' ? 'center' : (current === 'center' ? 'bottom' : 'top');
    this.selectedElement.setAttribute('data-valign', next);
    this.syncDataWithSelection();
  }

  addText() {
    this.saveState();
    const slide = this.slides[this.currentSlideIndex];
    slide.elements.push({ id: this.getNextId(), type: 'text', content: '', styles: { top: '100px', left: '100px', width: '200px', border: '1px dashed #ccc' } });
    this.renderCanvas();
  }

  addShape(shapeType) {
    this.saveState();
    const slide = this.slides[this.currentSlideIndex];
    const isLine = shapeType === 'minus' || shapeType === 'arrow-right';
    const el = {
      id: this.getNextId(),
      type: 'shape',
      shapeType: shapeType,
      styles: {
        top: '150px',
        left: '150px',
        width: isLine ? '200px' : '150px',
        height: isLine ? '20px' : '150px',
        backgroundColor: '#d83b01'
      }
    };

    // Default adjustments for all adjustable shapes
    const adj = {
      'arrow-right': { headWidth: 0.3, shaftHeight: 0.2 },
      'arrow-left': { headWidth: 0.3, shaftHeight: 0.2 },
      'arrow-up': { headWidth: 0.3, shaftHeight: 0.2 },
      'arrow-down': { headWidth: 0.3, shaftHeight: 0.2 },
      'arrow-both': { headWidth: 0.3, shaftHeight: 0.2 },
      'rounded-rect': { radius: 0.15 },
      'star': { depth: 0.5 },
      'star-4': { depth: 0.3 },
      'star-6': { depth: 0.4 },
      'star-8': { depth: 0.4 },
      'star-16': { depth: 0.5 },
      'trapezoid': { indent: 0.2 },
      'parallelogram': { indent: 0.2 },
      'plus': { weight: 0.3 },
      'frame': { thickness: 0.15 },
      'chevron': { indent: 0.5 },
      'donut': { hole: 0.5 },
      'pentagon-block': { head: 0.4 },
      'hexagon-block': { head: 0.4 },
      'corner': { thickness: 0.2 },
      'l-shape': { thickness: 0.2 },
      'callout-rect': { ptrX: 0.2, ptrY: 1.2 },
      'callout-round': { ptrX: 0.2, ptrY: 1.2 }
    };

    if (adj[shapeType]) {
      el.adjustments = adj[shapeType];
    }

    slide.elements.push(el);
    this.renderCanvas();
  }

  getShapeClipPath(shapeType, adjustments = {}) {
    const a = adjustments;
    switch (shapeType) {
      case 'arrow-right': {
        const head = a.headWidth || 0.3, shaft = a.shaftHeight || 0.2;
        const hs = 100 - (head * 100), st = (100 - (shaft * 100)) / 2, sb = 100 - st;
        return `polygon(0% ${st}%, ${hs}% ${st}%, ${hs}% 0%, 100% 50%, ${hs}% 100%, ${hs}% ${sb}%, 0% ${sb}%)`;
      }
      case 'arrow-left': {
        const head = a.headWidth || 0.3, shaft = a.shaftHeight || 0.2;
        const hs = head * 100, st = (100 - (shaft * 100)) / 2, sb = 100 - st;
        return `polygon(100% ${st}%, ${hs}% ${st}%, ${hs}% 0%, 0% 50%, ${hs}% 100%, ${hs}% ${sb}%, 100% ${sb}%)`;
      }
      case 'arrow-both': {
        const head = a.headWidth || 0.3, shaft = a.shaftHeight || 0.2;
        const hs = head * 100, he = 100 - hs, st = (100 - (shaft * 100)) / 2, sb = 100 - st;
        return `polygon(0% 50%, ${hs}% 0%, ${hs}% ${st}%, ${he}% ${st}%, ${he}% 0%, 100% 50%, ${he}% 100%, ${he}% ${sb}%, ${hs}% ${sb}%, ${hs}% 100%)`;
      }
      case 'rounded-rect': return `inset(0% round ${(a.radius || 0.15) * 100}%)`;
      case 'parallelogram': {
        const ind = (a.indent || 0.2) * 100;
        return `polygon(${ind}% 0%, 100% 0%, ${100 - ind}% 100%, 0% 100%)`;
      }
      case 'trapezoid': {
        const ind = (a.indent || 0.2) * 100;
        return `polygon(${ind}% 0%, ${100 - ind}% 0%, 100% 100%, 0% 100%)`;
      }
      case 'plus': {
        const w = (a.weight || 0.3) * 100;
        const s = (100 - w) / 2, e = 100 - s;
        return `polygon(${s}% 0%, ${e}% 0%, ${e}% ${s}%, 100% ${s}%, 100% ${e}%, ${e}% ${e}%, ${e}% 100%, ${s}% 100%, ${s}% ${e}%, 0% ${e}%, 0% ${s}%, ${s}% ${s}%)`;
      }
      case 'star': return this.generateStarPoints(5, a.depth || 0.5);
      case 'star-4': return this.generateStarPoints(4, a.depth || 0.3);
      case 'star-6': return this.generateStarPoints(6, a.depth || 0.4);
      case 'star-8': return this.generateStarPoints(8, a.depth || 0.4);
      case 'frame': {
        const t = (a.thickness || 0.15) * 100;
        return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${t}% ${t}%, ${t}% ${100 - t}%, ${100 - t}%, ${100 - t}%, ${100 - t}% ${t}%, ${t}% ${t}%)`;
      }
      case 'chevron': {
        const ind = (a.indent || 0.5) * 100;
        return `polygon(0% 0%, ${100 - ind}% 0%, 100% 50%, ${100 - ind}% 100%, 0% 100%, ${ind}% 50%)`;
      }
      case 'l-shape': {
        const t = (a.thickness || 0.2) * 100;
        return `polygon(0% 0%, ${t}% 0%, ${t}% ${100 - t}%, 100% ${100 - t}%, 100% 100%, 0% 100%)`;
      }
      case 'callout-rect': {
        const px = (a.ptrX || 0.2) * 100, py = (a.ptrY || 1.2) * 100;
        return `polygon(0% 0%, 100% 0%, 100% 80%, ${px + 10}% 80%, ${px}% ${py}%, ${px - 10}% 80%, 0% 80%)`;
      }
      case 'callout-round': {
        const px = (a.ptrX || 0.2) * 100, py = (a.ptrY || 1.2) * 100;
        // Approximated rounded rect + pointer
        return `polygon(10% 0%, 90% 0%, 100% 10%, 100% 70%, 90% 80%, ${px + 10}% 80%, ${px}% ${py}%, ${px - 10}% 80%, 10% 80%, 0% 70%, 0% 10%)`;
      }

      // ===== NEW SHAPES =====
      // Rectangles category
      case 'square': return null; // Standard rectangle - no clip path needed
      case 'snip-rect': return `polygon(0% 0%, 85% 0%, 100% 15%, 100% 100%, 0% 100%)`;
      case 'snip-round-rect': return `inset(0% round 15% 0% 0% 15%)`;

      // Basic shapes category
      case 'right-triangle': return `polygon(0% 100%, 100% 100%, 0% 0%)`;
      case 'octagon': return `polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)`;
      case 'pentagon': return `polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)`;
      case 'donut': {
        const hole = (a.hole || 0.5) * 50;
        // Donut via two overlapping circles - approximate with polygon
        return `circle(50% at center)`;
      }
      case 'no-symbol': return `circle(50% at center)`;
      case 'cloud': return `polygon(25% 60%, 15% 55%, 10% 42%, 17% 30%, 30% 27%, 35% 16%, 50% 10%, 65% 14%, 73% 26%, 85% 25%, 95% 35%, 95% 50%, 85% 60%, 25% 60%, 25% 100%, 75% 100%, 75% 60%)`;
      case 'crescent': return `polygon(80% 0%, 100% 20%, 100% 80%, 80% 100%, 60% 95%, 40% 80%, 30% 60%, 30% 40%, 40% 20%, 60% 5%)`;
      case 'cylinder': return `inset(0% round 50% 50% 0% 0% / 10% 10% 0% 0%)`;

      // Block Arrows
      case 'arrow-up': {
        const head = a.headWidth || 0.3, shaft = a.shaftHeight || 0.2;
        const hw = head * 100, hs = (100 - (shaft * 100)) / 2, he = 100 - hs;
        return `polygon(${hs}% ${hw}%, ${hs}% 100%, ${he}% 100%, ${he}% ${hw}%, 100% ${hw}%, 50% 0%, 0% ${hw}%)`;
      }
      case 'arrow-down': {
        const head = a.headWidth || 0.3, shaft = a.shaftHeight || 0.2;
        const hw = 100 - head * 100, hs = (100 - (shaft * 100)) / 2, he = 100 - hs;
        return `polygon(${hs}% 0%, ${hs}% ${hw}%, 0% ${hw}%, 50% 100%, 100% ${hw}%, ${he}% ${hw}%, ${he}% 0%)`;
      }
      case 'arrow-up-down': {
        const head = a.headWidth || 0.3, shaft = a.shaftHeight || 0.2;
        const hw = head * 100, hw2 = 100 - hw, hs = (100 - (shaft * 100)) / 2, he = 100 - hs;
        return `polygon(${hs}% ${hw}%, 0% ${hw}%, 50% 0%, 100% ${hw}%, ${he}% ${hw}%, ${he}% ${hw2}%, 100% ${hw2}%, 50% 100%, 0% ${hw2}%, ${hs}% ${hw2}%)`;
      }
      case 'notched-arrow': {
        const ind = (a.indent || 0.2) * 100;
        return `polygon(0% 0%, ${100 - ind}% 0%, 100% 50%, ${100 - ind}% 100%, 0% 100%, ${ind}% 50%)`;
      }
      case 'quad-arrow': return `polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)`;
      case 'circular-arrow': return null; // complex - use standard shape for now

      // Equation shapes
      case 'eq-plus': {
        const w = 30;
        const s = (100 - w) / 2, e = 100 - s;
        return `polygon(${s}% 0%, ${e}% 0%, ${e}% ${s}%, 100% ${s}%, 100% ${e}%, ${e}% ${e}%, ${e}% 100%, ${s}% 100%, ${s}% ${e}%, 0% ${e}%, 0% ${s}%, ${s}% ${s}%)`;
      }
      case 'eq-minus': return `inset(40% 0 40% 0)`;
      case 'eq-multiply': return `polygon(15% 0%, 50% 35%, 85% 0%, 100% 15%, 65% 50%, 100% 85%, 85% 100%, 50% 65%, 15% 100%, 0% 85%, 35% 50%, 0% 15%)`;
      case 'eq-divide': return null; // use raw div icon
      case 'eq-equal': return `polygon(0% 30%, 100% 30%, 100% 45%, 0% 45%, 0% 55%, 100% 55%, 100% 70%, 0% 70%)`;
      case 'eq-notequal': return null;

      // Flowchart special shapes
      case 'flowchart-predefined': return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 10% 0%, 10% 100%, 0% 100%, 90% 0%, 90% 100%)`;
      case 'flowchart-document': return `polygon(0% 0%, 100% 0%, 100% 75%, 85% 80%, 70% 90%, 55% 85%, 40% 75%, 25% 80%, 10% 90%, 0% 85%)`;
      case 'flowchart-extract': return `polygon(50% 0%, 100% 100%, 0% 100%)`;
      case 'flowchart-delay': return `inset(0% round 0% 50% 50% 0%)`;
      case 'elbow-connector': return null; // line - no fill needed
      case 'curved-connector': return null; // line - no fill needed

      // Stars and Banners
      case 'star-badge': return this.generateStarPoints(12, 0.6);
      case 'banner-wave': return `polygon(0% 20%, 25% 0%, 50% 20%, 75% 0%, 100% 20%, 100% 80%, 75% 100%, 50% 80%, 25% 100%, 0% 80%)`;
      case 'banner-flag': return `polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 50% 70%, 0% 70%)`;

      default: return null;
    }
  }

  generateStarPoints(points, depth) {
    const pts = [], innerRadius = depth * 50;
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i - (Math.PI / 2);
      const radius = i % 2 === 0 ? 50 : innerRadius;
      pts.push(`${50 + radius * Math.cos(angle)}% ${50 + radius * Math.sin(angle)}%`);
    }
    return `polygon(${pts.join(', ')})`;
  }

  // --- Style Implementation ---
  toggleSimpleStyle(prop, activeVal, defaultVal) {
    this.saveState();
    if (!this.selectedElement) return;

    const selection = window.getSelection();
    const isInside = (selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;

    if (isInside) {
      if (!selection.isCollapsed) {
        const cmdMap = {
          'fontWeight': 'bold',
          'fontStyle': 'italic'
        };

        const cmd = cmdMap[prop];
        if (cmd) {
          document.execCommand(cmd, false, null);
        } else if (prop === 'textDecoration') {
          if (activeVal === 'line-through') document.execCommand('strikeThrough', false, null);
          else if (activeVal === 'underline') document.execCommand('underline', false, null);
        }
        this.normalizeCaret();
      }
    } else {
      const current = this.selectedElement.style[prop];
      const next = (current === activeVal) ? defaultVal : activeVal;
      this.applyStyle(prop, next);
    }
    this.syncDataWithSelection();
    this.syncMiniToolbarActiveState();
  }

  normalizeCaret() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // 1. Collapse to end of current transformation
    selection.collapseToEnd();

    // 2. Identify if we are trapped inside a styled tag (B, I, SPAN, etc.)
    let anchorNode = selection.anchorNode;
    let parent = anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode;
    const styleTags = ['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'FONT'];

    if (parent && styleTags.includes(parent.tagName) && parent !== this.selectedElement) {
      // Break out of the tag!
      const zws = document.createTextNode('\u200B');
      if (parent.nextSibling) {
        parent.parentNode.insertBefore(zws, parent.nextSibling);
      } else {
        parent.parentNode.appendChild(zws);
      }
      const nextRange = document.createRange();
      nextRange.setStartAfter(zws);
      nextRange.setEndAfter(zws);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    } else {
      // 3. Fallback: Standard ZWS trick for plain nodes
      const range = selection.getRangeAt(0);
      const zws = document.createTextNode('\u200B');
      range.insertNode(zws);
      const nextRange = document.createRange();
      nextRange.setStartAfter(zws);
      nextRange.setEndAfter(zws);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    }

    // 4. Force toggle-off commands at this fresh position
    const stickyCmds = ['bold', 'italic', 'underline', 'strikeThrough'];
    stickyCmds.forEach(cmd => {
      if (document.queryCommandState(cmd)) {
        document.execCommand(cmd, false, null);
      }
    });

    // 5. Reset flag
    document.execCommand('styleWithCSS', false, true);
  }

  moveCaretAfter(node) {
    const selection = window.getSelection();
    const range = document.createRange();

    // Insert ZWS as breakout point for span-based styles
    const zws = document.createTextNode('\u200B');
    if (node.nextSibling) {
      node.parentNode.insertBefore(zws, node.nextSibling);
    } else {
      node.parentNode.appendChild(zws);
    }

    range.setStartAfter(zws);
    range.setEndAfter(zws);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  applyHighlight(color) {
    this.saveState();
    if (!this.selectedElement) return;
    const selection = window.getSelection();
    const isInside = (selection && selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;
    if (isInside) {
      if (!selection.isCollapsed) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('backColor', false, color === 'transparent' ? 'transparent' : color);
        this.normalizeCaret();
      }
    } else {
      this.applyStyle('backgroundColor', color);
    }
    this.syncDataWithSelection();
  }

  applyFontColor(color) {
    this.saveState();
    if (!this.selectedElement) return;
    const selection = window.getSelection();
    const isInside = (selection && selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;
    if (isInside) {
      if (!selection.isCollapsed) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);
        this.normalizeCaret();
      }
    } else {
      this.applyStyle('color', color);
    }
    this.syncDataWithSelection();
  }

  toggleShadow() {
    this.saveState();
    if (!this.selectedElement) return;

    const selection = window.getSelection();
    const isInside = (selection && selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;

    if (isInside) {
      if (!selection.isCollapsed) {
        // Strict selection - only apply to highlighted range
        const parentEl = selection.anchorNode.parentElement;
        const currentShadow = window.getComputedStyle(parentEl).textShadow;
        const hasShadow = currentShadow && currentShadow !== 'none';
        const nextShadow = hasShadow ? 'none' : '4px 4px 6px rgba(0,0,0,0.5)';

        document.execCommand('styleWithCSS', false, false); // Use tags for markers
        document.execCommand('fontSize', false, '7');
        const fontTags = this.selectedElement.querySelectorAll('font[size="7"]');
        fontTags.forEach(tag => {
          tag.removeAttribute('size');
          const span = document.createElement('span');
          span.style.textShadow = nextShadow;
          span.innerHTML = tag.innerHTML;
          tag.parentNode.replaceChild(span, tag);
          this.moveCaretAfter(span);
        });
      } else {
        // Caret active inside - DO NOTHING to avoid global shadow
        // as per user request: "only selected text should be shadowed"
      }
    } else {
      // No cursor - Global mode (shape selected by border)
      const current = this.selectedElement.style.textShadow;
      const next = (current && current !== 'none') ? 'none' : '4px 4px 6px rgba(0,0,0,0.5)';
      this.applyStyle('textShadow', next);
    }
    this.syncDataWithSelection();
  }

  changeFontSize(factor) {
    this.saveState();
    if (this.selectedElement) {
      const currentSize = parseFloat(window.getComputedStyle(this.selectedElement).fontSize);
      this.applyStyle('fontSize', (currentSize * factor) + 'px');
    }
  }

  cycleCase() {
    this.saveState();
    if (!this.selectedElement) return;

    const selection = window.getSelection();
    const isInside = (selection && selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;

    if (isInside && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      let nextText = selectedText.toUpperCase();
      if (selectedText === selectedText.toUpperCase()) nextText = selectedText.toLowerCase();
      else if (selectedText === selectedText.toLowerCase()) nextText = selectedText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      document.execCommand('insertText', false, nextText);
    } else {
      const current = this.selectedElement.innerText;
      let next = current.toUpperCase();
      if (current === current.toUpperCase()) next = current.toLowerCase();
      else if (current === current.toLowerCase()) next = current.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.selectedElement.innerText = next;
    }
    this.syncDataWithSelection();
  }

  applyCase(mode) {
    this.saveState();
    if (!this.selectedElement) return;

    const transformText = (text, mode) => {
      switch (mode) {
        case 'sentence':
          return text
            .toLowerCase()
            .replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase());
        case 'lower':
          return text.toLowerCase();
        case 'upper':
          return text.toUpperCase();
        case 'title':
          return text.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        case 'toggle':
          return text.split('').map(c =>
            c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
          ).join('');
        default:
          return text;
      }
    };

    const selection = window.getSelection();
    const isInside = (selection && selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;

    if (isInside && !selection.isCollapsed) {
      // Apply only to selected text
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const newText = transformText(selectedText, mode);
      document.execCommand('insertText', false, newText);
    } else {
      // Apply to the entire content of the element
      // Walk all text nodes and transform them
      const walker = document.createTreeWalker(this.selectedElement, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let node;
      while ((node = walker.nextNode())) nodes.push(node);
      nodes.forEach(n => { n.textContent = transformText(n.textContent, mode); });
    }
    this.syncDataWithSelection();
  }

  toggleSpacing() {
    this.saveState();
    if (!this.selectedElement) return;

    const selection = window.getSelection();
    const isInside = (selection && selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;

    if (isInside) {
      if (!selection.isCollapsed) {
        document.execCommand('styleWithCSS', false, false);
        const parentEl = selection.anchorNode.parentElement;
        const currentSpacing = window.getComputedStyle(parentEl).letterSpacing;
        const nextSpacing = (!currentSpacing || currentSpacing === 'normal' || currentSpacing === '0px') ? '4px' : 'normal';

        document.execCommand('fontSize', false, '7');
        const fontTags = this.selectedElement.querySelectorAll('font[size="7"]');
        fontTags.forEach(tag => {
          tag.removeAttribute('size');
          const span = document.createElement('span');
          span.style.letterSpacing = nextSpacing;
          span.innerHTML = tag.innerHTML;
          tag.parentNode.replaceChild(span, tag);
          this.moveCaretAfter(span);
        });
      } else {
        // Caret active inside - DO NOTHING per user's "only selected text" preference
      }
    } else {
      // Global mode
      const current = this.selectedElement.style.letterSpacing;
      const next = (!current || current === 'normal' || current === '0px') ? '4px' : 'normal';
      this.applyStyle('letterSpacing', next);
    }
    this.syncDataWithSelection();
  }

  clearFormatting() {
    this.saveState();
    if (this.selectedElement) {
      const defaults = { fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', fontSize: '18pt', fontFamily: 'Calibri', color: 'black', backgroundColor: 'transparent', textShadow: 'none' };
      Object.assign(this.selectedElement.style, defaults);
      this.syncDataWithSelection();
    }
  }

  applyStyle(prop, value) {
    this.saveState();
    if (!this.selectedElement) return;

    const selection = window.getSelection();
    const isInside = (selection && selection.rangeCount > 0 && this.selectedElement.contains(selection.anchorNode)) || document.activeElement === this.selectedElement;

    if (isInside) {
      if (!selection.isCollapsed) {
        document.execCommand('styleWithCSS', false, true);
        if (prop === 'fontFamily') {
          document.execCommand('fontName', false, value);
        } else if (prop === 'fontSize') {
          // Use the marker tag workaround for font size to be precise
          document.execCommand('styleWithCSS', false, false);
          document.execCommand('fontSize', false, '7');
          const fontTags = this.selectedElement.querySelectorAll('font[size="7"]');
          fontTags.forEach(tag => {
            tag.removeAttribute('size');
            tag.style.fontSize = value;
          });
        } else if (prop === 'lineHeight') {
          // lineHeight always applies to whole element in PPT
          this.selectedElement.style.lineHeight = value;
          this.syncDataWithSelection();
          this.syncRibbonToSelection();
          return;
        } else {
          // General case for other properties (if any more added)
          this.selectedElement.style[prop] = value;
        }
      } else {
        // Caret active inside - DO NOTHING per user requested strictness
      }
    } else {
      this.selectedElement.style[prop] = value;
    }

    this.syncDataWithSelection();
    this.syncRibbonToSelection();
  }

  syncDataWithSelection() {
    if (this.selectedElement) {
      const id = this.selectedElement.getAttribute('data-id');
      const slide = this.slides[this.currentSlideIndex];
      const el = slide.elements.find(e => e.id === id);
      if (el) {
        const cleanDiv = this.selectedElement.cloneNode(true);
        cleanDiv.querySelectorAll('.content-placeholder-grid, .resize-handle, .rotation-handle, .rotation-handle-line').forEach(n => n.remove());
        el.content = cleanDiv.innerHTML;
        // Sync persistable styles
        const persistStyles = ['textAlign', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'color', 'backgroundColor', 'textShadow', 'letterSpacing', 'direction', 'lineHeight'];
        persistStyles.forEach(s => {
          if (this.selectedElement.style[s]) el.styles[s] = this.selectedElement.style[s];
        });
        // For writing direction styles, explicitly save or clear (empty string must delete to prevent stale values)
        const directionStyles = ['writingMode', 'textOrientation'];
        directionStyles.forEach(s => {
          const val = this.selectedElement.style[s];
          if (val) {
            el.styles[s] = val;
          } else {
            delete el.styles[s]; // Explicitly remove to avoid stale vertical direction
          }
        });
        // Sync persistable attributes
        const persistAttrs = ['data-valign', 'data-columns'];
        persistAttrs.forEach(a => {
          const val = this.selectedElement.getAttribute(a);
          if (val) el.styles[a === 'data-valign' ? 'data-valign' : 'data-columns'] = val;
        });

        // Sync adjustments metadata if present
        if (this.selectedElement.dataset.adjustments) {
          el.adjustments = JSON.parse(this.selectedElement.dataset.adjustments);
        }
      }
    }
  }

  selectElement(domEl) {
    if (this.formatPainterActive && this.formatPainterStyles) {
      this.applyFormatPainterStyles(domEl);
      this.formatPainterActive = false;
      this.formatPainterStyles = null;
      if (this.formatPainterBtn) this.formatPainterBtn.classList.remove('active');
    }

    const id = domEl.id || domEl.getAttribute('data-id');
    if (this.selectedId === id && this.selectedElement) return;

    this.selectedId = id;
    this.selectedElement = domEl;
    this.lastSelectedElement = domEl;

    this.renderCanvas(); // Redraw to inject handles
    this.syncRibbonToSelection();
    this.updateSelectionPane();
  }

  deselectElement() {
    if (this.selectedId) {
      this.selectedId = null;
      this.selectedElement = null;
      this.renderCanvas(); // Redraw to remove handles
    }
  }

  handleCopy() {
    // Use currently selected element; fall back to last selected if blur fired first
    const target = this.selectedElement || this.lastSelectedElement;

    if (target) {
      const id = target.getAttribute('data-id');
      const slide = this.slides[this.currentSlideIndex];
      const el = slide && slide.elements.find(e => e.id === id);
      if (el) {
        this.clipboard = JSON.parse(JSON.stringify(el));
        this.clipboard.isSlide = false;
        // Also copy plain text to system clipboard
        const text = target.innerText || target.textContent || '';
        if (navigator.clipboard && text.trim()) {
          navigator.clipboard.writeText(text).catch(() => { });
        }
        this.showCopiedToast('Element copied');
        return;
      }
    }

    // Nothing element-level selected – copy whole slide
    const slide = this.slides[this.currentSlideIndex];
    this.clipboard = JSON.parse(JSON.stringify(slide));
    this.clipboard.isSlide = true;
    this.showCopiedToast('Slide copied');
  }

  showCopiedToast(msg = 'Copied') {
    const existing = document.getElementById('copy-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed; bottom: 36px; left: 50%; transform: translateX(-50%);
      background: #323130; color: #fff; font-size: 12px;
      padding: 6px 14px; border-radius: 4px; z-index: 9998;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      pointer-events: none;
      animation: fadeInOut 1.6s ease forwards;
    `;
    // inject keyframes once
    if (!document.getElementById('copy-toast-style')) {
      const style = document.createElement('style');
      style.id = 'copy-toast-style';
      style.textContent = `@keyframes fadeInOut {
        0%   { opacity: 0; transform: translateX(-50%) translateY(6px); }
        15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
        75%  { opacity: 1; }
        100% { opacity: 0; }
      }`;
      document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1700);
  }


  handleCut() {
    this.saveState();
    if (this.selectedElement) {
      this.handleCopy();
      this.deleteSelectedElement();
    } else {
      this.handleCopy();
      this.deleteCurrentSlide();
    }
  }

  closePasteDropdown() {
    if (this.pasteDropdown) this.pasteDropdown.classList.remove('show');
  }

  handlePaste(mode = 'keep') {
    this.saveState();
    if (!this.clipboard) return;

    if (this.clipboard.isSlide) {
      const newSlide = JSON.parse(JSON.stringify(this.clipboard));
      newSlide.id = Date.now();
      newSlide.elements.forEach((el, index) => {
        el.id = this.getNextId();
      });
      this.slides.splice(this.currentSlideIndex + 1, 0, newSlide);
      this.currentSlideIndex++;
      this.render();
      return;
    }

    const slide = this.slides[this.currentSlideIndex];
    if (slide) {
      const newEl = JSON.parse(JSON.stringify(this.clipboard));
      newEl.id = this.getNextId();

      if (newEl.styles.top && newEl.styles.left) {
        newEl.styles.top = (parseInt(newEl.styles.top) + 20) + 'px';
        newEl.styles.left = (parseInt(newEl.styles.left) + 20) + 'px';
      }

      // 'destination' mode: strip formatting styles so element inherits default slide styles
      if (mode === 'destination') {
        const layoutStyles = { top: newEl.styles.top, left: newEl.styles.left, width: newEl.styles.width, height: newEl.styles.height };
        newEl.styles = layoutStyles;
        // Strip inline HTML tags from content to remove source formatting
        if (newEl.content) {
          const tmp = document.createElement('div');
          tmp.innerHTML = newEl.content;
          newEl.content = tmp.innerText || tmp.textContent || '';
        }
      }

      slide.elements.push(newEl);
      this.renderCanvas();

      setTimeout(() => {
        const pastedDOM = document.querySelector(`[data-id="${newEl.id}"]`);
        if (pastedDOM) {
          this.selectElement(pastedDOM);
        }
      }, 0);
    }
  }

  showPasteSpecialDialog() {
    if (!this.clipboard) {
      alert('Nothing to paste. Copy or cut an element first.');
      return;
    }

    // Build a simple Paste Special modal
    const existing = document.getElementById('paste-special-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'paste-special-modal';
    modal.style.cssText = `
      position:fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.4); z-index:9999;
      display:flex; align-items:center; justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:#fff; border:1px solid #c8c6c4; box-shadow:0 8px 24px rgba(0,0,0,0.2);
                  border-radius:4px; padding:20px 24px; min-width:340px; font-family:'Segoe UI',sans-serif;">
        <div style="font-size:15px; font-weight:600; border-bottom:1px solid #edebe9; padding-bottom:10px; margin-bottom:14px;">Paste Special</div>
        <div style="font-size:13px; color:#323130; margin-bottom:14px;">Choose a paste format:</div>
        <div id="psp-options" style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
          <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px;">
            <input type="radio" name="psp" value="keep" checked style="accent-color:#0078d4;"> Keep Source Formatting
          </label>
          <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px;">
            <input type="radio" name="psp" value="destination"> Use Destination Theme
          </label>
          <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px;">
            <input type="radio" name="psp" value="text"> Paste as Text Only
          </label>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="psp-ok" style="background:#0078d4; color:#fff; border:none; padding:6px 18px; border-radius:3px;
                  font-size:13px; cursor:pointer;">OK</button>
          <button id="psp-cancel" style="background:#fff; color:#323130; border:1px solid #c8c6c4; padding:6px 18px;
                  border-radius:3px; font-size:13px; cursor:pointer;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('psp-ok').onclick = () => {
      const chosen = modal.querySelector('input[name="psp"]:checked').value;
      modal.remove();
      this.handlePaste(chosen);
    };
    document.getElementById('psp-cancel').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }
  showLineSpacingOptionsDialog() {
    const existing = document.getElementById('line-spacing-modal');
    if (existing) existing.remove();

    // Get current line-height of the selected element
    const currentLH = (this.selectedElement && this.selectedElement.style.lineHeight) || '1';
    const currentLHNum = parseFloat(currentLH) || 1;

    const modal = document.createElement('div');
    modal.id = 'line-spacing-modal';
    modal.style.cssText = `
      position:fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.35); z-index:9999;
      display:flex; align-items:center; justify-content:center;
      font-family:'Segoe UI',sans-serif;
    `;
    modal.innerHTML = `
      <div style="background:#fff; border:1px solid #c8c6c4; box-shadow:0 8px 24px rgba(0,0,0,0.2);
                  border-radius:4px; padding:0; min-width:380px; max-width:400px;">
        <div style="background:#f3f2f1; padding:10px 16px; border-bottom:1px solid #edebe9; font-size:14px; font-weight:600;">Paragraph</div>
        <div style="padding:16px 20px;">
          <div style="font-size:12px; font-weight:600; color:#323130; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.03em;">Spacing</div>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr>
              <td style="padding:4px 0; color:#605e5d; width:50%;">Before text:</td>
              <td style="padding:4px 0;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <input id="ls-before" type="number" min="0" max="200" step="6" value="0"
                    style="width:60px; padding:3px 6px; border:1px solid #c8c6c4; border-radius:2px; font-size:13px;">
                  <span style="color:#605e5d;">pt</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#605e5d;">After text:</td>
              <td style="padding:4px 0;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <input id="ls-after" type="number" min="0" max="200" step="6" value="0"
                    style="width:60px; padding:3px 6px; border:1px solid #c8c6c4; border-radius:2px; font-size:13px;">
                  <span style="color:#605e5d;">pt</span>
                </div>
              </td>
            </tr>
          </table>
          <hr style="border:none; border-top:1px solid #edebe9; margin:12px 0;">
          <div style="font-size:12px; font-weight:600; color:#323130; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.03em;">Line Spacing</div>
          <div style="display:flex; align-items:center; gap:10px; font-size:13px;">
            <label style="color:#605e5d; white-space:nowrap;">Multiple:</label>
            <input id="ls-multiple" type="number" min="0.5" max="10" step="0.5" value="${currentLHNum}"
              style="width:70px; padding:3px 6px; border:1px solid #c8c6c4; border-radius:2px; font-size:13px;">
            <span style="color:#605e5d;">lines</span>
          </div>
          <div style="font-size:11px; color:#605e5d; margin-top:8px; line-height:1.4;">
            Common values: 1.0 (single), 1.5, 2.0 (double), 2.5, 3.0
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; padding:10px 16px; border-top:1px solid #edebe9;">
          <button id="ls-ok" style="background:#0078d4; color:#fff; border:none; padding:6px 20px;
                  border-radius:2px; font-size:13px; cursor:pointer; font-family:'Segoe UI',sans-serif;">OK</button>
          <button id="ls-cancel" style="background:#fff; color:#323130; border:1px solid #c8c6c4; padding:6px 20px;
                  border-radius:2px; font-size:13px; cursor:pointer; font-family:'Segoe UI',sans-serif;">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('ls-ok').onclick = () => {
      const multiple = parseFloat(document.getElementById('ls-multiple').value) || 1;
      const before = parseInt(document.getElementById('ls-before').value) || 0;
      const after = parseInt(document.getElementById('ls-after').value) || 0;

      if (this.selectedElement) {
        this.saveState();
        this.selectedElement.style.lineHeight = String(multiple);
        if (before > 0) this.selectedElement.style.marginTop = before + 'pt';
        if (after > 0) this.selectedElement.style.marginBottom = after + 'pt';
        this.syncDataWithSelection();
        this.syncRibbonToSelection();
      }
      modal.remove();
    };

    document.getElementById('ls-cancel').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }



  deleteSelectedElement() {
    this.saveState();
    if (this.selectedElement) {
      const id = this.selectedElement.getAttribute('data-id');
      const slide = this.slides[this.currentSlideIndex];
      slide.elements = slide.elements.filter(e => e.id !== id);
      this.selectedElement.remove();
      this.selectedElement = null;
      this.syncRibbonToSelection();
    }
  }

  deleteCurrentSlide() {
    this.saveState();
    if (this.slides.length > 1) {
      this.slides.splice(this.currentSlideIndex, 1);
      if (this.currentSlideIndex >= this.slides.length) {
        this.currentSlideIndex = this.slides.length - 1;
      }
      this.render();
    } else {
      this.resetCurrentSlide();
    }
  }

  toggleFormatPainter() {
    if (!this.selectedElement) return;

    this.formatPainterActive = !this.formatPainterActive;
    if (this.formatPainterBtn) {
      this.formatPainterBtn.classList.toggle('active', this.formatPainterActive);
    }

    if (this.formatPainterActive) {
      const id = this.selectedElement.getAttribute('data-id');
      const slide = this.slides[this.currentSlideIndex];
      const el = slide.elements.find(e => e.id === id);
      if (el) {
        this.formatPainterStyles = JSON.parse(JSON.stringify(el.styles));
      } else {
        this.formatPainterStyles = null;
        this.formatPainterActive = false;
        if (this.formatPainterBtn) this.formatPainterBtn.classList.remove('active');
      }
    } else {
      this.formatPainterStyles = null;
    }
  }

  applyFormatPainterStyles(targetDomEl) {
    if (!this.formatPainterStyles) return;

    const id = targetDomEl.getAttribute('data-id');
    const slide = this.slides[this.currentSlideIndex];
    const targetEl = slide.elements.find(e => e.id === id);

    if (targetEl) {
      const { top, left, width, height, ...stylesToApply } = this.formatPainterStyles;
      Object.assign(targetEl.styles, stylesToApply);
      Object.assign(targetDomEl.style, stylesToApply);
      this.syncDataWithSelection();
    }
  }



  handleTextSelection() {
    if (!this.miniToolbar) return;

    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
      this.miniToolbar.style.display = 'none';
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Ensure selection is within a text element
    let container = range.commonAncestorContainer;
    if (container.nodeType === 3) container = container.parentNode;
    const isTextElement = container.closest('.canvas-element[data-type="text"]') || container.closest('[contenteditable="true"]');

    if (!isTextElement || rect.width === 0) {
      this.miniToolbar.style.display = 'none';
      return;
    }

    // Position toolbar above selection
    this.miniToolbar.style.display = 'flex';
    const toolbarRect = this.miniToolbar.getBoundingClientRect();

    // Calculate position (relative to document/viewport)
    let top = rect.top - toolbarRect.height - 10 + window.scrollY;
    let left = rect.left + (rect.width / 2) - (toolbarRect.width / 2) + window.scrollX;

    // Boundary checks
    if (top < 0) top = rect.bottom + 10 + window.scrollY;
    if (left < 0) left = 10;
    if (left + toolbarRect.width > window.innerWidth) left = window.innerWidth - toolbarRect.width - 10;

    this.miniToolbar.style.top = `${top}px`;
    this.miniToolbar.style.left = `${left}px`;

    this.syncMiniToolbarActiveState();
  }

  syncMiniToolbarActiveState() {
    if (!this.miniToolbar) return;
    this.miniToolBtns.forEach(btn => {
      const cmd = btn.getAttribute('data-command');
      if (cmd) {
        const isActive = document.queryCommandState(cmd);
        btn.classList.toggle('active', isActive);
      }
    });
  }

  syncRibbonToSelection() {
    if (!this.selectedElement) return;
    const computed = window.getComputedStyle(this.selectedElement);
    if (this.boldBtn) this.boldBtn.classList.toggle('active', computed.fontWeight === 'bold' || parseInt(computed.fontWeight) >= 700);
    if (this.italicBtn) this.italicBtn.classList.toggle('active', computed.fontStyle === 'italic');
    if (this.fontSelect) {
      const fontName = computed.fontFamily.split(',')[0].replace(/"/g, '');
      const option = Array.from(this.fontSelect.options).find(opt => opt.value === fontName || opt.text === fontName);
      if (option) this.fontSelect.value = fontName;
      if (this.spacingOptions) {
        // Read the inline lineHeight first, then fall back to computed
        const inlineLH = this.selectedElement.style.lineHeight;
        const currentLH = inlineLH || window.getComputedStyle(this.selectedElement).lineHeight;
        // Normalise to a numeric multiplier string (e.g. "1.5") for comparison
        const normLH = (v) => {
          if (!v || v === 'normal') return '1';
          // If already a plain number string (no 'px'), return as-is
          if (!isNaN(parseFloat(v)) && !v.endsWith('px')) return String(parseFloat(v));
          return v;
        };
        const activeLH = normLH(currentLH);
        let matched = false;
        this.spacingOptions.forEach(opt => {
          if (opt.classList.contains('link-option')) return;
          opt.classList.remove('selected');
          if (normLH(opt.getAttribute('data-line-height')) === activeLH) {
            opt.classList.add('selected');
            matched = true;
          }
        });
        if (!matched && this.spacingOptions[0]) this.spacingOptions[0].classList.add('selected');
      }
    }
    if (this.sizeSelect) {
      let fSize = this.selectedElement.style.fontSize || computed.fontSize;
      if (fSize.endsWith('pt')) {
        fSize = fSize.replace('pt', '');
      } else if (fSize.endsWith('px')) {
        // approximate px to pt conversion (1pt = 1.333px)
        fSize = Math.round(parseFloat(fSize) * 0.75);
      }
      this.sizeSelect.value = fSize;
    }
  }

  // --- Rendering ---
  render() {
    this.renderSlideList();
    this.renderCanvas();
    this.updateStatus();
    if (window.lucide) window.lucide.createIcons();
    this.scaleCanvas();
  }

  renderSlideList() {
    this.slideList.innerHTML = '';

    // If no sections exist, render a flat list
    if (this.sections.length === 0) {
      this.slides.forEach((slide, index) => {
        this.slideList.appendChild(this.createSlideThumb(slide, index));
      });
      return;
    }

    // Render grouped by sections
    this.sections.forEach(section => {
      const sectionGroup = document.createElement('div');
      sectionGroup.className = `section-group ${section.collapsed ? 'collapsed' : ''}`;

      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `
        <i data-lucide="chevron-down" class="section-collapse-icon"></i>
        <span class="section-title">${section.name}</span>
      `;
      header.onclick = () => {
        section.collapsed = !section.collapsed;
        this.renderSlideList();
        if (window.lucide) window.lucide.createIcons();
      };

      sectionGroup.appendChild(header);

      this.slides.forEach((slide, index) => {
        if (slide.sectionId === section.id || (!slide.sectionId && section === this.sections[0])) {
          sectionGroup.appendChild(this.createSlideThumb(slide, index));
        }
      });

      this.slideList.appendChild(sectionGroup);
    });
  }

  createSlideThumb(slide, index) {
    const thumb = document.createElement('div');
    thumb.className = `slide-thumb ${index === this.currentSlideIndex ? 'active' : ''} ${slide.hidden ? 'hidden-slide' : ''}`;

    // Add visual indicator for hidden slide (crossed out number)
    const numContent = slide.hidden
      ? `<span class="slide-number"><strike>${index + 1}</strike></span>`
      : `<span class="slide-number">${index + 1}</span>`;

    thumb.innerHTML = `${numContent}<div class="thumb-content"></div>`;
    thumb.onclick = () => { this.currentSlideIndex = index; this.render(); };
    return thumb;
  }

  renderCanvas() {
    this.canvas.innerHTML = '';
    const slide = this.slides[this.currentSlideIndex];
    if (!slide) return;

    // Apply High Fidelity Theme Styles
    const theme = slide.theme || { bg: '#ffffff', text: '#323130' };
    this.canvas.style.backgroundColor = slide.background || theme.bg || '#ffffff';
    this.canvas.style.color = theme.text || '#323130';

    // Remove old theme classes and apply new one (preserve base 'canvas' class)
    this.canvas.className = 'canvas';
    if (theme.bgClass) this.canvas.classList.add(theme.bgClass);

    // Add Theme Accents (e.g., Red Bar, Green Fold)
    if (theme.accentElement) {
      const accent = document.createElement('div');
      accent.className = theme.accentElement;
      this.canvas.appendChild(accent);
    }

    slide.elements.forEach((el) => {
      const div = document.createElement('div');
      div.id = el.id;
      div.setAttribute('data-id', el.id);
      div.className = `canvas-element ${el.type}`;
      if (theme.placeholderClass) div.classList.add(theme.placeholderClass);

      div.contentEditable = el.type === 'text';
      if (el.placeholderText) div.setAttribute('data-placeholder', el.placeholderText);

      // Apply styles and attributes from model
      const { backgroundColor, clipPath, ...containerStyles } = el.styles;
      Object.assign(div.style, containerStyles);
      // Ensure writing-mode never bleeds from a previous element or default state
      div.style.writingMode = containerStyles.writingMode || '';
      div.style.textOrientation = containerStyles.textOrientation || '';
      div.style.transform = containerStyles.transform || '';

      if (el.type === 'shape' && el.shapeType) {
        const shapeContent = document.createElement('div');
        shapeContent.className = 'shape-content';
        shapeContent.style.backgroundColor = backgroundColor || '#d83b01';
        div.appendChild(shapeContent);

        const dynamicPath = this.getShapeClipPath(el.shapeType, el.adjustments);
        if (dynamicPath) {
          shapeContent.style.clipPath = dynamicPath;
          shapeContent.classList.add('shape-dynamic');
          div.dataset.adjustments = JSON.stringify(el.adjustments || {});

          // Adjustment handles removed per user request
        } else {
          shapeContent.classList.add(`shape-${el.shapeType}`);
        }
      }
      if (el.styles['data-valign']) div.setAttribute('data-valign', el.styles['data-valign']);
      if (el.styles['data-columns']) div.setAttribute('data-columns', el.styles['data-columns']);



      if (el.type === 'text') {
        const togglePlaceholder = () => {
          const testDiv = div.cloneNode(true);
          testDiv.querySelectorAll('.content-placeholder-grid').forEach(g => g.remove());
          testDiv.querySelectorAll('.resize-handle').forEach(h => h.remove());
          let html = testDiv.innerHTML.trim();

          const isEmpty = (!html || html === '<br>' || html === '<br/>' || html === '<div><br></div>' || html === '<div><br/></div>' || html === '<p><br></p>');
          const isOnlyEmptyBullet = (html === '<ul><li><br></li></ul>' || html === '<ul><li></li></ul>' || html === '<ul><li><br/></li></ul>');

          if (isEmpty || isOnlyEmptyBullet) {
            div.classList.add('show-placeholder');
            if (isOnlyEmptyBullet && el.isContent) div.classList.add('bullet-placeholder');
            else div.classList.remove('bullet-placeholder');
          } else {
            div.classList.remove('show-placeholder');
            div.classList.remove('bullet-placeholder');
          }

          const grid = div.querySelector('.content-placeholder-grid');
          if (grid) {
            grid.style.display = (isEmpty || isOnlyEmptyBullet) ? 'grid' : 'none';
          }
        };

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = el.content;
        tempDiv.querySelectorAll('.content-placeholder-grid, .resize-handle, .rotation-handle, .rotation-handle-line').forEach(g => g.remove());
        el.content = tempDiv.innerHTML;
        div.innerHTML = el.content;

        let hasSavedInSession = false;
        div.onfocus = () => {
          hasSavedInSession = false;
        };

        div.oninput = () => {
          if (!hasSavedInSession) {
            this.saveState();
            hasSavedInSession = true;
          }
          const cleanDiv = div.cloneNode(true);
          cleanDiv.querySelectorAll('.content-placeholder-grid, .resize-handle, .rotation-handle, .rotation-handle-line').forEach(n => n.remove());
          el.content = cleanDiv.innerHTML;
          togglePlaceholder();
        };
        togglePlaceholder();

        if (el.isContent) {
          const grid = document.createElement('div');
          grid.className = 'content-placeholder-grid';
          const icons = [
            {
              id: 'image-local', html: `<div class="ph-icon-wrapper">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#605e5d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                 <circle cx="8.5" cy="8.5" r="1.5"></circle>
                 <polyline points="21 15 16 10 5 21"></polyline>
               </svg>
               <div class="ph-badge blue">
                 <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
               </div>
             </div>` },
            {
              id: 'stock-images', html: `<div class="ph-icon-wrapper">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#605e5d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                 <polyline points="14 2 14 8 20 8"></polyline>
                 <line x1="16" y1="13" x2="8" y2="13"></line>
                 <line x1="16" y1="17" x2="8" y2="17"></line>
               </svg>
               <div class="ph-badge green">
                 <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
               </div>
             </div>` },
            {
              id: 'online-pictures', html: `<div class="ph-icon-wrapper">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#605e5d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                 <path d="M9 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
                 <path d="M3 21v-2a4 4 0 0 1 4-4h4"></path>
               </svg>
               <div class="ph-badge blue" style="background-color: white; border: none; width:14px; height:14px; right:-4px; bottom:-4px; border-radius:50%; box-shadow: 0 0 0 1px white;">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
               </div>
             </div>` },
            {
              id: 'video-local', html: `<div class="ph-icon-wrapper">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#605e5d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M23 7l-7 5 7 5V7z"></path>
                 <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
               </svg>
               <div class="ph-badge blue">
                 <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
               </div>
             </div>` },
            {
              id: 'insert-table', html: `<div class="ph-icon-wrapper">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#605e5d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                 <line x1="3" y1="9" x2="21" y2="9" stroke="#107c10" stroke-width="1.5"></line>
                 <line x1="3" y1="15" x2="21" y2="15"></line>
                 <line x1="9" y1="3" x2="9" y2="21"></line>
                 <line x1="15" y1="3" x2="15" y2="21"></line>
               </svg>
             </div>` },
            {
              id: 'insert-chart', html: `<div class="ph-icon-wrapper">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0078d4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                 <rect x="16" y="8" width="4" height="12" fill="#0078d4" stroke="none"></rect>
                 <rect x="10" y="4" width="4" height="16" fill="#0078d4" stroke="none"></rect>
                 <rect x="4" y="12" width="4" height="8" fill="#0078d4" stroke="none"></rect>
                 <line x1="3" y1="20" x2="21" y2="20" stroke="#605e5d" stroke-width="1.5"></line>
                 <line x1="3" y1="4" x2="3" y2="4" stroke="#605e5d" stroke-width="1.5"></line>
               </svg>
             </div>` }
          ];
          grid.contentEditable = 'false';
          icons.forEach(cfg => {
            const btn = document.createElement('div');
            btn.className = 'placeholder-icon';
            btn.setAttribute('data-type', cfg.id);
            btn.contentEditable = 'false';
            btn.innerHTML = cfg.html;
            btn.onclick = (e) => {
              e.stopPropagation();
              console.log('Placeholder icon clicked:', cfg.id);
              if (cfg.id === 'image-local') {
                const input = document.getElementById('insert-image-input');
                if (input) input.click();
              } else if (cfg.id === 'video-local') {
                const input = document.getElementById('insert-video-input');
                if (input) input.click();
              } else if (cfg.id === 'insert-table') {
                const tableModal = document.getElementById('insert-table-modal');
                if (tableModal) {
                  document.getElementById('table-cols-input').value = '5';
                  document.getElementById('table-rows-input').value = '2';
                  tableModal.style.display = 'flex';
                }
              } else if (cfg.id === 'insert-chart') {
                const chartModal = document.getElementById('insert-chart-modal');
                if (chartModal) chartModal.style.display = 'flex';
              } else if (cfg.id === 'stock-images') {
                alert('Stock Images library is not implemented yet.');
              } else if (cfg.id === 'online-pictures') {
                alert('Online Pictures search is not implemented yet.');
              }
            };
            grid.appendChild(btn);
          });
          div.appendChild(grid);
          togglePlaceholder();
        }
      } else if (el.type !== 'shape') {
        div.innerHTML = el.content || '';
      }

      // Inject Selection UI (Handles and Rotation) if selected
      const isSelected = (el.id === this.selectedId);
      if (isSelected) {
        div.classList.add('selected');
        this.selectedElement = div; // Update live reference

        // Rotation Handle
        const rotLine = document.createElement('div');
        rotLine.className = 'rotation-handle-line';
        rotLine.contentEditable = 'false';
        div.appendChild(rotLine);
        const rotHandle = document.createElement('div');
        rotHandle.className = 'rotation-handle';
        rotHandle.contentEditable = 'false';
        div.appendChild(rotHandle);

        // Resize Handles
        const handleClasses = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'];
        handleClasses.forEach(pos => {
          const handle = document.createElement('div');
          handle.className = `resize-handle handle-${pos}`;
          handle.contentEditable = 'false';
          div.appendChild(handle);
        });
      }

      div.onmousedown = (e) => {
        if (this.drawMode) return; // Prevent selection/drag while drawing

        // Prevent drag/select if clicking on a placeholder icon
        if (e.target.closest('.placeholder-icon')) return;

        // --- NEW: Handle selection/resizing logic ---
        const handle = e.target.closest('.resize-handle');
        if (handle) {
          e.stopPropagation();
          this.selectElement(div);
          this.makeResizable(div, el, handle, e);
          return;
        }

        const rotHandle = e.target.closest('.rotation-handle');
        if (rotHandle) {
          e.stopPropagation();
          this.selectElement(div);
          this.makeRotatable(div, el, rotHandle, e);
          return;
        }



        if (el.type === 'text' || el.type === 'table') {
          const rect = div.getBoundingClientRect();
          const margin = 15;
          const isNearEdge =
            e.clientX - rect.left < margin ||
            rect.right - e.clientX < margin ||
            e.clientY - rect.top < margin ||
            rect.bottom - e.clientY < margin;

          if (!isNearEdge) {
            this.selectElement(div);
            // Don't focus immediately if it's a table, let them click into a cell
            if (el.type === 'text' && document.activeElement !== div) div.focus();
            return;
          }
        }

        e.stopPropagation();
        this.selectElement(div);
        if (el.type === 'text' && document.activeElement !== div) div.focus();
        this.makeDraggable(div, el, e);
      };

      this.canvas.appendChild(div);

      // --- RE-SELECT LOGIC ---
      // If this is the element that was selected, update the reference to the new DOM node
      if (this.selectedId && this.selectedId === el.id) {
        this.selectedElement = div;
        div.classList.add('selected');
        // Ensure handles are updated/shown if it's the selected element
        if (el.type === 'text' || el.type === 'shape' || el.type === 'image' || el.type === 'video' || el.type === 'table') {
          // handles are already added in the loop above for selected elements
        }
      }
    });

    // If the previously selected element no longer exists in this slide/context, clear selection
    if (this.selectedId) {
      const slide = this.slides[this.currentSlideIndex];
      const stillExists = slide && slide.elements.find(e => e.id === this.selectedId);
      if (!stillExists) {
        this.selectedId = null;
        this.selectedElement = null;
      }
    }
    if (window.lucide) window.lucide.createIcons();
  }

  setupInsertTab() {
    // Dropdown Toggling
    // Dropdown Toggling for entire button and tiny arrow
    const dropdownBtns = document.querySelectorAll('.split-button.dropdown');
    dropdownBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const dropdown = btn.querySelector('.ribbon-dropdown-menu');
        if (!dropdown) return; // Safety check if menu doesn't exist
        const isShown = dropdown.classList.contains('show');
        document.querySelectorAll('.ribbon-dropdown-menu').forEach(m => m.classList.remove('show'));
        if (!isShown) dropdown.classList.add('show');
      };
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.ribbon-dropdown-menu').forEach(m => m.classList.remove('show'));
    });

    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          console.log(`Ribbon click: ${id}`);
          fn(e);
        });
      } else {
        console.warn(`Could not find element with ID: ${id}`);
      }
    };

    // Table Picker Grid Interaction
    const tableGrid = document.getElementById('table-picker-grid');
    if (tableGrid) {
      tableGrid.onmouseleave = () => this.highlightTableGrid(0, 0);
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 10; c++) {
          const cell = document.createElement('div');
          cell.className = 'table-cell';
          cell.dataset.row = r + 1;
          cell.dataset.col = c + 1;
          cell.onmouseover = () => this.highlightTableGrid(r + 1, c + 1);
          cell.onclick = (e) => {
            e.stopPropagation();
            this.insertTable(r + 1, c + 1);
            cell.closest('.ribbon-dropdown-menu').classList.remove('show');
          };
          tableGrid.appendChild(cell);
        }
      }
    }

    // Pictures -> This Device
    const picDeviceBtn = document.getElementById('pictures-device-btn');
    if (picDeviceBtn) {
      picDeviceBtn.onclick = () => document.getElementById('insert-image-input').click();
    }

    const imageInput = document.getElementById('insert-image-input');
    if (imageInput) {
      imageInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => this.insertImage(re.target.result);
          reader.readAsDataURL(file);
        }
      };
    }

    // Pictures Dropdown items
    const bindDropdownItem = (textMatch, handler) => {
      document.querySelectorAll('.dropdown-item').forEach(item => {
        if (item.textContent.includes(textMatch)) {
          item.onclick = (e) => {
            e.stopPropagation();
            handler();
            item.closest('.ribbon-dropdown-menu').classList.remove('show');
          };
        }
      });
    };

    bindDropdownItem('Stock Images...', () => alert('Stock Images dialog not implemented yet.'));
    bindDropdownItem('Online Pictures...', () => alert('Online Pictures dialog not implemented yet.'));
    bindDropdownItem('Screen Clipping', () => alert('Screen Clipping not implemented yet.'));

    // Photo Album
    const albumBtn = document.getElementById('new-album-btn');
    if (albumBtn) {
      albumBtn.onclick = (e) => {
        e.stopPropagation();
        document.getElementById('insert-photo-album-input').click();
        albumBtn.closest('.ribbon-dropdown-menu').classList.remove('show');
      };
    }

    const albumInput = document.getElementById('insert-photo-album-input');
    if (albumInput) {
      albumInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (re) => this.insertImage(re.target.result);
          reader.readAsDataURL(file);
        });
      };
    }

    // Cameo
    const cameoThisBtn = document.getElementById('cameo-this-slide');
    if (cameoThisBtn) {
      cameoThisBtn.onclick = (e) => {
        e.stopPropagation();
        this.insertCameo();
        cameoThisBtn.closest('.ribbon-dropdown-menu').classList.remove('show');
      };
    }
    const cameoAllBtn = document.getElementById('cameo-all-slides');
    if (cameoAllBtn) {
      cameoAllBtn.onclick = (e) => {
        e.stopPropagation();
        alert('Insert Cameo to All Slides not implemented yet.');
        cameoAllBtn.closest('.ribbon-dropdown-menu').classList.remove('show');
      };
    }

    // Table specific buttons
    bindDropdownItem('Insert Table...', () => {
      const tableModal = document.getElementById('insert-table-modal');
      if (tableModal) {
        document.getElementById('table-cols-input').value = '5';
        document.getElementById('table-rows-input').value = '2';
        tableModal.style.display = 'flex';
      }
    });
    bindDropdownItem('Draw Table', () => alert('Draw Table not implemented yet.'));
    bindDropdownItem('Excel Spreadsheet', () => alert('Excel Spreadsheet integration not implemented yet.'));

    // New Items
    bind('insert-new-slide-btn', () => this.addSlide('content'));
    bind('insert-comment-btn', () => this.insertComment());
    bind('insert-link-btn', () => this.insertLink());
    bind('insert-datetime-btn', () => this.insertDateTime());
    bind('insert-slidenumber-btn', () => this.insertSlideNumber());
    bind('insert-equation-btn', () => this.insertEquation());
    bind('insert-textbox-btn', () => this.addTextBox());
    bind('insert-wordart-btn', () => this.addWordArt());
    bind('insert-shapes-btn', () => console.log("Shapes dropdown not implemented yet"));
    bind('insert-icons-btn', () => console.log("Icons dialog not implemented yet"));

    const symbolBtn = document.getElementById('insert-symbol-btn');
    const symbolPopup = document.getElementById('symbol-picker-popup');
    if (symbolBtn && symbolPopup) {
      symbolBtn.onclick = (e) => {
        e.stopPropagation();
        console.log("Toggle Symbol Popup");
        symbolPopup.style.display = symbolPopup.style.display === 'none' ? 'block' : 'none';
        symbolPopup.style.top = (e.clientY + 10) + 'px';
        symbolPopup.style.left = e.clientX + 'px';
        document.getElementById('popup-overlay').style.display = 'block';
      };
    }

    document.querySelectorAll('.symbol-picker-grid span').forEach(span => {
      span.onclick = () => {
        this.insertTextAtSelection(span.dataset.symbol);
        symbolPopup.style.display = 'none';
        document.getElementById('popup-overlay').style.display = 'none';
      };
    });

    // Links, Comments, Date/Time, Slide Number, Equation
    const linkBtn = document.getElementById('insert-link-btn');
    if (linkBtn) linkBtn.onclick = () => this.insertLink();

    const commentBtn = document.getElementById('insert-comment-btn');
    if (commentBtn) commentBtn.onclick = () => this.insertComment();

    const dateTimeBtn = document.getElementById('insert-datetime-btn');
    if (dateTimeBtn) dateTimeBtn.onclick = () => this.insertDateTime();

    const slideNumBtn = document.getElementById('insert-slidenumber-btn');
    if (slideNumBtn) slideNumBtn.onclick = () => this.insertSlideNumber();

    const equationBtn = document.getElementById('insert-equation-btn');
    if (equationBtn) equationBtn.onclick = () => this.insertEquation();

    // Media
    const videoBtn = document.getElementById('insert-video-btn');
    if (videoBtn) videoBtn.onclick = () => document.getElementById('insert-video-input').click();

    const videoInput = document.getElementById('insert-video-input');
    if (videoInput) {
      videoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          this.insertVideo(url);
        }
      };
    }

    const audioBtn = document.getElementById('insert-audio-btn');
    if (audioBtn) audioBtn.onclick = () => document.getElementById('insert-audio-input').click();

    const audioInput = document.getElementById('insert-audio-input');
    if (audioInput) {
      audioInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          this.insertAudio(url);
        }
      };
    }

    // Insert Chart Modal Handlers
    const chartBtn = document.getElementById('insert-chart-btn');
    if (chartBtn) {
      chartBtn.onclick = () => {
        const modal = document.getElementById('insert-chart-modal');
        if (modal) modal.style.display = 'flex';
      };
    }

    const chartCatBtns = document.querySelectorAll('.chart-cat-btn');
    chartCatBtns.forEach(btn => {
      btn.onclick = () => {
        chartCatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const catName = btn.textContent.trim();
        this.updateChartModalUI(catName);
      };
    });

    const bindGalleryItems = () => {
      const chartGalleryItems = document.querySelectorAll('.chart-gallery-item');
      chartGalleryItems.forEach(item => {
        item.onclick = () => {
          chartGalleryItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        };
      });
    };
    bindGalleryItems();
    this.bindGalleryItems = bindGalleryItems;

    const closeChartModal = () => {
      const modal = document.getElementById('insert-chart-modal');
      if (modal) modal.style.display = 'none';
    };

    const closeChartBtn = document.getElementById('close-insert-chart');
    if (closeChartBtn) closeChartBtn.onclick = closeChartModal;

    const cancelChartBtn = document.getElementById('insert-chart-cancel-btn');
    if (cancelChartBtn) cancelChartBtn.onclick = closeChartModal;

    const okChartBtn = document.getElementById('insert-chart-ok-btn');
    if (okChartBtn) {
      okChartBtn.onclick = () => {
        this.insertChart();
        closeChartModal();
      };
    }

    // Insert Table Modal Handlers
    const closeTableModal = () => {
      const modal = document.getElementById('insert-table-modal');
      if (modal) modal.style.display = 'none';
    };

    const closeTableBtn = document.getElementById('close-insert-table');
    if (closeTableBtn) closeTableBtn.onclick = closeTableModal;

    const cancelTableBtn = document.getElementById('insert-table-cancel-btn');
    if (cancelTableBtn) cancelTableBtn.onclick = closeTableModal;

    const okTableBtn = document.getElementById('insert-table-ok-btn');
    if (okTableBtn) {
      okTableBtn.onclick = () => {
        const colsInput = document.getElementById('table-cols-input');
        const rowsInput = document.getElementById('table-rows-input');

        const cols = parseInt(colsInput ? colsInput.value : '5', 10);
        const rows = parseInt(rowsInput ? rowsInput.value : '2', 10);

        if (cols > 0 && rows > 0) {
          this.insertTable(rows, cols);
        }

        closeTableModal();
      };
    }
  }

  highlightTableGrid(rows, cols) {
    const cells = document.querySelectorAll('.table-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      if (r <= rows && c <= cols) {
        cell.classList.add('highlight');
      } else {
        cell.classList.remove('highlight');
      }
    });
    const label = document.getElementById('table-picker-label');
    if (label) label.innerText = `${cols}x${rows} Table`;
  }

  insertTable(rows, cols) {
    this.saveState();
    let tableHtml = '<table style="width:100%; height:100%; border-collapse:collapse; font-family:\'Segoe UI\', sans-serif;">';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      let isHeader = r === 0;
      let bgColor = isHeader ? '#1f618d' : (r % 2 === 0 ? '#ffffff' : '#d4d9de');
      let color = isHeader ? 'white' : '#333';
      let fontWeight = isHeader ? 'bold' : 'normal';
      let borderStyle = '1px solid #ffffff';
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td contenteditable="true" style="border:${borderStyle}; padding:8px; background-color:${bgColor}; color:${color}; font-weight:${fontWeight}; font-size:14px; min-width: 50px;">&nbsp;</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table>';

    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    const elData = {
      id,
      type: 'table',
      content: tableHtml,
      styles: {
        top: '100px',
        left: '100px',
        width: (cols * 60) + 'px',
        height: (rows * 30) + 'px',
        position: 'absolute',
        background: '#fff',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
  }

  updateChartModalUI(catName) {
    const rowEl = document.querySelector('.chart-gallery-row');
    const previewEl = document.querySelector('.chart-preview-box');
    const titleEl = document.querySelector('.chart-preview-area h3');
    if (!rowEl || !previewEl || !titleEl) return;

    titleEl.textContent = catName + ' Chart';

    if (catName.includes('Line')) {
      rowEl.innerHTML = `
        <div class="chart-gallery-item active">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line><line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
            <polyline points="4,22 12,12 20,18 28,10" fill="none" stroke="#5b9bd5" stroke-width="2"></polyline>
            <polyline points="4,26 12,20 20,24 28,16" fill="none" stroke="#ed7d31" stroke-width="2"></polyline>
          </svg>
        </div>
        <div class="chart-gallery-item">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line><line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
            <polyline points="4,18 12,10 20,14 28,6" fill="none" stroke="#5b9bd5" stroke-width="2"></polyline>
            <polyline points="4,24 12,18 20,22 28,14" fill="none" stroke="#ed7d31" stroke-width="2"></polyline>
          </svg>
        </div>
        <div class="chart-gallery-item">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line><line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
             <polyline points="4,8 12,8 20,8 28,8" fill="none" stroke="#5b9bd5" stroke-width="2"></polyline>
             <polyline points="4,26 12,20 20,24 28,16" fill="none" stroke="#ed7d31" stroke-width="2"></polyline>
          </svg>
        </div>
        <div class="chart-gallery-item">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line><line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
            <polyline points="4,22 12,12 20,18 28,10" fill="none" stroke="#5b9bd5" stroke-width="1"></polyline>
            <rect x="11" y="11" width="3" height="3" fill="#5b9bd5"></rect><rect x="19" y="17" width="3" height="3" fill="#5b9bd5"></rect><rect x="27" y="9" width="3" height="3" fill="#5b9bd5"></rect>
            <polyline points="4,26 12,20 20,24 28,16" fill="none" stroke="#ed7d31" stroke-width="1"></polyline>
            <circle cx="12" cy="20" r="1.5" fill="#ed7d31"></circle><circle cx="20" cy="24" r="1.5" fill="#ed7d31"></circle><circle cx="28" cy="16" r="1.5" fill="#ed7d31"></circle>
          </svg>
        </div>
        <div class="chart-gallery-item">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line><line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
            <polyline points="4,18 12,10 20,14 28,6" fill="none" stroke="#5b9bd5" stroke-width="1"></polyline>
            <rect x="11" y="9" width="3" height="3" fill="#5b9bd5"></rect><rect x="19" y="13" width="3" height="3" fill="#5b9bd5"></rect><rect x="27" y="5" width="3" height="3" fill="#5b9bd5"></rect>
             <polyline points="4,24 12,18 20,22 28,14" fill="none" stroke="#ed7d31" stroke-width="1"></polyline>
             <circle cx="12" cy="18" r="1.5" fill="#ed7d31"></circle><circle cx="20" cy="22" r="1.5" fill="#ed7d31"></circle><circle cx="28" cy="14" r="1.5" fill="#ed7d31"></circle>
          </svg>
        </div>
        <div class="chart-gallery-item">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line><line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
            <polyline points="4,8 12,8 20,8 28,8" fill="none" stroke="#5b9bd5" stroke-width="1"></polyline>
             <rect x="11" y="7" width="3" height="3" fill="#5b9bd5"></rect><rect x="19" y="7" width="3" height="3" fill="#5b9bd5"></rect><rect x="27" y="7" width="3" height="3" fill="#5b9bd5"></rect>
             <polyline points="4,26 12,20 20,24 28,16" fill="none" stroke="#ed7d31" stroke-width="1"></polyline>
             <circle cx="12" cy="20" r="1.5" fill="#ed7d31"></circle><circle cx="20" cy="24" r="1.5" fill="#ed7d31"></circle><circle cx="28" cy="16" r="1.5" fill="#ed7d31"></circle>
          </svg>
        </div>
        <div class="chart-gallery-item">
          <svg width="32" height="32" viewBox="0 0 32 32">
             <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line><line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
             <polygon points="4,22 12,12 20,18 28,10 28,12 20,20 12,14 4,24" fill="#5b9bd5"></polygon>
             <polygon points="4,26 12,20 20,24 28,16 28,18 20,26 12,22 4,28" fill="#a5a5a5"></polygon>
          </svg>
        </div>
      `;
      // Preview chart
      previewEl.innerHTML = `
        <svg width="100%" height="260" viewBox="0 0 400 240">
           <line x1="50" y1="40" x2="350" y2="40" stroke="#e1dfdd" stroke-width="1"></line><text x="35" y="44" font-family="Segoe UI" font-size="10" fill="#777">6</text>
           <line x1="50" y1="70" x2="350" y2="70" stroke="#e1dfdd" stroke-width="1"></line><text x="35" y="74" font-family="Segoe UI" font-size="10" fill="#777">5</text>
           <line x1="50" y1="100" x2="350" y2="100" stroke="#e1dfdd" stroke-width="1"></line><text x="35" y="104" font-family="Segoe UI" font-size="10" fill="#777">4</text>
           <line x1="50" y1="130" x2="350" y2="130" stroke="#e1dfdd" stroke-width="1"></line><text x="35" y="134" font-family="Segoe UI" font-size="10" fill="#777">3</text>
           <line x1="50" y1="160" x2="350" y2="160" stroke="#e1dfdd" stroke-width="1"></line><text x="35" y="164" font-family="Segoe UI" font-size="10" fill="#777">2</text>
           <line x1="50" y1="190" x2="350" y2="190" stroke="#e1dfdd" stroke-width="1"></line><text x="35" y="194" font-family="Segoe UI" font-size="10" fill="#777">1</text>
           <line x1="50" y1="220" x2="350" y2="220" stroke="#a19f9d" stroke-width="1"></line><text x="35" y="224" font-family="Segoe UI" font-size="10" fill="#777">0</text>
           
           <polyline points="90,100 160,150 230,120 300,80" fill="none" stroke="#1f4e79" stroke-width="2"></polyline>
           <circle cx="90" cy="100" r="3" fill="#1f4e79"></circle><circle cx="160" cy="150" r="3" fill="#1f4e79"></circle><circle cx="230" cy="120" r="3" fill="#1f4e79"></circle><circle cx="300" cy="80" r="3" fill="#1f4e79"></circle>
           
           <polyline points="90,160 160,110 230,180 300,150" fill="none" stroke="#ed7d31" stroke-width="2"></polyline>
           <circle cx="90" cy="160" r="3" fill="#ed7d31"></circle><circle cx="160" cy="110" r="3" fill="#ed7d31"></circle><circle cx="230" cy="180" r="3" fill="#ed7d31"></circle><circle cx="300" cy="150" r="3" fill="#ed7d31"></circle>
           
           <polyline points="90,180 160,180 230,150 300,100" fill="none" stroke="#385723" stroke-width="2"></polyline>
           <circle cx="90" cy="180" r="3" fill="#385723"></circle><circle cx="160" cy="180" r="3" fill="#385723"></circle><circle cx="230" cy="150" r="3" fill="#385723"></circle><circle cx="300" cy="100" r="3" fill="#385723"></circle>
           
           <text x="90" y="235" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Category 1</text>
           <text x="160" y="235" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Category 2</text>
           <text x="230" y="235" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Category 3</text>
           <text x="300" y="235" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Category 4</text>
           
           <rect x="120" y="250" width="8" height="8" fill="#1f4e79"></rect><text x="132" y="258" font-family="Segoe UI" font-size="10" fill="#555">Series1</text>
           <rect x="180" y="250" width="8" height="8" fill="#ed7d31"></rect><text x="192" y="258" font-family="Segoe UI" font-size="10" fill="#555">Series2</text>
           <rect x="240" y="250" width="8" height="8" fill="#385723"></rect><text x="252" y="258" font-family="Segoe UI" font-size="10" fill="#555">Series3</text>
        </svg>
      `;
    } else {
      if (this.defaultChartGalleryHtml && this.defaultChartPreviewHtml) {
        rowEl.innerHTML = this.defaultChartGalleryHtml;
        previewEl.innerHTML = this.defaultChartPreviewHtml;
      } else {
        rowEl.innerHTML = `
          <div class="chart-gallery-item active">
            <svg width="32" height="32" viewBox="0 0 32 32">
                <line x1="4" y1="4" x2="4" y2="28" stroke="#888" stroke-width="1"></line>
                <line x1="4" y1="28" x2="28" y2="28" stroke="#888" stroke-width="1"></line>
                <rect x="6" y="14" width="4" height="14" fill="#5b9bd5"></rect>
                <rect x="11" y="18" width="4" height="10" fill="#ed7d31"></rect>
                <rect x="20" y="8" width="4" height="20" fill="#5b9bd5"></rect>
                <rect x="25" y="14" width="4" height="14" fill="#a5a5a5"></rect>
            </svg>
          </div>
        `;
        previewEl.innerHTML = `<div style="padding:40px; text-align:center; color:#666;">Preview for ${catName}</div>`;
      }
    }

    if (this.bindGalleryItems) this.bindGalleryItems();
  }

  insertChart() {
    this.saveState();
    let chartTitle = 'Chart Title';
    const titleEl = document.querySelector('.chart-preview-area h3');
    if (titleEl) {
      chartTitle = titleEl.textContent;
    }

    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    let chartSVG = '';

    if (chartTitle.includes('Line')) {
      chartSVG = `
        <svg width="100%" height="100%" viewBox="0 0 400 240" style="background:white; border:1px solid #ccc;">
          <text x="200" y="20" font-family="Segoe UI, sans-serif" font-size="14" font-weight="bold" fill="#555" text-anchor="middle">${chartTitle}</text>
          <line x1="50" y1="200" x2="350" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          <line x1="50" y1="40" x2="50" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          <polyline points="50,180 120,100 190,140 260,80 330,120" fill="none" stroke="#1f4e79" stroke-width="3"></polyline>
          <circle cx="120" cy="100" r="4" fill="#1f4e79"></circle>
          <circle cx="190" cy="140" r="4" fill="#1f4e79"></circle>
          <circle cx="260" cy="80" r="4" fill="#1f4e79"></circle>
          <circle cx="330" cy="120" r="4" fill="#1f4e79"></circle>
          
          <polyline points="50,150 120,160 190,90 260,110 330,60" fill="none" stroke="#ed7d31" stroke-width="3"></polyline>
          <circle cx="120" cy="160" r="4" fill="#ed7d31"></circle>
          <circle cx="190" cy="90" r="4" fill="#ed7d31"></circle>
          <circle cx="260" cy="110" r="4" fill="#ed7d31"></circle>
          <circle cx="330" cy="60" r="4" fill="#ed7d31"></circle>
          
          <text x="120" y="215" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Q1</text>
          <text x="190" y="215" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Q2</text>
          <text x="260" y="215" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Q3</text>
          <text x="330" y="215" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Q4</text>
        </svg>
      `;
    } else if (chartTitle.includes('Pie')) {
      chartSVG = `
        <svg width="100%" height="100%" viewBox="0 0 400 240" style="background:white; border:1px solid #ccc;">
          <text x="200" y="20" font-family="Segoe UI, sans-serif" font-size="14" font-weight="bold" fill="#555" text-anchor="middle">${chartTitle}</text>
          <g transform="translate(200, 130)">
            <path d="M 0 0 L 70 0 A 70 70 0 0 1 0 70 Z" fill="#1f4e79"></path>
            <path d="M 0 0 L 0 70 A 70 70 0 0 1 -70 0 Z" fill="#ed7d31"></path>
            <path d="M 0 0 L -70 0 A 70 70 0 0 1 -49.4 -49.4 Z" fill="#a5a5a5"></path>
            <path d="M 0 0 L -49.4 -49.4 A 70 70 0 0 1 70 0 Z" fill="#ffc000"></path>
          </g>
          <rect x="320" y="80" width="10" height="10" fill="#1f4e79"></rect><text x="340" y="90" font-family="Segoe UI" font-size="10">Part 1</text>
          <rect x="320" y="100" width="10" height="10" fill="#ed7d31"></rect><text x="340" y="110" font-family="Segoe UI" font-size="10">Part 2</text>
          <rect x="320" y="120" width="10" height="10" fill="#a5a5a5"></rect><text x="340" y="130" font-family="Segoe UI" font-size="10">Part 3</text>
          <rect x="320" y="140" width="10" height="10" fill="#ffc000"></rect><text x="340" y="150" font-family="Segoe UI" font-size="10">Part 4</text>
        </svg>
      `;
    } else if (chartTitle.includes('Bar')) {
      chartSVG = `
        <svg width="100%" height="100%" viewBox="0 0 400 240" style="background:white; border:1px solid #ccc;">
          <text x="200" y="20" font-family="Segoe UI, sans-serif" font-size="14" font-weight="bold" fill="#555" text-anchor="middle">${chartTitle}</text>
          <line x1="80" y1="200" x2="350" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          <line x1="80" y1="40" x2="80" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          
          <rect x="80" y="60" width="180" height="15" fill="#1f4e79"></rect>
          <rect x="80" y="80" width="120" height="15" fill="#ed7d31"></rect>
          <text x="70" y="80" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="end">Cat 1</text>
          
          <rect x="80" y="110" width="140" height="15" fill="#1f4e79"></rect>
          <rect x="80" y="130" width="210" height="15" fill="#ed7d31"></rect>
          <text x="70" y="130" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="end">Cat 2</text>
          
          <rect x="80" y="160" width="220" height="15" fill="#1f4e79"></rect>
          <rect x="80" y="180" width="90" height="15" fill="#ed7d31"></rect>
          <text x="70" y="180" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="end">Cat 3</text>
        </svg>
      `;
    } else if (chartTitle.includes('Area')) {
      chartSVG = `
        <svg width="100%" height="100%" viewBox="0 0 400 240" style="background:white; border:1px solid #ccc;">
          <text x="200" y="20" font-family="Segoe UI, sans-serif" font-size="14" font-weight="bold" fill="#555" text-anchor="middle">${chartTitle}</text>
          <line x1="50" y1="200" x2="350" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          <line x1="50" y1="40" x2="50" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          <polygon points="50,200 50,160 120,180 190,120 260,150 330,80 330,200" fill="#ed7d31" opacity="0.7"></polygon>
          <polygon points="50,200 50,120 120,90 190,150 260,60 330,110 330,200" fill="#1f4e79" opacity="0.7"></polygon>
        </svg>
      `;
    } else {
      // Default Clustered Column
      chartSVG = `
        <svg width="100%" height="100%" viewBox="0 0 400 240" style="background:white; border:1px solid #ccc;">
          <text x="200" y="20" font-family="Segoe UI, sans-serif" font-size="14" font-weight="bold" fill="#555" text-anchor="middle">${chartTitle}</text>
          <line x1="50" y1="200" x2="350" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          <line x1="50" y1="40" x2="50" y2="200" stroke="#a19f9d" stroke-width="1"></line>
          <rect x="70" y="100" width="20" height="100" fill="#1f4e79"></rect>
          <rect x="95" y="140" width="20" height="60" fill="#ed7d31"></rect>
          <rect x="120" y="160" width="20" height="40" fill="#385723"></rect>
          <text x="95" y="215" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Category 1</text>
          
          <rect x="160" y="130" width="20" height="70" fill="#1f4e79"></rect>
          <rect x="185" y="90" width="20" height="110" fill="#ed7d31"></rect>
          <rect x="210" y="150" width="20" height="50" fill="#385723"></rect>
          <text x="185" y="215" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Category 2</text>
          
          <rect x="250" y="70" width="20" height="130" fill="#1f4e79"></rect>
          <rect x="275" y="130" width="20" height="70" fill="#ed7d31"></rect>
          <rect x="300" y="100" width="20" height="100" fill="#385723"></rect>
          <text x="275" y="215" font-family="Segoe UI" font-size="10" fill="#555" text-anchor="middle">Category 3</text>
        </svg>
      `;
    }
    const elData = {
      id,
      type: 'chart',
      content: chartSVG,
      styles: {
        top: '100px',
        left: '150px',
        width: '500px',
        height: '300px',
        position: 'absolute',
        background: '#fff',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
  }

  insertImage(src) {
    this.saveState();
    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    const elData = {
      id,
      type: 'image',
      content: `<img src="${src}" style="width:100%;height:100%;object-fit:contain;">`,
      styles: {
        top: '50px',
        left: '50px',
        width: '300px',
        height: '200px',
        position: 'absolute',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
  }

  insertVideo(src) {
    this.saveState();
    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    const elData = {
      id,
      type: 'video',
      content: `<video src="${src}" controls style="width:100%;height:100%;object-fit:contain;"></video>`,
      styles: {
        top: '50px',
        left: '50px',
        width: '400px',
        height: '225px',
        position: 'absolute',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
  }

  insertAudio(src) {
    this.saveState();
    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    const elData = {
      id,
      type: 'audio',
      content: `<audio src="${src}" controls style="width:100%;height:100%;"></audio>`,
      styles: {
        top: '50px',
        left: '50px',
        width: '300px',
        height: '50px',
        position: 'absolute',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
  }

  insertCameo() {
    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    const elData = {
      id,
      type: 'cameo',
      content: '<div class="cameo-placeholder" style="width:100%;height:100%;background:#323130;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;"><i data-lucide="video"></i></div>',
      styles: {
        top: '300px',
        left: '700px',
        width: '150px',
        height: '150px',
        position: 'absolute',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
    lucide.createIcons();
  }

  addTextBox() {
    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    const elData = {
      id,
      type: 'text',
      content: 'Click to add text',
      styles: {
        top: '150px',
        left: '150px',
        width: '200px',
        height: '50px',
        position: 'absolute',
        fontSize: '18px',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
  }

  addWordArt() {
    const id = this.getNextId();
    const slide = this.slides[this.currentSlideIndex];
    const elData = {
      id,
      type: 'text',
      content: 'WordArt',
      styles: {
        top: '200px',
        left: '200px',
        width: '300px',
        height: '80px',
        position: 'absolute',
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#4472c4',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        fontFamily: 'Impact',
        zIndex: 500
      }
    };
    slide.elements.push(elData);
    this.render();
  }

  insertTextAtSelection(text) {
    if (this.selectedElement && this.selectedElement.getAttribute('contenteditable')) {
      document.execCommand('insertText', false, text);
    }
  }

  setupDrawTab() {
    this.drawCanvas = document.getElementById('draw-canvas');
    if (!this.drawCanvas) return;

    this.syncCanvasSize = () => {
      const rect = this.drawCanvas.parentElement.getBoundingClientRect();
      this.drawCanvas.width = rect.width;
      this.drawCanvas.height = rect.height;
      this.redrawCanvas();
    };
    window.addEventListener('resize', this.syncCanvasSize);
    setTimeout(this.syncCanvasSize, 500);

    this.drawCtx = this.drawCanvas.getContext('2d');
    this.isDrawing = false;
    this.strokes = [];
    this.redoStack = [];

    const pens = {
      'pen-purple': '#c8a0c8',
      'pen-black': '#303030',
      'pen-red': '#c43e1c',
      'pen-blue': '#1e4d78',
      'pen-darkpurple': '#5a2d82',
      'pen-yellow': '#ffff00',
      'pen-darkblue': '#0f4d8c',
      'pen-green': '#107c10'
    };

    const setTool = (tool, color = null, size = 3, domElement = null) => {
      console.log(`Setting tool: ${tool} ${color || ''}`);
      this.currentTool = tool;
      this.drawMode = (tool === 'pen' || tool === 'eraser' || tool === 'highlighter');
      this.drawCanvas.style.pointerEvents = this.drawMode ? 'auto' : 'none';
      if (color) this.drawColor = color;
      this.drawSize = size;

      document.querySelectorAll('.draw-tool-item, .draw-pen').forEach(t => t.classList.remove('active'));
      if (domElement) {
        domElement.classList.add('active');
      }
    };

    window.addEventListener('keydown', (e) => {
      // Exit draw mode on escape
      if (e.key === 'Escape') setTool('pointer', null, 3, document.querySelectorAll('.draw-tool-item')[0]);
    });

    const drawTools = document.querySelectorAll('.draw-tool-item');
    if (drawTools.length >= 2) {
      drawTools[0].onclick = (e) => { e.stopPropagation(); setTool('pointer', null, 3, drawTools[0]); }; // Select
      drawTools[1].onclick = (e) => { e.stopPropagation(); setTool('lasso', null, 3, drawTools[1]); }; // Lasso
    }

    const penTools = [
      { tool: 'eraser', color: '#ffffff', size: 20 },
      { tool: 'pen', color: '#111111', size: 3 }, // Black
      { tool: 'pen', color: '#e81123', size: 3 }, // Red
      { tool: 'pen', color: '#4a3b78', size: 3 }, // Galaxy (solid color approx)
      { tool: 'pen', color: '#888888', size: 2 }, // Pencil
      { tool: 'highlighter', color: 'rgba(255, 238, 0, 0.4)', size: 15 }, // Highlighter
      { tool: 'pen', color: '#004b8b', size: 3 }, // Blue Fountain
      { tool: 'pen', color: '#107c10', size: 3 }  // Green Fountain
    ];

    const penElements = document.querySelectorAll('.draw-pen');
    penElements.forEach((el, index) => {
      if (penTools[index]) {
        el.onclick = (e) => {
          e.stopPropagation();
          setTool(penTools[index].tool, penTools[index].color, penTools[index].size, el);
        };
      }
    });

    // Initialize with pointer tool visually active
    setTimeout(() => {
      if (drawTools.length > 0) setTool('pointer', null, 3, drawTools[0]);
    }, 100);

    const undoBtn = document.getElementById('draw-undo-btn');
    if (undoBtn) undoBtn.onclick = (e) => {
      e.stopPropagation();
      console.log("Draw Undo clicked");
      this.drawUndo();
    };

    const redoBtn = document.getElementById('draw-redo-btn');
    if (redoBtn) redoBtn.onclick = (e) => {
      e.stopPropagation();
      console.log("Draw Redo clicked");
      this.drawRedo();
    };

    // Initialize with pointer tool
    setTool('pointer');

    // Canvas Events
    this.drawCanvas.onmousedown = (e) => {
      if (!this.drawMode) return;
      this.isDrawing = true;
      const rect = this.drawCanvas.getBoundingClientRect();
      this.lastX = e.clientX - rect.left;
      this.lastY = e.clientY - rect.top;
      this.currentStroke = {
        tool: this.currentTool,
        color: this.drawColor,
        size: this.drawSize,
        points: [[this.lastX, this.lastY]]
      };
      this.redoStack = []; // Clear redo stack on new drawing action
    };

    const drawSegment = (ctx, stroke, x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(255,255,255,1)';
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; // Reset
    };

    this.drawCanvas.onmousemove = (e) => {
      if (!this.isDrawing) return;
      const rect = this.drawCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      drawSegment(this.drawCtx, this.currentStroke, this.lastX, this.lastY, x, y);

      this.lastX = x;
      this.lastY = y;
      this.currentStroke.points.push([x, y]);
    };

    this.drawCanvas.onmouseup = () => {
      if (this.isDrawing) {
        this.strokes.push(this.currentStroke);
        this.undoStack.push({ type: 'draw', stroke: this.currentStroke });
        this.isDrawing = false;

        // Update undo/redo button states
        const undoBtn = document.querySelector('[title="Undo"]');
        if (undoBtn) undoBtn.classList.remove('disabled');
      }
    };

    const rulerBtn = document.getElementById('draw-ruler-btn');
    if (rulerBtn) {
      rulerBtn.onclick = () => {
        const r = document.getElementById('canvas-ruler');
        if (r) r.style.display = r.style.display === 'none' ? 'block' : 'none';
      };
    }
  }

  drawUndo() {
    console.log("Performing drawing undo", this.strokes.length);
    if (this.strokes.length > 0) {
      const last = this.strokes.pop();
      this.redoStack.push({ type: 'draw', stroke: last });
      this.redrawCanvas();
    }
  }

  drawRedo() {
    console.log("Performing drawing redo", this.redoStack.length);
    const last = this.redoStack.findLast(s => s.type === 'draw');
    if (last) {
      this.redoStack.splice(this.redoStack.indexOf(last), 1);
      this.strokes.push(last.stroke);
      this.redrawCanvas();
    }
  }

  redrawCanvas() {
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    this.strokes.forEach(s => {
      if (s.points.length < 2) return;

      this.drawCtx.beginPath();
      this.drawCtx.moveTo(s.points[0][0], s.points[0][1]);
      for (let i = 1; i < s.points.length; i++) {
        this.drawCtx.lineTo(s.points[i][0], s.points[i][1]);
      }
      this.drawCtx.strokeStyle = s.color;
      this.drawCtx.lineWidth = s.size;
      this.drawCtx.lineCap = 'round';
      this.drawCtx.lineJoin = 'round';

      if (s.tool === 'eraser') {
        this.drawCtx.globalCompositeOperation = 'destination-out';
        this.drawCtx.strokeStyle = 'rgba(255,255,255,1)';
      } else if (s.tool === 'highlighter') {
        this.drawCtx.globalCompositeOperation = 'multiply';
      } else {
        this.drawCtx.globalCompositeOperation = 'source-over';
      }

      this.drawCtx.stroke();
      this.drawCtx.globalCompositeOperation = 'source-over'; // Reset
    });
  }

  setupDesignTab() {
    this.themes = {
      'default': { bg: '#ffffff', text: '#323130', accent: '#4472c4', bgClass: '' },
      'organic': {
        bg: 'linear-gradient(135deg, #e2efda 0%, #c6dfb8 100%)',
        text: '#375623',
        accent: '#70ad47',
        bgClass: 'theme-organic-green',
        accentElement: 'accent-green-fold'
      },
      'dark': {
        bg: '#2d2d2d',
        text: '#ffffff',
        accent: '#0078d4',
        bgClass: 'theme-dark'
      },
      'facet': {
        bg: '#f3f2f1',
        text: '#323130',
        accent: '#d83b01',
        bgClass: 'theme-facet'
      },
      'integral': {
        bg: '#ffffff',
        text: '#1a1a1a',
        accent: '#004e8c',
        bgClass: 'theme-integral'
      },
      'ion': {
        bg: '#000000',
        text: '#00ffc8',
        accent: '#00ffc8',
        bgClass: 'theme-ion'
      },
      'retrospect': {
        bg: '#fff2cc',
        text: '#7e6000',
        accent: '#bf9000',
        bgClass: 'theme-retrospect'
      },
      'slate': {
        bg: 'radial-gradient(circle at 70% 30%, #1f4e5f 0%, #0d2c36 100%)',
        text: '#ffffff',
        accent: '#c00',
        bgClass: 'theme-teal-gradient',
        accentElement: 'accent-red-bar',
        placeholderClass: 'dashed-white'
      },
      'wisp': {
        bg: '#f8f9fa',
        text: '#6c757d',
        accent: '#17a2b8',
        bgClass: 'theme-wisp'
      },
      'berlin': {
        bg: '#ffffff',
        text: '#000000',
        accent: '#ffcc00',
        bgClass: 'theme-berlin'
      },
      'celestial': {
        bg: '#1a1a2e',
        text: '#e94560',
        accent: '#16213e',
        bgClass: 'theme-celestial'
      }
    };

    const themeThumbs = document.querySelectorAll('[data-panel="design"] .theme-thumb:not(.variants .theme-thumb)');
    themeThumbs.forEach(thumb => {
      thumb.onclick = () => {
        const themeName = thumb.dataset.theme;
        const theme = this.themes[themeName];
        if (theme) {
          console.log(`Applying theme: ${themeName}`);
          this.slides[this.currentSlideIndex].background = theme.bg;
          this.slides[this.currentSlideIndex].theme = theme;

          // Apply to all slides? MS PowerPoint usually does.
          this.slides.forEach(s => {
            s.background = theme.bg;
            s.theme = theme;
          });

          themeThumbs.forEach(t => t.classList.remove('active-theme'));
          thumb.classList.add('active-theme');
          this.render();
        }
      };
    });

    const slideSizeBtn = document.getElementById('design-slidesize-btn');
    if (slideSizeBtn) {
      slideSizeBtn.onclick = () => {
        const canvas = document.getElementById('canvas');
        if (canvas.style.aspectRatio === '4 / 3') {
          canvas.style.aspectRatio = '16 / 9';
          console.log("Switching to 16:9");
        } else {
          canvas.style.aspectRatio = '4 / 3';
          console.log("Switching to 4:3");
        }
      };
    }

    const formatBgBtn = document.getElementById('design-formatbg-btn');
    if (formatBgBtn) {
      formatBgBtn.onclick = () => {
        const color = prompt("Enter background color (hex or name):", this.slides[this.currentSlideIndex].background || "#ffffff");
        if (color) {
          this.slides[this.currentSlideIndex].background = color;
          this.render();
        }
      };
    }

    // Variants
    const variantThumbs = document.querySelectorAll('[data-panel="design"] .variants .theme-thumb');
    variantThumbs.forEach((v, idx) => {
      v.onclick = () => {
        const colors = ['#4472c4', '#ed7d31', '#a9d18e', '#ffc000'];
        const color = colors[idx % colors.length];
        this.slides[this.currentSlideIndex].background = color;
        this.render();
        console.log(`Setting variant background: ${color}`);
      };
    });
  }
  setupTransitionsTab() {
    const transThumbs = document.querySelectorAll('[data-panel="transitions"] .transition-thumb');

    const playTransition = (transId) => {
      const canvas = document.getElementById('canvas');
      if (!canvas || !transId || transId === 'none') return;

      // Remove any existing transition classes
      canvas.className = canvas.className.replace(/trans-\w[-\w]*/g, '').trim();
      void canvas.offsetWidth; // Force reflow to restart animation

      // Add the new transition class
      canvas.classList.add(`trans-${transId}`);

      // Remove the class after animation completes
      setTimeout(() => {
        canvas.className = canvas.className.replace(/trans-\w[-\w]*/g, '').trim();
      }, 1200);
    };

    transThumbs.forEach(thumb => {
      thumb.onclick = () => {
        const trans = thumb.dataset.transition;
        this.slides[this.currentSlideIndex].transition = trans;
        transThumbs.forEach(t => t.classList.remove('active-transition'));
        thumb.classList.add('active-transition');

        // Preview immediately on selection
        playTransition(trans);
      };
    });

    const previewBtn = document.getElementById('trans-preview-btn');
    if (previewBtn) {
      previewBtn.onclick = () => {
        const trans = this.slides[this.currentSlideIndex].transition || 'none';
        if (trans === 'none') {
          alert("Select a transition effect first.");
          return;
        }
        playTransition(trans);
      };
    }

    const applyAllBtn = document.getElementById('trans-apply-all-btn');
    if (applyAllBtn) {
      applyAllBtn.onclick = () => {
        const trans = this.slides[this.currentSlideIndex].transition || 'none';
        this.slides.forEach(s => s.transition = trans);
        alert(`Applied '${trans}' transition to all slides.`);
      };
    }

    // Expose playTransition for use during slideshow
    this.playTransition = playTransition;
  }

  setupAnimationsTab() {
    const animThumbs = document.querySelectorAll('[data-panel="animations"] .transition-thumb');
    const previewBtn = document.getElementById('anim-preview-btn');

    // Make sure we have the animation functions attached
    if (!this.previewAnimation) {
      this.previewAnimation = (domElement, animationName) => {
        if (!domElement || !animationName) return;

        // Remove old animation classes
        domElement.className = domElement.className.replace(/anim-\w+/g, '').trim();

        // Force reflow
        domElement.style.animation = 'none';
        void domElement.offsetWidth;
        domElement.style.animation = '';

        if (animationName !== 'none') {
          domElement.classList.add(`anim-${animationName}`);
        }
      };
    }

    animThumbs.forEach(thumb => {
      thumb.onclick = () => {
        if (!this.selectedElement) {
          alert("Select an element on the slide first to apply an animation.");
          return;
        }

        const animId = thumb.dataset.animation;
        const elId = this.selectedElement.getAttribute('data-id');

        // Find the element data in the current slide
        const slide = this.slides[this.currentSlideIndex];
        const elData = slide.elements.find(e => e.id === elId || (this.selectedElement.id && e.id === this.selectedElement.id));

        if (elData) {
          // Set to null if 'none' to keep data clean
          elData.animation = animId === 'none' ? null : animId;

          // Update Ribbon UI
          animThumbs.forEach(t => t.classList.remove('active-transition'));
          thumb.classList.add('active-transition');

          // Preview immediately upon selection
          this.previewAnimation(this.selectedElement, elData.animation);
        }
      };
    });

    if (previewBtn) {
      previewBtn.onclick = () => {
        const slide = this.slides[this.currentSlideIndex];
        if (!slide || !slide.elements) return;

        const canvas = document.getElementById('canvas');

        // Reset all animations first by forcing a reflow
        slide.elements.forEach(elData => {
          if (elData.animation) {
            const domEl = canvas.querySelector(`[data-id="${elData.id}"]`);
            if (domEl) {
              domEl.style.animation = 'none';
              domEl.className = domEl.className.replace(/anim-\w+/g, '').trim();
            }
          }
        });

        void canvas.offsetWidth; // Trigger global reflow

        // Apply animations
        slide.elements.forEach(elData => {
          if (elData.animation) {
            const domEl = canvas.querySelector(`[data-id="${elData.id}"]`);
            if (domEl) {
              this.previewAnimation(domEl, elData.animation);
            }
          }
        });
      };
    }
  }

  updateStatus() {
    const statusText = document.querySelector('.status-left span');
    if (statusText) statusText.innerText = `Slide ${this.currentSlideIndex + 1} of ${this.slides.length}`;

    // Sync Hide Slide button state
    const btnHideSlide = document.getElementById('btn-hide-slide');
    if (btnHideSlide && this.slides.length > 0) {
      if (this.slides[this.currentSlideIndex].hidden) {
        btnHideSlide.classList.add('active');
      } else {
        btnHideSlide.classList.remove('active');
      }
    }
  }

  makeDraggable(element, elData, downEvent) {
    let hasSaved = false;
    const e = downEvent || window.event;
    if (!e) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startTop = element.offsetTop;
    const startLeft = element.offsetLeft;
    let draggingStarted = false;
    const threshold = 5;

    // Determine Canvas Scale to adjust drag speed accurately
    const canvas = document.getElementById('canvas');
    let scale = 1;
    if (canvas && canvas.style.transform) {
      const match = canvas.style.transform.match(/scale\(([^)]+)\)/);
      if (match && match[1]) scale = parseFloat(match[1]);
    }

    const elementDrag = (moveEvent) => {
      moveEvent = moveEvent || window.event;

      if (!draggingStarted) {
        const dist = Math.sqrt(Math.pow(moveEvent.clientX - startX, 2) + Math.pow(moveEvent.clientY - startY, 2));
        if (dist > threshold) draggingStarted = true;
        else return;
      }

      if (!hasSaved) { this.saveState(); hasSaved = true; }

      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      element.style.top = (startTop + dy) + "px";
      element.style.left = (startLeft + dx) + "px";
      elData.styles.top = element.style.top;
      elData.styles.left = element.style.left;
    };
    const closeDragElement = () => { document.onmouseup = null; document.onmousemove = null; };
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  makeAdjustable(div, el, handle, e) {
    let hasSaved = false;
    e.preventDefault();
    const prop = handle.dataset.prop;
    const startRect = div.getBoundingClientRect();

    const onMouseMove = (moveEvent) => {
      if (!hasSaved) { this.saveState(); hasSaved = true; }
      const relativeX = (moveEvent.clientX - startRect.left) / startRect.width;
      const relativeY = (moveEvent.clientY - startRect.top) / startRect.height;

      if (!el.adjustments) el.adjustments = {};

      const a = el.adjustments;
      if (el.shapeType === 'arrow-right') {
        if (prop === 'headWidth') a.headWidth = Math.max(0.1, Math.min(0.9, 1 - relativeX));
        else if (prop === 'shaftHeight') a.shaftHeight = Math.max(0.05, Math.min(0.8, 1 - (relativeY * 2)));
      } else if (el.shapeType === 'arrow-left') {
        if (prop === 'headWidth') a.headWidth = Math.max(0.1, Math.min(0.9, relativeX));
        else if (prop === 'shaftHeight') a.shaftHeight = Math.max(0.05, Math.min(0.8, 1 - (relativeY * 2)));
      } else if (el.shapeType === 'arrow-both') {
        if (prop === 'headWidth') a.headWidth = Math.max(0.05, Math.min(0.45, relativeX));
      } else if (el.shapeType === 'rounded-rect') {
        if (prop === 'radius') a.radius = Math.max(0, Math.min(0.5, relativeX));
      } else if (el.shapeType === 'parallelogram' || el.shapeType === 'trapezoid') {
        if (prop === 'indent') a.indent = Math.max(0, Math.min(0.45, relativeX));
      } else if (el.shapeType === 'plus') {
        if (prop === 'weight') a.weight = Math.max(0.1, Math.min(0.8, 1 - (relativeX * 2)));
      } else if (el.shapeType.startsWith('star')) {
        if (prop === 'depth') a.depth = Math.max(0.05, Math.min(0.95, (50 - relativeY * 100) / 50));
      } else if (el.shapeType === 'frame' || el.shapeType === 'l-shape') {
        if (prop === 'thickness') a.thickness = Math.max(0.02, Math.min(0.45, relativeX));
      } else if (el.shapeType === 'chevron') {
        if (prop === 'indent') a.indent = Math.max(0.1, Math.min(0.9, 1 - relativeX));
      } else if (el.shapeType.startsWith('callout')) {
        if (prop === 'ptrX') {
          a.ptrX = relativeX;
          a.ptrY = relativeY;
        }
      }

      // Update Visuals
      const newPath = this.getShapeClipPath(el.shapeType, el.adjustments);
      const shapeContent = div.querySelector('.shape-content');
      if (newPath && shapeContent) shapeContent.style.clipPath = newPath;

      // Update handle positions (partial re-render logic for performance)
      div.querySelectorAll('.adjustment-handle').forEach(h => {
        const p = h.dataset.prop;
        if (el.shapeType.startsWith('arrow')) {
          if (p === 'headWidth') h.style.left = `${el.shapeType === 'arrow-right' ? (100 - a.headWidth * 100) : a.headWidth * 100}%`;
          if (p === 'shaftHeight') h.style.top = `${(100 - a.shaftHeight * 100) / 2}%`;
        } else if (el.shapeType === 'rounded-rect') {
          if (p === 'radius') h.style.left = `${a.radius * 100}%`;
        } else if (el.shapeType === 'plus') {
          if (p === 'weight') h.style.left = `${(100 - a.weight * 100) / 2}%`;
        } else if (el.shapeType.startsWith('star')) {
          if (p === 'depth') h.style.top = `${50 - (a.depth * 50)}%`;
        } else if (el.shapeType.startsWith('callout')) {
          if (p === 'ptrX') {
            h.style.left = `${a.ptrX * 100}%`;
            h.style.top = `${a.ptrY * 100}%`;
          }
        } else {
          if (p === 'indent' || p === 'thickness') h.style.left = `${a[p] * 100}%`;
        }
      });

      div.dataset.adjustments = JSON.stringify(el.adjustments);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.syncDataWithSelection();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  makeRotatable(div, el, handle, e) {
    let hasSaved = false;
    e.preventDefault();
    const rect = div.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (moveEvent) => {
      if (!hasSaved) { this.saveState(); hasSaved = true; }
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

      el.styles.transform = `rotate(${angle}deg)`;
      div.style.transform = `rotate(${angle}deg)`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.syncDataWithSelection();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  makeResizable(element, elData, handle, downEvent) {
    let hasSaved = false;
    const e = downEvent || window.event;
    if (!e) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    const startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    const startTop = element.offsetTop;
    const startLeft = element.offsetLeft;

    const handleClass = Array.from(handle.classList).find(c => c.startsWith('handle-'));
    if (!handleClass) return;

    // Determine Canvas Scale to adjust drag speed accurately
    const canvas = document.getElementById('canvas');
    let scale = 1;
    if (canvas && canvas.style.transform) {
      const match = canvas.style.transform.match(/scale\(([^)]+)\)/);
      if (match && match[1]) scale = parseFloat(match[1]);
    }

    const doDrag = (moveEvent) => {
      moveEvent = moveEvent || window.event;
      if (!moveEvent) return;
      if (!hasSaved) { this.saveState(); hasSaved = true; }
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newTop = startTop;
      let newLeft = startLeft;

      if (handleClass.includes('r')) newWidth = startWidth + dx;
      if (handleClass.includes('l')) { newWidth = startWidth - dx; newLeft = startLeft + dx; }
      if (handleClass.includes('b')) newHeight = startHeight + dy;
      if (handleClass.includes('t')) { newHeight = startHeight - dy; newTop = startTop + dy; }

      // Enforce minimum dimension restrictions to avoid collapsing
      const minDimension = 20;
      if (newWidth > minDimension) {
        element.style.width = newWidth + 'px';
        element.style.left = newLeft + 'px';
      }
      if (newHeight > minDimension) {
        element.style.height = newHeight + 'px';
        element.style.top = newTop + 'px';
      }

      // Sync with data model
      elData.styles.width = element.style.width;
      elData.styles.height = element.style.height;
      elData.styles.top = element.style.top;
      elData.styles.left = element.style.left;
    };

    const stopDrag = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    document.onmouseup = stopDrag;
    document.onmousemove = doDrag;
  }

  scaleCanvas() {
    const container = document.querySelector('.canvas-container');
    const canvas = this.canvas;
    const scaler = document.getElementById('canvas-scaler');
    if (!container || !canvas || !scaler) return;

    const SLIDE_W = 960;
    const SLIDE_H = 540;
    const padding = 48;

    const availW = container.clientWidth - padding;
    const availH = container.clientHeight - padding;

    const scaleX = availW / SLIDE_W;
    const scaleY = availH / SLIDE_H;
    const scale = Math.min(scaleX, scaleY, 1);

    // Apply scale transform to the actual canvas
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'top left';

    // Set the scaler wrapper to the scaled dimensions so layout is preserved
    scaler.style.width = (SLIDE_W * scale) + 'px';
    scaler.style.height = (SLIDE_H * scale) + 'px';
  }

  highlightTableGrid(row, col) {
    const tableGrid = document.getElementById('table-picker-grid');
    if (!tableGrid) return;

    // Update the label text 
    const label = tableGrid.parentElement.querySelector('.table-picker-label');
    if (label) {
      if (row > 0 && col > 0) {
        label.innerText = `${col}x${row} Table`;
      } else {
        label.innerText = 'Insert Table';
      }
    }

    const cells = tableGrid.querySelectorAll('.table-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      if (r <= row && c <= col) {
        cell.classList.add('highlight');
      } else {
        cell.classList.remove('highlight');
      }
    });
  }

  setupSlideshowTab() {
    const btnStartBeginning = document.getElementById('btn-start-beginning');
    const btnStartCurrent = document.getElementById('btn-start-current');
    const btnHideSlide = document.getElementById('btn-hide-slide');

    if (btnStartBeginning) {
      btnStartBeginning.onclick = () => {
        this.startSlideshow(0);
      };
    }

    if (btnStartCurrent) {
      btnStartCurrent.onclick = () => {
        this.startSlideshow(this.currentSlideIndex);
      };
    }

    if (btnHideSlide) {
      btnHideSlide.onclick = () => {
        this.toggleHideSlide();
      };
    }

    const btnPresentOnline = document.getElementById('btn-present-online');
    if (btnPresentOnline) btnPresentOnline.onclick = () => alert("Present Online feature is not available in the web version.");

    const btnCustomSlideshow = document.getElementById('btn-custom-slideshow');
    if (btnCustomSlideshow) btnCustomSlideshow.onclick = () => alert("Custom Slide Show configuration not implemented yet.");

    const btnSetupSlideshow = document.getElementById('btn-setup-slideshow');
    if (btnSetupSlideshow) btnSetupSlideshow.onclick = () => alert("Set Up Slide Show dialog not implemented yet.");

    const btnRehearseTimings = document.getElementById('btn-rehearse-timings');
    if (btnRehearseTimings) btnRehearseTimings.onclick = () => alert("Rehearse Timings feature coming soon.");

    // =========== RECORD TAB ===========
    // State for recording
    let _recordStream = null;
    let _mediaRecorder = null;
    let _recordedChunks = [];
    let _recordStartTime = null;
    let _recordStatusEl = null;
    let _narrationAudios = {}; // slideIndex -> Blob

    const showRecordStatus = (msg, color = '#d13438') => {
      if (!_recordStatusEl) {
        _recordStatusEl = document.createElement('div');
        _recordStatusEl.id = 'record-status-bar';
        _recordStatusEl.style.cssText = `position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
          background:${color};color:#fff;padding:8px 24px;border-radius:6px;font-size:13px;
          z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;`;
        document.body.appendChild(_recordStatusEl);
      }
      _recordStatusEl.style.background = color;
      _recordStatusEl.innerHTML = msg;
      _recordStatusEl.style.display = 'flex';
    };

    const hideRecordStatus = () => {
      if (_recordStatusEl) _recordStatusEl.style.display = 'none';
    };

    const stopRecording = () => {
      if (_mediaRecorder && _mediaRecorder.state !== 'inactive') _mediaRecorder.stop();
      if (_recordStream) { _recordStream.getTracks().forEach(t => t.stop()); _recordStream = null; }
      hideRecordStatus();
    };

    // --- Record (narration per slide) ---
    const btnRecordSlideshow = document.getElementById('btn-record-slideshow');
    if (btnRecordSlideshow) {
      btnRecordSlideshow.querySelector('.button-top').onclick = async () => {
        if (_mediaRecorder && _mediaRecorder.state === 'recording') {
          // Stop recording
          stopRecording();
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          _recordStream = stream;
          _recordedChunks = [];
          _mediaRecorder = new MediaRecorder(stream);
          _mediaRecorder.ondataavailable = e => { if (e.data.size > 0) _recordedChunks.push(e.data); };
          _mediaRecorder.onstop = () => {
            const blob = new Blob(_recordedChunks, { type: 'audio/webm' });
            _narrationAudios[this.currentSlideIndex] = blob;
            showRecordStatus(`✅ Narration saved for slide ${this.currentSlideIndex + 1}`, '#107c10');
            setTimeout(hideRecordStatus, 2000);
          };
          _mediaRecorder.start();
          showRecordStatus(`🔴 Recording narration for slide ${this.currentSlideIndex + 1} — click Record again to stop`);
        } catch (e) {
          alert('Microphone access denied. Please allow microphone access to record narration.');
        }
      };
    }

    // From Beginning
    const btnRecordFromBeginning = document.getElementById('btn-record-from-beginning');
    if (btnRecordFromBeginning) btnRecordFromBeginning.onclick = () => {
      this.slideshowCurrentIndex = 0;
      this.startSlideshow();
    };

    // From Current Slide
    const btnRecordFromCurrent = document.getElementById('btn-record-from-current');
    if (btnRecordFromCurrent) btnRecordFromCurrent.onclick = () => this.startSlideshow();

    // Cameo (webcam overlay on current slide)
    const btnCameo = document.getElementById('btn-record-cameo');
    if (btnCameo) btnCameo.onclick = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.style.cssText = `position:fixed;bottom:80px;right:24px;width:200px;height:140px;z-index:9998;
          border:3px solid #d13438;border-radius:8px;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.4);`;
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `position:fixed;bottom:218px;right:24px;z-index:9999;background:#d13438;
          color:#fff;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;`;
        closeBtn.onclick = () => {
          stream.getTracks().forEach(t => t.stop());
          video.remove();
          closeBtn.remove();
        };
        document.body.appendChild(video);
        document.body.appendChild(closeBtn);
      } catch (e) {
        alert('Camera access denied. Please allow camera access to use Cameo.');
      }
    };

    // Screen Recording
    const btnScreenRec = document.getElementById('btn-screen-recording');
    if (btnScreenRec) btnScreenRec.onclick = async () => {
      if (_mediaRecorder && _mediaRecorder.state === 'recording') {
        stopRecording();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        _recordStream = stream;
        _recordedChunks = [];
        _mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
        _mediaRecorder.ondataavailable = e => { if (e.data.size > 0) _recordedChunks.push(e.data); };
        _mediaRecorder.onstop = () => {
          const blob = new Blob(_recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'screen-recording.webm';
          a.click();
          URL.revokeObjectURL(url);
        };
        stream.getVideoTracks()[0].onended = () => stopRecording();
        _mediaRecorder.start(1000);
        showRecordStatus('🔴 Screen Recording… click button again to stop');
      } catch (e) {
        alert('Screen capture denied or not supported.');
      }
    };

    // Insert Video from file
    const btnInsertVideo = document.getElementById('btn-insert-video');
    if (btnInsertVideo) btnInsertVideo.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const slide = this.slides[this.currentSlideIndex];
        slide.elements.push({
          id: `el-${Date.now()}`,
          type: 'video',
          src: url,
          styles: { top: '150px', left: '150px', width: '320px', height: '200px' }
        });
        this.renderCanvas();
      };
      input.click();
    };

    // Insert Audio from file
    const btnInsertAudio = document.getElementById('btn-insert-audio');
    if (btnInsertAudio) btnInsertAudio.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const slide = this.slides[this.currentSlideIndex];
        slide.elements.push({
          id: `el-${Date.now()}`,
          type: 'audio',
          src: url,
          styles: { top: '200px', left: '200px', width: '260px', height: '40px' }
        });
        this.renderCanvas();
      };
      input.click();
    };

    // Export to Video (exports canvas frames as WebM using MediaRecorder + captureStream)
    const btnExportVideo = document.getElementById('btn-export-video');
    if (btnExportVideo) btnExportVideo.onclick = async () => {
      const canvasEl = this.canvas;
      if (!canvasEl) { alert('No canvas found.'); return; }
      if (typeof canvasEl.captureStream !== 'function') {
        alert('Export to Video is not supported in this browser. Please use Chrome.');
        return;
      }
      showRecordStatus('🎬 Exporting slides as video... please wait.');
      const fps = 10;
      const frameDuration = 3000; // 3 seconds per slide
      const stream = canvasEl.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'presentation.webm';
        a.click();
        URL.revokeObjectURL(url);
        hideRecordStatus();
      };
      recorder.start();
      // Cycle through slides
      for (let i = 0; i < this.slides.length; i++) {
        this.currentSlideIndex = i;
        this.renderCanvas();
        await new Promise(r => setTimeout(r, frameDuration));
      }
      recorder.stop();
    };

    // Save as Show (download as JSON "show" file)
    const btnSaveAsShow = document.getElementById('btn-save-as-show');
    if (btnSaveAsShow) btnSaveAsShow.onclick = () => {
      const dataStr = JSON.stringify({ slides: this.slides, savedAsShow: true }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'presentation.ppsx.json';
      a.click();
    };

    // =========== REVIEW TAB ===========
    // -- Comments data store --
    if (!this.comments) this.comments = []; // [ { slideIndex, text, author, time, id } ]
    let _activeCommentId = null;
    let _showingComments = false;

    const getOrCreateReviewPanel = () => {
      let panel = document.getElementById('review-side-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'review-side-panel';
        panel.style.cssText = `position:fixed;right:0;top:90px;bottom:32px;width:280px;background:#fff;
          border-left:1px solid #d2d0ce;box-shadow:-2px 0 8px rgba(0,0,0,0.1);z-index:9000;
          display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;`;
        const header = document.createElement('div');
        header.style.cssText = `padding:12px 16px;border-bottom:1px solid #edebe9;display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:14px;`;
        header.innerHTML = `<span>Comments</span><button onclick="this.closest('#review-side-panel').style.display='none'"
          style="background:none;border:none;cursor:pointer;font-size:18px;color:#605e5c;">✕</button>`;
        const list = document.createElement('div');
        list.id = 'review-comments-list';
        list.style.cssText = `flex:1;overflow-y:auto;padding:8px;`;
        panel.appendChild(header);
        panel.appendChild(list);
        document.body.appendChild(panel);
      }
      return panel;
    };

    const renderComments = () => {
      const list = document.getElementById('review-comments-list');
      if (!list) return;
      const slideComments = (this.comments || []).filter(c => c.slideIndex === this.currentSlideIndex);
      if (slideComments.length === 0) {
        list.innerHTML = `<p style="color:#a19f9d;font-size:13px;padding:16px;text-align:center;">No comments on this slide.</p>`;
        return;
      }
      list.innerHTML = slideComments.map(c => `
        <div class="review-comment-card ${_activeCommentId === c.id ? 'active' : ''}"
          data-id="${c.id}"
          style="background:${_activeCommentId === c.id ? '#f3f9ff' : '#faf9f8'};border:1px solid ${_activeCommentId === c.id ? '#0078d4' : '#edebe9'};
            border-radius:6px;padding:10px 12px;margin-bottom:8px;cursor:pointer;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#605e5c;margin-bottom:6px;">
            <strong style="color:#323130;">${c.author}</strong>
            <span>${c.time}</span>
          </div>
          <div style="font-size:13px;color:#201f1e;">${c.text}</div>
        </div>`).join('');
      list.querySelectorAll('.review-comment-card').forEach(card => {
        card.onclick = () => { _activeCommentId = card.dataset.id; renderComments(); };
      });
    };

    // New Comment
    const btnNewComment = document.getElementById('btn-new-comment');
    if (btnNewComment) btnNewComment.onclick = () => {
      const text = prompt('Add a comment:');
      if (!text) return;
      if (!this.comments) this.comments = [];
      const now = new Date();
      this.comments.push({
        id: `cmt-${Date.now()}`,
        slideIndex: this.currentSlideIndex,
        text,
        author: 'You',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      const panel = getOrCreateReviewPanel();
      panel.style.display = 'flex';
      _showingComments = true;
      renderComments();
    };

    // Delete Comment
    const btnDeleteComment = document.getElementById('btn-delete-comment');
    if (btnDeleteComment) btnDeleteComment.onclick = () => {
      if (!_activeCommentId) { alert('Select a comment first by opening the Comments panel.'); return; }
      this.comments = this.comments.filter(c => c.id !== _activeCommentId);
      _activeCommentId = null;
      renderComments();
    };

    // Previous Comment
    const btnPrevComment = document.getElementById('btn-prev-comment');
    if (btnPrevComment) btnPrevComment.onclick = () => {
      const all = this.comments || [];
      if (!all.length) return;
      const idx = all.findIndex(c => c.id === _activeCommentId);
      const prevIdx = idx <= 0 ? all.length - 1 : idx - 1;
      _activeCommentId = all[prevIdx].id;
      this.currentSlideIndex = all[prevIdx].slideIndex;
      this.render();
      const panel = getOrCreateReviewPanel();
      panel.style.display = 'flex';
      renderComments();
    };

    // Next Comment
    const btnNextComment = document.getElementById('btn-next-comment');
    if (btnNextComment) btnNextComment.onclick = () => {
      const all = this.comments || [];
      if (!all.length) return;
      const idx = all.findIndex(c => c.id === _activeCommentId);
      const nextIdx = (idx + 1) % all.length;
      _activeCommentId = all[nextIdx].id;
      this.currentSlideIndex = all[nextIdx].slideIndex;
      this.render();
      const panel = getOrCreateReviewPanel();
      panel.style.display = 'flex';
      renderComments();
    };

    // Show/Hide Comments panel
    const btnShowComments = document.getElementById('btn-show-comments');
    if (btnShowComments) btnShowComments.onclick = () => {
      const panel = getOrCreateReviewPanel();
      _showingComments = !_showingComments;
      panel.style.display = _showingComments ? 'flex' : 'none';
      if (_showingComments) renderComments();
      btnShowComments.classList.toggle('active', _showingComments);
    };

    // --- Spelling ---
    const btnSpelling = document.getElementById('btn-spelling');
    if (btnSpelling) btnSpelling.onclick = () => {
      const slide = this.slides[this.currentSlideIndex];
      const texts = (slide.elements || []).filter(e => e.content).map(e => {
        const d = document.createElement('div');
        d.innerHTML = e.content;
        return d.textContent || '';
      });
      const allWords = texts.join(' ').split(/\s+/).filter(Boolean);
      // Simple check: words with repeated letters or common mistakes
      const issues = [];
      allWords.forEach(w => {
        const clean = w.replace(/[^a-zA-Z]/g, '');
        if (/(.)\1{2,}/.test(clean)) issues.push(clean); // 3+ repeated chars
      });
      if (issues.length === 0) {
        alert('✅ Spelling check complete — No obvious spelling issues found on this slide.');
      } else {
        alert(`⚠️ Possible spelling issues found:\n\n${[...new Set(issues)].join('\n')}`);
      }
    };

    // --- Thesaurus ---
    const btnThesaurus = document.getElementById('btn-thesaurus');
    if (btnThesaurus) btnThesaurus.onclick = () => {
      const word = prompt('Thesaurus: Enter a word to look up synonyms:');
      if (!word) return;
      window.open(`https://www.thesaurus.com/browse/${encodeURIComponent(word)}`, '_blank');
    };

    // --- Statistics ---
    const btnStatistics = document.getElementById('btn-statistics');
    if (btnStatistics) btnStatistics.onclick = () => {
      let totalWords = 0, totalChars = 0, totalSlides = this.slides.length;
      this.slides.forEach(slide => {
        (slide.elements || []).filter(e => e.content).forEach(e => {
          const d = document.createElement('div'); d.innerHTML = e.content;
          const t = d.textContent || '';
          totalChars += t.length;
          totalWords += t.trim() ? t.trim().split(/\s+/).length : 0;
        });
      });
      const msg = `📊 Presentation Statistics\n\n` +
        `  Slides:     ${totalSlides}\n` +
        `  Words:      ${totalWords}\n` +
        `  Characters: ${totalChars}\n` +
        `  Comments:   ${(this.comments || []).length}`;
      alert(msg);
    };

    // --- Check Accessibility ---
    const btnCheckAccessibility = document.getElementById('btn-check-accessibility');
    if (btnCheckAccessibility) btnCheckAccessibility.onclick = () => {
      const issues = [];
      this.slides.forEach((slide, i) => {
        (slide.elements || []).forEach(el => {
          if ((el.type === 'image' || el.type === 'video') && !el.alt) {
            issues.push(`Slide ${i + 1}: Media element missing alt text`);
          }
          if (el.styles?.backgroundColor && el.styles?.color) {
            issues.push(`Slide ${i + 1}: Check text/background color contrast`);
          }
        });
        if (!(slide.elements || []).some(e => e.content?.trim())) {
          issues.push(`Slide ${i + 1}: Slide has no readable text`);
        }
      });
      if (issues.length === 0) {
        alert('✅ Accessibility check complete — No issues found!');
      } else {
        alert(`⚠️ Accessibility Issues (${issues.length}):\n\n${issues.join('\n')}`);
      }
    };

    // --- Smart Lookup ---
    const btnSmartLookup = document.getElementById('btn-smart-lookup');
    if (btnSmartLookup) btnSmartLookup.onclick = () => {
      const query = prompt('Smart Lookup: What would you like to search for?') ||
        (() => {
          const sel = window.getSelection(); return sel ? sel.toString().trim() : '';
        })();
      if (!query) return;
      window.open(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank');
    };

    // --- Translate ---
    const btnTranslate = document.getElementById('btn-translate');
    if (btnTranslate) btnTranslate.onclick = () => {
      const slide = this.slides[this.currentSlideIndex];
      const texts = (slide.elements || []).filter(e => e.content).map(e => {
        const d = document.createElement('div'); d.innerHTML = e.content;
        return d.textContent || '';
      }).join(' ');
      const lang = prompt('Translate to (language code, e.g. es, fr, de, hi, zh):') || 'es';
      window.open(`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(texts)}&op=translate`, '_blank');
    };

    // --- Language ---
    const btnLanguage = document.getElementById('btn-language');
    if (btnLanguage) btnLanguage.onclick = () => {
      const languages = ['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Hindi', 'Chinese (Simplified)', 'Arabic', 'Japanese', 'Portuguese'];
      const current = this.proofingLanguage || 'English (US)';
      const chosen = prompt(`Set Proofing Language:\n\n${languages.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\nCurrent: ${current}\n\nEnter number:`);
      const idx = parseInt(chosen) - 1;
      if (idx >= 0 && idx < languages.length) {
        this.proofingLanguage = languages[idx];
        alert(`✅ Proofing language set to: ${this.proofingLanguage}`);
      }
    };

    const selectMonitor = document.getElementById('select-monitor');
    if (selectMonitor) selectMonitor.onchange = () => console.log("Monitor changed");

    const chkPresenterView = document.getElementById('chk-presenter-view');
    if (chkPresenterView) chkPresenterView.onchange = () => console.log("Presenter View changed");

    // Slideshow controls
    const prevBtn = document.getElementById('slideshow-prev');
    const nextBtn = document.getElementById('slideshow-next');
    const exitBtn = document.getElementById('slideshow-exit');

    if (prevBtn) prevBtn.onclick = () => this.navigateSlideshow(-1);
    if (nextBtn) nextBtn.onclick = () => this.navigateSlideshow(1);
    if (exitBtn) exitBtn.onclick = () => this.exitSlideshow();

    document.addEventListener('keydown', (e) => {
      const container = document.getElementById('slideshow-container');
      if (container && container.style.display === 'flex') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          this.navigateSlideshow(1);
        } else if (e.key === 'ArrowLeft') {
          this.navigateSlideshow(-1);
        } else if (e.key === 'Escape') {
          this.exitSlideshow();
        }
      }
    });
  }

  startSlideshow(startIndex = 0) {
    if (this.slides.length === 0) return;

    // Find the first non-hidden slide starting from startIndex
    let actualStartIndex = startIndex;
    while (actualStartIndex < this.slides.length && this.slides[actualStartIndex].hidden) {
      actualStartIndex++;
    }

    // If all remaining slides are hidden, don't start
    if (actualStartIndex >= this.slides.length) {
      alert("No visible slides to show from this point.");
      return;
    }

    this.slideshowCurrentIndex = actualStartIndex;
    this.slideshowAnimationIndex = 0;
    const container = document.getElementById('slideshow-container');
    if (container) {
      container.style.display = 'flex';

      // Auto-focus container or document body to ensure keydowns fire
      const focusTarget = container.hasAttribute('tabindex') ? container : document.body;
      focusTarget.focus();

      this.renderSlideshowSlide();

      // Attempt fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    }
  }

  exitSlideshow() {
    const container = document.getElementById('slideshow-container');
    if (container) {
      container.style.display = 'none';
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }

      // Update main editor view to the slide user navigated to during slideshow
      this.currentSlideIndex = this.slideshowCurrentIndex;
      this.slideshowAnimationIndex = 0;
      this.render();
    }
  }

  navigateSlideshow(direction) {
    const canvas = document.getElementById('slideshow-canvas');
    if (!canvas) return;

    // Find all elements with animations that haven't played yet
    const animatedElements = Array.from(canvas.querySelectorAll('.pending-animation'));

    // If we're moving forward and there are pending animations on THIS slide
    if (direction > 0 && animatedElements.length > 0) {
      const nextAnimEl = animatedElements[0];
      nextAnimEl.classList.remove('pending-animation');
      const animId = nextAnimEl.dataset.animation;
      if (animId) {
        nextAnimEl.classList.add(`anim-${animId}`);
      }
      return; // Don't move to next slide yet
    }

    let nextIndex = this.slideshowCurrentIndex + direction;

    // Find next non-hidden slide
    while (nextIndex >= 0 && nextIndex < this.slides.length) {
      if (!this.slides[nextIndex].hidden) {
        this.slideshowCurrentIndex = nextIndex;
        this.slideshowAnimationIndex = 0;
        this.renderSlideshowSlide();
        return;
      }
      nextIndex += direction;
    }

    // If we've reached the end
    if (nextIndex >= this.slides.length && direction > 0) {
      this.exitSlideshow();
    }
  }

  toggleHideSlide() {
    if (this.slides.length === 0) return;
    const slide = this.slides[this.currentSlideIndex];
    slide.hidden = !slide.hidden;

    const uiBtn = document.getElementById('btn-hide-slide');
    if (uiBtn) {
      if (slide.hidden) {
        uiBtn.classList.add('active');
      } else {
        uiBtn.classList.remove('active');
      }
    }
    this.renderSlideList();
  }

  renderSlideshowSlide() {
    const canvas = document.getElementById('slideshow-canvas');
    if (!canvas) return;
    const slide = this.slides[this.slideshowCurrentIndex];
    if (!slide) return;

    canvas.innerHTML = '';

    // Apply transition for this slide
    const slideTrans = slide.transition;
    if (slideTrans && slideTrans !== 'none') {
      canvas.className = canvas.className.replace(/trans-\w[-\w]*/g, '').trim();
      void canvas.offsetWidth;
      canvas.classList.add(`trans-${slideTrans}`);
      setTimeout(() => {
        canvas.className = canvas.className.replace(/trans-\w[-\w]*/g, '').trim();
      }, 1200);
    }

    // Calculate aspect ratio scaling
    const container = document.getElementById('slideshow-container');
    const scaleX = window.innerWidth / 960;
    const scaleY = window.innerHeight / 540;
    const scale = Math.min(scaleX, scaleY) * 0.95; // 95% of screen size to fit nicely

    canvas.style.transform = `scale(${scale})`;

    slide.elements.forEach(el => {
      const domEl = document.createElement('div');
      domEl.className = 'canvas-element pointer-events-none';
      domEl.setAttribute('data-id', el.id);
      domEl.setAttribute('data-type', el.type);

      // Animation initialization
      if (el.animation && el.animation !== 'none') {
        domEl.classList.add('pending-animation');
        domEl.setAttribute('data-animation', el.animation);
        // Initially hide until next click
        domEl.style.opacity = '0';
      }

      if (el.type === 'text') {
        Object.assign(domEl.style, el.styles);
        domEl.innerHTML = el.content || '';
      } else if (el.type === 'image') {
        Object.assign(domEl.style, el.styles);
        domEl.style.backgroundImage = `url(${el.src})`;
        domEl.style.backgroundSize = 'contain';
        domEl.style.backgroundPosition = 'center';
        domEl.style.backgroundRepeat = 'no-repeat';
      } else if (el.type === 'shape') {
        Object.assign(domEl.style, el.styles);
        const clipPath = this.getShapeClipPath(el.shapeType, el.adjustments);
        if (clipPath) domEl.style.clipPath = clipPath;
      } else if (el.type === 'table') {
        Object.assign(domEl.style, el.styles);
        domEl.innerHTML = el.content || '';
      }

      canvas.appendChild(domEl);

      if (el.type === 'shape' && el.content) {
        const textEl = document.createElement('div');
        textEl.innerHTML = el.content;
        textEl.style.position = 'absolute';
        textEl.style.top = '0';
        textEl.style.left = '0';
        textEl.style.width = '100%';
        textEl.style.height = '100%';
        textEl.style.display = 'flex';
        textEl.style.alignItems = el.styles['data-valign'] || 'center';
        textEl.style.justifyContent = el.styles.textAlign || 'center';
        textEl.style.color = '#fff';
        textEl.style.pointerEvents = 'none';
        Object.assign(textEl.style, {
          padding: el.styles.padding || '10px',
          fontSize: el.styles.fontSize || '16pt',
          fontFamily: el.styles.fontFamily || 'Calibri',
          fontWeight: el.styles.fontWeight || 'normal',
          fontStyle: el.styles.fontStyle || 'normal',
          textDecoration: el.styles.textDecoration || 'none'
        });
        domEl.appendChild(textEl);
      }
    });
  }

  setupViewTab() {
    // Presentation Views
    const btnNormal = document.getElementById('view-normal');
    const btnOutline = document.getElementById('view-outline');
    const btnSlideSorter = document.getElementById('view-slide-sorter');
    const btnNotesPage = document.getElementById('view-notes-page');
    const btnReading = document.getElementById('view-reading');

    if (btnNormal) btnNormal.onclick = () => this.switchView('normal');
    if (btnOutline) btnOutline.onclick = () => this.switchView('outline');
    if (btnSlideSorter) btnSlideSorter.onclick = () => this.switchView('sorter');
    if (btnNotesPage) btnNotesPage.onclick = () => this.switchView('notes');
    if (btnReading) btnReading.onclick = () => this.startSlideshow();

    // Show options
    const chkRuler = document.getElementById('show-ruler');
    const chkGridlines = document.getElementById('show-gridlines');
    const chkGuides = document.getElementById('show-guides');

    if (chkRuler) chkRuler.onchange = (e) => {
      document.getElementById('slide-canvas-container').classList.toggle('show-ruler', e.target.checked);
    };
    if (chkGridlines) chkGridlines.onchange = (e) => {
      document.getElementById('slide-canvas-container').classList.toggle('show-gridlines-active', e.target.checked);
    };
    if (chkGuides) chkGuides.onchange = (e) => {
      document.getElementById('slide-canvas-container').classList.toggle('show-guides-active', e.target.checked);
    };

    // Zoom
    const btnZoom = document.getElementById('view-zoom');
    const btnFitWindow = document.getElementById('view-fit-window');

    if (btnZoom) btnZoom.onclick = () => {
      const level = prompt('Enter zoom percentage (e.g. 50, 100, 200):', this.zoomLevel || 100);
      if (level && !isNaN(level)) {
        this.setZoom(parseInt(level));
      }
    };
    if (btnFitWindow) btnFitWindow.onclick = () => this.scaleCanvas();

    // Window
    const btnNewWindow = document.getElementById('view-new-window');
    if (btnNewWindow) btnNewWindow.onclick = () => window.open(window.location.href, '_blank');

    const btnSwitchWindows = document.getElementById('view-switch-windows');
    if (btnSwitchWindows) btnSwitchWindows.onclick = () => alert('Switch Windows: You have 1 presentation window open.');

    // Master Views (Placeholders)
    const btnSlideMaster = document.getElementById('view-slide-master');
    if (btnSlideMaster) btnSlideMaster.onclick = () => alert('Slide Master View: This would allow editing slide layouts.');
  }

  switchView(viewType) {
    // Reset all
    const editorArea = document.getElementById('main-editor-area');
    const sorterView = document.getElementById('slide-sorter-view');
    const workspace = document.getElementById('main-workspace');
    const slideList = document.getElementById('slide-list');

    if (editorArea) editorArea.style.display = 'flex';
    if (sorterView) {
      sorterView.classList.remove('active');
      sorterView.style.display = 'none';
    }
    if (workspace) workspace.classList.remove('notes-page-active');
    if (slideList) slideList.style.display = 'block';

    // Handle specific views
    if (viewType === 'sorter') {
      if (editorArea) editorArea.style.display = 'none';
      if (sorterView) {
        sorterView.classList.add('active');
        sorterView.style.display = 'grid';
        this.renderSlideSorter();
      }
    } else if (viewType === 'notes') {
      if (workspace) workspace.classList.add('notes-page-active');
      const slide = this.slides[this.currentSlideIndex];

      // Update Page Number
      const pageNum = document.getElementById('notes-page-number');
      if (pageNum) pageNum.innerText = this.currentSlideIndex + 1;

      // Render Preview
      this.renderNotesPreview();

      const textarea = document.getElementById('notes-page-textarea');
      if (textarea) {
        textarea.value = slide.notes || '';
        textarea.oninput = (e) => { slide.notes = e.target.value; };
      }
    }
    else if (viewType === 'outline') {
      alert('Outline View: Transforms the slide list into a text-only outline.');
    }

    // Update ribbon active states
    document.querySelectorAll('[id^="view-"]').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`view-${viewType === 'sorter' ? 'slide-sorter' : viewType}`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  renderSlideSorter() {
    const sorter = document.getElementById('slide-sorter-view');
    if (!sorter) return;
    sorter.innerHTML = '';
    this.slides.forEach((slide, index) => {
      const item = document.createElement('div');
      item.className = `sorter-item ${index === this.currentSlideIndex ? 'active' : ''}`;

      const thumbContainer = document.createElement('div');
      thumbContainer.className = 'sorter-thumb';
      thumbContainer.style.background = slide.background || '#fff';

      // Simplified preview of slide elements
      (slide.elements || []).slice(0, 5).forEach(el => {
        const preview = document.createElement('div');
        preview.style.cssText = `position:absolute;background:${el.type === 'text' ? '#666' : '#ccc'};
            left:${parseInt(el.styles.left) / 5}px;top:${parseInt(el.styles.top) / 5}px;
            width:${parseInt(el.styles.width) / 5}px;height:${parseInt(el.styles.height) / 5}px;
            border-radius:1px;`;
        thumbContainer.appendChild(preview);
      });

      item.appendChild(thumbContainer);
      const label = document.createElement('div');
      label.className = 'sorter-label';
      label.innerText = index + 1;
      item.appendChild(label);

      item.onclick = () => {
        this.currentSlideIndex = index;
        this.switchView('normal');
        this.render();
      };
      sorter.appendChild(item);
    });
  }

  renderNotesPreview() {
    const previewContainer = document.getElementById('notes-slide-preview-content');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    const slide = this.slides[this.currentSlideIndex];
    if (!slide) return;

    // Set background
    previewContainer.style.background = slide.background || '#fff';

    // Scale to fit wrapper
    const wrapper = document.querySelector('.notes-slide-wrapper');
    if (wrapper) {
      const scale = wrapper.clientWidth / 960;
      previewContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    (slide.elements || []).forEach(el => {
      const domEl = document.createElement('div');
      domEl.className = 'canvas-element pointer-events-none';
      domEl.style.position = 'absolute';
      Object.assign(domEl.style, el.styles);

      if (el.type === 'text') {
        domEl.innerHTML = el.content || '';
      } else if (el.type === 'image') {
        domEl.style.backgroundImage = `url(${el.src})`;
        domEl.style.backgroundSize = 'contain';
        domEl.style.backgroundPosition = 'center';
        domEl.style.backgroundRepeat = 'no-repeat';
      } else if (el.type === 'shape') {
        const clipPath = this.getShapeClipPath ? this.getShapeClipPath(el.shapeType, el.adjustments) : null;
        if (clipPath) domEl.style.clipPath = clipPath;
        if (el.content) {
          const textEl = document.createElement('div');
          textEl.innerHTML = el.content;
          textEl.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;padding:10px;`;
          domEl.appendChild(textEl);
        }
      }
      previewContainer.appendChild(domEl);
    });
  }

  setZoom(level) {
    this.zoomLevel = level;
    const scaler = document.getElementById('canvas-scaler');
    if (scaler) {
      scaler.style.transform = `scale(${level / 100})`;
    }
    const zoomText = document.querySelector('.zoom-controls span');
    if (zoomText) zoomText.innerText = `${level}%`;
  }

  setupBackstageView() {
    const overlay = document.getElementById('backstage-overlay');
    if (!overlay) return;

    // Show on launch
    overlay.style.display = 'flex';
    this.updateBackstageGreeting();
    this.renderRecentFiles();
    if (window.lucide) window.lucide.createIcons();

    const fileTab = document.querySelector('.file-tab');
    const backBtn = document.getElementById('backstage-back');

    // Open backstage when File tab is clicked
    if (fileTab) {
      fileTab.onclick = () => {
        overlay.style.display = 'flex';
        this.updateBackstageGreeting();
        this.renderRecentFiles();
        if (window.lucide) window.lucide.createIcons();
        this.switchBsPanel('home');
      };
    }

    // Close backstage (back button)
    if (backBtn) {
      backBtn.onclick = () => {
        overlay.style.display = 'none';
      };
    }

    // All nav items
    const navItems = overlay.querySelectorAll('.backstage-nav-item');
    navItems.forEach(item => {
      item.onclick = () => {
        const panel = item.dataset.bsPanel;
        if (!panel) return;
        this.switchBsPanel(panel);
      };
    });

    // Template selection
    overlay.querySelectorAll('.bs-template-card').forEach(card => {
      card.onclick = () => {
        const template = card.dataset.template;
        if (template === 'blank' || confirm(`Start a new presentation using the "${card.querySelector('span').innerText}" template? Unsaved changes will be lost.`)) {
          // Reset slides
          this.slides = [];

          if (template === 'blank') {
            // Initialize with Title slide for blank presentation
            this.addSlide('title');
          } else {
            // Other templates logic
            this.slides = [{ id: 'slide-1', elements: [], background: '#ffffff', layout: 'blank' }];
            this.slides[0].elements.push({
              id: 'el-' + Date.now(),
              type: 'text',
              content: 'Click to add title',
              styles: { top: '100px', left: '100px', width: '760px', height: '100px', fontSize: '44pt', fontWeight: 'bold', textAlign: 'center' }
            });
          }
          this.currentSlideIndex = 0;
          this.render();
          overlay.style.display = 'none';
        }
      };
    });


    // ---- Action buttons ----

    const saveAsBtn = document.getElementById('bs-download-json');
    if (saveAsBtn) {
      saveAsBtn.onclick = () => {
        const dataStr = JSON.stringify({ slides: this.slides }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'presentation.json';
        a.click();
        this.addToRecentFiles('presentation.json', 'Downloads');
      };
    }

    // Tabs logic (Recent, Favorites, Shared)
    const backstageTabs = overlay.querySelectorAll('.bs-tab');
    backstageTabs.forEach(tab => {
      tab.onclick = () => {
        backstageTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeBsTab = tab.dataset.tab;
        this.renderRecentFiles();
      };
    });
  }

  updateBackstageGreeting() {
    const greetingEl = document.getElementById('bs-greeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    else if (hour >= 17) greeting = "Good evening";

    greetingEl.innerText = greeting;
  }

  switchBsPanel(panelId) {
    // Update active nav item
    document.querySelectorAll('#backstage-overlay .backstage-nav-item').forEach(i => {
      i.classList.toggle('active', i.dataset.bsPanel === panelId);
    });
    // Show the correct content panel
    document.querySelectorAll('#backstage-overlay .bs-panel').forEach(p => {
      p.classList.toggle('active', p.id === `bs-panel-${panelId}`);
    });
    // For save, trigger immediately
    if (panelId === 'save') {
      const dataStr = JSON.stringify({ slides: this.slides }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'presentation.json';
      a.click();
      this.addToRecentFiles('presentation.json', 'Downloads');
    }
  }

  setupEditingGroup() {
    // Ribbon Buttons
    if (this.findBtn) {
      this.findBtn.onclick = () => this.showFindDialog();
    }
    if (this.replaceBtn) {
      this.replaceBtn.onclick = () => this.showReplaceDialog();
    }
    if (this.selectBtn) {
      this.selectBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = this.selectDropdown.classList.contains('show');
        document.querySelectorAll('.ribbon-dropdown-menu').forEach(m => m.classList.remove('show'));
        if (!isOpen) this.selectDropdown.classList.add('show');
      };
    }

    // Select Dropdown Items
    if (this.selectAllBtn) {
      this.selectAllBtn.onclick = () => {
        this.selectDropdown.classList.remove('show');
        this.selectAllElements();
      };
    }
    if (this.toggleSelectionPaneBtn) {
      this.toggleSelectionPaneBtn.onclick = () => {
        this.selectDropdown.classList.remove('show');
        this.toggleSelectionPane();
      };
    }

    // Find Dialog Buttons
    const closeFind = document.getElementById('close-find-dialog');
    const closeFindBtn = document.getElementById('close-find-btn');
    if (closeFind) closeFind.onclick = () => this.hideFindDialog();
    if (closeFindBtn) closeFindBtn.onclick = () => this.hideFindDialog();

    const findNextBtn = document.getElementById('find-next-btn');
    if (findNextBtn) findNextBtn.onclick = () => this.handleFindNext();

    const switchToReplace = document.getElementById('switch-to-replace-btn');
    if (switchToReplace) {
      switchToReplace.onclick = () => {
        this.hideFindDialog();
        this.showReplaceDialog();
      };
    }

    // Replace Dialog Buttons
    const closeReplace = document.getElementById('close-replace-dialog');
    const closeReplaceBtn = document.getElementById('replace-close-btn');
    if (closeReplace) closeReplace.onclick = () => this.hideReplaceDialog();
    if (closeReplaceBtn) closeReplaceBtn.onclick = () => this.hideReplaceDialog();

    const replaceFindNextBtn = document.getElementById('replace-find-next-btn');
    if (replaceFindNextBtn) replaceFindNextBtn.onclick = () => this.handleReplaceFindNext();

    const replaceOneBtn = document.getElementById('replace-one-btn');
    if (replaceOneBtn) replaceOneBtn.onclick = () => this.handleReplaceOne();

    const replaceAllBtn = document.getElementById('replace-all-btn');
    if (replaceAllBtn) replaceAllBtn.onclick = () => this.handleReplaceAll();

    // Selection Pane Buttons
    if (this.closeSelectionPaneBtn) {
      this.closeSelectionPaneBtn.onclick = () => this.toggleSelectionPane(false);
    }
    const showAllBtn = document.getElementById('show-all-btn');
    const hideAllBtn = document.getElementById('hide-all-btn');
    if (showAllBtn) showAllBtn.onclick = () => this.setAllElementsVisibility(true);
    if (hideAllBtn) hideAllBtn.onclick = () => this.setAllElementsVisibility(false);
  }

  setupWindowControls() {
    const winMinBtn = document.getElementById('win-min-btn');
    const winMaxBtn = document.getElementById('win-max-btn');
    const winCloseBtn = document.getElementById('win-close-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const app = document.getElementById('app');

    if (winMinBtn && app && restoreBtn) {
      winMinBtn.onclick = () => {
        app.classList.add('minimized');
        restoreBtn.classList.add('show');
      };
      restoreBtn.onclick = () => {
        app.classList.remove('minimized');
        restoreBtn.classList.remove('show');
      };
    }

    if (winMaxBtn) {
      winMaxBtn.onclick = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      };
    }

    if (winCloseBtn) {
      winCloseBtn.onclick = () => {
        if (confirm("Are you sure you want to close this presentation? Any unsaved changes may be lost.")) {
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100vw';
          overlay.style.height = '100vh';
          overlay.style.backgroundColor = '#b7472a';
          overlay.style.color = 'white';
          overlay.style.display = 'flex';
          overlay.style.flexDirection = 'column';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          overlay.style.zIndex = '100000';
          overlay.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
          overlay.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 20px;">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <h1 style="font-size: 28px; font-weight: 300; margin: 0;">PowerPoint</h1>
            <p style="margin-top: 20px; font-size: 16px; opacity: 0.9;">The presentation has been closed.</p>
            <button id="reopen-btn" style="margin-top: 40px; padding: 10px 24px; background: white; color: #b7472a; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">Reopen Presentation</button>
          `;
          document.body.appendChild(overlay);

          document.getElementById('reopen-btn').onclick = () => {
            document.body.removeChild(overlay);
          };
        }
      };
    }
  }

  showFindDialog() {
    if (this.findDialog) {
      this.findDialog.style.display = 'block';
      if (this.findWhatInput) this.findWhatInput.focus();
    }
  }

  hideFindDialog() {
    if (this.findDialog) this.findDialog.style.display = 'none';
  }

  showReplaceDialog() {
    if (this.replaceDialog) {
      if (this.findWhatInput && this.replaceFindWhatInput) {
        this.replaceFindWhatInput.value = this.findWhatInput.value;
      }
      this.replaceDialog.style.display = 'block';
      if (this.replaceFindWhatInput) this.replaceFindWhatInput.focus();
    }
  }

  hideReplaceDialog() {
    if (this.replaceDialog) this.replaceDialog.style.display = 'none';
  }

  handleFindNext() {
    const query = this.findWhatInput.value;
    if (!query) return;
    const matchCase = document.getElementById('match-case').checked;
    const wholeWord = document.getElementById('find-whole-words').checked;
    this.findAndSelect(query, { matchCase, wholeWord });
  }

  handleReplaceFindNext() {
    const query = this.replaceFindWhatInput.value;
    if (!query) return;
    const matchCase = document.getElementById('replace-match-case').checked;
    const wholeWord = document.getElementById('replace-whole-words').checked;
    this.findAndSelect(query, { matchCase, wholeWord });
  }

  handleReplaceOne() {
    const query = this.replaceFindWhatInput.value;
    const replacement = this.replaceWithInput.value;
    if (!query || !this.selectedElement) return;

    const el = this.slides[this.currentSlideIndex].elements.find(e => e.id === this.selectedId);
    if (!el || el.type !== 'text') return;

    const matchCase = document.getElementById('replace-match-case').checked;
    const wholeWord = document.getElementById('replace-whole-words').checked;
    const flags = matchCase ? '' : 'i';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery, flags);

    if (regex.test(el.content)) {
      // Basic replacement in content (caution: may affect HTML tags if same text)
      el.content = el.content.replace(regex, replacement);
      this.render();
    }
    this.handleReplaceFindNext();
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.position = 'fixed';
    toast.style.bottom = '40px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.backgroundColor = '#323130';
    toast.style.color = 'white';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '4px';
    toast.style.fontSize = '12px';
    toast.style.zIndex = '100000';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    toast.innerText = message;

    document.body.appendChild(toast);

    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  handleReplaceAll() {
    const query = this.replaceFindWhatInput.value;
    const replacement = this.replaceWithInput.value;
    if (!query) return;

    const matchCase = document.getElementById('replace-match-case').checked;
    const wholeWord = document.getElementById('replace-whole-words').checked;
    const flags = matchCase ? 'g' : 'gi';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery, flags);

    let count = 0;
    this.slides.forEach(slide => {
      slide.elements.forEach(el => {
        if (el.type === 'text' && regex.test(el.content)) {
          const original = el.content;
          el.content = el.content.replace(regex, replacement);
          if (original !== el.content) count++;
        }
      });
    });

    alert(`Made ${count} replacements.`);
    this.render();
  }

  findAndSelect(query, options) {
    const { matchCase, wholeWord } = options;
    const flags = matchCase ? '' : 'i';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery, flags);

    const stripHtml = (html) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };

    const slides = this.slides;

    // 0. Check if ANY match exists at all in the whole presentation
    let hasAnyMatch = false;
    for (const slide of slides) {
      for (const el of slide.elements) {
        if (el.type === 'text' && regex.test(stripHtml(el.content))) {
          hasAnyMatch = true;
          break;
        }
      }
      if (hasAnyMatch) break;
    }

    if (!hasAnyMatch) {
      alert("PowerPoint reached the end of the presentation. The search item was not found.");
      return;
    }

    let startSlide = this.currentSlideIndex;
    let startElIndex = -1;

    if (this.selectedId) {
      startElIndex = slides[startSlide].elements.findIndex(el => el.id === this.selectedId);
    }

    // 1. Search current slide after selection
    for (let j = startElIndex + 1; j < slides[startSlide].elements.length; j++) {
      const el = slides[startSlide].elements[j];
      if (el.type === 'text' && regex.test(stripHtml(el.content))) {
        this.selectElement(document.getElementById(el.id));
        return;
      }
    }

    // 2. Search other slides
    for (let i = 1; i < slides.length; i++) {
      const slideIdx = (startSlide + i) % slides.length;
      const currentSlide = slides[slideIdx];
      for (let el of currentSlide.elements) {
        if (el.type === 'text' && regex.test(stripHtml(el.content))) {
          if (slideIdx !== this.currentSlideIndex) {
            this.currentSlideIndex = slideIdx;
            this.render();
          }
          setTimeout(() => {
            const domEl = document.getElementById(el.id);
            if (domEl) this.selectElement(domEl);
          }, 50);
          return;
        }
      }
    }

    // 3. Search beginning of current slide up to selection
    for (let j = 0; j <= startElIndex; j++) {
      const el = slides[startSlide].elements[j];
      if (el.type === 'text' && regex.test(stripHtml(el.content))) {
        this.selectElement(document.getElementById(el.id));
        return;
      }
    }
  }

  selectAllElements() {
    const slide = this.slides[this.currentSlideIndex];
    if (slide && slide.elements.length > 0) {
      this.selectElement(document.getElementById(slide.elements[0].id));
    }
  }

  toggleSelectionPane(force) {
    const show = force !== undefined ? force : this.selectionPane.style.display === 'none';
    this.selectionPane.style.display = show ? 'flex' : 'none';
    if (show) this.updateSelectionPane();
  }

  updateSelectionPane() {
    if (!this.selectionList) return;
    this.selectionList.innerHTML = '';
    const slide = this.slides[this.currentSlideIndex];
    if (!slide) return;

    [...slide.elements].reverse().forEach(el => {
      const item = document.createElement('div');
      item.className = 'selection-item' + (this.selectedId === el.id ? ' selected' : '');

      const eye = document.createElement('i');
      eye.setAttribute('data-lucide', el.hidden ? 'eye-off' : 'eye');
      eye.className = 'selection-item-eye' + (el.hidden ? ' hidden' : '');
      eye.onclick = (e) => {
        e.stopPropagation();
        el.hidden = !el.hidden;
        this.render();
        this.updateSelectionPane();
      };

      const name = document.createElement('span');
      name.className = 'selection-item-name';
      name.innerText = el.name || `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} ${el.id.split('-').pop()}`;

      item.appendChild(eye);
      item.appendChild(name);

      item.onclick = () => {
        this.selectElement(document.getElementById(el.id));
        this.updateSelectionPane();
      };

      this.selectionList.appendChild(item);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  setAllElementsVisibility(visible) {
    const slide = this.slides[this.currentSlideIndex];
    if (!slide) return;
    slide.elements.forEach(el => el.hidden = !visible);
    this.render();
    this.updateSelectionPane();
  }
}

window.onload = () => {
  window.app = new PowerPointApp();
  window.app.scaleCanvas();
  window.app.setupBackstageView();
  window.addEventListener('resize', () => window.app.scaleCanvas());
};
