import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Send,
  Sparkles,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  MessageSquare,
  BellRing,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Info,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Zap,
  TrendingUp,
  Video,
} from 'lucide-react';
import {
  ActionItem,
  MeetingAISummary,
  WebexEmployeeProfile,
  MeetingTranscript,
  ReminderRecord,
} from '../types/webex';
import { calculateTaskUrgency } from '../utils/webexLogic';
import { CiscoAttendeesModal } from './CiscoAttendeesModal';
import { SetEtaReminderModal } from './SetEtaReminderModal';
import { VisualPipeline } from './VisualPipeline';
import { VisualProgressGauge } from './VisualProgressGauge';
import { VisualEmployeeRoster } from './VisualEmployeeRoster';

export interface ProjectManagerDashboardProps {
  actionItems: ActionItem[];
  meetingSummary: MeetingAISummary;
  employees: WebexEmployeeProfile[];
  transcripts: MeetingTranscript[];
  reminderRecords: ReminderRecord[];
  onConfirmAmbiguousTask: (taskId: string, assignee: WebexEmployeeProfile) => void;
  onSendManualReminder: (task: ActionItem, channel: string, customNote?: string) => void;
  onRunAiAnalysis: (transcriptId: string) => void;
  onNavigateToEmployeeView: (employeeId: string) => void;
  onFetchWebexData?: () => void;
  isFetchingWebex?: boolean;
  onUpdateTaskEta?: (
    taskId: string,
    eta: string,
    dueDate: string,
    reminderType: '24h_deadline' | 'instant' | 'pre_meeting',
    customNote?: string
  ) => void;
}

