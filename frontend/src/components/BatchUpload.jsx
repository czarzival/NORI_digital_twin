import React, { useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function BatchUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files[0] || e.target.files[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
      parsePreview(dropped);
    }
  };

  const parsePreview = (f) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const headers = lines[0].split(',');
      const rows = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, h, i) => {
          obj[h.trim()] = values[i];
          return obj;
        }, {});
      });
      setPreview({ headers, rows });
    };
    reader.readAsText(f);
  };

  const handleRunBatch = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post(`${API_URL}/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Batch prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    const items = results.predictions;
    const replacer = (key, value) => value === null ? '' : value;
    const header = Object.keys(items[0]);
    const csv = [
      header.join(','),
      ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nori_batch_results_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        <div 
          className="lg:w-1/3 border border-border bg-surface hover:bg-border/30 transition-colors duration-150 p-12 flex flex-col items-center justify-center rounded-sm cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            id="fileInput" 
            onChange={handleFileDrop} 
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center text-center">
            <h3 className="text-sm font-medium text-primary mb-2">
              {file ? file.name : 'Upload Data'}
            </h3>
            <p className="text-xs text-secondary mt-2">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Drag and drop or select CSV'}
            </p>
          </label>
        </div>

        <div className="flex-1 border border-border bg-surface p-8 rounded-sm flex flex-col max-h-80 overflow-y-auto">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-sm font-medium text-primary">Data Preview</h2>
            <button
              onClick={handleRunBatch}
              disabled={!file || loading}
              className="px-4 py-2 bg-primary text-black hover:bg-white/90 transition-opacity duration-150 rounded-sm text-xs font-medium flex items-center disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin mr-2 w-3 h-3 text-black" />}
              {loading ? 'Processing...' : 'Run Batch Analysis'}
            </button>
          </div>

          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

          {preview?.headers ? (
            <div className="overflow-x-auto text-[11px] font-mono border border-border mt-2">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#0a0a0a] border-b border-border">
                  <tr>
                    {preview.headers.map((h, i) => (
                      <th key={i} className="p-3 text-secondary font-normal uppercase tracking-wider">{h.trim()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-[#111] transition-colors">
                      {preview.headers.map((h, j) => (
                        <td key={j} className="p-3 text-primary">{r[h.trim()]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-secondary opacity-60">
              <p className="text-sm">Upload a valid CSV file to preview telemetry.</p>
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="border border-border bg-surface p-8 rounded-sm animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-sm font-medium text-primary">Batch Analysis Results</h2>
            <button onClick={handleDownload} className="text-xs text-secondary hover:text-primary transition-colors border border-border px-3 py-1.5 rounded-sm">
              Download CSV
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-10 border-b border-border pb-8">
            <div>
              <p className="text-[11px] text-secondary uppercase tracking-widest mb-2">Mean Growth</p>
              <p className="font-mono text-2xl text-primary font-light">{results.summary.mean}</p>
            </div>
            <div>
              <p className="text-[11px] text-secondary uppercase tracking-widest mb-2">Min Growth</p>
              <p className="font-mono text-2xl text-secondary font-light">{results.summary.min}</p>
            </div>
            <div>
              <p className="text-[11px] text-secondary uppercase tracking-widest mb-2">Max Growth</p>
              <p className="font-mono text-2xl text-accent font-light">{results.summary.max}</p>
            </div>
          </div>

          <div className="overflow-x-auto text-[11px] font-mono mt-4">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="border-b border-border text-secondary">
                <tr>
                  {Object.keys(results.predictions[0]).map((h, i) => (
                    <th key={i} className={`p-4 font-normal uppercase tracking-wider ${h === 'predicted_growth' ? 'text-accent' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-primary">
                {results.predictions.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-[#111] transition-colors">
                    {Object.keys(row).map((k, j) => (
                      <td key={j} className={`p-4 ${k === 'predicted_growth' ? 'text-accent' : 'text-secondary'}`}>
                        {typeof row[k] === 'number' ? row[k].toFixed(2) : row[k]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-right text-[11px] text-secondary font-mono mt-4">Showing up to 10 rows. Download full CSV for complete dataset.</p>
        </div>
      )}
    </div>
  );
}
