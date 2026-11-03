import React, { useState } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Users,
  Shield,
  Mic,
  MicOff,
  VideoOff,
  Hand,
  Sparkles,
  PhoneCall,
  X,
  Search,
  Filter,
  BarChart3,
  Activity,
  FileText,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Monitor,
  Radio,
  Share2,
} from 'lucide-react';
import { WebexMeeting, WebexUser } from '../types/webex';
import { formatMeetingTimeRange, generateMeetingPasscode, isMeetingOngoing } from '../utils/webexLogic';
import { Avatar } from './Avatar';

interface MeetingsViewProps {
  meetings: WebexMeeting[];
  currentUser: WebexUser;
  onScheduleMeeting: (meeting: Partial<WebexMeeting>) => void;
  onNavigateToTracker?: () => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  currentUser,
  onScheduleMeeting,
  onNavigateToTracker,
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeControllerMeeting, setActiveControllerMeeting] = useState<WebexMeeting | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tab & View filter state
  const [activeTabMode, setActiveTabMode] = useState<'stage' | 'list' | 'timeline' | 'analytics'>('stage');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'live' | 'scheduled'>('all');

  // Virtual Stage Controller State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'David Chen' | 'Amit Sharma' | 'Sarah Lin'>('David Chen');
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [audioLevel, setAudioLevel] = useState(68);

  // Form state for scheduling
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [timeStr, setTimeStr] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [inviteesInput, setInviteesInput] = useState('sarah.lin@collab.enterprise.com, marcus.vance@collab.enterprise.com');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const invitees = inviteesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newMeeting: Partial<WebexMeeting> = {
      title: title.trim(),
      agenda: agenda.trim(),
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      state: 'scheduled',
      webLink: `https://cisco.webex.com/meet/${currentUser.nickName || 'amit.sharma'}`,
      sipAddress: `${currentUser.emails[0]}@webex.com`,
      meetingNumber: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
      password: generateMeetingPasscode(),
      hostEmail: currentUser.emails[0],
      hostDisplayName: currentUser.displayName,
      invitees,
    };

    onScheduleMeeting(newMeeting);
    setShowScheduleModal(false);
    setTitle('');
    setAgenda('');
  };

  const activeMeetings = meetings.filter((m) => m.state === 'active' || isMeetingOngoing(m.start, m.end));
  const scheduledMeetings = meetings.filter((m) => m.state !== 'active' && !isMeetingOngoing(m.start, m.end));

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.agenda && m.agenda.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.hostDisplayName.toLowerCase().includes(searchQuery.toLowerCase());

    const isLive = m.state === 'active' || isMeetingOngoing(m.start, m.end);
    if (filterType === 'live') return matchesSearch && isLive;
    if (filterType === 'scheduled') return matchesSearch && !isLive;
    return matchesSearch;
  });

  // Simulated live conference participants
  const stageParticipants = [
    {
      name: 'David Chen',
      email: 'david.chen@collab.enterprise.com',
      role: 'Host · Engineering Manager',
      status: 'meeting' as const,
      isMuted: isMuted,
      isSpeaking: activeSpeaker === 'David Chen',
      talkPercent: 42,
    },
    {
      name: 'Amit Sharma',
      email: 'amit.sharma@collab.enterprise.com',
      role: 'Assignee · Senior Backend Lead',
      status: 'active' as const,
      isMuted: false,
      isSpeaking: activeSpeaker === 'Amit Sharma',
      talkPercent: 38,
    },
    {
      name: 'Sarah Lin',
      email: 'sarah.lin@collab.enterprise.com',
      role: 'Staff Product Director',
      status: 'active' as const,
      isMuted: true,
      isSpeaking: activeSpeaker === 'Sarah Lin',
      talkPercent: 14,
    },
    {
      name: 'PACT AI Assistant',
      email: 'ai.secretary@pact.enterprise',
      role: 'Autonomous Meeting Scribe',
      status: 'active' as const,
      isMuted: false,
      isSpeaking: false,
      talkPercent: 6,
    },
  ];

  // Speech-to-text live dialogue items
  const transcriptLines = [
    {
      id: 't-1',
      speaker: 'David Chen',
      time: '10:02 AM',
      text: 'Thanks everyone for jumping on. Amit, how are we tracking on the Webex REST webhook notification pipeline for Company A?',
      badge: 'Context',
    },
    {
      id: 't-2',
      speaker: 'Amit Sharma',
      time: '10:04 AM',
      text: 'David, the core webhook receiver and payload parser are completed and tested. Currently validating HMAC SHA-256 signatures with Cisco secret key before production rollout tomorrow.',
      badge: 'Status Update',
    },
    {
      id: 't-3',
      speaker: 'PACT AI Assistant',
      time: '10:05 AM',
      text: 'Action item identified: Amit Sharma to complete HMAC SHA-256 webhook validation. Due tomorrow 5:00 PM. Registered in Company A Action Tracker.',
      badge: 'Action Extracted',
      isAi: true,
    },
    {
      id: 't-4',
      speaker: 'Sarah Lin',
      time: '10:06 AM',
      text: 'Make sure the 1-week follow-up agenda includes the verified Webex Adaptive Card response rates as well.',
      badge: 'Follow-Up',
    },
  ];

  // Chronological meeting milestones
  const meetingMilestones = [
    {
      id: 'm-1',
      title: 'Company A Project Kickoff & Deliverable Scoping',
      date: 'Oct 24, 2026 · 10:00 AM',
      status: 'Completed',
      duration: '45 mins',
      host: 'David Chen',
      actionsCreated: 5,
      actionsClosed: 3,
      notes: 'Initial requirements set. Assigned Webex webhook pipeline to Amit Sharma.',
    },
    {
      id: 'm-2',
      title: 'Mid-Sprint Sync & Blocker Resolution Bridge',
      date: 'Oct 28, 2026 · 2:30 PM',
      status: 'Completed',
      duration: '30 mins',
      host: 'David Chen',
      actionsCreated: 2,
      actionsClosed: 2,
      notes: 'Reviewed OAuth token refresh cycle and rate limits with Cisco APIs.',
    },
    {
      id: 'm-3',
      title: '1-Week Follow-Up Review: Company A Deliverables & Amit Progress',
      date: 'Nov 04, 2026 · 11:00 AM',
      status: 'Scheduled',
      duration: '60 mins',
      host: 'David Chen',
      actionsCreated: 4,
      actionsClosed: 1,
      notes: 'Managerial review of all pending deliverables, blocker explanations, and production sign-off.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-100">Webex Conference & Stage</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" /> Cisco Webex HD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive meeting rooms, live speaking telemetry, AI speech-to-text transcripts, and chronological records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              const now = new Date();
              const end = new Date(now.getTime() + 30 * 60 * 1000);
              onScheduleMeeting({
                title: `Instant Webex Bridge (${currentUser.displayName})`,
                agenda: 'Ad-hoc collaboration bridge started from Webex Follow-Up Hub',
                start: now.toISOString(),
                end: end.toISOString(),
                timezone: 'UTC',
                state: 'active',
                webLink: `https://cisco.webex.com/meet/${currentUser.nickName || 'host'}`,
                sipAddress: `${currentUser.emails[0]}@webex.com`,
                meetingNumber: `${Math.floor(1000 + Math.random() * 9000)} 000 1234`,
                password: generateMeetingPasscode(),
                hostEmail: currentUser.emails[0],
                hostDisplayName: currentUser.displayName,
                invitees: ['team@collab.enterprise.com'],
              });
            }}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Meeting</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Visual Navigation Pill Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-2 rounded-2xl">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTabMode('stage')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTabMode === 'stage'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Live Stage & Virtual Room</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
          </button>

          <button
            onClick={() => setActiveTabMode('list')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTabMode === 'list'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Meetings Roster ({meetings.length})</span>
          </button>

          <button
            onClick={() => setActiveTabMode('analytics')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTabMode === 'analytics'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Telemetry & Attendance</span>
          </button>

          <button
            onClick={() => setActiveTabMode('timeline')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTabMode === 'timeline'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Meeting History & Timeline</span>
          </button>
        </div>

        {/* Visual Search input */}
        <div className="relative min-w-[200px] w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings, hosts, topics..."
            className="w-full text-xs bg-slate-950/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: VIRTUAL STAGE & ROOM SIMULATOR */}
      {activeTabMode === 'stage' && (
        <div className="space-y-6">
          {/* Main Visual Conference Room */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Top Stage Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Webex Executive Boardroom: 1-Week Follow-up Sync</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      LIVE · 1080p Webex HD
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Bridge: 2489 104 9021 · SIP: david.chen@webex.com · Cisco Encrypted WebRTC
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Opus 48kHz</span>
                  <span className="text-emerald-400 font-mono font-semibold ml-1">16ms</span>
                </div>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Zero-Trust E2EE</span>
                </div>
              </div>
            </div>

            {/* Visual Stage Grid */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-4 bg-gradient-to-b from-slate-950 to-slate-900/90 min-h-[380px]">
              {/* Main Spotlight Speaker Box (Takes 3 columns) */}
              <div className="lg:col-span-3 bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden group">
                {/* Background Ambient Glow */}
                <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Overlay Badges */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      Active Speaker: {activeSpeaker}
                    </span>
                    {isScreenSharing && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-950/90 border border-indigo-700/80 text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 shadow-sm">
                        <Monitor className="w-3 h-3 text-indigo-400" />
                        Screen Share: Webex Architecture.pdf
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Simulated Audio VU Meter */}
                    <div className="flex items-end space-x-0.5 h-5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                      {[35, 60, 85, 45, 95, 70, 50].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-sm transition-all duration-300"
                          style={{ height: `${(h * audioLevel) / 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Speaker Avatar & Video Frame Simulation */}
                <div className="my-auto py-8 flex flex-col items-center justify-center text-center relative z-10">
                  <div className="relative">
                    {/* Pulsing ring when speaking */}
                    <div className="absolute -inset-3 rounded-full bg-cyan-500/20 animate-ping opacity-60" />
                    <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 animate-pulse" />
                    <Avatar
                      name={activeSpeaker}
                      size="xl"
                      status="meeting"
                      className="relative ring-4 ring-slate-900 shadow-2xl"
                    />
                  </div>

                  <div className="mt-4 space-y-1">
                    <h4 className="text-base font-bold text-slate-100 flex items-center justify-center gap-2">
                      {activeSpeaker}
                      {activeSpeaker === 'David Chen' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                          Host
                        </span>
                      )}
                      {activeSpeaker === 'Amit Sharma' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                          Lead Assignee
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {activeSpeaker === 'David Chen' &&
                        'Facilitating 1-week follow-up agenda & reviewing deliverable blockers.'}
                      {activeSpeaker === 'Amit Sharma' &&
                        'Presenting Webex webhook pipeline implementation and HMAC signature verification.'}
                      {activeSpeaker === 'Sarah Lin' &&
                        'Reviewing business impact metrics and customer SLA alignment.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Stage Overlay */}
                <div className="flex items-center justify-between z-10 border-t border-slate-900/80 pt-3">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span className="font-mono text-cyan-400">FPS: 60.0</span>
                    <span>·</span>
                    <span>Bitrate: 3.4 Mbps</span>
                    <span>·</span>
                    <span className="text-emerald-400">Zero Packet Loss</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Click any participant on the right to switch camera spotlight
                  </div>
                </div>
              </div>

              {/* Right Side: Participant Video Tiles Strip */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Room Attendees (4)</span>
                  <span className="text-emerald-400 font-mono">100% Present</span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {stageParticipants.map((p) => {
                    const isSelected = activeSpeaker === p.name;
                    return (
                      <button
                        key={p.name}
                        onClick={() => {
                          if (p.name !== 'PACT AI Assistant') {
                            setActiveSpeaker(p.name as 'David Chen' | 'Amit Sharma' | 'Sarah Lin');
                            setAudioLevel(Math.floor(50 + Math.random() * 45));
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-slate-800/90 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Avatar name={p.name} email={p.email} size="sm" status={p.status} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{p.role}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {p.isMuted ? (
                            <span className="p-1 rounded bg-rose-950 text-rose-400 border border-rose-800/60">
                              <MicOff className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="p-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              <Mic className="w-3 h-3 text-emerald-400" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Mini Live AI Scribe Callout */}
                <div className="bg-gradient-to-br from-indigo-950/40 to-cyan-950/30 border border-indigo-800/50 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      PACT AI Scribe
                    </span>
                    <span className="text-[9px] bg-indigo-900/80 text-indigo-200 px-1.5 py-0.5 rounded">
                      Listening
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Automatically indexing speaker dialogue, commitments, and deadlines directly into Action Tracker.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom In-Room Interactive Controls Bar */}
            <div className="bg-slate-900 border-t border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isMuted
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isVideoOff
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-cyan-400" />}
                  <span>{isVideoOff ? 'Start Camera' : 'Stop Camera'}</span>
                </button>

                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isScreenSharing
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
                </button>

                <button
                  onClick={() => setHandRaised(!handRaised)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    handRaised
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => {
                    setIsGeneratingNotes(true);
                    setTimeout(() => {
                      setIsGeneratingNotes(false);
                      setAiNotes(
                        `PACT Meeting Synthesis · ${new Date().toLocaleDateString()}\n` +
                          `• Assignee Progress: Amit Sharma verified webhook architecture; final HMAC verification target is tomorrow 5 PM.\n` +
                          `• Manager Decision: David Chen confirmed 1-week follow-up meeting agenda on Nov 4.\n` +
                          `• Action Status: 1 item completed, 2 in progress, 1 pending manager sign-off.\n` +
                          `• Webex Adaptive Cards dispatched to Spaces feed successfully.`
                      );
                    }, 800);
                  }}
                  disabled={isGeneratingNotes}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingNotes ? 'Generating AI Brief...' : 'Extract PACT AI Summary'}</span>
                </button>

                {onNavigateToTracker && (
                  <button
                    onClick={onNavigateToTracker}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                  >
                    <span>Open Tracker</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Generated AI Notes Preview Dropdown */}
            {aiNotes && (
              <div className="bg-cyan-950/30 border-t border-cyan-800/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> PACT AI Structured Briefing Notes
                  </span>
                  <button
                    onClick={() => setAiNotes(null)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="text-xs text-cyan-100 whitespace-pre-wrap leading-relaxed font-sans bg-slate-950/60 p-3 rounded-xl border border-cyan-800/40">
                  {aiNotes}
                </div>
              </div>
            )}
          </div>

          {/* Dual Panel: Live Audio-to-Text Transcription Stream & Attendance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Speech-to-Text Visualizer */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Live Speech-to-Text Stream</h3>
                    <p className="text-[11px] text-slate-400">
                      Real-time Webex audio stream converting spoken voice into structured text
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Streaming
                </span>
              </div>

              {/* Transcription Dialogue Stream */}
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {transcriptLines.map((line) => (
                  <div
                    key={line.id}
                    className={`p-3 rounded-xl border transition-all ${
                      line.isAi
                        ? 'bg-indigo-950/30 border-indigo-700/50 text-indigo-100'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          name={line.speaker}
                          size="xs"
                          status={line.isAi ? 'active' : 'meeting'}
                        />
                        <span className="text-xs font-bold text-slate-100">{line.speaker}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{line.time}</span>
                      </div>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                          line.isAi
                            ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {line.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-6">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance & Talk-Time Analytics Graphic */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Talk-Time Distribution & Attendance</h3>
                    <p className="text-[11px] text-slate-400">
                      Speaking share metrics and participant presence telemetry
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-300 font-bold">100% Present</span>
              </div>

              {/* Visual Proportion Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Speaking Share by Participant</span>
                  <span className="text-slate-400 font-mono">Total: 45 mins</span>
                </div>
                <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div
                    style={{ width: '42%' }}
                    className="bg-cyan-500 hover:opacity-90 transition-all cursor-pointer"
                    title="David Chen: 42% (19m)"
                  />
                  <div
                    style={{ width: '38%' }}
                    className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer"
                    title="Amit Sharma: 38% (17m)"
                  />
                  <div
                    style={{ width: '14%' }}
                    className="bg-indigo-500 hover:opacity-90 transition-all cursor-pointer"
                    title="Sarah Lin: 14% (6m)"
                  />
                  <div
                    style={{ width: '6%' }}
                    className="bg-amber-500 hover:opacity-90 transition-all cursor-pointer"
                    title="Webex Bot: 6% (3m)"
                  />
                </div>
              </div>

              {/* Breakdown Legend Cards */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">David Chen (Host)</div>
                      <div className="text-[10px] text-slate-400">19m 20s spoken</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-300 font-mono">42%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Amit Sharma (Lead)</div>
                      <div className="text-[10px] text-slate-400">17m 10s spoken</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 font-mono">38%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Sarah Lin (Product)</div>
                      <div className="text-[10px] text-slate-400">6m 15s spoken</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-300 font-mono">14%</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">PACT AI Scribe</div>
                      <div className="text-[10px] text-slate-400">Action items logged</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-300 font-mono">6%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MEETINGS ROSTER & LIST */}
      {activeTabMode === 'list' && (
        <div className="space-y-6">
          {/* Active / Happening Now Section */}
          {activeMeetings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Happening Now on Cisco Webex</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeMeetings.map((mtg) => (
                  <div
                    key={mtg.id}
                    className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 border-2 border-emerald-600/50 rounded-2xl p-5 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                      Live Meeting
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center space-x-2.5">
                          <Avatar name={mtg.hostDisplayName} size="sm" status="meeting" />
                          <div>
                            <h3 className="text-base font-bold text-slate-100">{mtg.title}</h3>
                            <span className="text-xs text-slate-400">Host: {mtg.hostDisplayName}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-10">{mtg.agenda}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1 pl-10">
                          <span className="flex items-center gap-1.5 text-cyan-300">
                            <Clock className="w-3.5 h-3.5" />
                            {formatMeetingTimeRange(mtg.start, mtg.end)}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-slate-300">
                            Bridge: {mtg.meetingNumber}
                          </span>
                          <span>·</span>
                          <span className="text-indigo-300 font-mono">
                            Passcode: {mtg.password || 'None'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={() => {
                            setActiveControllerMeeting(mtg);
                            setActiveTabMode('stage');
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 transition-colors shadow-sm"
                        >
                          Control Room
                        </button>
                        <button
                          onClick={() => copyToClipboard(mtg.webLink, mtg.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="Copy Webex Join Link"
                        >
                          {copiedId === mtg.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={mtg.webLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join in Webex</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upcoming & Scheduled Bridges ({scheduledMeetings.length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({meetings.length})
              </button>
              <button
                onClick={() => setFilterType('live')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterType === 'live'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live ({activeMeetings.length})
              </button>
              <button
                onClick={() => setFilterType('scheduled')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterType === 'scheduled'
                    ? 'bg-slate-800 text-indigo-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scheduled ({scheduledMeetings.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.map((mtg) => (
              <div
                key={mtg.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <Avatar name={mtg.hostDisplayName} size="sm" status="active" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {mtg.title}
                        </h4>
                        <div className="text-[11px] text-slate-400">Host: {mtg.hostDisplayName}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {mtg.password ? 'Locked' : 'Open'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{mtg.agenda}</p>

                  <div className="text-xs text-cyan-300 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatMeetingTimeRange(mtg.start, mtg.end)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {mtg.meetingNumber}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(mtg.webLink, mtg.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="Copy Join Link"
                    >
                      {copiedId === mtg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={mtg.webLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
                    >
                      <span>Start / Join</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TELEMETRY & ATTENDANCE ANALYTICS */}
      {activeTabMode === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Average Attendance Rate
              </span>
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <p className="text-[11px] text-slate-500">4 of 4 invited colleagues joined</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Action Items Identified
              </span>
              <div className="text-2xl font-bold text-cyan-400">11 Items</div>
              <p className="text-[11px] text-slate-500">Logged via PACT AI Assistant</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Deliverable Completion
              </span>
              <div className="text-2xl font-bold text-indigo-400">72.7%</div>
              <p className="text-[11px] text-slate-500">8 of 11 on schedule or done</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Media Quality SLA
              </span>
              <div className="text-2xl font-bold text-amber-400">99.98%</div>
              <p className="text-[11px] text-slate-500">Zero audio jitter or loss</p>
            </div>
          </div>

          {/* Miniature Report Card Preview */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Weekly Meeting & Action Audit Report Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generated for Host David Chen and Company A Leadership
                  </p>
                </div>
              </div>

              <button
                onClick={() => alert('Exporting Webex Meeting Audit Report (PDF)...')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <span>Download Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300">1. Action Items by Assignee</span>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Amit Sharma (Lead)</span>
                    <span className="text-cyan-300 font-bold">4 actions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marcus Vance</span>
                    <span className="text-slate-300 font-bold">3 actions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sarah Lin</span>
                    <span className="text-slate-300 font-bold">2 actions</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300">2. Pending Deliverables & Blockers</span>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between text-amber-300">
                    <span>Critical 24h Deadlines</span>
                    <span className="font-bold">1 item (Amit)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Blockers</span>
                    <span className="text-rose-400 font-bold">1 item</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Progress</span>
                    <span className="text-emerald-400 font-bold">68%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300">3. Webex Adaptive Card Responses</span>
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Cards Sent to Spaces</span>
                    <span className="text-slate-200 font-bold">18 cards</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employee Response Rate</span>
                    <span className="text-emerald-400 font-bold">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Automated Reminders</span>
                    <span className="text-cyan-400 font-bold">Active (24h)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: CHRONOLOGICAL MEETING TIMELINE */}
      {activeTabMode === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Chronological Webex Meeting Timeline for Company A</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visual history tracking kickoff, mid-cycle check-ins, and scheduled 1-week follow-up reviews.
              </p>
            </div>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {meetingMilestones.map((m, idx) => (
                <div key={m.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 transition-all ${
                      m.status === 'Completed'
                        ? 'bg-emerald-500 border-slate-950 ring-4 ring-emerald-500/20'
                        : 'bg-cyan-500 border-slate-950 ring-4 ring-cyan-500/20 animate-pulse'
                    }`}
                  />

                  <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 space-y-2 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-100">{m.title}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            m.status === 'Completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{m.date}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{m.notes}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-900">
                      <span>Host: {m.host}</span>
                      <span>·</span>
                      <span>Duration: {m.duration}</span>
                      <span>·</span>
                      <span className="text-cyan-300">
                        {m.actionsCreated} action items ({m.actionsClosed} delivered)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Schedule Webex Meeting</h3>
                <p className="text-xs text-slate-400">Created via Cisco Webex REST API v1</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meeting Topic / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 1-Week Follow-up Review on Action Items"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Agenda</label>
                <textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Review Amit Sharma deliverables, inspect blockers, verify action items completion"
                  rows={2}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Invitees (comma separated emails)
                </label>
                <input
                  type="text"
                  value={inviteesInput}
                  onChange={(e) => setInviteesInput(e.target.value)}
                  placeholder="amit.sharma@collab.enterprise.com, sarah.lin@collab.enterprise.com"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
