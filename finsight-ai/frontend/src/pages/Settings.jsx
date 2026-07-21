import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || ''); // Optional if using just one name, but backend splits it.
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { firstName, email };
      if (lastName) payload.lastName = lastName;
      if (password) payload.password = password;

      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setPassword('');
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirm1) return;
    const confirm2 = window.confirm("FINAL WARNING: All your documents, chats, and financial data will be permanently deleted. Continue?");
    if (!confirm2) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Account deleted successfully');
        setUser(null);
        navigate('/');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete account');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="w-full max-w-[800px] mx-auto p-4 md:p-8 flex-1 overflow-y-auto">
        <div className="mb-8 border-b border-border pb-4">
          <h2 className="font-headline-md text-3xl font-bold text-on-surface mb-2">Settings</h2>
          <p className="font-body-md text-text-secondary">Manage your profile, preferences, and account security.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-2 font-label-caps text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          >
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`pb-3 px-2 font-label-caps text-sm border-b-2 transition-colors ${activeTab === 'account' ? 'border-primary text-primary font-bold' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          >
            Account Settings
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-headline-sm text-lg font-bold mb-4">Personal Information</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-caps text-xs text-text-muted mb-1 ml-1">First Name</label>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      className="w-full bg-surface-container-high border border-border text-on-surface p-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-xs text-text-muted mb-1 ml-1">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      className="w-full bg-surface-container-high border border-border text-on-surface p-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block font-label-caps text-xs text-text-muted mb-1 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-surface-container-high border border-border text-on-surface p-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-xs text-text-muted mb-1 ml-1">New Password (Optional)</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Leave blank to keep current password"
                    className="w-full bg-surface-container-high border border-border text-on-surface p-3 rounded-lg focus:outline-none focus:border-primary transition-colors"
                    minLength="8"
                  />
                  <p className="text-xs text-text-muted mt-1 ml-1">Password must be at least 8 characters.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading && <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Settings Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-error/5 border border-error/20 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-error/10 text-error rounded-full shrink-0">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-headline-sm text-lg font-bold text-error mb-2">Danger Zone</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone and will immediately wipe all your uploaded documents, financial summaries, and chat history.
                  </p>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="bg-error/10 text-error border border-error/20 px-4 py-2 rounded-lg font-bold hover:bg-error hover:text-white transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
