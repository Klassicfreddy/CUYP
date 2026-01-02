
import React from 'react';
import { Activity, BoardColors } from '../types';
import { format, parseISO, compareAsc } from 'date-fns';
import { Calendar, Clock, ChevronRight, Repeat, Trash2 } from 'lucide-react';

interface PlannerViewProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ activities, onActivityClick, onDelete }) => {
  // Sort activities by start date
  const sortedActivities = [...activities].sort((a, b) => 
    compareAsc(parseISO(a.startDate), parseISO(b.startDate))
  );

  // Group by Month
  const groupedActivities: Record<string, Activity[]> = {};
  sortedActivities.forEach(activity => {
    const monthYear = format(parseISO(activity.startDate), 'MMMM yyyy');
    if (!groupedActivities[monthYear]) {
      groupedActivities[monthYear] = [];
    }
    groupedActivities[monthYear].push(activity);
  });

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
        <Calendar size={48} className="mb-4 opacity-20" />
        <p className="font-medium">No activities found matching your filters.</p>
        <p className="text-sm">Try adjusting your filters or add a new activity.</p>
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation(); // Prevent opening the detail modal
    onDelete(activity);
  };

  return (
    <div className="space-y-8 pb-12">
      {Object.entries(groupedActivities).map(([month, monthActivities]) => (
        <div key={month} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-800 shrink-0">{month}</h3>
            <div className="h-px bg-slate-200 w-full"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {monthActivities.map((activity) => {
              const start = parseISO(activity.startDate);
              const end = parseISO(activity.endDate);
              const isOneDay = activity.startDate === activity.endDate;
              const isRecurringInstance = !!activity.parentId || (activity.recurrence && activity.recurrence.frequency !== 'NONE');

              return (
                <div 
                  key={activity.id}
                  onClick={() => onActivityClick(activity)}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-stretch h-18"
                >
                  {/* Enhanced Color Strip - Consistently applied for all activities */}
                  <div 
                    className="w-2 flex-shrink-0 transition-opacity group-hover:opacity-80" 
                    style={{ backgroundColor: BoardColors[activity.board] || '#cbd5e1' }}
                    title={activity.board}
                  />

                  <div className="flex-1 p-4 flex items-center justify-between min-w-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          {activity.activityName}
                        </h4>
                        {isRecurringInstance && (
                          <Repeat size={12} className="text-blue-500 shrink-0" title="Recurring activity series" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={13} className="text-slate-400" />
                          {isOneDay ? format(start, 'do MMM') : `${format(start, 'do')} - ${format(end, 'do MMM')}`}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 font-bold text-slate-600 text-[10px] uppercase">
                          {activity.board}
                        </span>
                        <span className={`font-black uppercase tracking-tighter ${activity.status === 'NATIONALS' ? 'text-amber-600' : activity.status === 'STATUTORY' ? 'text-blue-700' : 'text-emerald-600'}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!activity.isLocked && (
                        <button
                          onClick={(e) => handleDelete(e, activity)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Activity"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlannerView;
