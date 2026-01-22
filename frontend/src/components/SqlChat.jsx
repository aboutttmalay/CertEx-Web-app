import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Send, Maximize2, Search, Trash2, ChevronDown } from 'lucide-react';

const SqlChat = () => {
  // --- Task 1.2: Initialize State from LocalStorage ---
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dataReady, setDataReady] = useState(() => {
    return localStorage.getItem('db_ready') === 'true';
  });

  // UI States
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  
  // Raw Data Preview States
  const [rawData, setRawData] = useState([]);
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);

  // --- Task 1.2: Save to LocalStorage on Change ---
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    localStorage.setItem('db_ready', dataReady);
  }, [messages, dataReady]);

  // Helper to Clear History
  const clearChat = () => {
    if (window.confirm("Clear all chat history?")) {
      setMessages([]);
      setDataReady(false);
      localStorage.removeItem('chat_history');
      localStorage.removeItem('db_ready');
      window.location.reload(); 
    }
  };

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

      // Silently fetch preview
      try {
        const rawRes = await axios.post('http://localhost:8000/api/ask-agent', { 
          question: "SELECT * FROM uploaded_data LIMIT 50", history: [] 
        });
        if (rawRes.data.results) setRawData(rawRes.data.results);
      } catch (e) { console.error("Preview error", e); }

    } catch (err) { alert("Ingestion Failed"); } 
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    
    try {
      // --- Task 1.1: Send History for Context ---
      const res = await axios.post('http://localhost:8000/api/ask-agent', { 
        question: input,
        history: messages 
      });
      
      let aiContent = "";
      let aiData = [];

      if (res.data.type === 'error' || res.data.type === 'sql_error') {
        aiContent = `⚠️ Error: ${res.data.message}`;
        if (res.data.sql) aiContent += `\n\nQuery: ${res.data.sql}`;
      } else {
        aiContent = `Executed SQL: ${res.data.sql}`;
        aiData = res.data.results;
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: aiContent, data: aiData }]);

    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "⚠️ Network Error." }]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {!isFullScreen && (
        <div className="w-80 flex flex-col gap-4 animate-in slide-in-from-left duration-300">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Database className="text-blue-600"/> Data Ingestion
            </h3>
            
            {!dataReady ? (
              <>
                <p className="text-xs text-slate-500 mb-4">Upload CSV to initialize.</p>
                <input type="file" onChange={handleIngest} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700"/>
              </>
            ) : (
              <div className="space-y-3">
                 <div className="text-xs text-green-600 font-bold bg-green-50 p-2 rounded border border-green-100 text-center">✅ Database Active</div>
                 <button onClick={clearChat} className="w-full py-2 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={14}/> Reset Chat</button>
              </div>
            )}
            {loading && <div className="mt-4 text-xs text-blue-600 font-bold animate-pulse">⚙️ Building Database...</div>}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <button onClick={() => setIsFullScreen(!isFullScreen)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"><Maximize2 size={18}/></button>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {!dataReady && !messages.length && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Database size={64} className="mb-4 opacity-20" />
              <p>Upload a file to start</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl p-5 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                <p className="mb-3 font-medium whitespace-pre-wrap">{m.content}</p>
                {m.data && m.data.length > 0 && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mt-3">
                    <div className="p-2 bg-white border-b border-slate-200 flex gap-2"><Search size={14} className="text-slate-400"/><input className="text-xs outline-none w-full" placeholder="Filter..." onChange={(e) => setTableSearch(e.target.value.toLowerCase())}/></div>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 sticky top-0"><tr>{Object.keys(m.data[0]).map(k => <th key={k} className="p-3 font-semibold text-slate-600">{k}</th>)}</tr></thead>
                        <tbody>{m.data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(tableSearch))).map((r, idx) => <tr key={idx} className="border-b bg-white">{Object.values(r).map((v, j) => <td key={j} className="p-3 text-slate-600">{v}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ask your data..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} disabled={!dataReady}/>
          <button onClick={handleSend} disabled={!dataReady} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"><Send size={20}/></button>
        </div>

        {dataReady && rawData.length > 0 && (
          <div className="border-t border-slate-200 bg-white">
             <div onClick={() => setIsRawDataOpen(!isRawDataOpen)} className="flex justify-between items-center px-6 py-3 cursor-pointer hover:bg-slate-50">
               <span className="text-sm font-bold text-slate-700">📊 View Full Dataset (Raw)</span>
               <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRawDataOpen ? 'rotate-180' : ''}`}/>
             </div>
             {isRawDataOpen && <div className="max-h-60 overflow-y-auto border-t border-slate-200"><table className="w-full text-xs text-left"><thead className="bg-slate-100 sticky top-0"><tr>{Object.keys(rawData[0]).map(h => <th key={h} className="px-6 py-3 font-bold text-slate-600">{h}</th>)}</tr></thead><tbody>{rawData.map((r, i) => <tr key={i} className="hover:bg-blue-50">{Object.values(r).map((v, j) => <td key={j} className="px-6 py-2 text-slate-600">{v}</td>)}</tr>)}</tbody></table></div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlChat;
