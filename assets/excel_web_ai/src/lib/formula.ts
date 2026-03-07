// Helper to convert column letter (A, B, C...) to index (0, 1, 2...)
export function getColumnIndex(colStr: string): number {
    let index = 0;
    for (let i = 0; i < colStr.length; i++) {
        index = index * 26 + (colStr.charCodeAt(i) - 64);
    }
    return index - 1;
}

// Parses a single cell reference like 'A1' into row/col indices
function parseCellRef(ref: string): { row: number, col: number } | null {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const colStr = match[1];
    const rowStr = match[2];

    return {
        col: getColumnIndex(colStr),
        row: parseInt(rowStr, 10) - 1 // 0-indexed internally
    };
}

// Fetches the value of a single cell. If the cell itself contains a formula, it resolves it recursively.
function getCellValue(
    ref: string,
    data: any[][],
    visited: Set<string> = new Set()
): number {
    // Basic cycle detection to prevent infinite loops
    if (visited.has(ref)) {
        throw new Error("#REF!"); // Circular dependency
    }

    const coords = parseCellRef(ref);
    if (!coords) return 0;

    const { row, col } = coords;

    if (row < 0 || row >= data.length || col < 0 || col >= data[row].length) {
        return 0; // Out of bounds
    }

    const cellObj = data[row][col];
    const cellValue = typeof cellObj === 'object' && cellObj !== null && 'value' in cellObj ? cellObj.value : String(cellObj);

    if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
        const newVisited = new Set(visited);
        newVisited.add(ref);
        const result = evaluateFormula(cellValue, data, newVisited);
        const num = parseFloat(result);
        return isNaN(num) ? 0 : num;
    }

    const parsed = parseFloat(cellValue);
    return isNaN(parsed) ? 0 : parsed;
}

// Parses a range like 'A1:B3' into an array of individual cell references
function parseRange(rangeStr: string): string[] {
    const parts = rangeStr.split(':');
    if (parts.length !== 2) return [rangeStr]; // Not a range, just a single cell

    const start = parseCellRef(parts[0]);
    const end = parseCellRef(parts[1]);

    if (!start || !end) return [];

    const refs: string[] = [];
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            // Convert col index back to letters
            let colName = '';
            let tempCol = c;
            while (tempCol >= 0) {
                colName = String.fromCharCode((tempCol % 26) + 65) + colName;
                tempCol = Math.floor(tempCol / 26) - 1;
            }
            refs.push(`${colName}${r + 1}`);
        }
    }

    return refs;
}

// Gets an array of numbers from a string of arguments (e.g. "A1:A5, B2, 10")
function getArgsValues(argsStr: string, data: any[][], visited: Set<string>): number[] {
    if (!argsStr || argsStr.trim() === "") return [];

    const args = argsStr.split(',').map(arg => arg.trim());
    const values: number[] = [];

    for (const arg of args) {
        if (arg.includes(':')) {
            // It's a range like A1:B5
            const refs = parseRange(arg);
            refs.forEach(ref => {
                values.push(getCellValue(ref, data, visited));
            });
        } else if (/^[A-Z]+\d+$/.test(arg)) {
            // It's a single cell reference like A1
            values.push(getCellValue(arg, data, visited));
        } else {
            // It's a raw number
            const num = parseFloat(arg);
            if (!isNaN(num)) {
                values.push(num);
            }
        }
    }

    return values;
}

// --- Specific Function Implementations ---
const functions: Record<string, (argsStr: string, data: any[][], visited: Set<string>) => string> = {
    SUM: (argsStr, data, visited) => {
        const values = getArgsValues(argsStr, data, visited);
        return values.reduce((acc, curr) => acc + curr, 0).toString();
    },
    AVERAGE: (argsStr, data, visited) => {
        const values = getArgsValues(argsStr, data, visited);
        if (values.length === 0) return "#DIV/0!";
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        return (sum / values.length).toString();
    },
    COUNT: (argsStr, data, visited) => {
        const values = getArgsValues(argsStr, data, visited);
        return values.length.toString();
    },
    MAX: (argsStr, data, visited) => {
        const values = getArgsValues(argsStr, data, visited);
        if (values.length === 0) return "0";
        return Math.max(...values).toString();
    },
    MIN: (argsStr, data, visited) => {
        const values = getArgsValues(argsStr, data, visited);
        if (values.length === 0) return "0";
        return Math.min(...values).toString();
    }
};

/**
 * Main parser entry point.
 * Given a formula string (e.g., "=SUM(A1:B2)") and the grid data, returns the evaluated string.
 */
export function evaluateFormula(formula: string, data: any[][], visited: Set<string> = new Set()): string {
    if (!formula.startsWith('=')) {
        return formula; // Not a formula, return raw value
    }

    let expr = formula.substring(1).toUpperCase().trim(); // Strip "=" and uppercase

    try {
        // 1. Process standard functions like SUM(A1:A5)
        // Find things like SUM(...) or AVERAGE(...)
        const funcRegex = /([A-Z]+)\(([^)]*)\)/g;
        expr = expr.replace(funcRegex, (_match, funcName, argsStr) => {
            if (functions[funcName]) {
                return functions[funcName](argsStr, data, visited);
            }
            throw new Error("#NAME?"); // Unknown function
        });

        // 2. Resolve lone cell references outside of functions (e.g. A1 + B2)
        const cellRefRegex = /[A-Z]+\d+/g;
        expr = expr.replace(cellRefRegex, (match) => {
            return getCellValue(match, data, visited).toString();
        });

        // 3. Evaluate the remaining math expression (e.g. "10 + 20 * 2")
        // We use a safe regex that only allows numbers, basic operators, and parens
        if (/^[0-9+\-*/().\s]+$/.test(expr)) {
            // Safe to eval if it only contains math characters
            // eslint-disable-next-line no-eval
            const result = eval(expr);

            // Format numbers slightly nicely (e.g., handle JS float weirdness like 0.1+0.2=0.300000004)
            if (typeof result === 'number') {
                return parseFloat(result.toPrecision(12)).toString();
            }
            return String(result);
        } else {
            throw new Error("#VALUE!");
        }

    } catch (err: any) {
        // Return standard excel error codes if we throw them during parsing
        if (err.message && err.message.startsWith("#")) {
            return err.message;
        }
        return "#ERROR!";
    }
}
