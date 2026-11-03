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
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F4F7F5] p-4 lg:p-8 space-y-6">
      {/* Top Header & Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> cisco.com Domain
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              Employee Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
              10% Increments
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            PACT · My Task Workbench
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold italic mr-1">
              "From Meetings to Actions. From Actions to Results."
            </span>
            · Verify attendee name and Cisco email ID to unlock progress self-reporting.
          </p>
        </div>

        {/* Current Verified Profile Badge */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <img
            src={activeEmployee.avatar}
            alt={activeEmployee.displayName}
            className={`w-10 h-10 rounded-full object-cover border-2 ${
              isVerified ? 'border-emerald-500' : 'border-amber-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">{activeEmployee.displayName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isVerified ? '✓ Verified' : 'Unverified'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">{activeEmployee.email}</div>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 6: ATTENDEE NAME SELECTION & EMAIL VERIFICATION GATE */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-sky-50/70 border border-emerald-200 shadow-sm">
        <form onSubmit={handleVerifyEmail} className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Employee Verification Gate (Meeting Attendees)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Only verified attendee can modify their deliverables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* 1. Select Name from Meeting Attendees Dropdown */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                1. Select Your Name from Meeting Attendees:
              </label>
              <select
                value={selectedAttendeeId}
                onChange={(e) => handleAttendeeSelect(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold shadow-sm"
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
                <label className="text-xs font-bold text-slate-700 block">
                  2. Enter Your Cisco Email ID:
                </label>
                {selectedCandidate && (
                  <button
                    type="button"
                    onClick={() => setVerificationEmailInput(selectedCandidate.email)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 underline font-medium cursor-pointer"
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
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono shadow-sm"
              />
            </div>

            {/* 3. Verify Button */}
            <div className="md:col-span-3">
              <button
                type="submit"
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  isVerified
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerified ? '✓ Identity Verified' : 'Verify & Unlock'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {verificationError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          {verificationSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setViewFilter('mine')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  viewFilter === 'mine'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Deliverables ({myTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                  viewFilter === 'all'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Meeting Tasks ({actionItems.length})
              </button>
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3 text-amber-600" /> Strict Lock
            </span>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
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
                        ? 'bg-sky-50 border-sky-500 shadow-sm ring-1 ring-sky-500/40'
                        : isDone
                        ? 'bg-white border-emerald-200 hover:border-emerald-300 shadow-sm'
                        : isDueTomorrow
                        ? 'bg-white border-amber-300 hover:border-amber-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isDone ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ 100% Done
                            </span>
                          ) : isDueTomorrow ? (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Due Tomorrow!
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                              In Progress
                            </span>
                          )}

                          <span className="text-[11px] text-slate-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                          {task.title}
                        </h3>

                        {task.deliverable && (
                          <p className="text-xs text-slate-600 line-clamp-1">{task.deliverable}</p>
                        )}
                      </div>

                      {/* Visual Circular % Ring */}
                      <div className="text-right flex-shrink-0 flex flex-col items-end">
                        <span className={`text-base font-black ${isDone ? 'text-emerald-600' : 'text-sky-600'}`}>
                          {task.progressPercentage}%
                        </span>
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDone ? 'bg-emerald-500' : isDueTomorrow ? 'bg-amber-500' : 'bg-sky-500'
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
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 mt-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  My Webex Reminder Stream ({myReminders.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Auto-Delivered</span>
            </div>

            {myReminders.length === 0 ? (
              <p className="text-xs text-slate-500">No automated reminders triggered yet.</p>
            ) : (
              <div className="space-y-2">
                {myReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-700 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> {rem.reminderType}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">{rem.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Cockpit & 10% Radial Stepper */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTask ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              {/* Unverified Notice Banner */}
              {!isVerified && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-800">
                      Verification Required to Edit Progress
                    </div>
                    <p className="mt-0.5 text-slate-700">
                      Please enter your Cisco email address above in the verification box to authenticate yourself as{' '}
                      <strong className="text-slate-900">{selectedCandidate.displayName}</strong>. Under PACT governance, only verified meeting attendees can modify deliverables.
                    </p>
                  </div>
                </div>
              )}

              {/* Strict Assignee Lock Banner (Shown if verified as another person) */}
              {isVerified && !isAssignee && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-800">
                      Strict Employee Lock · Read-Only Mode
                    </div>
                    <p className="mt-0.5 text-slate-700">
                      You are authenticated as <strong className="text-slate-900">{activeEmployee.displayName}</strong>. This deliverable belongs to{' '}
                      <strong className="text-slate-900">{selectedTask.assigneeName}</strong>. Only {selectedTask.assigneeName} can modify their progress.
                    </p>
                  </div>
                </div>
              )}

              {/* Task Header & Visual Badges */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                      Task: {selectedTask.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Meeting: <strong className="text-slate-700">{selectedTask.meetingTitle}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Report Issue / Request Help
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-900">{selectedTask.title}</h2>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>Assignee: <strong className="text-slate-800">{selectedTask.assigneeName}</strong></span>
                  </div>
                </div>

                {selectedTask.deliverable && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-500 block mb-0.5">Expected Deliverable:</strong>
                    {selectedTask.deliverable}
                  </div>
                )}

                {/* Visual Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>Due: <strong className="text-slate-800">{new Date(selectedTask.dueDate).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>ETA: <strong className="text-slate-800">{selectedTask.eta || '24h'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Priority: <strong className="text-slate-800 capitalize">{selectedTask.priority || 'High'}</strong></span>
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Completed Milestones:
                  </label>
                  <input
                    type="text"
                    disabled={!isVerified || !isAssignee}
                    value={completedNotes}
                    onChange={(e) => setCompletedNotes(e.target.value)}
                    placeholder="e.g. Unit tests passing, Webex token receiver live..."
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white ${
                      !isVerified || !isAssignee ? 'border-slate-200 opacity-60 cursor-not-allowed' : 'border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Roadblock / Status Explanation for Host:
                  </label>
                  <input
                    type="text"
                    disabled={!isVerified || !isAssignee}
                    value={pendingReason}
                    onChange={(e) => setPendingReason(e.target.value)}
                    placeholder="Tap a preset above or type custom reason..."
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white ${
                      !isVerified || !isAssignee ? 'border-slate-200 opacity-60 cursor-not-allowed' : 'border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Error or Success Feedback */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500">
                  Last updated: {selectedTask.lastUpdated ? new Date(selectedTask.lastUpdated).toLocaleTimeString() : 'Recent'}
                </div>

                <div className="flex items-center gap-2">
                  {isVerified && isAssignee ? (
                    <button
                      type="button"
                      onClick={handleSaveProgress}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Save & Submit {selectedPercentage}% Progress
                    </button>
                  ) : !isVerified ? (
                    <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs flex items-center gap-2 cursor-not-allowed">
                      <KeyRound className="w-4 h-4 text-sky-600" />
                      Verify Cisco Email Above to Unlock
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs flex items-center gap-2 cursor-not-allowed">
                      <Lock className="w-4 h-4 text-amber-600" />
                      Locked: Only {selectedTask.assigneeName.split(' ')[0]} Can Update
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs shadow-sm">
              Select a deliverable on the left to report your 10% increment progress.
            </div>
          )}
        </div>
      </div>

      {/* Problem Reporting & Help Message Modal */}
      {isHelpModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Report Blocker or Request Help from Host
                </h3>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Flags your task on Host's dashboard immediately to clear roadblocks.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Select Nature of Issue:</label>
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
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="helpType"
                        checked={helpType === opt.type}
                        onChange={() => setHelpType(opt.type as EmployeeHelpMessage['type'])}
                        className="accent-rose-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Detailed Explanation:</label>
                <textarea
                  rows={3}
                  value={helpCustomDetail}
                  onChange={(e) => setHelpCustomDetail(e.target.value)}
                  placeholder="Provide specific details so the Host can unblock you..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchHelp}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
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
