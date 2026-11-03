import React, { useState } from 'react';
import {
  MeetingAISummary,
  ActionItem,
  WebexSpace,
} from '../types/webex';
import {
  aggregateMeetingProgress,
  generateMeetingRecapBrief,
} from '../utils/webexLogic';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Video,
  UserCheck,
  Share2,
} from 'lucide-react';
import { Avatar } from './Avatar';

interface MeetingBriefingViewProps {
  summary: MeetingAISummary;
  actions: ActionItem[];
  spaces: WebexSpace[];
  onDispatchBriefToSpace: (roomId: string, message: string) => void;
  onOpenEmployeeUpdate: (action: ActionItem) => void;
  onStartMeeting: () => void;
}

export const MeetingBriefingView: React.FC<MeetingBriefingViewProps> = ({
  summary,
  actions,
  spaces,
  onDispatchBriefToSpace,
  onOpenEmployeeUpdate,
  onStartMeeting,
}) => {
  const [copied, setCopied] = useState(false);
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);
  const [targetSpaceId, setTargetSpaceId] = useState<string>(spaces[0]?.id || '');

  const stats = aggregateMeetingProgress(actions);
  const briefText = generateMeetingRecapBrief(summary, actions);

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatch = () => {
    onDispatchBriefToSpace(targetSpaceId, briefText);
    const targetSpace = spaces.find((s) => s.id === targetSpaceId);
    setDispatchToast(`Meeting recap shared to Webex space "${targetSpace?.title || 'space'}"!`);
    setTimeout(() => setDispatchToast(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto theme-bg-app p-5 md:p-7 space-y-6 transition-colors duration-200">
      {/* Top Banner */}
      <div className="theme-card rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5 text-xs theme-text-muted">
              <span className="font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/60 font-mono text-[10px]">
                Executive Briefing Pack
              </span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                AI Meeting Summary & Action Sync
              </span>
            </div>

            <h2 className="text-xl font-extrabold theme-text-main tracking-tight">
              Follow-Up Meeting Prep (1-Week Mid-Cycle Review)
            </h2>
            <p className="text-xs theme-text-secondary max-w-2xl leading-relaxed">
              Synthesized review of commitments made in the last meeting, what each team member has finished, and the specific blockers pending resolution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleCopyBrief}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold theme-bg-card hover:theme-bg-card-subtle theme-text-main border theme-border transition-all active:scale-95 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Meeting Brief'}</span>
            </button>

            <button
              onClick={onStartMeeting}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm transition-all active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Start Webex Follow-Up Call</span>
            </button>
          </div>
        </div>

        {/* Meeting Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t theme-border">
          <div className="theme-bg-inset p-4 rounded-xl border theme-border space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Previous Webex Kickoff Meeting</span>
            </div>
            <div className="text-sm font-bold theme-text-main mt-1">{summary.meetingTitle}</div>
            <div className="text-xs theme-text-muted">Host: {summary.hostName}</div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/70 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Scheduled Follow-Up Meeting (In 1 Week)</span>
            </div>
            <div className="text-sm font-bold theme-text-main mt-1">{summary.nextFollowUpMeetingTitle}</div>
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              Date: {new Date(summary.nextFollowUpMeetingDate).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {dispatchToast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center space-x-2.5 shadow-md animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{dispatchToast}</span>
        </div>
      )}

      {/* Part 1: What was discussed in last meeting */}
      <div className="theme-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider">
            1. What We Discussed in Last Meeting
          </h3>
        </div>

        <div className="theme-bg-inset p-4 rounded-xl border theme-border text-xs theme-text-secondary leading-relaxed font-normal">
          {summary.executiveSummary}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="theme-bg-inset p-4 rounded-xl border theme-border space-y-2">
            <div className="text-xs font-bold theme-text-main">Key Points Discussed:</div>
            <ul className="space-y-1.5 text-xs theme-text-secondary">
              {summary.keyDiscussions.map((point, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="theme-bg-inset p-4 rounded-xl border theme-border space-y-2">
            <div className="text-xs font-bold theme-text-main">Decisions & Agreed Deadlines:</div>
            <ul className="space-y-1.5 text-xs theme-text-secondary">
              {summary.identifiedDecisions.map((dec, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{dec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Part 2: Who has to do what, what is done, what is pending, and why pending */}
      <div className="theme-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold theme-text-main uppercase tracking-wider">
              2. Individual Deliverable Status & Blocker Audit
            </h3>
          </div>
          <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
            {stats.completionRate}% Delivered
          </span>
        </div>

        <div className="space-y-3.5">
          {actions.map((act) => (
            <div key={act.id} className="theme-bg-inset rounded-2xl border theme-border p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Avatar
                    name={act.assigneeName}
                    email={act.assigneeEmail}
                    avatarUrl={act.assigneeAvatar}
                    size="sm"
                    status="active"
                  />
                  <div>
                    <span className="text-xs font-bold theme-text-main">{act.assigneeName}: </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{act.title}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 font-mono">
                    Due: {new Date(act.dueDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => onOpenEmployeeUpdate(act)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold theme-bg-card hover:theme-bg-card-subtle theme-text-main border theme-border transition-colors"
                  >
                    Edit Status
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] theme-text-muted">
                  <span>Self-Reported Progress</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">{act.progressPercentage}%</span>
                </div>
                <div className="w-full h-1.5 theme-bg-card rounded-full overflow-hidden border theme-border">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      act.status === 'completed'
                        ? 'bg-emerald-600'
                        : act.status === 'blocked'
                        ? 'bg-rose-500'
                        : 'bg-emerald-600 dark:bg-emerald-400'
                    }`}
                    style={{ width: `${act.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* 3 Detail Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 theme-bg-card rounded-xl border theme-border space-y-1">
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    ✓ Completed:
                  </div>
                  <div className="text-[11px] theme-text-secondary leading-relaxed">
                    {act.completedDetails || 'Not specified'}
                  </div>
                </div>

                <div className="p-3 theme-bg-card rounded-xl border theme-border space-y-1">
                  <div className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                    ⏳ Remaining / Pending:
                  </div>
                  <div className="text-[11px] theme-text-secondary leading-relaxed">
                    {act.pendingDetails || (act.status === 'completed' ? 'None' : 'In progress')}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border space-y-1 ${
                    act.whyPendingReason
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                      : 'theme-bg-card theme-border'
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      act.whyPendingReason ? 'text-amber-800 dark:text-amber-300' : 'theme-text-muted'
                    }`}
                  >
                    ⚠️ Why Pending (Blockers):
                  </div>
                  <div
                    className={`text-[11px] leading-relaxed ${
                      act.whyPendingReason ? 'text-amber-900 dark:text-amber-200 font-medium' : 'theme-text-muted'
                    }`}
                  >
                    {act.whyPendingReason || 'No blockers reported'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share to Webex Space Bar */}
      <div className="theme-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="text-xs theme-text-secondary flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold theme-text-main">Broadcast Brief to Webex Space:</span>
            <span className="theme-text-muted ml-1.5">Deliver recap to all attendees before the meeting.</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={targetSpaceId}
            onChange={(e) => setTargetSpaceId(e.target.value)}
            className="text-xs theme-bg-input border theme-border rounded-xl px-3 py-2 theme-text-main focus:outline-none cursor-pointer"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleDispatch}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            Post to Webex
          </button>
        </div>
      </div>
    </div>
  );
};
