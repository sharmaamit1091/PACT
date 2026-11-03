import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTranscriptForTasks,
  validateProgressUpdate,
  evaluateTaskReminders,
} from './aiTaskParser';
import { WebexEmployeeProfile, ActionItem } from '../types/webex';

const sampleEmployees: WebexEmployeeProfile[] = [
  {
    id: 'emp_amit',
    displayName: 'Amit Sharma',
    firstName: 'Amit',
    lastName: 'Sharma',
    email: 'sharma.amit1091@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'Senior Fullstack Engineer',
    department: 'Engineering Core',
    isAuthorized: true,
    status: 'active',
  },
  {
    id: 'emp_sarah',
    displayName: 'Sarah Lin',
    firstName: 'Sarah',
    lastName: 'Lin',
    email: 'sarah.lin@companya.enterprise.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'Frontend Lead',
    department: 'Product Experience',
    isAuthorized: true,
    status: 'meeting',
  },
  {
    id: 'emp_marcus',
    displayName: 'Marcus Vance',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@companya.enterprise.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'Security & DevOps Specialist',
    department: 'Infrastructure',
    isAuthorized: true,
    status: 'active',
  },
];

const meetingInfo = {
  id: 'mtg_company_a_01',
  title: 'Company A: Architecture & Sizing Sync',
  nextMeetingDate: new Date('2026-11-07T10:00:00Z').toISOString(),
};

test('parseTranscriptForTasks extracts tasks with assignees, deliverables, deadlines, and dependencies', () => {
  const transcript = `
David Chen (Host): Good morning team. We have multiple deliverables to align for next week's review.
Amit Sharma: I will deliver the core Webex integration API and webhook receiver tomorrow. It will take 1 day.
Sarah Lin: I am working on the UI cards and stage views by Friday, but I am waiting for Amit's API to test end to end.
David Chen: Someone needs to configure the Redis cluster by tomorrow.
Marcus Vance: I already finished the Control Hub security audit.
`;

  const refDate = new Date('2026-10-31T10:00:00Z');
  const result = parseTranscriptForTasks(transcript, sampleEmployees, meetingInfo, [], refDate);

  // Amit's task should be extracted with tomorrow's deadline
  const amitTask = result.tasks.find((t) => t.assigneeId === 'emp_amit');
  assert.ok(amitTask, 'Amit task should be extracted');
  assert.equal(amitTask?.assigneeName, 'Amit Sharma');
  assert.match(amitTask?.title || '', /deliver the core Webex integration API/i);
  assert.equal(amitTask?.needsPmReview, false);

  // Sarah's task should have dependency recorded
  const sarahTask = result.tasks.find((t) => t.assigneeId === 'emp_sarah');
  assert.ok(sarahTask, 'Sarah task should be extracted');
  assert.ok(sarahTask?.dependencies && sarahTask.dependencies.length > 0, 'Sarah should have dependencies');
  assert.match(sarahTask?.dependencies?.[0].taskOrPerson || '', /Amit/i);

  // Ambiguous task ("Someone needs to configure Redis cluster") should be flagged for PM review
  assert.ok(result.ambiguousTasks.length >= 1, 'Ambiguous task must be routed to PM review');
  const redisTask = result.ambiguousTasks.find((t) => t.title.toLowerCase().includes('redis'));
  assert.ok(redisTask, 'Redis task should be in ambiguous list');
  assert.equal(redisTask?.needsPmReview, true);
  assert.equal(redisTask?.assigneeId, 'unassigned');
  assert.match(redisTask?.uncertaintyReason || '', /not explicitly specified|ambiguous/i);

  // Detected participants
  assert.ok(result.detectedParticipants.includes('Amit Sharma'));
  assert.ok(result.detectedParticipants.includes('Sarah Lin'));
});

test('parseTranscriptForTasks avoids duplicate tasks', () => {
  const existing: ActionItem = {
    id: 'act_existing',
    meetingId: meetingInfo.id,
    meetingTitle: meetingInfo.title,
    title: 'Deliver the core Webex integration API and webhook receiver',
    description: 'Existing task',
    assigneeId: 'emp_amit',
    assigneeName: 'Amit Sharma',
    assigneeEmail: 'sharma.amit1091@gmail.com',
    dueDate: '2026-11-01T10:00:00Z',
    status: 'in_progress',
    progressPercentage: 50,
    nextMeetingDate: meetingInfo.nextMeetingDate,
  };

  const transcript = `
Amit Sharma: I will deliver the core Webex integration API and webhook receiver tomorrow.
`;

  const result = parseTranscriptForTasks(transcript, sampleEmployees, meetingInfo, [existing]);
  assert.equal(result.tasks.length, 0, 'Should not duplicate existing task');
});

