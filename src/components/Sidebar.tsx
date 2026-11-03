import React from 'react';
import {
  CheckSquare,
  FileText,
  Video,
  MessageSquare,
  Settings,
  Building2,
  Calendar,
} from 'lucide-react';

export type ActiveTab = 'tracker' | 'briefing' | 'meetings' | 'spaces' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  urgentCount?: number;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  urgentCount = 1,
  unreadCount = 2,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: 'urgent' | 'info' | 'neutral';
  }> = [
    {
      id: 'tracker',
      label: 'Deliverables & Actions',
      description: 'Who does what & status',
      icon: CheckSquare,
      badge: urgentCount > 0 ? `${urgentCount} Due Tomorrow` : undefined,
      badgeVariant: 'urgent',
    },
    {
      id: 'briefing',
      label: 'Follow-Up Meeting Prep',
      description: 'Recap vs current status',
      icon: FileText,
      badge: 'In 7 Days',
      badgeVariant: 'info',
    },
    {
      id: 'meetings',
      label: 'AI Meeting Summaries',
      description: 'Webex transcripts & notes',
      icon: Video,
    },
    {
      id: 'spaces',
      label: 'Team Chat & Alerts',
      description: 'Webex cards & messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? `${unreadCount}` : undefined,
      badgeVariant: 'neutral',
    },
    {
      id: 'settings',
      label: 'Integration Settings',
      description: 'OAuth & Webhook APIs',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 border-r theme-border theme-bg-sidebar flex flex-col justify-between shrink-0 select-none transition-colors duration-200">
      <div className="p-3 space-y-1.5">
        <div className="px-3 py-2 flex items-center justify-between text-[11px] font-bold theme-text-muted uppercase tracking-wider">
          <div className="flex items-center gap-1.5 theme-text-secondary">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Workspace</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Company A</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start space-x-3 group relative ${
                  isActive
                    ? 'theme-bg-card theme-text-main border theme-border shadow-sm'
                    : 'theme-text-secondary hover:theme-text-main hover:theme-bg-card-subtle border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-600 dark:bg-emerald-400 rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'theme-text-muted group-hover:theme-text-secondary'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate tracking-tight">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 font-mono ${
                          item.badgeVariant === 'urgent'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800'
                            : item.badgeVariant === 'info'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
                            : 'theme-bg-inset theme-text-secondary border theme-border'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] theme-text-muted truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Next Meeting Countdown Widget & Tip */}
      <div className="p-3 space-y-2">
        <div className="p-3 rounded-xl theme-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold theme-text-muted uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Follow-Up Review
            </span>
            <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/60 px-1.5 py-0.5 rounded font-semibold">
              7 Days
            </span>
          </div>
          <div className="text-xs font-bold theme-text-main truncate">
            Project Alpha: 1-Week Review
          </div>
          <div className="text-[11px] theme-text-muted leading-snug">
            All pending items and blockers will be reviewed live with Manager David Chen.
          </div>
        </div>

        <div className="px-2.5 py-1 text-[11px] theme-text-muted flex items-center justify-between">
          <span>PACT v2.4</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Connected</span>
        </div>
      </div>
    </aside>
  );
};
