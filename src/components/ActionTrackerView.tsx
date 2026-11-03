import React, { useState } from 'react';
import {
  ActionItem,
  MeetingAISummary,
  WebexUser,
  ReminderJobLog,
} from '../types/webex';
import {
  calculateTaskUrgency,
  aggregateMeetingProgress,
} from '../utils/webexLogic';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Bell,
  Search,
  Filter,
  ArrowRight,
  Edit3,
  Calendar,
  Sparkles,
  ShieldAlert,
  Send,
  Plus,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import { EmployeeUpdateModal } from './EmployeeUpdateModal';
import { SendReminderModal } from './SendReminderModal';
import { BackgroundJobController } from './BackgroundJobController';
import { Avatar } from './Avatar';

interface ActionTrackerViewProps {
  actionItems: ActionItem[];
  meetingSummary: MeetingAISummary;
  currentUser: WebexUser;
  activeRole: 'host' | 'manager' | 'employee';
  onUpdateActionItem: (
    actionId: string,
    progressPercentage: number,
    completedDetails: string,
    pendingDetails: string,
    whyPendingReason: string,
    status: ActionItem['status']
  ) => void;
  onSendWebexReminder: (action: ActionItem) => void;
  onNavigateToBriefing: () => void;
  onAddNewAction: (title: string, assigneeName: string, assigneeEmail: string, dueDate: string) => void;
  jobEnabled: boolean;
  onToggleJob: () => void;
  onForceRunJob: () => void;
  jobCountdown: number;
  lastJobRunTime: string | null;
  jobLogs: ReminderJobLog[];
  jobTriggeredCount: number;
  externalSelectedAction?: ActionItem | null;
  onClearExternalAction?: () => void;
}

