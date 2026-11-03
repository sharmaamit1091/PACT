export interface WebexUser {
  id: string;
  emails: string[];
  displayName: string;
  nickName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  orgId?: string;
  roles?: string[];
  status?: 'active' | 'call' | 'dnd' | 'inactive' | 'meeting' | 'presenting';
}

export interface WebexSpace {
  id: string;
  title: string;
  type: 'direct' | 'group';
  isLocked: boolean;
  teamId?: string;
  lastActivity: string;
  creatorId?: string;
  created: string;
  unreadCount?: number;
  avatar?: string;
  description?: string;
}

export interface WebexMessage {
  id: string;
  roomId: string;
  roomType: 'direct' | 'group';
  text: string;
  markdown?: string;
  personId: string;
  personEmail: string;
  personDisplayName?: string;
  personAvatar?: string;
  created: string;
  attachments?: WebexAttachment[];
  files?: string[];
  parentId?: string;
}

export interface WebexAttachment {
  contentType: 'application/vnd.microsoft.card.adaptive';
  content: WebexAdaptiveCard;
}

export interface WebexAdaptiveCard {
  $schema?: string;
  type: 'AdaptiveCard';
  version: string;
  body: Array<WebexCardElement>;
  actions?: Array<WebexCardAction>;
}

export interface WebexCardElement {
  type: 'TextBlock' | 'Input.Text' | 'Input.ChoiceSet' | 'Input.Date' | 'ColumnSet' | 'Image' | 'FactSet';
  id?: string;
  text?: string;
  size?: 'small' | 'default' | 'medium' | 'large' | 'extraLarge';
  weight?: 'lighter' | 'default' | 'bolder';
  color?: 'default' | 'dark' | 'light' | 'accent' | 'good' | 'warning' | 'attention';
  wrap?: boolean;
  placeholder?: string;
  isMultiline?: boolean;
  value?: string;
  choices?: Array<{ title: string; value: string }>;
  columns?: Array<{
    type: 'Column';
    width: string;
    items: WebexCardElement[];
  }>;
  url?: string;
  facts?: Array<{ title: string; value: string }>;
}

export interface WebexCardAction {
  type: 'Action.Submit' | 'Action.OpenUrl' | 'Action.ShowCard';
  title: string;
  url?: string;
  data?: Record<string, unknown>;
}

export interface WebexMeeting {
  id: string;
  title: string;
  agenda?: string;
  start: string;
  end: string;
  timezone: string;
  state: 'active' | 'scheduled' | 'ended';
  webLink: string;
  sipAddress?: string;
  meetingNumber: string;
  password?: string;
  hostEmail: string;
  hostDisplayName: string;
  invitees?: string[];
  allowAnyUserToBeCoHost?: boolean;
}

export interface WebexWebhook {
  id: string;
  name: string;
  targetUrl: string;
  resource: 'messages' | 'memberships' | 'meetings' | 'rooms' | 'attachmentActions';
  event: 'created' | 'updated' | 'deleted' | 'all';
  filter?: string;
  secret?: string;
  status: 'active' | 'inactive';
  created: string;
}

export interface WebexWebhookEvent {
  id: string;
  timestamp: string;
  resource: string;
  event: string;
  actorId: string;
  actorEmail?: string;
  data: Record<string, unknown>;
}

export type ConnectionMode = 'demo' | 'token' | 'oauth';

export interface WebexEmployeeProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  isAuthorized: boolean;
  status: 'active' | 'meeting' | 'dnd' | 'inactive';
}

export interface TaskDependency {
  taskOrPerson: string;
  detail: string;
}

export interface EmployeeHelpMessage {
  type: 'assistance' | 'waiting_employee' | 'pending_info' | 'deadline_revision' | 'cannot_complete' | 'other';
  subject: string;
  detail: string;
  timestamp: string;
  resolved?: boolean;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  meetingTitle: string;
  title: string;
  description: string;
  deliverable?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  assigneeAvatar?: string;
  dueDate: string; // ISO string (e.g. tomorrow)
  eta?: string; // Estimated time of completion e.g. "1 day", "6 hours"
  priority?: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: TaskDependency[];
  needsPmReview?: boolean; // Flagged when assignee or deadline was ambiguous in transcript
  uncertaintyReason?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  progressPercentage: number; // 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  completedDetails?: string;
  pendingDetails?: string;
  whyPendingReason?: string;
  lastUpdated?: string;
  lastUpdatedBy?: string;
  nextMeetingDate: string; // Follow-up meeting in 1 week
  reminderSent?: boolean;
  automatedReminderSent?: boolean;
  lastReminderSentAt?: string;
  helpRequested?: boolean;
  helpMessage?: EmployeeHelpMessage;
}

export interface ReminderRecord {
  id: string;
  employeeName: string;
  employeeEmail: string;
  taskId: string;
  taskTitle: string;
  reminderType: 'assignment' | '24h_deadline' | '48h_deadline' | 'overdue' | 'pre_meeting' | 'stale_update' | 'manual' | 'instant';
  timestamp: string;
  status: 'delivered' | 'sent' | 'queued' | 'failed';
  channel: 'Webex Direct Message' | 'Webex Space #engineering-core' | 'In-App Notification';
  message: string;
}

export interface MeetingTranscript {
  id: string;
  meetingId: string;
  meetingTitle: string;
  source: 'host_profile' | 'shared_employee_profile';
  sharedBy: string;
  recordedAt: string;
  rawText: string;
  participantCount: number;
  status: 'available' | 'analyzed' | 'pending_analysis';
  hostName: string;
  hostEmail: string;
}

export interface ReminderJobLog {
  id: string;
  timestamp: string;
  actionId?: string;
  actionTitle?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  dueDate?: string;
  channel?: string;
  status: 'sent' | 'skipped' | 'idle' | 'paused';
  reason?: string;
  message?: string;
}

export interface EmployeeProgressUpdate {
  actionId: string;
  employeeEmail: string;
  progressPercentage: number;
  completedDetails: string;
  pendingDetails: string;
  whyPendingReason: string;
  status: 'in_progress' | 'completed' | 'blocked';
  timestamp: string;
}

export interface MeetingAISummary {
  meetingId: string;
  meetingTitle: string;
  date: string;
  duration: string;
  hostName: string;
  hostEmail: string;
  executiveSummary: string;
  keyDiscussions: string[];
  identifiedDecisions: string[];
  actionItems: ActionItem[];
  nextFollowUpMeetingDate: string;
  nextFollowUpMeetingTitle: string;
}

export interface WebexAuthStatus {
  connected: boolean;
  mode: ConnectionMode;
  user: WebexUser | null;
  tokenType?: string;
  expiresIn?: number;
  scopes?: string[];
}

