import { SparseGrid } from './SparseGrid';

export class FormulaEngine {
    private grid: SparseGrid;
    constructor(grid: SparseGrid) {
        this.grid = grid;
    }

    /**
     * Extremely basic evaluation for now. 
     * In a real version, we'd use a lexer/parser.
     * For this MVP, we'll support simple arithmetic and cell refs.
     */
    public evaluate(formula: string): string | number {
        if (!formula.startsWith('=')) return formula;

        let expression = formula.substring(1).toUpperCase();

        // Replace cell references with their values
        // Note: This regex is simplified and might match parts of function names
        // But for A1 + B2 it works.
        const cellRefRegex = /[A-Z]+\d+/g;
        expression = expression.replace(cellRefRegex, (match) => {
            const { row, col } = SparseGrid.addressToCoord(match);
            const val = this.grid.getCell(row, col).computedValue;
            return typeof val === 'number' ? val.toString() : `"${val}"`;
        });

        try {
            // Evaluates simple expressions like 10 + 20
            // Security Note: eval is used here for brevity in a clone, 
            // but a real app should use a custom parser.
            // eslint-disable-next-line no-eval
            return eval(expression);
        } catch (e) {
            return '#ERROR!';
        }
    }
}
