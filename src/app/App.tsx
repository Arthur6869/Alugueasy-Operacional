import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaskTable } from './components/TaskTable';
import { TaskTableReadOnly } from './components/TaskTableReadOnly';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { MyTasks } from './components/MyTasks';
import { NotificationsPanel } from './components/NotificationsPanel';
import { SettingsScreen } from './components/SettingsScreen';
import { ReportsView } from './components/ReportsView';
import { GanttView } from './components/GanttView';
import { NewTaskModal } from './components/NewTaskModal';
import { NewWorkspaceModal } from './components/NewWorkspaceModal';
import { SearchModal } from './components/SearchModal';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { Toaster, toast } from 'sonner';
import { TasksProvider, useTasksContext } from '../lib/TasksContext';
import { NotificationsProvider } from '../lib/NotificationsContext';

// ---------------------------------------------------------------
// Inner app — usa o contexto de tarefas
// ---------------------------------------------------------------

function AppInner() {
  const { workspaces, addWorkspace, deleteWorkspace } = useTasksContext();

  type TeamMember = 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
  const validMembers: TeamMember[] = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'];

  const memberFromEmail = useCallback((email?: string): TeamMember | null => {
    if (!email) return null;
    const prefix = email.split('@')[0];
    const name = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    return validMembers.includes(name as TeamMember) ? (name as TeamMember) : null;
  }, []);

  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskInitialDate, setNewTaskInitialDate] = useState<string | undefined>(undefined);
  const [newTaskInitialGroup, setNewTaskInitialGroup] = useState<string | undefined>(undefined);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<string | undefined>(undefined);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Restaura sessão ao recarregar e escuta mudanças de auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(memberFromEmail(session?.user?.email));
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(memberFromEmail(session?.user?.email));
    });

    return () => subscription.unsubscribe();
  }, [memberFromEmail]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  const handleViewChange = (view: string) => {
    setIsTransitioning(true);
    setSidebarOpen(false);
    setTimeout(() => {
      setActiveView(view);
      setIsTransitioning(false);
    }, 150);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleChangeViewEvent = (e: any) => handleViewChange(e.detail);
    const handleOpenNewTask = (e: any) => { setNewTaskInitialDate(undefined); setNewTaskInitialGroup(undefined); setNewTaskInitialStatus(e?.detail?.initialStatus); setShowNewTaskModal(true); };
    const handleOpenNewTaskWithDate = (e: any) => { setNewTaskInitialDate(e.detail); setNewTaskInitialGroup(undefined); setShowNewTaskModal(true); };
    const handleOpenNewTaskWithGroup = (e: any) => { setNewTaskInitialGroup(e.detail); setNewTaskInitialDate(undefined); setShowNewTaskModal(true); };
    const handleOpenNewWorkspace = () => setShowNewWorkspaceModal(true);
    const handleOpenSearch = () => setShowSearchModal(true);
    const handleOpenTaskDetail = (e: any) => setShowTaskDetail(e.detail);
    const handleShowToast = (e: any) => {
      const { type, message } = e.detail;
      if (type === 'success') toast.success(message);
      else if (type === 'error') toast.error(message);
      else toast(message);
    };
    const handleThemeChange = (e: any) => setTheme(e.detail);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearchModal(true); }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowNewTaskModal(false);
        setShowNewWorkspaceModal(false);
        setShowTaskDetail(null);
      }
    };

    window.addEventListener('changeView', handleChangeViewEvent);
    window.addEventListener('openNewTask', handleOpenNewTask);
    window.addEventListener('openNewTaskWithDate', handleOpenNewTaskWithDate);
    window.addEventListener('openNewTaskWithGroup', handleOpenNewTaskWithGroup);
    window.addEventListener('openNewWorkspace', handleOpenNewWorkspace);
    window.addEventListener('openSearch', handleOpenSearch);
    window.addEventListener('openTaskDetail', handleOpenTaskDetail);
    window.addEventListener('showToast', handleShowToast);
    window.addEventListener('changeTheme', handleThemeChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('changeView', handleChangeViewEvent);
      window.removeEventListener('openNewTask', handleOpenNewTask);
      window.removeEventListener('openNewTaskWithDate', handleOpenNewTaskWithDate);
      window.removeEventListener('openNewTaskWithGroup', handleOpenNewTaskWithGroup);
      window.removeEventListener('openNewWorkspace', handleOpenNewWorkspace);
      window.removeEventListener('openSearch', handleOpenSearch);
      window.removeEventListener('openTaskDetail', handleOpenTaskDetail);
      window.removeEventListener('showToast', handleShowToast);
      window.removeEventListener('changeTheme', handleThemeChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1E3A5F]">
        <div className="flex flex-col items-center gap-3 text-white/70">
          <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  const getViewTitle = () => {
    if (activeView.startsWith('workspace-')) {
      const workspaceId = activeView.replace('workspace-', '');
      const workspace = workspaces.find(w => w.id === workspaceId);
      return workspace?.name || 'Workspace';
    }
    switch (activeView) {
      case 'dashboard': return 'Início';
      case 'kanban': return 'Board (Kanban)';
      case 'calendar': return 'Calendário';
      case 'gantt': return 'Gráfico de Gantt';
      case 'reports': return 'Relatórios';
      case 'my-tasks': return 'Minhas Tarefas';
      case 'notifications': return 'Notificações';
      case 'settings': return 'Configurações';
      case 'operacional': return 'Operacional';
      case 'desenvolvimento': return 'Desenvolvimento';
      case 'financeiro': return 'Financeiro';
      case 'schedule': return 'Cronograma';
      default: return activeView.charAt(0).toUpperCase() + activeView.slice(1);
    }
  };

  const renderView = () => {
    if (activeView.startsWith('workspace-')) {
      const workspaceId = activeView.replace('workspace-', '');
      const workspace = workspaces.find(w => w.id === workspaceId);
      return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-background">
          <div className="p-4 md:p-8 pb-12 min-h-full">
            <div
              className="p-6 md:p-8 rounded-2xl mb-6 text-white relative overflow-hidden"
              style={{ backgroundColor: workspace?.color || '#4A9EDB' }}
            >
              <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{workspace?.name || 'Workspace'}</h1>
                <p className="text-white/90">{workspace?.description || 'Workspace personalizado'}</p>
              </div>
            </div>
            <div className="bg-card text-card-foreground rounded-xl p-8 md:p-12 text-center shadow-sm border border-border">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Comece a organizar suas tarefas</h2>
              <p className="text-muted-foreground mb-6">Este workspace está pronto! Adicione tarefas para começar.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openNewTask'))}
                className="px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transform hover:scale-105 transition-all"
                style={{ backgroundColor: workspace?.color || '#4A9EDB' }}
              >
                + Criar Primeira Tarefa
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard': return <Dashboard currentUser={currentUser} />;
      case 'operacional': return <TaskTableReadOnly filterGroup="Operacional" />;
      case 'desenvolvimento': return <TaskTableReadOnly filterGroup="Desenvolvimento" />;
      case 'financeiro': return <TaskTableReadOnly filterGroup="Financeiro" />;
      case 'schedule': return <TaskTable />;
      case 'kanban': return <KanbanBoard />;
      case 'calendar': return <CalendarView />;
      case 'my-tasks': return <MyTasks currentUser={currentUser} />;
      case 'notifications': return <NotificationsPanel />;
      case 'settings': return <SettingsScreen currentUser={currentUser} currentTheme={theme} />;
      case 'reports': return <ReportsView />;
      case 'gantt': return <GanttView />;
      default: return <Dashboard currentUser={currentUser} />;
    }
  };

  return (
    <NotificationsProvider currentUser={currentUser}>
    <div className="h-screen flex overflow-hidden bg-background text-foreground">
      <Sidebar
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        customWorkspaces={workspaces}
        onDeleteWorkspace={async (id) => {
          await deleteWorkspace(id);
          if (activeView === `workspace-${id}`) handleViewChange('dashboard');
          toast.success('Workspace excluído com sucesso!');
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => {
          const next = !prev;
          localStorage.setItem('sidebarCollapsed', String(next));
          return next;
        })}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        <Header
          title={getViewTitle()}
          currentUser={currentUser}
          notificationCount={0}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
        />
        <div className={`flex-1 h-full overflow-hidden transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          {renderView()}
        </div>
      </div>

      {showNewTaskModal && (
        <NewTaskModal
          onClose={() => { setShowNewTaskModal(false); setNewTaskInitialDate(undefined); setNewTaskInitialGroup(undefined); setNewTaskInitialStatus(undefined); }}
          onSave={(task) => {
            toast.success('Tarefa criada com sucesso!', {
              description: `"${task.title}" foi adicionada ao grupo ${task.group}`,
              duration: 3000,
            });
            setShowNewTaskModal(false);
            setNewTaskInitialDate(undefined);
            setNewTaskInitialGroup(undefined);
            setNewTaskInitialStatus(undefined);
          }}
          initialDate={newTaskInitialDate}
          initialGroup={newTaskInitialGroup}
          initialStatus={newTaskInitialStatus}
        />
      )}

      {showNewWorkspaceModal && (
        <NewWorkspaceModal
          onClose={() => setShowNewWorkspaceModal(false)}
          onSave={async (workspace) => {
            const saved = await addWorkspace({ ...workspace, created_by: currentUser });
            if (saved) {
              toast.success('Workspace criado com sucesso!', {
                description: `"${workspace.name}" está pronto para uso`,
                duration: 3000,
              });
            } else {
              toast.error('Erro ao criar workspace. Tente novamente.');
            }
            setShowNewWorkspaceModal(false);
          }}
        />
      )}

      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} />}

      {showTaskDetail && (
        <TaskDetailPanel
          task={showTaskDetail}
          onClose={() => setShowTaskDetail(null)}
          onDelete={() => { setShowTaskDetail(null); toast.success('Tarefa excluída com sucesso!'); }}
        />
      )}

      <Toaster position="top-right" richColors />
    </div>
    </NotificationsProvider>
  );
}

// ---------------------------------------------------------------
// Root — envolve tudo com o provider
// ---------------------------------------------------------------

export default function App() {
  return (
    <TasksProvider>
      <AppInner />
    </TasksProvider>
  );
}
