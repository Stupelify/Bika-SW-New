import type { Page } from '@playwright/test';

export type SimulatedPlatform = 'ios' | 'android';

/** Simulates CapacitorNativeShell document classes in the browser. */
export async function applyCapacitorNative(
  page: Page,
  platform: SimulatedPlatform,
): Promise<void> {
  await page.evaluate((p) => {
    const root = document.documentElement;
    root.classList.add('capacitor-native');
    root.classList.remove('capacitor-ios', 'capacitor-android');
    root.classList.add(p === 'ios' ? 'capacitor-ios' : 'capacitor-android');
    root.style.setProperty('--safe-top', '47px');
    root.style.setProperty('--safe-bottom', '34px');
  }, platform);
}

export async function readBodyOverflowY(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).overflowY);
}

export async function readMainOverflow(page: Page): Promise<string> {
  return page.evaluate(() => {
    const main = document.querySelector('.dashboard-main');
    return main ? getComputedStyle(main).overflowY : '';
  });
}
