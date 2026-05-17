import { ReactNode, useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarContextType {
  sidebarOpen: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within MainLayout');
  }
  return context;
}

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarOpen?: boolean;
}

export function MainLayout({ children, sidebar }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // localStorage에서 사이드바 상태 복원
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 사이드바 상태 변경 시 localStorage에 저장
  const handleToggleSidebar = () => {
    setSidebarOpen((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen }}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        {sidebar && (
          <aside
            className={cn(
              'bg-sidebar text-sidebar-foreground transition-all duration-300 overflow-hidden flex flex-col',
              sidebarOpen ? 'fixed inset-y-0 left-0 z-40 w-64 md:relative md:flex-shrink-0' : 'w-20 flex-shrink-0'
            )}
          >
            {/* Sidebar Header with Toggle */}
            <div className={cn(
              'flex items-center justify-between border-b border-sidebar-border transition-all duration-300',
              sidebarOpen ? 'p-4' : 'p-2'
            )}>
              {sidebarOpen && (
                <h1 className="text-lg font-bold text-sidebar-foreground truncate">
                  자재 샘플북
                </h1>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSidebar}
                className={cn('p-0 flex-shrink-0', sidebarOpen ? 'h-8 w-8' : 'h-10 w-10')}
                title={sidebarOpen ? '메뉴 닫기' : '메뉴 열기'}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Overlay for mobile */}
        {sidebar && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-auto min-w-0 md:min-w-0">
          {/* Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarContent({ children, className }: { children: ReactNode; className?: string }) {
  const { sidebarOpen } = useSidebar();

  return (
    <div
      className={cn(
        'flex flex-col h-full gap-6 transition-all duration-300',
        sidebarOpen ? 'p-6' : 'p-2'
      )}
    >
      {children}
    </div>
  );
}

export function SidebarHeader({ children, className }: { children: ReactNode; className?: string }) {
  const { sidebarOpen } = useSidebar();

  if (!sidebarOpen) {
    return null;
  }

  return (
    <div className={cn('border-b border-sidebar-border pb-4', className)}>
      {children}
    </div>
  );
}

export function SidebarNav({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav className={cn('flex flex-col gap-2 flex-1 overflow-y-auto', className)}>
      {children}
    </nav>
  );
}

export function SidebarNavItem({
  children,
  active = false,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-3 rounded-lg text-left font-medium transition-all duration-200 text-sm',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      {children}
    </button>
  );
}
