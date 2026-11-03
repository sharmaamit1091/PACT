import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'active' | 'meeting' | 'call' | 'dnd' | 'inactive' | 'presenting' | 'bot' | 'offline';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  email,
  avatarUrl,
  size = 'md',
  status,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Compute initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

  // Size mappings
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-14 h-14 text-lg',
  }[size];

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2',
  }[size];

  // Deterministic palette based on name/email
  const palettes = [
    'from-cyan-600 to-blue-700 text-white',
    'from-teal-600 to-emerald-700 text-white',
    'from-indigo-600 to-violet-700 text-white',
    'from-amber-600 to-orange-700 text-white',
    'from-rose-600 to-pink-700 text-white',
    'from-blue-600 to-cyan-700 text-white',
  ];
  const charCode = (name + (email || '')).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palette = palettes[charCode % palettes.length];

  const statusColors = {
    active: 'bg-emerald-400',
    meeting: 'bg-amber-400',
    call: 'bg-emerald-400',
    dnd: 'bg-rose-500',
    inactive: 'bg-slate-400',
    presenting: 'bg-cyan-400',
    bot: 'bg-cyan-400',
    offline: 'bg-slate-500',
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`${sizeClasses} rounded-full object-cover border border-slate-700/80 shadow-inner`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-tr ${palette} flex items-center justify-center font-bold tracking-tight border border-white/10 shadow-sm`}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ${statusColors[status]} ${statusDotSizes} ring-slate-950`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
