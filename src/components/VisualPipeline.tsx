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
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'ai',
      label: 'AI Action Engine',
      sublabel: `${totalTasks} Commitments`,
      icon: Sparkles,
      color: 'indigo',
      badge: ambiguousCount > 0 ? `${ambiguousCount} to verify` : 'Verified',
      badgeColor: ambiguousCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
    {
      id: 'assign',
      label: 'Identity & ETAs',
      sublabel: 'cisco.com domain',
      icon: Users,
      color: 'purple',
      badge: 'Protected',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'progress',
      label: '10% Self-Reporting',
      sublabel: `${completedTasks}/${totalTasks} Done`,
      icon: CheckCircle2,
      color: 'emerald',
      badge: `${Math.round((completedTasks / (totalTasks || 1)) * 100)}%`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'reminders',
      label: 'Auto Reminders',
      sublabel: '24h / Pre-Meeting',
      icon: BellRing,
      color: 'rose',
      badge: 'Active Bot',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
  ];

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            PACT Visual Workflow Architecture
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
                  ? 'bg-slate-800/90 border-sky-500 shadow-md ring-1 ring-sky-500/40'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-800/90 text-slate-300 group-hover:text-white group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {s.sublabel}
                </div>
              </div>

              {/* Step indicator dot */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Step 0{idx + 1}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-sky-400 animate-pulse' : 'bg-slate-700'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
