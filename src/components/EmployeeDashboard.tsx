import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Layers,
  HelpCircle,
  BellRing,
  Info,
  Check,
  ChevronRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Zap,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import {
  ActionItem,
  WebexEmployeeProfile,
  ReminderRecord,
  EmployeeHelpMessage,
} from '../types/webex';
import { calculateTaskUrgency } from '../utils/webexLogic';
import { validateProgressUpdate } from '../utils/aiTaskParser';
import { isSameEmployee } from '../utils/ciscoScale';
import { VisualRadialProgressStepper } from './VisualRadialProgressStepper';
import { VisualStatusPresets, StatusPreset } from './VisualStatusPresets';
import { VisualDependencyMap } from './VisualDependencyMap';

interface EmployeeDashboardProps {
  currentEmployee: WebexEmployeeProfile;
  allEmployees: WebexEmployeeProfile[];
  actionItems: ActionItem[];
  reminderRecords: ReminderRecord[];
  onSelectEmployee: (emp: WebexEmployeeProfile) => void;
  onUpdateTaskProgress: (
    taskId: string,
    percentage: number,
    completedDetails: string,
    whyPendingReason: string
  ) => { success: boolean; error?: string };
  onSendHelpMessage: (
    taskId: string,
    helpData: EmployeeHelpMessage
  ) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentEmployee,
  allEmployees,
  actionItems,
  reminderRecords,
  onSelectEmployee,
  onUpdateTaskProgress,
  onSendHelpMessage,
}) => {
  const [viewFilter, setViewFilter] = useState<'mine' | 'all'>('mine');

  // Requirement 6: Attendee Name Selection & Cisco Email Verification
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string>(() => {
    return allEmployees.find((e) => isSameEmployee(currentEmployee, e))?.id || currentEmployee.id;
  });
  const [verificationEmailInput, setVerificationEmailInput] = useState<string>(currentEmployee.email);
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(
    `✓ Verified as ${currentEmployee.displayName} (${currentEmployee.email})`
  );

  // Active verified employee
  const activeEmployee = currentEmployee;

  // Tasks assigned to current employee using robust equality
  const myTasks = actionItems.filter((t) => isSameEmployee(activeEmployee, t));
  const displayedTasks = viewFilter === 'mine' ? myTasks : actionItems;

  const [selectedTask, setSelectedTask] = useState<ActionItem | null>(() => {
    const initialMy = actionItems.filter((t) => isSameEmployee(activeEmployee, t));
    return initialMy[0] || actionItems[0] || null;
  });

  // Automatically update selectedTask to the active persona's deliverable whenever persona switches
  useEffect(() => {
    const empTasks = actionItems.filter((t) => isSameEmployee(activeEmployee, t));
    const nextTask = empTasks[0] || actionItems[0] || null;
    setSelectedTask(nextTask);
    if (nextTask) {
      setSelectedPercentage(nextTask.progressPercentage);
      setCompletedNotes(nextTask.completedDetails || '');
      setPendingReason(nextTask.whyPendingReason || '');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedPresetId(undefined);
  }, [activeEmployee.id, activeEmployee.email, activeEmployee.displayName, actionItems]);

  const isAssignee = !!(isVerified && selectedTask && isSameEmployee(activeEmployee, selectedTask));

  // Form states for the selected task
  const [selectedPercentage, setSelectedPercentage] = useState<number>(
    selectedTask?.progressPercentage ?? 0
  );
  const [completedNotes, setCompletedNotes] = useState<string>(
    selectedTask?.completedDetails || ''
  );
  const [pendingReason, setPendingReason] = useState<string>(
    selectedTask?.whyPendingReason || ''
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Problem Reporting Modal
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [helpType, setHelpType] = useState<EmployeeHelpMessage['type']>('waiting_employee');
  const [helpCustomDetail, setHelpCustomDetail] = useState<string>('');

  // Handle attendee name selection change
  const handleAttendeeSelect = (empId: string) => {
    setSelectedAttendeeId(empId);
    const candidate = allEmployees.find((e) => e.id === empId);
    if (candidate) {
      // If switching to a different attendee, require email verification
      if (!isSameEmployee(activeEmployee, candidate)) {
        setIsVerified(false);
        setVerificationEmailInput('');
        setVerificationError(null);
        setVerificationSuccess(null);
      }
    }
  };

  // Handle email verification submission (Requirement 6)
  const handleVerifyEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError(null);

    const candidate = allEmployees.find((e) => e.id === selectedAttendeeId);
    if (!candidate) {
      setVerificationError('Selected attendee profile could not be found.');
      return;
    }

    const trimmedInput = verificationEmailInput.trim().toLowerCase();
    if (!trimmedInput) {
      setVerificationError('Please enter your Cisco email address to verify your identity.');
      return;
    }

    // Check if entered email matches candidate's authorized email or alias
    const matchesEmail =
      candidate.email.toLowerCase() === trimmedInput ||
      isSameEmployee(candidate, { email: trimmedInput });

    if (matchesEmail) {
      onSelectEmployee(candidate);
      setIsVerified(true);
      setVerificationError(null);
      setVerificationSuccess(`✓ Identity Confirmed: Authenticated as ${candidate.displayName} (${candidate.email})`);
      setTimeout(() => setVerificationSuccess(null), 5000);
    } else {
      setIsVerified(false);
      setVerificationError(
        `Verification Failed: "${trimmedInput}" does not match the authorized Cisco email for ${candidate.displayName}. Only the assigned employee can self-verify.`
      );
    }
  };

  // When switching selected task
  const handleSelectTask = (task: ActionItem) => {
    setSelectedTask(task);
    setSelectedPercentage(task.progressPercentage);
    setCompletedNotes(task.completedDetails || '');
    setPendingReason(task.whyPendingReason || '');
    setSelectedPresetId(undefined);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleApplyProgress = (percentage: number) => {
    if (!isVerified) {
      setErrorMessage(`Please enter your Cisco email address above to verify your identity before updating progress.`);
      return;
    }
    if (!isAssignee) {
      setErrorMessage(`Strict Lock: Only ${selectedTask?.assigneeName || 'the assigned employee'} can modify their progress.`);
      return;
    }
    setSelectedPercentage(percentage);
    setErrorMessage(null);
    if (percentage === 100) {
      setCompletedNotes((prev) => prev || 'Fully completed and verified in Webex environment.');
      setPendingReason('');
    }
  };

  const handleSelectPreset = (preset: StatusPreset) => {
    if (!isVerified || !isAssignee) return;
    setSelectedPresetId(preset.id);
    setPendingReason(preset.defaultReason);
  };

  const handleSaveProgress = () => {
    if (!selectedTask) return;

    if (!isVerified) {
      setErrorMessage(
        `Verification Required: Please enter your Cisco email ID above to authenticate before saving progress.`
      );
      return;
    }

    if (!isAssignee) {
      setErrorMessage(
        `Action Denied: You are signed in as ${activeEmployee.displayName}. Only the assigned Cisco employee (${selectedTask.assigneeName}) has permission to modify progress.`
      );
      return;
    }

    const result = onUpdateTaskProgress(
      selectedTask.id,
      selectedPercentage,
      completedNotes,
      pendingReason
    );

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to update progress.');
      setSuccessMessage(null);
    } else {
      setErrorMessage(null);
      setSuccessMessage(
        `Progress saved to ${selectedPercentage}% successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDispatchHelp = () => {
    if (!selectedTask) return;

    const subjects: Record<EmployeeHelpMessage['type'], string> = {
      assistance: 'I need assistance with technical execution',
      waiting_employee: 'I am waiting for another employee to deliver',
      pending_info: 'Required information is pending from stakeholders',
      deadline_revision: 'The deadline needs revision / extension',
      cannot_complete: 'I cannot complete this task for reasons detailed below',
      other: 'Other issue / question for Meeting Host',
    };

    const helpMsg: EmployeeHelpMessage = {
      type: helpType,
      subject: subjects[helpType],
      detail: helpCustomDetail.trim() || subjects[helpType],
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    onSendHelpMessage(selectedTask.id, helpMsg);
    setIsHelpModalOpen(false);
    setHelpCustomDetail('');
    setSuccessMessage('Help alert dispatched immediately to Meeting Host dashboard!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Filter personal reminders
  const myReminders = reminderRecords.filter(
    (r) =>
      r.employeeEmail.toLowerCase() === activeEmployee.email.toLowerCase() ||
      r.employeeName.toLowerCase().includes(activeEmployee.displayName.toLowerCase())
  );

  // Selected candidate helper
  const selectedCandidate = allEmployees.find((e) => e.id === selectedAttendeeId) || activeEmployee;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900/60 p-4 lg:p-8 space-y-6">
      {/* Top Header & Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> cisco.com Domain
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Employee Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              10% Increments
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">
            PACT · My Task Workbench
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold italic mr-1">
              "From Meetings to Actions. From Actions to Results."
            </span>
            · Verify attendee name and Cisco email ID to unlock progress self-reporting.
          </p>
        </div>

        {/* Current Verified Profile Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-sm">
          <img
            src={activeEmployee.avatar}
            alt={activeEmployee.displayName}
            className={`w-10 h-10 rounded-full object-cover border-2 ${
              isVerified ? 'border-emerald-500' : 'border-amber-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200">{activeEmployee.displayName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isVerified
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {isVerified ? '✓ Verified' : 'Unverified'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">{activeEmployee.email}</div>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 6: ATTENDEE NAME SELECTION & EMAIL VERIFICATION GATE */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/40 border border-sky-500/30 shadow-md">
        <form onSubmit={handleVerifyEmail} className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Employee Verification Gate (Meeting Attendees)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Only verified attendee can modify their deliverables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* 1. Select Name from Meeting Attendees Dropdown */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                1. Select Your Name from Meeting Attendees:
              </label>
              <select
                value={selectedAttendeeId}
                onChange={(e) => handleAttendeeSelect(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer font-semibold"
              >
                {allEmployees.slice(0, 15).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.displayName} ({emp.role.split(' ')[0]} · {emp.email})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Enter Cisco Email ID to Verify */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  2. Enter Your Cisco Email ID:
                </label>
                {selectedCandidate && (
                  <button
                    type="button"
                    onClick={() => setVerificationEmailInput(selectedCandidate.email)}
                    className="text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                  >
                    Quick-Fill: {selectedCandidate.email}
                  </button>
                )}
              </div>
              <input
                type="email"
                value={verificationEmailInput}
                onChange={(e) => setVerificationEmailInput(e.target.value)}
                placeholder="e.g. amit.sharma@cisco.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* 3. Verify Button */}
            <div className="md:col-span-3">
              <button
                type="submit"
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  isVerified
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerified ? '✓ Identity Verified' : 'Verify & Unlock'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {verificationError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          {verificationSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{verificationSuccess}</span>
            </div>
          )}
        </form>
      </div>

      {/* Main Grid: Visual Task List (Left) vs Visual Cockpit (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Deliverables */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewFilter('mine')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  viewFilter === 'mine'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                My Deliverables ({myTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  viewFilter === 'all'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Meeting Tasks ({actionItems.length})
              </button>
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3 text-amber-400" /> Strict Lock
            </span>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
              No tasks currently found for {activeEmployee.displayName}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedTasks.map((task) => {
                const urgency = calculateTaskUrgency(task.dueDate, task.nextMeetingDate);
                const isSelected = selectedTask?.id === task.id;
                const isDone = task.progressPercentage === 100;
                const isDueTomorrow = urgency === 'due_tomorrow' || urgency === 'due_today';

                return (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/95 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                        : isDone
                        ? 'bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/40'
                        : isDueTomorrow
                        ? 'bg-slate-900/70 border-amber-500/30 hover:border-amber-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isDone ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ✓ 100% Done
                            </span>
                          ) : isDueTomorrow ? (
                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Due Tomorrow!
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                              In Progress
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-100 text-sm leading-snug truncate">
                          {task.title}
                        </h3>

                        {task.deliverable && (
                          <p className="text-xs text-slate-400 line-clamp-1">{task.deliverable}</p>
                        )}
                      </div>

                      {/* Visual Circular % Ring */}
                      <div className="text-right flex-shrink-0 flex flex-col items-end">
                        <span className={`text-base font-black ${isDone ? 'text-emerald-400' : 'text-sky-400'}`}>
                          {task.progressPercentage}%
                        </span>
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDone ? 'bg-emerald-400' : isDueTomorrow ? 'bg-amber-400' : 'bg-sky-400'
                            }`}
                            style={{ width: `${task.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Visual Reminders Stream */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-200">
                  My Webex Reminder Stream ({myReminders.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Auto-Delivered</span>
            </div>

            {myReminders.length === 0 ? (
              <p className="text-xs text-slate-500">No automated reminders triggered yet.</p>
            ) : (
              <div className="space-y-2">
                {myReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rem.reminderType}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(rem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{rem.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Cockpit & 10% Radial Stepper */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTask ? (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              {/* Unverified Notice Banner */}
              {!isVerified && (
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-300">
                      Verification Required to Edit Progress
                    </div>
                    <p className="mt-0.5 text-slate-300">
                      Please enter your Cisco email address above in the verification box to authenticate yourself as{' '}
                      <strong className="text-white">{selectedCandidate.displayName}</strong>. Under PACT governance, only verified meeting attendees can modify deliverables.
                    </p>
                  </div>
                </div>
              )}

              {/* Strict Assignee Lock Banner (Shown if verified as another person) */}
              {isVerified && !isAssignee && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-300">
                      Strict Employee Lock · Read-Only Mode
                    </div>
                    <p className="mt-0.5 text-slate-300">
                      You are authenticated as <strong className="text-white">{activeEmployee.displayName}</strong>. This deliverable belongs to{' '}
                      <strong className="text-white">{selectedTask.assigneeName}</strong>. Only {selectedTask.assigneeName} can modify their progress.
                    </p>
                  </div>
                </div>
              )}

              {/* Task Header & Visual Badges */}
              <div className="space-y-2.5 pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Task: {selectedTask.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Meeting: <strong className="text-slate-300">{selectedTask.meetingTitle}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Report Issue / Request Help
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-100">{selectedTask.title}</h2>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Assignee: <strong className="text-slate-200">{selectedTask.assigneeName}</strong></span>
                  </div>
                </div>

                {selectedTask.deliverable && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-slate-400 block mb-0.5">Expected Deliverable:</strong>
                    {selectedTask.deliverable}
                  </div>
                )}

                {/* Visual Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Due: <strong className="text-slate-200">{new Date(selectedTask.dueDate).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>ETA: <strong className="text-slate-200">{selectedTask.eta || '24h'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Priority: <strong className="text-slate-200 capitalize">{selectedTask.priority || 'High'}</strong></span>
                  </div>
                </div>

                {/* Visual Dependency Map */}
                <VisualDependencyMap
                  dependencies={selectedTask.dependencies || []}
                  assigneeName={selectedTask.assigneeName}
                />
              </div>

              {/* 1. VISUAL RADIAL PROGRESS STEPPER (0% to 100% in 10% increments) */}
              <VisualRadialProgressStepper
                currentPercentage={selectedPercentage}
                disabled={!isVerified || !isAssignee}
                onSelectPercentage={handleApplyProgress}
              />

              {/* 2. 1-CLICK VISUAL STATUS PRESETS */}
              <VisualStatusPresets
                selectedPresetId={selectedPresetId}
                disabled={!isVerified || !isAssignee}
                onSelectPreset={handleSelectPreset}
              />

              {/* Detail Textfields (Editable) */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Completed Milestones:
                  </label>
                  <input
                    type="text"
                    disabled={!isVerified || !isAssignee}
                    value={completedNotes}
                    onChange={(e) => setCompletedNotes(e.target.value)}
                    placeholder="e.g. Unit tests passing, Webex token receiver live..."
                    className={`w-full bg-slate-950/80 border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 ${
                      !isVerified || !isAssignee ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Roadblock / Status Explanation for Host:
                  </label>
                  <input
                    type="text"
                    disabled={!isVerified || !isAssignee}
                    value={pendingReason}
                    onChange={(e) => setPendingReason(e.target.value)}
                    placeholder="Tap a preset above or type custom reason..."
                    className={`w-full bg-slate-950/80 border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 ${
                      !isVerified || !isAssignee ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Error or Success Feedback */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="text-[11px] text-slate-500">
                  Last updated: {selectedTask.lastUpdated ? new Date(selectedTask.lastUpdated).toLocaleTimeString() : 'Recent'}
                </div>

                <div className="flex items-center gap-2">
                  {isVerified && isAssignee ? (
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Save & Submit {selectedPercentage}% Progress
                    </button>
                  ) : !isVerified ? (
                    <div className="px-4 py-2 rounded-xl bg-slate-800 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center gap-2 cursor-not-allowed">
                      <KeyRound className="w-4 h-4 text-sky-400" />
                      Verify Cisco Email Above to Unlock
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-800 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 cursor-not-allowed">
                      <Lock className="w-4 h-4 text-amber-400" />
                      Locked: Only {selectedTask.assigneeName.split(' ')[0]} Can Update
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
              Select a deliverable on the left to report your 10% increment progress.
            </div>
          )}
        </div>
      </div>

      {/* Problem Reporting & Help Message Modal */}
      {isHelpModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-100 text-base">
                  Report Blocker or Request Help from Host
                </h3>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Flags your task on Host's dashboard immediately to clear roadblocks.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Select Nature of Issue:</label>
                <div className="space-y-1.5">
                  {[
                    { type: 'waiting_employee', label: 'I am waiting for another employee' },
                    { type: 'assistance', label: 'I need assistance / technical guidance' },
                    { type: 'pending_info', label: 'Required information is pending' },
                    { type: 'deadline_revision', label: 'The deadline needs revision' },
                    { type: 'cannot_complete', label: 'I cannot complete this task for reasons below' },
                    { type: 'other', label: 'Other issue' },
                  ].map((opt) => (
                    <label
                      key={opt.type}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        helpType === opt.type
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="helpType"
                        checked={helpType === opt.type}
                        onChange={() => setHelpType(opt.type as EmployeeHelpMessage['type'])}
                        className="accent-rose-500"
                      />
                      <span className="font-semibold">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Detailed Explanation:</label>
                <textarea
                  rows={3}
                  value={helpCustomDetail}
                  onChange={(e) => setHelpCustomDetail(e.target.value)}
                  placeholder="Provide specific details so the Host can unblock you..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchHelp}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Alert to Host Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
