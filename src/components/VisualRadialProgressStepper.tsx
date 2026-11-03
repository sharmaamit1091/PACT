import React from 'react';
import { CheckCircle2, Zap, Trophy, Flame } from 'lucide-react';

interface VisualRadialProgressStepperProps {
  currentPercentage: number;
  disabled?: boolean;
  onSelectPercentage: (percentage: number) => void;
}

export const VisualRadialProgressStepper: React.FC<VisualRadialProgressStepperProps> = ({
  currentPercentage,
  disabled = false,
  onSelectPercentage,
}) => {
  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  // SVG circular math
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentPercentage / 100) * circumference;

  const getStatusLabel = (pct: number) => {
    if (pct === 100) return { label: 'Delivered (100%)', color: 'text-emerald-400', badge: 'Complete' };
    if (pct >= 80) return { label: 'Final Verification', color: 'text-emerald-300', badge: 'Sprint End' };
    if (pct >= 50) return { label: 'Active Execution', color: 'text-sky-400', badge: 'Halfway' };
    if (pct >= 20) return { label: 'Early Progress', color: 'text-amber-400', badge: 'In Motion' };
    return { label: 'Kickoff Stage', color: 'text-slate-400', badge: 'Ready' };
  };

  const status = getStatusLabel(currentPercentage);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Top Header: Visual Radial Meter & Status */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Radial Mini Gauge */}
          <div className="relative w-18 h-18 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
              <circle
                cx="42"
                cy="42"
                r={radius}
                className="text-slate-800 stroke-current"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="42"
                cy="42"
                r={radius}
                className={`stroke-current transition-all duration-500 ease-out ${
                  currentPercentage === 100
                    ? 'text-emerald-400'
                    : currentPercentage >= 50
                    ? 'text-sky-400'
                    : 'text-amber-400'
                }`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-white leading-none">
                {currentPercentage}%
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold ${status.color}`}>
                {status.label}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {status.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized self-reported delivery progress in 10% increments
            </p>
          </div>
        </div>

        {/* Milestone Indicator */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          {currentPercentage === 100 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Deliverable Ready!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <span>Next goal:</span>
              <strong className="text-sky-400 font-bold">
                {Math.min(100, currentPercentage + 10)}%
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 10% Visual Segmented Buttons */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
          {steps.map((step) => {
            const isSelected = currentPercentage === step;
            const isPast = currentPercentage > step;

            return (
              <button
                key={step}
                type="button"
                disabled={disabled}
                onClick={() => onSelectPercentage(step)}
                className={`py-2 px-1 text-xs font-black rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${
                  disabled
                    ? isSelected
                      ? 'bg-slate-700 text-slate-300 cursor-not-allowed opacity-80'
                      : 'bg-slate-900/60 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : isSelected
                    ? step === 100
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300 scale-105 cursor-pointer'
                      : 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30 ring-2 ring-sky-300 scale-105 cursor-pointer'
                    : isPast
                    ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800 cursor-pointer'
                }`}
              >
                <span>{step}%</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? 'bg-slate-950'
                      : isPast
                      ? 'bg-emerald-400'
                      : 'bg-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Visual 10-Pip Segmented Tracker Line */}
        <div className="grid grid-cols-10 gap-1 pt-1">
          {Array.from({ length: 10 }).map((_, i) => {
            const pipValue = (i + 1) * 10;
            const isFilled = currentPercentage >= pipValue;
            const isCurrent = currentPercentage === pipValue;

            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-sky-400 shadow-sm shadow-sky-400'
                    : isFilled
                    ? 'bg-emerald-500/80'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
