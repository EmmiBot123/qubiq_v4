import { create } from 'zustand';
import { SparseGrid } from '../core/SparseGrid';
import { FormulaEngine } from '../core/FormulaEngine';
import type { CellStyle } from '../core/Cell';

interface ExcelState {
    grid: SparseGrid;
    formulaEngine: FormulaEngine;
    selectedCell: { row: number; col: number };
    editingCell: { row: number; col: number } | null;
    clipboard: { value: string; style: CellStyle } | null;
    columnWidths: { [key: number]: number };
    rowHeights: { [key: number]: number };
    activeTab: 'File' | 'Home' | 'Insert' | 'Page Layout' | 'Formulas' | 'Data';

    // Actions
    setActiveTab: (tab: 'File' | 'Home' | 'Insert' | 'Page Layout' | 'Formulas' | 'Data') => void;
    setSelectedCell: (row: number, col: number) => void;
    setEditingCell: (cell: { row: number; col: number } | null) => void;
    updateCellValue: (row: number, col: number, value: string) => void;
    updateCellStyle: (row: number, col: number, style: Partial<CellStyle>) => void;
    setColumnWidth: (col: number, width: number) => void;
    setRowHeight: (row: number, height: number) => void;
    copy: (row: number, col: number) => void;
    cut: (row: number, col: number) => void;
    paste: (row: number, col: number) => void;
    recalculateGrid: () => void;
}

export const useExcelStore = create<ExcelState>((set, get) => {
    const grid = new SparseGrid();
    const formulaEngine = new FormulaEngine(grid);

    return {
        grid,
        formulaEngine,
        selectedCell: { row: 0, col: 0 },
        editingCell: null,
        activeTab: 'Home',

        setActiveTab: (tab) => set({ activeTab: tab }),

        setSelectedCell: (row, col) => set({ selectedCell: { row, col } }),
        setEditingCell: (cell) => set({ editingCell: cell }),

        updateCellValue: (row, col, value) => {
            const { grid, formulaEngine } = get();
            grid.setCellValue(row, col, value);

            // Basic reactive update: recalculate
            const cell = grid.getCell(row, col);
            if (cell.formula) {
                cell.computedValue = formulaEngine.evaluate(cell.formula);
            }

            // In a real Excel, we'd only recalculate dependents. 
            // For now, let's keep it simple.
            set({ grid }); // Trigger React re-render
        },

        updateCellStyle: (row, col, style) => {
            const { grid } = get();
            grid.setCellStyle(row, col, style);
            set({ grid: new SparseGrid(grid.getCells()) }); // Force re-render
        },

        recalculateGrid: () => {
            // Dummy for now, would iterate cells and re-eval formulas
            set((state) => ({ grid: state.grid }));
        },

        columnWidths: {},
        rowHeights: {},
        setColumnWidth: (col, width) => set((state) => ({
            columnWidths: { ...state.columnWidths, [col]: width }
        })),

        setRowHeight: (row, height) => set((state) => ({
            rowHeights: { ...state.rowHeights, [row]: height }
        })),

        clipboard: null,

        copy: (row, col) => {
            const { grid } = get();
            const cell = grid.getCell(row, col);
            set({ clipboard: { value: cell.rawValue, style: { ...cell.style } } });
        },

        cut: (row, col) => {
            const { grid } = get();
            const cell = grid.getCell(row, col);
            set({ clipboard: { value: cell.rawValue, style: { ...cell.style } } });

            // Clear the cell
            grid.setCellValue(row, col, '');
            grid.setCellStyle(row, col, { bold: false, italic: false, textAlign: 'left' });
            set({ grid: new SparseGrid(grid.getCells()) });
        },

        paste: (row, col) => {
            const { grid, clipboard } = get();
            if (!clipboard) return;

            grid.setCellValue(row, col, clipboard.value);
            grid.setCellStyle(row, col, clipboard.style);

            // Recalculate if it was a formula (simplified)
            const cell = grid.getCell(row, col);
            if (cell.formula) {
                // FormulaEngine evaluation logic here or called from updateCellValue
                // For now just trigger re-render
            }

            set({ grid: new SparseGrid(grid.getCells()) });
        }
    };
});
