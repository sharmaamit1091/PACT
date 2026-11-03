import React from 'react';
import {
  Video,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  Sparkles,
  LayoutDashboard,
  User,
  Settings,
  BellRing,
  Lock,
} from 'lucide-react';
import { WebexUser, ConnectionMode } from '../types/webex';
import { PACTLogo } from './PACTLogo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { AppTheme } from '../utils/themeLogic';

export type PrimarySection = 'host' | 'employee' | 'admin';

interface HeaderProps {
  currentUser: WebexUser;
  connectionMode: ConnectionMode;
  activeSection: PrimarySection;
  onSelectSection: (section: PrimarySection) => void;
  activeRole: 'host' | 'employee';
  onSwitchRole: (role: 'host' | 'employee') => void;
  onOpenConnectModal: () => void;
  urgentCount: number;
  currentTheme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  connectionMode,
  activeSection,
  onSelectSection,
  activeRole,
  onSwitchRole,
  onOpenConnectModal,
  urgentCount,
  currentTheme,
  onThemeChange,
}) => {
  return (
    <header className="h-16 border-b theme-border theme-bg-header backdrop-blur-md px-4 lg:px-6 flex items-center justify-between select-none z-20 transition-colors duration-200">
      {/* Brand & Wordmark */}
      <div className="flex items-center space-x-3">
        <PACTLogo size="sm" showSubtitle={true} />
        <div className="hidden 2xl:flex items-center border-l theme-border pl-3">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 italic tracking-wide">
            "From Meetings to Actions. From Actions to Results."
          </span>
        </div>
        {/* Cisco Corporate Domain Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>cisco.com domain</span>
        </div>
      </div>

      {/* 3 Primary Navigation Sections */}
      <nav className="flex items-center theme-bg-inset p-1 rounded-xl border theme-border shadow-inner">
        <button
          onClick={() => {
            onSelectSection('host');
            onSwitchRole('host');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeSection === 'host'
              ? 'theme-accent shadow-sm font-bold'
              : 'theme-text-secondary hover:theme-text-main hover:theme-bg-card-subtle'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>1. Host Dashboard</span>
          {urgentCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSection === 'host'
                  ? 'bg-black/25 text-amber-200'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              {urgentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            onSelectSection('employee');
            onSwitchRole('employee');
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeSection === 'employee'
              ? 'theme-accent shadow-sm font-bold'
              : 'theme-text-secondary hover:theme-text-main hover:theme-bg-card-subtle'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>2. Employee Dashboard</span>
        </button>

        <button
          onClick={() => onSelectSection('admin')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeSection === 'admin'
              ? 'theme-accent shadow-sm font-bold'
              : 'theme-text-secondary hover:theme-text-main hover:theme-bg-card-subtle'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>3. Admin / Webex Settings</span>
        </button>
      </nav>

      {/* Right User, Theme Switcher & Status Details */}
      <div className="flex items-center space-x-2.5">
        {/* Theme Switcher Toggle */}
        <ThemeSwitcher
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
        />

        {/* Connection Status Button */}
        <button
          onClick={onOpenConnectModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium theme-bg-card hover:theme-bg-card-subtle theme-text-secondary border theme-border transition-colors shadow-sm"
          title="Webex Integration Status"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionMode === 'demo' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          <span className="hidden md:inline">
            {connectionMode === 'demo' ? 'Webex (Sandbox)' : 'Webex Connected'}
          </span>
        </button>

        {/* Current Active Persona */}
        <div className="flex items-center space-x-2 pl-2 border-l theme-border">
          <img
            src={currentUser.avatar}
            alt={currentUser.displayName}
            className="w-8 h-8 rounded-full object-cover border theme-border"
          />
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold theme-text-main leading-tight">
              {currentUser.displayName}
            </div>
            <div className="text-[10px] theme-text-muted">
              {activeSection === 'host'
                ? 'Meeting Host · cisco.com'
                : 'amit.sharma@cisco.com'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
