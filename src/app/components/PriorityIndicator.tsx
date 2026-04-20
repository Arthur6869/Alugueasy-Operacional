interface PriorityIndicatorProps {
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  onClick?: () => void;
}

const priorityConfig = {
  'Baixa': { color: '#22C55E', emoji: '🟢' },
  'Média': { color: '#3B82F6', emoji: '🔵' },
  'Alta': { color: '#F97316', emoji: '🟠' },
  'Crítica': { color: '#EF4444', emoji: '🔴' },
};

export function PriorityIndicator({ priority, onClick }: PriorityIndicatorProps) {
  const config = priorityConfig[priority];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      alert('Alterar prioridade da tarefa');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-100 transition-all transform hover:scale-105"
    >
      <span className={priority === 'Crítica' ? 'animate-pulse' : ''}>
        {config.emoji}
      </span>
      <span style={{ color: config.color }}>{priority}</span>
    </button>
  );
}
