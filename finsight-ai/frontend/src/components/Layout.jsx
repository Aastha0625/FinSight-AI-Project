import React, { useContext, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U';
  const currentPath = location.pathname;

  const handleLogout = () => {
    navigate('/');
    setTimeout(() => {
      logout();
    }, 10);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Upload', path: '/upload', icon: 'folder_open' },
    { name: 'Chat', path: '/chat', icon: 'forum' }
  ];

  return (
    <div className="bg-background text-on-surface h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col h-screen fixed left-0 top-0 overflow-y-auto ${isSidebarCollapsed ? 'w-[80px]' : 'w-[220px]'} bg-surface-container-lowest border-r border-border z-50 transition-all duration-300`}>
        <div 
          className="p-6 flex items-center justify-center md:justify-start cursor-pointer hover:bg-surface-container-high transition-colors"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FinSight AI Logo" className="w-10 h-10 object-contain shrink-0 rounded" />
            {!isSidebarCollapsed && <span className="font-headline-sm text-lg font-bold text-primary whitespace-nowrap overflow-hidden">FinSight AI</span>}
          </div>
        </div>
        
        <nav className="flex-1 px-2 mt-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`p-4 flex items-center gap-3 transition-all duration-200 rounded-lg ${isActive ? 'text-primary font-bold bg-[#DCFCE7]' : 'text-text-secondary hover:bg-surface-container-high'} ${isSidebarCollapsed ? 'justify-center p-3' : ''}`}
                title={isSidebarCollapsed ? item.name : ""}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {!isSidebarCollapsed && <span className="font-label-caps text-label-caps">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-2 space-y-1 mt-auto border-t border-border pt-4">
          <button className={`w-full text-text-secondary p-4 flex items-center gap-3 hover:bg-surface-container-high transition-colors rounded-lg ${isSidebarCollapsed ? 'justify-center p-3' : ''}`} title="Settings">
            <span className="material-symbols-outlined shrink-0">settings</span>
            {!isSidebarCollapsed && <span className="font-label-caps text-label-caps truncate">Settings</span>}
          </button>
          <button onClick={handleLogout} className={`w-full text-text-secondary p-4 flex items-center gap-3 hover:bg-surface-container-high transition-colors rounded-lg ${isSidebarCollapsed ? 'justify-center p-3' : ''}`} title="Sign Out">
            <span className="material-symbols-outlined shrink-0">logout</span>
            {!isSidebarCollapsed && <span className="font-label-caps text-label-caps truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className={`fixed top-0 right-0 left-0 ${isSidebarCollapsed ? 'md:left-[80px]' : 'md:left-[220px]'} h-16 bg-surface-container-lowest border-b border-border z-40 flex items-center justify-between px-gutter transition-all duration-300`}>
        <div className="flex items-center gap-2 md:hidden">
          <span className="font-headline-sm text-lg font-bold text-primary">FinSight</span>
        </div>
        
        {/* Desktop Top Links */}
        <div className="hidden md:flex flex-1 justify-center gap-8 h-full">
           {navItems.map(item => (
             <Link 
               key={item.name}
               to={item.path}
               className={`flex items-center font-label-caps text-sm border-b-2 transition-colors ${currentPath === item.path ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
             >
               {item.name}
             </Link>
           ))}
        </div>

        <div className="flex items-center gap-4 ml-auto relative">
          <div className="hidden md:block text-right">
             <p className="font-body-md text-sm font-semibold">{user?.firstName || 'User'}</p>
          </div>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold hover:bg-primary-container transition-colors focus:outline-none">
            {initial}
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
              <div className="absolute top-10 right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg py-1 z-50">
                <button className="block w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface transition-colors">Account Settings</button>
                <button onClick={() => { setDropdownOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Sign Out</button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[220px]'} pt-[64px] pb-[60px] md:pb-0 flex flex-col h-screen overflow-hidden transition-all duration-300`}>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-border h-[60px] flex justify-around items-center z-50">
        {navItems.map(item => {
          const isActive = currentPath === item.path;
          return (
            <Link key={item.name} to={item.path} className={`flex flex-col items-center p-2 ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="text-[10px] font-label-caps mt-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
}
