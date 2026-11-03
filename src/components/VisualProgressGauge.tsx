import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp } from 'lucide-react';

interface VisualProgressGaugeProps {
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  total: number;
}

export const VisualProgressGauge: React.FC<VisualProgressGaugeProps> = ({
  completed,
  inProgress,
  pending,
  overdue,
  total,
}) => {
  const safeTotal = total || 1;
  const percentCompleted = Math.round((completed / safeTotal) * 100);
  const percentInProgress = Math.round((inProgress / safeTotal) * 100);
  const percentOverdue = Math.round((overdue / safeTotal) * 100);

  // SVG circular gauge math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentCompleted / 100) * circumference;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Team Health & Velocity
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {percentCompleted >= 70 ? 'On Track' : percentCompleted >= 40 ? 'Active Pace' : 'In Ramp-up'}
        </span>
      </div>

      <div className="flex items-center gap-5 my-2">
        {/* Radial SVG Gauge */}
        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-slate-800 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            {/* In Progress Arc (Amber/Sky) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-sky-500/40 stroke-current transition-all duration-700 ease-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - ((percentCompleted + percentInProgress) / 100) * circumference}
              fill="transparent"
            />
            {/* Completed Arc (Emerald) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-emerald-400 stroke-current transition-all duration-700 ease-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-white leading-none">{percentCompleted}%</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-medium">Done</span>
          </div>
        </div>

        {/* Visual Metric Pillars */}
        <div className="flex-1 space-y-2">
          {/* Completed */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
                Done
              </span>
              <span className="font-bold text-emerald-400">{completed} <span className="text-slate-500 font-normal">({percentCompleted}%)</span></span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentCompleted}%` }}
              />
            </div>
          </div>

          {/* In Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm shadow-sky-400/50" />
                In Progress
              </span>
              <span className="font-bold text-sky-300">{inProgress} <span className="text-slate-500 font-normal">({percentInProgress}%)</span></span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentInProgress}%` }}
              />
            </div>
          </div>

          {/* Overdue / Urgent */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-sm shadow-rose-400/50" />
                Overdue / Urgent
              </span>
              <span className="font-bold text-rose-400">{overdue} <span className="text-slate-500 font-normal">({percentOverdue}%)</span></span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentOverdue}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
