/**
 * PowerPoint Clone logic - High Fidelity Content Placeholders & UI
 */

class PowerPointApp {
  constructor() {
    this.slides = [];
    this.currentSlideIndex = 0;
    this.selectedElement = null;
    this.clipboard = null;

    this.initElements();
    this.addDefaultSlides(); // Start with two slides as in reference
    this.render();
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

    slide.elements.forEach((el) => {
      const div = document.createElement('div');
      div.setAttribute('data-id', el.id);
      div.className = `canvas-element ${el.type}`;
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
          let html = testDiv.innerHTML.trim();

          // Browsers sometimes wrap br in divs. Clean check.
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

          // Toggle icon grid visibility based on empty state
          const grid = div.querySelector('.content-placeholder-grid');
          if (grid) {
            grid.style.display = (isEmpty || isOnlyEmptyBullet) ? 'grid' : 'none';
          }
        };

        // Cleanse existing grids from data model to avoid duplication
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = el.content;
        tempDiv.querySelectorAll('.content-placeholder-grid').forEach(g => g.remove());
        el.content = tempDiv.innerHTML;
        div.innerHTML = el.content;
        div.oninput = () => { el.content = div.innerHTML; togglePlaceholder(); };
        togglePlaceholder(); // init

        // Add content icons if it's a content placeholder
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
            grid.appendChild(btn);
          });

          // Prepend so it doesn't get wiped by typing if typing somehow doesn't replace it
          // Actually contenteditable edits contents directly. The grid is absolute positioned.
          div.appendChild(grid);

          // Set initial visibility
          togglePlaceholder();
        }
      }

      div.onmousedown = (e) => {
        // Edge detection for all text elements to allow text selection everywhere except the edge
        if (el.type === 'text') {
          const rect = div.getBoundingClientRect();
          const margin = 15; // 15 pixels drag zone
          const isNearEdge =
            e.clientX - rect.left < margin ||
            rect.right - e.clientX < margin ||
            e.clientY - rect.top < margin ||
            rect.bottom - e.clientY < margin;

          if (!isNearEdge) {
            this.selectElement(div);
            // Explicitly focus to ensure text cursor appears even if clicking empty parts
            if (document.activeElement !== div) {
              div.focus();
            }
            return; // Allow event to bubble for text selection cursor
          }
        }

        e.stopPropagation();
        this.selectElement(div);
        if (el.type === 'text' && document.activeElement !== div) {
          div.focus(); // Focus even if dragging by edge, so user can type
        }
        this.makeDraggable(div, el);
      };

      this.canvas.appendChild(div);
    });
  }

  updateStatus() {
    const statusText = document.querySelector('.status-left span');
    if (statusText) statusText.innerText = `Slide ${this.currentSlideIndex + 1} of ${this.slides.length}`;
  }

  makeDraggable(element, elData) {
    const startX = window.event.clientX;
    const startY = window.event.clientY;
    let pos3 = startX;
    let pos4 = startY;
    let draggingStarted = false;
    const threshold = 5;

    const elementDrag = (e) => {
      e = e || window.event;

      if (!draggingStarted) {
        const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
        if (dist > threshold) draggingStarted = true;
        else return;
      }

      let pos1 = pos3 - e.clientX;
      let pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
      elData.styles.top = element.style.top;
      elData.styles.left = element.style.left;
    };
    const closeDragElement = () => { document.onmouseup = null; document.onmousemove = null; };
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
}

window.onload = () => { window.app = new PowerPointApp(); };
