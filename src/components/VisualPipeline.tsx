import React from 'react';
import {
  Video,
  Sparkles,
  Users,
  CheckCircle2,
  BellRing,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface VisualPipelineProps {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  ambiguousCount: number;
  attendeesCount: number;
  onStepClick?: (stepIndex: number) => void;
  activeStep?: number;
}

export const VisualPipeline: React.FC<VisualPipelineProps> = ({
  totalTasks,
  completedTasks,
  inProgressTasks,
  ambiguousCount,
  attendeesCount,
  onStepClick,
  activeStep = 1,
}) => {
  const steps = [
    {
      id: 'webex',
      label: 'Webex Meeting',
      sublabel: `${attendeesCount.toLocaleString()} Attendees`,
      icon: Video,
      color: 'sky',
      badge: 'Live',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      id: 'ai',
      label: 'AI Action Engine',
      sublabel: `${totalTasks} Commitments`,
      icon: Sparkles,
      color: 'indigo',
      badge: ambiguousCount > 0 ? `${ambiguousCount} to verify` : 'Verified',
      badgeColor: ambiguousCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      id: 'assign',
      label: 'Identity & ETAs',
      sublabel: 'cisco.com domain',
      icon: Users,
      color: 'purple',
      badge: 'Protected',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'progress',
      label: '10% Self-Reporting',
      sublabel: `${completedTasks}/${totalTasks} Done`,
      icon: CheckCircle2,
      color: 'emerald',
      badge: `${Math.round((completedTasks / (totalTasks || 1)) * 100)}%`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'reminders',
      label: 'Auto Reminders',
      sublabel: '24h / Pre-Meeting',
      icon: BellRing,
      color: 'rose',
      badge: 'Active Bot',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            PACT Visual Workflow Architecture
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Automated & Role-Protected</span>
        </div>
      </div>

      {/* Responsive Visual Stepper Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isSelected = activeStep === idx;

          return (
            <div
              key={s.id}
              onClick={() => onStepClick?.(idx)}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                  : 'bg-slate-50/70 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white text-slate-600 border border-slate-200/80 group-hover:text-emerald-700 group-hover:border-emerald-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-800 transition-colors">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                  {s.sublabel}
                </div>
              </div>

              {/* Step indicator dot */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Step 0{idx + 1}</span>
                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-600 animate-pulse' : 'bg-slate-300'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
