import { useEffect, useState } from 'react';
import { Zap, Plus, Trash2, X, ChevronRight } from 'lucide-react';
import { useAutomations, Automation } from '../../hooks/useAutomations';

const STATUS_OPTIONS = ['Pendente', 'Em Andamento', 'Revisão', 'Concluído'];
const PRIORITY_OPTIONS = ['Baixa', 'Média', 'Alta', 'Crítica'];
const MEMBER_OPTIONS = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'];

const TRIGGER_LABELS: Record<string, string> = {
  status_changed: 'Quando o status mudar para...',
  priority_changed: 'Quando a prioridade mudar para...',
  assignee_changed: 'Quando o responsável mudar para...',
  due_date_passed: 'Quando o prazo passar',
  task_created: 'Quando uma tarefa for criada',
};

const ACTION_LABELS: Record<string, string> = {
  change_status: 'Mudar o status para...',
  change_priority: 'Mudar a prioridade para...',
  notify_assignee: 'Notificar o responsável',
  move_to_group: 'Mover para o grupo...',
  create_subtask: 'Criar subtarefa...',
};

function triggerSummary(auto: Automation): string {
  const base = TRIGGER_LABELS[auto.trigger_type] ?? auto.trigger_type;
  if (auto.trigger_value) return base.replace('...', '') + auto.trigger_value;
  return base;
}

function actionSummary(auto: Automation): string {
  const base = ACTION_LABELS[auto.action_type] ?? auto.action_type;
  if (auto.action_value) return base.replace('...', '') + auto.action_value;
  return base;
}

function TriggerValueSelect({ triggerType, value, onChange }: {
  triggerType: string;
  value: string;
  onChange: (v: string) => void;
}) {
  if (triggerType === 'status_changed') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full border border-[#A8B4C0]/40 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]">
        <option value="">Selecione o status</option>
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }
  if (triggerType === 'priority_changed') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full border border-[#A8B4C0]/40 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]">
        <option value="">Selecione a prioridade</option>
        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    );
  }
  if (triggerType === 'assignee_changed') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full border border-[#A8B4C0]/40 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]">
        <option value="">Selecione o membro</option>
        {MEMBER_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    );
  }
  return null;
}

function ActionValueSelect({ actionType, value, onChange }: {
  actionType: string;
  value: string;
  onChange: (v: string) => void;
}) {
  if (actionType === 'change_status') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full border border-[#A8B4C0]/40 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]">
        <option value="">Selecione o status</option>
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    );
  }
  if (actionType === 'change_priority') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full border border-[#A8B4C0]/40 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]">
        <option value="">Selecione a prioridade</option>
        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    );
  }
  if (actionType === 'move_to_group' || actionType === 'create_subtask') {
    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={actionType === 'move_to_group' ? 'Nome do grupo' : 'Título da subtarefa'}
        className="mt-2 w-full border border-[#A8B4C0]/40 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
      />
    );
  }
  return null;
}

interface CreateModalProps {
  currentUser: string;
  onClose: () => void;
  onCreate: (params: any) => Promise<void>;
}

