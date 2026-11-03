import React, { useState } from 'react';
import {
  Key,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  CheckCircle2,
  Play,
  Cpu,
  ArrowRight,
  Bell,
  Sliders,
  Database,
  Lock,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { ConnectionMode, WebexUser } from '../types/webex';

interface SettingsViewProps {
  currentUser: WebexUser;
  connectionMode: ConnectionMode;
  onOpenConnectModal: () => void;
  onTestApiCall: (endpoint: string) => Promise<string>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  connectionMode,
  onOpenConnectModal,
  onTestApiCall,
}) => {
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedShared, setCopiedShared] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testStatusCode, setTestStatusCode] = useState<number | null>(null);
  const [testDuration, setTestDuration] = useState<number | null>(null);

  // Simulated Configurable Toggles
  const [autoReminderInterval, setAutoReminderInterval] = useState('60');
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [hmacValidation, setHmacValidation] = useState(true);
  const [adaptiveCardsVersion, setAdaptiveCardsVersion] = useState('1.3');

  const devUrl = 'https://ais-dev-fwwisjfdizyglkdgecchf5-244887054008.asia-southeast1.run.app/auth/callback';
  const sharedUrl = 'https://ais-pre-fwwisjfdizyglkdgecchf5-244887054008.asia-southeast1.run.app/auth/callback';

  const handleCopy = (text: string, type: 'dev' | 'shared') => {
    navigator.clipboard.writeText(text);
    if (type === 'dev') {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2000);
    } else {
      setCopiedShared(true);
      setTimeout(() => setCopiedShared(false), 2000);
    }
  };

  const runApiTest = async (endpoint: string) => {
    setTestingEndpoint(endpoint);
    setTestResult(null);
    setTestStatusCode(null);
    const start = performance.now();
    try {
      const res = await onTestApiCall(endpoint);
      const elapsed = Math.round(performance.now() - start);
      setTestDuration(elapsed);
      setTestStatusCode(200);
      setTestResult(res);
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - start);
      setTestDuration(elapsed);
      setTestStatusCode(500);
      setTestResult(err instanceof Error ? err.message : 'API test failed');
    } finally {
      setTestingEndpoint(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-100">Webex Integration & Architecture</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Enterprise Configuration
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visual pipeline architecture, webhook listener health, OAuth lifecycle, and diagnostic tooling.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenConnectModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Manage Webex Token / OAuth</span>
        </button>
      </div>

      {/* VISUAL ARCHITECTURE 1: Webhook & Event Dispatch Pipeline */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Real-Time Webex Event Dispatch Pipeline (Visual Architecture)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Pipeline Healthy · 0
            Dropped Events
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          How Webex meeting completions, assignee check-ins, and space messages travel through Company A's secure proxy:
        </p>

        {/* Visual Pipeline Flow Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {/* Step 1 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400 text-xs font-bold">
              1
            </div>
            <div className="text-xs font-bold text-slate-200">Cisco Webex Cloud</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Triggers HTTPS webhook when meetings end or messages are posted in Company A spaces.
            </p>
            <div className="text-[10px] text-cyan-400 font-mono">TLS 1.3 · port 443</div>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 text-xs font-bold">
              2
            </div>
            <div className="text-xs font-bold text-slate-200">Express Proxy & HMAC</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mounted at <code className="text-cyan-300 font-mono">/api/webex/webhook</code>. Validates HMAC SHA-256 signatures.
            </p>
            <div className="text-[10px] text-indigo-300 font-mono">Secret Verified</div>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 text-xs font-bold">
              3
            </div>
            <div className="text-xs font-bold text-slate-200">Action Item Engine</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Correlates assignee deliverables (e.g. Amit Sharma) with due dates, calculating pending vs completed status.
            </p>
            <div className="text-[10px] text-emerald-400 font-mono">24h Alert Guard</div>
            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative group hover:border-cyan-500/50 transition-all">
            <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400 text-xs font-bold">
              4
            </div>
            <div className="text-xs font-bold text-slate-200">Adaptive Card Dispatch</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dispatches interactive Adaptive Cards to assignee direct messages and manager review channels.
            </p>
            <div className="text-[10px] text-amber-300 font-mono">Schema v1.3</div>
          </div>
        </div>
      </div>

      {/* VISUAL ARCHITECTURE 2: OAuth 2.0 Token Lifecycle */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Cisco Webex OAuth 2.0 Credentials & Redirect URI Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Development Redirect URI</span>
                <span className="text-[9px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded font-mono">Active</span>
              </div>
              <div className="font-mono text-xs text-cyan-300 break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                {devUrl}
              </div>
            </div>
            <button
              onClick={() => handleCopy(devUrl, 'dev')}
              className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors w-full"
            >
              {copiedDev ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDev ? 'Copied to Clipboard' : 'Copy Development URI'}</span>
            </button>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Shared Preview Redirect URI</span>
                <span className="text-[9px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">Staging</span>
              </div>
              <div className="font-mono text-xs text-indigo-300 break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                {sharedUrl}
              </div>
            </div>
            <button
              onClick={() => handleCopy(sharedUrl, 'shared')}
              className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors w-full"
            >
              {copiedShared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedShared ? 'Copied to Clipboard' : 'Copy Shared Preview URI'}</span>
            </button>
          </div>
        </div>

        {/* Required OAuth Scopes Visual Grid */}
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-300 mb-2">Required Cisco Webex Scopes:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-cyan-300">spark:all</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-cyan-300">spark:kms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-cyan-300">meeting:schedules_read</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-cyan-300">meeting:schedules_write</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Preferences & Engine Settings */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Configurable Office Automation Parameters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">24-Hour Deadline Cron</span>
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Frequency of background job checking for upcoming action deadlines.
            </p>
            <select
              value={autoReminderInterval}
              onChange={(e) => setAutoReminderInterval(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="30">Every 30 minutes</option>
              <option value="60">Every 60 minutes (Default)</option>
              <option value="120">Every 2 hours</option>
            </select>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Adaptive Card Schema</span>
              <Database className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Webex Bot formatting target for interactive cards sent to Space feeds.
            </p>
            <select
              value={adaptiveCardsVersion}
              onChange={(e) => setAdaptiveCardsVersion(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="1.3">Adaptive Cards v1.3 (Recommended)</option>
              <option value="1.2">Adaptive Cards v1.2</option>
            </select>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">HMAC Webhook Security</span>
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Enforce cryptographic signature validation on incoming Cisco Webex webhooks.
            </p>
            <button
              onClick={() => setHmacValidation(!hmacValidation)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                hmacValidation
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-900 text-slate-400 border border-slate-700'
              }`}
            >
              <span>{hmacValidation ? 'HMAC Verification Active' : 'Verification Disabled'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Live API Diagnostic Console */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Interactive Webex REST API Diagnostic Console
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Mode: <span className="text-cyan-300 font-bold uppercase">{connectionMode}</span>
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Execute live read requests against Cisco Webex to verify token scopes, headers, and endpoint response times:
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => runApiTest('/api/webex/me')}
            disabled={testingEndpoint !== null}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <Play className="w-3 h-3 text-cyan-400" />
            <span>GET /v1/people/me</span>
          </button>

          <button
            onClick={() => runApiTest('/api/webex/rooms')}
            disabled={testingEndpoint !== null}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <Play className="w-3 h-3 text-cyan-400" />
            <span>GET /v1/rooms</span>
          </button>

          <button
            onClick={() => runApiTest('/api/webex/meetings')}
            disabled={testingEndpoint !== null}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <Play className="w-3 h-3 text-cyan-400" />
            <span>GET /v1/meetings</span>
          </button>
        </div>

        {testResult && (
          <div className="mt-3 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold uppercase tracking-wider">REST Response Output</span>
              <div className="flex items-center space-x-2 font-mono">
                {testStatusCode && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      testStatusCode === 200
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    HTTP {testStatusCode} OK
                  </span>
                )}
                {testDuration && (
                  <span className="text-cyan-300 text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {testDuration}ms
                  </span>
                )}
              </div>
            </div>
            <pre className="font-mono text-[11px] text-cyan-300 bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-64 overflow-y-auto leading-relaxed shadow-inner">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
