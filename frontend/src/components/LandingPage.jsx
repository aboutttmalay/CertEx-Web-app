import React from 'react';
import { Shield, Zap, Database, ArrowRight, Github, Lock, Workflow, Server, Terminal } from 'lucide-react';

const LandingPage = ({ onStart }) => {
  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">CertEx</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-blue-600 transition-colors">Architecture</a>
          <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
          <a href="#steps" className="hover:text-blue-600 transition-colors">Steps</a>
          <a href="#how-to-start" className="hover:text-blue-600 transition-colors">How To Start</a>
        </div>
        <button 
          onClick={onStart}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm"
        >
          Open App
        </button>
      </nav>

      {/* Hero Section */}
      <header className="px-8 pt-20 pb-12 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
          Now Available: v1.0 Enterprise Ready
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
          The Air-Gapped <span className="text-blue-600">AI Data Analyst</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Convert enterprise data into structured SQL databases on the fly. 
          Zero data leakage. Self-correcting logic. Fully local.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-200"
          >
            Launch Dashboard <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <a 
            href="https://github.com/aboutttmalay/CertEx-Web-app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center"
          >
            <Github className="mr-2 w-5 h-5" /> GitHub
          </a>
        </div>
      </header>

      {/* Feature Grid */}
      <section id="features" className="px-8 py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Reflexion Engine</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                A recursive loop that catches and fixes SQL errors in real-time. 
                If the AI hallucinate, CertEx corrects it automatically.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Zero Data Leakage</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Run fully locally via Ollama. Ideal for Finance, Healthcare, 
                and Audit sectors requiring air-gapped security.
              </p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Database className="text-emerald-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ghost Factory</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Synthetic data generator for adversarial stress-testing. 
                Fine-tune your local models on your specific data patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="px-8 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-cyan-700 text-xs font-semibold uppercase tracking-[0.18em]">
            <Workflow size={14} />
            Architecture
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Brain - Translator - Hands</h2>
          <p className="mt-3 text-slate-600 max-w-3xl">
            CertEx follows a deterministic architecture: the Brain reasons over schema, the Translator generates SQL with reflexion retries,
            and the Hands execute against an isolated SQLite workspace.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50">
              <h3 className="font-bold text-slate-800">Brain Layer</h3>
              <p className="text-sm text-slate-500 mt-2">Local LLM planning with schema-aware prompts and correction memory.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50">
              <h3 className="font-bold text-slate-800">Translator Layer</h3>
              <p className="text-sm text-slate-500 mt-2">Converts reasoning to executable SQL and retries on runtime errors.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50">
              <h3 className="font-bold text-slate-800">Hands Layer</h3>
              <p className="text-sm text-slate-500 mt-2">Runs SQL on ephemeral SQLite with fast tabular result rendering.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="px-8 py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold uppercase tracking-[0.18em]">
            <Lock size={14} />
            Security
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Security By Default</h2>
          <p className="mt-3 text-slate-300 max-w-3xl">
            Designed for regulated environments with local inference, isolated data paths, and full auditability across each AI interaction.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <Shield className="text-cyan-300 mb-3" size={20} />
              <h3 className="font-semibold">Air-Gapped Ready</h3>
              <p className="text-sm text-slate-400 mt-2">Use Ollama locally with no outbound model calls required.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <Database className="text-cyan-300 mb-3" size={20} />
              <h3 className="font-semibold">Ephemeral Data Plane</h3>
              <p className="text-sm text-slate-400 mt-2">Datasets are ingested into temporary SQLite workspaces only.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <Server className="text-cyan-300 mb-3" size={20} />
              <h3 className="font-semibold">Traceable Decisions</h3>
              <p className="text-sm text-slate-400 mt-2">Reasoning traces and SQL outputs are visible for auditing.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="steps" className="px-8 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">How CertEx Works</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              'Upload enterprise dataset',
              'Auto-structure and enrich metadata',
              'Build SQLite workspace',
              'Ask natural language questions',
              'Run Ghost Factory simulation',
            ].map((step, i) => (
              <div key={step} className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Step {i + 1}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-to-start" className="px-8 py-20 bg-slate-50/70">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-cyan-700 text-xs font-semibold uppercase tracking-[0.18em]">
            <Terminal size={14} />
            How To Start
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Run CertEx In Minutes</h2>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-800">Backend + Model Server</h3>
              <pre className="mt-3 text-xs bg-slate-900 text-emerald-300 p-4 rounded-xl overflow-x-auto">{`cd backend\npip install -r requirements.txt\n\n# In another terminal\nollama serve\nollama pull mistral\n\nuvicorn app.main:app --reload --port 8000`}</pre>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-800">Frontend</h3>
              <pre className="mt-3 text-xs bg-slate-900 text-emerald-300 p-4 rounded-xl overflow-x-auto">{`cd frontend\nnpm install\nnpm start`}</pre>
              <p className="mt-3 text-xs text-slate-500">Optional: set REACT_APP_API_BASE_URL for non-local backend deployments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <footer className="px-8 py-12 text-center text-slate-400 border-t border-slate-100">
        <p className="text-sm font-medium uppercase tracking-widest mb-4">Built for the future of data</p>
        <div className="flex items-center justify-center space-x-2 text-slate-500 font-semibold">
           <span>CertEx Inc.</span>
           <span className="mx-2">|</span>
           <span>MIT Licensed</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;