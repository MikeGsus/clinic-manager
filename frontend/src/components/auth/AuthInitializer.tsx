import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { ApiResponse, AuthData } from '@/types';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { user, token, setAuth, logout } = useAuthStore();

  useEffect(() => {
    // If we have a user persisted but no in-memory token, try to refresh
    if (user && !token) {
      api
        .post<ApiResponse<AuthData>>('/auth/refresh')
        .then((res) => {
          if (res.data.data) {
            setAuth(res.data.data.token, res.data.data.user);
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <FullScreenSpinner />;
  return <>{children}</>;
}
