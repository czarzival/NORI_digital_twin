import React, { useState } from 'react';
import PredictPanel from './components/PredictPanel';
import SimulatorPanel from './components/SimulatorPanel';
import BatchUpload from './components/BatchUpload';
import AboutSection from './components/AboutSection';

function App() {
  const [activeTab, setActiveTab] = useState('predict');

  return (
    <div className="min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-black">
      <header className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-8 py-8 flex flex-col md:flex-row items-baseline justify-between">
          <div className="mb-6 md:mb-0">
            <h1 className="text-xl font-medium tracking-tight text-primary">
              NORI
            </h1>
            <p className="text-sm text-secondary tracking-wide mt-1">
              Aquaculture Digital Twin
            </p>
          </div>
          
          <nav className="flex space-x-8 text-sm">
            {['predict', 'simulate', 'batch', 'about'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize transition-opacity duration-150 ${
                  activeTab === tab ? 'text-primary font-medium' : 'text-secondary hover:opacity-70'
                }`}
              >
                {tab === 'batch' ? 'Batch Upload' : tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        {activeTab === 'predict' && <PredictPanel />}
        {activeTab === 'simulate' && <SimulatorPanel />}
        {activeTab === 'batch' && <BatchUpload />}
        {activeTab === 'about' && <AboutSection />}
      </main>

      <footer className="max-w-5xl mx-auto px-8 py-8 mt-16">
        <p className="text-sm text-secondary">
          NORI
        </p>
      </footer>
    </div>
  );
}

export default App;
