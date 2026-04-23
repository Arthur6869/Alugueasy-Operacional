import { useState, useEffect } from 'react';

interface TeamAvatarProps {
  member: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const memberColors = {
  Arthur: '#4A9EDB',
  Yasmim: '#F472B6',
  Alexandre: '#34D399',
  Nikolas: '#F59E0B',
};

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export function TeamAvatar({ member, size = 'md', showName = false }: TeamAvatarProps) {
  const [photo, setPhoto] = useState<string | null>(() =>
    localStorage.getItem(`profilePhoto_${member}`)
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const { member: m, photo: p } = (e as CustomEvent).detail;
      if (m === member) setPhoto(p);
    };
    window.addEventListener('profilePhotoUpdated', handler);
    return () => window.removeEventListener('profilePhotoUpdated', handler);
  }, [member]);

  const initials = member.substring(0, 2).toUpperCase();
  const bgColor = memberColors[member];

  return (
    <div className="flex items-center gap-2">
      {photo ? (
        <img
          src={photo}
          alt={member}
          className={`${sizeClasses[size]} rounded-full object-cover shrink-0`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white shrink-0`}
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
      )}
      {showName && <span className="text-sm">{member}</span>}
    </div>
  );
}
