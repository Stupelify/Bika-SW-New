'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { getDefaultDashboardRoute } from '@/lib/routeAccess';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, isAuthReady, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Session restore is not a sign-in attempt — never show "Signing in..." on page load.
    useAuthStore.setState({ isLoading: false });
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;
    const nextRoute = getDefaultDashboardRoute(user?.permissions);
    if (nextRoute) {
      router.replace(nextRoute);
    }
  }, [isAuthReady, isAuthenticated, user?.permissions, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
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
        (error?.code === 'ECONNABORTED'
          ? 'Server did not respond in time. Check that the API is running.'
          : null) ||
        (error?.message === 'Network Error'
          ? 'Cannot reach the server. Check your connection and API URL.'
          : null) ||
        'Login failed';
      toast.error(message);
    } finally {
      useAuthStore.setState({ isLoading: false });
    }
  };

  return (
    <div className="native-auth-page min-h-[100dvh] min-h-screen px-4 pb-[calc(2rem+var(--safe-bottom))] md:pb-14 pt-[calc(var(--safe-top)+2rem)] md:pt-[calc(var(--safe-top)+3.5rem)] flex items-center justify-center">
      <div className="w-full max-w-md card">
        <h1 className="text-xl font-semibold text-[var(--text-1)]">Sign In</h1>

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
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
      </div>
    </div>
  );
}
