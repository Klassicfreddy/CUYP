
import React, { useState, useRef } from 'react';
import { Board, Status, Activity, BoardColors } from '../types';
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

interface BulkImportModalProps {
  onImport: (activities: Omit<Activity, 'id'>[]) => void;
  onClose: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ onImport, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Omit<Activity, 'id'>[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | 'AUTO'>('AUTO');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['Activity Name', 'Start Date', 'End Date', 'Board', 'Status'];
    const sample = ['Medical Outreach', '2024-12-01', '2024-12-03', 'WHOLENESS MISSIONS', 'HOUSE'];
    const csvContent = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cmda_ucth_template.csv');
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) throw new Error('CSV file is empty or missing data.');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const dataRows = lines.slice(1).filter(line => line.trim() !== '');

        const parsedData: Omit<Activity, 'id'>[] = dataRows.map((line, idx) => {
          const values = line.split(',').map(v => v.trim());
          const entry: any = {};
          
          headers.forEach((header, i) => {
            const val = values[i];
            if (header.includes('name')) entry.activityName = val;
            if (header.includes('start')) entry.startDate = val;
            if (header.includes('end')) entry.endDate = val;
            if (header.includes('board')) entry.board = val as Board;
            if (header.includes('status')) entry.status = val as Status;
          });

          // Override board if manually selected
          if (selectedBoard !== 'AUTO') {
            entry.board = selectedBoard;
          }

          // Validation
          if (!entry.activityName || !entry.startDate || !entry.endDate || !entry.board || !entry.status) {
            throw new Error(`Row ${idx + 2}: Missing required fields. Check if "Board" is present in CSV or selected above.`);
          }
          if (!Object.values(Board).includes(entry.board)) {
             throw new Error(`Row ${idx + 2}: Invalid Board "${entry.board}".`);
          }
          if (!Object.values(Status).includes(entry.status)) {
             throw new Error(`Row ${idx + 2}: Invalid Status "${entry.status}".`);
          }

          // Secretariat Logic
          if (entry.board === Board.SECRETARIAT) {
            entry.status = Status.STATUTORY;
            entry.isLocked = true;
          }

          return entry;
        });

        setPreview(parsedData);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV.');
        setFile(null);
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    onImport(preview);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <Upload size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Bulk Import Activities</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!file && !error && (
            <div className="space-y-6">
              {/* Board Selection Section */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block">1. Select Target Board</label>
                <div className="relative">
                  <select
                    value={selectedBoard}
                    onChange={(e) => setSelectedBoard(e.target.value as Board | 'AUTO')}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="AUTO">Detect from CSV "Board" column</option>
                    {Object.values(Board).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={18} />
                  </div>
                  {selectedBoard !== 'AUTO' && (
                    <div className="absolute left-0 -bottom-1 w-full h-1 rounded-b-xl" style={{ backgroundColor: BoardColors[selectedBoard as Board] }} />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  {selectedBoard === 'AUTO' 
                    ? 'CSV must contain a "Board" column with valid department names.' 
                    : `All imported activities will be assigned to ${selectedBoard}.`}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block">2. Upload File</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-700">Click to upload CSV</p>
                    <p className="text-sm text-slate-500">or drag and drop your file here</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".csv" 
                    className="hidden" 
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg text-white">
                    <Download size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">Need a template?</p>
                    <p className="text-xs text-slate-500">Download our formatted CSV template.</p>
                  </div>
                </div>
                <button 
                  onClick={downloadTemplate}
                  className="text-xs font-bold text-blue-600 hover:underline px-4 py-2"
                >
                  Download Template
                </button>
              </div>
            </div>
          )}

          {parsing && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="font-medium text-slate-600">Validating your data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex flex-col items-center text-center gap-3">
              <AlertCircle className="text-red-500" size={48} />
              <div>
                <h3 className="font-bold text-red-800">Import Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={() => { setError(null); setFile(null); }}
                className="mt-2 text-sm font-bold text-red-600 hover:underline"
              >
                Try Another File
              </button>
            </div>
          )}

          {preview.length > 0 && !parsing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  Ready to import {preview.length} activities
                </h3>
                <button 
                  onClick={() => { setPreview([]); setFile(null); }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel and restart
                </button>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Activity</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Board</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-medium text-slate-700">{row.activityName}</td>
                        <td className="px-4 py-3 text-slate-500">{row.startDate} - {row.endDate}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BoardColors[row.board] }} />
                            {row.board}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="bg-slate-50 p-2 text-center text-slate-400 text-[10px] font-medium italic">
                    + {preview.length - 5} more entries
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-all text-sm"
          >
            Cancel
          </button>
          <button
            disabled={preview.length === 0}
            onClick={handleConfirm}
            className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 text-sm ${
              preview.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
            }`}
          >
            Import {preview.length > 0 ? preview.length : ''} Activities
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
