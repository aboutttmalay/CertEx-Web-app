import React, { useState, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, X, UploadCloud, File, ChevronDown, Loader2 } from 'lucide-react';

const ConverterDashboard = () => {
  const [file, setFile] = useState(null);
  const [schema, setSchema] = useState(null); // Stores detected columns
  const [mappings, setMappings] = useState([{ target: '', source: '', rule: 'text' }]); // Form state
  const [loading, setLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Handle download
  const handleDownloadDataset = () => {
    window.location.href = 'http://localhost:8000/api/download-dataset?source=converter';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (uploadedFile) => {
    setFile(uploadedFile);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await axios.post('http://localhost:8000/api/analyze-file', formData);
      setSchema(res.data);
    } catch (err) {
      console.error("Upload Error Details:", err);
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
    setLoading(true);
    const mappingDict = mappings.reduce((acc, curr) => {
      if (curr.target) acc[curr.target] = { source: curr.source, type: curr.rule };
      return acc;
    }, {});

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mappingDict));

    try {
      // Using 'blob' to handle CSV file download response
      const res = await axios.post('http://localhost:8000/api/transform-data', formData, { responseType: 'blob' });
      
      // Create download link virtually
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certex_structured_data.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">📄 Deterministic Data Structurer</h2>
      <p className="text-slate-500 mb-8">Transform messy files into strict, validated formats.</p>

      {/* Step 1: Upload */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`relative overflow-hidden bg-white p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer group mb-8 flex flex-col items-center justify-center min-h-[200px]
          ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept=".csv,.xlsx,.xls,.json,.xml,.pdf,.txt" 
        />
        
        {loading ? (
          <div className="flex flex-col items-center animate-in fade-in duration-300">
            <Loader2 className="text-blue-500 mb-4 animate-spin" size={40} />
            <span className="text-sm font-semibold text-slate-700">Analyzing schema...</span>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <CheckCircle className="text-green-600" size={32}/>
            </div>
            <span className="text-sm font-bold text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-500 mt-1">Click or drag to replace</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="text-blue-600" size={36} />
            </div>
            <span className="text-base font-bold text-slate-700 mb-1">Upload unstructured data</span>
            <span className="text-sm text-slate-500 text-center max-w-xs">
              Drag and drop your files here, or click to browse. Supports CSV, Excel, JSON, XML, PDF, and TXT.
            </span>
          </div>
        )}
      </div>

      {/* Step 2: Detected Schema Table (Replaces st.dataframe) */}
      {schema && (
        <div className="mb-8 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-medium text-sm text-slate-700">
            ℹ️ 1. Detected Schema
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
                  <td className="px-4 py-2 font-mono text-slate-700">{col}</td>
                  <td className="px-4 py-2 text-slate-500">{schema.preview[0][col]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Raw Data Preview Expander */}
          <div className="border-t border-slate-200">
            {/* Toggle Header */}
            <div 
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group select-none"
            >
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                📊 View Full Dataset
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDataset();
                  }}
                  disabled={!schema}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download full dataset as CSV"
                >
                  ⬇️ Download
                </button>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform duration-300 ${isPreviewOpen ? 'rotate-180 text-blue-600' : ''}`} 
                />
              </div>
            </div>

            {/* Collapsible Body */}
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
                  ℹ️ Preview: First {schema.preview.length} rows of full dataset • Click Download to get all data
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Define Output Requirements (Replaces st.form) */}
      {schema && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">2. Define Output Requirements</h3>
            <button onClick={addField} className="text-blue-600 text-sm font-medium hover:underline">+ Add Column</button>
          </div>

          <div className="space-y-4">
            {mappings.map((row, i) => (
              <div key={i} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Target Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm"
                    placeholder="e.g. Official_Email"
                    value={row.target}
                    onChange={(e) => updateMapping(i, 'target', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Map From</label>
                  <select 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white"
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
                    className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white"
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
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? "Processing..." : "🚀 Convert & Clean Data"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConverterDashboard;