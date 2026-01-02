
import React, { useState } from 'react';
import { Activity, UpdateMode } from '../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  activity: Activity;
  onConfirm: (mode: UpdateMode) => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ activity, onConfirm, onCancel }) => {
  const isRecurringInstance = !!activity.parentId || (activity.recurrence && activity.recurrence.frequency !== 'NONE');
  const [mode, setMode] = useState<UpdateMode>(activity.parentId ? UpdateMode.SINGLE : UpdateMode.ALL);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <Trash2 size={20} />
            </div>
            <h2 className="text-lg font-bold text-red-800">Delete Activity?</h2>
          </div>
          <button onClick={onCancel} className="text-red-400 hover:text-red-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3 items-start text-slate-600 text-sm">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p>
              Are you sure you want to delete <span className="font-bold text-slate-800">"{activity.activityName}"</span>? This action cannot be undone.
            </p>
          </div>

          {isRecurringInstance && (
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recurrence Options</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="radio" 
                    name="deleteMode" 
                    value={UpdateMode.SINGLE} 
                    checked={mode === UpdateMode.SINGLE} 
                    onChange={() => setMode(UpdateMode.SINGLE)}
                    className="w-4 h-4 text-red-600"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700">This instance only</p>
                    <p className="text-slate-500 text-[10px]">Remove only this date</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="radio" 
                    name="deleteMode" 
                    value={UpdateMode.ALL} 
                    checked={mode === UpdateMode.ALL} 
                    onChange={() => setMode(UpdateMode.ALL)}
                    className="w-4 h-4 text-red-600"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700">Entire series</p>
                    <p className="text-slate-500 text-[10px]">Remove all instances of this activity</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="radio" 
                    name="deleteMode" 
                    value={UpdateMode.FUTURE} 
                    checked={mode === UpdateMode.FUTURE} 
                    onChange={() => setMode(UpdateMode.FUTURE)}
                    className="w-4 h-4 text-red-600"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700">This and future instances</p>
                    <p className="text-slate-500 text-[10px]">Split series and stop from this date</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 font-bold rounded-lg text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(mode)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all shadow-md shadow-red-500/20"
          >
            Delete Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
