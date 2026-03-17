'use client';

import { useEffect } from 'react';
import { setupIonicReact } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

// This provider explicitly avoids importing Ionic CSS if we are on the web,
// preserving the exact web styling untouched.
export default function IonicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Only initialize Ionic styling/scripts if running inside native Capacitor
    if (Capacitor.isNativePlatform()) {
      setupIonicReact({
        mode: Capacitor.getPlatform() === 'ios' ? 'ios' : 'md',
      });

      // Dynamically load Ionic CSS only on mobile to avoid breaking web
      const loadCSS = async () => {
        await import('@ionic/react/css/core.css');
        await import('@ionic/react/css/normalize.css');
        await import('@ionic/react/css/structure.css');
        await import('@ionic/react/css/typography.css');
        await import('@ionic/react/css/padding.css');
        await import('@ionic/react/css/float-elements.css');
        await import('@ionic/react/css/text-alignment.css');
        await import('@ionic/react/css/text-transformation.css');
        await import('@ionic/react/css/flex-utils.css');
        await import('@ionic/react/css/display.css');
      };

      loadCSS();
    }
  }, []);

  return <>{children}</>;
}
