import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Database, Send, Maximize2, Search, Trash2, 
  ChevronDown, ChevronLeft, ChevronRight, 
  Bot, BrainCircuit, Activity, Sparkles 
} from 'lucide-react';
import SkeletonChat from './SkeletonChat';

const SqlChat = () => {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [dataReady, setDataReady] = useState(() => localStorage.getItem('db_ready') === 'true');
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  
  // Ghost Factory State
  const [simulating, setSimulating] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  // Pagination State
  const [rawData, setRawData] = useState([]);
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);
  const [page, setPage] = useState(0); 
  const [loadingRaw, setLoadingRaw] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    localStorage.setItem('db_ready', dataReady);
    scrollToBottom();
  }, [messages, dataReady]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // --- ACTIONS ---

  const clearChat = () => {
    if (window.confirm("Clear all chat history?")) {
      setMessages([]);
      setDataReady(false);
      setRawData([]);
      setSuggestedQuestions([]);
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
    const toastId = toast.loading("Ingesting & Structuring Data...");

    try {
      await axios.post('http://localhost:8000/api/ingest-sql', formData);
      setDataReady(true);
      setMessages([{ role: 'ai', content: "Database ready! I'm equipped with the Reflexion Engine.", thoughts: "Schema loaded. Waiting for user input." }]);
      toast.success("Database Ready!", { id: toastId });
      fetchRawData(0);
    } catch (err) { 
      toast.error("Ingestion Failed", { id: toastId });
    } finally { 
      setLoading(false); 
    }
  };

  const runGhostFactory = async () => {
    setSimulating(true);
    toast.info("Ghost Factory: Starting Adversarial Simulation...");
    try {
        const res = await axios.post('http://localhost:8000/api/run-ghost-factory');
        const questions = res.data.dataset.map(d => d.question);
        setSuggestedQuestions(questions);
        toast.success(`Simulation Complete. Generated ${questions.length} synthetic scenarios.`);
    } catch (e) {
        toast.error("Ghost Factory failed.");
    } finally {
        setSimulating(false);
    }
  };

  const fetchRawData = async (pageNum) => {
    // (Existing pagination logic...)
    setLoadingRaw(true);
    try {
      const offset = pageNum * 50;
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
        if (chunk.includes("|||RESULT_START|||")) accumulatedJson += chunk.split("|||RESULT_START|||")[1];
      }
      if (accumulatedJson) {
        const parsed = JSON.parse(accumulatedJson);
        if (parsed.results) setRawData(parsed.results);
      }
    } catch (e) { console.error(e); } finally { setLoadingRaw(false); }
  };

  // --- CORE INTELLIGENCE: REFLEXION STREAMING ---
  const handleSend = async (txt = input) => {
    if (!txt.trim()) return;
    
    const userMsg = { role: 'user', content: txt };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // Initial AI Message Placeholder
    const aiMsgId = Date.now();
    setMessages(prev => [...prev, { 
        id: aiMsgId, 
        role: 'ai', 
        content: "", 
        thoughts: "Initializing Reflexion Engine...", // Default thought
        data: [] 
    }]);

    try {
      const response = await fetch('http://localhost:8000/api/ask-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: txt, history: messages })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullBuffer = "";
      let isResultPhase = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullBuffer += chunk;

        // Split Reasoning (Thoughts) vs Result (JSON)
        if (fullBuffer.includes("|||RESULT_START|||")) {
            const parts = fullBuffer.split("|||RESULT_START|||");
            const reasoningText = parts[0]; // Everything before is "Thoughts"
            const resultJson = parts[1];    // Everything after is "Result"
            
            // Update UI with Thoughts
            updateMessage(aiMsgId, { thoughts: reasoningText });
            
            // Process JSON if it's arriving
            if (resultJson) {
                try {
                    // We try to parse the last complete JSON object
                    // Note: In production, you might need a better JSON stream parser
                    const parsed = JSON.parse(resultJson);
                    if (parsed.type === 'success') {
                        updateMessage(aiMsgId, { content: "Analysis Complete.", data: parsed.results });
                    } else if (parsed.type === 'error') {
                        updateMessage(aiMsgId, { content: `⚠️ ${parsed.message}` });
                    }
                } catch (e) {
                    // JSON incomplete, wait for next chunk
                }
            }
        } else {
            // Still thinking/reflecting
            updateMessage(aiMsgId, { thoughts: fullBuffer });
        }
      }
    } catch (err) {
      toast.error("Stream Error");
      updateMessage(aiMsgId, { content: "⚠️ System Error." });
    }
  };

  const updateMessage = (id, updates) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 font-sans">
      
      {/* --- LEFT PANEL: CONTROL CENTER --- */}
      {!isFullScreen && (
        <div className="w-80 flex flex-col gap-4 animate-in slide-in-from-left duration-300">
          
          {/* Data Module */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Database className="text-blue-600" size={18}/> Data Source
            </h3>
            {!dataReady ? (
              <>
                <p className="text-xs text-slate-500 mb-4">Upload CSV to initialize engine.</p>
                <input type="file" onChange={handleIngest} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
              </>
            ) : (
              <div className="space-y-3">
                 <div className="text-xs text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-100 flex items-center justify-center gap-2">
                    <Activity size={14}/> Engine Online
                 </div>
                 <button onClick={clearChat} className="w-full py-2 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50 flex items-center justify-center gap-2">
                    <Trash2 size={14}/> Reset Session
                 </button>
              </div>
            )}
          </div>

          {/* Ghost Factory Module (Now integrated here) */}
          {dataReady && (
            <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm">
                <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <Bot className="text-purple-600" size={18}/> Ghost Factory
                </h3>
                <p className="text-[10px] text-purple-700/70 mb-3 leading-tight">
                    Run adversarial simulation to generate synthetic training data and warm up the cache.
                </p>
                <button 
                    onClick={runGhostFactory} 
                    disabled={simulating}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {simulating ? <Bot className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                    {simulating ? "Simulating..." : "Run Simulation"}
                </button>
            </div>
          )}

        </div>
      )}

      {/* --- RIGHT PANEL: CHAT INTERFACE --- */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <button onClick={() => setIsFullScreen(!isFullScreen)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 z-10"><Maximize2 size={18}/></button>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {!dataReady && !messages.length && (
               <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <Database size={64} className="mb-4 text-slate-300" />
                  <p className="text-slate-400">Waiting for data...</p>
               </div>
            )}

            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-4xl rounded-2xl p-1 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`}>
                    
                    {/* User Message */}
                    {m.role === 'user' && <div className="p-4">{m.content}</div>}

                    {/* AI Message with Reflexion */}
                    {m.role === 'ai' && (
                        <div className="flex flex-col">
                            {/* Reasoning Accordion */}
                            {m.thoughts && (
                                <details className="group border-b border-slate-100">
                                    <summary className="cursor-pointer p-3 bg-slate-50/50 hover:bg-slate-100 text-xs text-slate-500 font-mono flex items-center gap-2 select-none rounded-t-2xl">
                                        <BrainCircuit size={14} className="text-purple-500"/>
                                        <span className="font-semibold text-purple-700">Reflexion Engine</span>
                                        <span className="opacity-50">Click to view reasoning</span>
                                        <ChevronDown size={14} className="ml-auto transform group-open:rotate-180 transition-transform"/>
                                    </summary>
                                    <div className="p-4 bg-slate-900 text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap rounded-b-lg">
                                        {m.thoughts}
                                    </div>
                                </details>
                            )}

                            {/* Final Content */}
                            <div className="p-5">
                                {m.content && <p className="mb-3 font-medium text-slate-800 whitespace-pre-wrap">{m.content}</p>}
                                
                                {/* Data Table */}
                                {m.data && m.data.length > 0 && (
                                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mt-3">
                                        <div className="p-2 bg-white border-b border-slate-200 flex gap-2">
                                            <Search size={14} className="text-slate-400"/>
                                            <input className="text-xs outline-none w-full" placeholder="Filter results..." onChange={(e) => setTableSearch(e.target.value.toLowerCase())}/>
                                        </div>
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
                    )}
                  </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
           {/* Suggested Questions Chips */}
           {suggestedQuestions.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                  {suggestedQuestions.map((q, i) => (
                      <button key={i} onClick={() => handleSend(q)} className="whitespace-nowrap px-3 py-1 bg-purple-50 text-purple-600 text-xs rounded-full border border-purple-100 hover:bg-purple-100 transition-colors">
                          ✨ {q}
                      </button>
                  ))}
              </div>
           )}

           <div className="flex gap-3">
              <input 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                placeholder={dataReady ? "Ask your data..." : "Upload a file first..."} 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                disabled={!dataReady}
              />
              <button onClick={() => handleSend()} disabled={!dataReady} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-transform active:scale-95">
                <Send size={20}/>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SqlChat;