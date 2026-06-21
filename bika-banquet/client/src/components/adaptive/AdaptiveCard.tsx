'use client';

import React from 'react';

interface AdaptiveCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  noPadding?: boolean;
}

/**
 * Standard web card. (Previously switched to Ionic on native; the native apps
 * are WebViews of this same site, so the web rendering is used everywhere.)
 */
export function AdaptiveCard({
  children,
  className = '',
  header,
  title,
  subtitle,
  noPadding = false,
}: AdaptiveCardProps) {
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
      <div className={noPadding ? '' : 'panel-body'}>{children}</div>
    </div>
  );
}