test('validateProgressUpdate enforces PM read-only constraint and 10% step increments', () => {
  const targetTask: ActionItem = {
    id: 'act_amit_01',
    meetingId: meetingInfo.id,
    meetingTitle: meetingInfo.title,
    title: 'Deliver Core Webex API',
    description: 'Build backend routes',
    assigneeId: 'emp_amit',
    assigneeName: 'Amit Sharma',
    assigneeEmail: 'sharma.amit1091@gmail.com',
    dueDate: '2026-11-01T10:00:00Z',
    status: 'in_progress',
    progressPercentage: 30,
    nextMeetingDate: meetingInfo.nextMeetingDate,
  };

  // 1. Host tries to edit employee progress -> MUST BE REJECTED (Read-Only)
  const hostResult = validateProgressUpdate(
    targetTask.id,
    targetTask,
    'emp_david_host',
    'david.chen@cisco.com',
    'host',
    50,
    'Host tried updating',
    'None'
  );
  assert.equal(hostResult.allowed, false);
  assert.match(hostResult.error || '', /read-only access/i);

  // 2. Different employee tries to update Amit's task -> MUST BE REJECTED
  const wrongEmpResult = validateProgressUpdate(
    targetTask.id,
    targetTask,
    'emp_sarah',
    'sarah.lin@companya.enterprise.com',
    'employee',
    40,
    'Sarah tried updating Amit task',
    'None'
  );
  assert.equal(wrongEmpResult.allowed, false);
  assert.match(wrongEmpResult.error || '', /Only Amit Sharma/i);

  // 3. Amit updates with invalid non-10% step (e.g. 37%) -> MUST BE REJECTED
  const invalidStep = validateProgressUpdate(
    targetTask.id,
    targetTask,
    'emp_amit',
    'sharma.amit1091@gmail.com',
    'employee',
    37,
    'Updated endpoints',
    'Waiting on network'
  );
  assert.equal(invalidStep.allowed, false);
  assert.match(invalidStep.error || '', /10% increments/i);

  // 4. Amit updates with <100% and NO blocker reason -> MUST BE REJECTED
  const noReason = validateProgressUpdate(
    targetTask.id,
    targetTask,
    'emp_amit',
    'sharma.amit1091@gmail.com',
    'employee',
    70,
    'Updated endpoints',
    '' // Missing reason
  );
  assert.equal(noReason.allowed, false);
  assert.match(noReason.error || '', /reason or blocker/i);

  // 5. Valid 10% update by Amit with reason -> ALLOWED
  const validUpdate = validateProgressUpdate(
    targetTask.id,
    targetTask,
    'emp_amit',
    'sharma.amit1091@gmail.com',
    'employee',
    80,
    'Scaffolded express routes and node:test suites passing',
    'Waiting on SecOps firewall ticket #4192 for webhook inbound IP'
  );
  assert.equal(validUpdate.allowed, true);
  assert.equal(validUpdate.error, undefined);
});

test('evaluateTaskReminders logs automatic reminders for 24h deadline', () => {
  const now = new Date('2026-10-31T10:00:00Z');
  const taskDueIn8Hours: ActionItem = {
    id: 't1',
    meetingId: 'm1',
    meetingTitle: 'Sync',
    title: 'Deploy Production Webhook',
    description: 'Inbound handler',
    assigneeId: 'emp_amit',
    assigneeName: 'Amit Sharma',
    assigneeEmail: 'sharma.amit1091@gmail.com',
    dueDate: new Date('2026-10-31T18:00:00Z').toISOString(), // 8 hours away
    status: 'in_progress',
    progressPercentage: 50,
    nextMeetingDate: '2026-11-07T10:00:00Z',
    automatedReminderSent: false,
  };

  const { reminders, updatedTasks } = evaluateTaskReminders([taskDueIn8Hours], now);
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].reminderType, '24h_deadline');
  assert.equal(reminders[0].employeeEmail, 'sharma.amit1091@gmail.com');
  assert.equal(updatedTasks[0].automatedReminderSent, true);
});
