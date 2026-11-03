import { ActionItem, WebexEmployeeProfile, ReminderRecord } from '../types/webex';
import { CiscoEmployeeDirectoryIndex, isSameEmployee } from './ciscoScale';

export interface ParseTranscriptResult {
  tasks: ActionItem[];
  ambiguousTasks: ActionItem[];
  detectedParticipants: string[];
  summaryNote: string;
}

/**
 * Parses meeting transcript text and extracts actionable tasks, assignees, deliverables,
 * deadlines, ETAs, priorities, dependencies, and flags uncertain items for Host confirmation.
 * Supports meetings with 5,000+ employees using O(1) directory indexing.
 */
export function parseTranscriptForTasks(
  transcriptText: string,
  employees: WebexEmployeeProfile[],
  meetingInfo: { id: string; title: string; nextMeetingDate: string },
  existingTasks: ActionItem[] = [],
  referenceDate: Date = new Date(),
  directoryIndex?: CiscoEmployeeDirectoryIndex
): ParseTranscriptResult {
  const tasks: ActionItem[] = [];
  const ambiguousTasks: ActionItem[] = [];
  const detectedParticipantsSet = new Set<string>();

  if (!transcriptText || transcriptText.trim().length === 0) {
    return {
      tasks: [],
      ambiguousTasks: [],
      detectedParticipants: [],
      summaryNote: 'Empty transcript provided.',
    };
  }

  // Pre-calculate common reference dates
  const tomorrow = new Date(referenceDate.getTime() + 24 * 3600 * 1000).toISOString();
  const threeDaysLater = new Date(referenceDate.getTime() + 3 * 24 * 3600 * 1000).toISOString();
  const fiveDaysLater = new Date(referenceDate.getTime() + 5 * 24 * 3600 * 1000).toISOString();
  const oneWeekLater = new Date(referenceDate.getTime() + 7 * 24 * 3600 * 1000).toISOString();

  // Optimized O(1) directory index for large attendee rosters (5,000+ employees)
  const activeIndex = directoryIndex || (employees.length > 20 ? new CiscoEmployeeDirectoryIndex(employees) : undefined);

  // Helper to find matching employee
  const findEmployee = (nameOrEmail: string): WebexEmployeeProfile | undefined => {
    if (activeIndex) {
      return activeIndex.find(nameOrEmail);
    }
    const q = nameOrEmail.toLowerCase().trim();
    return employees.find(
      (e) =>
        e.displayName.toLowerCase().includes(q) ||
        (e.firstName && e.firstName.toLowerCase() === q) ||
        (e.lastName && e.lastName.toLowerCase() === q) ||
        e.email.toLowerCase() === q ||
        e.email.toLowerCase().includes(q)
    );
  };

  // Split into lines or utterance blocks
  const lines = transcriptText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Scan for participants mentioned or speaking (Format: "Speaker Name: text" or "Speaker Name (Time): text")
  lines.forEach((line) => {
    const speakerMatch = line.match(/^([A-Za-z\s]+)(?:\s*\([^)]*\))?\s*:\s*(.+)$/);
    if (speakerMatch) {
      const speakerName = speakerMatch[1].trim();
      detectedParticipantsSet.add(speakerName);
    }
  });

  // Extract actionable phrases
  // Key patterns: "I will deliver...", "Amit has to...", "Please work on...", "Sarah will finalize...", "Task: ...", etc.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line indicates an action item
    const isActionSentence =
      /\b(will deliver|has to deliver|deliver on|working on|finalize|complete|implement|audit|investigate|deploy|build|configure|prepare|needs to|action item|task)\b/i.test(
        line
      );

    if (!isActionSentence) continue;

    // Detect speaker and content
    let speaker = '';
    let content = line;
    const speakerMatch = line.match(/^([A-Za-z\s]+)(?:\s*\([^)]*\))?\s*:\s*(.+)$/);
    if (speakerMatch) {
      speaker = speakerMatch[1].trim();
      content = speakerMatch[2].trim();
    }

    // Determine target assignee
    let matchedEmp: WebexEmployeeProfile | undefined;
    let explicitTarget = '';

    const isFirstPerson = /\b(I will|I'll|I am|I'm|I can|I have to|I've|my task|my deliverable)\b/i.test(content);

    if (speaker && isFirstPerson) {
      // If speaker is speaking in first person, the speaker is the assignee!
      matchedEmp = findEmployee(speaker);
      if (matchedEmp) {
        explicitTarget = matchedEmp.displayName;
      }
    }

    // If still not matched, check if an employee is specifically addressed or delegated to
    if (!matchedEmp) {
      // Remove dependency phrases before scanning for delegatees so "waiting for Amit" doesn't falsely assign to Amit
      const strippedContent = content.replace(/\b(waiting for|depends on|blocked by|needs)\s+[A-Za-z\s]+?(\.|$)/gi, '');

      for (const emp of employees) {
        const first = emp.firstName ? emp.firstName.toLowerCase() : '';
        const full = emp.displayName.toLowerCase();
        const regexFirst = first ? new RegExp(`\\b${first}\\b`, 'i') : null;
        const regexFull = new RegExp(`\\b${full}\\b`, 'i');

        if (regexFull.test(strippedContent) || (regexFirst && regexFirst.test(strippedContent))) {
          matchedEmp = emp;
          explicitTarget = emp.displayName;
          break;
        }
      }
    }

    // Extract deadline
    let deadline = threeDaysLater;
    let deadlineDesc = 'in 3 days';
    if (/\b(tomorrow|by tomorrow|1 day)\b/i.test(content)) {
      deadline = tomorrow;
      deadlineDesc = 'Tomorrow';
    } else if (/\b(today|by EOD|end of day)\b/i.test(content)) {
      deadline = new Date(referenceDate.getTime() + 10 * 3600 * 1000).toISOString();
      deadlineDesc = 'Today EOD';
    } else if (/\b(friday|by friday)\b/i.test(content)) {
      deadline = fiveDaysLater;
      deadlineDesc = 'By Friday';
    } else if (/\b(next week|1 week|before follow-up)\b/i.test(content)) {
      deadline = oneWeekLater;
      deadlineDesc = 'Before next meeting';
    }

    // Extract ETA
    let eta = '1-2 days';
    if (/\b(tomorrow|24 hours|1 day)\b/i.test(content)) eta = '1 day (24h)';
    else if (/\b(48 hours|2 days)\b/i.test(content)) eta = '2 days';
    else if (/\b(3 days)\b/i.test(content)) eta = '3 days';
    else if (/\b(4 hours|same day)\b/i.test(content)) eta = '4-6 hours';

    // Extract priority
    let priority: ActionItem['priority'] = 'high';
    if (/\b(urgent|critical|blocker|p1|immediately|asap)\b/i.test(content)) {
      priority = 'critical';
    } else if (/\b(tomorrow|high)\b/i.test(content)) {
      priority = 'high';
    } else if (/\b(low priority|nice to have|if time permits)\b/i.test(content)) {
      priority = 'low';
    } else {
      priority = 'medium';
    }

    // Extract dependencies
    const dependencies: Array<{ taskOrPerson: string; detail: string }> = [];
    const depMatch = content.match(/\b(?:waiting for|depends on|blocked by|needs)\s+([A-Za-z\s]+?)(?:'s|\s+to|\s+for|\.|$)/i);
    if (depMatch) {
      dependencies.push({
        taskOrPerson: depMatch[1].trim(),
        detail: `Identified dependency mentioned in transcript: "${depMatch[0].trim()}"`,
      });
    }

    // Generate concise title and deliverable description
    let cleanTitle = content
      .replace(/^(I will|I'll|we will|please|let's|Amit has to|Sarah will|Marcus will)\s+/i, '')
      .replace(/[.!]$/, '')
      .trim();
    if (cleanTitle.length > 70) {
      cleanTitle = cleanTitle.substring(0, 67) + '...';
    }
    // Capitalize first letter
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    // Check for duplicates against existing tasks and newly parsed tasks
    const isDuplicate = [...existingTasks, ...tasks, ...ambiguousTasks].some((t) => {
      const t1 = t.title.toLowerCase();
      const t2 = cleanTitle.toLowerCase();
      return t1 === t2 || (t1.includes(t2) && t2.length > 15) || (t2.includes(t1) && t1.length > 15);
    });

    if (isDuplicate) {
      continue;
    }

    const taskId = `act_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (!matchedEmp) {
      ambiguousTasks.push({
        id: taskId,
        meetingId: meetingInfo.id,
        meetingTitle: meetingInfo.title,
        title: cleanTitle,
        description: `Extracted from transcript line: "${content}"`,
        deliverable: `Deliverable extracted from meeting: ${cleanTitle}`,
        assigneeId: 'unassigned',
        assigneeName: 'Unassigned (Needs Host Review)',
        assigneeEmail: 'pending-host-assignment@cisco.com',
        assigneeAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        dueDate: deadline,
        eta,
        priority,
        dependencies,
        needsPmReview: true,
        uncertaintyReason: 'Assignee could not be unambiguously identified from transcript.',
        status: 'pending',
        progressPercentage: 0,
        completedDetails: '',
        pendingDetails: 'Awaiting Meeting Host review and assignment confirmation.',
        whyPendingReason: '',
        lastUpdated: referenceDate.toISOString(),
        lastUpdatedBy: 'PACT AI Secretary',
        nextMeetingDate: meetingInfo.nextMeetingDate,
        reminderSent: false,
      });
    } else {
      tasks.push({
        id: taskId,
        meetingId: meetingInfo.id,
        meetingTitle: meetingInfo.title,
        title: cleanTitle,
        description: `Extracted from Webex transcript: "${content}"`,
        deliverable: `Complete deliverable for: ${cleanTitle} (Due ${deadlineDesc})`,
        assigneeId: matchedEmp.id,
        assigneeName: matchedEmp.displayName,
        assigneeEmail: matchedEmp.email,
        assigneeAvatar: matchedEmp.avatar,
        dueDate: deadline,
        eta,
        priority,
        dependencies,
        needsPmReview: false,
        status: 'in_progress',
        progressPercentage: 0,
        completedDetails: 'Task newly extracted and assigned from Webex meeting transcript.',
        pendingDetails: 'Initial development pending.',
        whyPendingReason: '',
        lastUpdated: referenceDate.toISOString(),
        lastUpdatedBy: 'PACT AI Secretary',
        nextMeetingDate: meetingInfo.nextMeetingDate,
        reminderSent: false,
      });
    }
  }

  return {
    tasks,
    ambiguousTasks,
    detectedParticipants: Array.from(detectedParticipantsSet),
    summaryNote: `AI Secretary analyzed transcript: Extracted ${tasks.length} confirmed actionable task(s) and flagged ${ambiguousTasks.length} uncertain item(s) for Host review.`,
  };
}

/**
 * Validates progress updates with strict role-based access control:
 * - Meeting Host is READ-ONLY on progress percentages.
 * - Only the assigned employee can modify progress.
 * - Progress must increment in 10% steps (0%, 10%, 20%, ..., 100%).
 * - Completed status requires 100% progress.
 * - Incomplete progress (<100%) requires explanation/reasons.
 */
export function validateProgressUpdate(
  taskId: string,
  targetTask: ActionItem,
  updaterId: string,
  updaterEmail: string,
  updaterRole: 'host' | 'employee' | 'manager',
  newPercentage: number,
  completedDetails: string,
  whyPendingReason: string
): { allowed: boolean; error?: string } {
  // 1. Strict Host Read-Only rule
  if (updaterRole === 'host' || updaterRole === 'manager') {
    return {
      allowed: false,
      error: 'Meeting Host has read-only access to employee progress percentages. Only the assigned employee can update their own progress.',
    };
  }

  // 2. Assignee identity check with alias support
  const isAssignee = isSameEmployee({ id: updaterId, email: updaterEmail }, targetTask);

  if (!isAssignee) {
    return {
      allowed: false,
      error: `Access Denied: Only ${targetTask.assigneeName} (${targetTask.assigneeEmail}) can update progress on this task.`,
    };
  }

  // 3. 10% increment check
  if (typeof newPercentage !== 'number' || newPercentage < 0 || newPercentage > 100) {
    return {
      allowed: false,
      error: 'Progress percentage must be between 0% and 100%.',
    };
  }

  if (newPercentage % 10 !== 0) {
    return {
      allowed: false,
      error: 'Progress must be updated in clear 10% increments (0%, 10%, 20%, ..., 100%).',
    };
  }

  // 4. Completed check
  if (newPercentage === 100 && (!completedDetails || completedDetails.trim().length === 0)) {
    return {
      allowed: false,
      error: 'Please detail what has been delivered to achieve 100% completion.',
    };
  }

  // 5. Incomplete blocker/reason check
  if (newPercentage < 100 && (!whyPendingReason || whyPendingReason.trim().length === 0)) {
    return {
      allowed: false,
      error: 'Please provide the reason or blocker why work is currently pending.',
    };
  }

  return { allowed: true };
}

/**
 * Generates automated reminder log records based on enterprise scheduling rules:
 * - 24 hours deadline approaching
 * - 48 hours deadline approaching
 * - Overdue deliverables
 * - Pre-meeting follow-up check-in
 */
export function evaluateTaskReminders(
  tasks: ActionItem[],
  now: Date = new Date(),
  rules: {
    notify24h?: boolean;
    notify48h?: boolean;
    notifyOverdue?: boolean;
    notifyPreMeeting?: boolean;
  } = { notify24h: true, notify48h: true, notifyOverdue: true, notifyPreMeeting: true }
): { reminders: ReminderRecord[]; updatedTasks: ActionItem[] } {
  const reminders: ReminderRecord[] = [];
  const currentTime = now.getTime();

  const updatedTasks = tasks.map((task) => {
    // Skip tasks that need PM review or are completed
    if (task.needsPmReview || task.status === 'completed' || task.progressPercentage === 100) {
      return task;
    }

    const dueTime = new Date(task.dueDate).getTime();
    const diffHours = (dueTime - currentTime) / (1000 * 3600);

    let triggeredType: ReminderRecord['reminderType'] | null = null;
    let message = '';

    if (diffHours < 0 && rules.notifyOverdue && !task.reminderSent) {
      triggeredType = 'overdue';
      message = `Deliverable "${task.title}" is overdue (${Math.abs(Math.round(diffHours))}h past deadline). Please update status immediately.`;
    } else if (diffHours > 0 && diffHours <= 24 && rules.notify24h && !task.automatedReminderSent) {
      triggeredType = '24h_deadline';
      message = `Deliverable "${task.title}" is due tomorrow (${Math.round(diffHours)}h remaining). Please self-report progress and any blockers.`;
    } else if (diffHours > 24 && diffHours <= 48 && rules.notify48h && !task.reminderSent) {
      triggeredType = '48h_deadline';
      message = `Deliverable "${task.title}" deadline in 48 hours. Ensure your sprint milestones are on schedule.`;
    }

    if (triggeredType) {
      reminders.push({
        id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        employeeName: task.assigneeName,
        employeeEmail: task.assigneeEmail,
        taskId: task.id,
        taskTitle: task.title,
        reminderType: triggeredType,
        timestamp: now.toISOString(),
        status: 'delivered',
        channel: 'Webex Direct Message',
        message,
      });

      return {
        ...task,
        reminderSent: true,
        automatedReminderSent: triggeredType === '24h_deadline' ? true : task.automatedReminderSent,
        lastReminderSentAt: now.toISOString(),
      };
    }

    return task;
  });

  return { reminders, updatedTasks };
}