export const ActionTrackerView: React.FC<ActionTrackerViewProps> = ({
  actionItems,
  meetingSummary,
  currentUser,
  activeRole,
  onUpdateActionItem,
  onSendWebexReminder,
  onNavigateToBriefing,
  onAddNewAction,
  jobEnabled,
  onToggleJob,
  onForceRunJob,
  jobCountdown,
  lastJobRunTime,
  jobLogs,
  jobTriggeredCount,
  externalSelectedAction,
  onClearExternalAction,
}) => {
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActionForUpdate, setSelectedActionForUpdate] = useState<ActionItem | null>(null);
  const [selectedActionForReminder, setSelectedActionForReminder] = useState<ActionItem | null>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const activeUpdateAction = selectedActionForUpdate || externalSelectedAction;
  const handleCloseUpdate = () => {
    setSelectedActionForUpdate(null);
    if (onClearExternalAction) onClearExternalAction();
  };

  // New action form state
  const [newTitle, setNewTitle] = useState('');
  const [newAssigneeEmail, setNewAssigneeEmail] = useState('sharma.amit1091@gmail.com');
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10));

  const stats = aggregateMeetingProgress(actionItems);

  // Filter actions
  const filteredActions = actionItems.filter((act) => {
    if (filterAssignee !== 'all' && act.assigneeEmail !== filterAssignee) return false;

    const urgency = calculateTaskUrgency(act.dueDate, act.nextMeetingDate);
    if (filterStatus === 'due_tomorrow' && urgency !== 'due_tomorrow') return false;
    if (filterStatus === 'pending' && act.status === 'completed') return false;
    if (filterStatus === 'blocked' && act.status !== 'blocked') return false;
    if (filterStatus === 'completed' && act.status !== 'completed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchAssignee = act.assigneeName.toLowerCase().includes(q);
      const matchWhy = act.whyPendingReason?.toLowerCase().includes(q);
      const matchComp = act.completedDetails?.toLowerCase().includes(q);
      const matchPend = act.pendingDetails?.toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchWhy && !matchComp && !matchPend) {
        return false;
      }
    }

    return true;
  });

  const handleSendReminderClick = (action: ActionItem) => {
    setSelectedActionForReminder(action);
  };

  const handleConfirmSendReminder = (action: ActionItem, timing: string, note?: string) => {
    onSendWebexReminder(action);
    setSelectedActionForReminder(null);
    setReminderToast(`Webex reminder dispatched to ${action.assigneeName} via Webex Adaptive Card.`);
    setTimeout(() => setReminderToast(null), 5000);
  };

  const handleCreateActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const assigneeName =
      newAssigneeEmail === 'sharma.amit1091@gmail.com'
        ? 'Amit Sharma'
        : newAssigneeEmail === 'sarah.lin@companya.enterprise.com'
        ? 'Sarah Lin'
        : 'Marcus Vance';

    onAddNewAction(newTitle.trim(), assigneeName, newAssigneeEmail, new Date(newDueDate).toISOString());
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto theme-bg-app p-5 md:p-7 space-y-6 transition-colors duration-200">
      {/* Executive Meeting Context Header Banner */}
      <div className="theme-card rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5 text-xs theme-text-muted">
              <span className="font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800/60 font-mono text-[10px]">
                {activeRole === 'manager' ? 'Executive Manager Board' : 'Employee Self-Reporting'}
              </span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Follow-up meeting in 1 week (Deliverables due before then)
              </span>
            </div>

            <h2 className="text-xl font-extrabold theme-text-main tracking-tight">
              {activeRole === 'manager'
                ? 'Meeting Commitments & Mid-Cycle Deliverables'
                : 'My Deliverables & Progress Self-Reporting'}
            </h2>
            <p className="text-xs theme-text-secondary max-w-2xl leading-relaxed">
              {activeRole === 'manager'
                ? 'Review what team members have completed, what is pending, and why tasks are delayed before next week’s Webex follow-up meeting.'
                : 'Keep your manager updated by self-reporting what you have completed, what is pending, and any blockers you are facing.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold theme-bg-card hover:theme-bg-card-subtle theme-text-main border theme-border transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Add Deliverable</span>
            </button>

            <button
              onClick={onNavigateToBriefing}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm transition-all active:scale-95"
            >
              <span>View 1-Week Follow-Up Prep</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Automated 24h Deadline Reminder Background Job Simulation */}
      <BackgroundJobController
        jobEnabled={jobEnabled}
        onToggleJob={onToggleJob}
        onForceRunJob={onForceRunJob}
        countdownSeconds={jobCountdown}
        lastRunTime={lastJobRunTime}
        logs={jobLogs}
        triggeredCount={jobTriggeredCount}
      />

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Progress */}
        <div className="theme-card rounded-2xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-xs theme-text-muted font-medium">
            <span>Overall Completion</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
              {stats.completionRate}%
            </span>
            <span className="text-xs theme-text-muted">average</span>
          </div>
          <div className="w-full theme-bg-inset h-2 rounded-full overflow-hidden border theme-border">
            <div
              className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="text-[11px] theme-text-muted font-medium">
            {stats.completed} of {stats.total} commitments signed off
          </div>
        </div>

        {/* Card 2: Due Tomorrow */}
        <div className="theme-card rounded-2xl p-4.5 space-y-2 border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
            <span>Due Tomorrow (24h)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-800 dark:text-amber-300 font-mono tabular-nums">1</span>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Urgent</span>
          </div>
          <div className="text-[11px] theme-text-main font-semibold truncate">
            Amit Sharma · API Service
          </div>
          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            Automated bot reminder dispatched
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="theme-card rounded-2xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-xs theme-text-muted font-medium">
            <span>In Progress</span>
            <Clock className="w-3.5 h-3.5 theme-text-muted" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold theme-text-main font-mono tabular-nums">
              {stats.inProgress}
            </span>
            <span className="text-xs theme-text-muted">deliverables</span>
          </div>
          <div className="text-[11px] theme-text-muted">Actively being worked on</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Sarah Lin & Amit Sharma</div>
        </div>

        {/* Card 4: Blocked / Delayed */}
        <div className="theme-card rounded-2xl p-4.5 space-y-2 border-rose-300 dark:border-rose-900/80 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
            <span>Blocked / Delayed</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-700 dark:text-rose-300 font-mono tabular-nums">
              {stats.pendingWithBlockers.length}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Requires Manager</span>
          </div>
          <div className="text-[11px] theme-text-main font-medium truncate">
            SecOps clearance needed
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
            Address before follow-up call
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 theme-card p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, assignees, blockers..."
              className="w-full pl-8 pr-3 py-1.5 theme-bg-input border theme-border rounded-xl text-xs theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="theme-bg-input border theme-border text-xs theme-text-main rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Deliverables</option>
            <option value="due_tomorrow">⏰ Due Tomorrow (Within 24h)</option>
            <option value="pending">Pending Items</option>
            <option value="blocked">Blocked Deliverables</option>
            <option value="completed">Completed Deliverables</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="theme-bg-input border theme-border text-xs theme-text-main rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Team Members</option>
            <option value="sharma.amit1091@gmail.com">Amit Sharma</option>
            <option value="sarah.lin@companya.enterprise.com">Sarah Lin</option>
            <option value="marcus.vance@companya.enterprise.com">Marcus Vance</option>
          </select>
        </div>

        <div className="text-xs theme-text-muted px-2 font-medium">
          Showing <strong className="theme-text-main font-mono">{filteredActions.length}</strong> of {actionItems.length} items
        </div>
      </div>

      {reminderToast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center space-x-2.5 shadow-md animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{reminderToast}</span>
        </div>
      )}

      {/* Deliverable Cards */}
      <div className="space-y-4">
        {filteredActions.map((action) => {
          const urgency = calculateTaskUrgency(action.dueDate, action.nextMeetingDate);
          const isDueTomorrow = urgency === 'due_tomorrow';

          return (
            <div
              key={action.id}
              className={`theme-card rounded-2xl p-5 transition-all duration-200 space-y-4 ${
                isDueTomorrow
                  ? 'border-amber-400 dark:border-amber-700 shadow-sm'
                  : action.status === 'blocked'
                  ? 'border-rose-400 dark:border-rose-800'
                  : action.status === 'completed'
                  ? 'border-emerald-300 dark:border-emerald-800'
                  : 'theme-border'
              }`}
            >
              {/* Header: Task Name, Assignee & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <Avatar
                    name={action.assigneeName}
                    email={action.assigneeEmail}
                    avatarUrl={action.assigneeAvatar}
                    size="md"
                    status="active"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold theme-text-main tracking-tight">{action.title}</h3>
                      {isDueTomorrow && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 uppercase font-mono flex items-center gap-1">
                          ⏰ Due Tomorrow!
                        </span>
                      )}
                      {action.status === 'blocked' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800 uppercase font-mono">
                          🛑 Blocked
                        </span>
                      )}
                      {action.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800 uppercase font-mono">
                          ✅ Completed
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs theme-text-muted mt-1.5">
                      <span className="theme-text-main font-semibold">
                        Assigned to: {action.assigneeName}
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Due Date: {new Date(action.dueDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Follow-Up Meeting: In 1 week
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  {activeRole === 'manager' && (
                    <button
                      onClick={() => handleSendReminderClick(action)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold theme-bg-card hover:theme-bg-card-subtle theme-text-secondary border theme-border transition-all active:scale-95 shadow-sm"
                      title="Send a Webex reminder card to this employee"
                    >
                      <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Send Reminder</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedActionForUpdate(action)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm transition-all active:scale-95"
                    title="Employee self-reporting form"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update My Status</span>
                  </button>
                </div>
              </div>

              {/* Progress Gauge */}
              <div className="theme-bg-inset p-3 rounded-xl border theme-border space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="theme-text-muted font-medium">Self-Reported Completion:</span>
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 font-mono tabular-nums">
                    {action.progressPercentage}%
                  </span>
                </div>
                <div className="w-full h-2 theme-bg-card rounded-full overflow-hidden border theme-border">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      action.status === 'completed'
                        ? 'bg-emerald-600'
                        : action.status === 'blocked'
                        ? 'bg-rose-500'
                        : 'bg-emerald-600 dark:bg-emerald-400'
                    }`}
                    style={{ width: `${action.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Three Clear Q&A Sections: Completed, Pending, Why Pending */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* 1. What is completed */}
                <div className="theme-bg-inset p-3.5 rounded-xl border theme-border space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>1. What is Completed</span>
                  </div>
                  <p className="theme-text-secondary text-[11px] leading-relaxed">
                    {action.completedDetails || 'No completed items logged yet.'}
                  </p>
                </div>

                {/* 2. What is pending */}
                <div className="theme-bg-inset p-3.5 rounded-xl border theme-border space-y-1.5">
                  <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>2. What is Pending</span>
                  </div>
                  <p className="theme-text-secondary text-[11px] leading-relaxed">
                    {action.pendingDetails || (action.status === 'completed' ? 'Nothing pending. Deliverable completed.' : 'In progress.')}
                  </p>
                </div>

                {/* 3. Why pending / blockers */}
                <div
                  className={`p-3.5 rounded-xl border space-y-1.5 ${
                    action.whyPendingReason
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                      : 'theme-bg-inset theme-border'
                  }`}
                >
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      action.whyPendingReason ? 'text-amber-800 dark:text-amber-300' : 'theme-text-muted'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>3. Why Pending (Blockers)</span>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      action.whyPendingReason ? 'text-amber-900 dark:text-amber-200 font-medium' : 'theme-text-muted'
                    }`}
                  >
                    {action.whyPendingReason || 'No blockers reported.'}
                  </p>
                </div>
              </div>

              {action.lastUpdated && (
                <div className="text-[11px] theme-text-muted text-right font-medium">
                  Status self-reported by {action.assigneeName} at{' '}
                  <span className="font-mono theme-text-secondary">
                    {new Date(action.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Employee Update Modal */}
      {activeUpdateAction && (
        <EmployeeUpdateModal
          action={activeUpdateAction}
          isOpen={Boolean(activeUpdateAction)}
          onClose={handleCloseUpdate}
          onSubmitUpdate={(actionId, pct, comp, pend, why, stat) => {
            onUpdateActionItem(actionId, pct, comp, pend, why, stat);
          }}
        />
      )}

      {/* Send Reminder Schedule Modal */}
      {selectedActionForReminder && (
        <SendReminderModal
          action={selectedActionForReminder}
          isOpen={Boolean(selectedActionForReminder)}
          onClose={() => setSelectedActionForReminder(null)}
          onConfirmSend={handleConfirmSendReminder}
        />
      )}

      {/* Add New Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="theme-card rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold theme-text-main tracking-tight">Add New Meeting Action Item</h3>
            <form onSubmit={handleCreateActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Deliverable Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Deliver integration test harness"
                  className="w-full text-xs theme-bg-input border theme-border rounded-xl px-3 py-2 theme-text-main focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">Assignee</label>
                <select
                  value={newAssigneeEmail}
                  onChange={(e) => setNewAssigneeEmail(e.target.value)}
                  className="w-full text-xs theme-bg-input border theme-border rounded-xl px-3 py-2 theme-text-main focus:outline-none focus:border-emerald-600"
                >
                  <option value="sharma.amit1091@gmail.com">Amit Sharma (Software Engineer)</option>
                  <option value="sarah.lin@companya.enterprise.com">Sarah Lin (Tech Lead)</option>
                  <option value="marcus.vance@companya.enterprise.com">Marcus Vance (Architect)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full text-xs theme-bg-input border theme-border rounded-xl px-3 py-2 theme-text-main focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t theme-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs theme-text-muted hover:theme-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95"
                >
                  Save Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
