
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Activity, Board, BoardColors, Status, UpdateMode } from './types';
import EventForm from './components/EventForm';
import ReportView from './components/ReportView';
import ActivityDetailModal from './components/ActivityDetailModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import BulkImportModal from './components/BulkImportModal';
import PlannerView from './components/PlannerView';
import { generateMonthlyReport } from './services/geminiService';
import { LayoutDashboard, Calendar as CalendarIcon, FileBarChart, Bell, Menu, X, Filter, Database, List, Loader2 } from 'lucide-react';
import { format, parseISO, addDays, addWeeks, addMonths, isBefore, isAfter, isSameDay, startOfMonth, endOfYear, differenceInDays, subDays } from 'date-fns';

type ViewMode = 'CALENDAR' | 'PLANNER';

// GAS Global Declaration
declare const google: any;

const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportText, setReportText] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('CALENDAR');

  // Modal States
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filtering state
  const [boardFilter, setBoardFilter] = useState<Board | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL');

  // Load activities from GAS backend
  useEffect(() => {
    const fetchActivities = () => {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler((data: Activity[]) => {
            setActivities(data || []);
            setIsLoading(false);
          })
          .withFailureHandler((err: Error) => {
            console.error("Failed to load activities:", err);
            setIsLoading(false);
          })
          .getActivities();
      } else {
        // Fallback for local development
        console.warn("GAS Environment not detected. Using local state.");
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // Helper: Expand recurring activities for display
  const expandedActivities = useMemo(() => {
    const list: Activity[] = [];
    const horizon = endOfYear(new Date());

    activities.forEach(a => {
      if (!a.recurrence || a.recurrence.frequency === 'NONE') {
        list.push(a);
        return;
      }

      let currentStart = parseISO(a.startDate);
      let currentEnd = parseISO(a.endDate);
      const duration = differenceInDays(currentEnd, currentStart);
      const limit = a.recurrence.endRecurrence ? parseISO(a.recurrence.endRecurrence) : horizon;
      const skipped = a.skippedDates || [];

      while (!isAfter(currentStart, limit)) {
        const dateStr = format(currentStart, 'yyyy-MM-dd');
        const isSkipped = skipped.includes(dateStr);

        if (!isSkipped) {
          if (a.recurrence.frequency === 'WEEKLY' && a.recurrence.daysOfWeek?.length) {
            const dayNum = currentStart.getDay();
            if (a.recurrence.daysOfWeek.includes(dayNum)) {
              list.push({ 
                ...a, 
                id: `${a.id}-${format(currentStart, 'yyyyMMdd')}`, 
                startDate: dateStr,
                endDate: format(addDays(currentStart, duration), 'yyyy-MM-dd'),
                parentId: a.id 
              });
            }
          } else {
            list.push({ 
              ...a, 
              id: `${a.id}-${format(currentStart, 'yyyyMMdd')}`, 
              startDate: dateStr,
              endDate: format(addDays(currentStart, duration), 'yyyy-MM-dd'),
              parentId: a.id 
            });
          }
        }

        const interval = a.recurrence.interval || 1;
        if (a.recurrence.frequency === 'DAILY') {
          currentStart = addDays(currentStart, interval);
        } else if (a.recurrence.frequency === 'WEEKLY') {
          currentStart = a.recurrence.daysOfWeek?.length ? addDays(currentStart, 1) : addWeeks(currentStart, interval);
        } else if (a.recurrence.frequency === 'MONTHLY') {
          currentStart = addMonths(currentStart, interval);
        } else {
          break;
        }
      }
    });
    return list;
  }, [activities]);

  const handleSubmitActivity = (activityData: Activity | Omit<Activity, 'id'>, updateMode?: UpdateMode) => {
    let finalActivity: Activity;
    
    if ('id' in activityData) {
      const existingId = activityData.id;
      
      if (updateMode === UpdateMode.SINGLE && editingActivity?.parentId) {
        // Create detached instance
        const parentId = editingActivity.parentId;
        const originalInstanceDate = editingActivity.startDate;

        const updatedActivities = activities.map(a => {
          if (a.id === parentId) {
            const skipped = a.skippedDates || [];
            const newA = { ...a, skippedDates: [...new Set([...skipped, originalInstanceDate])] };
            if (typeof google !== 'undefined') google.script.run.saveActivity(newA);
            return newA;
          }
          return a;
        });

        const newStandalone: Activity = {
          ...activityData as Activity,
          id: Math.random().toString(36).substr(2, 9),
          parentId: undefined,
          recurrence: undefined
        };
        if (typeof google !== 'undefined') google.script.run.saveActivity(newStandalone);
        setActivities([...updatedActivities, newStandalone]);

      } else if (updateMode === UpdateMode.FUTURE && editingActivity?.parentId) {
        // Split series
        const parentId = editingActivity.parentId;
        const splitDate = parseISO(editingActivity.startDate);

        const updatedActivities = activities.map(a => {
          if (a.id === parentId) {
            const end = format(subDays(splitDate, 1), 'yyyy-MM-dd');
            const newA = { ...a, recurrence: { ...a.recurrence!, endRecurrence: end } };
            if (typeof google !== 'undefined') google.script.run.saveActivity(newA);
            return newA;
          }
          return a;
        });

        const newSeries: Activity = {
          ...activityData as Activity,
          id: Math.random().toString(36).substr(2, 9),
          parentId: undefined
        };
        if (typeof google !== 'undefined') google.script.run.saveActivity(newSeries);
        setActivities([...updatedActivities, newSeries]);

      } else {
        // Standard edit
        const targetId = editingActivity?.parentId || existingId;
        finalActivity = { ...activityData as Activity, id: targetId };
        if (typeof google !== 'undefined') google.script.run.saveActivity(finalActivity);
        setActivities(prev => prev.map(a => a.id === targetId ? finalActivity : a));
      }
      
      setEditingActivity(null);
    } else {
      // New activity
      const activityWithId: Activity = {
        ...activityData,
        id: Math.random().toString(36).substr(2, 9)
      };
      if (typeof google !== 'undefined') google.script.run.saveActivity(activityWithId);
      setActivities(prev => [...prev, activityWithId]);
    }
  };

  const handleDeleteActivity = (activity: Activity, mode: UpdateMode = UpdateMode.SINGLE) => {
    if (activity.isLocked) return;

    if (!activity.parentId && (!activity.recurrence || activity.recurrence.frequency === 'NONE')) {
      // Non-recurring
      if (typeof google !== 'undefined') google.script.run.deleteActivity(activity.id);
      setActivities(prev => prev.filter(a => a.id !== activity.id));
    } else {
      // Recurring
      const targetId = activity.parentId || activity.id;
      if (mode === UpdateMode.ALL) {
        if (typeof google !== 'undefined') google.script.run.deleteActivity(targetId);
        setActivities(prev => prev.filter(a => a.id !== targetId));
      } else if (mode === UpdateMode.SINGLE) {
        setActivities(prev => prev.map(a => {
          if (a.id === targetId) {
            const skipped = a.skippedDates || [];
            const newA = { ...a, skippedDates: [...new Set([...skipped, activity.startDate])] };
            if (typeof google !== 'undefined') google.script.run.saveActivity(newA);
            return newA;
          }
          return a;
        }));
      } else if (mode === UpdateMode.FUTURE) {
        const splitDate = parseISO(activity.startDate);
        setActivities(prev => prev.map(a => {
          if (a.id === targetId) {
            const end = format(subDays(splitDate, 1), 'yyyy-MM-dd');
            const newA = { ...a, recurrence: { ...a.recurrence!, endRecurrence: end } };
            if (typeof google !== 'undefined') google.script.run.saveActivity(newA);
            return newA;
          }
          return a;
        }));
      }
    }
    setActivityToDelete(null);
    setSelectedActivity(null);
  };

  const handleBulkImport = (newActivities: Omit<Activity, 'id'>[]) => {
    const activitiesWithIds = newActivities.map(a => {
      const act = { ...a, id: Math.random().toString(36).substr(2, 9) };
      if (typeof google !== 'undefined') google.script.run.saveActivity(act);
      return act;
    });
    setActivities(prev => [...prev, ...activitiesWithIds]);
  };

  const handleEditFromModal = (activity: Activity) => {
    setSelectedActivity(null);
    setEditingActivity(activity);
    setIsSidebarOpen(true);
    if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateMonthlyReport(expandedActivities, currentViewMonth);
      setReportText(report);
    } catch (err) {
      alert("Failed to generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const filteredExpanded = useMemo(() => {
    return expandedActivities.filter(a => {
      const matchesBoard = boardFilter === 'ALL' || a.board === boardFilter;
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesBoard && matchesStatus;
    });
  }, [expandedActivities, boardFilter, statusFilter]);

  const calendarEvents = useMemo(() => {
    return filteredExpanded.map(a => ({
      id: a.id,
      title: a.activityName,
      start: a.startDate,
      end: a.endDate, 
      allDay: true,
      backgroundColor: BoardColors[a.board],
      borderColor: BoardColors[a.board],
      extendedProps: { ...a }
    }));
  }, [filteredExpanded]);

  const handleDatesSet = (dateInfo: any) => {
    setCurrentViewMonth(dateInfo.view.currentStart);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="font-bold tracking-widest text-sm uppercase opacity-60">Initializing Planner...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">CU</div>
          <h1 className="font-bold tracking-tight">CMDA-UCTH</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><Menu size={24} /></button>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-50 w-full md:w-80 bg-slate-900 text-slate-100 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><LayoutDashboard className="text-white" size={24} /></div>
          <div><h1 className="font-bold text-lg leading-tight">CMDA-UCTH</h1><p className="text-xs text-slate-400 font-medium">Yearly Planner v1.4</p></div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-8 mt-4 md:mt-0">
          <EventForm initialActivity={editingActivity} onSubmit={handleSubmitActivity} onCancel={() => { setIsSidebarOpen(false); setEditingActivity(null); }} />
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3">
            <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider"><Bell size={14} />Actions</h3>
            <button onClick={handleRequestReport} className="w-full flex items-center gap-3 bg-white text-slate-900 font-bold py-3 px-4 rounded-xl text-sm shadow-sm active:scale-95 transition-all hover:bg-slate-100"><FileBarChart className="text-blue-600" size={18} />Generate Report</button>
            <button onClick={() => setIsImportModalOpen(true)} className="w-full flex items-center gap-3 bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-sm border border-slate-600 active:scale-95 transition-all hover:bg-slate-600"><Database className="text-emerald-400" size={18} />Bulk Import CSV</button>
          </div>
        </nav>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200"><CalendarIcon className="text-blue-600" size={24} /></div>
              <div><h2 className="text-2xl font-bold text-slate-800">{viewMode === 'CALENDAR' ? 'Activity Calendar' : 'Planner Timeline'}</h2><p className="text-slate-500 text-sm">Comprehensive departmental view</p></div>
            </div>
            <div className="bg-slate-200 p-1 rounded-xl flex items-center shrink-0 border border-slate-300 shadow-inner">
              <button onClick={() => setViewMode('CALENDAR')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'CALENDAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><CalendarIcon size={18} />Calendar</button>
              <button onClick={() => setViewMode('PLANNER')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'PLANNER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><List size={18} />Planner</button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm uppercase tracking-wider"><Filter size={18} /><span>Filters:</span></div>
            <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
              <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value as Board | 'ALL')} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                <option value="ALL">All Boards</option>
                {Object.values(Board).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | 'ALL')} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                <option value="ALL">All Statuses</option>
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 md:p-6 min-h-[600px]">
            {viewMode === 'CALENDAR' ? (
              <FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" events={calendarEvents} height="auto" datesSet={handleDatesSet} eventClick={(info) => setSelectedActivity(info.event.extendedProps as Activity)} dayMaxEvents={true} themeSystem="standard" />
            ) : (
              <PlannerView 
                activities={filteredExpanded} 
                onActivityClick={setSelectedActivity} 
                onDelete={(a) => setActivityToDelete(a)}
              />
            )}
          </div>
        </div>
      </main>

      <ReportView report={reportText} loading={isGeneratingReport} onClose={() => setReportText(null)} />
      
      <ActivityDetailModal 
        activity={selectedActivity} 
        onEdit={handleEditFromModal} 
        onDelete={(a) => setActivityToDelete(a)}
        onClose={() => setSelectedActivity(null)} 
      />

      {activityToDelete && (
        <DeleteConfirmationModal 
          activity={activityToDelete} 
          onConfirm={(mode) => handleDeleteActivity(activityToDelete, mode)}
          onCancel={() => setActivityToDelete(null)}
        />
      )}

      {isImportModalOpen && <BulkImportModal onImport={handleBulkImport} onClose={() => setIsImportModalOpen(false)} />}
    </div>
  );
};

export default App;
