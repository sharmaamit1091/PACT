import React from 'react';
import { Layers, ArrowRight, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TaskDependency } from '../types/webex';

interface VisualDependencyMapProps {
  dependencies: TaskDependency[];
  assigneeName: string;
}

export const VisualDependencyMap: React.FC<VisualDependencyMapProps> = ({
  dependencies,
  assigneeName,
}) => {
  if (!dependencies || dependencies.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>No blocking dependencies. This deliverable can proceed independently.</span>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-indigo-950">
        <span className="font-semibold flex items-center gap-1.5 text-indigo-900">
          <Layers className="w-3.5 h-3.5 text-indigo-600" /> Visual Dependency Map
        </span>
        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-medium">
          Cross-Employee Link
        </span>
      </div>

      <div className="space-y-2">
        {dependencies.map((dep, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-sm"
          >
            {/* Upstream Owner / Resource */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                01
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">{dep.taskOrPerson}</div>
                <div className="text-[10px] text-slate-500 truncate">{dep.detail}</div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex items-center text-indigo-600 flex-shrink-0 px-1">
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </div>

            {/* Downstream (Current Assignee) */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
              <div className="min-w-0">
                <div className="font-bold text-sky-800 truncate">{assigneeName}</div>
                <div className="text-[10px] text-slate-500 truncate">Final Integration</div>
              </div>
              <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                02
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
