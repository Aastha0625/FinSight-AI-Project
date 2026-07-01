import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api/chat';

// ── Renders a single AI response — parses ## headings into styled sections ──
function AIMessage({ content }) {
  const sections = parseAIResponse(content);
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center shadow-sm mt-1">
        <span className="text-white font-bold text-sm">₹</span>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {sections.map((section, i) => (
          <div key={i} className={`rounded-xl p-5 border ${section.style}`}>
            {section.label && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{section.icon}</span>
                <span className={`font-label-caps text-label-caps ${section.labelColor}`}>{section.label}</span>
              </div>
            )}
            <p className="text-on-surface-variant font-body-md text-sm leading-relaxed whitespace-pre-wrap">{section.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseAIResponse(content) {
  if (!content) return [{ text: '', style: 'bg-surface-container-lowest border-l-4 border-l-primary border-border', label: null, labelColor: '', icon: '' }];

  // Split by ## headings
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;

  const sectionConfig = {
    'FACT': { style: 'bg-surface-container-lowest border-l-4 border-l-primary border-border', label: 'FACT', labelColor: 'text-primary', icon: '📋' },
    'ANALYSIS': { style: 'bg-surface-container-lowest border-l-4 border-l-blue-500 border-border', label: 'ANALYSIS', labelColor: 'text-blue-500', icon: '💡' },
    'RECOMMENDATION': { style: 'bg-status-loan border-l-4 border-l-orange-500 border-border', label: 'RECOMMENDATION', labelColor: 'text-orange-600', icon: '✅' },
    'RISK': { style: 'bg-status-loan border-l-4 border-l-red-500 border-border', label: 'RISK ALERT', labelColor: 'text-red-600', icon: '⚠️' },
  };

  for (const line of lines) {
    // detect ## FACT, ## ANALYSIS, ## RECOMMENDATION etc.
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      if (currentSection && currentSection.text.trim()) sections.push(currentSection);
      const heading = headingMatch[1].trim().toUpperCase();
      const matchedKey = Object.keys(sectionConfig).find(k => heading.includes(k));
      if (matchedKey) {
        currentSection = { ...sectionConfig[matchedKey], text: '' };
      } else {
        currentSection = { style: 'bg-surface-container-lowest border-border border', label: headingMatch[1].trim(), labelColor: 'text-primary', icon: '📌', text: '' };
      }
    } else {
      if (!currentSection) {
        currentSection = { style: 'bg-surface-container-lowest border-l-4 border-l-primary border-border', label: null, labelColor: '', icon: '', text: '' };
      }
      currentSection.text += (currentSection.text ? '\n' : '') + line;
    }
  }
  if (currentSection && currentSection.text.trim()) sections.push(currentSection);

  if (sections.length === 0) {
    return [{ style: 'bg-surface-container-lowest border-l-4 border-l-primary border-border', label: null, labelColor: '', icon: '', text: content }];
  }

  return sections;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center shadow-sm">
        <span className="text-white font-bold text-sm">₹</span>
      </div>
      <div className="bg-surface-container-lowest border border-border rounded-xl px-5 py-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const documents = location.state?.documents || [];

  // Build the combined anonymised document context from all uploaded docs
  const documentContext = documents
    .filter(d => d.status === 'Ready' && d.anonymised)
    .map(d => `[Document: ${d.name}]\n${d.anonymised}`)
    .join('\n\n---\n\n');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', content: string}
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const { token, logout, user } = useContext(AuthContext);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (question) => {
    const q = question.trim();
    if (!q || isLoading) return;

    setError(null);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message to chat immediately
    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build conversation history in Groq format (exclude the current message)
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userQuestion: q,
          documentContext: documentContext || 'No documents uploaded.',
          conversationHistory: history,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, documentContext]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleInput = (e) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const SUGGESTIONS = [
    'What is my total net worth based on my documents?',
    'Analyze my monthly cashflow and savings rate',
    'Compare my loan EMI vs increasing my SIP',
    'Am I adequately insured based on my income?',
  ];

  return (
    <div className="bg-background text-on-surface font-body-md overflow-hidden h-screen flex flex-col">

      {/* ── TopNavBar ── */}
      <header className="bg-surface-container-lowest border-b border-border z-50 sticky top-0 h-16">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-full">
          <div className="flex items-center gap-6">
            <span onClick={() => navigate('/')} className="font-headline-sm text-headline-sm font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity">
              FinSight AI
            </span>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-border">
              <span className="material-symbols-outlined text-[18px] text-primary">description</span>
              <span className="font-label-caps text-label-caps text-text-secondary">{documents.length} DOCUMENTS LOADED</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-container-high border border-border rounded-lg transition-colors group" onClick={() => setIsSidebarOpen(o => !o)}>
              <span className="material-symbols-outlined text-[20px] text-primary group-hover:scale-110 duration-200">folder_open</span>
              <span className="font-label-caps text-label-caps text-on-surface">Documents</span>
            </button>
            <div className="flex items-center gap-3 ml-2 border-l border-border pl-4">
              <div className="w-9 h-9 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-sm font-label-caps text-text-secondary hover:text-error transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-row">

        {/* ── Message Canvas ── */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto scroll-smooth flex flex-col items-center py-10 px-gutter bg-background scrollbar-hide">
          <div className="w-full max-w-content-narrow space-y-8">

            {/* Welcome card — always shown */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">₹</span>
              </div>
              <div className="bg-surface-container-lowest border border-border rounded-xl p-6 flex-1">
                <p className="font-headline-sm text-headline-sm mb-3">Namaste. I've read your documents.</p>
                <p className="text-on-surface-variant font-body-md mb-5 text-sm">
                  {documents.length > 0
                    ? `I have successfully loaded and anonymised ${documents.length} document(s): ${documents.map(d => d.name).join(', ')}. Ask me anything about your finances.`
                    : 'No documents loaded. You can still ask general financial questions about SIPs, loans, and insurance.'}
                </p>
                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="px-4 py-2 border border-primary text-primary font-label-caps text-label-caps rounded-full hover:bg-privacy-bg transition-colors text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic conversation */}
            {messages.map((msg, i) => (
              msg.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-primary text-white rounded-xl p-4 max-w-[80%] shadow-md">
                    <p className="font-body-md text-sm">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <AIMessage key={i} content={msg.content} />
              )
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            {/* Error banner */}
            {error && (
              <div className="flex gap-3 items-start bg-error-container border border-error/20 rounded-xl p-4">
                <span className="material-symbols-outlined text-error text-[20px]">error</span>
                <div>
                  <p className="font-label-caps text-label-caps text-error mb-1">REQUEST FAILED</p>
                  <p className="text-sm text-on-error-container">{error}</p>
                </div>
              </div>
            )}

            <div className="h-32" />
          </div>
        </div>

        {/* ── Sidebar backdrop ── */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* ── Document Sidebar ── */}
        <aside className={`absolute right-0 top-0 bottom-0 w-80 bg-surface border-l border-border transform transition-transform duration-300 z-40 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-sm text-headline-sm">Loaded Data</h3>
              <button className="text-text-secondary hover:text-primary transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-privacy-bg p-4 rounded-xl border border-primary/20 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
                <div>
                  <p className="font-label-caps text-label-caps text-primary mb-1">LOCAL-FIRST PRIVACY</p>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">These files are processed locally on your device. FinSight AI only sees anonymised text.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-text-muted italic">No documents loaded.</p>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="p-4 bg-surface-container-lowest border border-border rounded-xl flex items-center gap-4 hover:border-primary transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${doc.status === 'Ready' ? 'bg-secondary-container text-secondary' : 'bg-status-loan text-orange-600'}`}>
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-label-caps text-[11px] truncate">{doc.name}</p>
                      <p className="text-[10px] text-text-muted">{doc.size} • {doc.status}</p>
                    </div>
                    {doc.status === 'Ready' && (
                      <span className="material-symbols-outlined text-primary text-[18px] fill-icon">check_circle</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 border-t border-border bg-surface-container-low">
            <button onClick={() => navigate('/upload')} className="w-full py-3 bg-white border border-border rounded-lg font-label-caps text-label-caps hover:bg-surface transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Upload More Documents
            </button>
          </div>
        </aside>
      </main>

      {/* ── Bottom Input Area ── */}
      <div className="bg-surface-container-lowest border-t border-border px-gutter py-4 z-30">
        <div className="max-w-content-narrow mx-auto flex flex-col gap-2">
          <div className={`relative flex items-end gap-3 bg-surface border rounded-2xl p-2 transition-all ${isLoading ? 'border-primary/50 opacity-80' : 'border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'}`}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 min-h-[56px] max-h-48 scrollbar-hide font-body-md text-sm disabled:opacity-60"
              placeholder={isLoading ? 'FinSight AI is thinking...' : 'Ask FinSight about your finances... (Enter to send, Shift+Enter for new line)'}
              rows="1"
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-container active:scale-95 transition-all mb-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading
                ? <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                : <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              }
            </button>
          </div>
          <p className="text-center text-[11px] text-text-muted font-label-caps opacity-70">
            AI analysis only — not financial advice. Consult a SEBI-registered advisor for major decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
