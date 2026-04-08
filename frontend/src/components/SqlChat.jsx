import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Database,
  Send,
  Maximize2,
  Search,
  Trash2,
  ChevronDown,
  Bot,
  BrainCircuit,
  Activity,
  Sparkles,
  FileUp,
  ShieldCheck,
} from 'lucide-react';
import { API_ROUTES } from '../config';

const RESULT_MARKER = '|||RESULT_START|||';
const DEFAULT_SAMPLE_QUESTIONS = [
  'Show the first 10 rows from uploaded_data.',
  'How many total records are in this dataset?',
  'List all columns available in the table.',
  'Which rows have missing values? Show 20 examples.',
  'Group data by Detected_Error_Code and show counts in descending order.',
];

const SqlChat = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [dataReady, setDataReady] = useState(() => localStorage.getItem('db_ready') === 'true');
  const [input, setInput] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    localStorage.setItem('db_ready', dataReady);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, dataReady]);

  const updateMessage = (id, updates) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)));
  };

  const resetSession = () => {
    if (!window.confirm('Reset SQL session and clear all messages?')) {
      return;
    }
    setMessages([]);
    setDataReady(false);
    setSuggestedQuestions([]);
    setSelectedFileName('');
    localStorage.removeItem('chat_history');
    localStorage.removeItem('db_ready');
  };

  const handleIngest = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setIngesting(true);
    const formData = new FormData();
    formData.append('file', file);
    const toastId = toast.loading('Building SQLite workspace from your dataset...');

    try {
      await axios.post(API_ROUTES.ingestSql, formData);
      setDataReady(true);
      setSuggestedQuestions(DEFAULT_SAMPLE_QUESTIONS);
      setMessages([
        {
          id: Date.now(),
          role: 'ai',
          content: 'Ingestion complete. SQL engine is live and ready for analysis.',
          thoughts: 'Schema validated and loaded into uploaded_data.',
          data: [],
          sql: '',
        },
      ]);
      toast.success('Database ready for reasoning.', { id: toastId });
    } catch (error) {
      const apiMessage = error?.response?.data?.detail;
      toast.error(apiMessage || 'Ingestion failed. Please verify file format and retry.', { id: toastId });
    } finally {
      setIngesting(false);
    }
  };

  const runGhostFactory = async () => {
    setSimulating(true);
    const toastId = toast.loading('Running Ghost Factory simulation...');
    try {
      const response = await axios.post(API_ROUTES.runGhostFactory);
      const questions = (response.data.dataset || []).map((item) => item.question).filter(Boolean);
      setSuggestedQuestions(questions);
      toast.success(`Generated ${questions.length} synthetic prompts.`, { id: toastId });
    } catch (error) {
      const apiMessage = error?.response?.data?.detail;
      toast.error(apiMessage || 'Ghost Factory failed.', { id: toastId });
    } finally {
      setSimulating(false);
    }
  };

  const tryParseResult = (rawText) => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return null;
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  };

  const handleSend = async (text = input) => {
    const prompt = text.trim();
    if (!prompt || !dataReady) {
      return;
    }

    const userMessage = { id: Date.now(), role: 'user', content: prompt };
    const aiMessageId = Date.now() + 1;
    const historyForRequest = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content || message.thoughts || '',
    }));

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: aiMessageId,
        role: 'ai',
        content: '',
        thoughts: 'Reflexion engine initializing...',
        data: [],
        sql: '',
      },
    ]);
    setInput('');

    try {
      const response = await fetch(API_ROUTES.askAgent, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, history: historyForRequest }),
      });

      if (!response.ok) {
        let errorMessage = 'Unknown API error.';
        try {
          const payload = await response.json();
          errorMessage = payload?.detail || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        updateMessage(aiMessageId, { content: `Request failed: ${errorMessage}` });
        return;
      }
      if (!response.body) {
        updateMessage(aiMessageId, { content: 'No stream returned by the backend.' });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamText = '';
      let parsedResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        streamText += decoder.decode(value, { stream: true });
        const markerIndex = streamText.indexOf(RESULT_MARKER);

        if (markerIndex === -1) {
          updateMessage(aiMessageId, { thoughts: streamText });
          continue;
        }

        const reasoningPart = streamText.slice(0, markerIndex).trim();
        const resultPart = streamText.slice(markerIndex + RESULT_MARKER.length);
        updateMessage(aiMessageId, { thoughts: reasoningPart });

        const parsed = tryParseResult(resultPart);
        if (!parsed) {
          continue;
        }

        parsedResult = parsed;
        if (parsed.type === 'success') {
          updateMessage(aiMessageId, {
            content: `Query executed successfully. Returned ${parsed.results?.length || 0} rows.`,
            data: parsed.results || [],
            sql: parsed.sql || '',
          });
        } else {
          updateMessage(aiMessageId, { content: `Reflexion error: ${parsed.message || 'Unknown error.'}` });
        }
      }

      if (!parsedResult) {
        updateMessage(aiMessageId, {
          thoughts: streamText,
          content: 'No structured result was returned. See reasoning details for model output.',
        });
      }
    } catch (error) {
      toast.error('Streaming request failed.');
      updateMessage(aiMessageId, { content: `System error: ${error.message}` });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {!isFullScreen && (
        <aside className="w-96 shrink-0 space-y-4 animate-in slide-in-from-left duration-300">
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold tracking-wide text-amber-900 uppercase">SQL Ingestion</h3>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-amber-700 border border-amber-200">
                Air-Gapped
              </span>
            </div>
            <p className="mt-2 text-xs text-amber-800/80 leading-relaxed">
              Upload a dataset to build an ephemeral SQLite table and unlock the reasoning engine.
            </p>

            <label className="mt-4 block rounded-xl border border-dashed border-amber-300 bg-white/80 p-4 hover:bg-white transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileUp size={18} className="text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Select file for SQL ingestion</p>
                  <p className="text-[11px] text-slate-500">CSV, TSV, XLSX, JSON, TXT, Parquet</p>
                </div>
              </div>
              <input
                type="file"
                onChange={handleIngest}
                className="hidden"
                accept=".csv,.tsv,.xls,.xlsx,.json,.jsonl,.ndjson,.txt,.parquet"
              />
            </label>

            {selectedFileName && (
              <p className="mt-3 text-xs text-slate-700">
                Selected: <span className="font-semibold">{selectedFileName}</span>
              </p>
            )}

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Engine Status</span>
                {ingesting ? (
                  <span className="text-amber-700 font-semibold">Ingesting...</span>
                ) : dataReady ? (
                  <span className="text-emerald-700 font-semibold">Online</span>
                ) : (
                  <span className="text-slate-500">Waiting for dataset</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                Local-only processing, no cloud persistence.
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
            <h3 className="text-sm font-bold tracking-wide text-teal-900 uppercase flex items-center gap-2">
              <Bot size={16} className="text-teal-700" />
              Ghost Factory
            </h3>
            <p className="mt-2 text-xs text-teal-800/80">
              Generate adversarial prompts for stress-testing query generation quality.
            </p>
            <button
              onClick={runGhostFactory}
              disabled={!dataReady || simulating}
              className="mt-3 w-full rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                {simulating ? <Bot size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {simulating ? 'Generating scenarios...' : 'Run Ghost Factory'}
              </span>
            </button>
          </section>

          <button
            onClick={resetSession}
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            Reset SQL Session
          </button>
        </aside>
      )}

      <section className="relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setIsFullScreen((prev) => !prev)}
          className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
          title="Toggle full screen"
        >
          <Maximize2 size={16} />
        </button>

        <div className="flex h-full flex-col">
          <header className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Database size={17} className="text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wide">SQL Intelligence Console</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ask analytical questions and inspect reflexion reasoning with deterministic SQL execution.
            </p>
          </header>

          <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_45%)] p-6 space-y-5">
            {!dataReady && messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Activity className="text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">No SQL workspace yet</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Upload a dataset from the ingestion panel to initialize the table and start querying.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={message.id || `${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <article className={`w-full max-w-4xl rounded-2xl ${message.role === 'user' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white'}`}>
                  {message.role === 'user' && <p className="px-5 py-4 text-sm whitespace-pre-wrap">{message.content}</p>}

                  {message.role === 'ai' && (
                    <div>
                      {message.thoughts && (
                        <details className="group border-b border-slate-100" open={false}>
                          <summary className="flex cursor-pointer items-center gap-2 rounded-t-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600 select-none hover:bg-slate-100">
                            <BrainCircuit size={14} className="text-blue-600" />
                            <span className="font-semibold">Reflexion Reasoning Trace</span>
                            <ChevronDown size={14} className="ml-auto transition-transform group-open:rotate-180" />
                          </summary>
                          <pre className="max-h-56 overflow-auto whitespace-pre-wrap bg-slate-900 px-4 py-3 text-[11px] text-emerald-300">{message.thoughts}</pre>
                        </details>
                      )}

                      <div className="px-5 py-4 text-sm text-slate-700">
                        {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}

                        {message.sql && (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Executed SQL</p>
                            <pre className="mt-1 overflow-auto text-xs text-slate-700 whitespace-pre-wrap">{message.sql}</pre>
                          </div>
                        )}

                        {message.data && message.data.length > 0 && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
                              <Search size={14} className="text-slate-400" />
                              <input
                                className="w-full text-xs outline-none"
                                placeholder="Filter result rows..."
                                onChange={(event) => setTableSearch(event.target.value.toLowerCase())}
                              />
                            </div>
                            <div className="max-h-64 overflow-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-slate-100">
                                  <tr>
                                    {Object.keys(message.data[0]).map((key) => (
                                      <th key={key} className="px-3 py-2 font-semibold text-slate-600">
                                        {key}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {message.data
                                    .filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(tableSearch)))
                                    .map((row, rowIndex) => (
                                      <tr key={rowIndex} className="border-b border-slate-100 last:border-b-0">
                                        {Object.values(row).map((value, cellIndex) => (
                                          <td key={cellIndex} className="px-3 py-2 text-slate-700">
                                            {String(value)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4">
            {suggestedQuestions.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Quick Start Prompts
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={`${question}-${index}`}
                    onClick={() => handleSend(question)}
                    className="whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100"
                  >
                    {question}
                  </button>
                ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSend();
                  }
                }}
                disabled={!dataReady}
                placeholder={dataReady ? 'Ask a question about your dataset...' : 'Upload a dataset to begin'}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                onClick={() => handleSend()}
                disabled={!dataReady}
                className="rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default SqlChat;