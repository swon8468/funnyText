import React, { useState, useEffect } from 'react';
import { CreatorPage } from './pages/CreatorPage';
import { ViewerPage } from './pages/ViewerPage';

type RouteState =
  | { page: 'creator' }
  | { page: 'viewer'; token: string };

function parseCurrentRoute(): RouteState {
  if (typeof window === 'undefined') return { page: 'creator' };

  // 1. Check URL Hash (e.g. #/v/56b900... or #/p/56b900... or #56b900...)
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('v/')) {
    return { page: 'viewer', token: hash.substring(2) };
  }
  if (hash.startsWith('p/')) {
    return { page: 'viewer', token: hash.substring(2) };
  }
  // If hash is raw hex/base64 token
  if (hash.length >= 8 && !hash.includes('/') && !hash.includes('create')) {
    return { page: 'viewer', token: hash };
  }

  // 2. Check Pathname (e.g. /v/56b900... or /p/56b900...)
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/(?:v|p)\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return { page: 'viewer', token: match[1] };
  }

  return { page: 'creator' };
}

export const App: React.FC = () => {
  const [route, setRoute] = useState<RouteState>(parseCurrentRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseCurrentRoute());
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (route.page === 'viewer') {
    return <ViewerPage token={route.token} />;
  }

  return <CreatorPage />;
};

export default App;
