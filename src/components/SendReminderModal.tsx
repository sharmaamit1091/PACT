import React, { useState } from 'react';
import { ActionItem } from '../types/webex';
import {
  X,
  Bell,
  Clock,
  Send,
  User,
  Smartphone,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import { Avatar } from './Avatar';

interface SendReminderModalProps {
  action: ActionItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSend: (action: ActionItem, timing: 'instant' | 'due_date' | 'pre_meeting') => void;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  action,
  isOpen,
  onClose,
  onConfirmSend,
}) => {
  const [timing, setTiming] = useState<'instant' | 'due_date' | 'pre_meeting'>('instant');
  const [sentToast, setSentToast] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    onConfirmSend(action, timing);
    setSentToast(true);
    setTimeout(() => {
      setSentToast(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="theme-card rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b theme-border pb-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold theme-text-main tracking-tight">
                Send PACT Reminder
              </h3>
              <p className="text-xs theme-text-muted">
                Notify employee to report their completed work and blockers.
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

        {/* 1. WHO Receives It */}
        <div className="theme-bg-inset p-4 rounded-2xl border theme-border space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>1. WHO will receive this reminder?</span>
          </div>

          <div className="flex items-center space-x-3 theme-bg-card p-3 rounded-xl border theme-border">
            <Avatar
              name={action.assigneeName}
              email={action.assigneeEmail}
              avatarUrl={action.assigneeAvatar}
              size="md"
              status="active"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold theme-text-main">{action.assigneeName}</div>
              <div className="text-[11px] theme-text-muted truncate">{action.assigneeEmail}</div>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-md font-mono">
              Assignee
            </span>
          </div>
        </div>

        {/* 2. WHEN It Will Be Sent */}
        <div className="theme-bg-inset p-4 rounded-2xl border theme-border space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>2. WHEN will this reminder be sent?</span>
          </div>

          <div className="space-y-2">
            <label
              onClick={() => setTiming('instant')}
              className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                timing === 'instant'
                  ? 'bg-amber-100/70 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 shadow-sm'
                  : 'theme-bg-card border-transparent theme-text-secondary hover:theme-border'
              }`}
            >
              <input
                type="radio"
                name="reminder_timing"
                checked={timing === 'instant'}
                onChange={() => setTiming('instant')}
                className="mt-0.5 accent-amber-600"
              />
              <div>
                <div className="text-xs font-bold theme-text-main flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Right Now (Instant Push Notification)</span>
                </div>
                <div className="text-[11px] theme-text-muted mt-0.5">
                  Immediately delivers card into {action.assigneeName}'s Webex desktop & mobile app.
                </div>
              </div>
            </label>

            <label
              onClick={() => setTiming('due_date')}
              className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                timing === 'due_date'
                  ? 'bg-amber-100/70 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 shadow-sm'
                  : 'theme-bg-card border-transparent theme-text-secondary hover:theme-border'
              }`}
            >
              <input
                type="radio"
                name="reminder_timing"
                checked={timing === 'due_date'}
                onChange={() => setTiming('due_date')}
                className="mt-0.5 accent-amber-600"
              />
              <div>
                <div className="text-xs font-bold theme-text-main flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>24 Hours Before Deadline (Tomorrow)</span>
                </div>
                <div className="text-[11px] theme-text-muted mt-0.5">
                  Automatically dispatched when task reaches 24h threshold ({new Date(action.dueDate).toLocaleDateString()}).
                </div>
              </div>
            </label>

            <label
              onClick={() => setTiming('pre_meeting')}
              className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                timing === 'pre_meeting'
                  ? 'bg-amber-100/70 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 shadow-sm'
                  : 'theme-bg-card border-transparent theme-text-secondary hover:theme-border'
              }`}
            >
              <input
                type="radio"
                name="reminder_timing"
                checked={timing === 'pre_meeting'}
                onChange={() => setTiming('pre_meeting')}
                className="mt-0.5 accent-amber-600"
              />
              <div>
                <div className="text-xs font-bold theme-text-main flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>48 Hours Before Next Webex Meeting</span>
                </div>
                <div className="text-[11px] theme-text-muted mt-0.5">
                  Ensures all statuses and blockers are ready for the 1-week follow-up review.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 3. HOW One Will Receive It */}
        <div className="theme-bg-inset p-4 rounded-2xl border theme-border space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>3. HOW will {action.assigneeName} receive it?</span>
          </div>

          <p className="text-[11px] theme-text-muted">
            Delivered directly into Cisco Webex as an interactive <strong>Adaptive Card v1.3</strong>:
          </p>

          {/* Webex Notification Card Preview */}
          <div className="theme-bg-card border theme-border rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-[10px] theme-text-muted border-b theme-border pb-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span>🤖 Cisco Webex Reminder Bot</span>
              </span>
              <span className="font-mono">Preview</span>
            </div>
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
              ⏰ Action Required: "{action.title}"
            </div>
            <div className="text-[11px] theme-text-secondary leading-snug">
              Hi {action.assigneeName}, your manager requested a quick status check-in before the follow-up meeting. Please self-report your completed deliverables and any blockers.
            </div>
            <div className="text-[10px] theme-text-muted pt-0.5 flex flex-wrap items-center gap-2">
              <span>Due Date: <strong className="theme-text-main">{new Date(action.dueDate).toLocaleDateString()}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Completion: <strong className="text-emerald-700 dark:text-emerald-300 font-mono">{action.progressPercentage}%</strong></span>
            </div>
            <div className="pt-1">
              <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-bold text-[10px] rounded-lg shadow-sm">
                Fill Progress & Blocker Report
              </span>
            </div>
          </div>
        </div>

        {sentToast && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Reminder scheduled and sent to {action.assigneeName} on Webex!</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-2.5 pt-2 border-t theme-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold theme-text-muted hover:theme-text-main transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-sm flex items-center space-x-2 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Confirm & Send on Webex</span>
          </button>
        </div>
      </div>
    </div>
  );
};
