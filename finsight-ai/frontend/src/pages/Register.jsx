import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      login(data.user, data.token);
      navigate('/upload');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center p-6">
      <Link to="/" className="font-headline-sm text-2xl font-bold text-primary mb-8 hover:opacity-80 transition-opacity">FinSight AI</Link>
      <div className="bg-surface-container-lowest border border-border p-8 rounded-2xl w-full max-w-md shadow-xl">
        <h1 className="font-headline-sm text-3xl font-bold text-on-surface mb-2">Create Account</h1>
        <p className="text-on-surface-variant font-body-md mb-8">Join FinSight AI for intelligent portfolio tracking.</p>
        
        {error && <div className="bg-error-container text-on-error-container p-3 rounded-lg mb-6 text-sm border border-error/20">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-label-caps text-on-surface mb-1">Full Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-surface border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface font-body-md outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-label-caps text-on-surface mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-surface border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface font-body-md outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-label-caps text-on-surface mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-surface border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface font-body-md outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-label-caps p-3 rounded-lg transition-colors mt-2 shadow-sm">Sign Up</button>
        </form>
        
        <p className="text-center text-on-surface-variant font-body-md text-sm mt-6">
          Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
