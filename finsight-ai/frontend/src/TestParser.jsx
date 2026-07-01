import React, { useState, useRef } from 'react';
import { extractTextFromPDF } from './utils/pdfParser';
import { anonymiseText } from './utils/anonymiser';

export default function TestParser() {
  const [originalText, setOriginalText] = useState('');
  const [anonymisedText, setAnonymisedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    try {
      const text = await extractTextFromPDF(file);
      setOriginalText(text);
      setAnonymisedText(anonymiseText(text));
    } catch (err) {
      console.error('Error parsing PDF:', err);
      alert('Failed to parse PDF. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '40px', maxWidth: '1200px', margin: '40px auto', width: '90%' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          FinSight AI Anonymiser
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '1.1rem' }}>
          Upload a financial PDF to securely extract and redact sensitive PII/Financial information.
        </p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            padding: '14px 36px',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
            transform: 'translateY(0)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(59, 130, 246, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.39)';
          }}
        >
          {isLoading ? 'Processing Document...' : 'Upload PDF Document'}
        </button>
        {fileName && <p style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Selected: {fileName}</p>}
      </div>
      
      {(originalText || isLoading) && (
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 45%' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', fontWeight: '500' }}>Original Extracted Text</h3>
            <textarea 
              className="custom-scrollbar"
              readOnly 
              value={originalText} 
              style={{ 
                width: '100%', 
                height: '400px', 
                padding: '20px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.6'
              }}
              placeholder="Original text will appear here..."
            />
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', color: '#a78bfa', fontWeight: '500' }}>Anonymised Output</h3>
            <textarea 
              className="custom-scrollbar"
              readOnly 
              value={anonymisedText} 
              style={{ 
                width: '100%', 
                height: '400px', 
                padding: '20px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.6',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
              }}
              placeholder="Anonymised text will appear here..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
