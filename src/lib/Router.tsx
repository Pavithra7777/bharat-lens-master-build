import { createContext, useContext, useState, useEffect, type ReactNode, type ComponentType } from 'react';

// Simple hash-based router

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1) || '/';
      return hash;
    }
    return '/';
  });
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.slice(1) || '/';
      setCurrentPath(hash);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function navigate(path: string) {
    window.location.hash = path;
  }

  return (
    <RouterContext.Provider value={{ currentPath, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return context;
}

export function Link({ to, children, className, onClick }: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (onClick) onClick();
    window.location.hash = to;
  }

  return (
    <a href={`#${to}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
