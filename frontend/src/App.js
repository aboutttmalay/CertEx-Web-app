import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ConverterDashboard from './components/ConverterDashboard';
import SqlChat from './components/SqlChat';
import WorkflowStudio from './components/WorkflowStudio';
import LandingPage from './components/LandingPage';

function App() {
  const [activeModule, setActiveModule] = useState('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  if (activeModule === 'landing') {
    return <LandingPage onStart={() => setActiveModule('converter')} />;
  }

  const moduleMeta = {
    workflow: {
      title: 'Workflow Studio',
      subtitle: 'Observe the CertEx execution graph from ingestion to validated SQL output.',
    },
    converter: {
      title: 'Data Structuring Console',
      subtitle: 'Transform unstructured datasets into deterministic, validated enterprise outputs.',
    },
    sql_chat: {
      title: 'SQL Intelligence',
      subtitle: 'Ask natural-language questions with reflexion-backed SQL generation and execution.',
    },
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      <div className="pointer-events-none absolute -top-32 -left-16 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />

      <Toaster position="top-right" richColors closeButton />

      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className={`relative z-10 flex-1 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'p-6' : 'p-4'}`}>
        <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
          <header className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                  <Sparkles size={12} />
                  CertEx Enterprise
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                  {moduleMeta[activeModule].title}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{moduleMeta[activeModule].subtitle}</p>
              </div>
              <button
                onClick={() => setActiveModule('landing')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back To Landing
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1">
          {activeModule === 'workflow' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <WorkflowStudio />
            </div>
          )}

          {activeModule === 'converter' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ConverterDashboard />
            </div>
          )}

          {activeModule === 'sql_chat' && (
            <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SqlChat />
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;