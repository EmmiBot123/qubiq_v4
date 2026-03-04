import React from 'react';
import { useExcelStore } from '../store/useExcelStore';
import { SparseGrid } from '../core/SparseGrid';
import styles from './FormulaBar.module.scss';
import { X, Check } from 'lucide-react';

const FormulaBar: React.FC = () => {
    const { selectedCell, grid, updateCellValue } = useExcelStore();
    const cell = grid.getCell(selectedCell.row, selectedCell.col);
    const address = SparseGrid.coordToAddress(selectedCell.row, selectedCell.col);

    const [inputValue, setInputValue] = React.useState(cell.rawValue);

    React.useEffect(() => {
        setInputValue(cell.rawValue);
    }, [selectedCell, cell.rawValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            updateCellValue(selectedCell.row, selectedCell.col, inputValue);
        }
    };

    return (
        <div className={styles.formulaBar}>
            <div className={styles.addressBox}>{address}</div>
            <div className={styles.controls}>
                <button className={styles.cancel} title="Cancel"><X size={16} /></button>
                <button className={styles.confirm} title="Confirm"><Check size={16} /></button>
                <div className={styles.fxDivider} />
                <div className={styles.fx} title="Insert Function"><i>f<sub>x</sub></i></div>
            </div>
            <input
                className={styles.input}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};

export default FormulaBar;
