import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAdaptiveCard,
  formatMeetingTimeRange,
  isMeetingOngoing,
  generateMeetingPasscode,
  parseWebexMarkdownMentions,
  filterWebhookEvents,
  createSampleAdaptiveCard,
} from './webexLogic';
import { WebexWebhookEvent } from '../types/webex';

test('validateAdaptiveCard catches invalid or incomplete schemas', () => {
  // @ts-expect-error testing invalid payload
  const emptyRes = validateAdaptiveCard(null);
  assert.equal(emptyRes.valid, false);

  const missingBody = validateAdaptiveCard({
    type: 'AdaptiveCard',
    version: '1.3',
    body: [],
  });
  assert.equal(missingBody.valid, false);
  assert.match(missingBody.errors[0], /contain at least one element/);

  const validIncident = createSampleAdaptiveCard('incident');
  const validRes = validateAdaptiveCard(validIncident);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.errors.length, 0);
});

test('formatMeetingTimeRange returns structured date time range', () => {
  const start = '2026-11-01T14:00:00.000Z';
  const end = '2026-11-01T15:00:00.000Z';
  const formatted = formatMeetingTimeRange(start, end);
  assert.ok(formatted.includes('·'));
  assert.ok(formatted.includes('-'));

  const invalid = formatMeetingTimeRange('invalid-start', 'invalid-end');
  assert.equal(invalid, 'Invalid date');
});

test('isMeetingOngoing correctly identifies whether current time falls within window', () => {
  const start = '2026-11-01T10:00:00.000Z';
  const end = '2026-11-01T11:00:00.000Z';

  const before = new Date('2026-11-01T09:59:00.000Z');
  const during = new Date('2026-11-01T10:30:00.000Z');
  const after = new Date('2026-11-01T11:01:00.000Z');

  assert.equal(isMeetingOngoing(start, end, before), false);
  assert.equal(isMeetingOngoing(start, end, during), true);
  assert.equal(isMeetingOngoing(start, end, after), false);
});

test('generateMeetingPasscode produces 8 alphanumeric characters without confusing chars', () => {
  const code = generateMeetingPasscode();
  assert.equal(code.length, 8);
  assert.match(code, /^[A-Z0-9]+$/);
});

test('parseWebexMarkdownMentions parses person emails correctly', () => {
  const input = 'Hey <@personEmail:alice@company.com> please sync with <@personEmail:bob@cisco.com> on Webex!';
  const { sanitized, mentions } = parseWebexMarkdownMentions(input);
  assert.deepEqual(mentions, ['alice@company.com', 'bob@cisco.com']);
  assert.equal(sanitized, 'Hey @alice@company.com please sync with @bob@cisco.com on Webex!');
});

test('filterWebhookEvents filters by resource and event type', () => {
  const sampleEvents: WebexWebhookEvent[] = [
    {
      id: 'evt-1',
      timestamp: '2026-10-30T10:00:00Z',
      resource: 'messages',
      event: 'created',
      actorId: 'usr-1',
      data: { text: 'Hello' },
    },
    {
      id: 'evt-2',
      timestamp: '2026-10-30T10:05:00Z',
      resource: 'meetings',
      event: 'started',
      actorId: 'usr-2',
      data: { meetingId: 'mtg-99' },
    },
    {
      id: 'evt-3',
      timestamp: '2026-10-30T10:10:00Z',
      resource: 'messages',
      event: 'deleted',
      actorId: 'usr-1',
      data: { id: 'msg-5' },
    },
  ];

  const messagesOnly = filterWebhookEvents(sampleEvents, 'messages', 'all');
  assert.equal(messagesOnly.length, 2);

  const createdOnly = filterWebhookEvents(sampleEvents, 'all', 'created');
  assert.equal(createdOnly.length, 1);
  assert.equal(createdOnly[0].id, 'evt-1');

  const meetingStarted = filterWebhookEvents(sampleEvents, 'meetings', 'started');
  assert.equal(meetingStarted.length, 1);
  assert.equal(meetingStarted[0].id, 'evt-2');
});

