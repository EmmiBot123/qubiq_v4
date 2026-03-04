import { Cell } from './Cell';

export class SparseGrid {
    private cells: Map<string, Cell>;

    constructor(initialCells?: Map<string, Cell>) {
        this.cells = initialCells ? new Map(initialCells) : new Map();
    }

    private getCellKey(row: number, col: number): string {
        return `${row}:${col}`;
    }

    public getCells(): Map<string, Cell> {
        return this.cells;
    }

    public getCell(row: number, col: number): Cell {
        const key = this.getCellKey(row, col);
        let cell = this.cells.get(key);
        if (!cell) {
            cell = new Cell();
            this.cells.set(key, cell);
        }
        return cell;
    }

    public setCellValue(row: number, col: number, value: string) {
        const cell = this.getCell(row, col);
        cell.setValue(value);
    }

    public setCellStyle(row: number, col: number, style: any) {
        const cell = this.getCell(row, col);
        cell.setStyle(style);
    }

    /**
     * Converts A1 notation to {row, col}
     * A1 -> {row: 0, col: 0}
     * B2 -> {row: 1, col: 1}
     */
    public static addressToCoord(address: string): { row: number; col: number } {
        const match = address.match(/^([A-Z]+)(\d+)$/);
        if (!match) throw new Error(`Invalid address: ${address}`);

        const colStr = match[1];
        const rowStr = match[2];

        let col = 0;
        for (let i = 0; i < colStr.length; i++) {
            col = col * 26 + (colStr.charCodeAt(i) - 64);
        }

        return {
            row: parseInt(rowStr, 10) - 1,
            col: col - 1,
        };
    }

    /**
     * Converts {row, col} to A1 notation
     */
    public static coordToAddress(row: number, col: number): string {
        let colStr = '';
        let tempCol = col + 1;
        while (tempCol > 0) {
            const remainder = (tempCol - 1) % 26;
            colStr = String.fromCharCode(65 + remainder) + colStr;
            tempCol = Math.floor((tempCol - 1) / 26);
        }
        return `${colStr}${row + 1}`;
    }
}
