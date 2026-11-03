import React, { useState } from 'react';
import { Smartphone, Monitor, Video, Share2, Sparkles, Check, Play, RefreshCw } from 'lucide-react';
import { WebexUser } from '../types/webex';

interface EmbeddedAppSimulatorProps {
  currentUser: WebexUser;
}

export const EmbeddedAppSimulator: React.FC<EmbeddedAppSimulatorProps> = ({ currentUser }) => {
  const [viewMode, setViewMode] = useState<'sidebar' | 'stage'>('sidebar');
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [sdkLog, setSdkLog] = useState<string[]>([
    '[Webex SDK] Initializing webex.Application() v2.1.0...',
    '[Webex SDK] Context loaded: InMeeting',
    `[Webex SDK] Authenticated User: ${currentUser.displayName} (${currentUser.emails[0]})`,
  ]);

  const addLog = (msg: string) => {
    setSdkLog((prev) => [`[Webex SDK ${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleShareToStage = () => {
    setSharedUrl('https://ais-dev-fwwisjfdizyglkdgecchf5-244887054008.asia-southeast1.run.app');
    addLog('app.setShareUrl() invoked! App broadcasted to all meeting participants on stage.');
  };

  const handleStopSharing = () => {
    setSharedUrl(null);
    addLog('app.clearShareUrl() invoked. Returned to sidebar mode.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-100">Webex Embedded App Simulator</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Webex JS SDK v2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate how your application runs natively embedded inside Cisco Webex Meetings and Spaces.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              setViewMode('sidebar');
              addLog('View mode switched to: Meeting Sidebar panel');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'sidebar'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Sidebar View</span>
          </button>
          <button
            onClick={() => {
              setViewMode('stage');
              addLog('View mode switched to: In-Meeting Main Stage');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'stage'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Stage View (Collaborative)</span>
          </button>
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Fake Webex Client Top Window Titlebar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-semibold text-slate-300">
              Cisco Webex Meeting #2598-481-0921 — Sprint Review
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Recording
            </span>
            <span>00:24:18</span>
          </div>
        </div>

        {/* Meeting Stage & App Area */}
        <div className="flex flex-col lg:flex-row min-h-[460px]">
          {/* Main Meeting Stage or Participants grid */}
          <div
            className={`flex-1 bg-slate-950 p-4 flex flex-col justify-between ${
              viewMode === 'stage' ? 'hidden' : 'flex'
            }`}
          >
            {/* 4 Participant video boxes */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div className="bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center relative p-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Amit"
                  className="w-16 h-16 rounded-full object-cover border border-cyan-500/60"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-slate-200">
                  {currentUser.displayName} (You)
                </span>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center relative p-3">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                  alt="Sarah"
                  className="w-16 h-16 rounded-full object-cover border border-slate-700"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-slate-200">
                  Sarah Lin
                </span>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center relative p-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="Marcus"
                  className="w-16 h-16 rounded-full object-cover border border-slate-700"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-slate-200">
                  Marcus Vance
                </span>
              </div>

              <div className="bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center relative p-3">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
                  alt="Elena"
                  className="w-16 h-16 rounded-full object-cover border border-slate-700"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-slate-200">
                  Elena Rostova
                </span>
              </div>
            </div>

            {/* Bottom Meeting Control Bar */}
            <div className="mt-3 flex items-center justify-center space-x-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Webex Client Controls Active</span>
            </div>
          </div>

          {/* Embedded App View (Sidebar or Stage) */}
          <div
            className={`border-l border-slate-800 bg-slate-900 flex flex-col ${
              viewMode === 'stage' ? 'flex-1' : 'w-full lg:w-96'
            }`}
          >
            {/* Embedded App Titlebar */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Your Embedded App</span>
              </div>
              <div className="flex items-center space-x-2">
                {sharedUrl ? (
                  <button
                    onClick={handleStopSharing}
                    className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-semibold hover:bg-rose-900"
                  >
                    Stop Sharing
                  </button>
                ) : (
                  <button
                    onClick={handleShareToStage}
                    className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-semibold hover:bg-cyan-900 flex items-center gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Share to Stage
                  </button>
                )}
              </div>
            </div>

            {/* In-App Interactive Panel */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-200">
                  Live Webex Integration Client
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When deployed, your web application runs inside this sandboxed iframe with full access to the Webex Embedded Apps SDK.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => addLog(`User details fetched: ${currentUser.displayName}`)}
                    className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    app.context.getUser()
                  </button>
                  <button
                    onClick={() => addLog('Meeting details fetched: ID #2598-481-0921')}
                    className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    app.context.getMeeting()
                  </button>
                  <button
                    onClick={() => addLog('Webex Client theme queried: "DARK"')}
                    className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    app.getTheme()
                  </button>
                </div>
              </div>

              {/* SDK Event Stream */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Webex JS SDK Event Log
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-cyan-300 space-y-1 max-h-48 overflow-y-auto">
                  {sdkLog.map((log, lIdx) => (
                    <div key={lIdx} className="leading-tight">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
