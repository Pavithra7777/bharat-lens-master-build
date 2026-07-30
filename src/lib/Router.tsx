import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  params: Record<string, string>;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  params: {},
  navigate: () => {},
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [params, setParams] = useState<Record<string, string>>({});

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

  // Initialize from current hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1) || '/';
    setCurrentPath(hash || '/');
    parseParams(hash || '/');
  }, []);
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      setCurrentPath(hash || '/');
      parseParams(hash || '/');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((path: string) => {
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    window.location.hash = cleanPath;
    setCurrentPath(cleanPath);
    parseParams(cleanPath);
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  return { 
    currentPath: context.currentPath, 
    params: context.params,
    navigate: context.navigate 
  };
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
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
  const { navigate } = useContext(RouterContext);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanPath = to.startsWith('/') ? to : '/' + to;
    navigate(cleanPath);
    onClick?.();
  };

  return (
    <a href={`#${to}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
