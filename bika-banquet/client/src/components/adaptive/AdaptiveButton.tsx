'use client';

import React from 'react';

interface AdaptiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Retained for call-site compatibility; ignored by the web build. */
  expand?: 'block' | 'full';
  fill?: 'clear' | 'outline' | 'solid';
}

/**
 * Standard web button. (Previously switched to IonButton on native; the native
 * apps are WebViews of this same site, so the web button is used everywhere.)
 */
export function AdaptiveButton({
  children,
  className = '',
  variant = 'primary',
  expand: _expand,
  fill: _fill,
  ...props
}: AdaptiveButtonProps) {
  return (
    <button {...props} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
}
