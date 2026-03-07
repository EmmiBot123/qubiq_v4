import React, { useState, type FormEvent, useEffect, useRef } from 'react';
import {
    Loader2, Sparkles, X, Download, Upload, Search, FileSpreadsheet,
    Scissors, Copy, ClipboardPaste, AlignLeft, AlignCenter, AlignRight,
    Table, LineChart, PieChart, BarChart, Link as LinkIcon,
    ArrowDownAZ, ArrowUpZA, Filter, CheckCircle, MessageSquare, Eye,
    ZoomIn, ZoomOut, Grid3x3, Type, PaintBucket
} from 'lucide-react';
import { generateExcelData } from './lib/ai';
import { exportToExcel, importFromExcel } from './lib/excel';
import { evaluateFormula } from './lib/formula';

// Types
type CellData = {
    value: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    textAlign: 'left' | 'center' | 'right';
    color: string;
    backgroundColor: string;
    fontSize: number;
    colSpan: number;
    rowSpan: number;
    isHiddenByMerge: boolean; // True if this cell is consumed by a larger merged cell
};

// Helper to get Excel column name (A, B, ..., Z, AA, AB...)
function getColumnName(index: number) {
    let columnName = '';
    while (index >= 0) {
        columnName = String.fromCharCode((index % 26) + 65) + columnName;
        index = Math.floor(index / 26) - 1;
    }
    return columnName;
}

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 25;

