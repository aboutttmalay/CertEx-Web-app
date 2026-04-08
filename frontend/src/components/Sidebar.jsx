import React from 'react';
import {
  Shield,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Radar,
  CircleDot,
} from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule, isOpen, setIsOpen }) => {
  const navItems = [
    { id: 'workflow', label: 'Workflow Studio', icon: Workflow },
    { id: 'converter', label: 'Structuring Console', icon: FileText },
    { id: 'sql_chat', label: 'SQL Intelligence', icon: MessageSquare },
  ];

  return (
    <>
      {!isOpen && (
        <aside className="relative flex h-full w-20 flex-col items-center gap-5 border-r border-slate-200 bg-slate-950/95 py-6 text-slate-200">
          <button
            onClick={() => setIsOpen(true)}
            className="absolute -right-3 top-6 rounded-full bg-cyan-500 p-1.5 text-white shadow-lg transition-transform hover:scale-110 hover:bg-cyan-400 z-10"
            title="Open Sidebar"
          >
            <ChevronRight size={16} />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30">
            <Shield size={26} />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`rounded-xl p-3 transition-all ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                  title={item.label}
                >
                  <Icon size={19} />
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-full bg-emerald-500/20 p-2 text-emerald-300 ring-1 ring-emerald-400/30">
            <CircleDot size={12} />
          </div>
        </aside>
      )}

      {isOpen && (
        <aside className="relative flex h-full w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-200 animate-in slide-in-from-left duration-300">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -right-3 top-6 rounded-full bg-cyan-500 p-1.5 text-white shadow-lg transition-transform hover:scale-110 hover:bg-cyan-400 z-10"
            title="Close Sidebar"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="border-b border-slate-800 p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Control Layer</p>
            <h1 className="mt-3 flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <Shield size={24} className="text-cyan-300" />
              CertEx Engine
            </h1>
            <p className="mt-1 text-xs text-slate-400">Enterprise Operations Console</p>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left transition-all ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/35'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <Icon size={18} />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <div className="rounded-xl bg-slate-900/80 p-4 ring-1 ring-slate-700">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Runtime Status</p>
              <div className="mt-3 flex items-center gap-2 text-emerald-300">
                <Radar size={15} />
                <span className="text-xs font-semibold">Engine Monitoring Active</span>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default Sidebar;
