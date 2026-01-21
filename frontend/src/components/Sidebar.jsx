import React from 'react';
import { Shield, FileText, MessageSquare } from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Title */}
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-600">
          <Shield size={24} /> CertEx Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">Enterprise Edition</p>
      </div>

      {/* Navigation (Replaces Radio Buttons) */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setActiveModule('converter')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            activeModule === 'converter' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText size={18} />
          Unstructured to Structured
        </button>

        <button
          onClick={() => setActiveModule('sql_chat')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            activeModule === 'sql_chat' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare size={18} />
          SQL Intelligence
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;