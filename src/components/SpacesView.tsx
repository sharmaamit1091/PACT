import React, { useState } from 'react';
import {
  Search,
  Plus,
  Send,
  Video,
  Lock,
  Hash,
  Users,
  Smile,
  Paperclip,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WebexSpace, WebexMessage, WebexUser } from '../types/webex';
import { AdaptiveCardRenderer } from './AdaptiveCardRenderer';
import { createSampleAdaptiveCard, parseWebexMarkdownMentions } from '../utils/webexLogic';
import { Avatar } from './Avatar';

interface SpacesViewProps {
  spaces: WebexSpace[];
  messages: Record<string, WebexMessage[]>;
  currentUser: WebexUser;
  selectedSpaceId: string;
  onSelectSpace: (spaceId: string) => void;
  onSendMessage: (roomId: string, text: string, cardType?: 'poll' | 'incident' | 'kudos' | 'standup') => void;
  onCreateSpace: (title: string, type: 'group' | 'direct', description: string) => void;
  onStartSpaceMeeting: (space: WebexSpace) => void;
}

export const SpacesView: React.FC<SpacesViewProps> = ({
  spaces,
  messages,
  currentUser,
  selectedSpaceId,
  onSelectSpace,
  onSendMessage,
  onCreateSpace,
  onStartSpaceMeeting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'group' | 'direct'>('all');
  const [messageInput, setMessageInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCardMenu, setShowCardMenu] = useState(false);

  // New space form state
  const [newSpaceTitle, setNewSpaceTitle] = useState('');
  const [newSpaceType, setNewSpaceType] = useState<'group' | 'direct'>('group');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');

  const activeSpace = spaces.find((s) => s.id === selectedSpaceId) || spaces[0];
  const activeMessages = activeSpace ? messages[activeSpace.id] || [] : [];

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch =
      space.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (space.description && space.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || space.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeSpace) return;
    onSendMessage(activeSpace.id, messageInput);
    setMessageInput('');
  };

  const handleInsertCard = (cardType: 'poll' | 'incident' | 'kudos' | 'standup') => {
    if (!activeSpace) return;
    onSendMessage(
      activeSpace.id,
      `Sent Cisco Webex Adaptive Card: ${cardType.toUpperCase()}`,
      cardType
    );
    setShowCardMenu(false);
  };

  const handleCreateSpaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceTitle.trim()) return;
    onCreateSpace(newSpaceTitle.trim(), newSpaceType, newSpaceDesc.trim());
    setNewSpaceTitle('');
    setNewSpaceDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden theme-bg-app transition-colors duration-200">
      {/* Spaces List Left Column */}
      <div className="w-80 border-r theme-border theme-bg-sidebar flex flex-col shrink-0">
        {/* Search & Actions Header */}
        <div className="p-3 border-b theme-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider theme-text-muted">
              Webex Spaces ({filteredSpaces.length})
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors shadow-sm"
              title="Create new Webex Space"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 theme-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter spaces or people..."
              className="w-full text-xs theme-bg-input border theme-border rounded-lg pl-8 pr-3 py-1.5 theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex items-center space-x-1 theme-bg-inset p-0.5 rounded-lg border theme-border">
            {(['all', 'group', 'direct'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={`flex-1 text-[11px] py-1 rounded-md capitalize font-medium transition-colors ${
                  filterType === tab
                    ? 'theme-bg-card theme-text-main shadow-sm border theme-border'
                    : 'theme-text-muted hover:theme-text-main'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Space List Scroll */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSpaces.map((space) => {
            const isSelected = space.id === activeSpace?.id;
            return (
              <button
                key={space.id}
                onClick={() => onSelectSpace(space.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-3 group ${
                  isSelected
                    ? 'theme-bg-card border theme-border shadow-sm'
                    : 'hover:theme-bg-card-subtle border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar
                    name={space.title}
                    avatarUrl={space.avatar}
                    size="sm"
                    className="rounded-xl"
                  />
                  {space.isLocked && (
                    <span className="absolute -top-1 -left-1 p-0.5 rounded theme-bg-card text-amber-600 border theme-border">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'theme-text-main'
                      }`}
                    >
                      {space.title}
                    </span>
                    {space.unreadCount ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold shrink-0">
                        {space.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] theme-text-muted truncate mt-0.5">
                    {space.description || (space.type === 'direct' ? 'Direct conversation' : 'Webex Team Space')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Area Right Column */}
      {activeSpace ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden theme-bg-app">
          {/* Active Space Header */}
          <div className="h-14 border-b theme-border theme-bg-header px-5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg theme-bg-inset text-emerald-600 dark:text-emerald-400 border theme-border">
                {activeSpace.type === 'direct' ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold theme-text-main">{activeSpace.title}</h3>
                  {activeSpace.isLocked && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                      Locked Space
                    </span>
                  )}
                </div>
                <p className="text-xs theme-text-muted truncate max-w-xl">
                  {activeSpace.description || 'Active Cisco Webex Channel'}
                </p>
              </div>
            </div>

            {/* Space Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onStartSpaceMeeting(activeSpace)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition-all active:scale-95"
                title="Start a Webex Meeting directly in this space"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Meet in Webex</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeMessages.map((msg) => {
              const isMe = msg.personId === currentUser.id;
              const { sanitized } = parseWebexMarkdownMentions(msg.text);

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <Avatar
                    name={msg.personDisplayName || msg.personEmail}
                    email={msg.personEmail}
                    avatarUrl={msg.personAvatar || (isMe ? currentUser.avatar : undefined)}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />

                  <div className={`max-w-2xl ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold theme-text-secondary">
                        {msg.personDisplayName || msg.personEmail}
                      </span>
                      <span className="text-[10px] theme-text-muted">
                        {new Date(msg.created).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`inline-block p-3 rounded-2xl text-xs text-left leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-tr-none shadow-sm'
                          : 'theme-card theme-text-secondary rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.markdown ? (
                        <div className="whitespace-pre-wrap font-sans">{sanitized}</div>
                      ) : (
                        <p>{sanitized}</p>
                      )}
                    </div>

                    {/* Attached Cisco Webex Adaptive Card */}
                    {msg.attachments?.map((att, aIdx) => (
                      <div key={aIdx} className="mt-2 text-left">
                        <AdaptiveCardRenderer card={att.content} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer Footer */}
          <div className="p-4 border-t theme-border theme-bg-header relative">
            {/* Card selector popover */}
            {showCardMenu && (
              <div className="absolute bottom-20 left-6 theme-card rounded-xl p-2 shadow-2xl z-30 w-64 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider theme-text-muted">
                  Insert Webex Adaptive Card
                </div>
                <button
                  onClick={() => handleInsertCard('poll')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:theme-bg-card-subtle text-xs theme-text-main flex items-center space-x-2"
                >
                  <span className="text-base">📊</span>
                  <div>
                    <div className="font-semibold">Team Poll Card</div>
                    <div className="text-[10px] theme-text-muted">Single/multi-choice voting card</div>
                  </div>
                </button>
                <button
                  onClick={() => handleInsertCard('incident')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:theme-bg-card-subtle text-xs theme-text-main flex items-center space-x-2"
                >
                  <span className="text-base">🚨</span>
                  <div>
                    <div className="font-semibold text-rose-700 dark:text-rose-400">P1 Incident Triage Alert</div>
                    <div className="text-[10px] theme-text-muted">Actionable on-call dispatch card</div>
                  </div>
                </button>
                <button
                  onClick={() => handleInsertCard('kudos')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:theme-bg-card-subtle text-xs theme-text-main flex items-center space-x-2"
                >
                  <span className="text-base">🌟</span>
                  <div>
                    <div className="font-semibold text-amber-700 dark:text-amber-400">Team Kudos / High Five</div>
                    <div className="text-[10px] theme-text-muted">Recognition & feedback card</div>
                  </div>
                </button>
                <button
                  onClick={() => handleInsertCard('standup')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:theme-bg-card-subtle text-xs theme-text-main flex items-center space-x-2"
                >
                  <span className="text-base">⚡</span>
                  <div>
                    <div className="font-semibold">Async Daily Standup</div>
                    <div className="text-[10px] theme-text-muted">Yesterday, today & blockers</div>
                  </div>
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeSpace.title}... (supports markdown & Webex Adaptive Cards)`}
                  className="flex-1 theme-bg-input border theme-border rounded-xl px-4 py-2.5 text-xs theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between text-xs theme-text-muted px-1">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCardMenu(!showCardMenu)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-md theme-bg-inset hover:theme-bg-card-subtle text-emerald-700 dark:text-emerald-400 border theme-border transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Send Adaptive Card</span>
                  </button>
                  <span className="text-[11px] theme-text-muted hidden sm:inline">
                    Markdown: **bold**, _italic_, `code`
                  </span>
                </div>
                <div className="text-[11px] theme-text-muted flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Webex REST API v1
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center theme-text-muted">
          Select or create a Webex space to begin.
        </div>
      )}

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="theme-card rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold theme-text-main mb-1">Create Cisco Webex Space</h3>
            <p className="text-xs theme-text-muted mb-4">
              Provision a new group workspace or direct 1:1 room in Webex.
            </p>
            <form onSubmit={handleCreateSpaceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">Space Name</label>
                <input
                  type="text"
                  required
                  value={newSpaceTitle}
                  onChange={(e) => setNewSpaceTitle(e.target.value)}
                  placeholder="e.g. #growth-marketing or Incident Response"
                  className="w-full text-xs theme-bg-input border theme-border rounded-lg px-3 py-2 theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSpaceType('group')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center ${
                      newSpaceType === 'group'
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                        : 'theme-bg-inset theme-border theme-text-muted'
                    }`}
                  >
                    Group Space
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSpaceType('direct')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center ${
                      newSpaceType === 'direct'
                        ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                        : 'theme-bg-inset theme-border theme-text-muted'
                    }`}
                  >
                    Direct (1:1)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Description / Topic
                </label>
                <textarea
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="What is this space for?"
                  rows={2}
                  className="w-full text-xs theme-bg-input border theme-border rounded-lg p-2.5 theme-text-main placeholder:theme-text-muted focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t theme-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs theme-text-muted hover:theme-text-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
