import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getDocuments, deleteDocument } from '../utils/localDb';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [hasDocs, setHasDocs] = useState(() => localStorage.getItem('finsight_docs_uploaded') === 'true');
  const [summary, setSummary] = useState(() => {
    const s = localStorage.getItem('finsight_summary');
    return s ? JSON.parse(s) : null;
  });
  const [analytics, setAnalytics] = useState(() => {
    const s = localStorage.getItem('finsight_analytics');
    return s ? JSON.parse(s) : null;
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [localDocs, setLocalDocs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const res = await fetch(`${API_BASE_URL}/api/user-data`, {
            credentials: 'include'
          });
          
          if (res.ok) {
            const data = await res.json();
            
            if (data.summary) {
              setSummary(data.summary);
              localStorage.setItem('finsight_summary', JSON.stringify(data.summary));
              setHasDocs(true);
              localStorage.setItem('finsight_docs_uploaded', 'true');
            }
            
            if (data.analytics) {
              setAnalytics(data.analytics);
              localStorage.setItem('finsight_analytics', JSON.stringify(data.analytics));
            }
          
          // Fetch chat sessions for Recent Insights
          const sessionRes = await fetch(`${API_BASE_URL}/api/chat-sessions`, {
            credentials: 'include'
          });
          if (sessionRes.ok) {
            const sessions = await sessionRes.json();
            setChatHistory(sessions.slice(0, 3));
          }
        }
      }
    } catch (e) {
      console.error('Error fetching user data from backend', e);
    }

      // Fallback to local storage if needed
      const uploaded = localStorage.getItem('finsight_docs_uploaded') === 'true';
      if (uploaded) {
        setHasDocs(true);
        
        const storedSummary = localStorage.getItem('finsight_summary');
        if (storedSummary) {
          try { setSummary(JSON.parse(storedSummary)); } catch (e) {}
        }
        
        const storedAnalytics = localStorage.getItem('finsight_analytics');
        if (storedAnalytics) {
          try { setAnalytics(JSON.parse(storedAnalytics)); } catch (e) {}
        }
      }
      
      try {
        const docs = await getDocuments();
        setLocalDocs(docs);
      } catch (e) {
        console.error("Failed to load local documents", e);
      }
    };

    fetchData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const greetingStr = getGreeting();
  const firstName = user?.firstName || 'User';

  if (!hasDocs) {
    return <OnboardingState firstName={firstName} greeting={greetingStr} navigate={navigate} />;
  }

  const handleDeleteDoc = async (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      await deleteDocument(id);
      setLocalDocs(prev => prev.filter(d => d.id !== id));
      if (localDocs.length === 1) { // We just deleted the last one
        localStorage.removeItem('finsight_docs_uploaded');
        localStorage.removeItem('finsight_partial_uploads');
        setHasDocs(false);
      }
    }
  };

  return <ReturningUserState firstName={firstName} greeting={greetingStr} navigate={navigate} summary={summary} analytics={analytics} chatHistory={chatHistory} localDocs={localDocs} onDeleteDoc={handleDeleteDoc} />;
}

