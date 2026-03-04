export interface CellStyle {
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
}

export class Cell {
    public rawValue: string = '';
    public computedValue: string | number = '';
    public formula: string = '';
    public style: CellStyle = {};

    constructor(value: string = '') {
        this.setValue(value);
    }

    public setValue(value: string) {
        this.rawValue = value;
        if (value.startsWith('=')) {
            this.formula = value;
        } else {
            this.formula = '';
            this.computedValue = this.parseStaticValue(value);
        }
    }

    private parseStaticValue(value: string): string | number {
        if (value === '') return '';
        const num = Number(value);
        return isNaN(num) ? value : num;
    }

    public setStyle(style: Partial<CellStyle>) {
        this.style = { ...this.style, ...style };
    }

    public toJSON() {
        return {
            rawValue: this.rawValue,
            computedValue: this.computedValue,
            formula: this.formula,
            style: this.style,
        };
    }
}
