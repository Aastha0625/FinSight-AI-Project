import Tesseract from 'tesseract.js';

export async function extractTextFromImage(file) {
  try {
    // recognize() will automatically fetch the WebAssembly worker and language data
    const result = await Tesseract.recognize(
      file,
      'eng',
      {
        // Optional logger to see progress in console
        logger: m => console.log('OCR Status:', m.status, m.progress)
      }
    );
    return result.data.text.trim();
  } catch (err) {
    throw new Error("Failed to extract text from image: " + err.message);
  }
}
