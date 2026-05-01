import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ← add this
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate(); // ← add this

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('loading');
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      setLoading(false); // ← move this inside if/else
    } else {
      setStatus('success');
      navigate('/predict', { replace: true }); // ← add this
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-[280px] text-center">
        <h1 className="text-white text-[22px] font-bold tracking-[0.05em] uppercase mb-1">NORI</h1>
        <p className="text-[#666] text-[12px] tracking-[0.1em] uppercase mb-10">Aquaculture Digital Twin</p>

        <form onSubmit={handleLogin} className="space-y-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-[280px] bg-[#111] border-[0.5px] border-white/15 text-[#e8e8e6] font-mono text-[13px] px-[14px] py-[10px] rounded-[4px] focus:border-[#1dce8a]/50 focus:outline-none transition-all placeholder:text-[#444]"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-[280px] bg-[#111] border-[0.5px] border-white/15 text-[#e8e8e6] font-mono text-[13px] px-[14px] py-[10px] rounded-[4px] focus:border-[#1dce8a]/50 focus:outline-none transition-all placeholder:text-[#444]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-[280px] bg-transparent border-[0.5px] border-[#1dce8a] text-[#1dce8a] font-mono text-[13px] px-[14px] py-[10px] rounded-[4px] cursor-pointer hover:bg-[#1dce8a]/5 disabled:opacity-60 transition-all"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {status === 'error' && (
            <p className="text-[#e24b4a] text-[11px] mt-2 animate-in fade-in duration-300">
              {errorMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}