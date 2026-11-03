import React, { useState } from 'react';
import {
  Key,
  Copy,
  Check,
  ExternalLink,
  Shield,
  X,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ConnectionMode, WebexUser } from '../types/webex';

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionMode: ConnectionMode;
  currentUser: WebexUser;
  onConnectToken: (token: string) => Promise<boolean>;
  onDisconnect: () => void;
  onSetDemoMode: () => void;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  onClose,
  connectionMode,
  currentUser,
  onConnectToken,
  onDisconnect,
  onSetDemoMode,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDevUrl, setCopiedDevUrl] = useState(false);
  const [copiedSharedUrl, setCopiedSharedUrl] = useState(false);

  if (!isOpen) return null;

  const devCallbackUrl = 'https://ais-dev-fwwisjfdizyglkdgecchf5-244887054008.asia-southeast1.run.app/auth/callback';
  const sharedCallbackUrl = 'https://ais-pre-fwwisjfdizyglkdgecchf5-244887054008.asia-southeast1.run.app/auth/callback';

  const copyUrl = (text: string, type: 'dev' | 'shared') => {
    navigator.clipboard.writeText(text);
    if (type === 'dev') {
      setCopiedDevUrl(true);
      setTimeout(() => setCopiedDevUrl(false), 2000);
    } else {
      setCopiedSharedUrl(true);
      setTimeout(() => setCopiedSharedUrl(false), 2000);
    }
  };

  const handleConnectOAuthPopup = async () => {
    setErrorMsg(null);
    try {
      const resp = await fetch('/api/auth/url');
      const data = await resp.json();
      if (!data.url) throw new Error('Failed to retrieve authorization URL');

      const authWindow = window.open(data.url, 'webex_oauth_popup', 'width=650,height=750');
      if (!authWindow) {
        setErrorMsg('Popup was blocked by your browser. Please allow popups for this site.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error initiating Webex OAuth flow');
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const success = await onConnectToken(tokenInput.trim());
      if (success) {
        setSuccessMsg('Successfully connected to Cisco Webex!');
        setTokenInput('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg('Invalid or expired Cisco Webex token. Please check your developer credentials.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to connect to Cisco Webex API');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="theme-card rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b theme-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold theme-text-main flex items-center gap-2">
                <span>Connect Cisco Webex to PACT</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  PACT
                </span>
              </h3>
              <p className="text-xs theme-text-muted">
                Project Actions, Commitments &amp; Tracking · <span className="text-emerald-400 italic">From Meetings to Actions. From Actions to Results.</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="theme-text-muted hover:theme-text-main">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status */}
        <div className="p-4 rounded-2xl theme-bg-inset border theme-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionMode === 'demo' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <div>
              <div className="text-xs font-bold theme-text-main">
                Current Mode:{' '}
                {connectionMode === 'demo' ? 'Interactive Demo Mode' : 'Live Webex Connected'}
              </div>
              <div className="text-[11px] theme-text-muted">
                Account: {currentUser.displayName} ({currentUser.emails[0]})
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {connectionMode !== 'demo' ? (
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800 hover:bg-rose-200 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <span className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 rounded-full font-medium">
                Simulation Active
              </span>
            )}
          </div>
        </div>

        {/* Option 1: Instant Personal Access Token (PAT) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider theme-text-main flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Instant Test Token (Fastest Setup)</span>
            </div>
            <a
              href="https://developer.webex.com/docs/api/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Get 12-hour PAT from Webex Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleTokenSubmit} className="space-y-2.5">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste Webex Personal Access Token or Bot Token..."
              className="w-full text-xs font-mono theme-bg-input border theme-border rounded-xl px-3.5 py-2.5 theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] theme-text-muted">
                Token is held in server memory for live Webex API calls.
              </span>
              <button
                type="submit"
                disabled={!tokenInput.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-sm"
              >
                {isSubmitting ? 'Verifying...' : 'Connect Token'}
              </button>
            </div>
          </form>
        </div>

        {/* Option 2: Full OAuth 2.0 Integration Setup */}
        <div className="space-y-3 border-t theme-border pt-5">
          <div className="text-xs font-bold uppercase tracking-wider theme-text-main flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>OAuth 2.0 Client App Setup</span>
          </div>

          <div className="theme-bg-inset p-4 rounded-xl border theme-border space-y-3 text-xs theme-text-secondary">
            <div className="font-semibold theme-text-main">
              Cisco Webex Integration Redirect URIs:
            </div>

            {/* Development URL */}
            <div className="flex items-center justify-between theme-bg-card p-2 rounded-lg border theme-border">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] theme-text-muted uppercase font-semibold">Development URL</div>
                <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 truncate">{devCallbackUrl}</div>
              </div>
              <button
                onClick={() => copyUrl(devCallbackUrl, 'dev')}
                className="p-1.5 rounded theme-bg-card hover:theme-bg-card-subtle theme-text-secondary border theme-border shrink-0"
                title="Copy Development Callback URL"
              >
                {copiedDevUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Shared URL */}
            <div className="flex items-center justify-between theme-bg-card p-2 rounded-lg border theme-border">
              <div className="min-w-0 pr-2">
                <div className="text-[10px] theme-text-muted uppercase font-semibold">Shared Container URL</div>
                <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 truncate">{sharedCallbackUrl}</div>
              </div>
              <button
                onClick={() => copyUrl(sharedCallbackUrl, 'shared')}
                className="p-1.5 rounded theme-bg-card hover:theme-bg-card-subtle theme-text-secondary border theme-border shrink-0"
                title="Copy Shared Callback URL"
              >
                {copiedSharedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-[11px] theme-text-muted leading-relaxed">
              Required Scopes in developer.webex.com: <code className="text-emerald-700 dark:text-emerald-400 font-mono">spark:all</code>,{' '}
              <code className="text-emerald-700 dark:text-emerald-400 font-mono">spark:kms</code>,{' '}
              <code className="text-emerald-700 dark:text-emerald-400 font-mono">meeting:schedules_read</code>,{' '}
              <code className="text-emerald-700 dark:text-emerald-400 font-mono">meeting:schedules_write</code>.
            </div>

            <button
              onClick={handleConnectOAuthPopup}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center space-x-2 shadow-sm"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Launch Webex OAuth Authorization Popup</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Bottom Switch to Demo Mode */}
        <div className="flex items-center justify-between border-t theme-border pt-4">
          <button
            onClick={() => {
              onSetDemoMode();
              onClose();
            }}
            className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
          >
            ← Use Pre-loaded Demo Mode (No Credentials Needed)
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold theme-bg-card hover:theme-bg-card-subtle theme-text-secondary border theme-border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
