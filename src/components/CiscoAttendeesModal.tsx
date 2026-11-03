import React, { useState, useMemo } from 'react';
import { WebexEmployeeProfile, ActionItem } from '../types/webex';
import {
  X,
  Search,
  Users,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Avatar } from './Avatar';

interface CiscoAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendees: WebexEmployeeProfile[];
  actionItems: ActionItem[];
  onSelectEmployee?: (employee: WebexEmployeeProfile) => void;
}

export const CiscoAttendeesModal: React.FC<CiscoAttendeesModalProps> = ({
  isOpen,
  onClose,
  attendees,
  actionItems,
  onSelectEmployee,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Build task count map per attendee
  const taskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of actionItems) {
      if (item.assigneeId) {
        map.set(item.assigneeId, (map.get(item.assigneeId) || 0) + 1);
      }
      if (item.assigneeEmail) {
        map.set(item.assigneeEmail.toLowerCase(), (map.get(item.assigneeEmail.toLowerCase()) || 0) + 1);
      }
    }
    return map;
  }, [actionItems]);

  // Filtered attendees
  const filteredAttendees = useMemo(() => {
    let result = attendees;

    if (selectedDept === 'assigned_only') {
      result = result.filter(
        (a) => (taskCountMap.get(a.id) || 0) > 0 || (taskCountMap.get(a.email.toLowerCase()) || 0) > 0
      );
    } else if (selectedDept !== 'all') {
      result = result.filter((a) => a.department.toLowerCase().includes(selectedDept.toLowerCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.displayName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q)
      );
    }

    return result;
  }, [attendees, selectedDept, searchQuery, taskCountMap]);

  // Pagination
  const totalPages = Math.ceil(filteredAttendees.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendees.slice(start, start + pageSize);
  }, [filteredAttendees, currentPage]);

  const departments = [
    { id: 'all', label: `All (${attendees.length.toLocaleString()})` },
    { id: 'assigned_only', label: 'Assigned Action Items' },
    { id: 'Webex Collaboration', label: 'Webex Core' },
    { id: 'Catalyst', label: 'Catalyst Network' },
    { id: 'Meraki', label: 'Meraki Cloud' },
    { id: 'Security', label: 'Security & Trust' },
    { id: 'Observability', label: 'ThousandEyes & Splunk' },
    { id: 'Silicon', label: 'Silicon One' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div className="theme-card rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-6 relative overflow-hidden border theme-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b theme-border pb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold theme-text-main tracking-tight">
                  Cisco Webex Meeting Attendees
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  {attendees.length.toLocaleString()} Total Indexed
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  @cisco.com domain
                </span>
              </div>
              <p className="text-xs theme-text-muted mt-0.5">
                High-scale directory supporting 5,000+ employees with O(1) hash lookups during speech-to-text transcript analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-main hover:theme-bg-card-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Department Filters */}
        <div className="space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search across 5,000+ Cisco employees by name, email, department, or role..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs theme-bg-input theme-text-main border theme-border focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedDept(dept.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                  selectedDept === dept.id
                    ? 'theme-accent font-bold shadow-sm'
                    : 'theme-bg-card theme-border hover:theme-bg-card-subtle theme-text-secondary border'
                }`}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attendee Roster List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[300px]">
          {paginatedList.length === 0 ? (
            <div className="p-8 text-center theme-text-muted text-xs">
              No Cisco attendees match your query "{searchQuery}".
            </div>
          ) : (
            paginatedList.map((emp) => {
              const assignedCount =
                (taskCountMap.get(emp.id) || 0) + (taskCountMap.get(emp.email.toLowerCase()) || 0);

              return (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmployee?.(emp)}
                  className="p-3 rounded-xl border theme-border theme-bg-card hover:theme-bg-card-subtle flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar name={emp.displayName} avatarUrl={emp.avatar} size="md" status={emp.status} />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold theme-text-main group-hover:text-emerald-500 transition-colors truncate">
                          {emp.displayName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-500/10 theme-text-muted border theme-border">
                          {emp.email}
                        </span>
                      </div>
                      <div className="text-[11px] theme-text-muted truncate mt-0.5 flex items-center gap-2">
                        <span>{emp.role}</span>
                        <span className="opacity-40">•</span>
                        <span className="theme-text-secondary">{emp.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {assignedCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {assignedCount} Assigned Action{assignedCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] theme-text-faint">Attendee</span>
                    )}

                    <ChevronRight className="w-4 h-4 theme-text-muted group-hover:theme-text-main transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination & Footer */}
        <div className="flex items-center justify-between border-t theme-border pt-3 shrink-0 text-xs theme-text-muted">
          <div>
            Showing <span className="font-semibold theme-text-main">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
            <span className="font-semibold theme-text-main">
              {Math.min(currentPage * pageSize, filteredAttendees.length)}
            </span>{' '}
            of <span className="font-semibold theme-text-main">{filteredAttendees.length.toLocaleString()}</span> attendees
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border theme-border theme-bg-card hover:theme-bg-card-subtle theme-text-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Previous
            </button>
            <span className="font-mono text-xs theme-text-main">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border theme-border theme-bg-card hover:theme-bg-card-subtle theme-text-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
