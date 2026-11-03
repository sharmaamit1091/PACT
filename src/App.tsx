import React, { useState, useEffect, useCallback } from 'react';
import { Header, PrimarySection } from './components/Header';
import { HostDashboard } from './components/ProjectManagerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AdminSettingsView } from './components/AdminSettingsView';
import { OAuthModal } from './components/OAuthModal';
import { AppTheme, getInitialTheme, applyThemeToDocument } from './utils/themeLogic';

import {
  MOCK_CURRENT_USER,
  MOCK_USERS,
  MOCK_EMPLOYEE_PROFILES,
  MOCK_ACTION_ITEMS,
  MOCK_TRANSCRIPTS,
  MOCK_REMINDER_RECORDS,
  MOCK_MEETING_AI_SUMMARY,
  MOCK_SPACES,
  MOCK_MESSAGES,
  MOCK_MEETINGS,
} from './data/mockWebexData';
import {
  WebexUser,
  ConnectionMode,
  ActionItem,
  MeetingAISummary,
  WebexEmployeeProfile,
  MeetingTranscript,
  ReminderRecord,
  EmployeeHelpMessage,
} from './types/webex';
import {
  calculateTaskUrgency,
  runAutomatedDeadlineReminderScan,
} from './utils/webexLogic';
import {
  parseTranscriptForTasks,
  validateProgressUpdate,
  evaluateTaskReminders,
} from './utils/aiTaskParser';
import {
  generateCiscoMeetingAttendees,
  CISCO_LARGE_TRANSCRIPT,
} from './utils/ciscoScale';

