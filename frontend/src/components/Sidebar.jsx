import React from 'react';
import { Shield, FileText, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Collapsed Sidebar (when closed) */}
      {!isOpen && (
        <aside className="w-16 bg-white border-r border-slate-200 flex flex-col h-full items-center py-6 gap-4 relative">
          {/* Open Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="absolute -right-3 top-6 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-10"
            title="Open Sidebar"
          >
            <ChevronRight size={16} />
          </button>

          {/* Collapsed Logo */}
          <div className="text-blue-600">
            <Shield size={28} />
          </div>

          {/* Collapsed Nav Icons */}
          <div className="flex flex-col gap-4 mt-8">
            <button
              onClick={() => setActiveModule('converter')}
              className={`p-3 rounded-lg transition-all ${
                activeModule === 'converter' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
              title="Unstructured to Structured"
            >
              <FileText size={20} />
            </button>

            <button
              onClick={() => setActiveModule('sql_chat')}
              className={`p-3 rounded-lg transition-all ${
                activeModule === 'sql_chat' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
              title="SQL Intelligence"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </aside>
      )}

      {/* Expanded Sidebar (when open) */}
      {isOpen && (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full animate-in slide-in-from-left duration-300 relative">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -right-3 top-6 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-10"
            title="Close Sidebar"
          >
            <ChevronLeft size={16} />
          </button>

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
      )}
    </>
  );
};

export default Sidebar;
