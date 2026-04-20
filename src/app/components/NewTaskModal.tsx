import { X, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { TeamAvatar } from './TeamAvatar';
import { useTasksContext } from '../../lib/TasksContext';

interface NewTaskModalProps {
  onClose: () => void;
  onSave: (task: any) => void;
  initialDate?: string;
  initialGroup?: string;
}

const teamMembers = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'] as const;
const statuses = ['Pendente', 'Em Andamento', 'Revisão', 'Concluído'] as const;
const priorities = ['Baixa', 'Média', 'Alta', 'Crítica'] as const;
const groups = ['Operacional', 'Desenvolvimento', 'Financeiro'] as const;

export function NewTaskModal({ onClose, onSave, initialDate, initialGroup }: NewTaskModalProps) {
  const { addTask } = useTasksContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const validGroup = groups.find(g => g === initialGroup) ?? 'Operacional';
  const [group, setGroup] = useState<typeof groups[number]>(validGroup);
  const [assignee, setAssignee] = useState<typeof teamMembers[number]>('Arthur');
  const [status, setStatus] = useState<typeof statuses[number]>('Pendente');
  const [priority, setPriority] = useState<typeof priorities[number]>('Média');
  const [date, setDate] = useState(initialDate || '');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const task = await addTask({
      title: title.trim(),
      description,
      group,
      assignee,
      status,
      priority,
      due_date: date || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setSaving(false);
    if (task) {
      onSave({ title, group });
    } else {
      window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'error', message: 'Erro ao salvar tarefa. Verifique o .env do Supabase.' } }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8 max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">Nova Tarefa</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-all text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Nome da tarefa"
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Adicione uma descrição detalhada..."
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Grupo <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {groups.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    group === g
                      ? 'bg-[#1E3A5F] text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Responsável <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {teamMembers.map(member => (
                <button
                  key={member}
                  type="button"
                  onClick={() => setAssignee(member)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    assignee === member
                      ? 'border-[#4A9EDB] bg-[#4A9EDB]/10'
                      : 'border-border hover:border-[#4A9EDB]/50'
                  }`}
                >
                  <TeamAvatar member={member} size="sm" />
                  <span className="text-xs mt-1 block text-foreground">{member}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof statuses[number])}
                className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priorities[number])}
                className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Prazo</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="DevOps, Deploy, etc"
                className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
              />
            </div>
          </div>

          </div>
        </form>

        {/* Footer - Fixed at bottom */}
        <div className="flex gap-3 p-6 border-t border-border flex-shrink-0 bg-card rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-border rounded-lg font-medium hover:bg-muted transition-all text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Criar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}
