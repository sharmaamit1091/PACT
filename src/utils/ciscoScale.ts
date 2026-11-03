import { WebexEmployeeProfile, ActionItem, WebexMeeting, MeetingTranscript } from '../types/webex';

export const CISCO_DOMAIN = 'cisco.com';
export const CISCO_ORG_ID = 'CISCO-WX-CORP-01';

/**
 * Validates whether an email address belongs strictly to the authorized Cisco domain.
 */
export function isCiscoDomain(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return (
    domain === 'cisco.com' ||
    domain === 'webex.cisco.com' ||
    domain === 'meraki.cisco.com' ||
    domain === 'duo.cisco.com' ||
    domain === 'thousandeyes.cisco.com' ||
    domain === 'splunk.cisco.com'
  );
}

/**
 * Ensures a Cisco email address by defaulting or transforming to @cisco.com.
 */
export function sanitizeToCiscoEmail(emailOrUsername: string): string {
  if (!emailOrUsername) return 'employee@cisco.com';
  const clean = emailOrUsername.trim().toLowerCase();
  if (isCiscoDomain(clean)) return clean;
  if (clean.includes('@')) {
    const username = clean.split('@')[0];
    return `${username}@cisco.com`;
  }
  return `${clean}@cisco.com`;
}

/**
 * High-performance indexed directory for 5,000+ Cisco meeting attendees.
 * Enables O(1) hash lookups during speech-to-text transcript parsing.
 */
export class CiscoEmployeeDirectoryIndex {
  private byEmail = new Map<string, WebexEmployeeProfile>();
  private byFullName = new Map<string, WebexEmployeeProfile>();
  private byFirstName = new Map<string, WebexEmployeeProfile[]>();
  private byLastName = new Map<string, WebexEmployeeProfile[]>();
  private allList: WebexEmployeeProfile[] = [];

  constructor(employees: WebexEmployeeProfile[]) {
    this.rebuild(employees);
  }

  public rebuild(employees: WebexEmployeeProfile[]): void {
    this.allList = employees;
    this.byEmail.clear();
    this.byFullName.clear();
    this.byFirstName.clear();
    this.byLastName.clear();

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const emailLower = emp.email.toLowerCase().trim();
      const nameLower = emp.displayName.toLowerCase().trim();

      this.byEmail.set(emailLower, emp);
      if (emp.displayName.toLowerCase() === 'amit sharma') {
        this.byEmail.set('sharma.amit1091@gmail.com', emp);
        this.byEmail.set('amit.sharma@cisco.com', emp);
      }
      if (!this.byFullName.has(nameLower)) {
        this.byFullName.set(nameLower, emp);
      }

      // Index first name
      const fn = (emp.firstName || emp.displayName.split(' ')[0] || '').toLowerCase().trim();
      if (fn) {
        let list = this.byFirstName.get(fn);
        if (!list) {
          list = [];
          this.byFirstName.set(fn, list);
        }
        list.push(emp);
      }

      // Index last name
      const ln = (emp.lastName || emp.displayName.split(' ').slice(1).join(' ') || '').toLowerCase().trim();
      if (ln) {
        let list = this.byLastName.get(ln);
        if (!list) {
          list = [];
          this.byLastName.set(ln, list);
        }
        list.push(emp);
      }
    }
  }

  public find(query: string): WebexEmployeeProfile | undefined {
    if (!query) return undefined;
    const q = query.toLowerCase().trim();

    // 1. Exact email match (O(1))
    const emailMatch = this.byEmail.get(q);
    if (emailMatch) return emailMatch;

    // 2. Exact full name match (O(1))
    const nameMatch = this.byFullName.get(q);
    if (nameMatch) return nameMatch;

    // 3. First name exact match (if unique)
    const fnMatches = this.byFirstName.get(q);
    if (fnMatches && fnMatches.length === 1) return fnMatches[0];

    // 4. Last name exact match (if unique)
    const lnMatches = this.byLastName.get(q);
    if (lnMatches && lnMatches.length === 1) return lnMatches[0];

    // 5. If query contains space, check for substring match in high-priority attendees
    for (let i = 0; i < Math.min(this.allList.length, 500); i++) {
      const emp = this.allList[i];
      if (emp.displayName.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q)) {
        return emp;
      }
    }

    return undefined;
  }

  public get totalCount(): number {
    return this.allList.length;
  }

  public get rawList(): WebexEmployeeProfile[] {
    return this.allList;
  }
}