function CreateModal({ currentUser, onClose, onCreate }: CreateModalProps) {
  const [step, setStep] = useState(1);
  const [triggerType, setTriggerType] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  const [actionType, setActionType] = useState('');
  const [actionValue, setActionValue] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const needsTriggerValue = ['status_changed', 'priority_changed', 'assignee_changed'].includes(triggerType);
  const needsActionValue = ['change_status', 'change_priority', 'move_to_group', 'create_subtask'].includes(actionType);

  const canGoStep2 = triggerType && (!needsTriggerValue || triggerValue);
  const canGoStep3 = actionType && (!needsActionValue || actionValue);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onCreate({
      name: name.trim(),
      trigger_type: triggerType,
      trigger_value: triggerValue || undefined,
      action_type: actionType,
      action_value: actionValue || undefined,
      created_by: currentUser,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F4F6F9]">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#4A9EDB]" />
            <span className="font-semibold text-[#1E3A5F]">Nova Automação</span>
          </div>
          <button onClick={onClose} className="text-[#A8B4C0] hover:text-[#1E3A5F] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-5 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-[#4A9EDB] text-white' :
                step > s ? 'bg-[#10B981] text-white' :
                'bg-[#F4F6F9] text-[#A8B4C0]'
              }`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 w-8 transition-all ${step > s ? 'bg-[#10B981]' : 'bg-[#F4F6F9]'}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-[#A8B4C0]">
            {step === 1 ? 'Gatilho' : step === 2 ? 'Ação' : 'Confirmar'}
          </span>
        </div>

        {/* Step content */}
        <div className="p-5 min-h-[200px]">
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1E3A5F] mb-3">Escolha o gatilho:</p>
              {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  triggerType === key ? 'border-[#4A9EDB] bg-[#4A9EDB]/5' : 'border-[#A8B4C0]/30 hover:border-[#4A9EDB]/50'
                }`}>
                  <input
                    type="radio"
                    name="trigger"
                    value={key}
                    checked={triggerType === key}
                    onChange={() => { setTriggerType(key); setTriggerValue(''); }}
                    className="accent-[#4A9EDB]"
                  />
                  <span className="text-sm text-[#1E3A5F]">{label}</span>
                </label>
              ))}
              {triggerType && <TriggerValueSelect triggerType={triggerType} value={triggerValue} onChange={setTriggerValue} />}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#1E3A5F] mb-3">Escolha a ação:</p>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  actionType === key ? 'border-[#4A9EDB] bg-[#4A9EDB]/5' : 'border-[#A8B4C0]/30 hover:border-[#4A9EDB]/50'
                }`}>
                  <input
                    type="radio"
                    name="action"
                    value={key}
                    checked={actionType === key}
                    onChange={() => { setActionType(key); setActionValue(''); }}
                    className="accent-[#4A9EDB]"
                  />
                  <span className="text-sm text-[#1E3A5F]">{label}</span>
                </label>
              ))}
              {actionType && <ActionValueSelect actionType={actionType} value={actionValue} onChange={setActionValue} />}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#1E3A5F] mb-3">Confirme e nomeie sua automação:</p>
              <div className="bg-[#F4F6F9] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#1E3A5F]">
                  <span className="text-[#4A9EDB] font-medium">Quando</span>
                  <span>{triggerSummary({ trigger_type: triggerType, trigger_value: triggerValue } as Automation)}</span>
                </div>
                <ChevronRight size={14} className="text-[#A8B4C0] ml-1" />
                <div className="flex items-center gap-2 text-sm text-[#1E3A5F]">
                  <span className="text-[#10B981] font-medium">Então</span>
                  <span>{actionSummary({ action_type: actionType, action_value: actionValue } as Automation)}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#A8B4C0] mb-1">Nome da automação</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Notificar ao concluir tarefa"
                  className="w-full border border-[#A8B4C0]/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-[#F4F6F9]">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 text-sm text-[#A8B4C0] hover:text-[#1E3A5F] transition-colors"
          >
            {step > 1 ? 'Voltar' : 'Cancelar'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !canGoStep2 : !canGoStep3}
              className="px-5 py-2 bg-[#4A9EDB] text-white text-sm font-medium rounded-lg hover:bg-[#3A8ECB] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!name.trim() || saving}
              className="px-5 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Criando...' : 'Criar automação'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface AutomationsPanelProps {
  currentUser: string;
}

export function AutomationsPanel({ currentUser }: AutomationsPanelProps) {
  const { automations, loading, fetchAutomations, createAutomation, toggleAutomation, deleteAutomation } = useAutomations();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchAutomations(); }, [fetchAutomations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta automação?')) return;
    await deleteAutomation(id);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#F4F6F9]">
      <div className="p-4 md:p-8 pb-12 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A9EDB]/10 flex items-center justify-center">
              <Zap size={20} className="text-[#4A9EDB]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1E3A5F]">Automações</h1>
              <p className="text-sm text-[#A8B4C0]">Regras "Quando → Então" sem código</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A9EDB] text-white text-sm font-medium rounded-xl hover:bg-[#3A8ECB] transition-all shadow-sm"
          >
            <Plus size={16} />
            Nova regra
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#A8B4C0]">
            <div className="animate-spin w-6 h-6 border-2 border-[#4A9EDB] border-t-transparent rounded-full mr-3" />
            Carregando...
          </div>
        ) : automations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#A8B4C0]/20 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#4A9EDB]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap size={28} className="text-[#4A9EDB]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1E3A5F] mb-2">Nenhuma automação ainda</h2>
            <p className="text-sm text-[#A8B4C0] mb-6">Crie regras para automatizar ações repetitivas da equipe.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-[#4A9EDB] text-white text-sm font-medium rounded-xl hover:bg-[#3A8ECB] transition-all"
            >
              + Criar primeira automação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#A8B4C0] uppercase tracking-wider px-1">
              {automations.length} automação{automations.length !== 1 ? 'ões' : ''}
            </p>
            {automations.map(auto => (
              <div
                key={auto.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                  auto.enabled ? 'border-[#A8B4C0]/20' : 'border-[#A8B4C0]/10 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${auto.enabled ? 'bg-[#10B981]' : 'bg-[#A8B4C0]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1E3A5F] text-sm truncate">{auto.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-xs bg-[#4A9EDB]/10 text-[#4A9EDB] px-2 py-0.5 rounded-full">
                        {triggerSummary(auto)}
                      </span>
                      <ChevronRight size={12} className="text-[#A8B4C0]" />
                      <span className="text-xs bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded-full">
                        {actionSummary(auto)}
                      </span>
                    </div>
                    {auto.run_count > 0 && (
                      <p className="text-xs text-[#A8B4C0] mt-1.5">
                        Executou {auto.run_count}×
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleAutomation(auto.id, !auto.enabled)}
                      title={auto.enabled ? 'Desativar' : 'Ativar'}
                      className={`relative w-9 h-5 rounded-full transition-all ${auto.enabled ? 'bg-[#10B981]' : 'bg-[#A8B4C0]/40'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${auto.enabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(auto.id)}
                      className="p-1.5 text-[#A8B4C0] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateModal
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onCreate={createAutomation}
        />
      )}
    </div>
  );
}
