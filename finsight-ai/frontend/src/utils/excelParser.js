import * as XLSX from 'xlsx';

export async function extractTextFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let extractedText = '';
        
        // Loop through all sheets and convert to CSV format
        // CSV is highly structured and excellent for LLM table comprehension
        workbook.SheetNames.forEach(sheetName => {
          extractedText += `\n--- Sheet: ${sheetName} ---\n`;
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          extractedText += csv + '\n';
        });
        
        resolve(extractedText.trim());
      } catch (err) {
        reject(new Error("Failed to parse Excel file: " + err.message));
      }
    };
    
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}