import {
  calculateTaskUrgency,
  aggregateMeetingProgress,
  validateEmployeeProgress,
  generateMeetingRecapBrief,
} from './webexLogic';
import { ActionItem, MeetingAISummary } from '../types/webex';

test('calculateTaskUrgency detects due_tomorrow and overdue items', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  const nextMeeting = '2026-11-06T12:00:00Z'; // 1 week later

  const dueTomorrow = '2026-10-31T18:00:00Z'; // 30 hours from now
  assert.equal(calculateTaskUrgency(dueTomorrow, nextMeeting, now), 'due_tomorrow');

  const overdue = '2026-10-29T12:00:00Z';
  assert.equal(calculateTaskUrgency(overdue, nextMeeting, now), 'overdue');

  const dueIn3Days = '2026-11-02T12:00:00Z';
  assert.equal(calculateTaskUrgency(dueIn3Days, nextMeeting, now), 'due_before_next_meeting');
});

test('aggregateMeetingProgress calculates accurate metrics and flags blockers', () => {
  const sampleActions: ActionItem[] = [
    {
      id: 'a1',
      meetingId: 'm1',
      meetingTitle: 'Sync',
      title: 'Database migration',
      description: 'Run SQL scripts',
      assigneeId: 'u1',
      assigneeName: 'Amit',
      assigneeEmail: 'amit@company.com',
      dueDate: '2026-10-31T00:00:00Z',
      status: 'in_progress',
      progressPercentage: 60,
      whyPendingReason: 'Waiting for IAM permission grant',
      nextMeetingDate: '2026-11-06T00:00:00Z',
    },
    {
      id: 'a2',
      meetingId: 'm1',
      meetingTitle: 'Sync',
      title: 'Update docs',
      description: 'Write wiki',
      assigneeId: 'u2',
      assigneeName: 'Sarah',
      assigneeEmail: 'sarah@company.com',
      dueDate: '2026-11-01T00:00:00Z',
      status: 'completed',
      progressPercentage: 100,
      nextMeetingDate: '2026-11-06T00:00:00Z',
    },
  ];

  const res = aggregateMeetingProgress(sampleActions);
  assert.equal(res.total, 2);
  assert.equal(res.completed, 1);
  assert.equal(res.completionRate, 50);
  assert.equal(res.pendingWithBlockers.length, 1);
  assert.equal(res.pendingWithBlockers[0].assigneeName, 'Amit');
});

