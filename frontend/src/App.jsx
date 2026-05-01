import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import PredictPanel from './components/PredictPanel';
import SimulatorPanel from './components/SimulatorPanel';
import BatchUpload from './components/BatchUpload';
import AboutSection from './components/AboutSection';
import CyclePlannerPanel from './components/CyclePlannerPanel';
import HistoryPage from './components/HistoryPage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';

function App() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [currentParams, setCurrentParams] = useState(null);
  const [currentYield, setCurrentYield] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleParamsChange = (params, yieldVal) => {
    setCurrentParams(params);
    setCurrentYield(yieldVal);
  };

  const navItems = [
    { path: '/predict', label: 'Predict' },
    { path: '/simulate', label: 'Simulate' },
    { path: '/planner', label: 'Cycle Planner' },
    { path: '/history', label: 'History' },
    { path: '/batch', label: 'Batch Upload' },
    { path: '/about', label: 'About' },
  ];

  const isActive = (path) => location.pathname === path;

  // Don't show header/footer on login or callback
  const isAuthPage = location.pathname === '/login' || location.pathname === '/auth/callback';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary font-mono selection:bg-accent selection:text-black flex flex-col">
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-baseline space-x-3">
            <Link to="/predict" className="text-lg font-bold tracking-tighter text-primary hover:opacity-80 transition-opacity">
              NORI<span className="text-accent">_</span>
            </Link>
            <p className="hidden sm:block text-[10px] text-secondary tracking-widest uppercase">
              Digital Twin v2.0
            </p>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-10 text-[11px] uppercase tracking-widest">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-all duration-200 pb-1 border-b-2 ${
                  isActive(item.path)
                    ? 'text-primary border-accent' 
                    : 'text-secondary border-transparent hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Sign Out */}
          <div className="hidden lg:flex items-center space-x-4 border-l border-border pl-6 ml-6">
            <span className="text-[#666] text-[11px] font-mono">
              {user?.email?.length > 20 ? user.email.substring(0, 17) + '...' : user?.email}
            </span>
            <button 
              onClick={signOut}
              className="text-[#444] hover:text-[#888] text-[11px] transition-colors flex items-center gap-1.5"
            >
              Sign out
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="lg:hidden text-primary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <nav className="lg:hidden border-t border-border bg-surface px-8 py-6 flex flex-col space-y-4 animate-in slide-in-from-top duration-200">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`text-left text-sm uppercase tracking-widest ${
                  isActive(item.path) ? 'text-accent' : 'text-secondary'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border flex justify-between items-center">
              <span className="text-[#666] text-[10px]">{user?.email}</span>
              <button onClick={signOut} className="text-accent text-[10px] uppercase tracking-widest">Sign out</button>
            </div>
          </nav>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12 flex-1 w-full">
        <Routes>
          <Route path="/" element={<ProtectedRoute><PredictPanel currentParams={currentParams} onParamsChange={handleParamsChange} /></ProtectedRoute>} />
          <Route path="/predict" element={<ProtectedRoute><PredictPanel currentParams={currentParams} onParamsChange={handleParamsChange} /></ProtectedRoute>} />
          <Route path="/simulate" element={<ProtectedRoute><SimulatorPanel /></ProtectedRoute>} />
          <Route path="/planner" element={<ProtectedRoute><CyclePlannerPanel currentYield={currentYield} /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/batch" element={<ProtectedRoute><BatchUpload /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><AboutSection /></ProtectedRoute>} />
        </Routes>
      </main>

      <footer className="max-w-6xl mx-auto px-8 py-12 border-t border-border mt-20 flex flex-col md:flex-row justify-between items-center text-[10px] text-secondary uppercase tracking-[0.2em] w-full">
        <p>© 2026 NORI Aquaculture Systems</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <span>Confidential</span>
          <span>Internal Use Only</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
