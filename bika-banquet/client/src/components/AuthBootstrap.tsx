'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Restores the session from localStorage once on app load, before any route
 * decides to send the user to /login.
 */
export default function AuthBootstrap() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  return null;
}
