import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authState = path.join(__dirname, '..', '.auth', 'admin.json');

export const test = base.extend({
  storageState: async ({}, use) => {
    if (fs.existsSync(authState)) {
      await use(authState);
    } else {
      await use(undefined);
    }
  },
});

export { expect } from '@playwright/test';

export const authStatePath = authState;
export const hasAuthState = () => fs.existsSync(authState);