function App() {
    const [apiKey, setApiKey] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('Home');
    const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
    const [showGridlines, setShowGridlines] = useState(true);

    // Spreadsheet state
    const [columns, setColumns] = useState<string[]>(Array.from({ length: 26 }, (_, i) => getColumnName(i)));

    // Resizing State
    const [colWidths, setColWidths] = useState<Record<number, number>>({});
    const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

    const [resizingCol, setResizingCol] = useState<{ index: number, startX: number, startWidth: number } | null>(null);
    const [resizingRow, setResizingRow] = useState<{ index: number, startY: number, startHeight: number } | null>(null);

    // Grid Data
    const createEmptyCell = (): CellData => ({
        value: '', bold: false, italic: false, underline: false,
        textAlign: 'left', color: '#000000', backgroundColor: 'transparent',
        fontSize: 13, colSpan: 1, rowSpan: 1, isHiddenByMerge: false
    });

    const [data, setData] = useState<CellData[][]>(
        Array.from({ length: 100 }, () => Array.from({ length: 26 }, createEmptyCell))
    );

    // Selection state for multi-cell actions
    const [selectionStart, setSelectionStart] = useState<{ row: number, col: number } | null>({ row: 0, col: 0 });
    const [selectionEnd, setSelectionEnd] = useState<{ row: number, col: number } | null>({ row: 0, col: 0 });
    const [isDragging, setIsDragging] = useState(false);

    // Currently focused cell for edits
    const [editingCell, setEditingCell] = useState<{ row: number, col: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setApiKey(savedKey);
    }, []);

    // Selection Bounds Helpers
    const getSelectionBounds = () => {
        if (!selectionStart || !selectionEnd) return null;
        return {
            minRow: Math.min(selectionStart.row, selectionEnd.row),
            maxRow: Math.max(selectionStart.row, selectionEnd.row),
            minCol: Math.min(selectionStart.col, selectionEnd.col),
            maxCol: Math.max(selectionStart.col, selectionEnd.col)
        };
    };

    const isCellSelected = (r: number, c: number) => {
        const bounds = getSelectionBounds();
        if (!bounds) return false;
        return r >= bounds.minRow && r <= bounds.maxRow && c >= bounds.minCol && c <= bounds.maxCol;
    };

    const isCellPrimarySelected = (r: number, c: number) => {
        return selectionStart?.row === r && selectionStart?.col === c;
    };

    // Global Mouse Handlers for Drag Selection & Resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizingCol) {
                const diff = e.clientX - resizingCol.startX;
                const newWidth = Math.max(40, resizingCol.startWidth + diff);
                setColWidths(prev => ({ ...prev, [resizingCol.index]: newWidth }));
            } else if (resizingRow) {
                const diff = e.clientY - resizingRow.startY;
                const newHeight = Math.max(20, resizingRow.startHeight + diff);
                setRowHeights(prev => ({ ...prev, [resizingRow.index]: newHeight }));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setResizingCol(null);
            setResizingRow(null);
        };

        if (isDragging || resizingCol || resizingRow) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, resizingCol, resizingRow]);

    // Grid Mouse Handlers
    const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
        // Prevent default so text isn't selected by browser while dragging
        if (e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        setSelectionStart({ row, col });
        setSelectionEnd({ row, col });
        setEditingCell(null);
        setIsDragging(true);
    };

    const handleCellMouseEnter = (row: number, col: number) => {
        if (isDragging) {
            setSelectionEnd({ row, col });
        }
    };

    // Resizing Handlers
    const startColResize = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        setResizingCol({ index, startX: e.clientX, startWidth: colWidths[index] || DEFAULT_COL_WIDTH });
    };

    const startRowResize = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        setResizingRow({ index, startY: e.clientY, startHeight: rowHeights[index] || DEFAULT_ROW_HEIGHT });
    };

    // AI API Handlers
    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const key = e.target.value;
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!apiKey) {
            setError('Please provide a Google Gemini API Key');
            return;
        }
        if (!prompt) {
            setError('Please enter a prompt');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const resultData = await generateExcelData(prompt, apiKey);

            if (!Array.isArray(resultData) || resultData.length === 0) {
                throw new Error('The AI generated an empty or invalid dataset');
            }

            const headers = Object.keys(resultData[0]);
            const newColsCount = Math.max(26, headers.length);
            const newCols = Array.from({ length: newColsCount }, (_, i) => getColumnName(i));

            const newRows = resultData.map(row => {
                return newCols.map((_, i) => ({
                    ...createEmptyCell(),
                    value: i < headers.length ? (row[headers[i]] || '') : ''
                }));
            });

            const headerRow = newCols.map((_, i) => ({
                ...createEmptyCell(),
                value: i < headers.length ? headers[i] : '',
                bold: true // Auto bold AI generated headers
            }));

            const emptyRowCount = Math.max(0, 100 - (newRows.length + 1));
            const emptyRows = Array.from({ length: emptyRowCount }, () =>
                Array.from({ length: newColsCount }, createEmptyCell)
            );

            setColumns(newCols);
            setData([headerRow, ...newRows, ...emptyRows]);
            setIsSidebarOpen(false);
            setPrompt('');

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        newData[rowIndex] = [...newData[rowIndex]];
        newData[rowIndex][colIndex] = { ...newData[rowIndex][colIndex], value };
        setData(newData);
    };

    // --- Ribbon Tools Implementation ---

    // Applies a formatting function to ALL currently selected cells
    const applyToSelection = (updateFn: (cell: CellData) => CellData) => {
        const bounds = getSelectionBounds();
        if (!bounds) return;

        const newData = [...data];
        for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
            newData[r] = [...newData[r]];
            for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
                if (!newData[r][c].isHiddenByMerge) {
                    newData[r][c] = updateFn(newData[r][c]);
                }
            }
        }
        setData(newData);
    };

    const toggleFormat = (formatKey: 'bold' | 'italic' | 'underline') => {
        applyToSelection((cell) => ({ ...cell, [formatKey]: !cell[formatKey] }));
    };

    const updateFormat = (key: 'textAlign' | 'color' | 'backgroundColor' | 'fontSize', value: any) => {
        applyToSelection((cell) => ({ ...cell, [key]: value }));
    };

    const handleMergeAndCenter = () => {
        const bounds = getSelectionBounds();
        if (!bounds) return;

        const isSingleCell = bounds.minRow === bounds.maxRow && bounds.minCol === bounds.maxCol;
        if (isSingleCell) return;

        const newData = [...data];

        // Check if top-left is already merged (we might want to un-merge)
        const topLeft = newData[bounds.minRow][bounds.minCol];
        const isCurrentlyMerged = topLeft.colSpan > 1 || topLeft.rowSpan > 1;

        if (isCurrentlyMerged) {
            // UNMERGE
            const cSpan = topLeft.colSpan;
            const rSpan = topLeft.rowSpan;
            newData[bounds.minRow] = [...newData[bounds.minRow]];
            newData[bounds.minRow][bounds.minCol] = { ...topLeft, colSpan: 1, rowSpan: 1, textAlign: 'left' };

            // Un-hide the consumed cells
            for (let r = bounds.minRow; r < bounds.minRow + rSpan; r++) {
                newData[r] = [...newData[r]];
                for (let c = bounds.minCol; c < bounds.minCol + cSpan; c++) {
                    if (r === bounds.minRow && c === bounds.minCol) continue;
                    newData[r][c] = { ...newData[r][c], isHiddenByMerge: false };
                }
            }
        } else {
            // MERGE
            const rowSpan = bounds.maxRow - bounds.minRow + 1;
            const colSpan = bounds.maxCol - bounds.minCol + 1;

            // Keep value of top-left, center it
            newData[bounds.minRow] = [...newData[bounds.minRow]];
            newData[bounds.minRow][bounds.minCol] = {
                ...topLeft, colSpan, rowSpan, textAlign: 'center'
            };

            // Hide all other cells in bounds
            for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
                newData[r] = [...newData[r]];
                for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
                    if (r === bounds.minRow && c === bounds.minCol) continue;
                    // Wipe values so they don't mess up formulas
                    newData[r][c] = { ...newData[r][c], isHiddenByMerge: true, value: '' };
                }
            }
        }

        setData(newData);
    };

    // Clipboard Handlers
    const handleCopy = () => {
        if (!selectionStart) return;
        // Extremely simple copy: only copies top-left of selection to clipboard string format for OS
        const cellVal = data[selectionStart.row][selectionStart.col].value;
        navigator.clipboard.writeText(cellVal).catch(err => console.error("Clipboard copy failed", err));
    };

    const handleCut = () => {
        if (!selectionStart) return;
        handleCopy();
        handleCellChange(selectionStart.row, selectionStart.col, '');
    };

    const handlePaste = async () => {
        if (!selectionStart) return;
        try {
            const text = await navigator.clipboard.readText();
            // Simple paste: pastes to top-left of selection
            handleCellChange(selectionStart.row, selectionStart.col, text);
        } catch (err) {
            console.error("Clipboard paste failed", err);
        }
    };

    // --- File Options ---
    const handleExport = () => {
        let lastValidRowIdx = data.length - 1;
        while (lastValidRowIdx > 0 && data[lastValidRowIdx].every(cell => !cell.value)) {
            lastValidRowIdx--;
        }

        const meaningfulData = data.slice(0, lastValidRowIdx + 1);
        if (meaningfulData.length === 0) return;

        const fileHeaders = meaningfulData[0];
        const exportableData = meaningfulData.slice(1).map(row => {
            const rowObj: any = {};
            fileHeaders.forEach((header: CellData, index: number) => {
                const headerName = header.value || `Column ${getColumnName(index)}`;
                rowObj[headerName] = row[index].value || '';
            });
            return rowObj;
        });

        exportToExcel(exportableData, 'My_Spreadsheet.xlsx');
        setIsFileMenuOpen(false);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const importedData = await importFromExcel(file);

            if (!importedData || importedData.length === 0) {
                throw new Error("The file is empty or invalid.");
            }

            const maxCols = Math.max(26, ...importedData.map(row => row.length));
            const newCols = Array.from({ length: maxCols }, (_, i) => getColumnName(i));

            const newRows = importedData.map((row: any[]) => {
                const newRow = Array.from({ length: maxCols }, createEmptyCell);
                row.forEach((cellRaw, i) => {
                    newRow[i].value = cellRaw || '';
                });
                return newRow;
            });

            const emptyRowCount = Math.max(0, 100 - newRows.length);
            const emptyRows = Array.from({ length: emptyRowCount }, () =>
                Array.from({ length: maxCols }, createEmptyCell)
            );

            setColumns(newCols);
            setData([...newRows, ...emptyRows]);

        } catch (err: any) {
            setError(err.message || 'Error occurred while importing file');
            setIsSidebarOpen(true);
        } finally {
            setIsLoading(false);
            setIsFileMenuOpen(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleNewWorkbook = () => {
        setData(Array.from({ length: 100 }, () => Array.from({ length: 26 }, createEmptyCell)));
        setIsFileMenuOpen(false);
        setSelectionStart({ row: 0, col: 0 });
        setSelectionEnd({ row: 0, col: 0 });
    };

    // For the formula bar
    const primarySelectedCellObj = selectionStart !== null && data[selectionStart.row] ? data[selectionStart.row][selectionStart.col] : null;
    const activeCellValue = primarySelectedCellObj ? primarySelectedCellObj.value : '';

    const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectionStart) {
            handleCellChange(selectionStart.row, selectionStart.col, e.target.value);
        }
    };

    return (
        <div className="app-container" onClick={() => { if (isFileMenuOpen) setIsFileMenuOpen(false); }}>
            {/* Excel Header Area */}
            <div className="excel-header" onClick={(e) => e.stopPropagation()}>
                {/* 1. Title Bar */}
                <div className="title-bar">
                    <div className="title-left">
                        <div className="app-icon" onClick={() => setIsFileMenuOpen(!isFileMenuOpen)} style={{ cursor: 'pointer', zIndex: 102, position: 'relative' }}>
                            <FileSpreadsheet size={18} color="white" />
                        </div>
                        <div className="title-search">
                            <Search size={14} style={{ marginRight: '8px', opacity: 0.7 }} />
                            <span>Search (Alt+Q)</span>
                        </div>
                    </div>
                    <div className="title-center">
                        <span className="title-text">My Spreadsheet - Excel Web</span>
                    </div>
                    <div className="title-right"></div>
                </div>

                {/* File Menu Dropdown Overlay */}
                {isFileMenuOpen && (
                    <div className="file-menu-dropdown">
                        <div className="file-menu-item" onClick={handleNewWorkbook}>
                            <FileSpreadsheet size={16} /> New Blank Workbook
                        </div>
                        <div className="file-menu-item" onClick={handleImportClick}>
                            <Upload size={16} /> Open (Import .xlsx)
                        </div>
                        <div className="file-menu-item" onClick={handleExport}>
                            <Download size={16} /> Save As (Export .xlsx)
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                        />
                        <div className="file-menu-separator"></div>
                        <div className="file-menu-item" onClick={() => setIsFileMenuOpen(false)}>
                            <X size={16} /> Close Menu
                        </div>
                    </div>
                )}

                {/* 2. Ribbon Tabs */}
                <div className="ribbon-tabs">
                    <div className={`ribbon-tab ${isFileMenuOpen ? 'active' : ''}`} onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}>File</div>
                    <div className={`ribbon-tab ${activeTab === 'Home' && !isFileMenuOpen ? 'active' : ''}`} onClick={() => { setActiveTab('Home'); setIsFileMenuOpen(false); }}>Home</div>
                    <div className={`ribbon-tab ${activeTab === 'Insert' && !isFileMenuOpen ? 'active' : ''}`} onClick={() => { setActiveTab('Insert'); setIsFileMenuOpen(false); }}>Insert</div>
                    <div className={`ribbon-tab ${activeTab === 'Data' && !isFileMenuOpen ? 'active' : ''}`} onClick={() => { setActiveTab('Data'); setIsFileMenuOpen(false); }}>Data</div>
                    <div className={`ribbon-tab ${activeTab === 'Review' && !isFileMenuOpen ? 'active' : ''}`} onClick={() => { setActiveTab('Review'); setIsFileMenuOpen(false); }}>Review</div>
                    <div className={`ribbon-tab ${activeTab === 'View' && !isFileMenuOpen ? 'active' : ''}`} onClick={() => { setActiveTab('View'); setIsFileMenuOpen(false); }}>View</div>
                </div>

                {/* 3. Ribbon Content (Toolbar) */}
                <div className="ribbon-content">
                    {activeTab === 'Home' && (
                        <>
                            {/* Clipboard Group */}
                            <div className="ribbon-group">
                                <div className="ribbon-buttons">
                                    <button className="ribbon-btn" onClick={handlePaste} title="Paste"><ClipboardPaste size={20} /><span>Paste</span></button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button className="ribbon-btn" onClick={handleCut} style={{ flexDirection: 'row', padding: '2px 4px' }} title="Cut"><Scissors size={14} /> Cut</button>
                                        <button className="ribbon-btn" onClick={handleCopy} style={{ flexDirection: 'row', padding: '2px 4px' }} title="Copy"><Copy size={14} /> Copy</button>
                                    </div>
                                </div>
                                <span className="ribbon-group-title">Clipboard</span>
                            </div>

                            {/* Font Group */}
                            <div className="ribbon-group">
                                <div className="ribbon-buttons" style={{ alignItems: 'center', gap: '8px' }}>
                                    {/* Font Family & Size Mock/Partial */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <select className="font-dropdown" disabled title="Font Family">
                                                <option>Inter</option>
                                            </select>
                                            <input
                                                type="number"
                                                className="font-size-input"
                                                value={primarySelectedCellObj?.fontSize || 13}
                                                onChange={(e) => updateFormat('fontSize', parseInt(e.target.value) || 13)}
                                                min="8" max="72"
                                                title="Font Size"
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            <button
                                                className={`ribbon-btn-sm ${primarySelectedCellObj?.bold ? 'active-format' : ''}`}
                                                style={{ fontWeight: 'bold' }}
                                                onClick={() => toggleFormat('bold')} title="Bold"
                                            >B</button>
                                            <button
                                                className={`ribbon-btn-sm ${primarySelectedCellObj?.italic ? 'active-format' : ''}`}
                                                style={{ fontStyle: 'italic', fontFamily: 'serif' }}
                                                onClick={() => toggleFormat('italic')} title="Italic"
                                            >I</button>
                                            <button
                                                className={`ribbon-btn-sm ${primarySelectedCellObj?.underline ? 'active-format' : ''}`}
                                                style={{ textDecoration: 'underline' }}
                                                onClick={() => toggleFormat('underline')} title="Underline"
                                            >U</button>

                                            <div className="color-picker-wrapper" title="Fill Color">
                                                <PaintBucket size={14} />
                                                <div className="color-swatch-indicator" style={{ backgroundColor: primarySelectedCellObj?.backgroundColor || 'transparent' }}></div>
                                                <input type="color" value={primarySelectedCellObj?.backgroundColor || '#ffffff'} onChange={(e) => updateFormat('backgroundColor', e.target.value)} />
                                            </div>

                                            <div className="color-picker-wrapper" title="Text Color">
                                                <Type size={14} />
                                                <div className="color-swatch-indicator" style={{ backgroundColor: primarySelectedCellObj?.color || '#000000' }}></div>
                                                <input type="color" value={primarySelectedCellObj?.color || '#000000'} onChange={(e) => updateFormat('color', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span className="ribbon-group-title">Font</span>
                            </div>

                            {/* Alignment Group */}
                            <div className="ribbon-group">
                                <div className="ribbon-buttons" style={{ alignItems: 'center', gap: '8px' }}>
                                    <div style={{ display: 'flex', gap: '2px', alignSelf: 'flex-start' }}>
                                        <button
                                            className={`ribbon-btn-sm ${primarySelectedCellObj?.textAlign === 'left' ? 'active-format' : ''}`}
                                            title="Align Left" onClick={() => updateFormat('textAlign', 'left')}
                                        ><AlignLeft size={16} /></button>
                                        <button
                                            className={`ribbon-btn-sm ${primarySelectedCellObj?.textAlign === 'center' ? 'active-format' : ''}`}
                                            title="Align Center" onClick={() => updateFormat('textAlign', 'center')}
                                        ><AlignCenter size={16} /></button>
                                        <button
                                            className={`ribbon-btn-sm ${primarySelectedCellObj?.textAlign === 'right' ? 'active-format' : ''}`}
                                            title="Align Right" onClick={() => updateFormat('textAlign', 'right')}
                                        ><AlignRight size={16} /></button>
                                    </div>
                                    <button className="ribbon-btn" onClick={handleMergeAndCenter} title="Merge & Center">
                                        <Grid3x3 size={16} />
                                        <span style={{ fontSize: '10px' }}>Merge & Center</span>
                                    </button>
                                </div>
                                <span className="ribbon-group-title">Alignment</span>
                            </div>

                            {/* Number Group (Mock) */}
                            <div className="ribbon-group">
                                <div className="ribbon-buttons">
                                    <div className="format-dropdown-mock">
                                        <span>General</span>
                                        <ArrowDownAZ size={12} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                                <span className="ribbon-group-title">Number</span>
                            </div>
                        </>
                    )}

                    {activeTab === 'Insert' && (
                        <>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons">
                                    <button className="ribbon-btn"><Table size={20} /><span>Table</span></button>
                                </div>
                                <span className="ribbon-group-title">Tables</span>
                            </div>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons" style={{ flexDirection: 'row' }}>
                                    <button className="ribbon-btn" title="Column Chart"><BarChart size={18} /></button>
                                    <button className="ribbon-btn" title="Line Chart"><LineChart size={18} /></button>
                                    <button className="ribbon-btn" title="Pie Chart"><PieChart size={18} /></button>
                                </div>
                                <span className="ribbon-group-title">Charts</span>
                            </div>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons">
                                    <button className="ribbon-btn"><LinkIcon size={20} /><span>Link</span></button>
                                </div>
                                <span className="ribbon-group-title">Links</span>
                            </div>
                        </>
                    )}

                    {activeTab === 'Data' && (
                        <>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons" style={{ flexDirection: 'row' }}>
                                    <button className="ribbon-btn" style={{ flexDirection: 'column' }}><ArrowDownAZ size={20} /><span>A-Z</span></button>
                                    <button className="ribbon-btn" style={{ flexDirection: 'column' }}><ArrowUpZA size={20} /><span>Z-A</span></button>
                                    <button className="ribbon-btn" style={{ flexDirection: 'column' }}><Filter size={20} /><span>Filter</span></button>
                                </div>
                                <span className="ribbon-group-title">Sort & Filter</span>
                            </div>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons">
                                    <button className="ribbon-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                        <Sparkles size={20} />
                                        <span>AI Support</span>
                                    </button>
                                </div>
                                <span className="ribbon-group-title">Data Tools & AI</span>
                            </div>
                        </>
                    )}

                    {activeTab === 'Review' && (
                        <>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons">
                                    <button className="ribbon-btn"><CheckCircle size={20} /><span>Spelling</span></button>
                                </div>
                                <span className="ribbon-group-title">Proofing</span>
                            </div>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons" style={{ flexDirection: 'row' }}>
                                    <button className="ribbon-btn" style={{ flexDirection: 'column' }}><MessageSquare size={16} /><span>New</span></button>
                                    <button className="ribbon-btn" style={{ flexDirection: 'column' }}><Eye size={16} /><span>Show</span></button>
                                </div>
                                <span className="ribbon-group-title">Comments</span>
                            </div>
                        </>
                    )}

                    {activeTab === 'View' && (
                        <>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons" style={{ justifyContent: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                                        <input
                                            type="checkbox"
                                            checked={showGridlines}
                                            onChange={(e) => setShowGridlines(e.target.checked)}
                                        />
                                        Gridlines
                                    </label>
                                </div>
                                <span className="ribbon-group-title">Show</span>
                            </div>
                            <div className="ribbon-group">
                                <div className="ribbon-buttons" style={{ flexDirection: 'row' }}>
                                    <button className="ribbon-btn"><ZoomIn size={18} /><span>Zoom In</span></button>
                                    <button className="ribbon-btn" style={{ border: '1px solid var(--border-color)', margin: '0 4px', padding: '2px 8px' }}><span>100%</span></button>
                                    <button className="ribbon-btn"><ZoomOut size={18} /><span>Zoom Out</span></button>
                                </div>
                                <span className="ribbon-group-title">Zoom</span>
                            </div>
                        </>
                    )}
                </div>

                {/* 4. Formula Bar */}
                <div className="formula-bar-container">
                    <div className="cell-address">
                        {selectionStart !== null ? `${columns[selectionStart.col]}${selectionStart.row + 1}` : ''}
                    </div>
                    <div className="formula-icon">fx</div>
                    <input
                        type="text"
                        className="formula-input"
                        value={activeCellValue}
                        onChange={handleFormulaChange}
                        disabled={selectionStart === null}
                    />
                </div>
            </div>

            {/* Main Area */}
            <div className={`main-area ${isSidebarOpen ? 'sidebar-open' : ''}`} onClick={() => { if (isFileMenuOpen) setIsFileMenuOpen(false); }}>
                {/* Spreadsheet View */}
                <div className={`spreadsheet-container ${!showGridlines ? 'no-gridlines' : ''}`}>
                    <table className="spreadsheet">
                        <thead>
                            <tr>
                                <th className="cell-header corner"></th>
                                {columns.map((col, i) => (
                                    <th key={i} className="cell-header" style={{ width: colWidths[i] || DEFAULT_COL_WIDTH }}>
                                        {col}
                                        <div className="col-resizer" onMouseDown={(e) => startColResize(i, e)} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex} style={{ height: rowHeights[rowIndex] || DEFAULT_ROW_HEIGHT }}>
                                    <td className="cell-header row-number">
                                        {rowIndex + 1}
                                        <div className="row-resizer" onMouseDown={(e) => startRowResize(rowIndex, e)} />
                                    </td>
                                    {row.map((cell, colIndex) => {
                                        if (cell.isHiddenByMerge) return null; // Don't render cells consumed by merges

                                        const isSelected = isCellSelected(rowIndex, colIndex);
                                        const isPrimary = isCellPrimarySelected(rowIndex, colIndex);
                                        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;

                                        const valStr = cell.value;
                                        let displayValue = valStr;
                                        if (!isEditing && typeof valStr === 'string' && valStr.startsWith('=')) {
                                            displayValue = evaluateFormula(valStr, data);
                                        }

                                        return (
                                            <td
                                                key={colIndex}
                                                className={`cell ${isSelected ? 'selected' : ''} ${isPrimary ? 'primary-selected' : ''}`}
                                                colSpan={cell.colSpan}
                                                rowSpan={cell.rowSpan}
                                                onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                                                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                                                onDoubleClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
                                                style={{
                                                    backgroundColor: cell.backgroundColor !== 'transparent' ? cell.backgroundColor : (isSelected && !isPrimary ? 'var(--selected-cell)' : undefined),
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={isEditing ? valStr : displayValue}
                                                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                    readOnly={!isEditing} // Make purely viewable unless double clicked
                                                    onFocus={() => {
                                                        // Fallback for tabbing focus
                                                        if (!isDragging && (!selectionStart || selectionStart.row !== rowIndex || selectionStart.col !== colIndex)) {
                                                            setSelectionStart({ row: rowIndex, col: colIndex });
                                                            setSelectionEnd({ row: rowIndex, col: colIndex });
                                                        }
                                                    }}
                                                    onBlur={() => setEditingCell(null)}
                                                    style={{
                                                        fontWeight: cell.bold ? 'bold' : 'normal',
                                                        fontStyle: cell.italic ? 'italic' : 'normal',
                                                        textDecoration: cell.underline ? 'underline' : 'none',
                                                        textAlign: cell.textAlign,
                                                        color: cell.color,
                                                        fontSize: `${cell.fontSize}px`,
                                                        cursor: isEditing ? 'text' : 'cell',
                                                        userSelect: 'none', // Prevent text selection while dragging cells
                                                    }}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* AI Support Sidebar */}
                <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h2>AI Support</h2>
                        <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="sidebar-content">
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="ai-form">
                            <div className="form-group">
                                <label htmlFor="api-key">Google Gemini API Key</label>
                                <input
                                    id="api-key"
                                    type="password"
                                    value={apiKey}
                                    onChange={handleApiKeyChange}
                                    placeholder="AIzaSy..."
                                    required
                                />
                            </div>

                            <div className="form-group flex-1">
                                <label htmlFor="prompt">What data do you need?</label>
                                <textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., A list of 10 fictional employees with first name, last name, email, department, and a random salary between $50k and $120k."
                                    className="prompt-textarea"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="generate-btn"
                                disabled={isLoading || !prompt || !apiKey}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="loader" size={20} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Generate Data
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="status-bar" onClick={() => { if (isFileMenuOpen) setIsFileMenuOpen(false); }}>
                <div className="sheet-tabs">
                    <button className="sheet-tab">Sheet1</button>
                </div>
                <div className="status-right">
                    <span>Ready</span>
                    <span style={{ cursor: 'pointer', padding: '2px 6px', border: '1px solid transparent' }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#c8c6c4'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                        100%
                    </span>
                </div>
            </div>
        </div>
    );
}

export default App;
