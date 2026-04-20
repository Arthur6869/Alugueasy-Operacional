import { useState } from 'react';
import { X, Folder, Code, DollarSign, Briefcase, Users, Target, Zap, Heart, Star, TrendingUp, Package, Settings } from 'lucide-react';

interface NewWorkspaceModalProps {
  onClose: () => void;
  onSave: (workspace: any) => void;
}

const icons = [
  { id: 'folder', Icon: Folder, label: 'Pasta' },
  { id: 'code', Icon: Code, label: 'Código' },
  { id: 'dollar', Icon: DollarSign, label: 'Financeiro' },
  { id: 'briefcase', Icon: Briefcase, label: 'Negócios' },
  { id: 'users', Icon: Users, label: 'Equipe' },
  { id: 'target', Icon: Target, label: 'Objetivos' },
  { id: 'zap', Icon: Zap, label: 'Energia' },
  { id: 'heart', Icon: Heart, label: 'Coração' },
  { id: 'star', Icon: Star, label: 'Estrela' },
  { id: 'trending', Icon: TrendingUp, label: 'Crescimento' },
  { id: 'package', Icon: Package, label: 'Pacote' },
  { id: 'settings', Icon: Settings, label: 'Configurações' },
];

const colors = [
  { id: 'blue', name: 'Azul', value: '#4A9EDB' },
  { id: 'purple', name: 'Roxo', value: '#8B5CF6' },
  { id: 'green', name: 'Verde', value: '#10B981' },
  { id: 'orange', name: 'Laranja', value: '#F97316' },
  { id: 'pink', name: 'Rosa', value: '#F472B6' },
  { id: 'red', name: 'Vermelho', value: '#EF4444' },
  { id: 'yellow', name: 'Amarelo', value: '#F59E0B' },
  { id: 'teal', name: 'Azul Esverdeado', value: '#14B8A6' },
  { id: 'indigo', name: 'Índigo', value: '#6366F1' },
  { id: 'cyan', name: 'Ciano', value: '#06B6D4' },
];

export function NewWorkspaceModal({ onClose, onSave }: NewWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const workspace = {
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
      color: colors.find(c => c.id === selectedColor)?.value || '#4A9EDB',
    };

    onSave(workspace);
    onClose();
  };

  const SelectedIconComponent = icons.find(i => i.id === selectedIcon)?.Icon || Folder;
  const selectedColorValue = colors.find(c => c.id === selectedColor)?.value || '#4A9EDB';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#111827]">Criar Novo Workspace</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Organize suas tarefas em grupos de trabalho
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
          {/* Preview Card */}
          <div
            className="p-6 rounded-xl border-2 transition-all"
            style={{
              borderColor: selectedColorValue,
              backgroundColor: `${selectedColorValue}15`
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: selectedColorValue }}
              >
                <SelectedIconComponent size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#111827]">
                  {name || 'Nome do Workspace'}
                </h3>
                <p className="text-sm text-[#6B7280] mt-1">
                  {description || 'Adicione uma descrição...'}
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              Nome do Workspace <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marketing, Vendas, Suporte..."
              required
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] text-base"
            />
            <p className="text-xs text-[#6B7280] mt-1">{name.length}/50 caracteres</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste workspace..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] resize-none text-base"
            />
            <p className="text-xs text-[#6B7280] mt-1">{description.length}/200 caracteres</p>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-3">
              Ícone
            </label>
            <div className="grid grid-cols-6 gap-2">
              {icons.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedIcon(id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedIcon === id
                      ? 'border-[#4A9EDB] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={label}
                >
                  <Icon
                    size={24}
                    className={selectedIcon === id ? 'text-[#4A9EDB]' : 'text-gray-600'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-3">
              Cor do Tema
            </label>
            <div className="grid grid-cols-5 gap-3">
              {colors.map(({ id, name, value }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedColor(id)}
                  className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === id
                      ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-800'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: value }}
                  title={name}
                >
                  {selectedColor === id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-800 rounded-full" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          </div>
        </form>

        {/* Footer - Fixed at bottom */}
        <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transform hover:scale-105"
            style={{ backgroundColor: selectedColorValue }}
          >
            Criar Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
