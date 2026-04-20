import { Edit, Trash2, Copy } from 'lucide-react';

interface WorkspaceContextMenuProps {
  workspace: any;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function WorkspaceContextMenu({
  workspace,
  position,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
}: WorkspaceContextMenuProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px]"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
      >
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-all"
        >
          <Edit size={16} className="text-gray-600" />
          <span>Editar workspace</span>
        </button>
        <button
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-all"
        >
          <Copy size={16} className="text-gray-600" />
          <span>Duplicar</span>
        </button>
        <div className="border-t border-gray-200 my-1" />
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-3 transition-all text-red-600"
        >
          <Trash2 size={16} />
          <span>Excluir workspace</span>
        </button>
      </div>
    </>
  );
}
