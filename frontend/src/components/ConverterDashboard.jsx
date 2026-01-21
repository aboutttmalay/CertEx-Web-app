import React, { useState } from 'react';
import axios from 'axios'; // You need to install axios
import { CheckCircle, X } from 'lucide-react';
import { Upload } from 'lucide-react';

const ConverterDashboard = () => {
  const [file, setFile] = useState(null);
  const [schema, setSchema] = useState(null); // Stores detected columns
  const [mappings, setMappings] = useState([{ target: '', source: '', rule: 'text' }]); // Form state
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Handle File Upload
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      // Calls FastAPI endpoint
      const res = await axios.post('http://localhost:8000/api/analyze-file', formData);
      setSchema(res.data); // Expects { columns: [], preview: [] }
    } catch (err) {
     console.error("Upload Error Details:", err); 
      
      // Update alert to show more info if possible
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
      setResults("Success");
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
      <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center mb-8">
        <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <Upload className="text-blue-500 mb-2" size={32} />
          <span className="text-sm font-medium text-slate-700">Click to upload Raw Data (CSV/Excel)</span>
        </label>
        {file && <div className="mt-2 text-sm text-green-600 font-bold flex items-center justify-center gap-1"><CheckCircle size={14}/> {file.name}</div>}
      </div>

      {/* Step 2: Detected Schema Table (Replaces st.dataframe) */}
      {schema && (
        <div className="mb-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
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