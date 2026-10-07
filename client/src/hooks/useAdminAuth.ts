import { useCallback, useEffect, useState } from 'react';

interface AdminIdentity { id: string; email: string; role: 'admin' }

export function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AdminIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('관리자 로그인 상태를 확인하지 못했습니다.');
      const payload = await response.json() as { authenticated: boolean; user?: AdminIdentity };
      setUser(payload.authenticated ? payload.user ?? null : null);
      setError(null);
    } catch (caught) {
      setUser(null);
      setError(caught instanceof Error ? caught.message : '관리자 로그인 상태를 확인하지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const signIn = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`);
  }, []);
  const signOut = useCallback(async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    if (!response.ok) throw new Error('로그아웃하지 못했습니다.');
    setUser(null);
  }, []);
  return { isLoading, isAdmin: user?.role === 'admin', user, error, signIn, signOut, refresh };
}

