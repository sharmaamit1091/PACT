import React from 'react';
import { Rocket, Clock, ShieldAlert, HelpCircle, CheckCircle2 } from 'lucide-react';

export interface StatusPreset {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgActive: string;
  defaultReason: string;
}

export const STATUS_PRESETS: StatusPreset[] = [
  {
    id: 'on_track',
    label: 'On Track',
    sublabel: 'Advancing smoothly',
    icon: Rocket,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    bgActive: 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500/30',
    defaultReason: 'Development is progressing on schedule without blockers.',
  },
  {
    id: 'waiting_peer',
    label: 'Waiting on Peer',
    sublabel: 'Dependency pending',
    icon: Clock,
    color: 'text-amber-600',
    borderColor: 'border-amber-200',
    bgActive: 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500/30',
    defaultReason: 'Waiting for upstream deliverable from teammate before final verification.',
  },
  {
    id: 'secops',
    label: 'SecOps / Access',
    sublabel: 'Firewall / token delay',
    icon: ShieldAlert,
    color: 'text-orange-600',
    borderColor: 'border-orange-200',
    bgActive: 'bg-orange-50 border-orange-500 text-orange-900 ring-1 ring-orange-500/30',
    defaultReason: 'Waiting on corporate security ticket approval for webhook callback ingress.',
  },
  {
    id: 'need_host',
    label: 'Needs Host Clarification',
    sublabel: 'Requirements query',
    icon: HelpCircle,
    color: 'text-purple-600',
    borderColor: 'border-purple-200',
    bgActive: 'bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500/30',
    defaultReason: 'Awaiting host confirmation on schema requirements before deploying.',
  },
];

interface VisualStatusPresetsProps {
  selectedPresetId?: string;
  disabled?: boolean;
  onSelectPreset: (preset: StatusPreset) => void;
}

export const VisualStatusPresets: React.FC<VisualStatusPresetsProps> = ({
  selectedPresetId,
  disabled = false,
  onSelectPreset,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-semibold text-slate-800">⚡ 1-Click Visual Status Presets:</span>
        <span className="text-[11px] text-slate-500">Tap to auto-populate reason</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STATUS_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPreset(preset)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                disabled
                  ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                  : isSelected
                  ? `${preset.bgActive} shadow-sm cursor-pointer`
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer text-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${preset.color}`} />
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div>
                <div className="text-xs font-bold leading-tight text-slate-900">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {preset.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
