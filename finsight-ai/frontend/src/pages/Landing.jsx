import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
        observer.observe(section);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="bg-surface-container-lowest dark:bg-surface-container-lowest docked full-width top-0 sticky z-50 border-b border-border dark:border-outline-variant flat no shadows">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FinSight AI" className="w-12 h-12 object-contain rounded" />
            <span className="font-headline-sm text-headline-sm font-bold text-primary">FinSight AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container transition-colors" href="#how-it-works">How it works</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container transition-colors" href="#features">Features</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container transition-colors" href="#privacy">Privacy</a>
          </div>
          {user ? (
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-secondary-fixed-dim transition-colors shadow-sm"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-border rounded-xl shadow-lg overflow-hidden flex flex-col py-2 z-50">
                  <div className="px-4 py-3 border-b border-border mb-1 bg-surface-container-low/50">
                    <p className="font-headline-sm text-sm text-on-surface truncate font-semibold">{user.name}</p>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">{user.email}</p>
                  </div>
                  <button onClick={() => navigate('/upload')} className="text-left px-4 py-2.5 text-sm font-body-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span> Dashboard
                  </button>
                  <button onClick={() => { alert('Profile view coming soon!'); setIsDropdownOpen(false); }} className="text-left px-4 py-2.5 text-sm font-body-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-primary">person</span> View Profile
                  </button>
                  <button onClick={() => { setIsDropdownOpen(false); navigate('/'); setTimeout(() => logout(), 10); }} className="text-left px-4 py-2.5 text-sm font-body-md text-error hover:bg-error-container transition-colors flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">logout</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-caps text-label-caps hover:bg-primary-container transition-all active:scale-95 duration-150"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-10"></div>
        <div className="max-w-container-max mx-auto px-gutter text-center md:text-left flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg max-w-2xl">
              Your finances are complex. <br/>
              <span className="text-primary underline decoration-primary/20">Understanding them shouldn't be.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-text-secondary max-w-xl">
              One-click analysis for your SIPs, LIC policies, and bank loans. Local-first AI that understands Indian financial documents without ever seeing your private data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={() => navigate('/upload')}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-headline-sm text-body-md flex items-center justify-center gap-2 hover:bg-primary-container shadow-sm transition-all active:scale-95"
              >
                Upload your documents
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <a href="#how-it-works" className="border border-border bg-surface px-8 py-4 rounded-xl font-headline-sm text-body-md text-on-surface hover:bg-white transition-all flex items-center justify-center">
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-4 text-text-muted justify-center md:justify-start">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="font-label-caps text-label-caps">LOCAL-FIRST ENCRYPTION • ZERO DATA RETENTION</span>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg">
            <div className="glass-card p-4 rounded-xl shadow-lg transform md:rotate-2">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div>
                    <p className="font-headline-sm text-body-md">FinSight Assistant</p>
                    <p className="font-label-caps text-[10px] text-primary">ONLINE • SECURE</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 mb-6 text-left">
                <div className="bg-primary text-on-primary p-3 rounded-lg rounded-tr-none ml-12 text-sm">
                  Compare my HDFC Loan EMI vs my Nippon SIP returns over 5 years.
                </div>
                <div className="bg-surface-container-low border border-border p-3 rounded-lg rounded-tl-none mr-12 text-sm text-on-surface">
                  I've analyzed your data. Your SIP (12.4%) is outperforming your Loan interest (8.9%). Continuing the SIP while paying regular EMIs is mathematically optimal.
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center text-text-muted">
                  <span className="material-symbols-outlined">attach_file</span>
                </div>
                <input className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Ask about your portfolio..." type="text"/>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Problem Section */}
      <section className="py-section-gap bg-white">
        <div className="max-w-container-max mx-auto px-gutter text-center">
          <h2 className="font-headline-md text-headline-md mb-4">6 financial products. Zero clarity.</h2>
          <p className="text-text-secondary font-body-md mb-16">The average Indian investor struggles to see the big picture across fragmented platforms.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border border-border bg-surface hover:border-primary transition-colors text-left group">
              <div className="w-14 h-14 rounded-lg bg-status-insurance flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">umbrella</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-3">LIC &amp; Insurance</h3>
              <p className="text-text-secondary font-body-md">Traditional policies often mask actual returns. We reveal your true IRR and coverage gaps.</p>
            </div>
            <div className="p-8 rounded-xl border border-border bg-surface hover:border-primary transition-colors text-left group">
              <div className="w-14 h-14 rounded-lg bg-secondary-container flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">trending_up</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-3">SIPs &amp; MFs</h3>
              <p className="text-text-secondary font-body-md">Aggregating CAS statements from CAMS/Karvy into a single, unified performance dashboard.</p>
            </div>
            <div className="p-8 rounded-xl border border-border bg-surface hover:border-primary transition-colors text-left group">
              <div className="w-14 h-14 rounded-lg bg-status-loan flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">account_balance</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-3">Loans &amp; EMIs</h3>
              <p className="text-text-secondary font-body-md">Visualize your debt-to-income ratio and see how much interest you're actually paying.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-section-gap relative overflow-hidden" id="how-it-works">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center mb-20">
            <span className="font-label-caps text-label-caps text-primary bg-primary/10 px-4 py-1 rounded-full">PROCESS</span>
            <h2 className="font-headline-md text-headline-md mt-4">From Chaos to Clarity in Seconds</h2>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 relative">
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-border via-primary/30 to-border -z-10"></div>
            <div className="flex-1 text-center space-y-4">
              <div className="w-20 h-20 bg-white border-4 border-primary/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-lg">1. Upload</h4>
              <p className="text-text-secondary font-body-md">Drop your PDFs, CAS statements, or loan documents. No login required for testing.</p>
            </div>
            <div className="flex-1 text-center space-y-4">
              <div className="w-20 h-20 bg-white border-4 border-primary/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">memory</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-lg">2. AI Reads</h4>
              <p className="text-text-secondary font-body-md">Our private LLM parses numbers locally on your device to ensure maximum security.</p>
            </div>
            <div className="flex-1 text-center space-y-4">
              <div className="w-20 h-20 bg-white border-4 border-primary/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-primary text-3xl">forum</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-lg">3. Ask Anything</h4>
              <p className="text-text-secondary font-body-md">Ask "Can I afford a car?" or "Am I over-insured?" and get instant data-backed answers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-section-gap space-y-section-gap" id="features">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">calculate</span>
              </div>
              <h2 className="font-headline-md text-headline-md">Loan vs SIP Analysis</h2>
              <p className="text-text-secondary font-body-md">Stop guessing where your next ₹10,000 should go. FinSight calculates whether pre-paying a loan or increasing your SIP is mathematically better for your net worth based on current market trends and your specific interest rates.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 font-body-md"><span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Pre-payment impact simulation</li>
                <li className="flex items-center gap-3 font-body-md"><span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Real-time CAGR comparison</li>
                <li className="flex items-center gap-3 font-body-md"><span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Tax-saving optimization</li>
              </ul>
            </div>
            <div className="flex-1 bg-surface rounded-3xl border border-border p-8 relative group overflow-hidden">
              <img alt="Chart UI mockup" className="rounded-xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3937UAua5g8owQPN1fxQ-1Kt_iLadRq0YO_VC6rVXZ393TSSaSJyh6D__DWm5TeH3y5Xs9fJZ52R0jGCQf-QpPkHixD-swWRCbgXFNfi4b2wbpxpnonpan2R65r3v_dZQBA7_5tlw9xW0D-Sv9MXKItN1bRQ6dKcC4RQ_j4dXdIB3h-rSLXpMJ46DK7uP76tpVneEzqj79lwqNx9u41aT4r16pVur0Q4rNo9rCE_VjzdR7G2G79f-PlPCgNQerYVyIh-NjM0yj9Kl"/>
            </div>
          </div>
        </div>

        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">shield_with_heart</span>
              </div>
              <h2 className="font-headline-md text-headline-md">Insurance Gap Calculation</h2>
              <p className="text-text-secondary font-body-md">Most Indian families are under-insured or over-paying for endowment plans. Our AI audits your LIC and Health policies to ensure your family's future is truly protected against inflation and lifestyle costs.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 font-body-md"><span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Human Life Value (HLV) analysis</li>
                <li className="flex items-center gap-3 font-body-md"><span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Hidden fee identification</li>
                <li className="flex items-center gap-3 font-body-md"><span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Policy maturity reminders</li>
              </ul>
            </div>
            <div className="flex-1 bg-surface rounded-3xl border border-border p-8 relative group overflow-hidden">
              <img alt="Insurance UI mockup" className="rounded-xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwHaZE-C-EQ4uL4iXc-Q6QO2Gn8mTpYEHr9Woarpul0fipl26BMerd3rG7W0A6P8lf2N3DnAeNBOXo6kEF0TIk5tHTXlc9bQAJLqWQsaMrLD-8GV42YYVRu9EbA5xkxCBAdByHcsb07D3kzyfjt6lAvx73NgMTrezSUzJWbkBasqXrx-bfBef33u43Q1G1cHzmcbWLsIUd9e1470QpbkHLnYAhnsA6UKGJ1aJMGW1yVvvS--Si5e6IRkxgsP_YTiuF1CcmfhlJuGSt"/>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-section-gap bg-privacy-bg" id="privacy">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-label-caps text-label-caps text-primary border border-primary/30 px-4 py-1 rounded-full uppercase">Privacy First</span>
            <h2 className="font-headline-md text-headline-md mt-6">Your data belongs to you. Period.</h2>
            <p className="text-on-surface-variant font-body-md mt-4">We built FinSight AI with the philosophy that your financial privacy is non-negotiable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-4">memory</span>
              <h5 className="font-headline-sm text-body-lg font-bold mb-2">Local Parsing</h5>
              <p className="text-text-secondary text-sm">Documents are scanned on your device. We never see your raw PDFs.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-4">cloud_off</span>
              <h5 className="font-headline-sm text-body-lg font-bold mb-2">Zero Storage</h5>
              <p className="text-text-secondary text-sm">Once you close the session, your data is wiped from memory.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-4">lock</span>
              <h5 className="font-headline-sm text-body-lg font-bold mb-2">AES-256 Encryption</h5>
              <p className="text-text-secondary text-sm">Any temporary data in transit is protected by military-grade encryption.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-4">visibility_off</span>
              <h5 className="font-headline-sm text-body-lg font-bold mb-2">No Ad-Targeting</h5>
              <p className="text-text-secondary text-sm">We don't sell your data to banks or insurance agents. Ever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="bg-primary-container rounded-[40px] p-12 md:p-24 text-center text-on-primary-container relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none"></div>
            <div className="relative z-10 space-y-8">
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-white">Ready to see your wealth clearly?</h2>
              <p className="font-body-lg text-white/80 max-w-xl mx-auto">
                  Join 10,000+ Indian investors making smarter financial decisions with local AI.
              </p>
              <button 
                onClick={() => navigate('/upload')}
                className="bg-white text-primary px-10 py-5 rounded-2xl font-headline-sm text-headline-sm hover:bg-surface transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto"
              >
                  Upload your documents
                  <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-low dark:bg-surface-container-lowest full-width py-12 border-t border-border dark:border-outline-variant flat no shadows">
        <div className="w-full px-gutter max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="FinSight AI" className="w-12 h-12 object-contain rounded" />
              <span className="font-headline-sm text-headline-sm font-bold text-primary">FinSight AI</span>
            </div>
            <p className="font-body-md text-text-secondary max-w-xs">Built for Indian investors who value precision and privacy.</p>
            <p className="font-label-caps text-[10px] text-text-muted">© 2024 FinSight AI. Not financial advice. For educational purposes only.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h6 className="font-label-caps text-label-caps text-on-surface">PRODUCT</h6>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
                <li><a className="hover:text-primary transition-colors" href="#how-it-works">How it works</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h6 className="font-label-caps text-label-caps text-on-surface">LEGAL</h6>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a className="hover:text-primary transition-colors" href="#privacy">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
              </ul>
            </div>
            <div className="space-y-4 col-span-2 md:col-span-1">
              <h6 className="font-label-caps text-label-caps text-on-surface">CONNECT</h6>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a className="hover:text-primary transition-colors" href="#">Twitter (X)</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">LinkedIn</a></li>
                <li><a className="hover:text-primary transition-colors" href="mailto:support@finsight.ai">support@finsight.ai</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
