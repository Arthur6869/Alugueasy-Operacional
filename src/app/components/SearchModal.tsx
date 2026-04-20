import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchModalProps {
  onClose: () => void;
}

const mockResults = [
  { id: '1', type: 'Tarefa', title: 'Configurar CI/CD', group: 'Desenvolvimento' },
  { id: '2', type: 'Tarefa', title: 'Revisar contratos Q3', group: 'Operacional' },
  { id: '3', type: 'Tarefa', title: 'Deploy produção', group: 'Desenvolvimento' },
  { id: '4', type: 'Tarefa', title: 'Relatório financeiro', group: 'Financeiro' },
];

export function SearchModal({ onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResults = searchTerm
    ? mockResults.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.group.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-20 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 mb-8">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tarefas, projetos, pessoas..."
              className="w-full pl-12 pr-12 py-3 text-lg focus:outline-none"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
          {searchTerm === '' ? (
            <div className="p-8 text-center text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>Digite para buscar...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>Nenhum resultado encontrado para "{searchTerm}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    alert(`Abrir: ${result.title}`);
                    onClose();
                  }}
                  className="w-full p-4 hover:bg-gray-50 rounded-lg text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-[#111827]">{result.title}</p>
                    <p className="text-sm text-[#6B7280]">
                      {result.type} • {result.group}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Digite para buscar</span>
            <span>ESC para fechar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
