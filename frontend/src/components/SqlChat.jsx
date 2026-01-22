import React, { useState } from 'react';
import axios from 'axios';
import { Database, Send, Maximize2, Minimize2, Search, Filter, ChevronDown } from 'lucide-react';

const SqlChat = () => {
  const [dataReady, setDataReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // UI States
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar toggle state

  // --- NEW: Raw Data Preview States ---
  const [rawData, setRawData] = useState([]);
  const [isRawDataOpen, setIsRawDataOpen] = useState(false);
  const [rawDataLoading, setRawDataLoading] = useState(false);

  const handleIngest = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      // 1. Upload & Build Database
      await axios.post('http://localhost:8000/api/ingest-sql', formData);
      setDataReady(true);
      setMessages([{ role: 'ai', content: "Database ready! Ask me anything." }]);

      // 2. Fetch ALL Raw Data (No LIMIT)
      setRawDataLoading(true);
      try {
        const rawRes = await axios.post('http://localhost:8000/api/ask-agent', { 
          question: "SELECT * FROM uploaded_data LIMIT 10" // Only first 10 rows for preview
        });
        
        console.log("Raw data response:", rawRes.data);
        
        if (rawRes.data && rawRes.data.results && rawRes.data.results.length > 0) {
          setRawData(rawRes.data.results);
          setIsRawDataOpen(true); // Auto-open on load
          console.log("✅ Raw data loaded:", rawRes.data.results.length, "rows"); 
        } else {
          console.warn("No data in response:", rawRes.data);
        }
      } catch (previewErr) {
        console.error("❌ Failed to load preview data:", previewErr);
      } finally {
        setRawDataLoading(false);
      }

    } catch (err) { 
      alert("Ingestion Failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Handle download
  const handleDownloadDataset = () => {
    window.location.href = 'http://localhost:8000/api/download-dataset?source=sql';
  };
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);
    setInput("");
    
    try {
      const res = await axios.post('http://localhost:8000/api/ask-agent', { question: input });
      
      let aiContent = "";
      let aiData = [];

      // Handle the different response types from the backend
      if (res.data.type === 'error') {
        // Case 1: The AI Agent failed (e.g., API Key issue)
        aiContent = `⚠️ AI Agent Error: ${res.data.message}`;
      } else if (res.data.type === 'sql_error') {
        // Case 2: The SQL was generated but failed to run
        aiContent = `❌ SQL Execution Error: ${res.data.message}\n\nQuery: ${res.data.sql}`;
      } else {
        // Case 3: Success!
        aiContent = `Executed SQL: ${res.data.sql}`;
        aiData = res.data.results;
      }
      
      const aiMsg = { 
        role: 'ai', 
        content: aiContent,
        data: aiData 
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "⚠️ Network or Server Error. Check console logs." }]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 relative">
      
      {/* 1. Ingestion Panel (Collapsible) */}
      {isSidebarOpen && !isFullScreen && (
        <div className="w-80 flex flex-col gap-4 animate-in slide-in-from-left duration-300 relative">
          {/* Close Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute -right-3 top-4 z-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
            title="Close Sidebar"
          >
            <span className="text-xs font-bold">&lt;&lt;</span>
          </button>

          {/* Dataset Preview Panel */}
          {dataReady && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header / Clickable Toggle */}
              <div 
                onClick={() => rawData.length > 0 && setIsRawDataOpen(!isRawDataOpen)}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
              >
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                  📊 Dataset Preview
                  {rawDataLoading && <span className="text-xs text-blue-600 animate-pulse ml-1">⏳</span>}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform duration-300 ${isRawDataOpen ? 'rotate-180 text-blue-600' : ''}`} 
                />
              </div>

              {/* Collapsible Body */}
              {isRawDataOpen && rawData.length > 0 && (
                <div className="animate-in slide-in-from-top duration-300">
                  <div className="max-h-96 overflow-auto border-t border-slate-200">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>
                          {Object.keys(rawData[0]).map((header) => (
                            <th key={header} className="px-2 py-2 font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 bg-slate-100 text-[9px]">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rawData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50 transition-colors">
                            {Object.values(row).map((val, vIdx) => (
                              <td key={vIdx} className="px-2 py-1.5 text-slate-600 whitespace-nowrap">
                                {val || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer status */}
                  <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-400 text-center uppercase tracking-widest font-semibold">
                    {rawData.length} Rows Total
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Chat Interface (Expandable) */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-300">
        
        {/* Chat Header Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)} 
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            title={isFullScreen ? "Minimize View" : "Maximize View"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {!dataReady && !messages.length && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Database size={64} className="mb-4 opacity-20" />
              <p className="text-sm mb-4">Upload a file to start the conversation</p>
              
              {/* Upload Button in Center */}
              <label htmlFor="file-upload-center" className="cursor-pointer">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:scale-105 flex items-center gap-2">
                  <Database size={20} />
                  <span className="font-bold">Upload CSV File</span>
                </div>
              </label>
              <input 
                id="file-upload-center" 
                type="file" 
                onChange={handleIngest} 
                className="hidden"
                accept=".csv,.xlsx,.xls"
              />
              {loading && <div className="mt-4 text-sm text-blue-600 font-bold animate-pulse">⚙️ Building Database...</div>}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl p-5 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                <p className="mb-3 font-medium whitespace-pre-wrap">{m.content}</p>
                
                {/* Data Table with Search Options */}
                {m.data && m.data.length > 0 && (
                  <div className="mt-4 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    {/* Search Bar for Table */}
                    <div className="p-2 border-b border-slate-200 flex items-center gap-2 bg-white">
                      <Search size={14} className="text-slate-400"/>
                      <input 
                        className="text-xs w-full outline-none text-slate-700 placeholder:text-slate-400"
                        placeholder="Search/Filter results..." 
                        onChange={(e) => setTableSearch(e.target.value.toLowerCase())}
                      />
                      <Filter size={14} className="text-slate-400"/>
                    </div>

                    {/* Scrollable Table */}
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>{Object.keys(m.data[0]).map(k => <th key={k} className="p-3 font-semibold text-slate-600">{k}</th>)}</tr>
                        </thead>
                        <tbody>
                          {m.data
                            .filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(tableSearch))) // Search Logic
                            .map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                                {Object.values(row).map((val, vIdx) => <td key={vIdx} className="p-3 text-slate-600">{val}</td>)}
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
            placeholder="Ask your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!dataReady}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!dataReady}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>

        {/* --- NEW: Raw Data Preview Expander --- */}
        {dataReady && (
          <div className="border-t border-slate-200 bg-white shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] z-20">
            {/* Header / Clickable Toggle */}
            <div 
              onClick={() => setIsRawDataOpen(!isRawDataOpen)}
              className="flex items-center justify-between px-6 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
            >
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                📊 View Full Dataset
                {rawDataLoading && <span className="text-xs text-blue-600 animate-pulse ml-1">(Loading...)</span>}
                {!rawDataLoading && rawData.length > 0 && <span className="text-xs text-green-600 ml-1">(Preview: {rawData.length} rows)</span>}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDataset();
                  }}
                  disabled={rawData.length === 0}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download full dataset as CSV"
                >
                  ⬇️ Download
                </button>
                <ChevronDown 
                  size={18} 
                  className={`text-slate-400 transition-transform duration-300 ${isRawDataOpen ? 'rotate-180 text-blue-600' : ''}`} 
                />
              </div>
            </div>

            {/* Collapsible Body */}
            {isRawDataOpen && rawData.length > 0 && (
              <div className="animate-in slide-in-from-bottom duration-300">
                <div className="max-h-96 overflow-auto border-t border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                      <tr>
                        {Object.keys(rawData[0]).map((header) => (
                          <th key={header} className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 bg-slate-100">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 transition-colors">
                          {Object.values(row).map((val, vIdx) => (
                            <td key={vIdx} className="px-4 py-2 text-slate-600">
                              {val || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Footer status */}
                <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-center uppercase tracking-widest font-semibold">
                  ℹ️ Preview: First {rawData.length} rows of full dataset • Click Download to get all data
                </div>
              </div>
            )}

            {/* Empty State when data is loading or no data */}
            {isRawDataOpen && rawData.length === 0 && (
              <div className="p-6 border-t border-slate-200 text-center text-slate-400">
                <div className="animate-pulse">Loading dataset preview...</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlChat;