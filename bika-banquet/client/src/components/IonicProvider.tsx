'use client';

import { useEffect, useState } from 'react';
import { setupIonicReact } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

export default function IonicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setIsNative(true);
      setupIonicReact({
        mode: Capacitor.getPlatform() === 'ios' ? 'ios' : 'md',
      });

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
          ion-app {
            pointer-events: none !important;
          }
        `}} />
      )}
      {children}
    </>
  );
}
