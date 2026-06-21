'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Native WebView scroll fixes for the Capacitor shell. (Ionic was removed — the
 * native apps render this same responsive web UI, so no Ionic runtime/CSS is
 * loaded. The component name is kept to avoid churn in app/layout.tsx.)
 */
export default function IonicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setIsNative(true);
    }
  }, []);

  return (
    <>
      {isNative && (
        <style dangerouslySetInnerHTML={{ __html: `
          html.capacitor-native body {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            min-height: 100% !important;
            height: auto !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: manipulation !important;
          }
          html.capacitor-native:has(.dashboard-root),
          html.capacitor-native:has(.dashboard-root) body {
            overflow: hidden !important;
            height: 100% !important;
          }
          html.capacitor-native:has(.dashboard-root) .dashboard-main {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior-y: contain;
          }
        `}} />
      )}
      {children}
    </>
  );
}
