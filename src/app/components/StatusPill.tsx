interface StatusPillProps {
  status: 'Pendente' | 'Em Andamento' | 'Revisão' | 'Concluído';
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const statusConfig = {
  'Pendente': {
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    darkBg: 'dark:bg-slate-800/50',
    darkText: 'dark:text-slate-300',
    darkBorder: 'dark:border-slate-700',
  },
  'Em Andamento': {
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
    darkBorder: 'dark:border-blue-800',
  },
  'Revisão': {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-300',
    darkBorder: 'dark:border-amber-800',
  },
  'Concluído': {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-300',
    darkBorder: 'dark:border-emerald-800',
  },
};

export function StatusPill({ status, onClick, size = 'md' }: StatusPillProps) {
  const c = statusConfig[status];
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      {...(onClick ? { onClick } : {})}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-md border
        ${c.bg} ${c.text} ${c.border}
        ${c.darkBg} ${c.darkText} ${c.darkBorder}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {status}
    </Tag>
  );
}