export const HostDashboard: React.FC<ProjectManagerDashboardProps> = ({
  actionItems,
  meetingSummary,
  employees,
  transcripts,
  reminderRecords,
  onConfirmAmbiguousTask,
  onSendManualReminder,
  onRunAiAnalysis,
  onNavigateToEmployeeView,
  onFetchWebexData,
  isFetchingWebex = false,
  onUpdateTaskEta,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string>(transcripts[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [reminderModalTask, setReminderModalTask] = useState<ActionItem | null>(null);
  const [reminderChannel, setReminderChannel] = useState<string>('Webex Direct Message');
  const [reminderCustomNote, setReminderCustomNote] = useState<string>('');
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState<boolean>(false);
  const [etaModalTask, setEtaModalTask] = useState<ActionItem | null>(null);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(1);

  // Calculations
  const totalTasks = actionItems.length;
  const completedTasks = actionItems.filter(
    (t) => t.status === 'completed' || t.progressPercentage === 100
  ).length;
  const inProgressTasks = actionItems.filter(
    (t) => t.status === 'in_progress' && t.progressPercentage < 100 && !t.needsPmReview
  ).length;
  const pendingTasks = actionItems.filter(
    (t) => t.status === 'pending' && !t.needsPmReview
  ).length;
  const overdueTasks = actionItems.filter((t) => {
    if (t.status === 'completed' || t.progressPercentage === 100) return false;
    const urg = calculateTaskUrgency(t.dueDate, t.nextMeetingDate);
    return urg === 'overdue' || urg === 'due_today' || urg === 'due_tomorrow';
  }).length;
  const ambiguousTasks = actionItems.filter((t) => t.needsPmReview);
  const helpRequests = actionItems.filter((t) => t.helpRequested && t.helpMessage);

  // Filtered task list
  const filteredTasks = actionItems.filter((task) => {
    if (statusFilter === 'completed' && task.progressPercentage !== 100) return false;
    if (statusFilter === 'in_progress' && (task.progressPercentage === 100 || task.status !== 'in_progress'))
      return false;
    if (statusFilter === 'overdue') {
      const urg = calculateTaskUrgency(task.dueDate, task.nextMeetingDate);
      if (urg !== 'overdue' && urg !== 'due_today' && urg !== 'due_tomorrow') return false;
    }
    if (statusFilter === 'needs_review' && !task.needsPmReview) return false;
    if (statusFilter === 'help' && !task.helpRequested) return false;

    if (employeeFilter !== 'all' && task.assigneeId !== employeeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchAssignee = task.assigneeName.toLowerCase().includes(q);
      const matchDeliverable = (task.deliverable || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchDeliverable) return false;
    }

    return true;
  });

  const handleRunAnalysisClick = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      onRunAiAnalysis(selectedTranscriptId);
      setIsAnalyzing(false);
    }, 900);
  };

  const handleConfirmTask = (taskId: string, empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      onConfirmAmbiguousTask(taskId, emp);
    }
  };

  const handleDispatchReminder = () => {
    if (reminderModalTask) {
      onSendManualReminder(reminderModalTask, reminderChannel, reminderCustomNote);
      setReminderModalTask(null);
      setReminderCustomNote('');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900/60 p-4 lg:p-8 space-y-6">
      {/* Top Visual Header & Action Center */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> cisco.com Domain
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
              <Video className="w-3.5 h-3.5" /> Webex Host Console
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Host Read-Only Mode
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">
            PACT · Meeting Host Supervisor
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold italic">
              "From Meetings to Actions. From Actions to Results."
            </span>
            <span>·</span>
            <span className="text-slate-400">
              Next Review: {new Date(meetingSummary.nextFollowUpMeetingDate).toLocaleDateString()}
            </span>
          </p>
        </div>

        {/* Visual Quick Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onFetchWebexData}
            disabled={isFetchingWebex}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingWebex ? 'animate-spin' : ''}`} />
            {isFetchingWebex ? 'Syncing...' : '🔄 Fetch Webex Data'}
          </button>

          <button
            type="button"
            onClick={() => setIsAttendeesModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>👥 5,240 Attendees</span>
          </button>

          <button
            type="button"
            onClick={handleRunAnalysisClick}
            disabled={isAnalyzing}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Extracting...' : '⚡ AI Action Extraction'}
          </button>
        </div>
      </div>

      {/* 1. VISUAL WORKFLOW PIPELINE */}
      <VisualPipeline
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        inProgressTasks={inProgressTasks}
        ambiguousCount={ambiguousTasks.length}
        attendeesCount={employees.length}
        activeStep={activePipelineStep}
        onStepClick={(idx) => {
          setActivePipelineStep(idx);
          if (idx === 0) setStatusFilter('all');
          if (idx === 1 && ambiguousTasks.length > 0) setStatusFilter('needs_review');
          if (idx === 3) setStatusFilter('in_progress');
          if (idx === 4) setStatusFilter('overdue');
        }}
      />

      {/* 2. VISUAL HEALTH GAUGE & INTERACTIVE METRIC CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: SVG Radial Progress Ring */}
        <div className="lg:col-span-5">
          <VisualProgressGauge
            completed={completedTasks}
            inProgress={inProgressTasks}
            pending={pendingTasks}
            overdue={overdueTasks}
            total={totalTasks}
          />
        </div>

        {/* Right: 4 Interactive Visual Filter Tiles */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800/90 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>All Tasks</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-black text-slate-100 my-1">{totalTasks}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>Webex commitments</span>
            </div>
          </button>

          {/* Completed */}
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/30 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
              <span>Done (100%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 my-1">{completedTasks}</div>
            <div className="text-[10px] text-emerald-400/80">
              {Math.round((completedTasks / (totalTasks || 1)) * 100)}% verified
            </div>
          </button>

          {/* In Progress */}
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              statusFilter === 'in_progress'
                ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-sky-500/30 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-sky-400 font-bold">
              <span>In Progress</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-black text-sky-300 my-1">{inProgressTasks}</div>
            <div className="text-[10px] text-sky-400/80">Active 10% steps</div>
          </button>

          {/* Urgent / Overdue */}
          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              statusFilter === 'overdue'
                ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/30 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
              <span>Urgent (24h)</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-rose-400 my-1">{overdueTasks}</div>
            <div className="text-[10px] text-rose-400/80">Requires attention</div>
          </button>
        </div>
      </div>

      {/* 3. VISUAL TEAM ROSTER WITH MICRO-PROGRESS BARS */}
      <VisualEmployeeRoster
        employees={employees}
        actionItems={actionItems}
        onSelectEmployee={(emp) => onNavigateToEmployeeView(emp.id)}
        onNudgeEmployee={(task) => setReminderModalTask(task)}
      />

      {/* 4. VISUAL AI TRANSCRIPT SELECTOR BAR */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              AI Transcript Pipeline
            </div>
            <div className="text-[11px] text-slate-400">
              Extracts actionable commitments from host & shared transcripts
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTranscriptId}
            onChange={(e) => setSelectedTranscriptId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {transcripts.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.meetingTitle} ({tr.participantCount} attendees · {tr.sharedBy})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRunAnalysisClick}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Re-Run'}</span>
          </button>
        </div>
      </div>

      {/* Ambiguous Tasks Requiring Host Confirmation (Visual Banner) */}
      {ambiguousTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-orange-950/30 border border-orange-500/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>{ambiguousTasks.length} Commitments Need Assignee Confirmation</span>
            </div>
            <span className="text-xs text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ambiguousTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-orange-500/30 flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-orange-400 uppercase tracking-wide">
                      Uncertain Assignee
                    </span>
                    <span className="text-slate-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm mt-1">{task.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleConfirmTask(task.id, e.target.value);
                      }
                    }}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer"
                  >
                    <option value="" disabled>
                      Assign to verified Cisco employee...
                    </option>
                    {employees.slice(0, 20).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.displayName} ({emp.role} · {emp.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Help & Blocker Alerts */}
      {helpRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-rose-400">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Direct Employee Help Requests ({helpRequests.length})</span>
            </div>
            <span className="text-xs bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
              Host Review
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {helpRequests.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/20 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200">{task.assigneeName}</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-semibold border border-rose-500/30">
                      {task.helpMessage?.subject || 'Assistance'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-rose-300">"{task.title}"</div>
                  <div className="text-xs text-slate-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800 mt-1.5">
                    "{task.helpMessage?.detail || task.whyPendingReason || 'Help requested'}"
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onNavigateToEmployeeView(task.assigneeId)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Task</span>
                    <ArrowRight className="w-3 h-3 text-sky-400" />
                  </button>
                  <button
                    onClick={() => setReminderModalTask(task)}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Reply in Webex</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. VISUAL TASK DIRECTORY */}
      <div className="space-y-3">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverable or assignee..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">All Assignees</option>
              {employees.slice(0, 15).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-200">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-200">{totalTasks}</strong> tasks
          </div>
        </div>

        {/* Task Cards List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
              No action items match the selected filter criteria.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const urgency = calculateTaskUrgency(task.dueDate, task.nextMeetingDate);
              const isCompleted = task.status === 'completed' || task.progressPercentage === 100;
              const isBlocked = task.status === 'blocked' || Boolean(task.helpRequested);
              const isDueTomorrow = urgency === 'due_tomorrow' || urgency === 'due_today';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-900/70 border-emerald-500/30 shadow-sm'
                      : isBlocked
                      ? 'bg-slate-900/80 border-rose-500/40 shadow-sm'
                      : isDueTomorrow
                      ? 'bg-slate-900/80 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Done
                          </span>
                        ) : isBlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Blocked
                          </span>
                        ) : isDueTomorrow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Due in 24h
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            In Progress
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                          {task.priority || 'Medium'} Priority
                        </span>

                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          ETA: {task.eta || '24h'}
                        </span>

                        <span className="text-xs text-slate-400">
                          Due: <strong className="text-slate-200">{new Date(task.dueDate).toLocaleDateString()}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-100">{task.title}</h3>

                      {task.deliverable && (
                        <p className="text-xs text-slate-300">
                          <strong className="text-slate-400 font-medium">Deliverable:</strong> {task.deliverable}
                        </p>
                      )}

                      {/* Visual Dependency Tag */}
                      {task.dependencies && task.dependencies.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-500/30 w-fit">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Linked Dependency:</span>
                          <strong className="text-indigo-200">
                            {task.dependencies.map((d) => d.taskOrPerson).join(', ')}
                          </strong>
                        </div>
                      )}

                      {/* Reasons Reported by Employee */}
                      {task.whyPendingReason && (
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                          <div className="flex items-center gap-1 font-semibold text-amber-400">
                            <Info className="w-3.5 h-3.5" />
                            <span>Employee Status Note:</span>
                          </div>
                          <p className="italic text-slate-200">"{task.whyPendingReason}"</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Assignee Card & Visual 10-Pip Meter */}
                    <div className="lg:w-80 flex flex-col justify-between space-y-3 pt-3 lg:pt-0 lg:border-l lg:border-slate-800 lg:pl-5">
                      {/* Assignee Card */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={task.assigneeAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={task.assigneeName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-200">{task.assigneeName}</div>
                            <div className="text-[10px] text-slate-400">{task.assigneeEmail}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => onNavigateToEmployeeView(task.assigneeId)}
                          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Visual 10-Segment Pip Meter (Host Read-Only) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 flex items-center gap-1 font-medium">
                            Progress <Lock className="w-3 h-3 text-amber-400" />
                          </span>
                          <span className="font-extrabold text-slate-100">{task.progressPercentage}%</span>
                        </div>

                        {/* 10-pip visual segments */}
                        <div className="grid grid-cols-10 gap-1">
                          {Array.from({ length: 10 }).map((_, i) => {
                            const pipVal = (i + 1) * 10;
                            const isFilled = task.progressPercentage >= pipVal;
                            return (
                              <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isFilled
                                    ? isCompleted
                                      ? 'bg-emerald-400'
                                      : isBlocked
                                      ? 'bg-rose-500'
                                      : isDueTomorrow
                                      ? 'bg-amber-400'
                                      : 'bg-sky-400'
                                    : 'bg-slate-800'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEtaModalTask(task)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          Set ETA
                        </button>
                        <button
                          type="button"
                          onClick={() => setReminderModalTask(task)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5 text-sky-400" />
                          Remind
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. VISUAL REMINDER DELIVERY LOG */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-slate-200 text-sm">
              Automated Webex Reminder Delivery Feed ({reminderRecords.length})
            </h3>
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Dispatches Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 font-medium">Task</th>
                <th className="pb-2 font-medium">Trigger Type</th>
                <th className="pb-2 font-medium">Channel</th>
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {reminderRecords.slice(0, 8).map((record) => (
                <tr key={record.id} className="text-slate-300">
                  <td className="py-2.5 font-bold text-slate-200">{record.employeeName}</td>
                  <td className="py-2.5 max-w-[220px] truncate text-slate-400">{record.taskTitle}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {record.reminderType}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400">{record.channel}</td>
                  <td className="py-2.5 text-slate-500">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Reminder Modal */}
      {reminderModalTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-base">Send Webex Task Reminder</h3>
              </div>
              <button
                onClick={() => setReminderModalTask(null)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Recipient:</span>
                <p className="font-bold text-slate-100 text-sm mt-0.5">
                  {reminderModalTask.assigneeName} ({reminderModalTask.assigneeEmail})
                </p>
              </div>

              <div>
                <span className="text-slate-400">Deliverable:</span>
                <p className="font-semibold text-slate-200 mt-0.5">"{reminderModalTask.title}"</p>
                <p className="text-[11px] text-amber-400 mt-0.5">
                  Due: {new Date(reminderModalTask.dueDate).toLocaleDateString()} · Progress: {reminderModalTask.progressPercentage}%
                </p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notification Channel:</label>
                <select
                  value={reminderChannel}
                  onChange={(e) => setReminderChannel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="Webex Direct Message">Cisco Webex Direct Message (1:1 Space)</option>
                  <option value="Webex Space #engineering-core">Webex Group Space (#engineering-core)</option>
                  <option value="In-App Notification">In-App Notification Banner</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Additional Host Note (Optional):</label>
                <textarea
                  value={reminderCustomNote}
                  onChange={(e) => setReminderCustomNote(e.target.value)}
                  placeholder="e.g. Please update your progress and detail any blockers so we can unblock you..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setReminderModalTask(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchReminder}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch Reminder Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cisco 5,240 Attendees Directory Modal */}
      <CiscoAttendeesModal
        isOpen={isAttendeesModalOpen}
        onClose={() => setIsAttendeesModalOpen(false)}
        attendees={employees}
        actionItems={actionItems}
        onSelectEmployee={(emp) => {
          setIsAttendeesModalOpen(false);
          onNavigateToEmployeeView(emp.id);
        }}
      />

      {/* Set ETA & Automated Reminder Modal */}
      <SetEtaReminderModal
        action={etaModalTask}
        isOpen={!!etaModalTask}
        onClose={() => setEtaModalTask(null)}
        onSaveEtaAndReminder={(actionId, newEta, newDueDate, reminderType, customNote) => {
          if (onUpdateTaskEta) {
            onUpdateTaskEta(actionId, newEta, newDueDate, reminderType, customNote);
          }
          setEtaModalTask(null);
        }}
      />
    </div>
  );
};

export const ProjectManagerDashboard = HostDashboard;