const CISCO_FIRST_NAMES = [
  'Amit', 'Sarah', 'Marcus', 'Elena', 'David', 'Carlos', 'Priya', 'Vikram',
  'Jessica', 'Michael', 'Lin', 'Kenji', 'Fatima', 'Rohan', 'Sophie', 'Alex',
  'Tanya', 'Daniel', 'Amina', 'Gabriel', 'Chloe', 'Arjun', 'Zoe', 'Wei',
  'Liam', 'Hana', 'Mateo', 'Nadia', 'Kiran', 'Oliver', 'Deepa', 'Lucas'
];

const CISCO_LAST_NAMES = [
  'Sharma', 'Lin', 'Vance', 'Rostova', 'Chen', 'Rodriguez', 'Patel', 'Nair',
  'Taylor', 'Brown', 'Wang', 'Takahashi', 'Al-Mansoor', 'Verma', 'Dubois', 'Mercer',
  'Novak', 'Kim', 'Diallo', 'Silva', 'Martin', 'Kapoor', 'Anderson', 'Zhang',
  'Davies', 'Sato', 'Morales', 'Petrova', 'Joshi', 'Schmidt', 'Rao', 'Santos'
];

const CISCO_DEPARTMENTS = [
  'Cisco Webex Collaboration Core',
  'Cisco Enterprise Catalyst Networking',
  'Cisco Meraki Cloud Architecture',
  'Cisco Security & Trust (Duo & Talos)',
  'Cisco ThousandEyes & Splunk Observability',
  'Cisco Silicon One Hardware Engineering',
  'Cisco AI Research & Infrastructure',
  'Cisco Global Customer Success & TAC'
];

const CISCO_ROLES = [
  'Principal Systems Engineer',
  'Lead Webex API Architect',
  'Senior Cloud DevOps Specialist',
  'Zero-Trust Security Engineer',
  'Distributed Systems Engineer',
  'Frontend Experience Lead',
  'Site Reliability Architect',
  'Fullstack Solutions Architect'
];

/**
 * Robust equality check between an employee profile and an action item's assignee.
 * Handles ID aliases, email aliases (sharma.amit1091@gmail.com and amit.sharma@cisco.com),
 * and case-insensitive display name matching.
 */
export function isSameEmployee(
  empA: { id?: string; email?: string; displayName?: string } | null | undefined,
  empB: {
    id?: string;
    email?: string;
    displayName?: string;
    assigneeId?: string;
    assigneeEmail?: string;
    assigneeName?: string;
  } | null | undefined
): boolean {
  if (!empA || !empB) return false;

  const idA = empA.id?.toLowerCase().trim();
  const idB = (empB.assigneeId || empB.id)?.toLowerCase().trim();

  // 1. Direct ID match
  if (idA && idB && idA === idB) return true;

  // 2. ID Aliases (e.g., usr_cisco_alex_9901 vs emp_amit_cisco)
  const idAliases: Record<string, string[]> = {
    'usr_cisco_alex_9901': ['usr_cisco_alex_9901', 'emp_amit_cisco', 'usr_current_user'],
    'emp_amit_cisco': ['usr_cisco_alex_9901', 'emp_amit_cisco', 'usr_current_user'],
    'usr_current_user': ['usr_cisco_alex_9901', 'emp_amit_cisco', 'usr_current_user'],
    'usr_sarah_lin': ['usr_sarah_lin', 'emp_sarah_cisco'],
    'emp_sarah_cisco': ['usr_sarah_lin', 'emp_sarah_cisco'],
    'usr_marcus_vance': ['usr_marcus_vance', 'emp_marcus_cisco'],
    'emp_marcus_cisco': ['usr_marcus_vance', 'emp_marcus_cisco'],
    'usr_elena_rostova': ['usr_elena_rostova', 'emp_elena_cisco'],
    'emp_elena_cisco': ['usr_elena_rostova', 'emp_elena_cisco'],
    'usr_manager_host': ['usr_manager_host', 'emp_david_host'],
    'emp_david_host': ['usr_manager_host', 'emp_david_host'],
  };

  if (idA && idB) {
    if (idAliases[idA]?.includes(idB) || idAliases[idB]?.includes(idA)) {
      return true;
    }
  }

  // 3. Email match (case-insensitive)
  const emailA = empA.email?.toLowerCase().trim();
  const emailB = (empB.assigneeEmail || empB.email)?.toLowerCase().trim();
  if (emailA && emailB) {
    if (emailA === emailB) return true;
    // Amit Sharma's email aliases: sharma.amit1091@gmail.com and amit.sharma@cisco.com
    const amitEmails = ['sharma.amit1091@gmail.com', 'amit.sharma@cisco.com'];
    if (amitEmails.includes(emailA) && amitEmails.includes(emailB)) {
      return true;
    }
  }

  // 4. Display Name match (case-insensitive, e.g. "Amit Sharma" === "Amit Sharma")
  const nameA = empA.displayName?.toLowerCase().trim();
  const nameB = (empB.assigneeName || empB.displayName)?.toLowerCase().trim();
  if (nameA && nameB && nameA === nameB) {
    return true;
  }

  return false;
}

