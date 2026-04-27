import { Layers } from 'lucide-react';
import { BRAND } from '../../lib/brand';

interface EasyTaskLogoProps {
  variant?: 'dark' | 'light';
  showTagline?: boolean;
}

export function EasyTaskLogo({ variant = 'dark', showTagline = false }: EasyTaskLogoProps) {
  const iconColor = variant === 'light' ? '#FFFFFF' : BRAND.primaryColor;
  const textColor = variant === 'light' ? 'text-white' : 'text-[#1E3A5F]';
  const taglineColor = variant === 'light' ? 'text-white/60' : 'text-[#A8B4C0]';

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: variant === 'light' ? 'rgba(255,255,255,0.15)' : '#EEF4FB' }}
      >
        <Layers size={20} color={iconColor} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`text-lg font-semibold tracking-tight leading-tight ${textColor}`}>
          {BRAND.name}
        </span>
        {showTagline && (
          <span className={`text-[10px] leading-tight truncate ${taglineColor}`}>
            {BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );
}
