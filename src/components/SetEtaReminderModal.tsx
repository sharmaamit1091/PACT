import React, { useState } from 'react';
import { ActionItem } from '../types/webex';
import {
  X,
  Clock,
  Bell,
  Calendar,
  CheckCircle2,
  Send,
  Zap,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Avatar } from './Avatar';

interface SetEtaReminderModalProps {
  action: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveEtaAndReminder: (
    actionId: string,
    newEta: string,
    newDueDate: string,
    reminderType: '24h_deadline' | 'instant' | 'pre_meeting',
    customNote?: string
  ) => void;
}

export const SetEtaReminderModal: React.FC<SetEtaReminderModalProps> = ({
  action,
  isOpen,
  onClose,
  onSaveEtaAndReminder,
}) => {
  if (!isOpen || !action) return null;

  const [selectedEtaPreset, setSelectedEtaPreset] = useState<string>('24h');
  const [customEtaText, setCustomEtaText] = useState<string>(action.eta || '24 hours');
  const [reminderType, setReminderType] = useState<'24h_deadline' | 'instant' | 'pre_meeting'>('24h_deadline');
  const [customNote, setCustomNote] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Quick preset calculation
  const getCalculatedDueDate = (preset: string): string => {
    const now = Date.now();
    switch (preset) {
      case '24h':
        return new Date(now + 24 * 3600 * 1000).toISOString();
      case '48h':
        return new Date(now + 48 * 3600 * 1000).toISOString();
      case '72h':
        return new Date(now + 72 * 3600 * 1000).toISOString();
      case '1week':
        return new Date(now + 7 * 24 * 3600 * 1000).toISOString();
      default:
        return action.dueDate;
    }
  };

  const handlePresetSelect = (preset: string, etaLabel: string) => {
    setSelectedEtaPreset(preset);
    setCustomEtaText(etaLabel);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDueDate = getCalculatedDueDate(selectedEtaPreset);
    onSaveEtaAndReminder(action.id, customEtaText, targetDueDate, reminderType, customNote);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div className="theme-card rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-6 relative overflow-hidden border theme-border">
        {/* Header */}
        <div className="flex items-start justify-between border-b theme-border pb-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold theme-text-main tracking-tight flex items-center gap-1.5">
                <span>Set ETA & Webex Reminder</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  cisco.com
                </span>
              </h3>
              <p className="text-xs theme-text-muted">
                Identify deliverable timeline and schedule automated Cisco Webex notifications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-main hover:theme-bg-card-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deliverable & Assignee Banner */}
        <div className="theme-bg-inset p-3.5 rounded-2xl border theme-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
              Identified Deliverable
            </span>
            <span className="text-[10px] font-mono theme-text-muted">
              Task #{action.id.slice(-6)}
            </span>
          </div>
          <div className="text-sm font-bold theme-text-main leading-snug">
            {action.title}
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t theme-border">
            <Avatar name={action.assigneeName} avatarUrl={action.assigneeAvatar} size="sm" />
            <div className="text-xs">
              <span className="font-semibold theme-text-main">{action.assigneeName}</span>
              <span className="theme-text-muted ml-1.5 font-mono text-[11px]">({action.assigneeEmail})</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Quick ETA Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold theme-text-main flex items-center justify-between">
              <span>Select ETA Timeline</span>
              <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 font-mono">
                Current: {customEtaText}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePresetSelect('24h', '24 hours (Tomorrow 5 PM)')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  selectedEtaPreset === '24h'
                    ? 'theme-accent border-emerald-500 shadow-sm'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle theme-text-secondary'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>24 Hours (Urgent)</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">Due tomorrow evening</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('48h', '48 hours (2 days)')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  selectedEtaPreset === '48h'
                    ? 'theme-accent border-emerald-500 shadow-sm'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle theme-text-secondary'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>48 Hours (2 Days)</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">Mid-cycle checkpoint</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('72h', '72 hours (3 days)')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  selectedEtaPreset === '72h'
                    ? 'theme-accent border-emerald-500 shadow-sm'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle theme-text-secondary'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>72 Hours (3 Days)</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">Standard sprint target</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('1week', '1 week (Follow-up review)')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  selectedEtaPreset === '1week'
                    ? 'theme-accent border-emerald-500 shadow-sm'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle theme-text-secondary'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1 Week (Follow-Up)</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">Next review sync</div>
              </button>
            </div>
          </div>

          {/* 2. Custom ETA input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold theme-text-secondary">
              Custom ETA Label
            </label>
            <input
              type="text"
              value={customEtaText}
              onChange={(e) => {
                setCustomEtaText(e.target.value);
                setSelectedEtaPreset('custom');
              }}
              className="w-full px-3 py-2 rounded-xl text-xs theme-bg-input theme-text-main border theme-border focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 24 hours, by Friday 3:00 PM, 5 business days..."
            />
          </div>

          {/* 3. Reminder Delivery Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold theme-text-main flex items-center justify-between">
              <span>Webex Reminder Dispatch Schedule</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Adaptive Card</span>
            </label>
            <div className="space-y-1.5">
              <label
                className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  reminderType === '24h_deadline'
                    ? 'theme-bg-card-subtle border-emerald-500/50'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle'
                }`}
              >
                <input
                  type="radio"
                  name="reminderType"
                  value="24h_deadline"
                  checked={reminderType === '24h_deadline'}
                  onChange={() => setReminderType('24h_deadline')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold theme-text-main">
                    Automated 24h Deadline Scan (Recommended)
                  </div>
                  <div className="text-[11px] theme-text-muted leading-tight mt-0.5">
                    Automatically triggers a Webex Adaptive Card reminder when 24 hours remain before the due date.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  reminderType === 'instant'
                    ? 'theme-bg-card-subtle border-emerald-500/50'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle'
                }`}
              >
                <input
                  type="radio"
                  name="reminderType"
                  value="instant"
                  checked={reminderType === 'instant'}
                  onChange={() => setReminderType('instant')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold theme-text-main">
                    Instant Notification (Immediate)
                  </div>
                  <div className="text-[11px] theme-text-muted leading-tight mt-0.5">
                    Send an immediate Webex direct message notifying the employee of this assigned ETA.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  reminderType === 'pre_meeting'
                    ? 'theme-bg-card-subtle border-emerald-500/50'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle'
                }`}
              >
                <input
                  type="radio"
                  name="reminderType"
                  value="pre_meeting"
                  checked={reminderType === 'pre_meeting'}
                  onChange={() => setReminderType('pre_meeting')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold theme-text-main">
                    Pre-Meeting Follow-Up Sync (2h Before Meeting)
                  </div>
                  <div className="text-[11px] theme-text-muted leading-tight mt-0.5">
                    Dispatches a status check reminder 2 hours prior to the 1-week follow-up review.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Optional Host Message */}
          <div className="space-y-1">
            <label className="text-xs font-semibold theme-text-secondary">
              Optional Note from Meeting Host
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs theme-bg-input theme-text-main border theme-border focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Please sync with Sarah once your API contract is ready..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold theme-text-secondary hover:theme-text-main hover:theme-bg-card-subtle transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaved}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>ETA & Reminder Scheduled!</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-white" />
                  <span>Save ETA & Schedule Webex Reminder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
