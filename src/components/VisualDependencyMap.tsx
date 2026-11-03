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
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>No blocking dependencies. This deliverable can proceed independently.</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-indigo-300">
        <span className="font-semibold flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" /> Visual Dependency Map
        </span>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
          Cross-Employee Link
        </span>
      </div>

      <div className="space-y-2">
        {dependencies.map((dep, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs"
          >
            {/* Upstream Owner / Resource */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                01
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-200 truncate">{dep.taskOrPerson}</div>
                <div className="text-[10px] text-slate-400 truncate">{dep.detail}</div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex items-center text-indigo-400 flex-shrink-0 px-1">
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </div>

            {/* Downstream (Current Assignee) */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
              <div className="min-w-0">
                <div className="font-bold text-sky-300 truncate">{assigneeName}</div>
                <div className="text-[10px] text-slate-400 truncate">Final Integration</div>
              </div>
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                02
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
