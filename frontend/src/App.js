import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ConverterDashboard from './components/ConverterDashboard';
import SqlChat from './components/SqlChat';

function App() {
  const [activeModule, setActiveModule] = useState('converter'); // Default to Module 1
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar open by default

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Permanent Sidebar (Replaces st.sidebar) */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeModule === 'converter' && <ConverterDashboard />}
        {activeModule === 'sql_chat' && <SqlChat />}
      </main>
    </div>
  );
}

export default App;