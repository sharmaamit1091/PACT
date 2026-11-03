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
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Team Workload & Progress
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          5,240 Cisco Attendees Directory
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {activeAssignees.map(({ emp, tasks, avgProgress, hasBlocker }) => {
          const mainTask = tasks[0];

          return (
            <div
              key={emp.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={emp.avatar}
                      alt={emp.displayName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200 leading-tight">
                        {emp.displayName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[90px]">
                        {emp.role.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      avgProgress === 100
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : avgProgress >= 50
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {avgProgress}%
                  </span>
                </div>

                {/* Micro progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      avgProgress === 100
                        ? 'bg-emerald-400'
                        : avgProgress >= 50
                        ? 'bg-sky-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>

                {mainTask ? (
                  <div className="text-[11px] text-slate-300 line-clamp-1 mb-1 font-medium">
                    {mainTask.title}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 italic mb-1">
                    No active deliverables
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 mt-1">
                <button
                  type="button"
                  onClick={() => onSelectEmployee(emp)}
                  className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Portal</span>
                  <ArrowRight className="w-3 h-3 text-sky-400" />
                </button>
                {mainTask && (
                  <button
                    type="button"
                    onClick={() => onNudgeEmployee(mainTask)}
                    title="Send instant Webex reminder"
                    className="p-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[10px] transition-colors cursor-pointer"
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
