import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string = 'Spreadsheet.xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, filename);
}

export function importFromExcel(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // We assume the first sheet is the one we want
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert sheet to a 2D array of values (which our app expects)
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
}