function OnboardingState({ firstName, greeting, navigate }) {
  // Check if partially uploaded
  const [uploadedTypes, setUploadedTypes] = useState({ sip: false, insurance: false, loan: false });

  useEffect(() => {
    const st = localStorage.getItem('finsight_partial_uploads');
    if (st) {
      try { setUploadedTypes(JSON.parse(st)); } catch(e) {}
    }
  }, []);

  const uploadedCount = Object.values(uploadedTypes).filter(Boolean).length;
  const progressPercent = (uploadedCount / 3) * 100;

  const handleUploadClick = () => {
    navigate('/upload');
  };

  return (
    <div className="w-full max-w-[900px] mx-auto p-4 md:p-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-headline-md text-3xl font-bold text-on-surface">{greeting}, {firstName}! 👋</h2>
          <p className="font-body-md text-text-secondary mt-1">Let's get your finances set up. Upload your documents to get started.</p>
        </div>
        <div className="w-full md:w-64">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps text-xs text-text-muted font-bold tracking-wider">SETUP PROGRESS</span>
            <span className="font-data-mono text-sm text-primary font-medium">{uploadedCount} of 3</span>
          </div>
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        <OnboardingCard 
          title="Upload SIP Statement" 
          desc="Your monthly SIP amounts, fund names, and start dates" 
          benefit="💡 AI will project your SIP growth and goal progress"
          icon="trending_up"
          color="bg-primary/10 text-primary"
          onClick={handleUploadClick}
          isUploaded={uploadedTypes.sip}
        />
        <OnboardingCard 
          title="Upload Insurance Policy" 
          desc="Sum assured, premium amount, maturity date" 
          benefit="💡 AI will check if you're adequately insured"
          icon="security"
          color="bg-status-insurance text-[#0061A4]"
          onClick={handleUploadClick}
          isUploaded={uploadedTypes.insurance}
        />
        <OnboardingCard 
          title="Upload Loan Document" 
          desc="EMI amount, outstanding balance, interest rate" 
          benefit="💡 AI will compare prepayment vs investing"
          icon="account_balance"
          color="bg-status-loan text-[#8B4000]"
          onClick={handleUploadClick}
          isUploaded={uploadedTypes.loan}
        />
      </div>

      <div className="text-center mb-10 flex flex-col sm:flex-row justify-center items-center gap-6">
        <button onClick={handleUploadClick} className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md">
          Upload all documents →
        </button>
        <div className="flex flex-col items-center sm:items-start">
          <p className="text-sm text-text-secondary">Just have a quick question?</p>
          <button onClick={() => navigate('/chat')} className="text-primary font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">forum</span> Start a chat without documents
          </button>
        </div>
      </div>

      <div className="opacity-70">
        <h3 className="font-headline-sm text-lg font-bold mb-4">Once uploaded, you'll get:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LockedFeature title="SIP Growth Projections" icon="bar_chart" />
          <LockedFeature title="Insurance Gap Analysis" icon="health_and_safety" />
          <LockedFeature title="Loan vs Investment Comparison" icon="compare_arrows" />
          <LockedFeature title="Monthly Cashflow Breakdown" icon="pie_chart" />
        </div>
      </div>
    </div>
  );
}

