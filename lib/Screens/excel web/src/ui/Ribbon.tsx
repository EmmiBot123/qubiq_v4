import {
    Bold, Italic, Type, AlignLeft, AlignCenter, AlignRight,
    Grid2X2, Scissors, Copy, Clipboard, Table, Image as ImageIcon,
    Shapes, Layout, BarChart, PieChart, Activity, Layers,
    Droplets, Type as FontIcon, Maximize, Repeat, Scaling,
    Database, Filter, SortAsc, Zap, Trash2, Home, FilePlus,
    FolderOpen, Info, Save, Printer, Share2, Download, XCircle
} from 'lucide-react';
import styles from './Ribbon.module.scss';
import { useExcelStore } from '../store/useExcelStore';
import clsx from 'clsx';

const Ribbon: React.FC = () => {
    const { selectedCell, grid, updateCellStyle, copy, cut, paste, activeTab, setActiveTab } = useExcelStore();
    const currentCell = grid.getCell(selectedCell.row, selectedCell.col);
    const style = currentCell.style;

    const handleCopy = () => copy(selectedCell.row, selectedCell.col);
    const handleCut = () => cut(selectedCell.row, selectedCell.col);
    const handlePaste = () => paste(selectedCell.row, selectedCell.col);

    const tabs = ['File', 'Home', 'Insert', 'Page Layout', 'Formulas', 'Data'] as const;

    const changeFont = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateCellStyle(selectedCell.row, selectedCell.col, { fontFamily: e.target.value });
    };

    const changeFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateCellStyle(selectedCell.row, selectedCell.col, { fontSize: parseInt(e.target.value) });
    };

    const toggleBold = () => {
        updateCellStyle(selectedCell.row, selectedCell.col, { bold: !style.bold });
    };

    const toggleItalic = () => {
        updateCellStyle(selectedCell.row, selectedCell.col, { italic: !style.italic });
    };

    const setTextAlign = (align: 'left' | 'center' | 'right') => {
        updateCellStyle(selectedCell.row, selectedCell.col, { textAlign: align });
    };

    const fontFamilies = ["Calibri", "Arial", "Times New Roman", "Courier New", "Verdana", "Georgia"];
    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

    const renderHomeToolbar = () => (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <div className={styles.clipboardGrid}>
                    <div className={styles.mainAction} title="Paste" onClick={handlePaste}>
                        <Clipboard size={32} />
                        <span>Paste</span>
                    </div>
                    <div className={styles.sideActions}>
                        <button title="Cut" className={styles.toolBtn} onClick={handleCut}><Scissors size={14} /> Cut</button>
                        <button title="Copy" className={styles.toolBtn} onClick={handleCopy}><Copy size={14} /> Copy</button>
                    </div>
                </div>
                <span className={styles.groupLabel}>Clipboard</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.group}>
                <div className={styles.fontControls}>
                    <div className={styles.fontRow}>
                        <select
                            className={styles.fontSelect}
                            value={style.fontFamily || 'Calibri'}
                            onChange={changeFont}
                        >
                            {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select
                            className={styles.fontSizeSelect}
                            value={style.fontSize || 11}
                            onChange={changeFontSize}
                        >
                            {fontSizes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className={styles.buttonRow}>
                        <button
                            className={clsx(styles.toolBtn, style.bold && styles.activeBtn)}
                            onClick={toggleBold}
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            className={clsx(styles.toolBtn, style.italic && styles.activeBtn)}
                            onClick={toggleItalic}
                        >
                            <Italic size={16} />
                        </button>
                        <button
                            className={styles.toolBtn}
                            style={{ borderBottom: `3px solid ${style.color || '#000'} ` }}
                            onClick={() => document.getElementById('textColorInput')?.click()}
                            title="Text Color"
                        >
                            <Type size={16} />
                            <input
                                id="textColorInput"
                                type="color"
                                style={{ display: 'none' }}
                                value={style.color || '#000000'}
                                onChange={(e) => updateCellStyle(selectedCell.row, selectedCell.col, { color: e.target.value })}
                            />
                        </button>
                        <div className={styles.dividerSmall} />
                        <button className={styles.toolBtn}><Grid2X2 size={16} /></button>
                    </div>
                </div>
                <span className={styles.groupLabel}>Font</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.group}>
                <div className={styles.alignmentGrid}>
                    <button
                        className={clsx(styles.toolBtn, style.textAlign === 'left' && styles.activeBtn)}
                        onClick={() => setTextAlign('left')}
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        className={clsx(styles.toolBtn, style.textAlign === 'center' && styles.activeBtn)}
                        onClick={() => setTextAlign('center')}
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        className={clsx(styles.toolBtn, style.textAlign === 'right' && styles.activeBtn)}
                        onClick={() => setTextAlign('right')}
                    >
                        <AlignRight size={16} />
                    </button>
                </div>
                <span className={styles.groupLabel}>Alignment</span>
            </div>
        </div>
    );

    const renderInsertToolbar = () => (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <div className={styles.toolBtnLarge}><Table size={28} /><span>PivotTable</span></div>
                <div className={styles.toolBtnLarge}><Table size={28} /><span>Recommended PivotTables</span></div>
                <div className={styles.toolBtnLarge}><Table size={28} /><span>Table</span></div>
                <span className={styles.groupLabel}>Tables</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.group}>
                <div className={styles.iconGridCompact}>
                    <div className={styles.toolBtnSmall}><ImageIcon size={14} /> Pictures</div>
                    <div className={styles.toolBtnSmall}><Shapes size={14} /> Shapes</div>
                    <div className={styles.toolBtnSmall}><Layout size={14} /> Icons</div>
                </div>
                <span className={styles.groupLabel}>Illustrations</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.group}>
                <div className={styles.chartGroup}>
                    <div className={styles.toolBtnLarge}><BarChart size={28} /><span>Bar Chart</span></div>
                    <div className={styles.toolBtnLarge}><PieChart size={28} /><span>Pie Chart</span></div>
                    <div className={styles.toolBtnLarge}><Activity size={28} /><span>Line Chart</span></div>
                </div>
                <span className={styles.groupLabel}>Charts</span>
            </div>
        </div>
    );

    const renderPageLayoutToolbar = () => (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <div className={styles.toolBtnLarge}><Layers size={28} /><span>Themes</span></div>
                <div className={styles.iconGridCompact}>
                    <div className={styles.toolBtnSmall}><Droplets size={14} /> Colors</div>
                    <div className={styles.toolBtnSmall}><FontIcon size={14} /> Fonts</div>
                </div>
                <span className={styles.groupLabel}>Themes</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.group}>
                <div className={styles.iconGrid}>
                    <div className={styles.toolBtnLarge}><Maximize size={24} /><span>Margins</span></div>
                    <div className={styles.toolBtnLarge}><Repeat size={24} /><span>Orientation</span></div>
                    <div className={styles.toolBtnLarge}><Scaling size={24} /><span>Size</span></div>
                </div>
                <span className={styles.groupLabel}>Page Setup</span>
            </div>
        </div>
    );

    const renderDataToolbar = () => (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <div className={styles.toolBtnLarge}><Database size={28} /><span>Get Data</span></div>
                <span className={styles.groupLabel}>Get & Transform</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.group}>
                <div className={styles.iconGridCompact}>
                    <div className={styles.toolBtnSmall}><SortAsc size={14} /> Sort</div>
                    <div className={styles.toolBtnSmall}><Filter size={14} /> Filter</div>
                </div>
                <span className={styles.groupLabel}>Sort & Filter</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.group}>
                <div className={styles.iconGridCompact}>
                    <div className={styles.toolBtnSmall}><Zap size={14} /> Flash Fill</div>
                    <div className={styles.toolBtnSmall}><Trash2 size={14} /> Remove Duplicates</div>
                </div>
                <span className={styles.groupLabel}>Data Tools</span>
            </div>
        </div>
    );

    const renderToolbar = () => {
        switch (activeTab) {
            case 'Home': return renderHomeToolbar();
            case 'Insert': return renderInsertToolbar();
            case 'Page Layout': return renderPageLayoutToolbar();
            case 'Data': return renderDataToolbar();
            default: return <div className={styles.toolbar}><div className={styles.group}>Work in progress</div></div>;
        }
    };

    return (
        <div className={styles.ribbon}>
            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <div
                        key={tab}
                        className={clsx(styles.tab, activeTab === tab && styles.active)}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </div>
                ))}
            </div>
            {activeTab !== 'File' ? renderToolbar() : (
                <div className={styles.fileBackstage}>
                    <div className={styles.backstageSidebar}>
                        <div className={styles.sidebarItem} onClick={() => setActiveTab('Home')}><XCircle size={20} /> Close</div>
                        <div className={styles.sidebarDivider} />
                        <div className={clsx(styles.sidebarItem, styles.activeItem)}><Home size={20} /> Home</div>
                        <div className={styles.sidebarItem}><FilePlus size={20} /> New</div>
                        <div className={styles.sidebarItem}><FolderOpen size={20} /> Open</div>
                        <div className={styles.sidebarItem}><Info size={20} /> Info</div>
                        <div className={styles.sidebarItem}><Save size={20} /> Save</div>
                        <div className={styles.sidebarItem}><Download size={20} /> Save As</div>
                        <div className={styles.sidebarItem}><Printer size={20} /> Print</div>
                        <div className={styles.sidebarItem}><Share2 size={20} /> Share</div>
                    </div>
                    <div className={styles.backstageContent}>
                        <div className={styles.contentHeader}>
                            <h1>Good afternoon</h1>
                        </div>
                        <div className={styles.templateSection}>
                            <h3>New</h3>
                            <div className={styles.templateGrid}>
                                <div className={styles.templateCard}>
                                    <div className={styles.templateThumb} />
                                    <span>Blank workbook</span>
                                </div>
                                <div className={styles.templateCard}>
                                    <div className={styles.templateThumb} />
                                    <span>Welcome to Excel</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ribbon;
