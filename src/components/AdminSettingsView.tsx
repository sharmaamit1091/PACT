import React, { useState } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Users,
  FileText,
  BellRing,
  Sparkles,
  Search,
  Check,
  Info,
  Layers,
  Terminal,
  Server,
  Zap,
  Cpu,
  Radio,
} from 'lucide-react';
import {
  WebexUser,
  ConnectionMode,
  WebexEmployeeProfile,
  MeetingTranscript,
} from '../types/webex';

interface AdminSettingsViewProps {
  currentUser: WebexUser;
  connectionMode: ConnectionMode;
  employees: WebexEmployeeProfile[];
  transcripts: MeetingTranscript[];
  reportingEmail: string;
  onUpdateReportingEmail: (email: string) => void;
  onOpenConnectModal: () => void;
  onDisconnect: () => void;
  onAddTranscript: (transcript: Partial<MeetingTranscript>) => void;
  jobEnabled: boolean;
  onToggleJob: () => void;
  onForceRunJob: () => void;
  jobCountdown: number;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  currentUser,
  connectionMode,
  employees,
  transcripts,
  reportingEmail,
  onUpdateReportingEmail,
  onOpenConnectModal,
  onDisconnect,
  onAddTranscript,
  jobEnabled,
  onToggleJob,
  onForceRunJob,
  jobCountdown,
}) => {
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [newTranscriptTitle, setNewTranscriptTitle] = useState<string>('');
  const [newTranscriptText, setNewTranscriptText] = useState<string>('');
  const [newTranscriptSource, setNewTranscriptSource] = useState<'host_profile' | 'shared_employee_profile'>('host_profile');
  const [isAddingTranscript, setIsAddingTranscript] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const filteredEmployees = employees.filter((emp) => {
    if (deptFilter !== 'all' && emp.department !== deptFilter) return false;
    if (employeeSearch.trim()) {
      const q = employeeSearch.toLowerCase();
      return (
        emp.displayName.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  const handleSaveNewTranscript = () => {
    if (!newTranscriptTitle || !newTranscriptText) return;

    onAddTranscript({
      meetingTitle: newTranscriptTitle,
      rawText: newTranscriptText,
      source: newTranscriptSource,
      sharedBy: newTranscriptSource === 'host_profile' ? 'David Chen (Host Profile)' : 'Amit Sharma (Shared Profile)',
      participantCount: 40,
      hostName: 'David Chen',
      hostEmail: 'david.chen@cisco.com',
    });

    setNewTranscriptTitle('');
    setNewTranscriptText('');
    setIsAddingTranscript(false);
    setSaveMessage('New Webex transcript archived and ready for AI analysis!');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900/60 p-4 lg:p-8 space-y-6">
      {/* Top Banner / Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> cisco.com Domain
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Admin & Integrations
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">
            PACT · System Settings & API Connectivity
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold italic mr-1">
              "From Meetings to Actions. From Actions to Results."
            </span>
            · Live Webex endpoints, O(1) attendee indexing, and automated bot engine.
          </p>
        </div>

        {/* Live Webex Connection Status */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-sm">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionMode === 'oauth'
                ? 'bg-emerald-400 animate-pulse'
                : connectionMode === 'token'
                ? 'bg-sky-400'
                : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {connectionMode === 'oauth'
                ? 'Webex OAuth Connected'
                : connectionMode === 'token'
                ? 'Webex Token Connected'
                : 'Demo / Sandbox Mode'}
            </div>
            <div className="text-[10px] text-slate-400">
              {connectionMode !== 'demo' ? currentUser.emails[0] : 'Simulating live Webex endpoints'}
            </div>
          </div>

          <button
            onClick={connectionMode === 'demo' ? onOpenConnectModal : onDisconnect}
            className="ml-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition-colors cursor-pointer"
          >
            {connectionMode === 'demo' ? 'Connect Live' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Visual System Architecture Diagram Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Topology & Data Pipeline
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="font-semibold">1. Webex REST API</span>
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-mono text-emerald-400 font-bold text-sm">Port 3000 Proxy</div>
            <div className="text-[10px] text-slate-500 mt-1">Bearer Token / PKCE</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="font-semibold">2. Attendees Index</span>
              <Users className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="font-mono text-sky-300 font-bold text-sm">5,240 Profiles</div>
            <div className="text-[10px] text-slate-500 mt-1">O(1) Map Lookup</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="font-semibold">3. AI Parser Engine</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="font-mono text-indigo-300 font-bold text-sm">Transcript Secret.</div>
            <div className="text-[10px] text-slate-500 mt-1">Zero-Leakage Guard</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="font-semibold">4. 24h Reminder Bot</span>
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-mono text-amber-300 font-bold text-sm">{jobCountdown}s Countdown</div>
            <div className="text-[10px] text-slate-500 mt-1">Adaptive Card Bot</div>
          </div>
        </div>
      </div>

      {/* Grid: Webex API Credentials Card + Automated Bot Scheduler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webex API Credentials Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Key className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-sm">Cisco Webex API Connectivity</h3>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> REST v1 Validated
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Target Webex Scopes:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'spark:all', desc: 'Direct messages & spaces' },
                  { name: 'meeting:schedules_read', desc: 'Calendar access' },
                  { name: 'meeting:recordings_read', desc: 'Transcripts access' },
                  { name: 'spark:kms', desc: 'Zero-trust encryption' },
                ].map((s) => (
                  <div key={s.name} className="p-2 rounded-xl bg-slate-950/70 border border-slate-850">
                    <span className="font-mono text-sky-400 block font-bold">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">
                Executive Reporting Recipient:
              </label>
              <input
                type="email"
                value={reportingEmail}
                onChange={(e) => onUpdateReportingEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Designated address for summary briefings: <strong>sharma.amit1091@gmail.com</strong>
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={onOpenConnectModal}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" /> Manage Credentials
            </button>
            <a
              href="https://developer.webex.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1"
            >
              Developer Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Automated Background 24h Reminder Job Scheduler */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                PACT 24h Deadline Bot Engine
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  jobEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {jobEnabled ? 'Scanning Active' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Next Scheduled Scan In:</span>
              <span className="font-mono font-black text-amber-300 text-base">{jobCountdown}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Trigger Threshold:</span>
              <span className="font-bold text-slate-200">≤ 24 Hours to Due Date</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Escalation Channels:</span>
              <span className="font-medium text-slate-200">1:1 Webex DM + Adaptive Card</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={onToggleJob}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                jobEnabled
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {jobEnabled ? 'Pause Bot' : 'Resume Bot'}
            </button>

            <button
              onClick={onForceRunJob}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Force Scan Now
            </button>
          </div>
        </div>
      </div>

      {/* Authorized Employee Directory (5,240 Profiles) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-base">
                Authorized Attendee Directory ({employees.length.toLocaleString()} Profiles)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-performance indexing for 5,000+ Cisco meeting attendees.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, role, email..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 w-64"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
          {filteredEmployees.slice(0, 40).map((emp) => (
            <div
              key={emp.id}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center gap-3 hover:border-slate-700 transition-colors"
            >
              <img
                src={emp.avatar}
                alt={emp.displayName}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
              />
              <div className="overflow-hidden min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200 text-xs truncate">
                    {emp.displayName}
                  </span>
                  {emp.isAuthorized && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{emp.email}</div>
                <div className="text-[10px] text-sky-400 truncate">{emp.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webex Meeting Transcripts Archive */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-base">
                Meeting Transcripts Archive ({transcripts.length})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Host profiles and shared employee profiles archived for AI interpretation.
            </p>
          </div>

          <button
            onClick={() => setIsAddingTranscript(!isAddingTranscript)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            {isAddingTranscript ? 'Close' : '+ Add Transcript'}
          </button>
        </div>

        {saveMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveMessage}</span>
          </div>
        )}

        {isAddingTranscript && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">
              Paste Meeting Transcript Text (Speaker: utterance)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Meeting Title..."
                value={newTranscriptTitle}
                onChange={(e) => setNewTranscriptTitle(e.target.value)}
                className="bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />

              <select
                value={newTranscriptSource}
                onChange={(e) =>
                  setNewTranscriptSource(e.target.value as 'host_profile' | 'shared_employee_profile')
                }
                className="bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="host_profile">Host Profile Transcript (David Chen)</option>
                <option value="shared_employee_profile">Shared Employee Profile Transcript (Amit Sharma)</option>
              </select>
            </div>

            <textarea
              rows={4}
              placeholder="Paste Webex transcript..."
              value={newTranscriptText}
              onChange={(e) => setNewTranscriptText(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddingTranscript(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewTranscript}
                disabled={!newTranscriptTitle || !newTranscriptText}
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Save Transcript
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {transcripts.map((tr) => (
            <div
              key={tr.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 text-sm">{tr.meetingTitle}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {tr.source === 'host_profile' ? 'Host Profile' : 'Shared Profile'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {tr.participantCount} Attendees · {tr.sharedBy}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                {tr.rawText}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
