'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { getDefaultDashboardRoute } from '@/lib/routeAccess';

export default function LoginPage() {
  const router = useRouter();
  const { login, loadUser, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      await loadUser();
      const loggedInUser = useAuthStore.getState().user;
      const nextRoute = getDefaultDashboardRoute(loggedInUser?.permissions);

      if (!nextRoute) {
        await useAuthStore.getState().logout();
        toast.error('No module access is assigned to this user. Contact admin.');
        return;
      }

      toast.success('Login successful!');
      router.push(nextRoute);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (error?.response?.status === 429
          ? 'Too many login attempts. Please wait and try again.'
          : null) ||
        'Login failed';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:py-14">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/70 via-white to-accent-100/60 pointer-events-none"></div>
          <div className="relative p-2 md:p-4">
            <p className="inline-flex rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-semibold text-primary-700">
              Hospitality Operations Suite
            </p>
            <h1 className="mt-5 text-4xl md:text-5xl leading-tight font-display text-gray-900 text-balance">
              Bika Banquet
            </h1>
            <p className="mt-3 text-base text-gray-600 max-w-2xl">
              Run enquiries, bookings, menus, payments and reporting from one modern command center.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white/90 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Workflows</p>
                <p className="text-xl font-display text-gray-900 mt-2">9 modules</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/90 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Real-time</p>
                <p className="text-xl font-display text-gray-900 mt-2">Live metrics</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/90 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Team Access</p>
                <p className="text-xl font-display text-gray-900 mt-2">RBAC ready</p>
              </div>
            </div>
          </div>
        </section>

        <div className="lg:col-span-2 card">
          <h2 className="text-2xl font-display text-gray-900">Sign In</h2>
          <p className="text-sm text-gray-600 mt-1">Access your operations dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="admin@bikabanquet.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Default credentials
            </p>
            <p className="font-mono text-sm text-gray-900 mt-2">
              admin@bikabanquet.com / admin123
            </p>
            <p className="text-xs text-gray-500 mt-2">
              If using an older migrated DB, legacy admin credentials may differ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
