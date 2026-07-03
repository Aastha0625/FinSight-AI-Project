import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractTextFromPDF } from '../utils/pdfParser';
import { anonymiseText } from '../utils/anonymiser';
import { extractTextFromExcel } from '../utils/excelParser';
import { extractTextFromImage } from '../utils/imageParser';
import { saveDocument } from '../utils/localDb';

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [documents, setDocuments] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleStartChatting = async () => {
    localStorage.setItem('finsight_docs_uploaded', 'true');
    
    // Determine which document types were uploaded based on the status of our documents state
    const uploads = { sip: false, insurance: false, loan: false };
    const readyDocs = [];
    
    documents.forEach(doc => {
      if (doc.status === 'Ready') {
        readyDocs.push(doc);
        const lower = doc.name.toLowerCase();
        if (lower.includes('sip') || lower.includes('fund') || lower.includes('mutual')) uploads.sip = true;
        else if (lower.includes('policy') || lower.includes('insurance') || lower.includes('lic')) uploads.insurance = true;
        else if (lower.includes('loan') || lower.includes('emi') || lower.includes('statement')) uploads.loan = true;
        else uploads.sip = true; // Default fallback if unknown
      }
    });
    
    // Save to IndexedDB
    for (const doc of readyDocs) {
      await saveDocument(doc);
    }
    
    localStorage.setItem('finsight_partial_uploads', JSON.stringify(uploads));
    navigate('/chat');
  };

  const processFile = async (file) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isExcel && !isImage) {
      alert("Please upload a PDF, Excel spreadsheet, or Image.");
      return;
    }

    let docType = 'PDF Document';
    if (isExcel) docType = 'Excel Spreadsheet';
    if (isImage) docType = 'Image (OCR)';

    const newDoc = {
      id: Date.now().toString(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: docType,
      status: 'Processing...',
      text: null,
      anonymised: null
    };

    setDocuments(prev => [...prev, newDoc]);

    try {
      let text = '';
      if (isPdf) text = await extractTextFromPDF(file);
      else if (isExcel) text = await extractTextFromExcel(file);
      else if (isImage) text = await extractTextFromImage(file);

      const anonymised = anonymiseText(text);
      
      setDocuments(prev => prev.map(d => {
        if (d.id === newDoc.id) {
          return { ...d, status: 'Ready', text, anonymised };
        }
        return d;
      }));
    } catch (err) {
      console.error(err);
      setDocuments(prev => prev.map(d => {
        if (d.id === newDoc.id) {
          return { ...d, status: 'Failed' };
        }
        return d;
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
    e.target.value = null; // reset input
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-background font-body-md text-on-surface w-full h-full overflow-y-auto">

      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        {/* Headline Section */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Upload your financial documents</h1>
          <p className="text-text-secondary font-body-md">Bring your insurance, investments, and loan statements into one secure dashboard.</p>
        </div>

        {/* Upload Zone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`upload-dashed rounded-xl p-12 mb-8 flex flex-col items-center justify-center transition-all cursor-pointer group ${isDragActive ? 'upload-dashed-active bg-privacy-bg' : 'hover:bg-privacy-bg'}`}
        >
          <div className="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary text-3xl font-bold">cloud_upload</span>
          </div>
          <div className="text-center">
            <p className="font-headline-sm text-[18px] text-on-surface font-semibold mb-1">Click to upload or drag and drop</p>
            <p className="font-label-caps text-label-caps text-primary bg-secondary-fixed-dim/20 px-2 py-0.5 rounded inline-block">PDF, EXCEL, IMAGES</p>
          </div>
          <input ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.xlsx,.xls,.csv,image/png,image/jpeg,image/jpg" className="hidden" type="file" />
        </div>

        {/* Privacy Strip */}
        <div className="bg-privacy-bg border border-secondary-container rounded-lg p-4 flex items-center gap-3 mb-10">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>encrypted</span>
          <p className="text-[13px] font-medium text-on-secondary-container">
            <span className="font-bold">Privacy First:</span> All documents are parsed locally in your browser. Your private data never leaves your device.
          </p>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-4 mb-12">
            <h2 className="font-label-caps text-label-caps text-text-secondary mb-4 uppercase tracking-widest">Selected Documents ({documents.length})</h2>
            
            {documents.map(doc => (
              <div key={doc.id} className="flex flex-col p-4 bg-white border border-border rounded-xl shadow-sm hover:border-primary transition-colors gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary-fixed rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">
                        {doc.type === 'Excel Spreadsheet' ? 'table_view' : doc.type === 'Image (OCR)' ? 'image' : 'description'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{doc.name}</p>
                      <p className="text-xs text-text-muted font-data-mono">{doc.size} • {doc.type} • {doc.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'Ready' ? (
                      <span className="material-symbols-outlined text-primary fill-icon">check_circle</span>
                    ) : doc.status === 'Failed' ? (
                      <span className="material-symbols-outlined text-red-600 fill-icon">error</span>
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 animate-spin">sync</span>
                    )}
                  </div>
                </div>
                
                {/* Show anonymised text preview for verification */}
                {doc.status === 'Ready' && doc.anonymised && (
                  <div className="mt-2 bg-surface-container-low p-4 rounded-lg text-sm border border-border max-h-48 overflow-y-auto">
                    <p className="font-bold text-xs text-text-secondary mb-2 uppercase">Anonymised Extracted Text Preview:</p>
                    <p className="whitespace-pre-wrap font-data-mono text-xs text-on-surface">{doc.anonymised}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {documents.length > 0 && (
          <button 
            onClick={handleStartChatting}
            className="w-full bg-primary text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Start chatting with {documents.length} document{documents.length !== 1 && 's'}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        )}
      </main>
    </div>
  );
}
