import React from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle, ArrowRight, BellRing } from 'lucide-react';
import { WebexEmployeeProfile, ActionItem } from '../types/webex';
import { isSameEmployee } from '../utils/ciscoScale';

interface VisualEmployeeRosterProps {
  employees: WebexEmployeeProfile[];
  actionItems: ActionItem[];
  onSelectEmployee: (emp: WebexEmployeeProfile) => void;
  onNudgeEmployee: (task: ActionItem) => void;
}

export const VisualEmployeeRoster: React.FC<VisualEmployeeRosterProps> = ({
  employees,
  actionItems,
  onSelectEmployee,
  onNudgeEmployee,
}) => {
  // Take top key assignees
  const activeAssignees = employees.slice(0, 5).map((emp) => {
    const tasks = actionItems.filter((t) => isSameEmployee(emp, t));
    const avgProgress =
      tasks.length > 0
        ? Math.round(tasks.reduce((sum, t) => sum + t.progressPercentage, 0) / tasks.length)
        : 0;
    const hasBlocker = tasks.some((t) => t.helpRequested);
    return {
      emp,
      tasks,
      avgProgress,
      hasBlocker,
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Team Workload & Progress
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          5,240 Cisco Attendees Directory
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {activeAssignees.map(({ emp, tasks, avgProgress, hasBlocker }) => {
          const mainTask = tasks[0];

          return (
            <div
              key={emp.id}
              className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={emp.avatar}
                      alt={emp.displayName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-800 leading-tight">
                        {emp.displayName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[95px] font-medium">
                        {emp.role.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                      avgProgress === 100
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : avgProgress >= 50
                        ? 'bg-sky-100 text-sky-800 border-sky-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {avgProgress}%
                  </span>
                </div>

                {/* Micro progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      avgProgress === 100
                        ? 'bg-emerald-500'
                        : avgProgress >= 50
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>

                {mainTask ? (
                  <div className="text-[11px] text-slate-700 line-clamp-1 mb-1 font-semibold">
                    {mainTask.title}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic mb-1">
                    No active deliverables
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/80 mt-1">
                <button
                  type="button"
                  onClick={() => onSelectEmployee(emp)}
                  className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Portal</span>
                  <ArrowRight className="w-3 h-3 text-emerald-600" />
                </button>
                {mainTask && (
                  <button
                    type="button"
                    onClick={() => onNudgeEmployee(mainTask)}
                    title="Send instant Webex reminder"
                    className="p-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[10px] transition-colors cursor-pointer"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
