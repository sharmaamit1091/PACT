import React, { useState } from 'react';
import { Layers, Send, CheckCircle2, AlertTriangle, Code, Play } from 'lucide-react';
import { WebexAdaptiveCard, WebexSpace } from '../types/webex';
import { AdaptiveCardRenderer } from './AdaptiveCardRenderer';
import { createSampleAdaptiveCard, validateAdaptiveCard } from '../utils/webexLogic';

interface AdaptiveCardBuilderProps {
  spaces: WebexSpace[];
  onDispatchCardToSpace: (roomId: string, card: WebexAdaptiveCard, cardTitle: string) => void;
}

export const AdaptiveCardBuilder: React.FC<AdaptiveCardBuilderProps> = ({
  spaces,
  onDispatchCardToSpace,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'incident' | 'poll' | 'kudos' | 'standup'>('poll');
  const [cardJson, setCardJson] = useState<string>(
    JSON.stringify(createSampleAdaptiveCard('poll'), null, 2)
  );
  const [targetSpaceId, setTargetSpaceId] = useState<string>(spaces[0]?.id || '');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  let parsedCard: WebexAdaptiveCard | null = null;
  let parseError: string | null = null;

  try {
    parsedCard = JSON.parse(cardJson);
  } catch (err: unknown) {
    parseError = err instanceof Error ? err.message : 'Invalid JSON format';
  }

  const validation = parsedCard ? validateAdaptiveCard(parsedCard) : { valid: false, errors: [] };

  const handleSelectPreset = (preset: 'incident' | 'poll' | 'kudos' | 'standup') => {
    setSelectedPreset(preset);
    const newCard = createSampleAdaptiveCard(preset);
    setCardJson(JSON.stringify(newCard, null, 2));
  };

  const handleDispatch = () => {
    if (!parsedCard || !validation.valid || !targetSpaceId) return;
    const title =
      selectedPreset === 'incident'
        ? 'P1 Incident Alert Card'
        : selectedPreset === 'poll'
        ? 'Team Poll Card'
        : selectedPreset === 'kudos'
        ? 'Team Kudos Card'
        : 'Daily Standup Card';

    onDispatchCardToSpace(targetSpaceId, parsedCard, title);
    const targetSpace = spaces.find((s) => s.id === targetSpaceId);
    setDispatchStatus(`Successfully dispatched Adaptive Card to "${targetSpace?.title || 'space'}"!`);
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-100">Adaptive Card Studio</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Webex Cards & Actions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build, validate, and preview interactive Cisco Webex Adaptive Cards for bots and workflows.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Template:</span>
          {(['poll', 'incident', 'kudos', 'standup'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedPreset === preset
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual Panes */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Left: JSON Editor & Validation */}
        <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Card JSON Payload</span>
            </div>
            {parseError ? (
              <span className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Syntax Error
              </span>
            ) : validation.valid ? (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid Webex Schema
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Schema Issues
              </span>
            )}
          </div>

          <div className="flex-1 p-3 overflow-hidden flex flex-col">
            <textarea
              value={cardJson}
              onChange={(e) => setCardJson(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-slate-950 font-mono text-xs text-slate-200 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />

            {parseError && (
              <div className="mt-2 p-2 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300">
                {parseError}
              </div>
            )}

            {!parseError && !validation.valid && (
              <div className="mt-2 p-2 bg-amber-950/60 border border-amber-800 rounded-lg text-xs text-amber-300 space-y-1">
                <div className="font-semibold">Webex Adaptive Card Validation Errors:</div>
                <ul className="list-disc list-inside">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Interactive Cisco Webex Renderer */}
        <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Live Cisco Webex Preview</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Action.Submit testable
            </span>
          </div>

          {/* Card Preview Container */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col items-center justify-center bg-slate-950/40">
            {parsedCard && validation.valid ? (
              <div className="w-full max-w-md">
                <AdaptiveCardRenderer card={parsedCard} />
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                Correct JSON schema errors to view live preview.
              </div>
            )}
          </div>

          {/* Dispatch Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1">
                <label className="text-xs text-slate-300 font-medium shrink-0">Send to Space:</label>
                <select
                  value={targetSpaceId}
                  onChange={(e) => setTargetSpaceId(e.target.value)}
                  className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDispatch}
                disabled={!parsedCard || !validation.valid || !targetSpaceId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Card to Space</span>
              </button>
            </div>

            {dispatchStatus && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/70 rounded-lg text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{dispatchStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
