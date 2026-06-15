import { ReactNode, useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

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
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleSidebar = () => {
    setSidebarOpen((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen }}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <aside
            className={cn(
              'bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 relative z-40',
              sidebarOpen
                ? 'fixed inset-y-0 left-0 z-40 w-60 md:relative md:w-60'
                : 'w-14 md:w-14'
            )}
          >
            {/* Sidebar Header */}
            <div className={cn(
              'flex items-center border-b border-sidebar-border h-14 flex-shrink-0',
              sidebarOpen ? 'px-4 justify-between' : 'px-0 justify-center'
            )}>
              {sidebarOpen && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-sidebar-foreground tracking-tight truncate">
                    자재 샘플북
                  </span>
                </div>
              )}
              <button
                onClick={handleToggleSidebar}
                className={cn(
                  'flex items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground flex-shrink-0',
                  sidebarOpen ? 'w-7 h-7' : 'w-10 h-10'
                )}
                title={sidebarOpen ? '메뉴 닫기' : '메뉴 열기'}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
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
            className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-auto scrollbar-thin">
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
        'flex flex-col h-full transition-all duration-300',
        sidebarOpen ? 'px-3 py-3' : 'px-1 py-3',
        className
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
    <div className={cn('border-b border-sidebar-border pb-3 mb-1', className)}>
      {children}
    </div>
  );
}

export function SidebarNav({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav className={cn('flex flex-col gap-0.5 flex-1 overflow-y-auto scrollbar-hide', className)}>
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
        'w-full px-3 py-2.5 rounded-lg text-left font-medium transition-all duration-150 text-sm sidebar-item',
        active
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}