export default function App() {
  // Navigation: strictly 3 primary sections: 'host' | 'employee' | 'admin'
  const [activeSection, setActiveSection] = useState<PrimarySection>('host');
  const [activeRole, setActiveRole] = useState<'host' | 'employee'>('host');

  // Core state collections: 5,240 Cisco Attendees generated and indexed for high performance
  const [employees, setEmployees] = useState<WebexEmployeeProfile[]>(() =>
    generateCiscoMeetingAttendees(5240)
  );

  // Active user / persona
  const [currentUser, setCurrentUser] = useState<WebexUser>(MOCK_USERS.usr_manager_host);
  const [currentEmployee, setCurrentEmployee] = useState<WebexEmployeeProfile>(() => {
    const list = generateCiscoMeetingAttendees(5240);
    return list[0];
  });
  const [actionItems, setActionItems] = useState<ActionItem[]>(MOCK_ACTION_ITEMS);
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>([
    CISCO_LARGE_TRANSCRIPT,
    ...MOCK_TRANSCRIPTS,
  ]);
  const [meetingSummary, setMeetingSummary] = useState<MeetingAISummary>(MOCK_MEETING_AI_SUMMARY);
  const [reminderRecords, setReminderRecords] = useState<ReminderRecord[]>(MOCK_REMINDER_RECORDS);
  const [reportingEmail, setReportingEmail] = useState<string>('amit.sharma@cisco.com');

  // Webex API Connection State & Fetching State
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('demo');
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState<boolean>(false);
  const [isFetchingWebex, setIsFetchingWebex] = useState<boolean>(false);

  // Theme state ('soothing-sage' | 'evening-stone' | 'matcha-oat')
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => getInitialTheme('soothing-sage'));

  const handleThemeChange = (theme: AppTheme) => {
    setCurrentTheme(theme);
    applyThemeToDocument(theme);
  };

  // Background 24h deadline reminder bot state
  const [jobEnabled, setJobEnabled] = useState<boolean>(true);
  const [jobCountdown, setJobCountdown] = useState<number>(30);

  // Switch persona between Meeting Host and Employee
  const handleSwitchRole = (role: 'host' | 'employee') => {
    setActiveRole(role);
    if (role === 'host') {
      setCurrentUser(MOCK_USERS.usr_manager_host);
    } else {
      setCurrentUser(MOCK_CURRENT_USER); // Amit Sharma
    }
  };

  // Check auth status from server on mount
  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        if (data.connected && data.user) {
          setConnectionMode(data.mode || 'token');
          setCurrentUser(data.user);
        }
      }
    } catch {
      // Backend not reached or running in client mode
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Connect Token handler
  const handleConnectToken = async (token: string): Promise<boolean> => {
    try {
      const resp = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await resp.json();
      if (data.success && data.user) {
        setConnectionMode('token');
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Disconnect handler
  const handleDisconnect = async () => {
    try {
      await fetch('/api/auth/disconnect', { method: 'POST' });
    } catch {
      // fallback
    }
    setConnectionMode('demo');
    setCurrentUser(MOCK_CURRENT_USER);
  };

  // Meeting Host: Fetch Data from Webex (Live REST API sync or Cisco directory fetch)
  const handleFetchWebexData = async () => {
    setIsFetchingWebex(true);
    try {
      const res = await fetch('/api/webex/meetings');
      if (res.ok) {
        const data = await res.json();
        if (data.meetings && data.meetings.length > 0) {
          // Sync meetings
        }
      }
    } catch {
      // Offline / client fallback
    } finally {
      setTimeout(() => {
        setIsFetchingWebex(false);
        // Automatically run AI Action Extraction on latest meeting transcript
        handleRunAiAnalysis(transcripts[0]?.id || '');
      }, 750);
    }
  };

  // Meeting Host: Set Task ETA & Configure Automated Reminder
  const handleUpdateTaskEta = (
    taskId: string,
    newEta: string,
    newDueDate: string,
    reminderType: '24h_deadline' | 'instant' | 'pre_meeting',
    customNote?: string
  ) => {
    setActionItems((prev) =>
      prev.map((item) => {
        if (item.id !== taskId) return item;
        return {
          ...item,
          eta: newEta,
          dueDate: newDueDate,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: 'David Chen (Meeting Host)',
        };
      })
    );

    const targetTask = actionItems.find((a) => a.id === taskId);
    if (targetTask) {
      const reminderTypeMap = {
        '24h_deadline': '24h Deadline Scan Scheduled',
        'instant': 'Instant Webex Dispatch',
        'pre_meeting': 'Pre-Meeting Review 2h Prior',
      };
      const newLog: ReminderRecord = {
        id: `rem_eta_${Date.now()}`,
        employeeName: targetTask.assigneeName,
        employeeEmail: targetTask.assigneeEmail,
        taskId,
        taskTitle: targetTask.title,
        reminderType,
        timestamp: new Date().toISOString(),
        status: 'delivered',
        channel: 'Webex Direct Message',
        message:
          customNote ||
          `Host updated ETA to "${newEta}" (Due: ${new Date(newDueDate).toLocaleDateString()}). ${reminderTypeMap[reminderType]}.`,
      };
      setReminderRecords((prev) => [newLog, ...prev]);
    }
  };

  // Meeting Host: Confirm or Reassign Ambiguous Task
  const handleConfirmAmbiguousTask = (taskId: string, assignee: WebexEmployeeProfile) => {
    setActionItems((prev) =>
      prev.map((item) => {
        if (item.id !== taskId) return item;
        return {
          ...item,
          assigneeId: assignee.id,
          assigneeName: assignee.displayName,
          assigneeEmail: assignee.email,
          assigneeAvatar: assignee.avatar,
          needsPmReview: false,
          status: 'in_progress',
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: 'David Chen (Host)',
        };
      })
    );

    // Record reminder log for new task assignment
    const newLog: ReminderRecord = {
      id: `rem_${Date.now()}`,
      employeeName: assignee.displayName,
      employeeEmail: assignee.email,
      taskId,
      taskTitle: actionItems.find((a) => a.id === taskId)?.title || 'Task',
      reminderType: 'assignment',
      timestamp: new Date().toISOString(),
      status: 'delivered',
      channel: 'Webex Direct Message',
      message: `Meeting Host confirmed assignment of "${actionItems.find((a) => a.id === taskId)?.title}".`,
    };
    setReminderRecords((prev) => [newLog, ...prev]);
  };

  // Meeting Host: Send Manual Reminder
  const handleSendManualReminder = (task: ActionItem, channel: string, customNote?: string) => {
    const newReminder: ReminderRecord = {
      id: `rem_man_${Date.now()}`,
      employeeName: task.assigneeName,
      employeeEmail: task.assigneeEmail,
      taskId: task.id,
      taskTitle: task.title,
      reminderType: 'manual',
      timestamp: new Date().toISOString(),
      status: 'delivered',
      channel: channel as ReminderRecord['channel'],
      message: customNote || `Host check-in: Please update progress on "${task.title}".`,
    };

    setReminderRecords((prev) => [newReminder, ...prev]);

    setActionItems((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, reminderSent: true, lastReminderSentAt: new Date().toISOString() } : t))
    );
  };

  // Meeting Host: Run AI Transcript Analysis
  const handleRunAiAnalysis = (transcriptId: string) => {
    const tr = transcripts.find((t) => t.id === transcriptId) || transcripts[0];
    if (!tr) return;

    const result = parseTranscriptForTasks(
      tr.rawText,
      employees,
      {
        id: tr.meetingId,
        title: tr.meetingTitle,
        nextMeetingDate: meetingSummary.nextFollowUpMeetingDate,
      },
      actionItems
    );

    if (result.tasks.length > 0 || result.ambiguousTasks.length > 0) {
      setActionItems((prev) => [...prev, ...result.tasks, ...result.ambiguousTasks]);
    }
  };

  // Employee: Update Task Progress (Strict 10% steps, reason validation, and PM read-only permissions)
  const handleUpdateTaskProgress = (
    taskId: string,
    percentage: number,
    completedDetails: string,
    whyPendingReason: string
  ): { success: boolean; error?: string } => {
    const target = actionItems.find((t) => t.id === taskId);
    if (!target) return { success: false, error: 'Task not found.' };

    const validation = validateProgressUpdate(
      taskId,
      target,
      currentEmployee.id,
      currentEmployee.email,
      'employee', // Executed from employee portal
      percentage,
      completedDetails,
      whyPendingReason
    );

    if (!validation.allowed) {
      return { success: false, error: validation.error };
    }

    const nextStatus = percentage === 100 ? 'completed' : 'in_progress';

    setActionItems((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          progressPercentage: percentage,
          completedDetails,
          whyPendingReason: percentage === 100 ? '' : whyPendingReason,
          status: nextStatus,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: `${currentEmployee.displayName} (${currentEmployee.email})`,
        };
      })
    );

    return { success: true };
  };

  // Employee: Send Help Request or Blocker Report to PM
  const handleSendHelpMessage = (taskId: string, helpData: EmployeeHelpMessage) => {
    setActionItems((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: 'blocked',
          helpRequested: true,
          helpMessage: helpData,
          whyPendingReason: helpData.detail,
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  };

  // Admin: Add or Paste New Transcript
  const handleAddTranscript = (transcriptData: Partial<MeetingTranscript>) => {
    const newTr: MeetingTranscript = {
      id: `tr_${Date.now()}`,
      meetingId: `mtg_${Date.now()}`,
      meetingTitle: transcriptData.meetingTitle || 'Custom Webex Meeting',
      source: transcriptData.source || 'host_profile',
      sharedBy: transcriptData.sharedBy || 'David Chen (Host Profile)',
      recordedAt: new Date().toISOString(),
      rawText: transcriptData.rawText || '',
      participantCount: transcriptData.participantCount || 40,
      status: 'available',
      hostName: transcriptData.hostName || 'David Chen',
      hostEmail: transcriptData.hostEmail || 'david.chen@cisco.com',
    };

    setTranscripts((prev) => [newTr, ...prev]);

    // Automatically parse newly added transcript
    const result = parseTranscriptForTasks(
      newTr.rawText,
      employees,
      {
        id: newTr.meetingId,
        title: newTr.meetingTitle,
        nextMeetingDate: meetingSummary.nextFollowUpMeetingDate,
      },
      actionItems
    );

    if (result.tasks.length > 0 || result.ambiguousTasks.length > 0) {
      setActionItems((prev) => [...prev, ...result.tasks, ...result.ambiguousTasks]);
    }
  };

  // Automated 24h background reminder scan
  const executeAutomatedScan = useCallback(() => {
    const scanTime = new Date();
    const { reminders, updatedTasks } = evaluateTaskReminders(actionItems, scanTime, {
      notify24h: true,
      notify48h: false,
      notifyOverdue: true,
    });

    if (reminders.length > 0) {
      setReminderRecords((prev) => [...reminders, ...prev]);
      setActionItems(updatedTasks);
    }
  }, [actionItems]);

  // Periodic ticker for 24h background bot (every 30 seconds)
  useEffect(() => {
    if (!jobEnabled) return;

    const timer = setInterval(() => {
      setJobCountdown((prev) => {
        if (prev <= 1) {
          executeAutomatedScan();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [jobEnabled, executeAutomatedScan]);

  const handleToggleJob = () => {
    setJobEnabled((prev) => !prev);
  };

  const handleForceRunJob = () => {
    setJobCountdown(30);
    executeAutomatedScan();
  };

  // Urgent count for header badge
  const urgentCount = actionItems.filter((act) => {
    if (act.status === 'completed' || act.progressPercentage === 100) return false;
    const urg = calculateTaskUrgency(act.dueDate, act.nextMeetingDate);
    return urg === 'due_tomorrow' || urg === 'due_today' || urg === 'overdue' || act.helpRequested;
  }).length;

  return (
    <div className="flex flex-col h-screen w-screen theme-bg-app theme-text-main overflow-hidden font-sans select-none antialiased transition-colors duration-200">
      {/* Sleek Enterprise Header with 3 Section Tabs & Theme Switcher */}
      <Header
        currentUser={currentUser}
        connectionMode={connectionMode}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec === 'host') {
            handleSwitchRole('host');
          } else if (sec === 'employee') {
            handleSwitchRole('employee');
          }
        }}
        activeRole={activeRole}
        onSwitchRole={handleSwitchRole}
        onOpenConnectModal={() => setIsOAuthModalOpen(true)}
        urgentCount={urgentCount}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Container rendering strictly 1 of the 3 Primary Sections */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Section 1: Meeting Host Dashboard */}
        {activeSection === 'host' && (
          <HostDashboard
            actionItems={actionItems}
            meetingSummary={meetingSummary}
            employees={employees}
            transcripts={transcripts}
            reminderRecords={reminderRecords}
            onConfirmAmbiguousTask={handleConfirmAmbiguousTask}
            onSendManualReminder={handleSendManualReminder}
            onRunAiAnalysis={handleRunAiAnalysis}
            onFetchWebexData={handleFetchWebexData}
            isFetchingWebex={isFetchingWebex}
            onUpdateTaskEta={handleUpdateTaskEta}
            onNavigateToEmployeeView={(empId) => {
              const emp = employees.find((e) => e.id === empId);
              if (emp) {
                setCurrentEmployee(emp);
                setActiveSection('employee');
                handleSwitchRole('employee');
              }
            }}
          />
        )}

        {/* Section 2: Employee Dashboard */}
        {activeSection === 'employee' && (
          <EmployeeDashboard
            currentEmployee={currentEmployee}
            allEmployees={employees}
            actionItems={actionItems}
            reminderRecords={reminderRecords}
            onSelectEmployee={setCurrentEmployee}
            onUpdateTaskProgress={handleUpdateTaskProgress}
            onSendHelpMessage={handleSendHelpMessage}
          />
        )}

        {/* Section 3: Admin / Webex Settings */}
        {activeSection === 'admin' && (
          <AdminSettingsView
            currentUser={currentUser}
            connectionMode={connectionMode}
            employees={employees}
            transcripts={transcripts}
            reportingEmail={reportingEmail}
            onUpdateReportingEmail={setReportingEmail}
            onOpenConnectModal={() => setIsOAuthModalOpen(true)}
            onDisconnect={handleDisconnect}
            onAddTranscript={handleAddTranscript}
            jobEnabled={jobEnabled}
            onToggleJob={handleToggleJob}
            onForceRunJob={handleForceRunJob}
            jobCountdown={jobCountdown}
          />
        )}
      </main>

      {/* Sleek Enterprise PACT Footer */}
      <footer className="h-9 px-4 lg:px-6 theme-bg-header border-t theme-border flex items-center justify-between text-[11px] theme-text-muted select-none shrink-0 z-10 transition-colors duration-200">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold theme-text-main font-mono tracking-wider">PACT</span>
          <span className="theme-text-faint">·</span>
          <span className="theme-text-secondary">Project Actions, Commitments &amp; Tracking</span>
          <span className="hidden md:inline theme-text-faint">·</span>
          <span className="hidden md:inline text-emerald-600 dark:text-emerald-400 font-medium italic">
            "From Meetings to Actions. From Actions to Results."
          </span>
        </div>
        <div className="flex items-center space-x-3 theme-text-muted">
          <span className="hidden sm:inline">Cisco Webex Integration Active</span>
          <span className="theme-text-faint">•</span>
          <span className="font-mono text-[10px] theme-text-faint">v2.4.0-pact</span>
        </div>
      </footer>

      {/* Webex OAuth & Token Authentication Modal */}
      <OAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        connectionMode={connectionMode}
        currentUser={currentUser}
        onConnectToken={handleConnectToken}
        onDisconnect={handleDisconnect}
        onSetDemoMode={() => {
          handleDisconnect();
        }}
      />
    </div>
  );
}