function OnboardingCard({ title, desc, benefit, icon, color, onClick, isUploaded }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-primary transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-headline-sm text-lg font-bold text-on-surface">{title}</h4>
        <p className="text-sm text-text-secondary mt-1">{desc}</p>
        <p className="text-xs font-medium text-primary mt-2">{benefit}</p>
      </div>
      <div className="shrink-0 mt-4 md:mt-0">
        {isUploaded ? (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span> Uploaded
          </div>
        ) : (
          <button onClick={onClick} className="border border-border text-on-surface px-4 py-2 rounded-lg font-bold text-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-2">
            Upload <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
}

function LockedFeature({ title, icon }) {
  return (
    <div className="bg-surface border border-border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-text-muted text-3xl mb-2">{icon}</span>
      <h5 className="font-semibold text-text-secondary">{title}</h5>
      <span className="bg-surface-container-high text-xs text-text-secondary px-2 py-1 rounded-full mt-2 font-label-caps">Unlocked after upload</span>
    </div>
  );
}

function ReturningUserState({ firstName, greeting, navigate, summary, analytics, chatHistory, localDocs, onDeleteDoc }) {
  const totalMonthlySIP = summary?.totalMonthlySIP || 0;
  const totalInsuranceCover = summary?.totalInsuranceCover || 0;
  const totalMonthlyEMI = summary?.totalMonthlyEMI || 0;
  const surplus = summary?.totalMonthlySIP ? (100000 - totalMonthlySIP - totalMonthlyEMI) : 0; // rough mock

  // Dynamic Health Score Calculation
  let calculatedScore = 40; // Base score
  
  if (summary?.sips?.length > 0) calculatedScore += 20;
  
  let cashflowStatus = 'Missing Data';
  let isCashflowGood = false;
  if (summary?.sips?.length > 0 || summary?.loans?.length > 0) {
    if (surplus > 20000) {
      cashflowStatus = 'Healthy';
      isCashflowGood = true;
      calculatedScore += 20;
    } else {
      cashflowStatus = 'High Stress';
      calculatedScore -= 10;
    }
  }

  let insuranceStatus = 'Missing Data';
  let isInsuranceGood = false;
  if (summary?.policies?.length > 0) {
    if (totalInsuranceCover >= 5000000) {
      insuranceStatus = 'Adequate';
      isInsuranceGood = true;
      calculatedScore += 20;
    } else {
      insuranceStatus = 'Underinsured';
      calculatedScore += 5;
    }
  }
  
  const goalStatus = summary?.sips?.length > 0 ? 'On Track' : 'Needs Review';
  const isGoalGood = summary?.sips?.length > 0;
  
  const healthScore = summary ? Math.min(100, Math.max(0, calculatedScore)) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto transition-all duration-300">
      <div className="mb-8">
        <h2 className="font-headline-md text-3xl font-bold text-on-surface">Welcome back, {firstName}! 👋</h2>
        <p className="font-body-md text-text-secondary mt-1">Your financial summary is ready. Ask the AI anything.</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-10">
        <button onClick={() => navigate('/chat')} className="bg-primary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-sm">forum</span> Ask AI a question
        </button>
        <button onClick={() => navigate('/upload')} className="border border-border text-on-surface px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm">folder_open</span> Update documents
        </button>
        <button onClick={() => navigate('/chat')} className="border border-border text-on-surface px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm">bar_chart</span> View Analytics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <MetricCard title="Active SIPs" value={summary?.sips?.length || 0} sub="Funds currently active" icon="trending_up" color="bg-primary" />
        <MetricCard title="Active Policies" value={summary?.policies?.length || 0} sub="Policies currently active" icon="security" color="bg-[#0061A4]" />
        <MetricCard title="Active Loans" value={summary?.loans?.length || 0} sub="Loans currently active" icon="account_balance" color="bg-error" />
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 mb-10 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-full md:w-2/5 flex flex-col items-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="56" fill="transparent" stroke="#E5E7EB" strokeWidth="12" />
              <circle cx="64" cy="64" r="56" fill="transparent" stroke="#16A34A" strokeWidth="12" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * healthScore) / 100} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-data-mono text-3xl font-bold">{healthScore}</span>
              <span className="text-xs text-text-muted">/ 100</span>
            </div>
          </div>
          <h3 className="font-bold text-on-surface">Financial Health Score</h3>
        </div>
        <div className="w-full md:w-3/5 space-y-4">
          <HealthFactor label="Cashflow" status={cashflowStatus} isGood={isCashflowGood} />
          <HealthFactor label="Insurance" status={insuranceStatus} isGood={isInsuranceGood} />
          <HealthFactor label="Goals" status={goalStatus} isGood={isGoalGood} />
          <button onClick={() => navigate('/chat')} className="text-primary font-semibold text-sm hover:underline mt-4 block">
            Ask the AI for detailed analysis →
          </button>
        </div>
      </div>

      {chatHistory.length > 0 && (
        <div className="mb-10">
          <h3 className="font-headline-sm text-lg font-bold mb-4">Recent Insights</h3>
          <div className="space-y-3">
            {chatHistory.map((session, idx) => (
              <div key={idx} onClick={() => navigate('/chat', { state: { sessionId: session.id } })} className="bg-white border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary">chat_bubble</span>
                <div className="flex-1 truncate">
                  <p className="font-semibold text-on-surface truncate">{session.title}</p>
                </div>
                <span className="text-xs text-text-secondary">{new Date(session.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-headline-sm text-lg font-bold mb-4">Your Documents</h3>
        <div className="bg-white border border-border rounded-xl p-4">
          {localDocs.length > 0 ? (
            localDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-surface rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-text-secondary">
                    {doc.type === 'Excel Spreadsheet' ? 'table_view' : doc.type === 'Image (OCR)' ? 'image' : 'description'}
                  </span>
                  <div>
                    <span className="font-medium text-sm block">{doc.name}</span>
                    <span className="text-[10px] text-text-muted">{doc.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase">
                    Stored Locally <span className="material-symbols-outlined text-[12px]">shield</span>
                  </span>
                  <button onClick={() => onDeleteDoc(doc.id)} className="text-text-muted hover:text-error transition-colors p-1" title="Delete Document">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-muted italic mb-4">No documents currently loaded.</p>
          )}
          <button onClick={() => navigate('/upload')} className="text-primary font-semibold text-sm hover:underline mt-2">
            + Upload more documents
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon, color, isNegative }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className={`material-symbols-outlined text-sm ${isNegative ? 'text-error' : color.replace('bg-', 'text-')}`}>{icon}</span>
        <span className="font-label-caps text-[10px] text-text-secondary uppercase">{title}</span>
      </div>
      <div className={`font-data-mono text-2xl font-bold mb-1 ${isNegative ? 'text-error' : 'text-on-surface'}`}>{value}</div>
      <div className={`text-xs ${isNegative ? 'text-error' : 'text-text-muted'}`}>{sub}</div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${isNegative ? 'bg-error' : color}`}></div>
    </div>
  );
}

function HealthFactor({ label, status, isGood }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isGood ? 'bg-primary' : 'bg-[#F59E0B]'}`}></div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className={`px-2 py-1 rounded-md text-xs font-bold ${isGood ? 'bg-primary/10 text-primary' : 'bg-[#FEF3C7] text-[#B45309]'}`}>
        {status}
      </span>
    </div>
  );
}
