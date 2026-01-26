import React, { useState } from 'react';
import { Toaster } from 'sonner'; // <--- NEW IMPORT
import Sidebar from './components/Sidebar';
import ConverterDashboard from './components/ConverterDashboard';
import SqlChat from './components/SqlChat';

function App() {
  const [activeModule, setActiveModule] = useState('converter');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* --- NEW: Notification System --- */}
      <Toaster position="top-right" richColors closeButton />

      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'p-8' : 'p-4'}`}>
        <div className="max-w-7xl mx-auto h-full flex flex-col">
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
      </main>
    </div>
  );
}

export default App;