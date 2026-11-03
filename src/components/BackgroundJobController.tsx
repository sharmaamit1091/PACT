import React, { useState } from 'react';
import { ReminderJobLog } from '../types/webex';
import {
  Bot,
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BellRing,
  Activity,
  Zap,
} from 'lucide-react';

interface BackgroundJobControllerProps {
  jobEnabled: boolean;
  onToggleJob: () => void;
  onForceRunJob: () => void;
  countdownSeconds: number;
  lastRunTime: string | null;
  logs: ReminderJobLog[];
  triggeredCount: number;
}

export const BackgroundJobController: React.FC<BackgroundJobControllerProps> = ({
  jobEnabled,
  onToggleJob,
  onForceRunJob,
  countdownSeconds,
  lastRunTime,
  logs,
  triggeredCount,
}) => {
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanClick = () => {
    setIsScanning(true);
    onForceRunJob();
    setTimeout(() => setIsScanning(false), 800);
  };

  return (
    <div className="theme-card rounded-2xl p-4.5 space-y-3 relative overflow-hidden transition-colors duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
        {/* Left: Bot Status & Title */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
              jobEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'theme-bg-inset theme-text-muted theme-border'
            }`}
          >
            <Bot className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold theme-text-main tracking-tight">
                Automated 24-Hour Deadline Reminder Bot
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  jobEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'theme-bg-inset theme-text-muted theme-border border'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    jobEnabled ? 'bg-emerald-600 dark:bg-emerald-400 animate-pulse' : 'bg-stone-400'
                  }`}
                />
                <span>{jobEnabled ? 'Actively Monitoring' : 'Service Paused'}</span>
              </span>
            </div>

            <p className="text-xs theme-text-muted mt-0.5 leading-relaxed">
              Continuously scans Company A deliverables and triggers interactive Webex Adaptive Cards when a deadline is within 24 hours.
            </p>
          </div>
        </div>

        {/* Right: Controls & Countdown */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {jobEnabled && (
            <div className="text-xs font-mono text-emerald-800 dark:text-emerald-300 theme-bg-inset px-3 py-1.5 rounded-xl border theme-border flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Scan in: <span className="font-bold">00:{countdownSeconds.toString().padStart(2, '0')}s</span>
              </span>
            </div>
          )}

          <button
            onClick={handleScanClick}
            disabled={isScanning}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold theme-bg-card hover:theme-bg-card-subtle theme-text-main border theme-border transition-all active:scale-95 shadow-sm"
            title="Scan deadlines immediately without waiting for the timer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-600' : 'theme-text-muted'}`} />
            <span>Scan Now</span>
          </button>

          <button
            onClick={onToggleJob}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm ${
              jobEnabled
                ? 'theme-bg-card hover:theme-bg-card-subtle text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {jobEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{jobEnabled ? 'Pause Bot' : 'Resume Bot'}</span>
          </button>

          <button
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              showLogDrawer
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'theme-bg-card hover:theme-bg-card-subtle theme-text-secondary border theme-border'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Log ({logs.length})</span>
            {showLogDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Activity Log Drawer */}
      {showLogDrawer && (
        <div className="pt-3 border-t theme-border space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] theme-text-muted px-1">
            <span className="font-semibold uppercase tracking-wider theme-text-secondary flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Automated Notification Audit Trail
            </span>
            <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">Total Dispatched: {triggeredCount}</span>
          </div>

          {logs.length === 0 ? (
            <div className="p-4 theme-bg-inset rounded-xl border theme-border text-xs theme-text-muted text-center">
              No automated reminders triggered yet. Bot is scanning every 30 seconds.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 theme-bg-inset rounded-xl border theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors hover:theme-border-hover"
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <BellRing className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold theme-text-main">
                        {log.actionTitle ? (
                          <span>
                            Reminder sent to <strong className="text-emerald-700 dark:text-emerald-300">{log.assigneeName}</strong>: "{log.actionTitle}"
                          </span>
                        ) : (
                          <span>{log.message || 'Automated background scanner tick'}</span>
                        )}
                      </div>
                      <div className="text-[11px] theme-text-muted mt-0.5 flex flex-wrap items-center gap-2">
                        {log.reason && <span>{log.reason}</span>}
                        {log.channel && (
                          <>
                            <span aria-hidden="true" className="opacity-40">·</span>
                            <span className="text-emerald-700 dark:text-emerald-400">Channel: {log.channel}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Delivered
                    </span>
                    <span className="text-[10px] theme-text-muted font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
