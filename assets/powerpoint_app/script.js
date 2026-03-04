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
    this.drawMode = false;
    this.drawColor = '#000000';
    this.drawSize = 3;
    this.currentTool = 'pointer';
    this.slideTransitions = {};
    this.slideAnimations = {};

    this.initElements();
    this.addDefaultSlides();
    this.render();
    this.setupInsertTab();
    this.setupDrawTab();
    this.setupDesignTab();
    this.setupTransitionsTab();
    this.setupAnimationsTab();
  }

  initElements() {
    this.slideList = document.getElementById('slide-list');
    this.canvas = document.getElementById('canvas');
    this.tabs = document.querySelectorAll('.tab-btn');

    this.newSlideBtn = document.getElementById('new-slide-btn');
    this.newSlideDefault = document.getElementById('new-slide-default');
    this.newSlideArrow = document.getElementById('new-slide-arrow');
    this.layoutDropdown = document.getElementById('layout-dropdown');
    this.layoutOptions = document.querySelectorAll('.layout-option');
    this.resetSlideBtn = document.getElementById('reset-slide-btn');

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
    this.highlightColorBtn = document.getElementById('highlight-color-btn');

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

    this.setupEvents();
  }

  setupEvents() {
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

    // Layout Options
    this.layoutOptions.forEach(opt => {
      opt.onclick = () => {
        const layout = opt.getAttribute('data-layout');
        this.addSlide(layout);
        this.layoutDropdown.classList.remove('show');
      };
    });

    if (this.resetSlideBtn) this.resetSlideBtn.onclick = () => this.resetCurrentSlide();

    if (this.boldBtn) this.boldBtn.onclick = () => this.toggleSimpleStyle('fontWeight', 'bold', 'normal');
    if (this.italicBtn) this.italicBtn.onclick = () => this.toggleSimpleStyle('fontStyle', 'italic', 'normal');
    if (this.underlineBtn) this.underlineBtn.onclick = () => this.toggleSimpleStyle('textDecoration', 'underline', 'none');
    if (this.strikethroughBtn) this.strikethroughBtn.onclick = () => this.toggleSimpleStyle('textDecoration', 'line-through', 'none');

    if (this.shadowBtn) this.shadowBtn.onclick = () => this.toggleShadow();
    if (this.growFontBtn) this.growFontBtn.onclick = () => this.changeFontSize(1.2);
    if (this.shrinkFontBtn) this.shrinkFontBtn.onclick = () => this.changeFontSize(0.8);
    if (this.clearFormattingBtn) this.clearFormattingBtn.onclick = () => this.clearFormatting();
    if (this.changeCaseBtn) this.changeCaseBtn.onclick = () => this.cycleCase();
    if (this.spacingBtn) this.spacingBtn.onclick = () => this.toggleSpacing();

    if (this.fontSelect) {
      this.fontSelect.onchange = (e) => this.applyStyle('fontFamily', e.target.value);
    }
    if (this.sizeSelect) {
      this.sizeSelect.onchange = (e) => this.applyStyle('fontSize', e.target.value + 'pt');
    }

    if (this.fontColorBtn) this.fontColorBtn.onclick = () => {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, '#c43e1c');
      this.syncDataWithSelection();
    };
    if (this.highlightColorBtn) this.highlightColorBtn.onclick = () => {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('backColor', false, '#ffff00');
      this.syncDataWithSelection();
    };

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
        opt.onclick = () => {
          if (opt.classList.contains('link-option')) return;
          const lh = opt.getAttribute('data-line-height');
          this.applyStyle('lineHeight', lh);
          this.spacingOptions.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          this.spacingDropdown.classList.remove('show');
        };
      });
    }

    if (this.columnsBtn) this.columnsBtn.onclick = () => this.cycleColumns();
    if (this.textDirectionBtn) this.textDirectionBtn.onclick = () => this.toggleTextDirection();
    if (this.alignTextVBtn) this.alignTextVBtn.onclick = () => this.cycleVerticalAlign();
    if (this.smartArtBtn) this.smartArtBtn.onclick = () => alert('Convert to SmartArt is a premium feature!');



    document.querySelectorAll('.mini-shape').forEach(shape => {
      shape.onclick = (e) => {
        e.stopPropagation();
        const type = shape.getAttribute('data-lucide');
        if (type === 'type') this.addText();
        else this.addShape(type);
      };
    });

    this.canvas.onclick = (e) => {
      if (e.target === this.canvas) this.deselectElement();
    };

    // Prevent focus loss when clicking toolbar buttons, allowing execCommand to work
    document.querySelectorAll('.icon-btn, .action-btn, .tool-btn, .split-button').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && !e.target.closest('.layout-dropdown')) {
          e.preventDefault();
        }
      });
    });

    // Close Dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-container')) {
        if (this.layoutDropdown) this.layoutDropdown.classList.remove('show');
        if (this.spacingDropdown) this.spacingDropdown.classList.remove('show');
      }
    });
  }

  addDefaultSlides() {
    // Reference shows Slide 2 active with a bulleted content placeholder
    this.addSlide(); // Slide 1
    this.addSlide('content'); // Slide 2
    this.currentSlideIndex = 1;
  }

  addSlide(layout = 'title') {
    const slide = { id: Date.now(), elements: [] };

    if (layout === 'title') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '120px', left: '50px', width: '700px', height: '100px', fontSize: '36pt', fontWeight: 'bold', textAlign: 'center' } },
        { id: `el-${Date.now()}-2`, type: 'text', content: '', placeholderText: 'Click to add subtitle', styles: { top: '240px', left: '50px', width: '700px', height: '60px', fontSize: '18pt', textAlign: 'center', color: '#666' } }
      ];
    } else if (layout === 'content') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: `el-${Date.now()}-2`, type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '40px', width: '720px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'section') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '250px', left: '50px', width: '700px', height: '80px', fontSize: '36pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: `el-${Date.now()}-2`, type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '340px', left: '50px', width: '700px', height: '60px', fontSize: '18pt', textAlign: 'left', color: '#666', borderTop: '2px solid #666', paddingTop: '10px' } }
      ];
    } else if (layout === 'two-content') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: `el-${Date.now()}-2`, type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '40px', width: '350px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } },
        { id: `el-${Date.now()}-3`, type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '410px', width: '350px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'comparison') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } },
        { id: `el-${Date.now()}-2`, type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '110px', left: '40px', width: '350px', height: '40px', fontSize: '18pt', textAlign: 'center', fontWeight: 'bold' } },
        { id: `el-${Date.now()}-3`, type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '110px', left: '410px', width: '350px', height: '40px', fontSize: '18pt', textAlign: 'center', fontWeight: 'bold' } },
        { id: `el-${Date.now()}-4`, type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '160px', left: '40px', width: '350px', height: '350px', fontSize: '16pt', textAlign: 'left', padding: '10px' } },
        { id: `el-${Date.now()}-5`, type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '160px', left: '410px', width: '350px', height: '350px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'title-only') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '30px', left: '40px', width: '720px', height: '70px', fontSize: '32pt', fontWeight: 'normal', textAlign: 'left' } }
      ];
    } else if (layout === 'caption-content') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '110px', left: '40px', width: '250px', height: '70px', fontSize: '24pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: `el-${Date.now()}-2`, type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '190px', left: '40px', width: '250px', height: '320px', fontSize: '14pt', textAlign: 'left' } },
        { id: `el-${Date.now()}-3`, type: 'text', content: '<ul><li><br></li></ul>', placeholderText: 'Click to add text', isContent: true, styles: { top: '110px', left: '310px', width: '450px', height: '400px', fontSize: '16pt', textAlign: 'left', padding: '10px' } }
      ];
    } else if (layout === 'caption-picture') {
      slide.elements = [
        { id: `el-${Date.now()}-1`, type: 'text', content: '', placeholderText: 'Click to add title', styles: { top: '110px', left: '40px', width: '250px', height: '70px', fontSize: '24pt', fontWeight: 'bold', textAlign: 'left' } },
        { id: `el-${Date.now()}-2`, type: 'text', content: '', placeholderText: 'Click to add text', styles: { top: '190px', left: '40px', width: '250px', height: '320px', fontSize: '14pt', textAlign: 'left' } },
        { id: `el-${Date.now()}-3`, type: 'text', content: '', placeholderText: 'Click icon to add picture', isContent: true, styles: { top: '110px', left: '310px', width: '450px', height: '400px', fontSize: '16pt', textAlign: 'center', border: '1px solid #666', borderStyle: 'solid' } }
      ];
    } else if (layout === 'blank') {
      slide.elements = [];
    }

    this.slides.push(slide);
    this.render();
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
      slide.elements = [];
      this.addSlide();
    }
  }

  cycleColumns() {
    if (!this.selectedElement) return;
    const current = this.selectedElement.getAttribute('data-columns') || '1';
    const next = current === '1' ? '2' : (current === '2' ? '3' : '1');
    this.selectedElement.setAttribute('data-columns', next);
    this.syncDataWithSelection();
  }

  toggleTextDirection() {
    if (!this.selectedElement) return;
    const current = this.selectedElement.style.direction || 'ltr';
    this.selectedElement.style.direction = current === 'ltr' ? 'rtl' : 'ltr';
    this.syncDataWithSelection();
  }

  cycleVerticalAlign() {
    if (!this.selectedElement) return;
    const current = this.selectedElement.getAttribute('data-valign') || 'top';
    const next = current === 'top' ? 'center' : (current === 'center' ? 'bottom' : 'top');
    this.selectedElement.setAttribute('data-valign', next);
    this.syncDataWithSelection();
  }

  addText() {
    const slide = this.slides[this.currentSlideIndex];
    slide.elements.push({ id: `el-${Date.now()}`, type: 'text', content: '', styles: { top: '100px', left: '100px', width: '200px', border: '1px dashed #ccc' } });
    this.renderCanvas();
  }

  addShape(shapeType) {
    const slide = this.slides[this.currentSlideIndex];
    slide.elements.push({
      id: `el-${Date.now()}`,
      type: 'shape',
      shapeType: shapeType,
      styles: { top: '150px', left: '150px', width: '150px', height: '150px', backgroundColor: '#d83b01' }
    });
    this.renderCanvas();
  }

  // --- Style Implementation ---
  toggleSimpleStyle(prop, activeVal, defaultVal) {
    if (this.selectedElement) {
      const current = this.selectedElement.style[prop];
      const next = (current === activeVal) ? defaultVal : activeVal;
      this.applyStyle(prop, next);
    }
  }

  toggleShadow() {
    if (this.selectedElement) {
      const current = this.selectedElement.style.textShadow;
      const next = (current && current !== 'none') ? 'none' : '4px 4px 6px rgba(0,0,0,0.5)';
      this.applyStyle('textShadow', next);
    }
  }

  changeFontSize(factor) {
    if (this.selectedElement) {
      const currentSize = parseFloat(window.getComputedStyle(this.selectedElement).fontSize);
      this.applyStyle('fontSize', (currentSize * factor) + 'px');
    }
  }

  cycleCase() {
    if (this.selectedElement) {
      const current = this.selectedElement.innerText;
      let next = current.toUpperCase();
      if (current === current.toUpperCase()) next = current.toLowerCase();
      else if (current === current.toLowerCase()) next = current.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.selectedElement.innerText = next;
      this.syncDataWithSelection();
    }
  }

  toggleSpacing() {
    if (this.selectedElement) {
      const current = this.selectedElement.style.letterSpacing;
      const next = (!current || current === 'normal' || current === '0px') ? '4px' : 'normal';
      this.applyStyle('letterSpacing', next);
    }
  }

  clearFormatting() {
    if (this.selectedElement) {
      const defaults = { fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', fontSize: '18pt', fontFamily: 'Calibri', color: 'black', backgroundColor: 'transparent', textShadow: 'none' };
      Object.assign(this.selectedElement.style, defaults);
      this.syncDataWithSelection();
    }
  }

  applyStyle(prop, value) {
    if (this.selectedElement) {
      this.selectedElement.style[prop] = value;
      this.syncDataWithSelection();
      this.syncRibbonToSelection();
    }
  }

  syncDataWithSelection() {
    if (this.selectedElement) {
      const id = this.selectedElement.getAttribute('data-id');
      const slide = this.slides[this.currentSlideIndex];
      const el = slide.elements.find(e => e.id === id);
      if (el) {
        el.content = this.selectedElement.innerHTML;
        // Sync persistable styles
        const persistStyles = ['textAlign', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'color', 'backgroundColor', 'textShadow', 'letterSpacing', 'direction'];
        persistStyles.forEach(s => {
          if (this.selectedElement.style[s]) el.styles[s] = this.selectedElement.style[s];
        });
        // Sync persistable attributes
        const persistAttrs = ['data-valign', 'data-columns'];
        persistAttrs.forEach(a => {
          const val = this.selectedElement.getAttribute(a);
          if (val) el.styles[a === 'data-valign' ? 'data-valign' : 'data-columns'] = val;
        });
      }
    }
  }

  selectElement(domEl) {
    this.deselectElement();
    this.selectedElement = domEl;
    this.selectedElement.classList.add('selected');
    this.syncRibbonToSelection();
  }

  deselectElement() {
    if (this.selectedElement) {
      this.selectedElement.classList.remove('selected');
      this.selectedElement = null;
    }
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
      // Sync Line Spacing Dropdown Checkmark
      if (this.spacingOptions) {
        const currentLH = computed.lineHeight;
        let matched = false;
        this.spacingOptions.forEach(opt => {
          if (opt.classList.contains('link-option')) return;
          opt.classList.remove('selected');
          if (currentLH === opt.getAttribute('data-line-height') || (currentLH === 'normal' && opt.getAttribute('data-line-height') === '1')) {
            opt.classList.add('selected');
            matched = true;
          }
        });
        if (!matched && this.spacingOptions[0]) this.spacingOptions[0].classList.add('selected'); // default
      }
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
    this.slides.forEach((slide, index) => {
      const thumb = document.createElement('div');
      thumb.className = `slide-thumb ${index === this.currentSlideIndex ? 'active' : ''}`;
      thumb.innerHTML = `<span class="slide-number">${index + 1}</span><div class="thumb-content"></div>`;
      thumb.onclick = () => { this.currentSlideIndex = index; this.render(); };
      this.slideList.appendChild(thumb);
    });
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
      div.setAttribute('data-id', el.id);
      div.className = `canvas-element ${el.type}`;
      if (theme.placeholderClass) div.classList.add(theme.placeholderClass);

      div.contentEditable = el.type === 'text';
      if (el.placeholderText) div.setAttribute('data-placeholder', el.placeholderText);

      // Apply styles and attributes from model
      Object.assign(div.style, el.styles);
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
        tempDiv.querySelectorAll('.content-placeholder-grid').forEach(g => g.remove());
        tempDiv.querySelectorAll('.resize-handle').forEach(h => h.remove());
        el.content = tempDiv.innerHTML;
        div.innerHTML = el.content;
        div.oninput = () => {
          const cleanDiv = div.cloneNode(true);
          cleanDiv.querySelectorAll('.content-placeholder-grid, .resize-handle').forEach(n => n.remove());
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
          icons.forEach(cfg => {
            const btn = document.createElement('div');
            btn.className = 'placeholder-icon';
            btn.setAttribute('data-type', cfg.id);
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
      } else {
        div.innerHTML = el.content || '';
      }

      // Inject resize handles (moved after innerHTML so they aren't overwritten)
      const handleClasses = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'];
      handleClasses.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle handle-${pos}`;
        handle.contentEditable = 'false';
        div.appendChild(handle);
      });

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
    });
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

    const id = Date.now().toString();
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
    let chartTitle = 'Chart Title';
    const titleEl = document.querySelector('.chart-preview-area h3');
    if (titleEl) {
      chartTitle = titleEl.textContent;
    }

    const id = Date.now().toString();
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
    const id = Date.now().toString();
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
    const id = Date.now().toString();
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
    const id = Date.now().toString();
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
    const id = Date.now().toString();
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
    const id = Date.now().toString();
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
    const id = Date.now().toString();
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
    transThumbs.forEach(thumb => {
      thumb.onclick = () => {
        const trans = thumb.dataset.transition;
        this.slides[this.currentSlideIndex].transition = trans;
        transThumbs.forEach(t => t.classList.remove('active-transition'));
        thumb.classList.add('active-transition');
        console.log(`Setting transition: ${trans}`);
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

        this.canvas.classList.remove('preview-fade', 'preview-push', 'preview-wipe');
        void this.canvas.offsetWidth; // Force reflow
        const cls = `preview-${trans}`;
        this.canvas.classList.add(cls);
        console.log(`Previewing transition: ${trans}`);

        setTimeout(() => {
          this.canvas.classList.remove(cls);
        }, 1000);
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
  }

  setupAnimationsTab() {
    const animThumbs = document.querySelectorAll('[data-panel="animations"] .transition-thumb');
    animThumbs.forEach(thumb => {
      thumb.onclick = () => {
        if (!this.selectedElement) {
          alert("Select an element on the slide first to apply an animation.");
          return;
        }
        const anim = thumb.dataset.animation;
        const elId = this.selectedElement.getAttribute('data-id');
        const elData = this.slides[this.currentSlideIndex].elements.find(e => {
          // Support both element-specific IDs and generic lookup
          return e.id === elId || (this.selectedElement.id && e.id === this.selectedElement.id);
        });

        if (elData) {
          elData.animation = anim;
          animThumbs.forEach(t => t.classList.remove('active-transition'));
          thumb.classList.add('active-transition');
          console.log(`Setting animation: ${anim} for element ${elId}`);

          // Trigger preview immediately on click
          this.selectedElement.classList.remove('anim-fade-in', 'anim-fly-in', 'anim-zoom-in', 'anim-spin');
          void this.selectedElement.offsetWidth;
          const cls = `anim-${anim.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          // Basic mapping for those we haven't defined yet
          if (anim === 'fade') this.selectedElement.classList.add('anim-fade-in');
          else if (anim === 'flyIn') this.selectedElement.classList.add('anim-fly-in');
          else if (anim === 'zoomIn') this.selectedElement.classList.add('anim-zoom-in');
          else if (anim === 'spin') this.selectedElement.classList.add('anim-spin');
          else if (cls !== 'anim-none') this.selectedElement.classList.add(cls);
        }
      };
    });

    const previewBtn = document.getElementById('anim-preview-btn');
    if (previewBtn) {
      previewBtn.onclick = () => {
        const elsToAnimate = this.selectedElement ? [this.selectedElement] : Array.from(this.canvas.children);

        elsToAnimate.forEach(child => {
          const elId = child.getAttribute('data-id');
          const elData = this.slides[this.currentSlideIndex].elements.find(e => e.id === elId);
          const anim = elData ? elData.animation : null;

          if (anim && anim !== 'none') {
            child.classList.remove('anim-fade-in', 'anim-fly-in', 'anim-zoom-in', 'anim-spin');
            void child.offsetWidth;
            if (anim === 'fade') child.classList.add('anim-fade-in');
            else if (anim === 'flyIn') child.classList.add('anim-fly-in');
            else if (anim === 'zoomIn') child.classList.add('anim-zoom-in');
            else if (anim === 'spin') child.classList.add('anim-spin');
            else child.classList.add(`anim-${anim.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
          }
        });
      };
    }
  }

  updateStatus() {
    const statusText = document.querySelector('.status-left span');
    if (statusText) statusText.innerText = `Slide ${this.currentSlideIndex + 1} of ${this.slides.length}`;
  }

  makeDraggable(element, elData, downEvent) {
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

  makeResizable(element, elData, handle, downEvent) {
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
}

window.onload = () => {
  window.app = new PowerPointApp();
  window.app.scaleCanvas();
  window.addEventListener('resize', () => window.app.scaleCanvas());
};
