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
    if (pct === 100) return { label: 'Delivered (100%)', color: 'text-emerald-700', badge: 'Complete', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (pct >= 80) return { label: 'Final Verification', color: 'text-emerald-600', badge: 'Sprint End', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (pct >= 50) return { label: 'Active Execution', color: 'text-sky-700', badge: 'Halfway', bg: 'bg-sky-50 text-sky-800 border-sky-200' };
    if (pct >= 20) return { label: 'Early Progress', color: 'text-amber-700', badge: 'In Motion', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    return { label: 'Kickoff Stage', color: 'text-slate-600', badge: 'Ready', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const status = getStatusLabel(currentPercentage);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-4">
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
                className="text-slate-100 stroke-current"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="42"
                cy="42"
                r={radius}
                className={`stroke-current transition-all duration-500 ease-out ${
                  currentPercentage === 100
                    ? 'text-emerald-500'
                    : currentPercentage >= 50
                    ? 'text-sky-500'
                    : 'text-amber-500'
                }`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-900 leading-none">
                {currentPercentage}%
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-extrabold ${status.color}`}>
                {status.label}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.bg}`}>
                {status.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Authorized self-reported delivery progress in 10% increments
            </p>
          </div>
        </div>

        {/* Milestone Indicator */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          {currentPercentage === 100 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>Deliverable Ready!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
              <span>Next goal:</span>
              <strong className="text-emerald-700 font-bold">
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
                      ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? step === 100
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 scale-105 cursor-pointer'
                      : 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-400 scale-105 cursor-pointer'
                    : isPast
                    ? 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer'
                }`}
              >
                <span>{step}%</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? 'bg-white'
                      : isPast
                      ? 'bg-emerald-600'
                      : 'bg-slate-300'
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
                    ? 'bg-emerald-600 shadow-xs'
                    : isFilled
                    ? 'bg-emerald-500'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
