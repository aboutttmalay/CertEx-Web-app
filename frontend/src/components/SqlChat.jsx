import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';
import { Send } from 'lucide-react';
import { Database } from 'lucide-react';
// Note: For charts, you'd typically use 'recharts' or 'chart.js' in React

const SqlChat = () => {
  const [dataReady, setDataReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Ingestion Logic
  const handleIngest = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/ingest-sql', formData);
      setDataReady(true);
      setMessages([{ role: 'ai', content: "Database ready! Ask me anything." }]);
    } catch (err) {
      alert("Ingestion Failed");
    } finally {
      setLoading(false);
    }
  };

  // 2. Chat Logic
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);
    setInput("");
    
    try {
      const res = await axios.post('http://localhost:8000/api/ask-agent', { question: input });
      // Expecting { results: [...], sql: "SELECT..." } from API
      
      const aiMsg = { 
        role: 'ai', 
        content: `Executed SQL: ${res.data.sql}`,
        data: res.data.results // Array of objects
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Error executing query." }]);
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Right Panel: Chat Interface (Replaces Main Area) */}
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {!dataReady && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Database size={48} className="mb-4 opacity-50" />
              <p>Upload a file to start the SQL Agent</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl p-4 rounded-lg shadow-sm ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'
              }`}>
                <p className="mb-2">{m.content}</p>
                {/* Render Table if Data Exists */}
                {m.data && m.data.length > 0 && (
                  <div className="bg-slate-50 rounded p-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(m.data[0]).map(k => <th key={k} className="p-1">{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {m.data.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            {Object.values(row).map((val, vIdx) => <td key={vIdx} className="p-1">{val}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {m.data.length > 5 && <p className="text-xs text-slate-400 mt-1 italic">Showing top 5 rows...</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
          <input 
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ask your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!dataReady}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!dataReady}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Left Panel: Ingestion (Replaces Sidebar upload) */}
      <div className="w-72 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">📂 Data Ingestion</h3>
          <p className="text-xs text-slate-500 mb-4">Upload a CSV to build the temporary SQL database.</p>
          
          <input type="file" onChange={handleIngest} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          
          {loading && <div className="mt-4 text-xs text-blue-600 font-bold animate-pulse">⚙️ Building Database...</div>}
          {dataReady && <div className="mt-4 text-xs text-green-600 font-bold">✅ Database Ready</div>}
        </div>

        {dataReady && (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="font-bold text-blue-800 text-sm mb-2">💡 Suggestions</h4>
            <div className="space-y-2">
              <button onClick={() => setInput("Show top 5 rows")} className="block w-full text-left text-xs bg-white p-2 rounded text-blue-600 border border-blue-100 hover:border-blue-300">Show top 5 rows</button>
              <button onClick={() => setInput("Count total records")} className="block w-full text-left text-xs bg-white p-2 rounded text-blue-600 border border-blue-100 hover:border-blue-300">Count total records</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlChat;