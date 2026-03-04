import { useEffect } from 'react';
import Ribbon from './ui/Ribbon';
import FormulaBar from './ui/FormulaBar';
import Grid from './ui/Grid';
import styles from './App.module.scss';
import { useExcelStore } from './store/useExcelStore';

function App() {
  const { selectedCell, copy, cut, paste } = useExcelStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            copy(selectedCell.row, selectedCell.col);
            break;
          case 'x':
            cut(selectedCell.row, selectedCell.col);
            break;
          case 'v':
            paste(selectedCell.row, selectedCell.col);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, copy, cut, paste]);

  return (
    <div className={styles.app}>
      <Ribbon />
      <FormulaBar />
      <div className={styles.main}>
        <Grid />
      </div>
      <div className={styles.footer}>
        <div className={styles.sheetTabs}>
          <div className={styles.sheetTabActive}>Sheet1</div>
          <div className={styles.addSheet}>+</div>
        </div>
        <div className={styles.statusBar}>
          Ready
        </div>
      </div>
    </div>
  );
}

export default App;
