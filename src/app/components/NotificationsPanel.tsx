import { Bell } from 'lucide-react';

export function NotificationsPanel() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="p-8 pb-12 min-h-full">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#111827]">Notificações</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Sem notificações</p>
            <p className="text-sm text-gray-400 mt-1">Você está em dia com tudo!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
