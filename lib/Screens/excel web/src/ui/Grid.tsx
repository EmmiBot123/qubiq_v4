import React from 'react';
import { useExcelStore } from '../store/useExcelStore';
import styles from './Grid.module.scss';
import clsx from 'clsx';

const ROWS = 100;
const COLS = 26;

const Grid: React.FC = () => {
    const {
        grid, selectedCell, setSelectedCell, updateCellValue,
        columnWidths, rowHeights, setColumnWidth, setRowHeight
    } = useExcelStore();
    const [editing, setEditing] = React.useState<{ row: number, col: number } | null>(null);
    const [editValue, setEditValue] = React.useState('');

    // Generate column headers A, B, C...
    const colHeaders = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

    const handleCellClick = (row: number, col: number) => {
        setSelectedCell(row, col);
    };

    const handleCellDoubleClick = (row: number, col: number, initialValue: string) => {
        setEditing({ row, col });
        setEditValue(initialValue);
    };

    const handleBlur = () => {
        if (editing) {
            updateCellValue(editing.row, editing.col, editValue);
            setEditing(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && editing) {
            handleBlur();
        }
    };

    // Resizing state
    const [resizingCol, setResizingCol] = React.useState<{ col: number, startX: number, startWidth: number } | null>(null);
    const [resizingRow, setResizingRow] = React.useState<{ row: number, startY: number, startHeight: number } | null>(null);

    const onResizerMouseDown = (e: React.MouseEvent, type: 'col' | 'row', index: number) => {
        e.stopPropagation();
        if (type === 'col') {
            setResizingCol({
                col: index,
                startX: e.clientX,
                startWidth: columnWidths[index] || 120
            });
        } else {
            setResizingRow({
                row: index,
                startY: e.clientY,
                startHeight: rowHeights[index] || 25
            });
        }
    };

    React.useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (resizingCol) {
                const deltaX = e.clientX - resizingCol.startX;
                const newWidth = Math.max(40, resizingCol.startWidth + deltaX);
                setColumnWidth(resizingCol.col, newWidth);
            }
            if (resizingRow) {
                const deltaY = e.clientY - resizingRow.startY;
                const newHeight = Math.max(20, resizingRow.startHeight + deltaY);
                setRowHeight(resizingRow.row, newHeight);
            }
        };

        const onMouseUp = () => {
            setResizingCol(null);
            setResizingRow(null);
        };

        if (resizingCol || resizingRow) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [resizingCol, resizingRow, setColumnWidth, setRowHeight]);

    // Grid layout string
    const colLayout = `40px ${colHeaders.map((_, i) => `${columnWidths[i] || 120}px`).join(' ')}`;
    // Note: CSS Grid handles rows with auto-rows, but we need dynamic heights.
    // However, grid-auto-rows is a single value. We might need a different approach if we want per-row heights.
    // For now, let's use a workaround or stick to col resizing first if row resizing is complex with grid.
    // Actually, we can use grid-template-rows if we want per-row heights.

    return (
        <div className={styles.container}>
            <div
                className={styles.grid}
                style={{
                    gridTemplateColumns: colLayout,
                    // Dynamic row heights can't easily be done with grid-auto-rows for ALL rows uniquely
                    // unless we list them all in grid-template-rows.
                    gridTemplateRows: `25px ${Array.from({ length: ROWS }).map((_, i) => `${rowHeights[i] || 25}px`).join(' ')}`
                }}
            >
                {/* Top-left empty corner */}
                <div className={styles.headerCell} />

                {/* Column Headers */}
                {colHeaders.map((header, i) => (
                    <div
                        key={header}
                        className={clsx(styles.headerCell, selectedCell.col === i && styles.headerCellActive)}
                    >
                        {header}
                        <div
                            className={styles.resizerCol}
                            onMouseDown={(e) => onResizerMouseDown(e, 'col', i)}
                        />
                    </div>
                ))}

                {/* Rows */}
                {Array.from({ length: ROWS }).map((_, r) => (
                    <React.Fragment key={r}>
                        {/* Row Header */}
                        <div className={clsx(styles.headerCell, selectedCell.row === r && styles.headerRowActive)}>
                            {r + 1}
                            <div
                                className={styles.resizerRow}
                                onMouseDown={(e) => onResizerMouseDown(e, 'row', r)}
                            />
                        </div>

                        {/* Cells */}
                        {Array.from({ length: COLS }).map((_, c) => {
                            const isSelected = selectedCell.row === r && selectedCell.col === c;
                            const isEditing = editing?.row === r && editing?.col === c;
                            const cell = grid.getCell(r, c);

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={clsx(styles.cell, isSelected && styles.selected)}
                                    onClick={() => handleCellClick(r, c)}
                                    onDoubleClick={() => handleCellDoubleClick(r, c, cell.rawValue)}
                                    style={{
                                        height: rowHeights[r] || 25,
                                        width: columnWidths[c] || 120
                                    }}
                                >
                                    {isSelected && !isEditing && <div className={styles.selectionHandle} />}
                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            className={styles.editor}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleBlur}
                                            onKeyDown={handleKeyDown}
                                        />
                                    ) : (
                                        <span
                                            className={styles.cellValue}
                                            style={{
                                                fontWeight: cell.style.bold ? 'bold' : 'normal',
                                                fontStyle: cell.style.italic ? 'italic' : 'normal',
                                                fontFamily: cell.style.fontFamily || 'inherit',
                                                fontSize: cell.style.fontSize ? `${cell.style.fontSize}px` : '13px',
                                                color: cell.style.color || 'inherit',
                                                textAlign: cell.style.textAlign || 'left',
                                                width: '100%',
                                            }}
                                        >
                                            {cell.computedValue}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Grid;