/**
 * Generates 5,000+ realistic Cisco enterprise employee attendee records
 * simulating large-scale Webex All-Hands and Architecture Town Halls.
 */
export function generateCiscoMeetingAttendees(count: number = 5240): WebexEmployeeProfile[] {
  const employees: WebexEmployeeProfile[] = [];

  // Key Named Attendees (Pinned to ensure deterministic commitments)
  const coreAttendees: WebexEmployeeProfile[] = [
    {
      id: 'usr_cisco_alex_9901',
      displayName: 'Amit Sharma',
      firstName: 'Amit',
      lastName: 'Sharma',
      email: 'amit.sharma@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'Lead Webex Integration Architect',
      department: 'Cisco Webex Collaboration Core',
      isAuthorized: true,
      status: 'active',
    },
    {
      id: 'usr_sarah_lin',
      displayName: 'Sarah Lin',
      firstName: 'Sarah',
      lastName: 'Lin',
      email: 'sarah.lin@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'Frontend Experience Lead',
      department: 'Cisco Webex Collaboration Core',
      isAuthorized: true,
      status: 'meeting',
    },
    {
      id: 'usr_marcus_vance',
      displayName: 'Marcus Vance',
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'Zero-Trust Security Architect',
      department: 'Cisco Security & Trust (Duo & Talos)',
      isAuthorized: true,
      status: 'active',
    },
    {
      id: 'usr_elena_rostova',
      displayName: 'Elena Rostova',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      role: 'Quality & Test Automation Lead',
      department: 'Cisco Enterprise Catalyst Networking',
      isAuthorized: true,
      status: 'active',
    },
    {
      id: 'usr_manager_host',
      displayName: 'David Chen',
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: 'Meeting Host & Engineering Director',
      department: 'Cisco Webex Collaboration Core',
      isAuthorized: true,
      status: 'active',
    },
    {
      id: 'emp_carlos_cisco',
      displayName: 'Carlos Rodriguez',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      email: 'carlos.rodriguez@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'Senior Cloud Infrastructure Engineer',
      department: 'Cisco Meraki Cloud Architecture',
      isAuthorized: true,
      status: 'active',
    },
    {
      id: 'emp_priya_cisco',
      displayName: 'Priya Nair',
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      role: 'Principal Observability Architect',
      department: 'Cisco ThousandEyes & Splunk Observability',
      isAuthorized: true,
      status: 'meeting',
    },
    {
      id: 'emp_vikram_cisco',
      displayName: 'Vikram Patel',
      firstName: 'Vikram',
      lastName: 'Patel',
      email: 'vikram.patel@cisco.com',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      role: 'Silicon Systems Engineer',
      department: 'Cisco Silicon One Hardware Engineering',
      isAuthorized: true,
      status: 'active',
    },
  ];

  employees.push(...coreAttendees);

  // Generate the remaining thousands of Cisco attendees
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
  ];

  const targetCount = Math.max(count, 5200);
  for (let i = employees.length; i < targetCount; i++) {
    const fn = CISCO_FIRST_NAMES[i % CISCO_FIRST_NAMES.length];
    const ln = CISCO_LAST_NAMES[Math.floor(i / CISCO_FIRST_NAMES.length) % CISCO_LAST_NAMES.length];
    const serial = i + 100;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${serial}@cisco.com`;
    const dept = CISCO_DEPARTMENTS[i % CISCO_DEPARTMENTS.length];
    const role = CISCO_ROLES[i % CISCO_ROLES.length];
    const avatar = avatars[i % avatars.length];

    employees.push({
      id: `cisco_emp_${serial}`,
      displayName: `${fn} ${ln}`,
      firstName: fn,
      lastName: ln,
      email,
      avatar,
      role,
      department: dept,
      isAuthorized: true,
      status: i % 7 === 0 ? 'meeting' : i % 11 === 0 ? 'dnd' : 'active',
    });
  }

  return employees;
}

/**
 * Large-Scale Meeting Data simulating Cisco Webex All-Hands
 */
export const CISCO_LARGE_MEETING: WebexMeeting = {
  id: 'mtg_cisco_allhands_q4',
  title: 'Cisco Global Engineering & Collaboration All-Hands: Architecture Sync',
  agenda: 'Quarterly architecture commitments, high-scale deliverable accountability, and 1-week follow-up milestone review.',
  start: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  end: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  timezone: 'America/Los_Angeles',
  state: 'ended',
  webLink: 'https://cisco.webex.com/cisco/j.php?MTID=m98a721c4b78912',
  meetingNumber: '2598 481 0422',
  hostEmail: 'david.chen@cisco.com',
  hostDisplayName: 'David Chen (Host)',
  allowAnyUserToBeCoHost: false,
};

/**
 * Transcript for 5,000+ attendee Cisco All-Hands meeting
 */
export const CISCO_LARGE_TRANSCRIPT: MeetingTranscript = {
  id: 'tr_cisco_allhands_q4',
  meetingId: 'mtg_cisco_allhands_q4',
  meetingTitle: 'Cisco Global Engineering & Collaboration All-Hands: Architecture Sync',
  source: 'host_profile',
  sharedBy: 'David Chen (Host Profile)',
  recordedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  participantCount: 5240,
  status: 'analyzed',
  hostName: 'David Chen',
  hostEmail: 'david.chen@cisco.com',
  rawText: `David Chen (Host): Good morning Cisco engineering team. We have 5,240 attendees connected live across San Jose, Bangalore, London, Tokyo, and Sydney.
David Chen (Host): Our core focus today is locking down deliverables, assigning explicit ETAs, and setting automated Webex reminder intervals.
David Chen (Host): Remember: in exactly 1 week, we will reconvene for our follow-up demonstration. Every commitment will be tracked.
Amit Sharma: I am taking ownership of delivering the core Webex REST webhook event pipeline on cisco.com domain. I will complete this tomorrow. ETA is 24 hours.
David Chen (Host): Thank you Amit. Tomorrow's ETA is critical. The UI squad is blocked until your API contracts are published.
Sarah Lin: I will deliver the Webex Adaptive Card stage components and mobile responsiveness in 3 days. My ETA is 72 hours, but testing is waiting on Amit's webhook contract tomorrow.
Marcus Vance: I have already finalized the Cisco Control Hub Zero-Trust token audit and OAuth 2.0 PKCE scope restrictions. That work is 100% completed and verified.
David Chen (Host): Outstanding security rigor Marcus. Now, someone needs to configure the Redis in-memory token cache on cisco.com infrastructure by tomorrow as well.
Elena Rostova: I will deliver the automated test suites for large-scale meeting participant extraction by Friday. ETA is 4 days.
Carlos Rodriguez: I will deploy the ThousandEyes telemetry agent to monitor Webex latency across regional squads by Wednesday. ETA is 2 days.
Priya Nair: Splunk log aggregation filters for webhook retries are currently being verified. I will wrap that up by Thursday. ETA is 3 days.
David Chen (Host): Perfect. The PACT AI Assistant is recording this transcript and will extract all actionable work, assignees, deliverables, ETAs, and dependencies.
David Chen (Host): Only employees can report their own progress in 10% steps. See you all in 1 week.`,
};
