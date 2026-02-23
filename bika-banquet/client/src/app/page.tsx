'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getDefaultDashboardRoute } from '@/lib/routeAccess';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, loadUser } = useAuthStore();

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        const nextRoute = getDefaultDashboardRoute(user?.permissions);
        router.push(nextRoute || '/login');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router, user?.permissions]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-accent-600">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}
