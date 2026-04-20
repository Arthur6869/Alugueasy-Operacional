import { useState } from 'react';
import { AlugEasyLogo } from './AlugEasyLogo';
import { TeamAvatar } from './TeamAvatar';
import { WorkspaceContextMenu } from './WorkspaceContextMenu';
import { Home, CheckSquare, Calendar, Bell, Folder, Code, DollarSign, Plus, LayoutGrid, CalendarDays, BarChart3, FileText, Settings, LogOut, LucideIcon, MoreVertical } from 'lucide-react';
import * as Icons from 'lucide-react';

interface SidebarProps {
  currentUser: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  customWorkspaces?: any[];
  onDeleteWorkspace?: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentUser, activeView, onViewChange, onLogout, customWorkspaces = [], onDeleteWorkspace, isOpen = false, onClose }: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ workspace: any; x: number; y: number } | null>(null);

  const getIconComponent = (iconId: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      folder: Icons.Folder,
      code: Icons.Code,
      dollar: Icons.DollarSign,
      briefcase: Icons.Briefcase,
      users: Icons.Users,
      target: Icons.Target,
      zap: Icons.Zap,
      heart: Icons.Heart,
      star: Icons.Star,
      trending: Icons.TrendingUp,
      package: Icons.Package,
      settings: Icons.Settings,
    };
    return iconMap[iconId] || Icons.Folder;
  };

  const handleContextMenu = (e: React.MouseEvent, workspace: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      workspace,
      x: e.clientX,
      y: e.clientY,
    });
  };
  const handleNavChange = (view: string) => {
    onViewChange(view);
    if (onClose) onClose();
  };

  const openNewTaskWithGroup = (group: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('openNewTaskWithGroup', { detail: group }));
  };

  const NavItem = ({ icon: Icon, label, view, badge }: { icon: any; label: string; view: string; badge?: number }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => handleNavChange(view)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 transform ${
          isActive
            ? 'bg-[#2A4F7C] text-white scale-105 shadow-lg'
            : 'text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white hover:scale-102'
        } relative`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4A9EDB] rounded-r animate-pulse" />
        )}
        <Icon size={18} className={isActive ? 'animate-in zoom-in duration-300' : ''} />
        <span className="text-sm flex-1 text-left">{label}</span>
        {badge && (
          <span className="bg-[#EF4444] text-white text-xs px-1.5 py-0.5 rounded-full animate-bounce">
            {badge}
          </span>
        )}
      </button>
    );
  };

  // Workspace item com botão "+" para criar tarefa diretamente
  const WorkspaceNavItem = ({ icon: Icon, label, view, group, accentColor }: {
    icon: any; label: string; view: string; group: string; accentColor?: string;
  }) => {
    const isActive = activeView === view;
    return (
      <div className="relative group/ws">
        <button
          onClick={() => handleNavChange(view)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 transform ${
            isActive
              ? 'bg-[#2A4F7C] text-white scale-105 shadow-lg'
              : 'text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white'
          } relative pr-9`}
        >
          {isActive && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-r animate-pulse"
              style={{ backgroundColor: accentColor || '#4A9EDB' }}
            />
          )}
          <Icon size={18} />
          <span className="text-sm flex-1 text-left truncate">{label}</span>
        </button>
        {/* Botão "+" aparece no hover */}
        <button
          onClick={(e) => openNewTaskWithGroup(group, e)}
          title={`Nova tarefa em ${label}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/ws:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-[#4A9EDB] text-gray-300 hover:text-white transition-all"
        >
          <Plus size={13} />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Overlay escuro no mobile quando sidebar está aberta */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

    <div
      className={`
        fixed md:relative z-40 md:z-auto
        w-64 md:w-60 h-screen flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ backgroundColor: '#1E3A5F' }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-[#2A4F7C]">
        <AlugEasyLogo variant="light" showVersion />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 sidebar-scroll">
        {/* Main Section */}
        <div>
          <p className="text-xs text-gray-400 mb-2 px-4">SEÇÃO PRINCIPAL</p>
          <NavItem icon={Home} label="Início" view="dashboard" />
          <NavItem icon={CheckSquare} label="Minhas Tarefas" view="my-tasks" />
          <NavItem icon={Calendar} label="Cronograma" view="schedule" />
          <NavItem icon={Bell} label="Notificações" view="notifications" badge={3} />
        </div>

        {/* Workspaces */}
        <div>
          <p className="text-xs text-gray-400 mb-2 px-4">WORKSPACES</p>
          <WorkspaceNavItem icon={Folder} label="Operacional" view="operacional" group="Operacional" accentColor="#4A9EDB" />
          <WorkspaceNavItem icon={Code} label="Desenvolvimento" view="desenvolvimento" group="Desenvolvimento" accentColor="#8B5CF6" />
          <WorkspaceNavItem icon={DollarSign} label="Financeiro" view="financeiro" group="Financeiro" accentColor="#10B981" />

          {/* Custom Workspaces */}
          {customWorkspaces.map((workspace) => {
            const IconComponent = getIconComponent(workspace.icon);
            const isActive = activeView === `workspace-${workspace.id}`;
            return (
              <div key={workspace.id} className="relative group/ws">
                <button
                  onClick={() => handleNavChange(`workspace-${workspace.id}`)}
                  onContextMenu={(e) => handleContextMenu(e, workspace)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 transform ${
                    isActive
                      ? 'bg-[#2A4F7C] text-white scale-105 shadow-lg'
                      : 'text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white'
                  } relative pr-16`}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r animate-pulse"
                      style={{ backgroundColor: workspace.color }}
                    />
                  )}
                  <IconComponent size={18} />
                  <span className="text-sm flex-1 text-left truncate">{workspace.name}</span>
                </button>
                {/* Botão "+" */}
                <button
                  onClick={(e) => openNewTaskWithGroup(workspace.name, e)}
                  title={`Nova tarefa em ${workspace.name}`}
                  className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/ws:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-[#4A9EDB] text-gray-300 hover:text-white transition-all"
                >
                  <Plus size={13} />
                </button>
                {/* Menu de contexto "⋮" */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, workspace); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/ws:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openNewWorkspace'))}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white rounded-lg transition-all text-sm transform hover:scale-105"
          >
            <Plus size={18} />
            <span>Novo Grupo</span>
          </button>
        </div>

        {/* Views */}
        <div>
          <p className="text-xs text-gray-400 mb-2 px-4">VISTAS</p>
          <NavItem icon={LayoutGrid} label="Board (Kanban)" view="kanban" />
          <NavItem icon={CalendarDays} label="Calendário" view="calendar" />
          <NavItem icon={BarChart3} label="Gráfico de Gantt" view="gantt" />
          <NavItem icon={FileText} label="Relatórios" view="reports" />
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-[#2A4F7C] space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <TeamAvatar member={currentUser} size="md" />
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{currentUser}</p>
            <p className="text-gray-400 text-xs">Equipe AlugEasy</p>
          </div>
        </div>
        <button
          onClick={() => { handleNavChange('settings'); }}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white rounded-lg transition-all text-sm"
        >
          <Settings size={18} />
          <span>Configurações</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white rounded-lg transition-all text-sm"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <WorkspaceContextMenu
          workspace={contextMenu.workspace}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onEdit={() => alert('Edição em desenvolvimento')}
          onDelete={() => {
            if (onDeleteWorkspace && confirm(`Deseja realmente excluir o workspace "${contextMenu.workspace.name}"?`)) {
              onDeleteWorkspace(contextMenu.workspace.id);
              if (activeView === `workspace-${contextMenu.workspace.id}`) {
                handleNavChange('dashboard');
              }
            }
          }}
          onDuplicate={() => {
            window.dispatchEvent(new CustomEvent('duplicateWorkspace', { detail: contextMenu.workspace }));
          }}
        />
      )}
    </div>
    </>
  );
}
