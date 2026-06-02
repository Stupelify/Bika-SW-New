import { Capacitor } from '@capacitor/core';

export type HapticImpact = 'light' | 'medium' | 'heavy';

/**
 * Fire a short impact haptic. No-op on the web and silently ignored if the
 * plugin/hardware is unavailable, so it's safe to call from anywhere.
 */
export async function haptic(style: HapticImpact = 'light'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map: Record<HapticImpact, (typeof ImpactStyle)[keyof typeof ImpactStyle]> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch {
    /* haptics unavailable */
  }
}

/** Selection tick — the subtle feedback iOS uses when moving between tabs. */
export async function hapticSelection(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionChanged();
  } catch {
    /* haptics unavailable */
  }
}
