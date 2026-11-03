import React, { useState } from 'react';
import {
  Webhook,
  Play,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  Terminal,
  Activity,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { WebexWebhook, WebexWebhookEvent } from '../types/webex';
import { filterWebhookEvents } from '../utils/webexLogic';

interface WebhooksViewProps {
  webhooks: WebexWebhook[];
  events: WebexWebhookEvent[];
  onSimulateEvent: (resource: 'messages' | 'meetings' | 'attachmentActions') => void;
  onCreateWebhook: (name: string, resource: WebexWebhook['resource'], event: WebexWebhook['event']) => void;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({
  webhooks,
  events,
  onSimulateEvent,
  onCreateWebhook,
}) => {
  const [resourceFilter, setResourceFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(events[0]?.id || null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New hook form
  const [newHookName, setNewHookName] = useState('');
  const [newHookResource, setNewHookResource] = useState<WebexWebhook['resource']>('messages');
  const [newHookEvent, setNewHookEvent] = useState<WebexWebhook['event']>('created');

  const filteredEvents = filterWebhookEvents(events, resourceFilter, eventFilter);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHookName.trim()) return;
    onCreateWebhook(newHookName.trim(), newHookResource, newHookEvent);
    setNewHookName('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-100">Webhooks & Event Stream</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Webex Firehose Listener
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Receive and process real-time notifications when users post messages, start meetings, or interact with cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onSimulateEvent('messages')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Message Event</span>
          </button>
          <button
            onClick={() => onSimulateEvent('meetings')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/60 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Meeting Event</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Webhook</span>
          </button>
        </div>
      </div>

      {/* Webhook Endpoint Info Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Active Webhook Target URL
          </div>
          <div className="text-xs text-cyan-300 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 break-all select-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/api/webex/webhook` : '/api/webex/webhook'}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 max-w-sm">
          Cisco Webex will deliver HTTP POST requests signed with HMAC-SHA1 to this endpoint whenever subscribed events occur.
        </div>
      </div>

      {/* Subscribed Webhooks Table */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Registered Webex Subscriptions ({webhooks.length})
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">Event</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {webhooks.map((hook) => (
                <tr key={hook.id} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-semibold text-slate-200 flex items-center gap-2">
                    <Webhook className="w-3.5 h-3.5 text-cyan-400" />
                    {hook.name}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono text-[10px]">
                      {hook.resource}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono text-[10px]">
                      {hook.event}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 font-semibold text-[10px] inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px] truncate max-w-xs">
                    {hook.targetUrl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Live Webhook Ingestion Log ({filteredEvents.length} events)</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none"
            >
              <option value="all">All Resources</option>
              <option value="messages">messages</option>
              <option value="meetings">meetings</option>
              <option value="attachmentActions">attachmentActions</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id;
            return (
              <div
                key={evt.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        evt.resource === 'messages'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : evt.resource === 'meetings'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}
                    >
                      {evt.resource}.{evt.event}
                    </span>

                    <span className="text-xs font-semibold text-slate-200">
                      Actor: {evt.actorEmail || evt.actorId}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3 h-3" />
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{evt.id}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3.5 bg-slate-950 border-t border-slate-800">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                      Cisco Webex Webhook Payload JSON
                    </div>
                    <pre className="font-mono text-[11px] text-cyan-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                      {JSON.stringify(evt, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Register Webex Webhook</h3>
            <p className="text-xs text-slate-400">
              Create an event listener through Webex POST /v1/webhooks
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Webhook Name
                </label>
                <input
                  type="text"
                  required
                  value={newHookName}
                  onChange={(e) => setNewHookName(e.target.value)}
                  placeholder="e.g. Production Messages Listener"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resource</label>
                <select
                  value={newHookResource}
                  onChange={(e) => setNewHookResource(e.target.value as WebexWebhook['resource'])}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="messages">messages</option>
                  <option value="meetings">meetings</option>
                  <option value="attachmentActions">attachmentActions</option>
                  <option value="rooms">rooms</option>
                  <option value="memberships">memberships</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event</label>
                <select
                  value={newHookEvent}
                  onChange={(e) => setNewHookEvent(e.target.value as WebexWebhook['event'])}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="created">created</option>
                  <option value="updated">updated</option>
                  <option value="deleted">deleted</option>
                  <option value="all">all</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                >
                  Register Hook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
