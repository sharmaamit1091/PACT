import React, { useState } from 'react';
import { ActionItem } from '../types/webex';
import { validateEmployeeProgress } from '../utils/webexLogic';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  HelpCircle,
  UserCheck,
} from 'lucide-react';

interface EmployeeUpdateModalProps {
  action: ActionItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmitUpdate: (
    actionId: string,
    progressPercentage: number,
    completedDetails: string,
    pendingDetails: string,
    whyPendingReason: string,
    status: ActionItem['status']
  ) => void;
}

export const EmployeeUpdateModal: React.FC<EmployeeUpdateModalProps> = ({
  action,
  isOpen,
  onClose,
  onSubmitUpdate,
}) => {
  if (!isOpen) return null;

  const [progress, setProgress] = useState<number>(action.progressPercentage);
  const [completedText, setCompletedText] = useState<string>(action.completedDetails || '');
  const [pendingText, setPendingText] = useState<string>(action.pendingDetails || '');
  const [whyPending, setWhyPending] = useState<string>(action.whyPendingReason || '');
  const [status, setStatus] = useState<ActionItem['status']>(action.status);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submittedToast, setSubmittedToast] = useState(false);

  const quickPillPcts = [0, 25, 50, 75, 100];

  const handlePctSelect = (pct: number) => {
    setProgress(pct);
    if (pct === 100) {
      setStatus('completed');
    } else if (status === 'completed') {
      setStatus('in_progress');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate progress requirements
    const validation = validateEmployeeProgress({
      actionId: action.id,
      progressPercentage: progress,
      completedDetails: completedText,
      pendingDetails: pendingText,
      whyPendingReason: whyPending,
    });
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    const determinedStatus: ActionItem['status'] =
      progress === 100 ? 'completed' : whyPending.trim().length > 0 ? 'blocked' : 'in_progress';

    onSubmitUpdate(
      action.id,
      progress,
      completedText.trim(),
      pendingText.trim(),
      whyPending.trim(),
      determinedStatus
    );

    setSubmittedToast(true);
    setTimeout(() => {
      setSubmittedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="theme-card rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b theme-border pb-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold theme-text-main tracking-tight">
                Self-Report Progress & Blockers
              </h3>
              <p className="text-xs theme-text-muted">
                Logged individually so Manager David Chen has clear status before the meeting.
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

        {/* Task Name Box */}
        <div className="p-3.5 theme-bg-inset rounded-2xl border theme-border space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted">
            Assigned Deliverable
          </div>
          <div className="text-sm font-bold theme-text-main tracking-tight">{action.title}</div>
          <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5 pt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Due:{' '}
              {new Date(action.dueDate).toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="text-emerald-700 dark:text-emerald-400">Follow-up meeting in 1 week</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Progress Slider & Quick Selector */}
          <div className="space-y-2 theme-bg-inset p-4 rounded-2xl border theme-border">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="theme-text-main">1. Completion Percentage</label>
              <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold theme-bg-card px-3 py-1 rounded-lg border theme-border text-sm tabular-nums">
                {progress}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setProgress(val);
                if (val === 100) setStatus('completed');
                else if (status === 'completed') setStatus('in_progress');
              }}
              className="w-full accent-emerald-600 cursor-pointer h-2 theme-bg-card rounded-lg"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              {quickPillPcts.map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => handlePctSelect(pct)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                    progress === pct
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800 shadow-sm'
                      : 'theme-bg-card theme-text-muted hover:theme-text-main theme-border'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Completed Text */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold theme-text-main">
              2. What specific work is completed?
            </label>
            <textarea
              required={progress > 0}
              value={completedText}
              onChange={(e) => setCompletedText(e.target.value)}
              placeholder="e.g. Set up the webhook listener proxy, wrote unit tests, and validated card payload..."
              rows={2}
              className="w-full text-xs theme-bg-input border theme-border rounded-xl p-3 theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600 leading-relaxed"
            />
          </div>

          {/* Pending Text */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold theme-text-main">
              3. What items remain pending?
            </label>
            <textarea
              value={pendingText}
              onChange={(e) => setPendingText(e.target.value)}
              placeholder="e.g. Production firewall routing and Webex OAuth secret refresh test..."
              rows={2}
              className="w-full text-xs theme-bg-input border theme-border rounded-xl p-3 theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600 leading-relaxed"
            />
          </div>

          {/* Why Pending / Blockers */}
          {progress < 100 && (
            <div className="space-y-1.5 p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>4. Why is it pending? (Blockers / Reasons) *</span>
              </label>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                State exact reason (e.g. waiting for SecOps ticket, dependency on another team member) so your manager can unblock you.
              </p>
              <textarea
                required
                value={whyPending}
                onChange={(e) => setWhyPending(e.target.value)}
                placeholder="e.g. Waiting on SecOps team ticket #SEC-4192 for corporate webhook IP whitelist..."
                rows={2}
                className="w-full text-xs theme-bg-input border border-amber-400 dark:border-amber-700 rounded-xl p-3 theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-amber-600 leading-relaxed"
              />
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Please complete:</span>
              </div>
              <ul className="list-disc list-inside text-[11px]">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {submittedToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/70 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Status successfully saved and synced to the manager dashboard!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold theme-text-muted hover:theme-text-main transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm flex items-center space-x-2 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save & Update Manager</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
