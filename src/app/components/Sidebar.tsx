import { useState } from 'react';
import { EasyTaskLogo } from './EasyTaskLogo';
import { TeamAvatar } from './TeamAvatar';
import { WorkspaceContextMenu } from './WorkspaceContextMenu';
import { useNotificationsContext } from '../../lib/NotificationsContext';
import { usePresence } from '../../hooks/usePresence';
import {
  Home, CheckSquare, Calendar, Bell, Folder, Code, DollarSign, Plus,
  LayoutGrid, CalendarDays, BarChart3, FileText, Settings, LogOut,
  LucideIcon, MoreVertical, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentUser, activeView, onViewChange, onLogout,
  customWorkspaces = [], onDeleteWorkspace,
  isOpen = false, onClose,
  isCollapsed = false, onToggleCollapse,
}: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ workspace: any; x: number; y: number } | null>(null);
  const { unreadCount } = useNotificationsContext();
  const { onlineUsers } = usePresence(currentUser, activeView);

  const getIconComponent = (iconId: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      folder: Icons.Folder, code: Icons.Code, dollar: Icons.DollarSign,
      briefcase: Icons.Briefcase, users: Icons.Users, target: Icons.Target,
      zap: Icons.Zap, heart: Icons.Heart, star: Icons.Star,
      trending: Icons.TrendingUp, package: Icons.Package, settings: Icons.Settings,
    };
    return iconMap[iconId] || Icons.Folder;
  };

  const handleContextMenu = (e: React.MouseEvent, workspace: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ workspace, x: e.clientX, y: e.clientY });
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
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center rounded-lg transition-all duration-200 ${
          isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5'
        } ${
          isActive
            ? 'bg-[#2A4F7C] text-white shadow-lg'
            : 'text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white'
        } relative`}
      >
        {isActive && !isCollapsed && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4A9EDB] rounded-r" />
        )}
        <Icon size={18} />
        {!isCollapsed && <span className="text-sm flex-1 text-left">{label}</span>}
        {!isCollapsed && badge !== undefined && badge > 0 && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        {isCollapsed && badge !== undefined && badge > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
    );
  };

  const WorkspaceNavItem = ({ icon: Icon, label, view, group, accentColor }: {
    icon: any; label: string; view: string; group: string; accentColor?: string;
  }) => {
    const isActive = activeView === view;
    return (
      <div className="relative group/ws">
        <button
          onClick={() => handleNavChange(view)}
          title={isCollapsed ? label : undefined}
          className={`w-full flex items-center rounded-lg transition-all duration-200 ${
            isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5 pr-9'
          } ${
            isActive
              ? 'bg-[#2A4F7C] text-white shadow-lg'
              : 'text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white'
          } relative`}
        >
          {isActive && !isCollapsed && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
              style={{ backgroundColor: accentColor || '#4A9EDB' }}
            />
          )}
          <Icon size={18} />
          {!isCollapsed && <span className="text-sm flex-1 text-left truncate">{label}</span>}
        </button>
        {!isCollapsed && (
          <button
            onClick={(e) => openNewTaskWithGroup(group, e)}
            title={`Nova tarefa em ${label}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/ws:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-[#4A9EDB] text-gray-300 hover:text-white transition-all"
          >
            <Plus size={13} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}

      <div
        className={`
          fixed md:relative z-40 md:z-auto
          h-screen flex flex-col shrink-0
          transition-all duration-300 ease-in-out
          md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-16' : 'w-64 md:w-60'}
        `}
        style={{ backgroundColor: '#1E3A5F' }}
      >
        {/* Logo */}
        <div className={`border-b border-[#2A4F7C] flex items-center ${isCollapsed ? 'justify-center py-5 px-2' : 'p-5'}`}>
          {isCollapsed ? (
            <div className="w-8 h-8 bg-[#4A9EDB] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              ET
            </div>
          ) : (
            <EasyTaskLogo variant="light" showTagline />
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 sidebar-scroll">

          {/* Toggle button - desktop only */}
          <div className="hidden md:flex justify-end">
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
              className="p-1.5 rounded-lg hover:bg-[#2A4F7C] text-gray-400 hover:text-white transition-all"
            >
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Main Section */}
          <div className="space-y-0.5">
            {!isCollapsed && <p className="text-xs text-gray-400 mb-2 px-2">SEÇÃO PRINCIPAL</p>}
            <NavItem icon={Home} label="Início" view="dashboard" />
            <NavItem icon={CheckSquare} label="Minhas Tarefas" view="my-tasks" />
            <NavItem icon={Calendar} label="Cronograma" view="schedule" />
            <NavItem icon={Bell} label="Notificações" view="notifications" badge={unreadCount} />
          </div>

          {/* Workspaces */}
          <div className="space-y-0.5">
            {!isCollapsed && <p className="text-xs text-gray-400 mb-2 px-2">WORKSPACES</p>}
            <WorkspaceNavItem icon={Folder} label="Operacional" view="operacional" group="Operacional" accentColor="#4A9EDB" />
            <WorkspaceNavItem icon={Code} label="Desenvolvimento" view="desenvolvimento" group="Desenvolvimento" accentColor="#8B5CF6" />
            <WorkspaceNavItem icon={DollarSign} label="Financeiro" view="financeiro" group="Financeiro" accentColor="#10B981" />

            {customWorkspaces.map((workspace) => {
              const IconComponent = getIconComponent(workspace.icon);
              const isActive = activeView === `workspace-${workspace.id}`;
              return (
                <div key={workspace.id} className="relative group/ws">
                  <button
                    onClick={() => handleNavChange(`workspace-${workspace.id}`)}
                    onContextMenu={(e) => handleContextMenu(e, workspace)}
                    title={isCollapsed ? workspace.name : undefined}
                    className={`w-full flex items-center rounded-lg transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5 pr-16'
                    } ${
                      isActive
                        ? 'bg-[#2A4F7C] text-white shadow-lg'
                        : 'text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white'
                    } relative`}
                  >
                    {isActive && !isCollapsed && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                        style={{ backgroundColor: workspace.color }}
                      />
                    )}
                    <IconComponent size={18} />
                    {!isCollapsed && <span className="text-sm flex-1 text-left truncate">{workspace.name}</span>}
                  </button>
                  {!isCollapsed && (
                    <>
                      <button
                        onClick={(e) => openNewTaskWithGroup(workspace.name, e)}
                        title={`Nova tarefa em ${workspace.name}`}
                        className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/ws:opacity-100 w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-[#4A9EDB] text-gray-300 hover:text-white transition-all"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, workspace); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/ws:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {!isCollapsed && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openNewWorkspace'))}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span>Novo Grupo</span>
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openNewWorkspace'))}
                title="Novo Grupo"
                className="w-full flex justify-center px-2 py-2.5 text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white rounded-lg transition-all"
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          {/* Views */}
          <div className="space-y-0.5">
            {!isCollapsed && <p className="text-xs text-gray-400 mb-2 px-2">VISTAS</p>}
            <NavItem icon={LayoutGrid} label="Board (Kanban)" view="kanban" />
            <NavItem icon={CalendarDays} label="Calendário" view="calendar" />
            <NavItem icon={BarChart3} label="Gráfico de Gantt" view="gantt" />
            <NavItem icon={FileText} label="Relatórios" view="reports" />
            <NavItem icon={Zap} label="Automações" view="automations" />
          </div>
        </div>

        {/* User Section */}
        <div className="border-t border-[#2A4F7C] p-2 space-y-1">
          {/* Indicador de presença — quem está online */}
          {onlineUsers.length > 0 && (
            isCollapsed ? (
              <div className="flex flex-col items-center gap-1 pt-1 pb-2">
                {onlineUsers.map(user => (
                  <div key={user.user_name} className="relative" title={`${user.user_name} — online`}>
                    <TeamAvatar member={user.user_name as any} size="sm" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-1 ring-[#1E3A5F]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 pt-2 pb-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Online agora</p>
                <div className="flex flex-wrap gap-1.5">
                  {onlineUsers.map(user => (
                    <div key={user.user_name} className="relative" title={`${user.user_name} — ${user.current_view}`}>
                      <TeamAvatar member={user.user_name as any} size="sm" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 ring-1 ring-[#1E3A5F]" />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1 py-1">
              <TeamAvatar member={currentUser} size="md" />
              <button
                onClick={() => handleNavChange('settings')}
                title="Configurações"
                className="p-2 text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white rounded-lg transition-all"
              >
                <Settings size={17} />
              </button>
              <button
                onClick={onLogout}
                title="Sair"
                className="p-2 text-gray-300 hover:bg-[#2A4F7C]/50 hover:text-white rounded-lg transition-all"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                <TeamAvatar member={currentUser} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{currentUser}</p>
                  <p className="text-gray-400 text-xs">Equipe EasyTask</p>
                </div>
              </div>
              <button
                onClick={() => handleNavChange('settings')}
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
            </>
          )}
        </div>

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
