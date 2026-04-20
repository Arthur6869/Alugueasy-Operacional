interface AlugEasyLogoProps {
  variant?: 'dark' | 'light';
  showVersion?: boolean;
}

export function AlugEasyLogo({ variant = 'dark', showVersion = false }: AlugEasyLogoProps) {
  const fillColor = variant === 'light' ? '#FFFFFF' : '#A8B4C0';
  const textColor = variant === 'light' ? 'text-white' : 'text-[#1E3A5F]';

  return (
    <div className="flex items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M40 120 L100 60 L160 120"
          stroke={fillColor}
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div className="flex flex-col">
        <span className={`text-xl font-bold tracking-wide ${textColor}`}>
          ALUGUEASY
        </span>
        {showVersion && (
          <span className="text-xs text-gray-400">v1.0</span>
        )}
      </div>
    </div>
  );
}
