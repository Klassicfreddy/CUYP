
import React from 'react';
import { Activity, BoardColors } from '../types';
import { X, Calendar, Tag, Shield, Lock, Edit3, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ActivityDetailModalProps {
  activity: Activity | null;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onClose: () => void;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activity, onEdit, onDelete, onClose }) => {
  if (!activity) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'PPP');
    } catch (e) {
      return dateStr;
    }
  };

  const isOneDay = activity.startDate === activity.endDate;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full shadow-sm" 
              style={{ backgroundColor: BoardColors[activity.board] }}
            />
            <h2 className="text-xl font-bold text-slate-800 truncate pr-4">
              {activity.activityName}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</p>
                <p className="text-slate-700 font-medium text-sm">
                  {isOneDay ? (
                    formatDate(activity.startDate)
                  ) : (
                    <>
                      {formatDate(activity.startDate)} <span className="text-slate-400 mx-1">→</span> {formatDate(activity.endDate)}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departmental Board</p>
                <p className="text-slate-700 font-medium text-sm">{activity.board}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Status</p>
                <div className="flex items-center gap-2">
                   <span className="text-slate-700 font-medium text-sm">{activity.status}</span>
                   {activity.status === 'NATIONALS' && (
                     <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">PREFIXED @</span>
                   )}
                </div>
              </div>
            </div>
          </div>

          {activity.isLocked && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
              <Lock className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-amber-800 font-bold text-sm">Statutory Entry</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  This activity is managed by the Secretariat. It is in read-only mode and cannot be modified or deleted within the app.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t flex flex-wrap justify-end gap-3">
          <button
            onClick={() => onDelete(activity)}
            disabled={activity.isLocked}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm text-sm ${activity.isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => onEdit(activity)}
            disabled={activity.isLocked}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm text-sm ${activity.isLocked ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <Edit3 size={16} />
            Edit
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-all shadow-sm text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;
