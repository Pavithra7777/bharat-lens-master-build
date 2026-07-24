import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  params: {},
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [params, setParams] = useState<Record<string, string>>({});

  // Initialize from current hash
  useEffect(() => {
    const hash = window.location.hash.slice(1) || '/';
    if (hash) {
      setCurrentPath(hash);
      parseParams(hash);
    }
  }, []);
  
  // Parse params from path (e.g., /schemes/:id -> /schemes/abc123)
  function parseParams(path: string) {
    const paramsMap: Record<string, string> = {};
    const segments = path.split('/');
    // Store the last segment as 'id' if it looks like a UUID
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1] || '';
      if (lastSegment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        paramsMap['id'] = lastSegment;
      }
    }
    setParams(paramsMap);
  }
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      setCurrentPath(hash);
      parseParams(hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    // Force update immediately for better responsiveness
    setCurrentPath(path);
    parseParams(path);
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, params }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const { currentPath } = useContext(RouterContext);
  return { currentPath };
}

export function useNavigate() {
  const { params } = useContext(RouterContext);
  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);
  return navigate;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const { params } = useContext(RouterContext);
  return params as T;
}

export function Link({ to, children, className, onClick }: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = to;
    onClick?.();
  };

  return (
    <a href={`#${to}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
