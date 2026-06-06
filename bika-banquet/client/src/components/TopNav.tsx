'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, Search, Sun } from 'lucide-react';
import Avatar from './Avatar';

export interface TopNavItem {
  name: string;
  href: string;
  badge?: number | null;
}

interface TopNavProps {
  items: TopNavItem[];
  pathname: string;
  onSearchClick: () => void;
  userName?: string;
}

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('theme');
    const osPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = stored === 'dark' || stored === 'light' ? stored : osPref;
    setTheme(initial);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', next);
      document.documentElement.dataset.theme = next;
    }
  };
  return { theme, toggle };
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
}

export default function TopNav({ items, pathname, onSearchClick, userName }: TopNavProps) {
  const clock = useClock();
  const { theme, toggle } = useTheme();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const p =
      (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.platform ??
      '';
    setIsMac(/mac/i.test(p));
  }, []);

  return (
    <header className="top-nav" aria-label="Main navigation">
      <div className="top-nav-mark">
        <span className="top-nav-dot" aria-hidden="true" />
        <span className="top-nav-brand">BIKA OPS</span>
      </div>
      <div className="top-nav-divider" aria-hidden="true" />

      <nav className="top-nav-links" aria-label="Site navigation">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`top-nav-link${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.name}
              {item.badge != null && item.badge > 0 && (
                <span className={`top-nav-badge${active ? ' active' : ''}`} aria-label={`${item.badge} pending`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="top-nav-right">
        <button
          type="button"
          className="top-nav-search"
          aria-label="Quick search"
          onClick={onSearchClick}
        >
          <Search style={{ width: 13, height: 13 }} aria-hidden="true" />
          <span>Search</span>
          <kbd className="kbd" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>

        {clock && (
          <div className="top-nav-clock" aria-label={`Current time: ${clock} IST`}>
            <span className="top-nav-time">{clock}</span>
            <span className="top-nav-tz">IST</span>
          </div>
        )}

        <button
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggle}
          className="header-icon-btn header-icon-hover"
        >
          {theme === 'dark' ? (
            <Sun width={16} height={16} aria-hidden="true" />
          ) : (
            <Moon width={16} height={16} aria-hidden="true" />
          )}
        </button>

        <Avatar name={userName} size="sm" />
      </div>
    </header>
  );
}
