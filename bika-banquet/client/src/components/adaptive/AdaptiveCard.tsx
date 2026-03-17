'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/react';

interface AdaptiveCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  noPadding?: boolean;
}

export function AdaptiveCard({
  children,
  className = '',
  header,
  title,
  subtitle,
  noPadding = false,
}: AdaptiveCardProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsNative(Capacitor.isNativePlatform());
    }
  }, []);

  if (isNative) {
    return (
      <IonCard className={className}>
        {(header || title || subtitle) && (
          <IonCardHeader>
            {header}
            {title && <IonCardTitle>{title}</IonCardTitle>}
            {subtitle && <IonCardSubtitle>{subtitle}</IonCardSubtitle>}
          </IonCardHeader>
        )}
        <IonCardContent className={noPadding ? 'ion-no-padding' : ''}>
          {children}
        </IonCardContent>
      </IonCard>
    );
  }

  // Fallback to exactly the previous standard web div rendering 
  return (
    <div className={`card ${className}`}>
      {(header || title || subtitle) && (
        <div className="panel-header">
          {header}
          <div>
            {title && <h3 className="panel-title">{title}</h3>}
            {subtitle && <p className="panel-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className={noPadding ? '' : 'panel-body'}>
        {children}
      </div>
    </div>
  );
}
