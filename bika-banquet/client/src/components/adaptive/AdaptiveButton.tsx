'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonButton } from '@ionic/react';

interface AdaptiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  expand?: 'block' | 'full';
  fill?: 'clear' | 'outline' | 'solid';
}

export function AdaptiveButton({
  children,
  className = '',
  variant = 'primary',
  expand,
  fill,
  ...props
}: AdaptiveButtonProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsNative(Capacitor.isNativePlatform());
    }
  }, []);

  if (isNative) {
    let color: string;
    switch (variant) {
      case 'primary':
        color = 'primary';
        break;
      case 'danger':
        color = 'danger';
        break;
      case 'secondary':
      default:
        color = 'medium';
    }

    return (
      <IonButton
        className={className}
        color={color}
        expand={expand}
        fill={fill}
        disabled={props.disabled}
        onClick={props.onClick as any}
        type={props.type as any}
      >
        {children}
      </IonButton>
    );
  }

  // Web fallback
  return (
    <button
      {...props}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}
