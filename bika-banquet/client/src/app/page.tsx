'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getDefaultDashboardRoute } from '@/lib/routeAccess';
import { PageSkeleton } from '@/components/Skeletons';

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
      <div className="w-full max-w-md px-6">
        <PageSkeleton />
      </div>
    </div>
  );
}