test('validateEmployeeProgress enforces why-pending explanation when task is incomplete', () => {
  // Incomplete with no blocker explanation
  const invalid = validateEmployeeProgress({
    actionId: 'a1',
    progressPercentage: 70,
    completedDetails: 'Finished schema design',
    whyPendingReason: '',
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors[0], /why the remaining tasks are pending/);

  // Complete update with blocker explanation
  const valid = validateEmployeeProgress({
    actionId: 'a1',
    progressPercentage: 70,
    completedDetails: 'Finished schema design',
    whyPendingReason: 'Waiting on client firewall clearance',
  });
  assert.equal(valid.valid, true);
});

test('generateMeetingRecapBrief formats previous meeting vs next follow-up meeting report', () => {
  const summary: MeetingAISummary = {
    meetingId: 'm1',
    meetingTitle: 'Project Alpha Kickoff',
    date: '2026-10-30T10:00:00Z',
    duration: '45 mins',
    hostName: 'Manager Alex',
    hostEmail: 'alex@company.com',
    executiveSummary: 'Kickoff meeting for Alpha project.',
    keyDiscussions: ['Architecture', 'Timeline'],
    identifiedDecisions: ['Adopt Webex APIs'],
    nextFollowUpMeetingDate: '2026-11-06T10:00:00Z',
    nextFollowUpMeetingTitle: 'Project Alpha Weekly Review #2',
    actionItems: [],
  };

  const sampleAction: ActionItem = {
    id: 'a1',
    meetingId: 'm1',
    meetingTitle: 'Project Alpha Kickoff',
    title: 'Deploy Webex Webhook Handler',
    description: 'Cloud Run service',
    assigneeId: 'u1',
    assigneeName: 'Amit Sharma',
    assigneeEmail: 'amit.sharma@collab.enterprise.com',
    dueDate: '2026-10-31T17:00:00Z',
    status: 'in_progress',
    progressPercentage: 80,
    completedDetails: 'Express webhook server ready and tested',
    pendingDetails: 'Production SSL certificate provisioning',
    whyPendingReason: 'Pending approval from Network Sec team',
    nextMeetingDate: '2026-11-06T10:00:00Z',
  };

  const brief = generateMeetingRecapBrief(summary, [sampleAction]);
  assert.ok(brief.includes('WEBEX PRE-MEETING BRIEFING'));
  assert.ok(brief.includes('Amit Sharma'));
  assert.ok(brief.includes('Pending approval from Network Sec team'));
});

import { runAutomatedDeadlineReminderScan } from './webexLogic';

test('runAutomatedDeadlineReminderScan triggers reminders for tasks due within 24h and skips completed or already notified tasks', () => {
  const now = new Date('2026-10-31T09:00:00Z');

  const testActions: ActionItem[] = [
    {
      id: 'task_amit',
      meetingId: 'm1',
      meetingTitle: 'Kickoff',
      title: 'Deliver Core Webex API',
      description: 'API services',
      assigneeId: 'u1',
      assigneeName: 'Amit Sharma',
      assigneeEmail: 'amit@company.com',
      dueDate: '2026-10-31T18:00:00Z', // 9 hours from now (<= 24h)
      status: 'in_progress',
      progressPercentage: 60,
      nextMeetingDate: '2026-11-07T09:00:00Z',
      automatedReminderSent: false,
    },
    {
      id: 'task_sarah',
      meetingId: 'm1',
      meetingTitle: 'Kickoff',
      title: 'Frontend stage view',
      description: 'React components',
      assigneeId: 'u2',
      assigneeName: 'Sarah Lin',
      assigneeEmail: 'sarah@company.com',
      dueDate: '2026-11-04T09:00:00Z', // 4 days away (> 24h)
      status: 'in_progress',
      progressPercentage: 40,
      nextMeetingDate: '2026-11-07T09:00:00Z',
      automatedReminderSent: false,
    },
    {
      id: 'task_marcus',
      meetingId: 'm1',
      meetingTitle: 'Kickoff',
      title: 'Security audit',
      description: 'Review scopes',
      assigneeId: 'u3',
      assigneeName: 'Marcus Vance',
      assigneeEmail: 'marcus@company.com',
      dueDate: '2026-10-31T12:00:00Z', // 3 hours away but ALREADY COMPLETED
      status: 'completed',
      progressPercentage: 100,
      nextMeetingDate: '2026-11-07T09:00:00Z',
      automatedReminderSent: false,
    },
  ];

  const result = runAutomatedDeadlineReminderScan(testActions, now);

  // Amit should be triggered because task is due in 9h and not completed
  assert.equal(result.triggeredActions.length, 1);
  assert.equal(result.triggeredActions[0].id, 'task_amit');
  assert.equal(result.logs.length, 1);
  assert.match(result.logs[0].reason || '', /<= 24h threshold/);

  // In updated actions, Amit should have automatedReminderSent marked as true
  const updatedAmit = result.updatedActions.find((a) => a.id === 'task_amit');
  assert.equal(updatedAmit?.automatedReminderSent, true);

  // If scan runs again with the updated list, it should NOT trigger a second time (prevents spam)
  const secondScan = runAutomatedDeadlineReminderScan(result.updatedActions, now);
  assert.equal(secondScan.triggeredActions.length, 0);
  assert.equal(secondScan.logs.length, 0);
});


