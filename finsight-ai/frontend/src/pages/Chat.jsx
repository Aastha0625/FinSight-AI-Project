import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AnalyticsTab from '../components/AnalyticsTab';
import { getDocuments } from '../utils/localDb';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/chat`;

// ── Renders a single AI response — uses React Markdown ──
function AIMessage({ content }) {
  if (!content) return <TypingIndicator />;
  
  return (
    <div className="flex gap-4 mb-4">
      <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center shadow-sm mt-1">
        <span className="text-white font-bold text-sm">₹</span>
      </div>
      <div className="flex-1 bg-surface-container-lowest border border-border rounded-xl p-5 shadow-sm overflow-x-auto prose prose-sm md:prose-base prose-emerald max-w-none text-on-surface-variant prose-headings:font-headline-sm prose-headings:text-primary prose-a:text-blue-600 prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-border prose-th:bg-surface-container-low prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ── Financial Summary Card ────────────────────────────────────────────────────
function FinancialSummaryCard({ summary, isExtracting }) {
  if (isExtracting) {
    return (
      <div className="bg-surface-container-lowest border border-border rounded-xl p-6 w-full animate-pulse flex flex-col gap-4 shadow-sm">
        <div className="h-6 bg-surface-container-high rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="h-24 bg-surface-container-high rounded-xl"></div>
          <div className="h-24 bg-surface-container-high rounded-xl"></div>
          <div className="h-24 bg-surface-container-high rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-surface-container-lowest border border-border rounded-xl p-6 w-full shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <span className="material-symbols-outlined text-primary text-[24px]">dashboard</span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Financial Summary</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary-container/30 border border-secondary/20 p-5 rounded-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-secondary text-sm">trending_up</span>
            <p className="font-label-caps text-[10px] text-text-secondary uppercase">Active SIPs</p>
          </div>
          <p className="font-data-mono text-2xl font-bold text-on-surface mb-1">{summary.sips?.length || 0}</p>
          <p className="text-xs text-text-muted">Funds currently active</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary"></div>
        </div>
        <div className="bg-status-insurance/20 border border-blue-500/20 p-5 rounded-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-600 text-sm">security</span>
            <p className="font-label-caps text-[10px] text-text-secondary uppercase">Active Policies</p>
          </div>
          <p className="font-data-mono text-2xl font-bold text-on-surface mb-1">{summary.policies?.length || 0}</p>
          <p className="text-xs text-text-muted">Policies currently active</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
        </div>
        <div className="bg-status-loan/20 border border-orange-500/20 p-5 rounded-xl flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-orange-600 text-sm">account_balance</span>
            <p className="font-label-caps text-[10px] text-text-secondary uppercase">Active Loans</p>
          </div>
          <p className="font-data-mono text-2xl font-bold text-on-surface mb-1">{summary.loans?.length || 0}</p>
          <p className="text-xs text-text-muted">Loans currently active</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600"></div>
        </div>
      </div>
    </div>
  );
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
  
  const [documents, setDocuments] = useState([]);
  
  // Fetch documents from IndexedDB on mount
  useEffect(() => {
    getDocuments().then(docs => {
      setDocuments(docs || []);
    }).catch(err => console.error("Failed to load local documents", err));
  }, []);

  // Build the combined anonymised document context from all uploaded docs
  const documentContext = documents
    .filter(d => d.status === 'Ready' && d.anonymised)
    .map(d => `[Document: ${d.name}]\n${d.anonymised}`)
    .join('\n\n---\n\n');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(true); // Left sidebar
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]); // rely on backend
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    return location.state?.sessionId || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const { token, logout, user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('chat');
  const [analyticsData, setAnalyticsData] = useState(() => {
    const saved = localStorage.getItem('finsight_analytics');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { sip: null, loanVsInvest: null, cashflow: null, goalGap: null, insurance: null };
  });
  const [hasNewAnalytics, setHasNewAnalytics] = useState(false);

  const [summaryData, setSummaryData] = useState(null);
  const [isExtractingSummary, setIsExtractingSummary] = useState(false);

  // Fetch chat sessions and user data on mount
  useEffect(() => {
    if (token) {
      // Fetch Chat Sessions
      fetch(`${API_BASE_URL}/api/chat-sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : [])
      .then(data => setChatSessions(data))
      .catch(console.error);
      
      // Fetch User Data for accurate summary and baseline analytics
      fetch(`${API_BASE_URL}/api/user-data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.summary) {
          setSummaryData(data.summary);
          localStorage.setItem('finsight_summary', JSON.stringify(data.summary));
        }
      })
      .catch(console.error);
    }
  }, [token]);

  // Load a specific session's history and analytics
  useEffect(() => {
    if (activeSessionId && token) {
      fetch(`${API_BASE_URL}/api/chat-sessions/${activeSessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setMessages((data.history || []).map(m => ({ role: m.role, content: m.content })));
        if (data.analytics) {
          setAnalyticsData(data.analytics);
        } else {
          setAnalyticsData({ sip: null, loanVsInvest: null, cashflow: null, goalGap: null, insurance: null });
        }
      })
      .catch(console.error);
    } else {
      setMessages([]);
      setAnalyticsData({ sip: null, loanVsInvest: null, cashflow: null, goalGap: null, insurance: null });
    }
  }, [activeSessionId, token]);

  // Fetch Summary when documents are loaded
  useEffect(() => {
    if (documents.length > 0 && !summaryData && !isExtractingSummary) {
      const fetchSummary = async () => {
        setIsExtractingSummary(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/extract-summary`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ documentContext })
          });
          if (res.ok) {
            const data = await res.json();
            setSummaryData(data);
            localStorage.setItem('finsight_summary', JSON.stringify(data));
          }
        } catch (err) {
          console.error("Failed to extract summary", err);
        } finally {
          setIsExtractingSummary(false);
        }
      };
      fetchSummary();
    } else if (!summaryData) {
      // Try load from local storage if no docs uploaded right now
      const storedSummary = localStorage.getItem('finsight_summary');
      if (storedSummary) {
        try { setSummaryData(JSON.parse(storedSummary)); } catch (e) {}
      }
    }
  }, [documents, documentContext, token, summaryData, isExtractingSummary]);

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation(); // prevent setting it as active
    if (!window.confirm('Are you sure you want to delete this chat session?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete chat session', err);
    }
  };

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
          sessionId: activeSessionId
        }),
      });

      if (!res.ok) throw new Error('Server error');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let finalToolsUsed = [];
      let currentSessionId = activeSessionId;
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        buffer = lines.pop(); // keep the last potentially incomplete chunk in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'session') {
                if (data.sessionId && data.sessionId !== activeSessionId) {
                  currentSessionId = data.sessionId;
                  setActiveSessionId(data.sessionId);
                  const newTitle = q.length > 30 ? q.substring(0, 30) + '...' : q;
                  setChatSessions(prev => [{ id: data.sessionId, title: newTitle, updated_at: new Date().toISOString() }, ...prev]);
                }
              } else if (data.type === 'content') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content += data.content;
                  return newMsgs;
                });
              } else if (data.type === 'done') {
                finalToolsUsed = data.toolsUsed || [];
              } else if (data.type === 'error') {
                setError(data.error);
              }
            } catch(e) {
              // Ignore incomplete JSON chunks in SSE stream parsing
            }
          }
        }
      }
      
      let updatedAnalytics = false;
      const newAnalyticsData = {};
      
      if (finalToolsUsed && Array.isArray(finalToolsUsed)) {
        finalToolsUsed.forEach(tool => {
          if (tool.name === 'calculate_sip_maturity') { newAnalyticsData.sip = tool.result; updatedAnalytics = true; }
          if (tool.name === 'compare_loan_vs_invest') { newAnalyticsData.loanVsInvest = tool.result; updatedAnalytics = true; }
          if (tool.name === 'plan_monthly_cashflow') { newAnalyticsData.cashflow = tool.result; updatedAnalytics = true; }
          if (tool.name === 'analyse_goal_gap') { newAnalyticsData.goalGap = tool.result; updatedAnalytics = true; }
          if (tool.name === 'check_insurance_adequacy') { newAnalyticsData.insurance = tool.result; updatedAnalytics = true; }
        });
      }
      
      if (updatedAnalytics) {
        setAnalyticsData(prev => {
          const newState = { ...prev, ...newAnalyticsData };
          if (currentSessionId) {
            fetch(`${API_BASE_URL}/api/chat-sessions/${currentSessionId}/analytics`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ analytics: newState })
            }).catch(err => console.error(err));
          }
          return newState;
        });
        setHasNewAnalytics(true);
      }
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, documentContext, token]);

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
    <div className="bg-background text-on-surface font-body-md w-full h-full flex flex-col relative overflow-hidden">

      {/* ── Tab Switcher ── */}
      <div className="bg-surface-container-lowest border-b border-border">
        <div className="max-w-content-narrow mx-auto px-gutter flex items-center gap-6 pt-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`pb-3 px-1 font-label-caps text-sm border-b-2 transition-colors ${activeTab === 'chat' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          >
            💬 Chat
          </button>
          <button 
            onClick={() => { setActiveTab('analytics'); setHasNewAnalytics(false); }}
            className={`pb-3 px-1 font-label-caps text-sm border-b-2 transition-colors relative ${activeTab === 'analytics' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          >
            📊 Analytics
            {hasNewAnalytics && <span className="absolute top-1 -right-3 w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative flex flex-row">

        {/* ── Left Sidebar: Chat History ── */}
        <aside className={`bg-surface-container-lowest border-r border-border flex flex-col transition-all duration-300 overflow-hidden ${isHistorySidebarOpen && activeTab === 'chat' ? 'w-64 opacity-100' : 'w-0 opacity-0 border-none'}`}>
          <div className="w-64 h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <button 
                onClick={() => setActiveSessionId(null)} 
                className="w-full bg-primary text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="font-label-caps text-xs text-text-muted mb-3 px-2">RECENT CHATS</p>
              {chatSessions.length === 0 ? (
                <p className="text-xs text-text-muted px-2 italic">No previous chats.</p>
              ) : (
                chatSessions.map(session => (
                  <div key={session.id} className="relative group">
                    <button
                      onClick={() => setActiveSessionId(session.id)}
                      className={`w-full text-left px-3 py-2 pr-8 rounded-lg text-sm truncate transition-colors ${activeSessionId === session.id ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-high'}`}
                    >
                      <span className="material-symbols-outlined text-[14px] inline-block align-middle mr-2 opacity-70">chat_bubble</span>
                      {session.title || 'Chat Session'}
                    </button>
                    <button 
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all"
                      title="Delete Chat"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* ── Message Canvas ── */}
        <div ref={chatContainerRef} className={`flex-1 overflow-y-auto scroll-smooth flex-col items-center py-10 px-gutter bg-background scrollbar-hide ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
          <div className="w-full max-w-content-narrow space-y-8">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)} className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1 font-label-caps text-xs">
                <span className="material-symbols-outlined text-[18px]">{isHistorySidebarOpen ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right'}</span>
                {isHistorySidebarOpen ? 'Hide History' : 'Show History'}
              </button>
              <button onClick={() => setIsSidebarOpen(true)} className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1 font-label-caps text-xs">
                View Data <span className="material-symbols-outlined text-[18px]">data_usage</span>
              </button>
            </div>

            {/* Financial Summary Card */}
            {(isExtractingSummary || summaryData) && (
              <FinancialSummaryCard summary={summaryData} isExtracting={isExtractingSummary} />
            )}

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

        {/* ── Analytics Tab ── */}
        <div className={`flex-1 overflow-y-auto scroll-smooth flex-col items-center px-gutter bg-background scrollbar-hide ${activeTab === 'analytics' ? 'flex' : 'hidden'}`}>
          <div className="w-full max-w-content-narrow">
            <AnalyticsTab financialSummary={summaryData} analyticsData={analyticsData} />
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
          <div className={`relative flex items-end gap-2 bg-surface border rounded-2xl p-2 transition-all ${isLoading ? 'border-primary/50 opacity-80' : 'border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'}`}>
            <button 
              onClick={() => navigate('/upload')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-container-high transition-colors flex-shrink-0 mb-1 ml-1"
              title="Upload Documents"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-2 min-h-[56px] max-h-48 scrollbar-hide font-body-md text-sm disabled:opacity-60"
              placeholder={isLoading ? 'FinSight AI is thinking...' : 'Ask FinSight about your finances...'}
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
