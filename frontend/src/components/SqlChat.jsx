import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Database, Send, Maximize2, Search, Trash2, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import SkeletonChat from './SkeletonChat';

const SqlChat = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dataReady, setDataReady] = useState(() => {
    return localStorage.getItem('db_ready') === 'true';
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  
  // Pagination
  const [rawData, setRawData] = useState([]);
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);
  const [page, setPage] = useState(0); 
  const [loadingRaw, setLoadingRaw] = useState(false);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    localStorage.setItem('db_ready', dataReady);
  }, [messages, dataReady]);

  const fetchRawData = async (pageNum) => {
    setLoadingRaw(true);
    try {
      const offset = pageNum * 50;
      // We use a regular fetch here, but handle the stream logic briefly to extract data
      const response = await fetch('http://localhost:8000/api/ask-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: `SELECT * FROM uploaded_data LIMIT 50 OFFSET ${offset}`, history: [] })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedJson = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.includes("|||RESULT_START|||")) {
           accumulatedJson += chunk.split("|||RESULT_START|||")[1];
        } else if (accumulatedJson) {
           accumulatedJson += chunk;
        }
      }
      
      if (accumulatedJson) {
        const parsed = JSON.parse(accumulatedJson);
        if (parsed.results) setRawData(parsed.results);
      }
    } catch (e) { 
      console.error(e);
      toast.error("Could not fetch page");
    } finally {
      setLoadingRaw(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 0) return;
    setPage(newPage);
    fetchRawData(newPage);
  };

  const clearChat = () => {
    if (window.confirm("Clear all chat history?")) {
      setMessages([]);
      setDataReady(false);
      setRawData([]);
      setPage(0);
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
    const toastId = toast.loading("Building Database Engine...");

    try {
      await axios.post('http://localhost:8000/api/ingest-sql', formData);
      setDataReady(true);
      setMessages([{ role: 'ai', content: "Database ready! Ask me anything." }]);
      toast.success("Database Ready!", { id: toastId });
      setPage(0);
      fetchRawData(0);
    } catch (err) { 
      toast.error("Ingestion Failed", { id: toastId });
    } finally { 
      setLoading(false); 
    }
  };

  // --- STREAMING SEND ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      setMessages(prev => [...prev, { role: 'ai', content: "", data: [] }]);
      
      const response = await fetch('http://localhost:8000/api/ask-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentInput, history: messages })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let isDataSection = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        if (chunk.includes("|||RESULT_START|||")) {
          const parts = chunk.split("|||RESULT_START|||");
          if (parts[0]) {
            accumulatedText += parts[0];
            updateLastMessage(accumulatedText, null);
          }
          isDataSection = true;
          if (parts[1]) handleJsonData(parts[1]);
          continue;
        }

        if (isDataSection) {
          handleJsonData(chunk);
        } else {
          accumulatedText += chunk;
          updateLastMessage(accumulatedText, null);
        }
      }
    } catch (err) {
      toast.error("Stream Error");
    }
  };

  const updateLastMessage = (text, data) => {
    setMessages(prev => {
      const newHistory = [...prev];
      const lastMsg = newHistory[newHistory.length - 1];
      if (text !== null) lastMsg.content = text;
      if (data !== null) lastMsg.data = data;
      return newHistory;
    });
  };

  const handleJsonData = (jsonChunk) => {
    try {
      const parsed = JSON.parse(jsonChunk);
      if (parsed.type === 'success') {
        updateLastMessage(null, parsed.results); 
      } else if (parsed.type === 'error' || parsed.type === 'sql_error') {
        updateLastMessage(`⚠️ Error: ${parsed.message}`, null);
      }
    } catch (e) { }
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
                <input type="file" onChange={handleIngest} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
              </>
            ) : (
              <div className="space-y-3">
                 <div className="text-xs text-green-600 font-bold bg-green-50 p-2 rounded border border-green-100 text-center">✅ Database Active</div>
                 <button onClick={clearChat} className="w-full py-2 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={14}/> Reset Chat</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <button onClick={() => setIsFullScreen(!isFullScreen)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"><Maximize2 size={18}/></button>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {loading ? (
            <SkeletonChat />
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ask your data..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} disabled={!dataReady}/>
          <button onClick={handleSend} disabled={!dataReady} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"><Send size={20}/></button>
        </div>

        {dataReady && (
          <div className="border-t border-slate-200 bg-white">
             <div onClick={() => setIsRawDataOpen(!isRawDataOpen)} className="flex justify-between items-center px-6 py-3 cursor-pointer hover:bg-slate-50">
               <span className="text-sm font-bold text-slate-700">📊 View Full Dataset (Raw)</span>
               <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRawDataOpen ? 'rotate-180' : ''}`}/>
             </div>
             
             {isRawDataOpen && (
               <div className="border-t border-slate-200">
                 <div className="max-h-60 overflow-y-auto relative min-h-[100px]">
                   {loadingRaw ? <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10"><Loader2 className="animate-spin text-blue-600" /></div> : null}
                   {rawData.length > 0 ? (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 sticky top-0"><tr>{Object.keys(rawData[0]).map(h => <th key={h} className="px-6 py-3 font-bold text-slate-600">{h}</th>)}</tr></thead>
                      <tbody>{rawData.map((r, i) => (<tr key={i} className="hover:bg-blue-50">{Object.values(r).map((v, j) => <td key={j} className="px-6 py-2 text-slate-600">{v}</td>)}</tr>))}</tbody>
                    </table>
                   ) : (<div className="p-6 text-center text-slate-400">No data found</div>)}
                 </div>
                 <div className="p-2 border-t border-slate-200 bg-slate-50 flex justify-between items-center px-6">
                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 0 || loadingRaw} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14}/> Previous</button>
                    <span className="text-xs font-mono text-slate-500">Page {page + 1} • Rows {page * 50 + 1}-{page * 50 + 50}</span>
                    <button onClick={() => handlePageChange(page + 1)} disabled={rawData.length < 50 || loadingRaw} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">Next <ChevronRight size={14}/></button>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlChat;