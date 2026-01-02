
import React, { useState, useEffect } from 'react';
import { Activity, Board, Status, RecurrenceFrequency, RecurrenceConfig, UpdateMode } from '../types';
import { Calendar, Tag, Shield, Info, Edit3, Plus, Repeat, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react';

interface EventFormProps {
  initialActivity?: Activity | null;
  onSubmit: (activity: Activity | Omit<Activity, 'id'>, updateMode?: UpdateMode) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ initialActivity, onSubmit, onCancel }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activityName, setActivityName] = useState('');
  const [board, setBoard] = useState<Board>(Board.RAPHATORIA);
  const [status, setStatus] = useState<Status>(Status.HOUSE);
  
  // Validation state
  const [nameError, setNameError] = useState(false);
  
  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [endRecurrence, setEndRecurrence] = useState('');

  // Update mode state (for recurring edits)
  const [updateMode, setUpdateMode] = useState<UpdateMode>(UpdateMode.ALL);

  const isEditing = !!initialActivity;
  const isSecretariat = board === Board.SECRETARIAT;
  // Entries are locked only if they are existing Secretariat entries
  const isLocked = isEditing && initialActivity?.isLocked;
  const isRecurringInstance = !!initialActivity?.parentId || (initialActivity?.recurrence && initialActivity.recurrence.frequency !== 'NONE');

  useEffect(() => {
    if (initialActivity) {
      setStartDate(initialActivity.startDate);
      setEndDate(initialActivity.endDate);
      setActivityName(initialActivity.activityName.replace(/^@/, ''));
      setBoard(initialActivity.board);
      setStatus(initialActivity.status);
      
      const recurrenceSource = initialActivity.recurrence;
      if (recurrenceSource) {
        setIsRecurring(true);
        setFrequency(recurrenceSource.frequency);
        setInterval(recurrenceSource.interval);
        setDaysOfWeek(recurrenceSource.daysOfWeek || []);
        setEndRecurrence(recurrenceSource.endRecurrence || '');
      } else {
        setIsRecurring(false);
      }
      
      setUpdateMode(initialActivity.parentId ? UpdateMode.SINGLE : UpdateMode.ALL);
    } else {
      resetForm();
    }
  }, [initialActivity]);

  const resetForm = () => {
    setStartDate(today);
    setEndDate(today);
    setActivityName('');
    setBoard(Board.RAPHATORIA);
    setStatus(Status.HOUSE);
    setIsRecurring(false);
    setFrequency('WEEKLY');
    setInterval(1);
    setDaysOfWeek([]);
    setEndRecurrence('');
    setUpdateMode(UpdateMode.ALL);
    setNameError(false);
  };

  useEffect(() => {
    if (isSecretariat) setStatus(Status.STATUTORY);
  }, [board, isSecretariat]);

  useEffect(() => {
    if (new Date(endDate) < new Date(startDate)) setEndDate(startDate);
  }, [startDate, endDate]);

  const toggleDay = (day: number) => {
    if (isLocked) return;
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit validation check
    if (!activityName.trim()) {
      setNameError(true);
      // Highlight and focus the field
      const input = document.getElementById('activity-name-input');
      input?.focus();
      return;
    }

    let finalName = activityName;
    if (status === Status.NATIONALS && !activityName.startsWith('@')) {
      finalName = `@${activityName}`;
    }

    const recurrence: RecurrenceConfig | undefined = isRecurring ? {
      frequency,
      interval,
      daysOfWeek: frequency === 'WEEKLY' ? daysOfWeek : undefined,
      endRecurrence: endRecurrence || undefined
    } : undefined;

    const payload = {
      startDate,
      endDate,
      activityName: finalName,
      board,
      status,
      isLocked: isSecretariat,
      recurrence
    };

    if (isEditing && initialActivity) {
      onSubmit({ ...payload, id: initialActivity.id }, isRecurringInstance ? updateMode : undefined);
    } else {
      onSubmit(payload);
    }
    if (!isEditing) resetForm();
  };

  const daysLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className={`rounded-xl shadow-lg p-6 border transition-all duration-300 ${isEditing ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          {isEditing ? <Edit3 className="text-blue-600" size={24} /> : <Calendar className="text-blue-600" size={24} />}
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Update Activity' : 'New Activity'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isEditing && isRecurringInstance && (
          <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm space-y-3">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Update Options</p>
            <div className="flex flex-col gap-2">
              {[UpdateMode.SINGLE, UpdateMode.ALL, UpdateMode.FUTURE].map((mode) => (
                <label key={mode} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="updateMode" 
                    value={mode} 
                    checked={updateMode === mode} 
                    onChange={() => setUpdateMode(mode)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {mode === UpdateMode.SINGLE ? 'This instance only' : mode === UpdateMode.ALL ? 'All instances in series' : 'This and future instances'}
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {mode === UpdateMode.SINGLE ? 'Create an independent activity for this date' : mode === UpdateMode.ALL ? 'Apply changes to the entire recurring chain' : 'Split the series from this date forward'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Start Date</label>
            <input
              type="date"
              required
              readOnly={isLocked}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'opacity-70 bg-slate-50 border-slate-200' : 'border-slate-200'}`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">End Date</label>
            <input
              type="date"
              required
              readOnly={isLocked}
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none ${isLocked ? 'opacity-70 bg-slate-50 border-slate-200' : 'border-slate-200'}`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-[10px] font-bold uppercase mb-1.5 transition-colors ${nameError ? 'text-red-500' : 'text-slate-400'}`}>
            Activity Name {isSecretariat && <span className="text-red-600 font-black ml-1 uppercase">*REQUIRED FOR SECRETARIAT*</span>}
          </label>
          <div className="relative">
            <input
              id="activity-name-input"
              type="text"
              required
              readOnly={isLocked}
              placeholder={isSecretariat ? "Statutory Name Required" : "e.g. Health Outreach"}
              value={activityName}
              onChange={(e) => {
                setActivityName(e.target.value);
                if (e.target.value.trim()) setNameError(false);
              }}
              className={`w-full p-2.5 border rounded-lg bg-white focus:ring-2 outline-none transition-all ${
                nameError 
                  ? 'border-red-500 focus:ring-red-100 bg-red-50/50' 
                  : isLocked 
                    ? 'opacity-70 bg-slate-50 border-slate-200' 
                    : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {nameError && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                <AlertCircle size={18} className="animate-pulse" />
              </div>
            )}
          </div>
          {nameError && (
            <p className="text-[10px] text-red-500 mt-1.5 font-bold flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100 shadow-sm">
              <AlertCircle size={12} />
              {isSecretariat 
                ? "Secretariat entries represent statutory activities and must be named for database integrity." 
                : "Activity name is mandatory to identify this event."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Board</label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value as Board)}
              disabled={isLocked}
              className={`w-full p-2.5 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isLocked ? 'opacity-70 bg-slate-50 border-slate-200' : 'border-slate-200'}`}
            >
              {Object.values(Board).map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Status</label>
            <select
              value={status}
              disabled={isSecretariat || isLocked}
              onChange={(e) => setStatus(e.target.value as Status)}
              className={`w-full p-2.5 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isLocked ? 'opacity-70 bg-slate-50 border-slate-200' : 'border-slate-200'}`}
            >
              <option value={Status.HOUSE}>HOUSE</option>
              <option value={Status.NATIONALS}>NATIONALS (@)</option>
              <option value={Status.STATUTORY} disabled={!isSecretariat}>STATUTORY</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className={`flex items-center gap-2 cursor-pointer group ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)}
              disabled={isLocked}
              className="w-4 h-4 rounded text-blue-600 transition-all border-slate-300 focus:ring-offset-0 focus:ring-0"
            />
            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 flex items-center gap-1.5 transition-colors">
              <Repeat size={14} className={isRecurring ? 'text-blue-600' : 'text-slate-400'} />
              Recurring Series
            </span>
          </label>

          {isRecurring && (
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-5 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">Frequency</label>
                  <select 
                    value={frequency} 
                    disabled={isLocked}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">Repeat Every</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      readOnly={isLocked}
                      value={interval} 
                      onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">unit(s)</span>
                  </div>
                </div>
              </div>

              {frequency === 'WEEKLY' && (
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Repeat on these days</label>
                  <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-inner">
                    {daysLabels.map((label, i) => {
                      const isActive = daysOfWeek.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          title={fullDays[i]}
                          onClick={() => toggleDay(i)}
                          className={`w-9 h-9 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' 
                              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">End Recurrence</label>
                <div className="relative group">
                  <input 
                    type="date" 
                    min={startDate}
                    readOnly={isLocked}
                    value={endRecurrence} 
                    onChange={(e) => setEndRecurrence(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white pl-9 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5 italic">Leave blank to repeat until end of year.</p>
              </div>
            </div>
          )}
        </div>

        {isSecretariat && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-[10px] border border-amber-100 shadow-sm">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">Secretariat entries are statutory and locked once created. Modifications can only be performed by authorized personnel.</p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg text-sm active:scale-95 ${
              isEditing 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
            }`}
          >
            {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
            {isEditing ? 'Save Changes' : 'Add Activity'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-bold rounded-xl transition-all text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
