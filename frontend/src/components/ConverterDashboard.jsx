import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle, X, Upload, ChevronDown, Download, FileSpreadsheet, Sparkles } from 'lucide-react';
import { API_ROUTES } from '../config';

const ConverterDashboard = () => {
  const [file, setFile] = useState(null);
  const [schema, setSchema] = useState(null); // Stores detected columns
  const [mappings, setMappings] = useState([{ target: '', source: '', rule: 'text' }]); // Form state
  const [loading, setLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Handle download
  const handleDownloadDataset = () => {
    window.location.href = `${API_ROUTES.downloadDataset}?source=converter`;
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleFileUpload = handleFileSelect;

  const processFile = async (uploadedFile) => {
    setFile(uploadedFile);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await axios.post(API_ROUTES.analyzeFile, formData);
      setSchema(res.data);
    } catch (err) {
      console.error('Upload Error Details:', err);
      alert(`Error analyzing file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Form Logic (Dynamic Inputs)
  const addField = () => setMappings([...mappings, { target: '', source: '', rule: 'text' }]);
  
  const removeField = (index) => {
    if (mappings.length > 1) {
      const newMappings = mappings.filter((_, i) => i !== index);
      setMappings(newMappings);
    }
  };

  const updateMapping = (index, field, value) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  // 3. Submit for Processing
  const handleConvert = async () => {
    if (!file) {
      alert('Please upload a file first.');
      return;
    }

    setLoading(true);
    const mappingDict = mappings.reduce((acc, curr) => {
      if (curr.target) acc[curr.target] = { source: curr.source, type: curr.rule };
      return acc;
    }, {});

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mappingDict));

    try {
      const res = await axios.post(API_ROUTES.transformData, formData, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certex_structured_data.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">Structuring Engine</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Deterministic Data Structurer</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload raw datasets, map target columns, and produce validated export-ready data.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <span className="font-semibold">Output:</span> clean CSV with deterministic constraints.
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
          <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <Upload size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-800">Upload source file</p>
              <p className="text-xs text-slate-500">CSV, TSV, XLSX, JSON, JSONL, NDJSON, TXT, Parquet</p>
            </div>
          </label>

          {file && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle size={15} />
              {file.name}
            </div>
          )}
        </div>
      </section>

      {schema && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">Detected Schema Snapshot</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200">
              <FileSpreadsheet size={12} />
              {schema.total_rows || schema.preview.length} rows
            </span>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500">
              <tr>
                <th className="px-4 py-2">Column Name</th>
                <th className="px-4 py-2">Sample Value</th>
              </tr>
            </thead>
            <tbody>
              {schema.preview[0] && Object.keys(schema.preview[0]).map((col) => (
                <tr key={col} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-[12px] text-slate-700">{col}</td>
                  <td className="px-4 py-2 text-slate-500">{schema.preview[0][col]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-slate-200">
            <div
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
            >
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                Preview Dataset Grid
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDataset();
                  }}
                  disabled={!schema}
                  className="inline-flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download full dataset as CSV"
                >
                  <Download size={12} /> Download
                </button>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-300 ${isPreviewOpen ? 'rotate-180 text-blue-600' : ''}`} 
                />
              </div>
            </div>

            {isPreviewOpen && (
              <div className="animate-in slide-in-from-top duration-300">
                <div className="max-h-96 overflow-auto border-t border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                      <tr>
                        {schema.columns.map((col) => (
                          <th key={col} className="px-4 py-3 font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schema.preview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 transition-colors">
                          {schema.columns.map((col) => (
                            <td key={col} className="px-4 py-2 text-slate-600 whitespace-nowrap">
                              {row[col] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-center uppercase tracking-widest font-semibold">
                  Previewing first {schema.preview.length} rows of full dataset.
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {schema && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Output Mapping Rules</h3>
            <button onClick={addField} className="text-cyan-700 text-sm font-semibold hover:underline">Add Column</button>
          </div>

          <div className="space-y-4">
            {mappings.map((row, i) => (
              <div key={i} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Target Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400"
                    placeholder="Official_Email"
                    value={row.target}
                    onChange={(e) => updateMapping(i, 'target', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Map From</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400"
                    value={row.source}
                    onChange={(e) => updateMapping(i, 'source', e.target.value)}
                  >
                    <option value="">Select Column...</option>
                    {schema.columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Constraint</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400"
                    value={row.rule}
                    onChange={(e) => updateMapping(i, 'rule', e.target.value)}
                  >
                    {['text', 'email', 'number', 'date', 'phone', 'currency', 'boolean'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => removeField(i)}
                  disabled={mappings.length === 1}
                  className="p-2 mb-0.5 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove column"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button 
              onClick={handleConvert}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-white font-bold transition-colors hover:bg-slate-800 flex justify-center items-center gap-2 disabled:opacity-60"
            >
              <Sparkles size={16} />
              {loading ? 'Processing...' : 'Convert & Clean Data'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ConverterDashboard;