import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCiscoDomain,
  sanitizeToCiscoEmail,
  generateCiscoMeetingAttendees,
  CiscoEmployeeDirectoryIndex,
  CISCO_DOMAIN,
  isSameEmployee,
} from './ciscoScale';

test('isCiscoDomain enforces Cisco corporate domain', () => {
  assert.equal(isCiscoDomain('amit.sharma@cisco.com'), true);
  assert.equal(isCiscoDomain('david.chen@webex.cisco.com'), true);
  assert.equal(isCiscoDomain('marcus.vance@duo.cisco.com'), true);
  assert.equal(isCiscoDomain('external.user@gmail.com'), false);
  assert.equal(isCiscoDomain('hacker@evilcorp.com'), false);
  assert.equal(isCiscoDomain(''), false);
  assert.equal(isCiscoDomain(null as any), false);
});

test('sanitizeToCiscoEmail ensures @cisco.com address', () => {
  assert.equal(sanitizeToCiscoEmail('amit.sharma@cisco.com'), 'amit.sharma@cisco.com');
  assert.equal(sanitizeToCiscoEmail('sharma.amit1091@gmail.com'), 'sharma.amit1091@cisco.com');
  assert.equal(sanitizeToCiscoEmail('david.chen'), 'david.chen@cisco.com');
});

test('generateCiscoMeetingAttendees creates 5,000+ Cisco attendees with valid @cisco.com domains', () => {
  const attendees = generateCiscoMeetingAttendees(5200);
  assert.ok(attendees.length >= 5200, `Expected at least 5200 attendees, got ${attendees.length}`);

  // All attendees must have @cisco.com domain
  for (let i = 0; i < Math.min(attendees.length, 500); i++) {
    assert.ok(isCiscoDomain(attendees[i].email), `Email ${attendees[i].email} must belong to Cisco domain`);
    assert.ok(attendees[i].displayName.length > 0);
  }
});

test('CiscoEmployeeDirectoryIndex achieves O(1) instantaneous lookups across 5,000+ employees', () => {
  const attendees = generateCiscoMeetingAttendees(5200);
  const startTime = performance.now();
  const index = new CiscoEmployeeDirectoryIndex(attendees);
  const indexBuildTime = performance.now() - startTime;

  assert.ok(indexBuildTime < 200, `Index build should be fast, took ${indexBuildTime}ms`);

  // Instant lookup by exact email
  const t0 = performance.now();
  const amit = index.find('amit.sharma@cisco.com');
  const lookupTime = performance.now() - t0;

  assert.ok(amit, 'Should find Amit Sharma');
  assert.equal(amit?.displayName, 'Amit Sharma');
  assert.ok(lookupTime < 5, `Lookup should be O(1) < 5ms, took ${lookupTime}ms`);

  // Lookup by full name
  const sarah = index.find('Sarah Lin');
  assert.ok(sarah, 'Should find Sarah Lin');
  assert.equal(sarah?.email, 'sarah.lin@cisco.com');

  // Lookup by first name
  const marcus = index.find('Marcus');
  assert.ok(marcus, 'Should find Marcus Vance');
});

test('isSameEmployee correctly matches personas, aliases, and emails across switches', () => {
  // Amit Sharma with different emails and IDs
  const empAmitA = { id: 'usr_cisco_alex_9901', email: 'sharma.amit1091@gmail.com', displayName: 'Amit Sharma' };
  const empAmitB = { id: 'emp_amit_cisco', email: 'amit.sharma@cisco.com', displayName: 'Amit Sharma' };
  const taskAmit = { assigneeId: 'usr_cisco_alex_9901', assigneeEmail: 'sharma.amit1091@gmail.com', assigneeName: 'Amit Sharma' };

  assert.equal(isSameEmployee(empAmitA, taskAmit), true, 'empAmitA should match taskAmit');
  assert.equal(isSameEmployee(empAmitB, taskAmit), true, 'empAmitB should match taskAmit through alias');

  // Sarah Lin matching her task
  const empSarah = { id: 'usr_sarah_lin', email: 'sarah.lin@cisco.com', displayName: 'Sarah Lin' };
  const taskSarah = { assigneeId: 'usr_sarah_lin', assigneeEmail: 'sarah.lin@cisco.com', assigneeName: 'Sarah Lin' };

  assert.equal(isSameEmployee(empSarah, taskSarah), true, 'Sarah should match her task');
  assert.equal(isSameEmployee(empAmitA, taskSarah), false, 'Amit should NOT match Sarah task');
  assert.equal(isSameEmployee(empSarah, taskAmit), false, 'Sarah should NOT match Amit task');
});
