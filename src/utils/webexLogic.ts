import { WebexAdaptiveCard, WebexWebhookEvent } from '../types/webex';

/**
 * Validates a Cisco Webex Adaptive Card structure.
 */
export function validateAdaptiveCard(card: Partial<WebexAdaptiveCard>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!card) {
    return { valid: false, errors: ['Card payload is null or undefined'] };
  }

  if (card.type !== 'AdaptiveCard') {
    errors.push('Card type must be "AdaptiveCard"');
  }

  if (!card.version || typeof card.version !== 'string') {
    errors.push('Card version string is required (e.g. "1.3")');
  }

  if (!Array.isArray(card.body)) {
    errors.push('Card body must be an array of elements');
  } else if (card.body.length === 0) {
    errors.push('Card body must contain at least one element');
  }

  if (card.actions) {
    if (!Array.isArray(card.actions)) {
      errors.push('Card actions must be an array');
    } else {
      card.actions.forEach((action, idx) => {
        if (!action.type) {
          errors.push(`Action at index ${idx} is missing a type`);
        }
        if (!action.title) {
          errors.push(`Action at index ${idx} is missing a title`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formats start and end ISO strings into human readable Webex meeting times.
 */
export function formatMeetingTimeRange(start: string, end: string): string {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid date';
    }

    const dateStr = startDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const startTimeStr = startDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    const endTimeStr = endDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${dateStr} · ${startTimeStr} - ${endTimeStr}`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Checks if a meeting is currently live/ongoing.
 */
export function isMeetingOngoing(start: string, end: string, now: Date = new Date()): boolean {
  try {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const current = now.getTime();
    return current >= s && current <= e;
  } catch {
    return false;
  }
}

/**
 * Generates an 8-character alphanumeric Cisco Webex meeting passcode.
 */
export function generateMeetingPasscode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Parses Webex mentions and tags from text.
 */
export function parseWebexMarkdownMentions(text: string): { sanitized: string; mentions: string[] } {
  if (!text) return { sanitized: '', mentions: [] };
  const mentionRegex = /<@personEmail:([^>]+)>/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  const sanitized = text.replace(/<@personEmail:([^>]+)>/g, '@$1');
  return { sanitized, mentions };
}

/**
 * Filters incoming Webex webhook events by resource and event type.
 */
export function filterWebhookEvents(
  events: WebexWebhookEvent[],
  resourceFilter?: string,
  eventFilter?: string
): WebexWebhookEvent[] {
  return events.filter((ev) => {
    if (resourceFilter && resourceFilter !== 'all' && ev.resource !== resourceFilter) {
      return false;
    }
    if (eventFilter && eventFilter !== 'all' && ev.event !== eventFilter) {
      return false;
    }
    return true;
  });
}

/**
 * Templates for common Cisco Webex Adaptive Cards.
 */
export function createSampleAdaptiveCard(type: 'incident' | 'poll' | 'kudos' | 'standup'): WebexAdaptiveCard {
  switch (type) {
    case 'incident':
      return {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
          {
            type: 'TextBlock',
            text: '🚨 INCIDENT ALERT: P1 Database Latency Spike',
            weight: 'bolder',
            size: 'medium',
            color: 'attention',
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: 'Monitoring alerted high connection pool saturation across US-East-1 cluster. API p99 latency increased to 1,420ms.',
            wrap: true,
          },
          {
            type: 'FactSet',
            facts: [
              { title: 'Severity:', value: 'P1 - High' },
              { title: 'Service:', value: 'PostgreSQL Primary Replica' },
              { title: 'Triggered By:', value: 'DataDog Webex Alert Hook' },
            ],
          },
          {
            type: 'Input.ChoiceSet',
            id: 'incident_action',
            placeholder: 'Select triage action',
            choices: [
              { title: 'Acknowledge & Assign to On-Call', value: 'ack' },
              { title: 'Open Incident Bridge Meeting', value: 'bridge' },
              { title: 'Roll back recent deployment v2.14', value: 'rollback' },
            ],
          },
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'Confirm Triage Action',
            data: { action: 'triage_incident', incidentId: 'INC-8492' },
          },
          {
            type: 'Action.OpenUrl',
            title: 'View Grafana Dashboard',
            url: 'https://grafana.example.com/d/db-cluster',
          },
        ],
      };

    case 'poll':
      return {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
          {
            type: 'TextBlock',
            text: '📊 Team Poll: Where should we hold Q4 Offsite?',
            weight: 'bolder',
            size: 'medium',
            color: 'accent',
            wrap: true,
          },
          {
            type: 'Input.ChoiceSet',
            id: 'poll_choice',
            choices: [
              { title: '🏔️ Lake Tahoe Mountain Retreat', value: 'tahoe' },
              { title: '🌊 San Diego Beachside Workshop', value: 'sandiego' },
              { title: '🏙️ Downtown Chicago Architecture & Food', value: 'chicago' },
              { title: '💻 Virtual Escape Room + Food Delivery Stipend', value: 'virtual' },
            ],
          },
          {
            type: 'Input.Text',
            id: 'optional_feedback',
            placeholder: 'Any special dietary or scheduling constraints? (Optional)',
            isMultiline: true,
          },
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'Submit Vote',
            data: { action: 'submit_poll', pollId: 'POLL-2026-Q4' },
          },
        ],
      };

    case 'kudos':
      return {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
          {
            type: 'TextBlock',
            text: '🌟 Cisco Webex High Five: Team Kudos!',
            weight: 'bolder',
            size: 'medium',
            color: 'good',
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: 'Shoutout to the frontend engineering squad for shipping Webex SDK 3.0 ahead of schedule with zero regression!',
            wrap: true,
          },
          {
            type: 'Input.Text',
            id: 'kudos_reaction',
            placeholder: 'Add a cheer message to the team...',
            isMultiline: false,
          },
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'Send High Five 🙌',
            data: { action: 'send_kudos', department: 'Engineering' },
          },
        ],
      };

    case 'standup':
    default:
      return {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
          {
            type: 'TextBlock',
            text: '⚡ Daily Async Standup Check-in',
            weight: 'bolder',
            size: 'medium',
            color: 'default',
            wrap: true,
          },
          {
            type: 'Input.Text',
            id: 'yesterday',
            placeholder: '1. What did you accomplish yesterday?',
            isMultiline: true,
          },
          {
            type: 'Input.Text',
            id: 'today',
            placeholder: '2. What are you focusing on today?',
            isMultiline: true,
          },
          {
            type: 'Input.Text',
            id: 'blockers',
            placeholder: '3. Any blockers or dependencies needed?',
            isMultiline: true,
          },
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'Share Standup to Space',
            data: { action: 'submit_standup' },
          },
        ],
      };
  }
}

import { ActionItem, EmployeeProgressUpdate, MeetingAISummary } from '../types/webex';

/**
 * Calculates urgency of a task relative to its due date and the follow-up meeting date.
 */
export function calculateTaskUrgency(
  dueDate: string,
  nextMeetingDate: string,
  now: Date = new Date()
): 'overdue' | 'due_today' | 'due_tomorrow' | 'due_before_next_meeting' | 'on_track' {
  try {
    const due = new Date(dueDate).getTime();
    const nextMeeting = new Date(nextMeetingDate).getTime();
    const current = now.getTime();

    const diffHours = (due - current) / (1000 * 3600);

    if (diffHours < 0) {
      return 'overdue';
    }
    if (diffHours <= 24) {
      return 'due_today';
    }
    if (diffHours <= 48) {
      return 'due_tomorrow';
    }
    if (due < nextMeeting) {
      return 'due_before_next_meeting';
    }
    return 'on_track';
  } catch {
    return 'on_track';
  }
}

/**
 * Aggregates task progress for a meeting.
 */
export function aggregateMeetingProgress(actions: ActionItem[]): {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  completionRate: number;
  pendingWithBlockers: ActionItem[];
} {
  const total = actions.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      completionRate: 100,
      pendingWithBlockers: [],
    };
  }

  const completed = actions.filter((a) => a.status === 'completed' || a.progressPercentage === 100).length;
  const blocked = actions.filter((a) => a.status === 'blocked').length;
  const inProgress = actions.filter((a) => a.status !== 'completed' && a.status !== 'blocked').length;

  const pendingWithBlockers = actions.filter(
    (a) => a.status === 'blocked' || (a.whyPendingReason && a.whyPendingReason.trim().length > 0)
  );

  const completionRate = Math.round((completed / total) * 100);

  return {
    total,
    completed,
    inProgress,
    blocked,
    completionRate,
    pendingWithBlockers,
  };
}

/**
 * Validates an employee progress submission.
 * If task is not 100% completed or is blocked, reasons must be provided so the manager understands.
 */
export function validateEmployeeProgress(update: Partial<EmployeeProgressUpdate>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!update.actionId) {
    errors.push('Action item ID is required');
  }

  const pct = update.progressPercentage ?? 0;
  if (pct < 0 || pct > 100) {
    errors.push('Progress percentage must be between 0 and 100');
  }

  if (pct < 100 && (!update.whyPendingReason || update.whyPendingReason.trim().length === 0)) {
    errors.push('Please specify why the remaining tasks are pending (blockers or dependencies)');
  }

  if (pct > 0 && (!update.completedDetails || update.completedDetails.trim().length === 0)) {
    errors.push('Please detail what specific items have been completed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates an executive briefing comparing previous Webex meeting commitments with current employee progress.
 */
export function generateMeetingRecapBrief(
  summary: MeetingAISummary,
  actions: ActionItem[]
): string {
  const stats = aggregateMeetingProgress(actions);

  const lines = [
    `📊 WEBEX PRE-MEETING BRIEFING`,
    `Previous Meeting: ${summary.meetingTitle} (${new Date(summary.date).toLocaleDateString()})`,
    `Next Follow-Up Meeting: ${summary.nextFollowUpMeetingTitle} (${new Date(summary.nextFollowUpMeetingDate).toLocaleDateString()})`,
    `Action Item Completion: ${stats.completionRate}% (${stats.completed}/${stats.total} delivered)`,
    ``,
    `--- ASSIGNEE ACCOUNTABILITY BREAKDOWN ---`,
  ];

  actions.forEach((act) => {
    const statusIcon =
      act.status === 'completed'
        ? '✅'
        : act.status === 'blocked'
        ? '🛑'
        : act.progressPercentage >= 50
        ? '⏳'
        : '⚠️';

    lines.push(
      `${statusIcon} ${act.assigneeName}: "${act.title}"`
    );
    lines.push(`   Progress: ${act.progressPercentage}% | Due: ${new Date(act.dueDate).toLocaleDateString()}`);
    if (act.completedDetails) {
      lines.push(`   Completed: ${act.completedDetails}`);
    }
    if (act.status !== 'completed') {
      lines.push(`   Pending: ${act.pendingDetails || 'In development'}`);
      lines.push(`   Why Pending / Blocker: ${act.whyPendingReason || 'None recorded'}`);
    }
    lines.push(``);
  });

  return lines.join('\n');
}

import { ReminderJobLog } from '../types/webex';

/**
 * Runs a scan over action items to identify tasks due within 24 hours
 * that require an automated Webex reminder notification.
 */
export function runAutomatedDeadlineReminderScan(
  actions: ActionItem[],
  now: Date = new Date(),
  forceResend: boolean = false
): {
  triggeredActions: ActionItem[];
  updatedActions: ActionItem[];
  logs: ReminderJobLog[];
  summary: string;
} {
  const triggeredActions: ActionItem[] = [];
  const logs: ReminderJobLog[] = [];

  const updatedActions = actions.map((act) => {
    // Skip already completed tasks
    if (act.status === 'completed' || act.progressPercentage === 100) {
      return act;
    }

    const dueTime = new Date(act.dueDate).getTime();
    const currentTime = now.getTime();
    const diffHours = (dueTime - currentTime) / (1000 * 3600);

    // Eligible if due within 24 hours and not overdue by more than 72 hours
    const isWithin24Hours = diffHours >= -72 && diffHours <= 24;

    if (isWithin24Hours && (!act.automatedReminderSent || forceResend)) {
      triggeredActions.push(act);

      logs.push({
        id: 'job_log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: now.toISOString(),
        actionId: act.id,
        actionTitle: act.title,
        assigneeName: act.assigneeName,
        assigneeEmail: act.assigneeEmail,
        dueDate: act.dueDate,
        channel: 'Cisco Webex 1:1 Direct Space + Team Channel',
        status: 'sent',
        reason: `Deadline is in ${Math.max(1, Math.round(diffHours))} hours (<= 24h threshold)`,
      });

      return {
        ...act,
        automatedReminderSent: true,
        reminderSent: true,
        lastReminderSentAt: now.toISOString(),
      };
    }

    return act;
  });

  const summary =
    triggeredActions.length > 0
      ? `Background Job: Detected ${triggeredActions.length} deliverable(s) due within 24 hours. Automated Webex reminders sent to ${triggeredActions.map((a) => a.assigneeName).join(', ')}.`
      : `Background Job: All 24h deadline checks passed. No new reminders required at this time.`;

  return {
    triggeredActions,
    updatedActions,
    logs,
    summary,
  };
}


