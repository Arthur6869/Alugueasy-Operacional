import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import { TeamAvatar } from './TeamAvatar';

interface HeaderProps {
  title: string;
  breadcrumb?: string;
  currentUser: 'Arthur' | 'Yasmim' | 'Alexandre' | 'Nikolas';
  notificationCount?: number;
  onMenuToggle?: () => void;
}

export function Header({ title, breadcrumb = 'EasyTask', currentUser, notificationCount = 0, onMenuToggle }: HeaderProps) {
  return (
    <div className="h-16 bg-white dark:bg-card border-b border-[#E5E7EB] dark:border-border flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger - apenas mobile */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-all"
          aria-label="Abrir menu"
        >
          <Menu size={20} className="text-gray-600 dark:text-foreground" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-bold text-[#111827] dark:text-foreground truncate">{title}</h1>
          <p className="text-xs md:text-sm text-[#6B7280] dark:text-muted-foreground hidden sm:block">{breadcrumb} / {title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openSearch'))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-all transform hover:scale-110"
          aria-label="Buscar"
        >
          <Search size={20} className="text-gray-600 dark:text-foreground" />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'notifications' }))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-all relative transform hover:scale-110"
          aria-label="Notificações"
        >
          <Bell size={20} className="text-gray-600 dark:text-foreground" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
          )}
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'settings' }))}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-all transform hover:scale-105"
          aria-label="Configurações"
        >
          <TeamAvatar member={currentUser} size="sm" />
          <ChevronDown size={16} className="text-gray-600 dark:text-foreground hidden sm:block" />
        </button>
      </div>
    </div>
  );
}
